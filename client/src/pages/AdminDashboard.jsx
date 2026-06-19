import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../hooks/useAuth";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await API.get("/dashboard");
        if (!cancelled) {
          setStats(res.data);
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="page-card p-5">
          <p className="text-slate-600">Loading system data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="page-card border-red-200 p-5">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="w-full fade-up">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Overview of your company's data and pending items.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-700">
              Admin Access
            </span>
          </div>
        </div>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 mb-8">
          <div className="bg-white p-5 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-sm font-semibold text-gray-500 uppercase">Total Users</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="text-sm font-semibold text-gray-500 uppercase">Total Meetings</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{stats.totalMeetings}</div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="text-3xl mb-2">📄</div>
            <div className="text-sm font-semibold text-gray-500 uppercase">Total Documents</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{stats.totalDocuments}</div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="text-3xl mb-2">📝</div>
            <div className="text-sm font-semibold text-gray-500 uppercase">Total MOM</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{stats.totalMOM}</div>
          </div>
          <div className="bg-white p-5 rounded-lg shadow border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-sm font-semibold text-gray-500 uppercase">Completed Tasks</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{stats.completedTasks}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Today & Upcoming Meetings */}
          <div className="space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-lg shadow border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>📅</span> Today's Meetings
                </h2>
                <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {stats.todaysMeetingsCount}
                </span>
              </div>
              <p className="text-sm text-gray-500">You have {stats.todaysMeetingsCount} meetings scheduled for today.</p>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-lg shadow border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>⏳</span> Upcoming Meetings
              </h2>
              {stats.upcomingMeetings && stats.upcomingMeetings.length > 0 ? (
                <div className="space-y-3">
                  {stats.upcomingMeetings.map((m) => (
                    <div key={m._id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border border-gray-100">
                      <div>
                        <div className="font-medium text-gray-900">{m.title}</div>
                        <div className="text-xs text-gray-500">{new Date(m.startTime).toLocaleString()}</div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100 uppercase tracking-wide">
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No upcoming meetings scheduled.</p>
              )}
            </div>
          </div>

          {/* Pending Tasks & Recent Docs */}
          <div className="space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-lg shadow border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>⚠️</span> Pending Tasks
                </h2>
                <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {stats.pendingTasksCount}
                </span>
              </div>
              {stats.pendingTasks && stats.pendingTasks.length > 0 ? (
                <div className="space-y-3">
                  {stats.pendingTasks.map((t) => (
                    <div key={t._id} className="flex justify-between items-center p-3 hover:bg-red-50 rounded border border-red-100">
                      <div>
                        <div className="font-medium text-gray-900">{t.task}</div>
                        <div className="text-xs text-red-500">Due: {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No date'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No pending tasks.</p>
              )}
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-lg shadow border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📄</span> Recent Documents
              </h2>
              {stats.recentDocuments && stats.recentDocuments.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentDocuments.map((doc) => (
                    <div key={doc._id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <div>
                          <div className="font-medium text-gray-900 truncate max-w-[200px]">{doc.name}</div>
                          <div className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                        View
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent documents uploaded.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
