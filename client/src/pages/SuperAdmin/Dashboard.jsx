import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    activeOrganizations: 0,
    inactiveOrganizations: 0,
    totalUsers: 0,
    totalMeetings: 0,
    totalDocuments: 0,
    activeUsersToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/super-admin/dashboard");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading dashboard...</div>;
  }

  const statCards = [
    { label: "Total Organizations", value: stats.totalOrganizations, icon: "🏢", color: "bg-blue-500", link: "/super-admin/organizations" },
    { label: "Active Organizations", value: stats.activeOrganizations, icon: "🟢", color: "bg-green-500", link: "/super-admin/organizations" },
    { label: "Inactive Organizations", value: stats.inactiveOrganizations, icon: "🔴", color: "bg-red-500", link: "/super-admin/organizations" },
    { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "bg-purple-500", link: "/super-admin/dashboard" },
    { label: "Total Meetings", value: stats.totalMeetings, icon: "📅", color: "bg-indigo-500", link: "/super-admin/dashboard" },
    { label: "Total Documents", value: stats.totalDocuments, icon: "📄", color: "bg-teal-500", link: "/super-admin/dashboard" },
    { label: "Active Users Today", value: stats.activeUsersToday, icon: "🟢", color: "bg-emerald-500", link: "/super-admin/dashboard" },
  ];

  return (
    <div className="w-full fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of platform metrics and organizations.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link 
            key={card.label} 
            to={card.link}
            className="block bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md hover:border-blue-200 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          >
            <div className={`h-12 w-12 rounded-xl ${card.color} flex items-center justify-center text-white text-2xl shadow-sm shrink-0`}>
              {card.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{card.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{card.value}</h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Organizations Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Recent Organizations</h2>
          <Link to="/super-admin/organizations" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
            View All &rarr;
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {stats.recentOrganizations && stats.recentOrganizations.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {stats.recentOrganizations.map((org) => (
                <li key={org._id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{org.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-slate-500">{org.organizationCode}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span className="text-xs text-slate-500">{org.industry || 'No Industry'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div className="hidden sm:block">
                      <p className="text-xs text-slate-500">Joined on</p>
                      <p className="text-sm font-medium text-slate-900">{new Date(org.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${org.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {org.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-slate-500">
              No organizations found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
