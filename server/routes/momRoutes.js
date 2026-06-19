const express = require("express");
const { createMom, getMomByMeetingId, getMinutesDoc, upsertMinutesDoc } = require("../controllers/momController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireOrganization } = require("../middlewares/organizationMiddleware");

const router = express.Router();

router.post("/create-mom", requireAuth, requireOrganization, createMom);
router.get("/mom/:meetingId", requireAuth, requireOrganization, getMomByMeetingId);
router.get("/meeting/:meetingId/minutes", requireAuth, requireOrganization, getMinutesDoc);
router.put("/meeting/:meetingId/minutes", requireAuth, requireOrganization, upsertMinutesDoc);

module.exports = router;

