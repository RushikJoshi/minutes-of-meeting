const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  res.status(201).json({ user, token });
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.json({ user, token });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

const acceptInvite = asyncHandler(async (req, res) => {
  const user = await authService.acceptInvite(req.body);
  res.json({ message: "Invite accepted successfully", user });
});

module.exports = { register, login, me, acceptInvite };

