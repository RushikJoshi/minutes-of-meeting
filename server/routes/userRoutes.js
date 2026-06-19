const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { listUsers, updateProfile } = require("../controllers/userController");

const router = express.Router();

router.get("/users", requireAuth, listUsers);
router.put("/profile", requireAuth, updateProfile);

module.exports = router;

