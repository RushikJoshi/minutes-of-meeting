const mongoose = require("mongoose");

const visitorTokenSchema = new mongoose.Schema({
  name: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  isUsed: { type: Boolean, default: false },
  visitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor" },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model("VisitorToken", visitorTokenSchema);
