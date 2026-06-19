const EditorTemplate = require("../models/EditorTemplate");
const Attachment = require("../models/Attachment");
const asyncHandler = require("../utils/asyncHandler");

async function ensureTemplate(req) {
  let template = await EditorTemplate.findOne({ organizationId: req.organization._id }).populate("attachments");
  const defaultHtml = `
    <h1 style="text-align: center;"><u>MEETING TITLE</u></h1>
    <br/>
    <div style="margin-bottom: 20px;">
      <p>📅 <strong>Date of Meeting :</strong> <span>[DATE]</span></p>
      <p>⏰ <strong>Time of Meeting :</strong> <span>[TIME]</span></p>
      <p>👤 <strong>From :</strong> <span>[CREATOR]</span></p>
      <p>👥 <strong>To :</strong> <span>[PARTICIPANTS]</span></p>
    </div>
    <br/>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
      <thead>
        <tr style="background-color: #f8fafc;">
          <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; width: 50px;"><p>#</p></th>
          <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;"><p>Discussion / Tasks</p></th>
          <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; width: 150px;"><p>Complete Date</p></th>
          <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; width: 150px;"><p>Responsible</p></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid #e2e8f0; padding: 12px;"><p>1</p></td>
          <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
          <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
          <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
        </tr>
      </tbody>
    </table>
    <p></p>
  `;

  if (!template) {
    template = await EditorTemplate.create({
      organizationId: req.organization._id,
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
      organizationId: req.organization._id,
      entityType: "editorTemplate",
      entityId: existing._id,
    });

    if (count !== attachmentIds.length) {
      res.status(400);
      throw new Error("Invalid attachmentIds");
    }
  }

  const template = await EditorTemplate.findOneAndUpdate(
    { organizationId: req.organization._id },
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
