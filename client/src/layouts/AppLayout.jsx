import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWorkspace } from "../hooks/useWorkspace";
import { useState, useEffect, useRef } from "react";
import API from "../api/api";

function SidebarNavItem({ to, children, icon, isCollapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 ${isCollapsed ? "px-0 justify-center" : "px-4"} py-3 rounded-xl transition-all duration-300 hover:scale-105 ${isActive
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
          : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-md"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`}>
            {icon}
          </div>
          {!isCollapsed && (
            <span className={`font-medium transition-all duration-200 ${isActive ? 'text-white' : 'group-hover:text-slate-900'}`}>
              {children}
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
              {children}
            </div>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, createWorkspace } = useWorkspace();
  const activeWs = workspaces.find((w) => w?.workspace?._id === activeWorkspaceId);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const notifRef = useRef(null);

  // User menu
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const fetchNotifications = async () => {
    setIsRefreshing(true);
    try {
      const res = await API.get("/notifications", { params: { limit: 10 } });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch notifications");
    } finally {
      // Add a small delay so the user can see the refresh happen
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await API.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, readAt: new Date().toISOString() } : n));
    } catch (e) { }
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;

  const navigationItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      )
    },
    {
      to: "/calendar",
      label: "Calendar",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      to: "/meetings",
      label: "Meetings",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      to: "/action-items",
      label: "Tasks",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      to: "/documents",
      label: "Documents",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      to: "/reports",
      label: "Reports",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2-2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      to: "/template-builder",
      label: "Template Builder",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      to: "/settings",
      label: "Settings",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="relative h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_58%)]" />
      <div className="pointer-events-none absolute right-0 top-28 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full border-r border-white/60 bg-white/90 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.7)] backdrop-blur-xl transition-all duration-300 ease-in-out ${sidebarCollapsed ? "w-14" : "w-52"} ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-full flex-col min-h-0">
          {/* Sidebar Header */}
          <div className={`shrink-0 flex items-center border-b border-slate-200 ${sidebarCollapsed ? "justify-center p-2 h-16" : "justify-between p-4"}`}>
            {!sidebarCollapsed && (
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200">
                  MOM System
                </span>
              </Link>
            )}

            {/* Desktop Collapse Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 group"
            >
              <svg
                className={`w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-transform duration-200 ${sidebarCollapsed ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scroll Area */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            {/* Navigation */}
            <nav className={`${sidebarCollapsed ? "px-2 py-4" : "p-3"} space-y-2`}>
              {navigationItems.map((item) => (
                <SidebarNavItem key={item.to} to={item.to} icon={item.icon} isCollapsed={sidebarCollapsed}>
                  {item.label}
                </SidebarNavItem>
              ))}
            </nav>

            {/* Workspace Selector */}
            {!sidebarCollapsed && (
              <div className="p-3 border-t border-slate-200">
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Workspace</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    value={activeWorkspaceId || ""}
                    onChange={(e) => setActiveWorkspaceId(e.target.value)}
                  >
                    {workspaces.map((w) => (
                      <option key={w.workspace._id} value={w.workspace._id}>
                        {w.workspace.name} ({w.role})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="w-full mb-3 px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                  onClick={() => setShowNewWorkspaceModal(true)}
                >
                  + New Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`relative min-w-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:ml-14' : 'lg:ml-52'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
            <div className="page-container flex items-center justify-between gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden rounded-2xl border border-slate-200 bg-white/90 p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="hidden lg:block"></div>

              <div className="flex items-center gap-4">
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all relative group"
                  >
                    <svg className="w-6 h-6 text-slate-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifs && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-[2rem] border border-slate-200 bg-white/95 backdrop-blur-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden animate-fade-in z-50">
                      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-xs font-semibold text-slate-900 uppercase">Notifications</h3>
                        <button 
                          onClick={fetchNotifications} 
                          disabled={isRefreshing}
                          className={`text-[10px] font-bold uppercase tracking-wider transition-all ${isRefreshing ? 'text-slate-400' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                          {isRefreshing ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round"/>
                              </svg>
                              Updating...
                            </span>
                          ) : "Refresh"}
                        </button>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-slate-100">
                            {notifications.map((n) => (
                              <div
                                key={n._id}
                                className={`p-4 hover:bg-blue-50/50 transition-colors cursor-pointer ${!n.readAt ? 'bg-blue-50/20' : ''}`}
                                onClick={() => markAsRead(n._id)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.readAt ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-semibold text-slate-900">{n.title || n.type}</span>
                                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                                    <span className="text-[9px] text-slate-400 mt-1 block">{new Date(n.createdAt).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-10 text-center text-slate-400">
                            <svg className="w-10 h-10 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <p className="text-xs font-medium uppercase tracking-widest">Recent Alerts</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                      {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Logged in as</p>
                      <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || user?.email?.split('@')[0]}</p>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-56 rounded-3xl border border-slate-200 bg-white/95 backdrop-blur-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden z-50">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </Link>
                        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="h-[calc(100vh-73px)] overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* New Workspace Modal */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowNewWorkspaceModal(false)}
          />
          <div className="relative w-full max-w-md page-card p-6 sm:p-8 animate-scale-up border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">New Workspace</h3>
              <button
                onClick={() => setShowNewWorkspaceModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Workspace Name</label>
                <input
                  autoFocus
                  className="input-field"
                  placeholder="e.g. Engineering Team"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newWorkspaceName.trim()) {
                      createWorkspace(newWorkspaceName.trim());
                      setNewWorkspaceName("");
                      setShowNewWorkspaceModal(false);
                    }
                  }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 btn-secondary"
                  onClick={() => {
                    setShowNewWorkspaceModal(false);
                    setNewWorkspaceName("");
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={!newWorkspaceName.trim()}
                  className="flex-1 btn-primary"
                  onClick={async () => {
                    await createWorkspace(newWorkspaceName.trim());
                    setNewWorkspaceName("");
                    setShowNewWorkspaceModal(false);
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
