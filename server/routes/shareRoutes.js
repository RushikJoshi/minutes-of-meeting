const express = require("express");
const { createShareLink, openSharedMom, updateSharedMinutes } = require("../controllers/shareController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireOrganization } = require("../middlewares/organizationMiddleware");

const router = express.Router();

router.post("/share", requireAuth, requireOrganization, createShareLink);
router.get("/share/:token", openSharedMom);
router.patch("/share/:token/minutes", updateSharedMinutes);

module.exports = router;

