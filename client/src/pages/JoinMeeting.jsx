import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import API from "../api/api";

export default function JoinMeeting() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const res = await API.get(`/join/${id}`, {
          params: { invite: inviteToken },
        });
        setMeeting(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Meeting not found or invite link has expired.");
      } finally {
        setLoading(false);
      }
    };

    if (!id || !inviteToken) {
      setError("Invite token is missing from this meeting link.");
      setLoading(false);
      return;
    }

    fetchMeeting();
  }, [id, inviteToken]);

  const dateStr = useMemo(() => {
    if (!meeting?.date) return "Date not set";
    return new Date(meeting.date).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: meeting.timezone || "Asia/Kolkata",
    });
  }, [meeting]);

  const handleJoin = async () => {
    setJoining(true);
    setError("");
    setSuccess("");

    try {
      const res = await API.post(`/join/${id}/accept`, { inviteToken });
      const meetingLink = res.data?.meetingLink || meeting?.meetingLink;
      setMeeting(res.data?.meeting || meeting);
      setSuccess("You are marked as joined. Opening the meeting now...");

      if (meetingLink) {
        window.open(meetingLink, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to join meeting.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 font-medium">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (error && !meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invite Unavailable</h2>
          <p className="text-white/60 text-sm mb-6">{error}</p>
          <Link to="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Login to MOM
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600/80 to-indigo-600/80 px-8 py-7 text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-1.5 rounded-full mb-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/90 text-xs font-bold uppercase tracking-widest">Secure Invite</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">{meeting?.title}</h1>
            {meeting?.participant?.email && (
              <p className="text-blue-100 text-sm mt-3">
                <a href={`mailto:${meeting.participant.email}`} className="underline decoration-blue-200/60 underline-offset-4">
                  {meeting.participant.email}
                </a>{" "}
                is invited
              </p>
            )}
          </div>

          <div className="px-8 py-6 space-y-4">
            <div className="flex items-center gap-4 p-3.5 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-lg">D</div>
              <div>
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-0.5">Date</div>
                <div className="text-sm font-semibold text-white">{dateStr}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3.5 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-lg">T</div>
              <div>
                <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-0.5">Time</div>
                <div className="text-sm font-semibold text-white">
                  {meeting?.startTime || "N/A"} - {meeting?.endTime || "N/A"}
                </div>
              </div>
            </div>

            {(meeting?.location || meeting?.type === "online") && (
              <div className="flex items-center gap-4 p-3.5 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-lg">L</div>
                <div>
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-0.5">Location</div>
                  <div className="text-sm font-semibold text-white">
                    {meeting?.type === "offline" ? meeting.location : "Online meeting"}
                  </div>
                </div>
              </div>
            )}

            <div className={`text-center text-xs font-black uppercase tracking-widest px-3 py-2 rounded-full ${
              meeting?.participant?.status === "joined"
                ? "bg-green-500/20 text-green-300"
                : "bg-blue-500/20 text-blue-300"
            }`}>
              {meeting?.participant?.status === "joined" ? "Already Joined" : "Invitation Ready"}
            </div>

            {success && <div className="rounded-2xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">{success}</div>}
            {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
          </div>

          <div className="px-8 pb-8 space-y-3">
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/30 text-sm disabled:opacity-60"
            >
              {joining ? "Joining..." : meeting?.participant?.status === "joined" ? "Open Meeting Link" : "Accept Invite & Join"}
            </button>

            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium py-3 px-6 rounded-2xl transition-all text-sm border border-white/10"
            >
              Login to MOM System
            </Link>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6 font-medium">
          Powered by MOM System
        </p>
      </div>
    </div>
  );
}
