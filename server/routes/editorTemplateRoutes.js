const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireOrganization } = require("../middlewares/organizationMiddleware");
const {
  getEditorTemplate,
  upsertEditorTemplate,
} = require("../controllers/editorTemplateController");

const router = express.Router();

router.get("/editor-template", requireAuth, requireOrganization, getEditorTemplate);
router.put("/editor-template", requireAuth, requireOrganization, upsertEditorTemplate);

module.exports = router;
