const express = require("express");
const { getReportSummary } = require("../controllers/reportController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireOrganization } = require("../middlewares/organizationMiddleware");

const router = express.Router();

router.get("/api/reports/summary", requireAuth, requireOrganization, getReportSummary);

module.exports = router;
