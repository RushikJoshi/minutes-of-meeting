const EditorTemplate = require("../models/EditorTemplate");
const Attachment = require("../models/Attachment");
const asyncHandler = require("../utils/asyncHandler");

async function ensureTemplate(req) {
  let template = await EditorTemplate.findOne({ workspaceId: req.workspace._id }).populate("attachments");
  if (!template) {
    template = await EditorTemplate.create({
      workspaceId: req.workspace._id,
      updatedBy: req.user._id,
      title: "MOM Template",
      contentHtml: "<p></p>",
      attachments: [],
    });
    template = await EditorTemplate.findById(template._id).populate("attachments");
  }
  return template;
}

const getEditorTemplate = asyncHandler(async (req, res) => {
  const template = await ensureTemplate(req);
  res.json(template);
});

const upsertEditorTemplate = asyncHandler(async (req, res) => {
  const existing = await ensureTemplate(req);
  const payload = req.body || {};
  const attachmentIds = Array.isArray(payload.attachmentIds)
    ? payload.attachmentIds.map(String).filter(Boolean)
    : [];

  if (attachmentIds.length > 0) {
    const count = await Attachment.countDocuments({
      _id: { $in: attachmentIds },
      createdBy: req.user._id,
      workspaceId: req.workspace._id,
      entityType: "editorTemplate",
      entityId: existing._id,
    });

    if (count !== attachmentIds.length) {
      res.status(400);
      throw new Error("Invalid attachmentIds");
    }
  }

  const template = await EditorTemplate.findOneAndUpdate(
    { workspaceId: req.workspace._id },
    {
      $set: {
        title: payload.title || existing.title || "MOM Template",
        contentHtml: payload.contentHtml !== undefined ? payload.contentHtml : existing.contentHtml,
        attachments: attachmentIds,
        updatedBy: req.user._id,
      },
    },
    { new: true, upsert: true }
  ).populate("attachments");

  res.json(template);
});

module.exports = {
  getEditorTemplate,
  upsertEditorTemplate,
};
