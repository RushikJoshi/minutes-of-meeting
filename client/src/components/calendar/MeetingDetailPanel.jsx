import React from 'react';
import { Link } from 'react-router-dom';
import { formatMeetingTime, participantLabel, statusTone } from '../../utils/meetingUtils';

export default function MeetingDetailPanel({ meeting, onClose, onEdit }) {
  if (!meeting) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
        <div>
          <div className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusTone(meeting.status)}`}>
            {meeting.status || 'scheduled'}
          </div>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">{meeting.title}</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | {formatMeetingTime(meeting)}
          </p>
        </div>
        {onClose && (
          <button 
            type="button" 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            onClick={onClose}
            title="Close details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Participants Avatar UI */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
            Participants ({meeting.participants?.length || 0})
          </h3>
          <div className="flex flex-wrap gap-2">
            {(meeting.participants || []).map((participant, idx) => {
              const name = participant.name || participant.email || 'Guest';
              const initial = name.charAt(0).toUpperCase();
              return (
                <div 
                  key={`${participant.email}-${idx}`} 
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 pr-3 pl-1 py-1 text-sm text-slate-700 shadow-sm"
                  title={participantLabel(participant)}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                    {initial}
                  </div>
                  <span className="text-xs font-medium truncate max-w-[120px]">{name}</span>
                </div>
              );
            })}
            {!meeting.participants?.length && <p className="text-sm text-slate-500 italic">No participants added.</p>}
          </div>
        </div>

        {/* Agenda / Notes Placeholder */}
        <div>
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Agenda</h3>
           <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-relaxed text-slate-700">
                {meeting.agenda || "No agenda set for this meeting."}
              </p>
           </div>
        </div>

        {/* Action Items Placeholder */}
        <div>
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Action Items</h3>
           <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-center py-4 text-sm text-slate-500 italic">
                 No action items recorded yet.
              </div>
           </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button type="button" className="btn-secondary !text-xs !py-1.5 !px-3" onClick={() => onEdit?.(meeting)}>
            Edit
          </button>
          <Link className="btn-primary !text-xs !py-1.5 !px-3" to={`/meeting/${meeting._id}`}>
            View Full
          </Link>
        </div>
        <Link className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline" to={`/meeting/${meeting._id}/minutes`}>
          Open MOM Editor →
        </Link>
      </div>
    </div>
  );
}
