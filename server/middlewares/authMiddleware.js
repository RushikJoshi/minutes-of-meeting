const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    // 1. Check for API Key (Third-Party Integration)
    const apiKey = req.headers["x-api-key"];
    if (apiKey) {
      const crypto = require("crypto");
      const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
      
      const ApiKey = require("../models/ApiKey");
      const keyDoc = await ApiKey.findOne({ keyHash, isActive: true }).populate("user", "-passwordHash");
      
      if (!keyDoc || !keyDoc.user) {
        const err = new Error("Invalid or inactive API Key");
        err.statusCode = 401;
        throw err;
      }

      // Update last used timestamp
      keyDoc.lastUsedAt = new Date();
      await keyDoc.save();

      req.user = keyDoc.user;
      
      // If the API key is restricted to a workspace, inject it into the request
      if (keyDoc.workspace) {
        req.apiKeyWorkspace = keyDoc.workspace;
      }
      return next();
    }

    // 2. Check for Standard JWT (Web Client)
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user) {
      const err = new Error("Unauthorized");
      err.statusCode = 401;
      throw err;
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth };

