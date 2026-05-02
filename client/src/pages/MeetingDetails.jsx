import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import API from "../api/api";
import MeetingModal from "../components/MeetingModal";
import { formatMeetingTime, participantLabel, statusTone } from "../utils/meetingUtils";

export default function MeetingDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [showEditModal, setShowEditModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [remainingTime, setRemainingTime] = useState("");

  const meetingQuery = useQuery({
    queryKey: ["meeting", id],
    queryFn: async () => (await API.get(`/meeting/${id}`)).data,
    enabled: Boolean(id),
  });

  const momQuery = useQuery({
    queryKey: ["meeting-mom", id],
    queryFn: async () => (await API.get(`/mom/${id}`)).data,
    enabled: Boolean(id),
  });

  const updateMeeting = useMutation({
    mutationFn: async (payload) => (await API.patch(`/meeting/${id}`, payload)).data,
    onSuccess: () => {
      toast.success("Meeting updated.");
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setShowEditModal(false);
    },
  });

  const inviteParticipant = useMutation({
    mutationFn: async (email) => (await API.post(`/meeting/${id}/invite`, { emails: [email] })).data,
    onSuccess: () => {
      toast.success("Invitation sent.");
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });

  const startMeeting = useMutation({
    mutationFn: async () => (await API.post(`/meeting/${id}/start`)).data,
    onSuccess: () => {
      toast.success("Meeting started.");
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to start meeting.");
    },
  });

  const endMeeting = useMutation({
    mutationFn: async () => (await API.post(`/meeting/${id}/end`)).data,
    onSuccess: () => {
      toast.success("Meeting ended. Auto-generated MOM + PDF are ready.");
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      queryClient.invalidateQueries({ queryKey: ["meeting-mom", id] });
      queryClient.invalidateQueries({ queryKey: ["meeting-minutes", id] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to end meeting.");
    },
  });

  const calculateRemainingTime = useCallback(() => {
    if (!meetingQuery.data?.endTime || meetingQuery.data?.status !== "ongoing") {
      setRemainingTime("");
      return;
    }

    const now = new Date();
    const end = new Date(meetingQuery.data.endTime);
    const diff = end - now;

    if (diff <= 0) {
      setRemainingTime("Meeting ended");
      return;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    setRemainingTime(`Meeting ends in ${minutes}m ${seconds}s`);
  }, [meetingQuery.data]);

  useEffect(() => {
    const timer = setInterval(calculateRemainingTime, 1000);
    return () => clearInterval(timer);
  }, [calculateRemainingTime]);

  if (meetingQuery.isLoading) {
    return <div className="page-shell"><div className="page-card p-8 text-sm text-slate-500">Loading meeting...</div></div>;
  }

  if (meetingQuery.isError || !meetingQuery.data) {
    return <div className="page-shell"><div className="page-card p-8 text-sm text-rose-600">Unable to load the meeting.</div></div>;
  }

  const meeting = meetingQuery.data;
  const mom = momQuery.data;

  return (
    <div className="page-shell">
      <div className="page-container space-y-6 fade-up">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
          <div className="flex items-center gap-3">
            <Link className="text-sm font-semibold text-blue-700 hover:underline" to="/meetings">
              Back to meetings
            </Link>
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusTone(meeting.status)}`}>
              {meeting.status || "scheduled"}
            </div>
          </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">{meeting.title}</h1>
            {remainingTime && (
              <div className="mt-2 text-lg font-bold text-emerald-600 animate-pulse">
                {remainingTime}
              </div>
            )}
            <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">{meeting.agenda || "No agenda added yet."}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {meeting.status === "scheduled" && (
              <button
                type="button"
                className="btn-primary !bg-emerald-600 hover:!bg-emerald-700"
                onClick={() => startMeeting.mutate()}
                disabled={startMeeting.isPending}
              >
                {startMeeting.isPending ? "Starting..." : "Start Meeting"}
              </button>
            )}
            {meeting.type === "online" && (meeting.meetingLink || meeting.link) && (
              <a
                href={meeting.meetingLink || meeting.link}
                target="_blank"
                rel="noreferrer"
                className="btn-primary !bg-blue-600 hover:!bg-blue-700"
              >
                Join now
              </a>
            )}
            <button type="button" className="btn-secondary" onClick={() => setShowEditModal(true)}>
              Edit meeting
            </button>
            {meeting.status === "ongoing" && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => endMeeting.mutate()}
                disabled={endMeeting.isPending}
              >
                {endMeeting.isPending ? "Ending..." : "End meeting & generate MOM"}
              </button>
            )}
            <Link className="btn-primary" to={`/meeting/${meeting._id}/minutes`}>
              Open MOM editor
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="page-card p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoTile label="Date" value={new Date(meeting.date).toLocaleDateString()} />
                <InfoTile label="Time" value={formatMeetingTime(meeting)} />
                <InfoTile label="Reminder" value={`${meeting.reminderMinutes || 0} minutes before`} />
                <InfoTile
                  label="Mode"
                  value={meeting.type === "offline" ? meeting.location || "Offline" : meeting.meetingLink || meeting.link || meeting.platform}
                />
              </div>
            </div>

            <div className="page-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">Participants</h2>
                  <p className="mt-1 text-sm text-slate-500">Invite more people by email. Existing users are linked automatically on the backend.</p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <input
                  className="input-field"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="name@company.com"
                />
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!inviteEmail.trim() || inviteParticipant.isPending}
                  onClick={() => inviteParticipant.mutate(inviteEmail.trim().toLowerCase())}
                >
                  Invite
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                {(meeting.participants || []).map((participant) => (
                  <div key={`${participant.email}-${participant.userId || "guest"}`} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{participantLabel(participant)}</div>
                        <div className="mt-1 text-xs text-slate-500">{participant.kind === "user" ? "Registered user" : "Guest participant"}</div>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${participant.status === "joined" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                        {participant.status === "joined" ? "Present" : "Absent"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="page-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">Minutes of Meeting</h2>
                  <p className="mt-1 text-sm text-slate-500">Rich-text MOM content is stored as HTML and feeds action-item generation automatically.</p>
                </div>
                <Link className="btn-primary" to={`/meeting/${meeting._id}/minutes`}>
                  {mom ? "Continue editing" : "Create MOM"}
                </Link>
              </div>

              {mom ? (
                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{mom.docStatus || "draft"}</div>
                  <div className="prose prose-sm mt-4 max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: mom.contentHtml || "<p>No content yet.</p>" }} />
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-slate-300 px-5 py-10 text-center text-sm text-slate-500">
                  No MOM has been created for this meeting yet.
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="page-card p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Actions</div>
              <div className="mt-4 flex flex-col gap-3">
                <Link className="btn-secondary" to={`/meeting/${meeting._id}/minutes`}>
                  Open editor
                </Link>
                <a className="btn-secondary" href={`${API.defaults.baseURL}/meeting/${meeting._id}/download-pdf`} target="_blank" rel="noreferrer">
                  Download PDF
                </a>
              </div>
            </div>

            <div className="page-card p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Action-item status</div>
              <div className="mt-4 text-sm text-slate-600">
                Generated action items become visible on the dedicated tracker page as soon as the MOM editor is saved.
              </div>
              <Link className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:underline" to="/action-items">
                Go to action items
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <MeetingModal
        open={showEditModal}
        meeting={meeting}
        onClose={() => setShowEditModal(false)}
        isSubmitting={updateMeeting.isPending}
        onSubmit={async (payload) => updateMeeting.mutateAsync(payload)}
      />
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-slate-700">{value}</div>
    </div>
  );
}
