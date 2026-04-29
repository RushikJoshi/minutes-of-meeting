const Visitor = require("../models/Visitor");
const VisitorToken = require("../models/VisitorToken");
const emailService = require("../services/emailService");

// Public Register Visitor Form
const publicRegisterVisitor = async (req, res) => {
  try {
    const { 
      token, name, email, mobile, address, 
      documentType, documentNumber,
      purpose, meetingWithName, meetingWithEmail, meetingTime,
      photoUrl 
    } = req.body;
    
    // 1. Verify token
    const vToken = await VisitorToken.findOne({ token });
    if (!vToken || vToken.isUsed || new Date() > vToken.expiresAt) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    // 2. Create Visitor as PENDING
    const visitor = await Visitor.create({
      name, email, mobile, address,
      purpose, meetingWithName, meetingWithEmail,
      meetingTime: meetingTime ? new Date(meetingTime) : null,
      photoUrl,
      status: "PENDING",
      document: { type: documentType, number: documentNumber, status: "PENDING" }
    });

    // 3. Mark token as used
    vToken.isUsed = true;
    vToken.visitorId = visitor._id;
    await vToken.save();

    // 4. Send Emails
    try {
      await emailService.sendApprovalRequestToHost(visitor);
      await emailService.sendPendingNotificationToVisitor(visitor);
    } catch (mailErr) {
      console.error("Mail Error:", mailErr.message);
    }

    res.json({ success: true, message: "Registration Pending Approval", visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Handle Host Action (Approve/Reject) from Email
const handleHostAction = async (req, res) => {
  try {
    const { action, id } = req.params;
    const visitor = await Visitor.findById(id);
    if (!visitor) return res.send("<h1>Visitor Not Found</h1>");

    if (visitor.status !== "PENDING") {
      return res.send(`<h1>Already Processed</h1><p>This request has already been ${visitor.status.toLowerCase()}.</p>`);
    }

    visitor.status = action === "approve" ? "APPROVED" : "REJECTED";
    await visitor.save();

    // Notify Visitor
    await emailService.sendFinalResultToVisitor(visitor);

    res.send(`
      <div style="font-family:sans-serif; text-align:center; padding:100px;">
        <h1 style="color:${action === 'approve' ? '#10b981' : '#ef4444'};">Request ${action === 'approve' ? 'Approved' : 'Rejected'}!</h1>
        <p>A notification has been sent to the visitor.</p>
        <p>Thank you.</p>
      </div>
    `);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Receptionist - Scan QR and Fetch Details
const scanVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id);
    if (!visitor) return res.status(404).json({ success: false, message: "Visitor not found" });
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Receptionist - Mark IN
const checkInVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id, {
      status: "CHECKED_IN",
      inTime: new Date()
    }, { new: true });
    res.json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
  publicRegisterVisitor,
  handleHostAction,
  scanVisitor,
  checkInVisitor,
  checkOutVisitor,
  getVisitors: async (req, res) => {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    res.json(visitors);
  }
};
