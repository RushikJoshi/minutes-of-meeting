import React from 'react';
import { Link } from "react-router-dom";
import { formatMeetingTime, participantLabel, statusTone } from "../utils/meetingUtils";

export default function MeetingCard({ meeting, onEdit, onDelete }) {
  return (
    <article className="page-card p-4 flex flex-col h-full justify-between">
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusTone(meeting.status)}`}>
              {meeting.status || "scheduled"}
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 line-clamp-1" title={meeting.title}>
              {meeting.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600 line-clamp-2" title={meeting.agenda}>
              {meeting.agenda || "No agenda added yet."}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{meeting.priority || 'medium'}</div>
            <div className="mt-1 text-xs font-semibold text-slate-700">{new Date(meeting.date).toLocaleDateString()}</div>
            <div className="mt-0.5 text-[10px] text-slate-500">{formatMeetingTime(meeting)}</div>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Participants</div>
          <div className="flex flex-wrap gap-1.5">
            {(meeting.participants || []).slice(0, 5).map((participant) => (
              <span key={`${participant.email}-${participant.userId || "guest"}`} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 truncate max-w-[120px]" title={participantLabel(participant)}>
                {participant.name || participant.email}
              </span>
            ))}
            {(meeting.participants?.length > 5) && (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                +{meeting.participants.length - 5}
              </span>
            )}
            {(!meeting.participants || meeting.participants.length === 0) && (
              <span className="text-xs text-slate-400 italic">None</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
        <Link className="btn-primary !text-xs !py-1.5 !px-3" to={`/meeting/${meeting._id}`}>
          View details
        </Link>
        {(meeting.type === "online" && (meeting.meetingLink || meeting.link)) && (
          <a
            className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 !shadow-emerald-500/20 !text-xs !py-1.5 !px-3"
            href={meeting.meetingLink || meeting.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Now
          </a>
        )}
        <button
          type="button"
          className="btn-secondary !text-xs !py-1.5 !px-3"
          onClick={() => onEdit(meeting)}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn-secondary !border-rose-200 !text-rose-700 hover:!bg-rose-50 !text-xs !py-1.5 !px-3"
          onClick={() => onDelete(meeting)}
        >
          Delete
        </button>
        <Link className="ml-auto text-xs font-semibold text-blue-700 hover:underline" to={`/meeting/${meeting._id}/minutes`}>
          Open MOM
        </Link>
      </div>
    </article>
  );
}
