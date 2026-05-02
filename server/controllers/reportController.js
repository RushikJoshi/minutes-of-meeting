const Meeting = require("../models/Meeting");
const ActionItem = require("../models/ActionItem");
const asyncHandler = require("../utils/asyncHandler");

/**
 * GET /api/reports/summary
 * Returns overview statistics for the current workspace
 */
const getReportSummary = asyncHandler(async (req, res) => {
  const workspaceId = req.workspace._id;

  // 1. Meeting Statistics
  const totalMeetings = await Meeting.countDocuments({ workspaceId });
  const ongoingMeetings = await Meeting.countDocuments({ workspaceId, status: "ongoing" });
  const completedMeetings = await Meeting.countDocuments({ workspaceId, status: "completed" });
  const scheduledMeetings = await Meeting.countDocuments({ workspaceId, status: "scheduled" });

  // 2. Action Item Statistics
  const totalActionItems = await ActionItem.countDocuments({ workspaceId });
  const completedActionItems = await ActionItem.countDocuments({ workspaceId, status: "completed" });
  const pendingActionItems = await ActionItem.countDocuments({ workspaceId, status: "pending" });

  // 3. Recent Activity (Latest 5 meetings)
  const recentMeetings = await Meeting.find({ workspaceId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title date status");

  // 4. Overdue Tasks (Action items with deadline in the past and still pending)
  const overdueActionItems = await ActionItem.countDocuments({
    workspaceId,
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
