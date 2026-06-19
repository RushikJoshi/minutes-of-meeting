const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signAccessToken } = require("./tokenService");

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

  // Allow login if user has a password. (Invitees without password should not login here yet)
  if (!user.passwordHash) {
    const err = new Error("Account setup incomplete. Please use the invite link.");
    err.statusCode = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const token = signAccessToken(user._id);
  return { user: sanitizeUser(user), token };
}

function sanitizeUser(userDoc) {
  return {
    _id: userDoc._id,
    email: userDoc.email,
    name: userDoc.name || "",
    role: userDoc.role,
    organizationId: userDoc.organizationId,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  };
}

async function acceptInvite({ token, password }) {
  if (!token) throw new Error("Invite token missing");
  const user = await User.findOne({ inviteToken: token, inviteTokenExpiresAt: { $gt: new Date() } });
  if (!user) {
    const err = new Error("Invalid or expired invite token");
    err.statusCode = 400;
    throw err;
  }
  user.passwordHash = await bcrypt.hash(password, 12);
  user.inviteToken = undefined;
  user.inviteTokenExpiresAt = undefined;
  await user.save();
  return sanitizeUser(user);
}

module.exports = { register, login, acceptInvite, sanitizeUser };
