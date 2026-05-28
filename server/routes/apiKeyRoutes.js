const express = require("express");
const { createApiKey, listApiKeys, revokeApiKey } = require("../controllers/apiKeyController");
const { requireAuth } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/apikeys", requireAuth, createApiKey);
router.get("/apikeys", requireAuth, listApiKeys);
router.delete("/apikeys/:id", requireAuth, revokeApiKey);

module.exports = router;
