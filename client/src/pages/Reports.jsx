import { useQuery } from "@tanstack/react-query";
import API from "../api/api";
import {
  PieChart,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar
} from "lucide-react";

export default function Reports() {
  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ["reports-summary"],
    queryFn: async () => (await API.get("/api/reports/summary")).data,
  });

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="page-card p-8 text-center text-slate-500">
          Loading report data...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="page-shell">
        <div className="page-card p-8 text-center text-rose-600">
          Failed to load reports. Please try again later.
        </div>
      </div>
    );
  }

  const { meetings, actionItems, recentMeetings } = summary;

  return (
    <div className="page-shell">
      <div className="w-full space-y-6 fade-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Organization Analytics</h1>
          </div>
        </div>

        {/* Meeting Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Meetings"
            value={meetings.total}
            icon={<Calendar className="text-blue-500" size={20} />}
            color="border-l-blue-500"
          />
          <StatCard
            title="Completed"
            value={meetings.completed}
            icon={<CheckCircle className="text-emerald-500" size={20} />}
            color="border-l-emerald-500"
          />
          <StatCard
            title="Upcoming"
            value={meetings.scheduled}
            icon={<Clock className="text-amber-500" size={20} />}
            color="border-l-amber-500"
          />
          <StatCard
            title="Ongoing"
            value={meetings.ongoing}
            icon={<PieChart className="text-indigo-500" size={20} />}
            color="border-l-indigo-500"
          />
        </div>

        {/* Action Item Stats */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="page-card p-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="text-emerald-600" size={20} />
              Action Items Performance
            </h2>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-slate-900">{actionItems.total}</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{actionItems.completed}</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Done</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{actionItems.pending}</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                <span>Completion Rate</span>
                <span>{actionItems.total > 0 ? Math.round((actionItems.completed / actionItems.total) * 100) : 0}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${actionItems.total > 0 ? (actionItems.completed / actionItems.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="page-card p-6 border-l-4 border-l-rose-500 bg-rose-50/10">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="text-rose-600" size={20} />
              Overdue Tasks
            </h2>
            <p className="mt-1 text-sm text-slate-500">Action items that have passed their deadline and are still pending.</p>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-5xl font-black text-rose-600">{actionItems.overdue}</span>
              <span className="text-sm font-semibold text-rose-800 uppercase tracking-widest">Items Overdue</span>
            </div>
            <p className="mt-4 text-xs text-rose-700/70 font-medium italic">
              * Immediate attention required for these tasks to maintain organization efficiency.
            </p>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="page-card overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Recent Meetings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentMeetings.length > 0 ? (
                  recentMeetings.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{m.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {m.date ? new Date(m.date).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${m.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                          {m.status || "scheduled"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-sm text-slate-500">
                      No meeting data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`page-card p-6 border-l-4 ${color} page-card-hover`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</div>
        <div className="p-2 rounded-xl bg-slate-50">{icon}</div>
      </div>
      <div className="mt-3 text-3xl font-black text-slate-900">{value}</div>
    </div>
  );
}
