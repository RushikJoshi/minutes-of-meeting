const googleCalendarService = require("../services/googleCalendarService");
const asyncHandler = require("../utils/asyncHandler");
const IntegrationToken = require("../models/IntegrationToken");
const jwt = require("jsonwebtoken");

const googleStatus = asyncHandler(async (req, res) => {
  const doc = await IntegrationToken.findOne({
    provider: "google",
    workspaceId: req.workspace._id,
    userId: req.user._id,
  });
  res.json({
    connected: Boolean(doc),
    connectedAt: doc?.connectedAt || null,
    accountEmail: doc?.accountEmail || "",
    lastSyncedAt: doc?.lastSyncedAt || null,
    autoSync: doc?.autoSync || false,
  });
});

const googleConnect = asyncHandler(async (req, res) => {
  const state = jwt.sign(
    { userId: String(req.user._id), workspaceId: String(req.workspace._id) },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );
  const url = googleCalendarService.getAuthUrl(state);
  res.json({ url });
});

const googleCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) {
    res.status(400);
    throw new Error("Missing code/state");
  }

  const decoded = jwt.verify(state, process.env.JWT_SECRET);
  await googleCalendarService.handleOAuthCallback({
    code,
    userId: decoded.userId,
    workspaceId: decoded.workspaceId,
  });

  const clientBase = process.env.PUBLIC_CLIENT_BASE_URL || "http://localhost:5173";
  res.redirect(`${clientBase.replace(/[\\/]+$/, "")}/settings?google=connected`);
});

const googleDisconnect = asyncHandler(async (req, res) => {
  await IntegrationToken.deleteOne({
    provider: "google",
    workspaceId: req.workspace._id,
    userId: req.user._id,
  });
  res.json({ ok: true });
});

const googleSync = asyncHandler(async (req, res) => {
  const doc = await IntegrationToken.findOne({
    provider: "google",
    workspaceId: req.workspace._id,
    userId: req.user._id,
  });

  if (!doc) {
    res.status(400);
    throw new Error("Google integration not connected");
  }

  // Simulate sync by updating lastSyncedAt
  doc.lastSyncedAt = new Date();
  await doc.save();
  
  res.json({ ok: true, lastSyncedAt: doc.lastSyncedAt });
});

const googlePreferences = asyncHandler(async (req, res) => {
  const { autoSync } = req.body;
  const doc = await IntegrationToken.findOne({
    provider: "google",
    workspaceId: req.workspace._id,
    userId: req.user._id,
  });

  if (!doc) {
    res.status(400);
    throw new Error("Google integration not connected");
  }

  if (typeof autoSync === "boolean") {
    doc.autoSync = autoSync;
    await doc.save();
  }
  
  res.json({ ok: true, autoSync: doc.autoSync });
});

module.exports = {
  googleStatus,
  googleConnect,
  googleCallback,
  googleDisconnect,
  googleSync,
  googlePreferences,
};
