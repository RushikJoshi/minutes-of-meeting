import { useEffect, useMemo, useState } from "react";
import API from "../api/api";
import { useAuth } from "../hooks/useAuth";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [actionSummary, setActionSummary] = useState({ pending: 0, done: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await API.get("/meetings");
        if (!cancelled) setMeetings(res.data || []);

        const completed = (res.data || [])
          .filter((m) => m.status === "completed")
          .slice(0, 15);

        const moms = await Promise.all(
          completed.map(async (m) => {
            try {
              const momRes = await API.get(`/mom/${m._id}`);
              return momRes.data || null;
            } catch {
              return null;
            }
          })
        );

        const counts = moms.reduce(
          (acc, mom) => {
            const items = Array.isArray(mom?.actionItems) ? mom.actionItems : [];
            for (const it of items) {
              if (it?.status === "done") acc.done += 1;
              else acc.pending += 1;
            }
            return acc;
          },
          { pending: 0, done: 0 }
        );

        if (!cancelled) setActionSummary(counts);
      } catch (err) {
        if (!cancelled) {
          const msg = err?.response?.data?.message || "Failed to load dashboard.";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = meetings.length;
    const completed = meetings.filter((m) => m.status === "completed").length;
    const scheduled = meetings.filter((m) => m.status !== "completed").length;
    return { total, completed, scheduled };
  }, [meetings]);

  return (
    <div className="page-shell">
      <div className="w-full fade-up">
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <h1 className="section-title">Employee Workspace</h1>
            <p className="section-subtitle">Welcome back, {user?.name || "Employee"}!</p>
          </div>
          <div className="hidden sm:block">
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-700">
              Employee Access
            </span>
          </div>
        </div>

        {loading ? (
          <div className="page-card p-5">
            <p className="text-slate-600">Loading your workspace...</p>
          </div>
        ) : error ? (
          <div className="page-card border-red-200 p-5">
            <p className="text-red-800">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="page-card page-card-hover p-5 border-l-4 border-l-blue-500">
                <div className="text-sm font-semibold text-slate-500 uppercase">My Meetings</div>
                <div className="mt-2 text-3xl font-bold text-slate-800">{stats.total}</div>
              </div>
              <div className="page-card page-card-hover p-5 border-l-4 border-l-emerald-500">
                <div className="text-sm font-semibold text-slate-500 uppercase">Completed</div>
                <div className="mt-2 text-3xl font-bold text-slate-800">{stats.completed}</div>
              </div>
              <div className="page-card page-card-hover p-5 border-l-4 border-l-amber-500">
                <div className="text-sm font-semibold text-slate-500 uppercase">Scheduled</div>
                <div className="mt-2 text-3xl font-bold text-slate-800">{stats.scheduled}</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="page-card page-card-hover p-5 bg-gradient-to-br from-white to-blue-50/30">
                <div className="text-sm font-semibold text-slate-500 uppercase">Tasks Pending</div>
                <div className="mt-2 text-3xl font-bold text-blue-600">{actionSummary.pending}</div>
              </div>
              <div className="page-card page-card-hover p-5 bg-gradient-to-br from-white to-emerald-50/30">
                <div className="text-sm font-semibold text-slate-500 uppercase">Tasks Done</div>
                <div className="mt-2 text-3xl font-bold text-emerald-600">{actionSummary.done}</div>
              </div>
            </div>

            <div className="page-card mt-6 p-5 sm:p-6">
              <h2 className="text-lg font-bold text-slate-800">Recent & Upcoming Meetings</h2>
              {meetings.length ? (
                <div className="mt-4 space-y-3">
                  {meetings.slice(0, 5).map((m) => (
                    <div
                      key={m._id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all duration-200 hover:border-blue-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{m.title}</div>
                        <div className="text-sm text-slate-500">
                          {m.date ? new Date(m.date).toDateString() : "-"} {m.startTime ? `at ${m.startTime}` : ""}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md border font-semibold ${
                          m.status === "completed"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}
                      >
                        {m.status || "scheduled"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No meetings yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
