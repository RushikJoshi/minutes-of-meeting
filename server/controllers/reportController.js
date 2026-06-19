const Meeting = require("../models/Meeting");
const ActionItem = require("../models/ActionItem");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/reports/summary
 * Returns overview statistics for the current organization
 */
const getReportSummary = asyncHandler(async (req, res) => {
  const organizationId = req.organization._id;

  // 1. Meeting Statistics
  const totalMeetings = await Meeting.countDocuments({ organizationId });
  const ongoingMeetings = await Meeting.countDocuments({ organizationId, status: "ongoing" });
  const completedMeetings = await Meeting.countDocuments({ organizationId, status: "completed" });
  const scheduledMeetings = await Meeting.countDocuments({ organizationId, status: "scheduled" });

  // 2. Action Item Statistics
  const totalActionItems = await ActionItem.countDocuments({ organizationId });
  const completedActionItems = await ActionItem.countDocuments({ organizationId, status: "completed" });
  const pendingActionItems = await ActionItem.countDocuments({ organizationId, status: "pending" });

  // 3. Recent Activity (Latest 5 meetings)
  const recentMeetings = await Meeting.find({ organizationId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title date status");

  // 4. Overdue Tasks (Action items with deadline in the past and still pending)
  const overdueActionItems = await ActionItem.countDocuments({
    organizationId,
    status: "pending",
    deadline: { $lt: new Date() },
  });

  res.json({
    meetings: {
      total: totalMeetings,
      ongoing: ongoingMeetings,
      completed: completedMeetings,
      scheduled: scheduledMeetings,
    },
    actionItems: {
      total: totalActionItems,
      completed: completedActionItems,
      pending: pendingActionItems,
      overdue: overdueActionItems,
    },
    recentMeetings,
  });
});

module.exports = {
  getReportSummary,
};
