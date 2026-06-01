const asyncHandler = require("../utils/asyncHandler");
const IntegrationToken = require("../models/IntegrationToken");
const {
  getConnectUrl,
  handleOAuthCallback,
  SCOPES,
  getMicrosoftRuntimeValues,
} = require("../services/microsoftGraphService");

const microsoftStatus = asyncHandler(async (req, res) => {
  const doc = await IntegrationToken.findOne({
    provider: "microsoft",
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

const microsoftConnect = asyncHandler(async (req, res) => {
  const { url } = await getConnectUrl({ userId: req.user._id, workspaceId: req.workspace._id, email: req.user.email });
  res.json({ url });
});

const microsoftCallback = asyncHandler(async (req, res) => {
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  console.log("[Microsoft OAuth] Callback request", {
    method: req.method,
    originalUrl: req.originalUrl,
    path: req.path,
    query: req.query,
    runtime: getMicrosoftRuntimeValues(),
  });
  console.log("CODE:", code);
  console.log("STATE:", state);
  console.log("REDIRECT:", getMicrosoftRuntimeValues().redirectUri);
  console.log("SCOPES:", SCOPES);

  if (req.query.error || req.query.error_description) {
    console.error("[Microsoft OAuth] Callback returned an OAuth error", {
      error: req.query.error,
      errorDescription: req.query.error_description,
      errorUri: req.query.error_uri,
      correlationId: req.query.correlation_id,
      traceId: req.query.trace_id,
    });
  }

  if (!code || !state) {
    res.status(400);
    throw new Error("Missing code/state");
  }

  await handleOAuthCallback({ code, state });

  const clientBase = process.env.PUBLIC_CLIENT_BASE_URL || "http://localhost:5173";
  res.redirect(`${clientBase.replace(/[\\/]+$/, "")}/settings?microsoft=connected`);
});

const microsoftDisconnect = asyncHandler(async (req, res) => {
  await IntegrationToken.deleteOne({
    provider: "microsoft",
    workspaceId: req.workspace._id,
    userId: req.user._id,
  });
  res.json({ ok: true });
});

const microsoftSync = asyncHandler(async (req, res) => {
  const doc = await IntegrationToken.findOne({
    provider: "microsoft",
    workspaceId: req.workspace._id,
    userId: req.user._id,
  });

  if (!doc) {
    res.status(400);
    throw new Error("Microsoft integration not connected");
  }

  // Simulate sync by updating lastSyncedAt
  doc.lastSyncedAt = new Date();
  await doc.save();
  
  res.json({ ok: true, lastSyncedAt: doc.lastSyncedAt });
});

const microsoftPreferences = asyncHandler(async (req, res) => {
  const { autoSync } = req.body;
  const doc = await IntegrationToken.findOne({
    provider: "microsoft",
    workspaceId: req.workspace._id,
    userId: req.user._id,
  });

  if (!doc) {
    res.status(400);
    throw new Error("Microsoft integration not connected");
  }

  if (typeof autoSync === "boolean") {
    doc.autoSync = autoSync;
    await doc.save();
  }
  
  res.json({ ok: true, autoSync: doc.autoSync });
});

module.exports = {
  microsoftStatus,
  microsoftConnect,
  microsoftCallback,
  microsoftDisconnect,
  microsoftSync,
  microsoftPreferences,
};
