const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireWorkspace } = require("../middlewares/workspaceMiddleware");
const {
  getEditorTemplate,
  upsertEditorTemplate,
} = require("../controllers/editorTemplateController");

const router = express.Router();

router.get("/editor-template", requireAuth, requireWorkspace, getEditorTemplate);
router.put("/editor-template", requireAuth, requireWorkspace, upsertEditorTemplate);

module.exports = router;
