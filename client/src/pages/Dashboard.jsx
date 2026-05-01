import { useEffect, useMemo, useState } from "react";
import API from "../api/api";

export default function Dashboard() {
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
        <div className="mb-6 sm:mb-8">
          <h1 className="section-title">Dashboard</h1>
          <p className="section-subtitle">

          </p>
        </div>

        {loading ? (
          <div className="page-card p-5">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : error ? (
          <div className="page-card border-red-200 p-5">
            <p className="text-red-800">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div className="page-card page-card-hover p-5">
                <div className="text-sm text-gray-600">Total meetings</div>
                <div className="mt-2 text-3xl font-bold">{stats.total}</div>
              </div>
              <div className="page-card page-card-hover p-5">
                <div className="text-sm text-gray-600">Completed</div>
                <div className="mt-2 text-3xl font-bold">{stats.completed}</div>
              </div>
              <div className="page-card page-card-hover p-5">
                <div className="text-sm text-gray-600">Scheduled</div>
                <div className="mt-2 text-3xl font-bold">{stats.scheduled}</div>
              </div>
              <div className="page-card page-card-hover p-5">
                <div className="text-sm text-gray-600">Action items pending</div>
                <div className="mt-2 text-3xl font-bold">{actionSummary.pending}</div>
              </div>
              <div className="page-card page-card-hover p-5">
                <div className="text-sm text-gray-600">Action items done</div>
                <div className="mt-2 text-3xl font-bold">{actionSummary.done}</div>
              </div>
            </div>

            <div className="page-card mt-6 p-5 sm:p-6">
              <h2 className="text-lg font-bold">Recent meetings</h2>
              {meetings.length ? (
                <div className="mt-3 space-y-2">
                  {meetings.slice(0, 5).map((m) => (
                    <div
                      key={m._id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 transition-all duration-200 hover:border-blue-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-semibold">{m.title}</div>
                        <div className="text-sm text-gray-600">
                          {m.date ? new Date(m.date).toDateString() : "-"}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded border ${m.status === "completed"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                          }`}
                      >
                        {m.status || "scheduled"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-gray-600">No meetings yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
