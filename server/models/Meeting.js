const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["user", "external"], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, default: "", trim: true },
    inviteToken: { type: String, default: "", index: true },
    role: { type: String, enum: ["owner", "editor", "viewer"], default: "viewer" },
    rsvp: { type: String, enum: ["yes", "no", "maybe", "unknown"], default: "unknown" },
    status: { type: String, enum: ["invited", "joined", "not joined"], default: "invited" },
    invitationSentAt: { type: Date },
    invitationAcceptedAt: { type: Date },
    joinedAt: { type: Date },
    lastJoinedAt: { type: Date },
    leftAt: { type: Date },
    isActive: { type: Boolean, default: false },
    lastActiveAt: { type: Date },
  },
  { _id: true }
);

const agendaItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    owner: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: true }
);

const meetingSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    agenda: { type: String, default: "" },
    description: { type: String, default: "" }, // Added
    date: { type: Date },
    startTime: { type: Date }, // Changed to Date
    endTime: { type: Date },   // Changed to Date
    duration: { type: Number, default: 60 }, // Added
    timezone: { type: String, default: "Asia/Kolkata" }, // Added
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" }, // Added
    recurring: { type: Boolean, default: false }, // Added
    notes: { type: String, default: "" }, // Added
    momContent: { type: String, default: "" },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }, // Added

    type: { type: String, enum: ["online", "offline"], default: "online" }, // Added
    platform: { type: String, enum: ["zoom", "google-meet", "teams", "none"], default: "none" }, // Added
    location: { type: String, default: "" }, // Added
    meetingLink: { type: String, default: "" }, // Added

    participants: { type: [participantSchema], default: [] },
    attendance: { type: Array, default: [] },
    mom: { type: Object, default: {} },
    isMomGenerated: { type: Boolean, default: false },
    pdfUrl: { type: String, default: "" },
    agendaItems: { type: [agendaItemSchema], default: [] },
    attachments: [{ name: String, url: String, type: String }], // Added

    reminderMinutes: { type: Number, default: 0 },
    reminderSent: { type: Boolean, default: false }, // Added
    reminderSentAt: { type: Date },

    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"], // Changed live to ongoing
      default: "scheduled",
      index: true,
    },

    graph: {
      outlookEventId: { type: String, default: "" },
      googleEventId: { type: String, default: "" }, // Added
      googleMeetLink: { type: String, default: "" }, // Added
      organizerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      lastSyncedAt: { type: Date },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);
