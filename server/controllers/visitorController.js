const Visitor = require("../models/Visitor");
const VisitorToken = require("../models/VisitorToken");
const emailService = require("../services/emailService");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Generate Single-Use Token for Visitor Registration
const generateVisitorToken = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Visitor name is required" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const vToken = await VisitorToken.create({
      name,
      token,
      expiresAt
    });

    res.json({
      success: true,
      name: vToken.name,
      token: vToken.token
    });
  } catch (err) {
    console.error("Token Generation Error:", err.message);
    res.status(500).json({ success: false, message: "Failed to generate link" });
  }
};

// Public Register Visitor Form (POST /api/visitors/create)
const publicRegisterVisitor = async (req, res) => {
  try {
    const {
      token: inviteToken, name, email, mobile, address,
      documentType, documentNumber,
      purpose, meetingWithName, meetingWithEmail, meetingTime,
      photoUrl
    } = req.body;

    // 1. Verify invite token
    if (inviteToken) {
      const vToken = await VisitorToken.findOne({ token: inviteToken });
      if (!vToken || vToken.isUsed || new Date() > vToken.expiresAt) {
        return res.status(400).json({ success: false, message: "Invalid or expired invitation" });
      }
      vToken.isUsed = true;
      await vToken.save();
    }

    // Save Photo
    let finalPhotoUrl = photoUrl;
    if (photoUrl && photoUrl.startsWith("data:image")) {
      try {
        const base64Data = photoUrl.replace(/^data:image\/\w+;base64,/, "");
        const fileName = `visitor_${Date.now()}.jpg`;
        const uploadDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, base64Data, "base64");
        finalPhotoUrl = `/uploads/${fileName}`;
      } catch (err) {
        console.error("Photo Save Error:", err.message);
      }
    }

    // Generate Secure Token (UUID) and 6-digit Entry Code
    const secureToken = uuidv4();
    const entryCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Create Visitor
    const visitor = await Visitor.create({
      name, email, mobile, address,
      purpose, meetingWithName, meetingWithEmail,
      meetingTime: meetingTime ? new Date(meetingTime) : null,
      photoUrl: finalPhotoUrl,
      status: "PENDING",
      token: secureToken,
      entryCode,
      document: { type: documentType, number: documentNumber, status: "PENDING" }
    });

    // 3. Send Emails in background to avoid blocking the user
    emailService.sendApprovalRequestToHost(visitor).catch(err => console.error("Host Notify Error:", err.message));
    emailService.sendPendingNotificationToVisitor(visitor).catch(err => console.error("Visitor Notify Error:", err.message));

    res.json({ success: true, message: "Registration Successful", visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/visitors/verify/:token (fetch by UUID token)
const getVisitorByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const visitor = await Visitor.findOne({ token });
    if (!visitor) return res.status(404).json({ success: false, message: "Visitor not found" });
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/visitors/single/:id (fetch by MongoDB _id)
const getVisitorById = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: "Visitor not found" });
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/visitors/verify-entry
const verifyEntry = async (req, res) => {
  try {
    const { token, entryCode } = req.body;
    let query = {};
    if (token) query = { token };
    else if (entryCode) query = { entryCode };
    else return res.status(400).json({ success: false, message: "Token or Entry Code required" });

    const visitor = await Visitor.findOne(query);
    if (!visitor) return res.status(404).json({ success: false, message: "Visitor not found" });

    if (visitor.status !== "APPROVED") {
      return res.status(400).json({ success: false, message: `Visitor status is ${visitor.status}` });
    }

    visitor.status = "CHECKED_IN";
    visitor.inTime = new Date();
    await visitor.save();

    res.json({ success: true, message: "Checked In Successfully", visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Handle Host Action (Approve/Reject)
const handleHostAction = async (req, res) => {
  try {
    const { action, id } = req.params;
    const visitor = await Visitor.findById(id);
    if (!visitor) return res.send("<h1>Visitor Not Found</h1>");

    if (visitor.status !== "PENDING") {
      return res.send(`<h1>Already Processed</h1><p>Status: ${visitor.status}</p>`);
    }

    visitor.status = action === "approve" ? "APPROVED" : "REJECTED";
    await visitor.save();

    await emailService.sendFinalResultToVisitor(visitor);

    res.send(`
      <div style="font-family:sans-serif; text-align:center; padding:100px;">
        <h1 style="color:${action === 'approve' ? '#10b981' : '#ef4444'};">Request ${action === 'approve' ? 'Approved' : 'Rejected'}!</h1>
        <p>Notification sent to visitor.</p>
      </div>
    `);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Receptionist - Mark OUT
const checkOutVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id, {
      status: "CHECKED_OUT",
      outTime: new Date()
    }, { new: true });
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  generateVisitorToken,
  publicRegisterVisitor,
  handleHostAction,
  getVisitorByToken,
  getVisitorById,
  verifyEntry,
  checkOutVisitor,
  getVisitors: async (req, res) => {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    res.json(visitors);
  }
};
