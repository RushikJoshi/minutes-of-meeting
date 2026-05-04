const Meeting = require("../models/Meeting");
const Mom = require("../models/Mom");
const ActionItem = require("../models/ActionItem");
const EditorTemplate = require("../models/EditorTemplate");
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
    const joinSource = p.lastJoinedAt || p.joinedAt;
    let joinTime = joinSource ? new Date(joinSource) : null;
    const leaveSource = p.leftAt || p.lastActiveAt;
    const leaveTime = leaveSource ? new Date(leaveSource) : null;
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

      if (leaveTime) {
        durationMinutes = Math.round((leaveTime - joinTime) / (1000 * 60));
      }
    } else {
      absentCount++;
    }

    attendanceDetails.push({
      name: p.name || p.email,
      email: p.email,
      status,
      joinTime: joinTime ? joinTime.toISOString() : null,
      leaveTime: leaveTime ? leaveTime.toISOString() : null,
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
  const meeting = await Meeting.findOne({ _id: meetingId, workspaceId }).populate("createdBy");
  if (!meeting) throw new Error("Meeting not found");

  const attendance = buildAttendance(meeting);
  const absentList = attendance.details.filter((d) => d.status === "Absent");
  
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

  // Fetch Editor Template
  let contentHtml = "";
  const template = await EditorTemplate.findOne({ workspaceId });
  
  if (template && template.contentHtml && template.contentHtml.length > 10) {
    contentHtml = template.contentHtml;
    
    // Replace Placeholders
    const replacements = {
      "[DATE]": meeting.date ? new Date(meeting.date).toLocaleDateString() : "TBD",
      "[TIME]": meeting.startTime ? new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD",
      "[CREATOR]": meeting.createdBy?.name || "Admin",
      "[PARTICIPANTS]": attendance.details.map(d => d.name || d.email).join(", "),
      "[MEETING_TITLE]": meeting.title || "Untitled Meeting",
      "[AGENDA]": meeting.agenda || meeting.description || "No agenda specified",
    };

    Object.entries(replacements).forEach(([placeholder, value]) => {
      // Use regex with global flag to replace all occurrences
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      contentHtml = contentHtml.replace(regex, value);
    });
  } else {
    // Fallback if no template exists
    contentHtml = `
      <h1 style="text-align: center;">Minutes of Meeting</h1>
      <div style="text-align: right;">
        <p><strong>Date of meeting:</strong> ${meeting.date ? new Date(meeting.date).toLocaleDateString() : "TBD"}</p>
        <p><strong>Time of meeting:</strong> ${meeting.startTime ? new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD"}</p>
        <p><strong>From:</strong> ${meeting.createdBy?.name || "Admin"}</p>
        <p><strong>To:</strong> ${attendance.details.map(d => d.name || d.email).join(", ")}</p>
      </div>
      <br/>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">Serial Number</th>
            <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">Discussion/Tasks</th>
            <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">Task Complete Date</th>
            <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;">Responsible Person</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 12px;">1</td>
            <td style="border: 1px solid #e2e8f0; padding: 12px;">${meeting.agenda || ""}</td>
            <td style="border: 1px solid #e2e8f0; padding: 12px;"></td>
            <td style="border: 1px solid #e2e8f0; padding: 12px;"></td>
          </tr>
        </tbody>
      </table>
      <p></p>
    `;
  }

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
          email: d.email,
          status: d.status === "Absent" ? "Absent" : d.status === "Late" ? "Late" : "Present",
          joinedAt: d.joinTime ? new Date(d.joinTime) : undefined,
          leftAt: d.leaveTime ? new Date(d.leaveTime) : undefined,
          durationMinutes: typeof d.durationMinutes === "number" ? d.durationMinutes : undefined,
        })),
        absenteesList: absentList.map((d) => ({
          name: d.name,
          reason: "",
        })),
        contentHtml
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
