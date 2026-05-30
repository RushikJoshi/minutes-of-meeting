import { Link } from "react-router-dom";
import { formatMeetingTime, participantLabel, statusTone } from "../utils/meetingUtils";

export default function MeetingDetailsModal({ meeting, open, onClose, onEdit }) {
  if (!open || !meeting) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-6">
        <div className="flex w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusTone(meeting.status)}`}>
                {meeting.status || "scheduled"}
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{meeting.title}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {new Date(meeting.date).toLocaleDateString()} | {formatMeetingTime(meeting)}
              </p>
            </div>
            <button type="button" className="btn-secondary !px-4 !py-2" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Agenda</div>
                <p className="mt-2 text-sm leading-7 text-slate-700">{meeting.agenda || "No agenda added yet."}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Location</div>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {meeting.type === "online" ? "Online" : (meeting.location || "Offline")}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Participants ({meeting.participants?.length || 0})
              </div>
              <div className="flex flex-wrap gap-2">
                {(meeting.participants || []).map((participant) => (
                  <span
                    key={`${participant.email}-${participant.userId || "guest"}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    {participantLabel(participant)}
                  </span>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 -mx-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 pt-4 pb-2">
              <div className="flex gap-3">
                <button type="button" className="btn-secondary" onClick={() => onEdit?.(meeting)}>
                  Edit meeting
                </button>
                <Link className="btn-primary" to={`/meeting/${meeting._id}`}>
                  Open details
                </Link>
              </div>
              <Link className="text-sm font-semibold text-blue-700 hover:underline" to={`/meeting/${meeting._id}/minutes`}>
                Open MOM editor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
