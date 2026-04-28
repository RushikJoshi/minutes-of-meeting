const express = require("express");
const { summarizeContent, extractActionItems, polishContent } = require("../controllers/aiController");
const { requireAuth } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/ai/summarize", requireAuth, summarizeContent);
router.post("/ai/extract-tasks", requireAuth, extractActionItems);
router.post("/ai/polish", requireAuth, polishContent);

module.exports = router;
