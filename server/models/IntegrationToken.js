const mongoose = require("mongoose");

const integrationTokenSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ["microsoft", "google", "zoom"], required: true, index: true },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    
    // Microsoft specific
    msalCache: { type: String },
    homeAccountId: { type: String, default: "" },
    
    // Google specific
    accessToken: { type: String },
    refreshToken: { type: String },
    expiryDate: { type: Number }, // Timestamp in ms
    
    tenantId: { type: String, default: "" },
    accountEmail: { type: String, default: "" },
    lastSyncedAt: { type: Date },
    autoSync: { type: Boolean, default: false },
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

integrationTokenSchema.index({ provider: 1, organizationId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("IntegrationToken", integrationTokenSchema);
