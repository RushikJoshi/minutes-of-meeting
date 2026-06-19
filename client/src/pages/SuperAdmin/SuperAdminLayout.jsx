import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import brandedIcon from "../../assets/logo_icon_final.png";

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

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User menu
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navigationItems = [
    {
      to: "/super-admin/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      )
    },
    {
      to: "/super-admin/organizations",
      label: "Organizations",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      to: "/super-admin/organization-admins",
      label: "Organization Admins",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      to: "/super-admin/audit-logs",
      label: "Audit Logs",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      to: "/super-admin/settings",
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
    <div className="relative h-screen overflow-hidden bg-slate-100 font-outfit">
      <div className="pointer-events-none absolute right-0 top-28 h-72 w-72 rounded-full bg-indigo-300/10 blur-3xl" />
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full border-r border-white/60 bg-white/90 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.7)] backdrop-blur-xl transition-all duration-300 ease-in-out ${sidebarCollapsed ? "w-14" : "w-64"} ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-full flex-col min-h-0">
          {/* Sidebar Header */}
          <div className={`shrink-0 flex items-center border-b border-slate-200 ${sidebarCollapsed ? "justify-center p-2 h-16" : "justify-between p-4"}`}>
            <Link to="/super-admin/dashboard" className="flex items-center gap-2 group">
              <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                <img 
                  src={brandedIcon} 
                  alt="GT Logo" 
                  className="w-9 h-9 object-contain transition-transform duration-200 group-hover:scale-110" 
                />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col ml-1">
                  <span className="font-bold text-lg bg-gradient-to-r from-[#00358E] to-blue-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200 whitespace-nowrap leading-tight">
                    Super Admin
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest leading-tight">GT MOM</span>
                </div>
              )}
            </Link>

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
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col justify-between">
            <nav className={`${sidebarCollapsed ? "px-2 py-4" : "p-3"} space-y-2`}>
              {navigationItems.map((item) => (
                <SidebarNavItem key={item.to} to={item.to} icon={item.icon} isCollapsed={sidebarCollapsed}>
                  {item.label}
                </SidebarNavItem>
              ))}
            </nav>
            
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={handleLogout}
                className={`w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition-colors ${sidebarCollapsed ? "px-0" : ""}`}
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {!sidebarCollapsed && <span>Logout</span>}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`relative min-w-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:ml-14' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden rounded-2xl border border-slate-200 bg-white/90 p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
              >
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="hidden lg:flex items-center gap-2">
                <span className="text-slate-400 font-medium text-sm">Product Super Admin</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900 font-bold text-sm">
                  {location.pathname.includes('/organizations/new') 
                    ? "New Organization" 
                    : location.pathname.includes('/organizations/') 
                    ? "Edit Organization"
                    : location.pathname.includes('/organizations')
                    ? "Organizations"
                    : location.pathname.includes('/organization-admins')
                    ? "Organization Admins"
                    : location.pathname.includes('/audit-logs')
                    ? "Audit Logs"
                    : location.pathname.includes('/settings')
                    ? "Settings"
                    : "Dashboard"}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                      {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Logged in as</p>
                      <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || "Super Admin"}</p>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-3 w-56 rounded-3xl border border-slate-200 bg-white/95 backdrop-blur-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden z-50">
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <p className="text-xs font-bold text-slate-900">{user?.name || "Super Admin"}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                      </div>
                      <div className="p-2">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
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
          <div className="p-8 max-w-7xl mx-auto page-shell">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
