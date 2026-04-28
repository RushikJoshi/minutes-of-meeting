const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema({
  name: String,
  company: String,
  purpose: String,
  personToMeet: String,
  meetingId: String,

  status: {
    type: String,
    default: "WAITING"
  },

  checkIn: {
    type: Date,
    default: Date.now
  },

  document: {
    type: {
      type: String
    },
    number: String,
    fileKey: String,
    status: {
      type: String,
      default: "PENDING"
    },
    verificationResult: Object
  }
}, { timestamps: true });

module.exports = mongoose.model("Visitor", visitorSchema);
