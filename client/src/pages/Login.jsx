import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import VisitorForm from "../components/VisitorForm";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("staff"); // 'staff' | 'visitor'

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password, role);
      const to = location.state?.from || "/dashboard";
      navigate(to, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Login failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.16),_transparent_32%)]" />
      <div className="glass-panel fade-up relative w-full max-w-md p-6 sm:p-8">

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
            MOM Workspace
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            {activeTab === "staff" ? "Sign in" : "Visitor Check-In"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {activeTab === "staff"
              ? "Access meetings, minutes, and team updates in one place."
              : "Fill in your details to check in as a visitor."}
          </p>
        </div>

        {/* Tab Switch */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "staff"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Staff Login
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("visitor")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "visitor"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Visitor Check-In
          </button>
        </div>

        {/* Staff Login Form */}
        {activeTab === "staff" && (
          <>
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/90 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Login Role</label>
                <select
                  className="input-field appearance-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="RECEPTIONIST">RECEPTIONIST</option>
                </select>
              </div>

              <button disabled={loading} className="btn-primary w-full">
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="mt-5 text-sm text-slate-600">
              New here?{" "}
              <Link className="font-semibold text-blue-700 transition-colors hover:text-blue-800" to="/register">
                Create an account
              </Link>
            </p>
          </>
        )}

        {/* Visitor Check-In Form */}
        {activeTab === "visitor" && (
          <VisitorForm onSuccess={() => setActiveTab("staff")} />
        )}
      </div>
    </div>
  );
}
