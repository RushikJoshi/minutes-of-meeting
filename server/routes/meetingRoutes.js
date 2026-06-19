const express = require("express");
const {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  cancelMeeting,
  deleteMeeting,
  getTodayMeetings,
  downloadMomPdf,
  joinMeeting,
  leaveMeeting,
  inviteParticipants,
  updateMeetingAgenda,
  getPublicJoinDetails,
  acceptPublicMeetingInvite,
  startMeeting,
  endMeeting,
  downloadPdf,
  testLifecycle,
} = require("../controllers/meetingController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireOrganization } = require("../middlewares/organizationMiddleware");

const router = express.Router();

// ─── Meeting CRUD ─────────────────────────────────────────────────────────────
router.post("/create-meeting", requireAuth, requireOrganization, createMeeting);
router.get("/meetings", requireAuth, requireOrganization, getMeetings);
router.get("/meeting/:id", requireAuth, requireOrganization, getMeetingById);
router.patch("/meeting/:id", requireAuth, requireOrganization, updateMeeting);
router.delete("/meeting/:id", requireAuth, requireOrganization, deleteMeeting);
router.post("/meeting/:id/cancel", requireAuth, requireOrganization, cancelMeeting);
router.post("/meeting/:id/start", requireAuth, requireOrganization, startMeeting);
router.post("/meeting/:id/end", requireAuth, requireOrganization, endMeeting);

// ─── Participant Actions ──────────────────────────────────────────────────────
router.post("/meeting/:id/join", requireAuth, requireOrganization, joinMeeting);
router.post("/meeting/:id/leave", requireAuth, requireOrganization, (req, res, next) => {
  require("../controllers/meetingController").leaveMeeting(req, res, next);
});
router.put("/meeting/:id/agenda", requireAuth, requireOrganization, updateMeetingAgenda);

// ─── Invite Route ─────────────────────────────────────────────────────────────
// POST /meeting/:id/invite — adds emails to participants and sends invite emails
router.post("/meeting/:id/invite", requireAuth, requireOrganization, inviteParticipants);

// ─── PDF Download ─────────────────────────────────────────────────────────────
router.get("/meeting/:id/test-lifecycle", testLifecycle);
router.get("/meeting/:id/download-pdf", downloadPdf);
router.get("/meeting/:id/export-pdf", requireAuth, requireOrganization, downloadPdf);

// Public invite landing and invite acceptance
router.get("/join/:id", getPublicJoinDetails);
router.post("/join/:id/accept", acceptPublicMeetingInvite);

// ─── Reminders / Upcoming ─────────────────────────────────────────────────────
router.get("/reminders", requireAuth, requireOrganization, getTodayMeetings);
router.get("/upcoming", requireAuth, requireOrganization, getTodayMeetings);
router.get("/meetings/upcoming", requireAuth, requireOrganization, getTodayMeetings);

// GET /api/meetings
router.get("/", async (req, res) => {
  try {
    const meetings = await Meeting.find({ startTime: { $gte: new Date() } })
      .sort({ startTime: 1 })
      .select("_id title startTime");
    res.status(200).json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
});

module.exports = router;
