const Meeting = require("../models/Meeting");
const Mom = require("../models/Mom");
const Attachment = require("../models/Attachment");
const asyncHandler = require("../utils/asyncHandler");
const { syncActionItemsFromMom } = require("../services/actionItemService");
const { extractActionItemsFromHtml, mergeActionItems } = require("../services/momActionItemService");
const { internalEndMeeting } = require("./meetingController");

function participantToLabel(p) {
  if (!p) return "";
  if (typeof p === "string") return p;
  const name = String(p.name || "").trim();
  const email = String(p.email || "").trim();
  if (name && email) return `${name} <${email}>`;
  return name || email;
}

const createMom = asyncHandler(async (req, res) => {
  const { meetingId } = req.body || {};
  if (!meetingId) {
    res.status(400);
    throw new Error("meetingId is required");
  }
  const meeting = await Meeting.findOne({ _id: meetingId, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }
  const payload = req.body || {};
  try {
    const mom = await Mom.create({
      workspaceId: req.workspace._id,
      meetingId,
      createdBy: req.user._id,
      docStatus: "draft",
      meetingTitle: payload.meetingTitle || "",
      meetingType: payload.meetingType || "",
      date: payload.date || meeting.date || null,
      time: payload.time || meeting.startTime || "",
      duration: payload.duration || "",
      venue: payload.venue || meeting.location || "",
      calledBy: payload.calledBy || "",
      chairedBy: payload.chairedBy || "",
      preparedBy: payload.preparedBy || "",
      referenceId: payload.referenceId || "",
      attendeesList: Array.isArray(payload.attendeesList) ? payload.attendeesList : [],
      absenteesList: Array.isArray(payload.absenteesList) ? payload.absenteesList : [],
      objective: payload.objective || "",
      agendaItemsList: Array.isArray(payload.agendaItemsList) ? payload.agendaItemsList : [],
      discussionSummary: Array.isArray(payload.discussionSummary) ? payload.discussionSummary : [],
      actionItems: Array.isArray(payload.actionItems) ? payload.actionItems : [],
      risks: Array.isArray(payload.risks) ? payload.risks : [],
      approvals: Array.isArray(payload.approvals) ? payload.approvals : [],
      nextMeetingDate: payload.nextMeetingDate || null,
      nextMeetingTime: payload.nextMeetingTime || "",
      nextMeetingPurpose: payload.nextMeetingPurpose || "",
      closingRemarks: payload.closingRemarks || "",
      signOffPreparedBy: payload.signOffPreparedBy || "",
      signOffReviewedBy: payload.signOffReviewedBy || "",
      signOffApprovedBy: payload.signOffApprovedBy || "",
      summary: payload.summary || "",
      discussion: payload.discussion || "",
      decisions: payload.decisions || "",
      attendees: Array.isArray(payload.attendees) ? payload.attendees : [],
    });
    await syncActionItemsFromMom({ workspaceId: req.workspace._id, meetingId, mom });
    res.status(201).json(mom);
  } catch (err) {
    if (err?.code === 11000) {
      res.status(409);
      throw new Error("MOM already exists for this meeting");
    }
    throw err;
  }
});

const getMomByMeetingId = asyncHandler(async (req, res) => {
  const meetingId = req.params.meetingId;
  const meeting = await Meeting.findOne({ _id: meetingId, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }
  const mom = await Mom.findOne({ meetingId, workspaceId: req.workspace._id }).populate("attachments");
  res.json(mom);
});

const getMinutesDoc = asyncHandler(async (req, res) => {
  const meetingId = req.params.meetingId;
  const meeting = await Meeting.findOne({ _id: meetingId, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }
  const mom = await Mom.findOne({ meetingId, workspaceId: req.workspace._id }).populate("attachments");
  res.json({ meeting, mom });
});

const upsertMinutesDoc = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const meeting = await Meeting.findOne({ _id: meetingId, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  const isCreator = meeting.createdBy?.toString() === req.user._id.toString();
  const isParticipant = meeting.participants?.some(p => p.email === req.user.email);
  if (!isCreator && !isParticipant) {
    res.status(403);
    throw new Error("You do not have permission to edit this MOM");
  }

  const payload = req.body || {};
  console.log(`[Minutes] FULL PAYLOAD:`, JSON.stringify(payload));
  console.log(`[Minutes] SAVE REQUEST: Meeting=${meetingId}, User=${req.user.email}, Items=${payload.actionItems?.length || 0}`);

  const attachmentIds = payload.attachmentIds || [];
  const normalizedAttachmentIds = Array.isArray(attachmentIds) ? attachmentIds.map(String).filter(Boolean) : [];
  const nextStatus = payload.docStatus === "published" ? "published" : "draft";
  
  const generatedActionItems = extractActionItemsFromHtml({
    contentHtml: payload.contentHtml || "",
    fallbackDate: meeting.date,
  });
  
  const mergedActionItems = mergeActionItems({
    manualItems: payload.actionItems,
    generatedItems: generatedActionItems,
  });

  const $set = {
    attachments: normalizedAttachmentIds,
    docStatus: nextStatus,
    actionItems: mergedActionItems,
    lastUpdatedBy: req.user._id
  };

  const fields = [
    "meetingTitle", "meetingType", "date", "time", "duration", "venue", "calledBy", "chairedBy", "preparedBy", "referenceId",
    "attendeesList", "absenteesList", "objective", "agendaItemsList", "discussionSummary", "actionItems", "risks", "approvals",
    "nextMeetingDate", "nextMeetingTime", "nextMeetingPurpose", "closingRemarks",
    "signOffPreparedBy", "signOffReviewedBy", "signOffApprovedBy",
    "summary", "discussion", "decisions", "attendees", "contentHtml"
  ];

  fields.forEach((f) => {
    if (f === "actionItems") return;
    if (payload[f] !== undefined) {
      $set[f] = payload[f];
    }
  });

  if (nextStatus === "published") $set.publishedAt = new Date();

  const mom = await Mom.findOneAndUpdate(
    { meetingId, workspaceId: req.workspace._id },
    {
      $set,
      $inc: { version: 1 },
      $setOnInsert: {
        workspaceId: req.workspace._id,
        meetingId,
        createdBy: req.user._id,
      },
    },
    { upsert: true, new: true }
  ).populate("attachments");

  await syncActionItemsFromMom({ workspaceId: req.workspace._id, meetingId, mom });
  
  meeting.momContent = mom.contentHtml || "";
  await meeting.save();

  if (nextStatus === "published" && payload.isManual) {
    internalEndMeeting(meetingId).catch(err => {
      console.error(`[Minutes] Background report generation failed:`, err);
    });
  }

  console.log(`[Minutes] SAVE SUCCESS: Meeting=${meetingId}, ItemsCount=${mom.actionItems?.length || 0}`);
  res.json({ meeting, mom });
});

module.exports = { createMom, getMomByMeetingId, getMinutesDoc, upsertMinutesDoc };
