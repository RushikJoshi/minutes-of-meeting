const express = require("express");
const { getPublicClientBaseUrl } = require("../utils/publicClientBase");

const router = express.Router();

router.get("/public-client-base", (req, res) => {
  const baseUrl = getPublicClientBaseUrl();
  if (!baseUrl) return res.status(500).json({ success: false, message: "Unable to determine public client base URL" });
  res.json({ success: true, baseUrl });
});

module.exports = router;

