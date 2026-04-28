const mongoose = require("mongoose");

const attendeeSchema = new mongoose.Schema({
  srNo: { type: String, default: "" },
  name: { type: String, default: "" },
  designation: { type: String, default: "" },
  department: { type: String, default: "" },
  status: { type: String, enum: ["Present", "Absent", "Excused"], default: "Present" }
}, { _id: false });

const absenteeSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  reason: { type: String, default: "" }
}, { _id: false });

const agendaItemSchema = new mongoose.Schema({
  itemNo: { type: String, default: "" },
  agendaTopic: { type: String, default: "" },
  owner: { type: String, default: "" }
}, { _id: false });

const discussionSchema = new mongoose.Schema({
  agendaId: { type: String, default: "" },
  keyDiscussionPoints: { type: String, default: "" },
  decisionTaken: { type: String, default: "" }
}, { _id: false });

const actionItemSchema = new mongoose.Schema({
  srNo: { type: String, default: "" },
  task: { type: String, default: "" },
  assignedTo: { type: String, default: "" },
  priority: { type: String, enum: ["High", "Medium", "Low", ""], default: "" },
  deadline: { type: Date },
  status: { type: String, enum: ["Open", "In Progress", "Closed", "pending", "done"], default: "Open" }
}, { _id: true });

const riskSchema = new mongoose.Schema({
  srNo: { type: String, default: "" },
  risk: { type: String, default: "" },
  impact: { type: String, enum: ["High", "Medium", "Low", ""], default: "" },
  owner: { type: String, default: "" },
  resolutionPlan: { type: String, default: "" }
}, { _id: false });

const approvalSchema = new mongoose.Schema({
  subject: { type: String, default: "" },
  approvedBy: { type: String, default: "" },
  date: { type: Date }
}, { _id: false });

const momSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: "Meeting", required: true, unique: true, index: true },

  // 1. Meeting Details
  meetingTitle: { type: String, default: "" },
  meetingType: { type: String, default: "" },
  date: { type: Date },
  time: { type: String, default: "" },
  duration: { type: String, default: "" },
  venue: { type: String, default: "" },
  calledBy: { type: String, default: "" },
  chairedBy: { type: String, default: "" },
  preparedBy: { type: String, default: "" },
  referenceId: { type: String, default: "" },

  // 2. Attendees & Absentees
  attendeesList: { type: [attendeeSchema], default: [] },
  absenteesList: { type: [absenteeSchema], default: [] },

  // 3. Meeting Objective
  objective: { type: String, default: "" },

  // 4. Agenda Items
  agendaItemsList: { type: [agendaItemSchema], default: [] },

  // 5. Discussion Summary
  discussionSummary: { type: [discussionSchema], default: [] },

  // 6. Action Items Tracker
  actionItems: { type: [actionItemSchema], default: [] },

  // 7. Risks / Issues Raised
  risks: { type: [riskSchema], default: [] },

  // 8. Approvals / Confirmations
  approvals: { type: [approvalSchema], default: [] },

  // 9. Next Meeting Schedule
  nextMeetingDate: { type: Date },
  nextMeetingTime: { type: String, default: "" },
  nextMeetingPurpose: { type: String, default: "" },

  // 10. Closing Remarks
  closingRemarks: { type: String, default: "" },

  // 11. Prepared & Approved By (Sign-offs)
  signOffPreparedBy: { type: String, default: "" },
  signOffReviewedBy: { type: String, default: "" },
  signOffApprovedBy: { type: String, default: "" },

  // Legacy/Other Fields
  summary: { type: String, default: "" },
  discussion: { type: String, default: "" },
  decisions: { type: String, default: "" },
  attendees: { type: [String], default: [] },

  contentHtml: { type: String, default: "" },
  docStatus: { type: String, enum: ["draft", "published"], default: "draft", index: true },
  publishedAt: { type: Date },
  version: { type: Number, default: 1 },
  attachments: { type: [mongoose.Schema.Types.ObjectId], ref: "Attachment", default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model("Mom", momSchema);