const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, trim: true, lowercase: true },
  mobile: { type: String, required: true },
  address: { type: String },
  purpose: { type: String },
  meetingWithName: { type: String },
  meetingWithEmail: { type: String, lowercase: true },
  meetingTime: { type: Date },
  photoUrl: { type: String }, // Base64 for simplicity in this flow

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED", "CHECKED_IN", "CHECKED_OUT"],
    default: "PENDING"
  },

  inTime: { type: Date },
  outTime: { type: Date },

  document: {
    type: { type: String },
    number: { type: String },
    status: {
      type: String,
      default: "PENDING"
    }
  }
}, { timestamps: true });

module.exports = mongoose.model("Visitor", visitorSchema);
