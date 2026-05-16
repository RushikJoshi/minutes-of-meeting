/*
const express = require("express");
const router = express.Router();
const visitorController = require("../controllers/visitorController");
const Meeting = require("../models/Meeting");

// Public routes
router.post("/create", visitorController.publicRegisterVisitor);
router.post("/generate-qr", visitorController.generateVisitorToken);
router.post("/verify-entry", visitorController.verifyEntry);

// Public meetings list (used by Visitor Dashboard)
router.get("/public/meetings", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const meetings = await Meeting.find({
      privacy: "public",
      date: { $gte: today, $lt: tomorrow }
    }).select("title startTime date").lean();
    res.json(meetings);
  } catch (err) {
    res.json([]);
  }
});

// Validate invite token (for QR-based registration)
router.get("/validate-token/:token", async (req, res) => {
  const { token } = req.params;
  const vToken = await require("../models/VisitorToken").findOne({ token });
  if (!vToken) return res.status(404).json({ success: false, message: "Invalid token" });
  if (vToken.isUsed) return res.json({ 
    success: true, 
    isUsed: true, 
    name: vToken.name, 
    visitorId: vToken.visitorId,
    visitorToken: vToken.visitorToken
  });
  res.json({ success: true, isUsed: false, name: vToken.name });
});

// Fetch visitor by secure UUID token (used by VisitorVerification page on QR scan)
router.get("/verify/:token", visitorController.getVisitorByToken);

// Fetch visitor by MongoDB _id (used by VisitorDashboard to get live entryCode)
router.get("/single/:id", visitorController.getVisitorById);

// Fetch visitor by email - last resort recovery for old sessions
router.get("/by-email/:email", async (req, res) => {
  try {
    const Visitor = require("../models/Visitor");
    // Find the most recently approved or pending visitor with this email
    const visitor = await Visitor.findOne({ email: req.params.email })
      .sort({ createdAt: -1 });
    if (!visitor) return res.status(404).json({ success: false, message: "Visitor not found" });
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Host Actions from Email
router.get("/action/:action/:id", visitorController.handleHostAction);

// Receptionist Routes
router.post("/check-in/:id", async (req, res) => {
  try {
    const visitor = await require("../models/Visitor").findByIdAndUpdate(
      req.params.id,
      { status: "CHECKED_IN", inTime: new Date() },
      { new: true }
    );
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post("/check-out/:id", visitorController.checkOutVisitor);
router.get("/", visitorController.getVisitors);

module.exports = router;
*/

const express = require("express");
const router = express.Router();
module.exports = router;