const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      description: "A name to identify what this API key is for (e.g., 'CRM Integration')"
    },
    keyHash: {
      type: String,
      required: true,
      description: "Hashed API key to verify requests securely"
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      description: "The user who created this key"
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      description: "Optional: Limit the API key strictly to a specific workspace"
    },
    lastUsedAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ApiKey", apiKeySchema);
