const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireOrganization } = require("../middlewares/organizationMiddleware");
const { listActionItems, updateActionItemStatus } = require("../controllers/actionItemController");

const router = express.Router();

router.get("/action-items", requireAuth, requireOrganization, listActionItems);
router.patch("/action-items/:id/status", requireAuth, requireOrganization, updateActionItemStatus);

module.exports = router;

