import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import logo from "../assets/logo_final.png";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/role-selection", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/role-selection", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || "Login failed. Please check credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-outfit">
      {/* Left Section: Branding */}
      <div className="hidden w-[55%] flex-col items-center justify-center p-12 lg:flex">
        <div className="fade-up flex flex-col items-center max-w-2xl text-center">
          <div className="mb-20">
            <div className="flex items-center justify-center">
              {/* Using the programmatically cleaned original logo for perfect transparency and quality */}
              <img
                src={logo}
                alt="Gitakshmi Technologies"
                className="h-64 w-auto object-contain mix-blend-multiply"
              />
            </div>
          </div>

          <h1 className="text-6xl font-bold tracking-tight text-[#003B95]">
            Minutes of Meeting System
          </h1>

          <p className="mt-8 text-xl leading-relaxed text-slate-500 font-medium max-w-lg">
            Streamline your team's workflow with visual boards, smart tracking, and real-time collaboration.
          </p>
        </div>
      </div>

      {/* Right Section: Modern Login Form */}
      <div className="flex w-full flex-1 items-center justify-center bg-[#0081C9] p-6 lg:p-12">
        <div className="fade-up w-full max-w-[460px] rounded-[2.5rem] bg-white p-10 shadow-2xl shadow-blue-900/20">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome Back!!
            </h2>
            <p className="mt-3 text-slate-400 font-medium">
              Sign in with your email and password
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600 animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 ml-1">
                Email address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#0081C9] transition-colors" />
                </div>
                <input
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-12 pr-4 py-4 text-slate-900 font-medium outline-none transition-all focus:border-[#0081C9] focus:bg-white focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  placeholder="gitakshmi@gmail.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <Link to="/forgot-password" disabled className="text-sm font-bold text-[#0081C9] hover:text-blue-700 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#0081C9] transition-colors" />
                </div>
                <input
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-12 pr-12 py-4 text-slate-900 font-medium outline-none transition-all focus:border-[#0081C9] focus:bg-white focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-[#0081C9] py-4 text-lg font-bold text-white shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-blue-600/30 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : "Sign in"}
            </button>

            <p className="mt-8 text-center text-sm font-bold text-slate-500">
              New here?{" "}
              <Link className="text-[#0081C9] hover:text-blue-700 transition-colors" to="/register">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
