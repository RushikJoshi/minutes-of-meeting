const mongoose = require("mongoose");

const editorTemplateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    title: { type: String, default: "MOM Template", trim: true },
    contentHtml: { type: String, default: "<p></p>" },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

editorTemplateSchema.index({ organizationId: 1 }, { unique: true });

module.exports = mongoose.model("EditorTemplate", editorTemplateSchema);
