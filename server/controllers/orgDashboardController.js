const User = require("../models/User");
const Meeting = require("../models/Meeting");
const Attachment = require("../models/Attachment");
const ActionItem = require("../models/ActionItem");
const Mom = require("../models/Mom");
const asyncHandler = require("../utils/asyncHandler");

const getOrgDashboard = asyncHandler(async (req, res) => {
  const organizationId = req.user.organizationId;
  if (!organizationId) {
    res.status(403);
    throw new Error("User does not belong to any organization");
  }

  // Organization Data
  const totalUsers = await User.countDocuments({ organizationId });
  const totalMeetings = await Meeting.countDocuments({ organizationId });
  const totalDocuments = await Attachment.countDocuments({ organizationId });
  const totalMOM = await Mom.countDocuments({ organizationId });
  const completedTasks = await ActionItem.countDocuments({ organizationId, status: "completed" });
  const pendingTasksCount = await ActionItem.countDocuments({ organizationId, status: "pending" });

  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const endOfToday = new Date(today.setHours(23, 59, 59, 999));

  // Today's Meetings
  const todaysMeetingsCount = await Meeting.countDocuments({
    organizationId,
    date: { $gte: startOfToday, $lte: endOfToday }
  });

  // Upcoming Meetings (Future meetings, limit 5)
  const upcomingMeetings = await Meeting.find({
    organizationId,
    startTime: { $gt: new Date() }
  })
  .sort({ startTime: 1 })
  .limit(5)
  .select("title startTime status");

  // Pending Tasks List
  const pendingTasks = await ActionItem.find({ organizationId, status: "pending" })
  .sort({ deadline: 1 })
  .limit(5)
  .select("task assignedTo deadline");

  // Recent Documents
  const recentDocuments = await Attachment.find({ organizationId })
  .sort({ createdAt: -1 })
  .limit(5)
  .select("name url createdAt");

  res.json({
    totalUsers,
    totalMeetings,
    totalDocuments,
    totalMOM,
    completedTasks,
    pendingTasksCount,
    todaysMeetingsCount,
    upcomingMeetings,
    pendingTasks,
    recentDocuments
  });
});

module.exports = { getOrgDashboard };
