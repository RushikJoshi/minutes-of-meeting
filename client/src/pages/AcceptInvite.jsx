import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import toast from "react-hot-toast";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h2>
          <p className="text-slate-500">No invite token provided.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (password.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }

    setLoading(true);
    try {
      // Create endpoint for this in backend!
      await API.post("/auth/accept-invite", { token, password });
      toast.success("Password set successfully! You can now login.");
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-outfit">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 fade-up">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👋</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Welcome to GT MOM</h2>
          <p className="mt-2 text-sm text-slate-500">Set your password to accept the organization invite and activate your admin account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">New Password</label>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Confirm Password</label>
            <input
              type="password"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Activating..." : "Set Password & Activate"}
          </button>
        </form>
      </div>
    </div>
  );
}
