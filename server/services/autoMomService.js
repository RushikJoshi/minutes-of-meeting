const Meeting = require("../models/Meeting");
const Mom = require("../models/Mom");
const ActionItem = require("../models/ActionItem");
const aiService = require("./aiService");

/**
 * Extracts attendance data from meeting participants
 */
function buildAttendance(meeting) {
  const participants = meeting.participants || [];
  const meetingStartTime = meeting.startTime || meeting.date || meeting.createdAt; // fallback

  const attendanceDetails = [];
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let leftEarlyCount = 0;

  for (const p of participants) {
    let status = "Absent";
    let joinTime = p.joinedAt ? new Date(p.joinedAt) : null;
    let durationMinutes = 0;

    if (p.status === "joined" && joinTime) {
      status = "Present";

      // Compute if late
      // If joined > 5 mins after start
      if (meetingStartTime) {
        const diffMins = (joinTime - meetingStartTime) / (1000 * 60);
        if (diffMins > 5) {
          status = "Late";
          lateCount++;
        } else {
          presentCount++;
        }
      } else {
        presentCount++;
      }

      // Check if left early based on active status vs meeting end time
      // For now, if isActive is false before meeting ends, we could flag it.
      if (!p.isActive) {
        // Left early logic can go here if needed
      }

      if (p.lastActiveAt) {
        durationMinutes = Math.round((new Date(p.lastActiveAt) - joinTime) / (1000 * 60));
      }
    } else {
      absentCount++;
    }

    attendanceDetails.push({
      name: p.name || p.email,
      email: p.email,
      status,
      joinTime: joinTime ? joinTime.toISOString() : null,
      leaveTime: p.lastActiveAt ? new Date(p.lastActiveAt).toISOString() : null,
      durationMinutes,
    });
  }

  return {
    summary: {
      total: participants.length,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      leftEarly: leftEarlyCount,
    },
    details: attendanceDetails
  };
}

/**
 * Generates structured MOM report and saves to Mom DB
 */
async function generateMOMReport(meetingId, workspaceId, userId) {
  const meeting = await Meeting.findOne({ _id: meetingId, workspaceId });
  if (!meeting) throw new Error("Meeting not found");

  const attendance = buildAttendance(meeting);

  // Attempt to generate AI summary if notes exist
  let aiSummary = null;
  if (meeting.notes && meeting.notes.length > 50) {
    try {
      console.log(`[AI] Summarizing meeting: ${meeting._id}`);
      aiSummary = await aiService.summarize(meeting.notes);
    } catch (err) {
      console.warn(`[AI] Summarization failed:`, err.message);
    }
  }

  // Map existing action items if any
  const existingActionItems = await ActionItem.find({ meetingId, workspaceId });
  const actionItemsMapped = existingActionItems.map(item => ({
    srNo: item._id.toString(),
    task: item.task,
    assignedTo: item.assignedTo,
    priority: item.priority || "Medium",
    deadline: item.deadline,
    status: item.status
  }));

  // Create the Mom document with structured data
  const mom = await Mom.findOneAndUpdate(
    { meetingId, workspaceId },
    {
      $set: {
        meetingTitle: meeting.title,
        meetingType: meeting.type,
        date: meeting.date,
        time: meeting.startTime,
        duration: meeting.duration ? `${meeting.duration} mins` : "",
        venue: meeting.location || meeting.platform || "",
        calledBy: "System Auto-Generated",
        objective: meeting.agenda || meeting.description || "",

        // AI Summary Integration
        summary: aiSummary?.summary || meeting.description || "",
        discussion: aiSummary?.discussion || "",
        decisions: aiSummary?.decisions || "",

        actionItems: actionItemsMapped,
        attendeesList: attendance.details.map((d, i) => ({
          srNo: String(i + 1),
          name: d.name,
          status: d.status
        })),
      },
      $setOnInsert: {
        createdBy: userId,
        docStatus: "published",
        publishedAt: new Date(),
      }
    },
    { upsert: true, new: true }
  );

  return { meeting, mom, attendance };
}

module.exports = { generateMOMReport, buildAttendance };
