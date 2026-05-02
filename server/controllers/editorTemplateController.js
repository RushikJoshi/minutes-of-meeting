const EditorTemplate = require("../models/EditorTemplate");
const Attachment = require("../models/Attachment");
const asyncHandler = require("../utils/asyncHandler");

async function ensureTemplate(req) {
  let template = await EditorTemplate.findOne({ workspaceId: req.workspace._id }).populate("attachments");
  const defaultHtml = `<h1 style="text-align: center;">Minutes of Meeting</h1><div style="text-align: right;"><p><strong>Date of meeting:</strong> [DATE]</p><p><strong>Time of meeting:</strong> [TIME]</p><p><strong>From:</strong> [CREATOR]</p><p><strong>To:</strong> [PARTICIPANTS]</p></div><br/><table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;"><thead><tr style="background-color: #f8fafc;"><th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">Serial Number</th><th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">Discussion/Tasks</th><th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">Task Complete Date</th><th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">Responsible Person</th></tr></thead><tbody><tr><td style="border: 1px solid #e2e8f0; padding: 12px;">1</td><td style="border: 1px solid #e2e8f0; padding: 12px;"></td><td style="border: 1px solid #e2e8f0; padding: 12px;"></td><td style="border: 1px solid #e2e8f0; padding: 12px;"></td></tr></tbody></table><p></p>`;

  if (!template) {
    template = await EditorTemplate.create({
      workspaceId: req.workspace._id,
      updatedBy: req.user._id,
      title: "MOM Template",
      contentHtml: defaultHtml,
      attachments: [],
    });
    template = await EditorTemplate.findById(template._id).populate("attachments");
  } else {
    // Check if content is effectively empty: "" or "<p></p>" or "<p><br></p>" or just whitespace
    const isEffectivelyEmpty = !template.contentHtml ||
      /^(\s|<p>|<\/p>|<br>)*$/i.test(template.contentHtml);

    if (isEffectivelyEmpty) {
      template.contentHtml = defaultHtml;
      await template.save();
    }
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
