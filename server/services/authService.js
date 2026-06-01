const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signAccessToken } = require("./tokenService");
const Workspace = require("../models/Workspace");
const Membership = require("../models/Membership");

async function register({ email, password, name }) {
  email = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error("Email already in use");
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    email,
    name: name || "",
    passwordHash,
  });

  // Create a default workspace for first-time users
  const ws = await Workspace.create({
    name: user.name ? `${user.name}'s Workspace` : "My Workspace",
    createdBy: user._id,
  });
  await Membership.create({ workspaceId: ws._id, userId: user._id, role: "owner" });

  const token = signAccessToken(user._id);
  return { user: sanitizeUser(user), token };
}

async function login({ email, password }) {
  email = String(email).trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  // Backfill default workspace/membership for legacy users that were created
  // without a workspace (pre multi-workspace support).
  const existingMembership = await Membership.findOne({ userId: user._id });
  if (!existingMembership) {
    const ws = await Workspace.create({
      name: user.name ? `${user.name}'s Workspace` : "My Workspace",
      createdBy: user._id,
    });
    await Membership.create({ workspaceId: ws._id, userId: user._id, role: "owner" });
  }

  const token = signAccessToken(user._id);
  return { user: sanitizeUser(user), token };
}

function sanitizeUser(userDoc) {
  return {
    _id: userDoc._id,
    email: userDoc.email,
    name: userDoc.name || "",
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  };
}

module.exports = { register, login, sanitizeUser };

