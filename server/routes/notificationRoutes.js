const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { listNotifications, markRead } = require("../controllers/notificationController");
const { requireOrganization } = require("../middlewares/organizationMiddleware");

const router = express.Router();

router.get("/notifications", requireAuth, requireOrganization, listNotifications);
router.post("/notifications/:id/read", requireAuth, requireOrganization, markRead);

module.exports = router;

