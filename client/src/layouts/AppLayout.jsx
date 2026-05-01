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
        `group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 ${isActive
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

  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  // User menu
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications", { params: { limit: 10 } });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch notifications");
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
      label: "Action Items",
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
      <aside className={`fixed top-0 left-0 z-50 h-full border-r border-white/60 bg-white/90 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.7)] backdrop-blur-xl transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
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
            <svg className={`w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <SidebarNavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              isCollapsed={sidebarCollapsed}
            >
              {item.label}
            </SidebarNavItem>
          ))}
        </nav>

        {/* Workspace Selector */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-200">
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Workspace
              </label>
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
              onClick={async () => {
                const name = window.prompt("Workspace name");
                if (!name) return;
                await createWorkspace(name);
              }}
            >
              + New Workspace
            </button>
          </div>
        )}

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-200">
          {!sidebarCollapsed && (
            <div className="mb-3">
              <div className="text-sm text-slate-600">
                <div className="font-medium text-slate-900">{user?.name || user?.email}</div>
                <div className="text-xs">{user?.email}</div>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 ${sidebarCollapsed ? 'justify-center' : ''
              }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`relative min-w-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}>

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

              {/* Desktop Spacer */}
              <div className="hidden lg:block"></div>

              {/* Actions & User Info */}
              <div className="flex items-center gap-4">
                {/* Notification Icon */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all relative group"
                  >
                    <svg className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                    )}
                  </button>

                  {showNotifs && (
                    <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-900 uppercase">Notifications</h3>
                        <button onClick={fetchNotifications} className="text-[10px] font-black text-blue-600">Refresh</button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map(n => (
                            <div
                              key={n._id}
                              onClick={() => !n.readAt && markAsRead(n._id)}
                              className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.readAt ? 'bg-blue-50/30' : ''}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-black text-slate-900">{n.title || n.type}</span>
                                {!n.readAt && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                              </div>
                              <p className="text-[10px] text-slate-600 leading-relaxed mb-2">{n.message}</p>
                              <span className="text-[8px] font-bold text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-[10px] font-bold text-slate-400">No new notifications</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-center border-t border-slate-100 bg-slate-50/30">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Recent Alerts</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowUserMenu((v) => !v)}
                    className="w-9 h-9 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white/70 hover:brightness-110 transition"
                    aria-label="User menu"
                  >
                    {(user?.name || user?.email)?.charAt(0).toUpperCase()}
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden">
                      <div className="p-4 bg-slate-50/70 border-b border-slate-100">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logged in as</p>
                        <p className="mt-1 text-sm font-bold text-slate-900 break-words">{user?.email || "-"}</p>
                      </div>
                      <div className="p-2">
                        <button
                          type="button"
                          onClick={logout}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 transition border border-red-100"
                        >
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

        {/* Page Content */}
        <main className="h-[calc(100vh-73px)] overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
