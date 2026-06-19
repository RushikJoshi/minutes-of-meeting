const Organization = require("../models/Organization");
const User = require("../models/User");
const Meeting = require("../models/Meeting");
const Attachment = require("../models/Attachment");
const asyncHandler = require("../utils/asyncHandler");

const getSuperAdminDashboard = asyncHandler(async (req, res) => {
  // Global Data for Product Super Admin
  const totalOrganizations = await Organization.countDocuments();
  const activeOrganizations = await Organization.countDocuments({ isActive: true });
  const inactiveOrganizations = await Organization.countDocuments({ isActive: false });
  
  const totalUsers = await User.countDocuments();
  const totalMeetings = await Meeting.countDocuments();
  const totalDocuments = await Attachment.countDocuments();

  // Active Users Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Assuming updatedAt changes when user logs in or is active, if not we fall back to created today for mock
  const activeUsersToday = await User.countDocuments({ updatedAt: { $gte: today } });

  const recentOrganizations = await Organization.find()
    .select("name organizationCode industry createdAt isActive")
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    totalOrganizations,
    activeOrganizations,
    inactiveOrganizations,
    totalUsers,
    totalMeetings,
    totalDocuments,
    activeUsersToday,
    recentOrganizations
  });
});

module.exports = { getSuperAdminDashboard };
