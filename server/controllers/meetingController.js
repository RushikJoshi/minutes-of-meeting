const crypto = require("crypto");
const Meeting = require("../models/Meeting");
const ActionItem = require("../models/ActionItem");
const asyncHandler = require("../utils/asyncHandler");
const googleCalendarService = require("../services/googleCalendarService");
const microsoftGraphService = require("../services/microsoftGraphService");
const zoomService = require("../services/zoomService");
const emailService = require("../services/emailService");
const PdfService = require("../services/pdfService");
const Mom = require("../models/Mom");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { generateMOMReport } = require("../services/autoMomService");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { resolveChromeExecutablePath } = require("../utils/chromePath");
const { buildMomHtml } = require("../utils/pdfTemplate");

function isEmailLike(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function generateInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}

function generateFallbackMeetingLink() {
  return `https://zoom.us/start/videomeeting`;
}

async function buildParticipant(raw, organizerUser) {
  if (!raw) return null;

  if (typeof raw === "string") {
    const email = normalizeEmail(raw);
    if (!isEmailLike(email)) return null;
    const matchedUser = await User.findOne({ email }).select("_id name email");
    const isOrganizer = organizerUser?.email && email === normalizeEmail(organizerUser.email);

    return {
      kind: matchedUser || isOrganizer ? "user" : "external",
      userId: matchedUser?._id || (isOrganizer ? organizerUser._id : undefined),
      email,
      name: matchedUser?.name || email.split("@")[0],
      inviteToken: generateInviteToken(),
      status: isOrganizer ? "joined" : "invited",
      rsvp: isOrganizer ? "yes" : "unknown",
      joinedAt:
        isOrganizer ? new Date() : undefined,
      invitationAcceptedAt:
        isOrganizer ? new Date() : undefined,
    };
  }

  if (!raw.email || !isEmailLike(raw.email)) return null;

  const email = normalizeEmail(raw.email);
  const isOrganizer = organizerUser?.email && email === normalizeEmail(organizerUser.email);
  const matchedUser = raw.userId ? await User.findById(raw.userId).select("_id name email") : await User.findOne({ email }).select("_id name email");

  return {
    kind: matchedUser || isOrganizer ? "user" : "external",
    userId: matchedUser?._id || (isOrganizer ? organizerUser._id : undefined),
    email,
    name: String(raw.name || matchedUser?.name || email.split("@")[0]).trim(),
    role: raw.role || (isOrganizer ? "owner" : "viewer"),
    inviteToken: raw.inviteToken || generateInviteToken(),
    status: raw.status || (isOrganizer ? "joined" : "invited"),
    rsvp: raw.rsvp || (isOrganizer ? "yes" : "unknown"),
    joinedAt: raw.joinedAt || (isOrganizer ? new Date() : undefined),
    invitationSentAt: raw.invitationSentAt,
    invitationAcceptedAt: raw.invitationAcceptedAt || (isOrganizer ? new Date() : undefined),
  };
}

async function normalizeParticipants({ rawParticipants, organizerUser }) {
  const list = Array.isArray(rawParticipants) ? rawParticipants : [];
  
  // Extract all emails to batch lookup users
  const emails = list.map(p => normalizeEmail(typeof p === 'string' ? p : p.email)).filter(Boolean);
  const matchedUsers = await User.find({ email: { $in: emails } }).select("_id name email");
  const userMap = new Map(matchedUsers.map(u => [u.email.toLowerCase(), u]));

  const organizerParticipant = organizerUser?.email
    ? await buildParticipant(
      {
        userId: organizerUser._id,
        email: organizerUser.email,
        name: organizerUser.name || organizerUser.email,
        role: "owner",
        status: "joined",
        rsvp: "yes",
      },
      organizerUser
    )
    : null;

  const mapped = [organizerParticipant];
  
  for (const raw of list) {
    const email = normalizeEmail(typeof raw === 'string' ? raw : raw.email);
    if (!email) continue;
    
    const matchedUser = userMap.get(email);
    const isOrganizer = organizerUser?.email && email === normalizeEmail(organizerUser.email);

    if (typeof raw === "string") {
      mapped.push({
        kind: matchedUser || isOrganizer ? "user" : "external",
        userId: matchedUser?._id || (isOrganizer ? organizerUser._id : undefined),
        email,
        name: matchedUser?.name || email.split("@")[0],
        inviteToken: generateInviteToken(),
        status: isOrganizer ? "joined" : "invited",
        rsvp: isOrganizer ? "yes" : "unknown",
        joinedAt: isOrganizer ? new Date() : undefined,
        invitationAcceptedAt: isOrganizer ? new Date() : undefined,
      });
    } else {
      mapped.push({
        kind: matchedUser || isOrganizer ? "user" : "external",
        userId: matchedUser?._id || (isOrganizer ? organizerUser._id : undefined),
        email,
        name: String(raw.name || matchedUser?.name || email.split("@")[0]).trim(),
        role: raw.role || (isOrganizer ? "owner" : "viewer"),
        inviteToken: raw.inviteToken || generateInviteToken(),
        status: raw.status || (isOrganizer ? "joined" : "invited"),
        rsvp: raw.rsvp || (isOrganizer ? "yes" : "unknown"),
        joinedAt: raw.joinedAt || (isOrganizer ? new Date() : undefined),
        invitationSentAt: raw.invitationSentAt,
        invitationAcceptedAt: raw.invitationAcceptedAt || (isOrganizer ? new Date() : undefined),
      });
    }
  }

  const seen = new Set();
  return mapped.filter((participant) => {
    if (!participant) return false;
    const key = participant.email;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ensureMeetingLink({ meetingType, platform, link }) {
  // CRITICAL: Replace ANY legacy Jitsi links with Zoom
  if (link && (link.includes("jit.si") || link.includes("jitsi"))) {
    console.log("[Platform] Replaced Jitsi link with Zoom fallback");
    return "";
  }

  if (link && link.trim()) return link;

  // Important: never return "new meeting" / "start meeting" fallbacks because that
  // creates separate meetings per participant and can incorrectly give host privileges.
  // If an integration didn't generate a real link, leave it blank and rely on the invite
  // flow + organizer to provide/attach the correct platform link later.
  if (meetingType === "online") return "";
  return "";
}

function getParticipantJoinUrl(meetingId, participant) {
  const { getPublicClientBaseUrl } = require("../utils/publicClientBase");
  const baseUrl = String(getPublicClientBaseUrl() || process.env.PUBLIC_CLIENT_BASE_URL || "http://localhost:5174").replace(/\/+$/, "");
  const inviteToken = participant?.inviteToken || generateInviteToken();
  return `${baseUrl}/join/${meetingId}?invite=${encodeURIComponent(inviteToken)}`;
}

function sanitizeParticipant(participant) {
  if (!participant) return participant;
  const raw = typeof participant.toObject === "function" ? participant.toObject() : { ...participant };
  delete raw.inviteToken;
  return raw;
}

function getInviteCcList(req) {
  const raw = process.env.MEETING_INVITE_CC || "";
  const configured = raw
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter((value) => isEmailLike(value));

  const organizer = req?.user?.email ? [normalizeEmail(req.user.email)] : [];
  return Array.from(new Set([...organizer, ...configured]));
}

async function sendInvitations({ meeting, participants, cc = [], sender }) {
  if (!Array.isArray(participants) || participants.length === 0) {
    return { sent: 0, failed: [] };
  }

  const recipients = participants.map((participant) => ({
    email: participant.email,
    joinLink: getParticipantJoinUrl(meeting._id, participant),
  }));

  const result = await emailService.sendMeetingInvitation({ meeting, recipients, cc, sender });
  const sentEmails = new Set(
    recipients
      .map((recipient) => recipient.email)
      .filter((email) => !result.failed?.some((failed) => failed.email === email))
  );

  if (sentEmails.size > 0) {
    meeting.participants = meeting.participants.map((participant) => {
      if (sentEmails.has(participant.email)) {
        participant.invitationSentAt = new Date();
        if (participant.status !== "joined") {
          participant.status = "invited";
        }
      }
      return participant;
    });
    await meeting.save();
  }

  return result;
}

async function withTimeout(promise, timeoutMs, timeoutValue) {
  let timeoutId;
  const timer = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(timeoutValue), timeoutMs);
  });

  try {
    return await Promise.race([promise, timer]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function getPublicMeetingPayload(meeting, participant) {
  const rawMeetingLink = String(meeting?.meetingLink || meeting?.link || "").trim();
  const safeMeetingLink =
    rawMeetingLink.includes("zoom.us/test") ||
    rawMeetingLink.includes("zoom.us/start/videomeeting") ||
    rawMeetingLink.includes("meet.google.com/new")
      ? ""
      : rawMeetingLink;
  return {
    _id: meeting._id,
    title: meeting.title,
    agenda: meeting.agenda,
    description: meeting.description,
    date: meeting.date,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    timezone: meeting.timezone,
    location: meeting.location,
    type: meeting.type,
    status: meeting.status,
    meetingLink: safeMeetingLink,
    pdfUrl: meeting.pdfUrl,
    participant: participant
      ? {
        email: participant.email,
        name: participant.name,
        status: participant.status,
      }
      : null,
  };
}

async function internalEndMeeting(meetingId) {
  try {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      console.error(`[Lifecycle] ❌ Meeting ${meetingId} not found`);
      return;
    }

    if (meeting.status === "completed" && meeting.isMomGenerated) {
      console.log(`[Lifecycle] ℹ️ Meeting ${meetingId} already completed and processed.`);
      return;
    }

    console.log(`[Lifecycle] 🚀 Processing end of meeting: "${meeting.title}" (${meetingId})`);

    meeting.status = "completed";
    meeting.actualEndTime = new Date();
    if (!meeting.endTime) {
      meeting.endTime = meeting.actualEndTime;
    }

    // 1. Attendance
    console.log(`[Lifecycle] 👥 Generating attendance...`);
    meeting.participants.forEach(p => {
      if (p.isActive) {
        p.isActive = false;
        p.lastActiveAt = meeting.actualEndTime;
        p.leftAt = meeting.actualEndTime;
      }
    });
    await generateAttendance(meeting);

    // 2. MOM (Generate only once)
    if (!meeting.isMomGenerated) {
      console.log(`[Lifecycle] 📝 Generating MOM...`);
      await generateMOM(meeting);
      meeting.isMomGenerated = true;
    } else {
      console.log(`[Lifecycle] ℹ️ MOM already generated.`);
    }

    // 3. PDF
    console.log(`[Lifecycle] 📄 Generating PDF...`);
    await generatePDF(meeting);

    await meeting.save();
    console.log(`[Lifecycle] ✅ Meeting ${meetingId} fully processed and saved.`);
  } catch (err) {
    console.error(`[Lifecycle] ❌ Fatal error in internalEndMeeting for ${meetingId}:`, err);
  }
}

async function generateAttendance(meeting) {
  console.log(`[Lifecycle] Generating attendance for ${meeting._id}`);
  meeting.attendance = (meeting.participants || []).map((p) => ({
    name: p.name || p.email,
    email: p.email,
    status: p.joinedAt ? "Present" : "Absent",
    joinedAt: p.joinedAt || null,
    leftAt: p.leftAt || (p.isActive ? meeting.endTime || null : p.lastActiveAt || null),
  }));
}

async function generateMOM(meeting) {
  console.log(`[Lifecycle] Generating MOM for ${meeting._id}`);
  // Use the auto-generator if possible, or a fallback
  try {
    const res = await generateMOMReport(meeting._id, meeting.workspaceId, meeting.createdBy);
    if (res?.mom) {
      meeting.mom = {
        summary: res.mom.summary || res.mom.objective || "Meeting concluded.",
        discussion: res.mom.discussion || "",
        decisions: res.mom.decisions || "",
        actionItems: (res.mom.actionItems || []).map(item => ({
          task: item.task,
          owner: item.assignedTo,
          deadline: item.deadline
        }))
      };
    }
  } catch (err) {
    console.warn(`[Lifecycle] Auto-MOM failed, using fallback:`, err.message);
    meeting.mom = {
      summary: meeting.agenda || "Meeting discussion summary...",
      decisions: [],
      actionItems: []
    };
  }
}

async function generatePDF(meeting) {
  console.log(`[Lifecycle] Generating PDF for ${meeting._id}`);
  const uploadsDir = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(__dirname, "..", "uploads", `${meeting._id}.pdf`);

  const chromeExecutablePath = resolveChromeExecutablePath();
  const launchOptions = {
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    ...(chromeExecutablePath ? { executablePath: chromeExecutablePath } : {}),
  };

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    const apiBase = process.env.PUBLIC_API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

    const momDoc = await Mom.findOne({
      meetingId: meeting._id,
      workspaceId: meeting.workspaceId,
    }).populate("attachments");

    const momPayload = momDoc ? momDoc.toObject() : {};
    const mergedMom = { ...(meeting.mom || {}), ...momPayload };

    const html = buildMomHtml({
      meeting,
      mom: mergedMom,
      baseUrl: apiBase
    });

    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });

    fs.writeFileSync(filePath, pdfBuffer);
    meeting.pdfUrl = `/uploads/${meeting._id}.pdf`;
    console.log(`[Lifecycle] 📄 PDF generated and saved to ${meeting.pdfUrl}`);
    return true;
  } catch (err) {
    console.error(`[Lifecycle] ❌ PDF Generation failed:`, err.message);
    return false;
  } finally {
    await browser.close();
  }
}

const createMeeting = asyncHandler(async (req, res) => {
  let {
    title,
    agenda,
    description,
    date,
    startTime,
    duration,
    participants,
    priority,
    recurring,
    timezone,
    reminderMinutes,
    type,
    platform,
    location,
  } = req.body;

  if (!title) {
    res.status(400);
    throw new Error("title is required");
  }

  // Set default duration if missing
  duration = Number(duration) || 60;
  if (duration <= 0) {
    res.status(400);
    throw new Error("Duration must be greater than 0");
  }

  // Parse startTime
  let start = new Date(startTime);
  if (isNaN(start.getTime())) {
    res.status(400);
    throw new Error("Invalid start time");
  }

  // Calculate endTime
  const end = new Date(start.getTime() + duration * 60000);
  const endTime = end;

  console.log("Creating Meeting - Start:", start);
  console.log("Creating Meeting - End:", end);

  if (type === "offline" && !location) {
    res.status(400);
    throw new Error("location is required for offline meetings");
  }

  if (type === "online" && !platform) {
    res.status(400);
    throw new Error("platform must be selected for online meetings");
  }

  const normalizedParticipants = await normalizeParticipants({
    rawParticipants: participants,
    organizerUser: req.user,
  });

  let meetLink = "";
  let meetingHostLink = "";
  let googleEventId = "";
  let outlookEventId = "";

  if (type === "online") {
    if (platform === "google-meet") {
      try {
        const googleRes = await googleCalendarService.createGoogleMeetEvent({
          userId: req.user._id,
          meeting: {
            title,
            agenda,
            date,
            startTime,
            endTime,
            participants: normalizedParticipants,
            workspaceId: req.workspace._id,
            timezone,
          },
        });
        if (googleRes?.meetLink) {
          meetLink = googleRes.meetLink;
          googleEventId = googleRes.eventId;
        }
      } catch (err) {
        console.warn("Google Sync Failed:", err.message);
      }
    } else if (platform === "zoom") {
      try {
        const zoomRes = await zoomService.createZoomMeeting({
          userId: req.user._id,
          meeting: { title, agenda, date, startTime, endTime, duration },
        });
        if (zoomRes?.meetLink) {
          meetLink = zoomRes.meetLink;
          if (zoomRes.hostLink) {
            meetingHostLink = zoomRes.hostLink;
          }
        }
      } catch (err) {
        console.warn("Zoom Sync Failed:", err.message);
      }
    } else if (platform === "teams") {
      try {
        const teamsRes = await microsoftGraphService.createOutlookEvent({
          userId: req.user._id,
          meeting: {
            title,
            agenda,
            date,
            startTime,
            endTime,
            timezone,
            participants: normalizedParticipants,
            workspaceId: req.workspace._id,
          },
        });
        if (teamsRes?.meetLink) {
          meetLink = teamsRes.meetLink;
          outlookEventId = teamsRes.eventId || "";
        }
      } catch (err) {
        console.warn("Teams Sync Failed:", err.message);
      }
    }
  }

  meetLink = ensureMeetingLink({ meetingType: type || "online", platform, link: meetLink });

  const meeting = await Meeting.create({
    workspaceId: req.workspace._id,
    title,
    agenda,
    description,
    date: date ? new Date(date) : undefined,
    startTime: start,
    endTime: end,
    duration,
    timezone,
    priority,
    recurring,
    type: type || "online",
    platform: platform || "none",
    location: location || "",
    participants: normalizedParticipants,
    reminderMinutes,
    createdBy: req.user._id,
    link: meetLink,
    meetingLink: meetLink,
    graph: {
      organizerUserId: req.user._id,
      googleEventId,
      googleMeetLink: googleEventId ? meetLink : "",
      outlookEventId,
      zoomStartLink: meetingHostLink || "",
    },
  });

  if (meetingHostLink) {
    try {
      await emailService.sendMeetingInvitation({
        meeting,
        recipients: [{ email: req.user.email, hostLink: meetingHostLink }],
        cc: getInviteCcList(req),
        sender: req.user,
      });
    } catch (err) {
      console.warn("Host invite email failed:", err?.message || err);
    }
  }

  const invitedParticipants = meeting.participants.filter(
    (participant) => participant.email !== normalizeEmail(req.user.email)
  );

  // Background the invitation process to respond faster to the user
  if (invitedParticipants.length > 0) {
    sendInvitations({
      meeting,
      participants: invitedParticipants,
      cc: getInviteCcList(req),
      sender: req.user,
    }).catch((err) => {
      console.error("Background invitation failed:", err);
    });
  }

  res.status(201).json({
    ...meeting.toObject(),
    participants: meeting.participants.map(sanitizeParticipant),
    inviteSummary: { sent: 0, status: "processing" },
  });
});

const getMeetings = asyncHandler(async (req, res) => {
  const { search, date, status, priority } = req.query;
  const query = { workspaceId: req.workspace._id };
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { agenda: { $regex: search, $options: "i" } },
    ];
  }
  if (date) {
    const d = new Date(date);
    query.date = {
      $gte: new Date(d.setHours(0, 0, 0, 0)),
      $lt: new Date(d.setHours(23, 59, 59, 999)),
    };
  }
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const meetings = await Meeting.find(query).sort({ date: 1, startTime: 1 });
  res.json(
    meetings.map((meeting) => ({
      ...meeting.toObject(),
      participants: meeting.participants.map(sanitizeParticipant),
    }))
  );
});

const getMeetingById = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  res.json({
    ...meeting.toObject(),
    participants: meeting.participants.map(sanitizeParticipant),
  });
});

const updateMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  const previousEmails = new Set(meeting.participants.map((participant) => participant.email));
  const payload = { ...req.body };

  if (payload.participants) {
    payload.participants = await normalizeParticipants({
      rawParticipants: payload.participants,
      organizerUser: req.user,
    });
  }

  if (payload.startTime || payload.duration) {
    const start = new Date(payload.startTime || meeting.startTime);
    const dur = Number(payload.duration || meeting.duration || 60);
    if (!isNaN(start.getTime())) {
      payload.startTime = start;
      payload.endTime = new Date(start.getTime() + dur * 60000);
      payload.duration = dur;
    }
  }

  Object.assign(meeting, payload);
  await meeting.save();

  if (Array.isArray(payload.participants)) {
    const newParticipants = meeting.participants.filter(
      (participant) =>
        participant.email !== normalizeEmail(req.user.email) && !previousEmails.has(participant.email)
    );
    if (newParticipants.length) {
      await sendInvitations({
        meeting,
        participants: newParticipants,
        cc: getInviteCcList(req),
        sender: req.user,
      });
    }
  }

  res.json({
    ...meeting.toObject(),
    participants: meeting.participants.map(sanitizeParticipant),
  });
});

const cancelMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }
  meeting.status = "cancelled";
  await meeting.save();
  res.json({
    message: "Meeting cancelled",
    meeting: {
      ...meeting.toObject(),
      participants: meeting.participants.map(sanitizeParticipant),
    },
  });
});

const deleteMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  await Promise.all([
    Mom.deleteOne({ meetingId: meeting._id, workspaceId: req.workspace._id }),
    ActionItem.deleteMany({ meetingId: meeting._id, workspaceId: req.workspace._id }),
    Notification.deleteMany({ entityType: "meeting", entityId: meeting._id, workspaceId: req.workspace._id }),
    meeting.deleteOne(),
  ]);

  res.json({ message: "Meeting deleted" });
});

const downloadMomPdf = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id);
  const mom = (await Mom.findOne({ meetingId: req.params.id })) || {};
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }
  const pdfBuffer = await PdfService.generateMomPdf(mom, meeting);
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=MOM_${meeting._id}.pdf`,
    "Content-Length": pdfBuffer.length,
  });
  res.send(pdfBuffer);
});

const inviteParticipants = asyncHandler(async (req, res) => {
  const { emails } = req.body;
  if (!Array.isArray(emails) || emails.length === 0) {
    res.status(400);
    throw new Error("emails array is required");
  }

  const meeting = await Meeting.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  meeting.meetingLink = ensureMeetingLink({
    meetingType: meeting.type,
    platform: meeting.platform,
    link: meeting.meetingLink || meeting.link,
  });
  meeting.link = meeting.meetingLink;

  const existing = new Set(meeting.participants.map((participant) => participant.email));
  const participantsToInvite = [];

  for (const rawEmail of emails) {
    const email = normalizeEmail(rawEmail);
    if (!isEmailLike(email) || existing.has(email)) continue;
    const matchedUser = await User.findOne({ email }).select("_id name email");

    const participant = {
      kind: matchedUser ? "user" : "external",
      userId: matchedUser?._id,
      email,
      name: matchedUser?.name || email.split("@")[0],
      inviteToken: generateInviteToken(),
      status: "invited",
      rsvp: "unknown",
    };

    meeting.participants.push(participant);
    participantsToInvite.push(participant);
    existing.add(email);
  }

  await meeting.save();

  const inviteResult = await sendInvitations({
    meeting,
    participants: participantsToInvite,
    cc: getInviteCcList(req),
    sender: req.user,
  });

  res.json({
    message: `${participantsToInvite.length} participant(s) invited`,
    invited: participantsToInvite.map((participant) => participant.email),
    participants: meeting.participants.map(sanitizeParticipant),
    inviteSummary: inviteResult,
  });
});

const getTodayMeetings = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const meetings = await Meeting.find({
    workspaceId: req.workspace._id,
    date: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
  });
  res.json(
    meetings.map((meeting) => ({
      ...meeting.toObject(),
      participants: meeting.participants.map(sanitizeParticipant),
    }))
  );
});

const joinMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  const email = normalizeEmail(req.user.email);
  const participant = meeting.participants.find((entry) => entry.email === email);

  if (!participant) {
    res.status(403);
    throw new Error("You are not invited to this meeting");
  }

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  if (participant.isActive && participant.lastActiveAt > twoHoursAgo) {
    return res.status(400).json({
      message: "You are already active in this meeting on another device/tab.",
      alreadyJoined: true,
    });
  }

  participant.status = "joined";
  participant.rsvp = "yes";
  participant.joinedAt = participant.joinedAt || new Date();
  participant.lastJoinedAt = new Date();
  participant.invitationAcceptedAt = participant.invitationAcceptedAt || new Date();
  participant.isActive = true;
  participant.lastActiveAt = new Date();
  participant.leftAt = undefined;
  await meeting.save();

  res.json({
    message: "Joined successfully",
    meeting: {
      ...meeting.toObject(),
      participants: meeting.participants.map(sanitizeParticipant),
    },
  });
});

const leaveMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  const participant = meeting.participants.find(
    (entry) => entry.email === normalizeEmail(req.user.email)
  );
  if (participant) {
    participant.isActive = false;
    participant.lastActiveAt = new Date();
    participant.leftAt = new Date();
    await meeting.save();
  }

  res.json({ message: "Left successfully" });
});

const updateMeetingAgenda = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  if (req.body.agenda !== undefined) {
    meeting.agenda = req.body.agenda;
  }
  if (req.body.agendaItems !== undefined) {
    meeting.agendaItems = req.body.agendaItems;
  }

  await meeting.save();
  res.json({ success: true, data: meeting });
});

const getPublicJoinDetails = asyncHandler(async (req, res) => {
  const inviteToken = String(req.query.invite || "").trim();
  const meeting = await Meeting.findById(req.params.id).select(
    "title agenda description date startTime endTime meetingLink link location status timezone type participants"
  );

  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  if (!inviteToken) {
    res.status(400);
    throw new Error("Invite token is required");
  }

  const participant = meeting.participants.find((entry) => entry.inviteToken === inviteToken);
  if (!participant) {
    res.status(403);
    throw new Error("Invalid or expired invite link");
  }

  res.json(getPublicMeetingPayload(meeting, participant));
});

const acceptPublicMeetingInvite = asyncHandler(async (req, res) => {
  const inviteToken = String(req.body.inviteToken || "").trim();
  const meeting = await Meeting.findById(req.params.id);

  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  const participant = meeting.participants.find((entry) => entry.inviteToken === inviteToken);
  if (!participant) {
    res.status(403);
    throw new Error("Invalid or expired invite link");
  }

  participant.status = "joined";
  participant.rsvp = "yes";
  participant.joinedAt = participant.joinedAt || new Date();
  participant.lastJoinedAt = new Date();
  participant.invitationAcceptedAt = new Date();
  participant.lastActiveAt = new Date();
  participant.isActive = true;
  participant.leftAt = undefined;

  await meeting.save();

  const rawMeetingLink = String(meeting.meetingLink || meeting.link || "").trim();
  const safeMeetingLink =
    rawMeetingLink.includes("zoom.us/test") ||
    rawMeetingLink.includes("zoom.us/start/videomeeting") ||
    rawMeetingLink.includes("meet.google.com/new")
      ? ""
      : rawMeetingLink;

  res.json({
    message: "Invite accepted successfully",
    meeting: getPublicMeetingPayload(meeting, participant),
    meetingLink: safeMeetingLink,
  });
});

const startMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  if (meeting.status === "completed" || meeting.status === "cancelled") {
    res.status(400);
    throw new Error(`Cannot start a ${meeting.status} meeting`);
  }

  meeting.status = "ongoing";
  if (!meeting.actualStartTime) {
    meeting.actualStartTime = new Date();
  }
  await meeting.save();

  console.log("Meeting Started:", meeting.title);

  res.json({
    message: "Meeting started",
    meeting,
  });
});

const endMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, workspaceId: req.workspace._id });
  if (!meeting) {
    res.status(404);
    throw new Error("Meeting not found");
  }

  await internalEndMeeting(meeting._id);
  const updatedMeeting = await Meeting.findById(meeting._id);

  res.json({
    message: "Meeting ended and reports generated",
    meeting: updatedMeeting,
  });
});

const testLifecycle = asyncHandler(async (req, res) => {
  const meetingId = req.params.id;
  console.log(`[Lifecycle] Manual trigger for ${meetingId}`);
  await internalEndMeeting(meetingId);
  const meeting = await Meeting.findById(meetingId);
  res.json({ message: "Lifecycle processed", meeting });
});

const downloadPdf = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id);

  if (!meeting) return res.status(404).json({ message: "Meeting not found" });

  const forceRegen = String(req.query.regen || "").toLowerCase();
  const shouldRegen = forceRegen === "1" || forceRegen === "true" || forceRegen === "yes";

  if (
    shouldRegen ||
    !meeting.pdfUrl ||
    !fs.existsSync(path.join(__dirname, "..", meeting.pdfUrl))
  ) {
    const ok = await generatePDF(meeting);
    if (ok) {
      await meeting.save();
    }
  }

  if (!meeting.pdfUrl) return res.status(404).json({ message: "PDF not found" });

  const filePath = path.join(__dirname, "..", meeting.pdfUrl);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found on disk" });

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.sendFile(filePath);
});

const getAutoMomReport = asyncHandler(async (req, res) => {
  const reportData = await generateMOMReport(req.params.id, req.workspace._id, req.user._id);
  res.json(reportData);
});

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  cancelMeeting,
  deleteMeeting,
  getTodayMeetings,
  downloadMomPdf,
  joinMeeting,
  leaveMeeting,
  inviteParticipants,
  updateMeetingAgenda,
  getPublicJoinDetails,
  acceptPublicMeetingInvite,
  endMeeting,
  internalEndMeeting,
  startMeeting,
  getAutoMomReport,
  downloadPdf,
  testLifecycle,
};
