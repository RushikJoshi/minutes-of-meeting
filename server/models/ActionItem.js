const mongoose = require("mongoose");

const actionItemSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
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

actionItemSchema.index({ organizationId: 1, status: 1, deadline: 1 });

module.exports = mongoose.model("ActionItem", actionItemSchema);
