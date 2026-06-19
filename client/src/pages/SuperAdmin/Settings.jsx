import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import API from "../../api/api";
import toast from "react-hot-toast";

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await API.put("/users/profile", { name: name.trim() });
      toast.success("Profile updated successfully!");
      // We rely on page reload to fresh everything and sync with auth context cleanly
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your super admin account preferences.</p>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-4 text-sm font-bold tracking-wide transition-colors relative ${activeTab === "profile" ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
          >
            Profile
            {activeTab === "profile" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-6 py-4 text-sm font-bold tracking-wide transition-colors relative ${activeTab === "security" ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
          >
            Security
            {activeTab === "security" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />}
          </button>
        </div>

        <div className="p-8">
          {activeTab === "profile" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Profile Information</h3>
                <p className="text-sm text-slate-500 mt-1">Your basic account details.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Name</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email</label>
                  <input
                    type="email"
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 font-medium cursor-not-allowed text-slate-500"
                    value={user?.email || ""}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Role</label>
                  <input
                    type="text"
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 font-medium cursor-not-allowed text-slate-500"
                    value="Product Super Admin"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={loading || !name.trim()}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Security Preferences</h3>
                <p className="text-sm text-slate-500 mt-1">Manage your password and security settings.</p>
              </div>

              <div className="mt-4 p-5 rounded-2xl border border-orange-200 bg-orange-50 flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-orange-900">Notice</h4>
                  <p className="text-sm text-orange-800 mt-1">
                    Super Admin password changes are currently restricted to direct database operations for security reasons.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
