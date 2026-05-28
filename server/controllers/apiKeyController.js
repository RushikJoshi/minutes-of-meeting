const crypto = require("crypto");
const ApiKey = require("../models/ApiKey");
const Membership = require("../models/Membership");

/**
 * Generate a new API Key for the user or workspace
 */
exports.createApiKey = async (req, res) => {
  try {
    const { name, workspaceId } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });

    // Validate workspace if provided
    if (workspaceId) {
      const membership = await Membership.findOne({ userId: req.user._id, workspaceId });
      if (!membership) {
        return res.status(403).json({ success: false, message: "Not a member of this workspace" });
      }
    }

    // Generate Raw Key (e.g. mom_live_xYz123...)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const apiKeyRaw = `mom_live_${rawToken}`;

    // Hash the Key to store in DB
    const keyHash = crypto.createHash("sha256").update(apiKeyRaw).digest("hex");

    const apiKeyDoc = await ApiKey.create({
      name,
      keyHash,
      user: req.user._id,
      workspace: workspaceId || null
    });

    res.status(201).json({
      success: true,
      message: "API Key generated successfully. Save it now, it won't be shown again.",
      data: {
        id: apiKeyDoc._id,
        name: apiKeyDoc.name,
        key: apiKeyRaw, // ONLY SHOWN ONCE!
        createdAt: apiKeyDoc.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to generate API Key" });
  }
};

/**
 * List all API Keys for the user
 */
exports.listApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ user: req.user._id })
      .select("-keyHash")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: keys });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to list API Keys" });
  }
};

/**
 * Revoke/Delete an API Key
 */
exports.revokeApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const key = await ApiKey.findOneAndDelete({ _id: id, user: req.user._id });
    
    if (!key) {
      return res.status(404).json({ success: false, message: "API Key not found" });
    }

    res.json({ success: true, message: "API Key revoked successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to revoke API Key" });
  }
};
