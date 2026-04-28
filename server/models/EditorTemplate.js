const mongoose = require("mongoose");

const editorTemplateSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
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

editorTemplateSchema.index({ workspaceId: 1 }, { unique: true });

module.exports = mongoose.model("EditorTemplate", editorTemplateSchema);
