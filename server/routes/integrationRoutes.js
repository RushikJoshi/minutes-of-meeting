const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireOrganization } = require("../middlewares/organizationMiddleware");
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

router.get("/integrations/microsoft/status", requireAuth, requireOrganization, microsoftStatus);
router.get("/integrations/microsoft/connect", requireAuth, requireOrganization, microsoftConnect);
router.get("/integrations/microsoft/callback", microsoftCallback);
router.post("/integrations/microsoft/disconnect", requireAuth, requireOrganization, microsoftDisconnect);
router.post("/integrations/microsoft/sync", requireAuth, requireOrganization, microsoftSync);
router.patch("/integrations/microsoft/preferences", requireAuth, requireOrganization, microsoftPreferences);

router.get("/integrations/google/status", requireAuth, requireOrganization, googleStatus);
router.get("/integrations/google/connect", requireAuth, requireOrganization, googleConnect);
router.get("/integrations/google/callback", googleCallback);
router.post("/integrations/google/disconnect", requireAuth, requireOrganization, googleDisconnect);
router.post("/integrations/google/sync", requireAuth, requireOrganization, googleSync);
router.patch("/integrations/google/preferences", requireAuth, requireOrganization, googlePreferences);

module.exports = router;
