const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { uploadAttachment, listAttachments } = require("../controllers/attachmentController");
const { requireOrganization } = require("../middlewares/organizationMiddleware");

const router = express.Router();

router.post("/attachments", requireAuth, requireOrganization, ...uploadAttachment);
router.get("/attachments", requireAuth, requireOrganization, listAttachments);

module.exports = router;

