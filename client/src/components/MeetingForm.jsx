import { useMemo, useState } from "react";
import ParticipantPicker from "./ParticipantPicker";
import { toYmd } from "../utils/meetingUtils";

const DEFAULT_FORM = {
  title: "",
  agenda: "",
  description: "",
  date: "",
  startTime: "",
  duration: 60,
  reminderMinutes: 10,
  priority: "medium",
  timezone: "Asia/Kolkata",
  type: "online",
  platform: "zoom",
  location: "",
};

function buildInitialForm(meeting, initialDate) {
  if (!meeting) {
    return { ...DEFAULT_FORM, date: initialDate || DEFAULT_FORM.date };
  }

  return {
    title: meeting.title || "",
    agenda: meeting.agenda || "",
    description: meeting.description || "",
    date: toYmd(meeting.date) || initialDate || "",
    startTime: meeting.startTime
      ? new Date(meeting.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      : "",
    duration: meeting.duration || 60,
    reminderMinutes: Number(meeting.reminderMinutes || 10),
    priority: meeting.priority || "medium",
    timezone: meeting.timezone || "Asia/Kolkata",
    type: meeting.type || "online",
    platform: meeting.platform || "zoom",
    location: meeting.location || "",
  };
}

export default function MeetingForm({
  meeting = null,
  initialDate = "",
  isSubmitting = false,
  onCancel,
  onSubmit,
  submitLabel,
  title,
  subtitle = "Plan the meeting, invite participants, and schedule reminders.",
  showHeader = true,
  chrome = "card",
}) {
  const initialForm = useMemo(() => buildInitialForm(meeting, initialDate), [meeting, initialDate]);
  const [form, setForm] = useState(() => initialForm);
  const [participants, setParticipants] = useState(() => (Array.isArray(meeting?.participants) ? meeting.participants : []));
  const [error, setError] = useState("");

  const computedTitle = title ?? (meeting ? "Edit meeting" : "Create meeting");
  const computedSubmitLabel = submitLabel ?? (meeting ? "Save changes" : "Create meeting");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Meeting title is required.");
      return;
    }

    if (!form.date) {
      setError("Meeting date is required.");
      return;
    }

    if (form.type === "offline" && !form.location.trim()) {
      setError("Location is required for offline meetings.");
      return;
    }

    try {
      const [year, month, day] = form.date.split("-");
      const [hours, minutes] = form.startTime.split(":");
      const startTimeDate = new Date(year, month - 1, day, hours, minutes);

      await onSubmit?.({
        ...form,
        startTime: startTimeDate.toISOString(),
        participants,
      });
    } catch (submitError) {
      setError(submitError?.response?.data?.message || submitError?.message || "Unable to save meeting.");
    }
  };

  const containerClassName =
    chrome === "plain"
      ? "flex w-full flex-col bg-transparent"
      : "flex w-full flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl";

  const bodyClassName = chrome === "plain" ? "space-y-5" : "flex-1 overflow-y-auto space-y-5 p-6";
  const footerClassName =
    chrome === "plain"
      ? "flex items-center justify-end gap-3 border-t border-slate-200 pt-4"
      : "sticky bottom-0 -mx-6 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 pt-4 pb-2";

  return (
    <div className={containerClassName}>
      {showHeader ? (
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{computedTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          {onCancel ? (
            <button type="button" className="btn-secondary !px-4 !py-2" onClick={onCancel} disabled={isSubmitting}>
              Close
            </button>
          ) : null}
        </div>
      ) : null}

      <form className={bodyClassName} onSubmit={handleSubmit}>
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Title</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Quarterly delivery review"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Agenda</label>
            <textarea
              className="input-field min-h-28"
              value={form.agenda}
              onChange={(event) => setForm((current) => ({ ...current, agenda: event.target.value }))}
              placeholder="Topics, expected outcomes, and discussion points"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
            <textarea
              className="input-field min-h-28"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Optional notes that will appear in reminders and invites"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Date</label>
            <input
              type="date"
              className="input-field"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Start time</label>
              <input
                type="time"
                className="input-field"
                value={form.startTime}
                onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Duration (min)</label>
              <select
                className="input-field"
                value={form.duration}
                onChange={(event) => setForm((current) => ({ ...current, duration: Number(event.target.value) }))}
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Meeting type</label>
            <select
              className="input-field"
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value,
                  platform: event.target.value === "online" ? current.platform || "zoom" : "none",
                }))
              }
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {form.type === "online" ? (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Platform</label>
              <select
                className="input-field"
                value={form.platform}
                onChange={(event) => setForm((current) => ({ ...current, platform: event.target.value }))}
              >
                <option value="zoom">Zoom (Default)</option>
                <option value="google-meet">Google Meet</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Location</label>
              <input
                className="input-field"
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                placeholder="Conference room A"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Reminder</label>
            <select
              className="input-field"
              value={form.reminderMinutes}
              onChange={(event) => setForm((current) => ({ ...current, reminderMinutes: Number(event.target.value) }))}
            >
              <option value={10}>10 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Priority</label>
            <select className="input-field" value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <ParticipantPicker value={participants} onChange={setParticipants} />

        <div className={footerClassName}>
          {onCancel ? (
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </button>
          ) : null}
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : computedSubmitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
