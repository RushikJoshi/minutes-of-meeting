const express = require("express");
const { getReportSummary } = require("../controllers/reportController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireWorkspace } = require("../middlewares/workspaceMiddleware");

const router = express.Router();

router.get("/api/reports/summary", requireAuth, requireWorkspace, getReportSummary);

module.exports = router;
