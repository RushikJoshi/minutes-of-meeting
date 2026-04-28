const mongoose = require("mongoose");

const actionItemSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
      index: true,
    },
    momId: { type: mongoose.Schema.Types.ObjectId, ref: "Mom", required: true, index: true },
    sourceItemId: { type: String, default: "" }, // mom.actionItems[].id
    title: { type: String, default: "", index: true },
    task: { type: String, default: "", index: true },
    assignedTo: { type: String, default: "", index: true },
    deadline: { type: Date, index: true },
    status: { type: String, enum: ["pending", "completed"], default: "pending", index: true },
  },
  { timestamps: true }
);

actionItemSchema.index({ workspaceId: 1, status: 1, deadline: 1 });

module.exports = mongoose.model("ActionItem", actionItemSchema);
