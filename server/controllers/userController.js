const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const listUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();
  const limit = Math.min(25, Math.max(1, Number(req.query.limit || 10)));

  const filter = q
    ? {
        $or: [
          { email: { $regex: q, $options: "i" } },
          { name: { $regex: q, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("_id email name");

  res.json(users);
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (name !== undefined) user.name = name;
  await user.save();

  res.json({ message: "Profile updated successfully", user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
});

module.exports = { listUsers, updateProfile };

