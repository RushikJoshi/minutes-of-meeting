export function toYmd(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function combineMeetingDateTime(meeting, edge = "start") {
  const date = edge === "end" ? meeting?.endTime : meeting?.startTime;
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function meetingToCalendarEvent(meeting) {
  const start = combineMeetingDateTime(meeting, "start");
  const end = combineMeetingDateTime(meeting, "end") || start;
  const participantCount = Array.isArray(meeting?.participants) ? meeting.participants.length : 0;

  return {
    id: meeting._id,
    title: meeting.title,
    start: start || meeting.date,
    end: end || meeting.date,
    allDay: !meeting.startTime,
    extendedProps: {
      meeting,
      participantCount,
    },
  };
}

export function formatMeetingTime(meeting) {
  if (!meeting?.startTime) return "Time not set";
  if (typeof meeting.startTime === "string" && meeting.startTime.includes(":")) {
    if (meeting.endTime) return `${meeting.startTime} - ${meeting.endTime}`;
    return meeting.startTime;
  }
  
  const start = new Date(meeting.startTime);
  const end = meeting.endTime ? new Date(meeting.endTime) : null;
  const format = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (end) return `${format(start)} - ${format(end)}`;
  return format(start);
}

export function participantLabel(participant) {
  if (!participant) return "";
  return participant.name ? `${participant.name} (${participant.email})` : participant.email;
}

export function statusTone(status) {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "cancelled":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "ongoing":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "scheduled": return "bg-blue-100 text-blue-700";
    case "ongoing": return "bg-emerald-100 text-emerald-700";
    case "completed": return "bg-slate-100 text-slate-700";
    case "cancelled": return "bg-rose-100 text-rose-700";
    default: return "bg-slate-100 text-slate-600";
  }
};

/**
 * Generates the default HTML template for a new MOM document.
 * Ensuring cells have <p></p> to ensure they are focusable in Tiptap.
 */
export const getDefaultMomTemplate = (meeting, creatorName = "Admin") => {
  const dateStr = meeting?.date ? new Date(meeting.date).toLocaleDateString() : "______________________";
  const timeStr = meeting?.startTime || "______________________";
  const participantNames = meeting?.participants?.map(p => p.name || p.email).join(", ") || "______________________";
  const title = (meeting?.title || "MEETING TITLE").toUpperCase();

  return `
    <h1 style="text-align: center;"><u>${title}</u></h1>
    <br/>
    <div style="margin-bottom: 20px;">
      <p>📅 <strong>Date of Meeting :</strong> <span>${dateStr}</span></p>
      <p>⏰ <strong>Time of Meeting :</strong> <span>${timeStr}</span></p>
      <p>👤 <strong>From :</strong> <span>${creatorName}</span></p>
      <p>👥 <strong>To :</strong> <span>${participantNames}</span></p>
    </div>
    <br/>
    <p style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">
      (Tip: Click inside table cell → then use <strong>+</strong> buttons)
    </p>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
      <thead>
        <tr style="background-color: #f8fafc;">
          <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; width: 50px;"><p>#</p></th>
          <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left;"><p>Discussion / Tasks</p></th>
          <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; width: 150px;"><p>Complete Date</p></th>
          <th style="border: 1px solid #e2e8f0; padding: 12px; text-align: left; width: 150px;"><p>Responsible</p></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border: 1px solid #e2e8f0; padding: 12px;"><p>1</p></td>
          <td style="border: 1px solid #e2e8f0; padding: 12px;"><p>${meeting?.agenda || ""}</p></td>
          <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
          <td style="border: 1px solid #e2e8f0; padding: 12px;"><p></p></td>
        </tr>
      </tbody>
    </table>
    <br/>
    <div style="margin-top: 20px;">
      <p>📝 <strong>Additional Notes:</strong></p>
      <p><span>${meeting?.description || "______________________________________________"}</span></p>
    </div>
    <br/><br/>
    <div style="display: flex; justify-content: space-between;">
      <p><strong>Prepared By :</strong> <span>${creatorName}</span></p>
      <p><strong>Approved By :</strong> <span>______________________</span></p>
    </div>
    <p></p>
  `;
};
