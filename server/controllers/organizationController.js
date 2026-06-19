const Organization = require("../models/Organization");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const listOrganizations = asyncHandler(async (req, res) => {
  const organizations = await Organization.find();
  res.json(organizations);
});

const getOrganizationById = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) {
    res.status(404);
    throw new Error("Organization not found");
  }
  res.json(org);
});

const createOrganization = asyncHandler(async (req, res) => {
  const { name, organizationCode, logo, industry, email, phone, address, adminName, adminEmail } = req.body;

  if (!name || !organizationCode || !adminEmail || !adminName) {
    res.status(400);
    throw new Error("Organization name, code, admin name, and admin email are required");
  }

  // Check if admin email already exists
  const userExists = await User.findOne({ email: adminEmail });
  if (userExists) {
    res.status(400);
    throw new Error("User with admin email already exists");
  }

  const organization = await Organization.create({
    name,
    organizationCode,
    logo,
    industry,
    email,
    phone,
    address,
    createdBy: req.user._id,
  });

  // Create invite token
  const inviteToken = crypto.randomBytes(32).toString("hex");
  const inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create Organization Admin without password
  const adminUser = await User.create({
    name: adminName,
    email: adminEmail,
    inviteToken,
    inviteTokenExpiresAt,
    role: "organization_admin",
    organizationId: organization._id,
  });

  // TODO: Send Invite Email to adminEmail with the invite link
  const { getPublicClientBaseUrl } = require("../utils/publicClientBase");
  const frontendBase = getPublicClientBaseUrl() || process.env.PUBLIC_CLIENT_BASE_URL || "http://localhost:5174";
  const inviteLink = `${frontendBase}/accept-invite?token=${inviteToken}`;
  
  console.log(`\n\n=======================================================`);
  console.log(`📧 [EMAIL MOCK] Sent invite to ${adminEmail}`);
  console.log(`🔗 Click here to set password and activate account:`);
  console.log(`   ${inviteLink}`);
  console.log(`=======================================================\n\n`);

  res.status(201).json({ organization, adminUser: { email: adminUser.email, name: adminUser.name } });
});

const updateOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) {
    res.status(404);
    throw new Error("Organization not found");
  }

  const updatedOrg = await Organization.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  
  res.json(updatedOrg);
});

const deleteOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) {
    res.status(404);
    throw new Error("Organization not found");
  }
  
  // Deactivate instead of hard delete for safety
  org.isActive = false;
  await org.save();
  res.json({ message: "Organization deactivated successfully" });
});

module.exports = { listOrganizations, getOrganizationById, createOrganization, updateOrganization, deleteOrganization };

