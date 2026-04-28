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
