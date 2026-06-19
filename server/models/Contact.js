const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
    },
    source: {
      type: String,
      enum: ["manual", "google", "microsoft", "hrms", "other"],
      default: "manual",
    },
    externalId: {
      type: String,
    },
    lastSyncedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure email is unique within a organization
contactSchema.index({ organization: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("Contact", contactSchema);
