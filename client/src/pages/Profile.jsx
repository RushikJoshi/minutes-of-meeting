import { useAuth } from "../hooks/useAuth";
import { User, Mail, Calendar, Shield } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="page-shell">
      <div className="page-container fade-up">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Profile</h1>
          <p className="mt-2 text-slate-500">Manage your personal information and account security.</p>
        </div>

        <div className="page-card overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Section: Profile Overview */}
            <div className="lg:w-1/3 bg-slate-50/50 border-r border-slate-100 p-8 sm:p-10 text-center flex flex-col items-center justify-center">
              <div className="w-28 h-28 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-bold shadow-xl shadow-blue-500/20 mb-6">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{user?.name || "Member"}</h2>
              <p className="text-slate-500 font-medium mb-8">{user?.email}</p>

              <div className="w-full space-y-3 text-left">
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Shield size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Status</div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Verified Account</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Member Since</div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section: Details & Security */}
            <div className="lg:w-2/3 p-8 sm:p-10 space-y-10">
              <section>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Personal Information</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Full Name</label>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold">
                      <User size={18} className="text-blue-500" />
                      {user?.name || "Not set"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">Email Address</label>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 font-bold">
                      <Mail size={18} className="text-blue-500" />
                      {user?.email}
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-px bg-slate-100 w-full" />

              <section className="bg-blue-50/30 rounded-3xl p-6 border border-blue-50">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-blue-600">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Security Best Practices</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Your account is protected by industry-standard encryption. Always use a strong, unique password and avoid sharing your credentials. If you notice any suspicious activity, please notify your administrator.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
