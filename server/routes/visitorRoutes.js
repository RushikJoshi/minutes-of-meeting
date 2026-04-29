const express = require("express");
const router = express.Router();
const visitorController = require("../controllers/visitorController");

// Public routes
router.post("/submit-visitor", visitorController.publicRegisterVisitor);
router.get("/validate-token/:token", async (req, res) => {
  const { token } = req.params;
  const vToken = await require("../models/VisitorToken").findOne({ token });
  if (!vToken) return res.status(404).json({ success: false, message: "Invalid token" });
  if (vToken.isUsed) return res.json({ success: true, isUsed: true, name: vToken.name, visitorId: vToken.visitorId });
  res.json({ success: true, isUsed: false, name: vToken.name });
});

// Host Actions from Email (Direct GET request from browser)
router.get("/action/:action/:id", visitorController.handleHostAction);

// Receptionist Routes
router.get("/scan/:id", visitorController.scanVisitor);
router.post("/check-in/:id", visitorController.checkInVisitor);
router.post("/check-out/:id", visitorController.checkOutVisitor);
router.get("/", visitorController.getVisitors);

module.exports = router;