const Visitor = require("../models/Visitor");

// Create Visitor
const createVisitor = async (req, res) => {
    try {
        const visitor = await Visitor.create(req.body);
        res.json(visitor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get Visitors
const getVisitors = async (req, res) => {
    try {
        const visitors = await Visitor.find().sort({ createdAt: -1 });
        res.json(visitors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Upload Document
const uploadDocument = async (req, res) => {
    try {
        const visitor = await Visitor.findById(req.params.id);
        if (!visitor) return res.status(404).json({ message: "Visitor not found" });

        visitor.document = {
            ...visitor.document,
            fileKey: req.file ? req.file.filename : null
        };

        await visitor.save();
        res.json({ message: "Document uploaded" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Aadhar Verify (Mock)
const verifyAadhar = (req, res) => {
    const { aadharNumber } = req.body;
    const isValid = aadharNumber && aadharNumber.length === 12 && /^\d+$/.test(aadharNumber);

    if (isValid) {
        return res.json({ status: "verified", name: "Demo User", aadharNumber });
    }

    res.json({ status: "invalid" });
};

// Admin Verify Document
const verifyDocument = async (req, res) => {
    try {
        const visitor = await Visitor.findById(req.params.id);
        if (!visitor) return res.status(404).json({ message: "Visitor not found" });

        visitor.document.status = "VERIFIED";
        await visitor.save();
        res.json({ message: "Document verified", visitor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createVisitor,
    getVisitors,
    uploadDocument,
    verifyAadhar,
    verifyDocument
};
