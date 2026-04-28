const aiService = require("../services/aiService");
const asyncHandler = require("../utils/asyncHandler");

const summarizeContent = asyncHandler(async (req, res) => {
  const { contentHtml } = req.body;
  if (!contentHtml) {
    res.status(400);
    throw new Error("contentHtml is required");
  }

  const result = await aiService.summarize(contentHtml);
  res.json(result);
});

const extractActionItems = asyncHandler(async (req, res) => {
  const { contentHtml } = req.body;
  if (!contentHtml) {
    res.status(400);
    throw new Error("contentHtml is required");
  }

  const result = await aiService.extractActionItems(contentHtml);
  res.json(result);
});

const polishContent = asyncHandler(async (req, res) => {
  const { contentHtml } = req.body;
  if (!contentHtml) {
    res.status(400);
    throw new Error("contentHtml is required");
  }

  const polishedHtml = await aiService.polish(contentHtml);
  res.json({ polishedHtml });
});

module.exports = {
  summarizeContent,
  extractActionItems,
  polishContent,
};
