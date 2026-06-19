const express = require("express");
const { generatePdf } = require("../controllers/pdfController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireOrganization } = require("../middlewares/organizationMiddleware");

const router = express.Router();

router.get("/generate-pdf/:meetingId", requireAuth, requireOrganization, generatePdf);

module.exports = router;

