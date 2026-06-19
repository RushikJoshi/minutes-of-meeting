const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    passwordHash: {
      type: String, // Made optional for invite flow
    },
    inviteToken: {
      type: String,
    },
    inviteTokenExpiresAt: {
      type: Date,
    },
    role: {
      type: String,
      enum: ["product_super_admin", "organization_admin", "employee"],
      default: "employee"
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

