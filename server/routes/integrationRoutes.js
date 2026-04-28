const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireWorkspace } = require("../middlewares/workspaceMiddleware");
const {
  microsoftStatus,
  microsoftConnect,
  microsoftCallback,
  microsoftDisconnect,
  microsoftSync,
  microsoftPreferences,
} = require("../controllers/integrationController");
const {
  googleStatus,
  googleConnect,
  googleCallback,
  googleDisconnect,
  googleSync,
  googlePreferences,
} = require("../controllers/googleController");

const router = express.Router();

router.get("/integrations/microsoft/status", requireAuth, requireWorkspace, microsoftStatus);
router.get("/integrations/microsoft/connect", requireAuth, requireWorkspace, microsoftConnect);
router.get("/integrations/microsoft/callback", microsoftCallback);
router.post("/integrations/microsoft/disconnect", requireAuth, requireWorkspace, microsoftDisconnect);
router.post("/integrations/microsoft/sync", requireAuth, requireWorkspace, microsoftSync);
router.patch("/integrations/microsoft/preferences", requireAuth, requireWorkspace, microsoftPreferences);

router.get("/integrations/google/status", requireAuth, requireWorkspace, googleStatus);
router.get("/integrations/google/connect", requireAuth, requireWorkspace, googleConnect);
router.get("/integrations/google/callback", googleCallback);
router.post("/integrations/google/disconnect", requireAuth, requireWorkspace, googleDisconnect);
router.post("/integrations/google/sync", requireAuth, requireWorkspace, googleSync);
router.patch("/integrations/google/preferences", requireAuth, requireWorkspace, googlePreferences);

module.exports = router;
