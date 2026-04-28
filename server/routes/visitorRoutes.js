const express = require("express");
const multer = require("multer");
const {
  createVisitor,
  getVisitors,
  uploadDocument,
  verifyAadhar,
  verifyDocument
} = require("../controllers/visitorController");
const { allowRoles } = require("../middlewares/roleMiddleware");

const router = express.Router();

// Multer setup
const upload = multer({ dest: "uploads/" });

// Public routes (no auth needed for check-in)
router.post("/public", createVisitor);
router.post("/verify-aadhar/public", verifyAadhar);
router.get("/public/meetings", async (req, res) => {
  try {
    const Meeting = require("../models/Meeting");
    const meetings = await Meeting.find({ startTime: { $gte: new Date() } })
      .limit(10)
      .select("title _id");
    res.json(meetings);
  } catch (err) {
    res.json([]);
  }
});

// Authenticated routes
router.post("/", createVisitor);
router.get("/", getVisitors);
router.post("/verify-aadhar", verifyAadhar);
router.post("/:id/upload-doc", upload.single("file"), uploadDocument);
router.put("/:id/verify", verifyDocument);

module.exports = router;