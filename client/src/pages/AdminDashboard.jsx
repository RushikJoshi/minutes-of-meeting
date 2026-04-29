import { useEffect, useMemo, useState } from "react";
import API from "../api/api";
import { useAuth } from "../hooks/useAuth";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [meetingsRes, visitorsRes] = await Promise.all([
          API.get("/meetings").catch(() => ({ data: [] })),
          API.get("/api/visitors").catch(() => ({ data: [] }))
        ]);

        if (!cancelled) {
          setMeetings(meetingsRes.data || []);
          setVisitors(visitorsRes.data || []);
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load admin dashboard data.");
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
    const totalMeetings = meetings.length;
    const completedMeetings = meetings.filter((m) => m.status === "completed").length;
    const totalVisitors = visitors.length;
    const verifiedVisitors = visitors.filter((v) => v.document?.status === "VERIFIED" || v.status === "VERIFIED").length;
    return { totalMeetings, completedMeetings, totalVisitors, verifiedVisitors };
  }, [meetings, visitors]);

  return (
    <div className="page-shell">
      <div className="w-full fade-up">
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <h1 className="section-title">Admin Dashboard</h1>
            <p className="section-subtitle">System overview and control panel.</p>
          </div>
          <div className="hidden sm:block">
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-700">
              Admin Access
            </span>
          </div>
        </div>

        {loading ? (
          <div className="page-card p-5">
            <p className="text-slate-600">Loading system data...</p>
          </div>
        ) : error ? (
          <div className="page-card border-red-200 p-5">
            <p className="text-red-800">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="page-card page-card-hover p-5 border-l-4 border-l-blue-500">
                <div className="text-sm font-semibold text-slate-500 uppercase">Total Meetings</div>
                <div className="mt-2 text-3xl font-bold text-slate-800">{stats.totalMeetings}</div>
              </div>
              <div className="page-card page-card-hover p-5 border-l-4 border-l-emerald-500">
                <div className="text-sm font-semibold text-slate-500 uppercase">Completed</div>
                <div className="mt-2 text-3xl font-bold text-slate-800">{stats.completedMeetings}</div>
              </div>
              <div className="page-card page-card-hover p-5 border-l-4 border-l-purple-500">
                <div className="text-sm font-semibold text-slate-500 uppercase">Total Visitors</div>
                <div className="mt-2 text-3xl font-bold text-slate-800">{stats.totalVisitors}</div>
              </div>
              <div className="page-card page-card-hover p-5 border-l-4 border-l-indigo-500">
                <div className="text-sm font-semibold text-slate-500 uppercase">Verified Visitors</div>
                <div className="mt-2 text-3xl font-bold text-slate-800">{stats.verifiedVisitors}</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Recent Meetings */}
              <div className="page-card p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-800">System Meetings</h2>
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
                            {m.date ? new Date(m.date).toDateString() : "-"}
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-md border font-semibold ${
                            m.status === "completed"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-amber-50 border-amber-200 text-amber-700"
                          }`}
                        >
                          {m.status || "scheduled"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No meetings found.</p>
                )}
              </div>

              {/* Recent Visitors */}
              <div className="page-card p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-800">Recent Visitors</h2>
                {visitors.length ? (
                  <div className="mt-4 space-y-3">
                    {visitors.slice(0, 5).map((v) => (
                      <div
                        key={v._id}
                        className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all duration-200 hover:border-purple-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{v.name}</div>
                          <div className="text-sm text-slate-500">
                            {v.company || "No Company"} • {v.mobile || "No Mobile"}
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-md border font-semibold ${
                            v.document?.status === "VERIFIED" || v.status === "VERIFIED"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-blue-50 border-blue-200 text-blue-700"
                          }`}
                        >
                          {v.document?.status === "VERIFIED" ? "Verified" : v.status || "WAITING"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No visitors found.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
