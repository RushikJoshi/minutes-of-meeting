import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Users, Building2, UserCircle, ArrowRight, ArrowLeft, ExternalLink, Copy, Share2 } from "lucide-react";
import API from "../api/api";
import toast from "react-hot-toast";

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState(null);
  const [visitorName, setVisitorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const navigate = useNavigate();

  const roles = [
    {
      id: "admin",
      title: "Admin",
      description: "Complete system access & management",
      icon: <Building2 className="w-6 h-6" />,
      color: "blue",
    },
    {
      id: "employee",
      title: "Employee",
      description: "Manage meetings & check participants",
      icon: <UserCircle className="w-6 h-6" />,
      color: "indigo",
    },
    {
      id: "receptionist",
      title: "Receptionist",
      description: "Scan QR & manage visitor entry/exit",
      icon: <Users className="w-6 h-6" />,
      color: "emerald",
    },
    {
      id: "visitor",
      title: "Visitor",
      description: "Self check-in for office visits",
      icon: <User className="w-6 h-6" />,
      color: "purple",
    },
  ];

  const handleRoleSelect = async (role) => {
    if (role === "visitor") {
      setSelectedRole("visitor");
      return;
    }
    if (role === "receptionist") {
      navigate("/receptionist-dashboard");
      return;
    }
    localStorage.setItem("pendingRole", role);
    navigate("/document-verification", { state: { role } });
  };

  const generateVisitorQR = async (e) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      toast.error("Please enter visitor name");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/api/visitors/generate-qr", { name: visitorName });
      if (res.data.success) {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/v/${encodeURIComponent(res.data.name)}/${res.data.token}`;
        setQrData(url);
        toast.success("Link Generated successfully!");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to generate link.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(qrData);
    toast.success("Link copied to clipboard!");
  };

  const shareToWhatsApp = () => {
    const text = `Visitor Registration Link for ${visitorName}: ${qrData}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 mb-4">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome to GT MOM</h1>
          <p className="text-slate-500 mt-2">Select your role to continue</p>
        </div>

        {/* Role Cards */}
        {!selectedRole ? (
          <div className="grid gap-4">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className="group relative flex items-center p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-purple-400 hover:shadow-md transition-all duration-300 text-left"
              >
                <div className={`p-3 rounded-xl bg-${role.color}-50 text-${role.color}-600 group-hover:scale-110 transition-transform`}>
                  {role.icon}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="font-bold text-slate-900">{role.title}</h3>
                  <p className="text-sm text-slate-500">{role.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        ) : (
          /* Visitor Flow */
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center relative overflow-hidden">
            <button
              onClick={() => { setSelectedRole(null); setQrData(null); }}
              className="absolute top-4 left-4 p-2 hover:bg-slate-100 rounded-full transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>

            {!qrData ? (
              <form onSubmit={generateVisitorQR} className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Visitor Setup</h3>
                <p className="text-sm text-slate-500">Enter the visitor's name to generate a one-time secure registration link.</p>
                <div>
                  <input
                    className="input-field w-full px-4 py-3 border rounded-xl focus:ring focus:ring-purple-200 text-center text-lg font-semibold"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Enter Visitor Full Name"
                    required
                  />
                </div>
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full py-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-100"
                >
                  {loading ? "Generating..." : "Generate Secure Link"}
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center space-y-6">
                <div className="w-full">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Link Generated!</h3>
                  <p className="text-sm text-slate-500 mb-4">The secure registration link for {visitorName} is ready.</p>
                </div>

                <div className="w-full flex flex-col items-center mb-6">
                  <div className="p-4 bg-white rounded-3xl shadow-lg border-2 border-purple-50">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData.replace('localhost', '10.125.183.132'))}`}
                      alt="Registration QR"
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-widest">Scan QR or</p>
                </div>

                <div className="grid grid-cols-1 gap-3 w-full">
                  <button
                    onClick={() => window.open(qrData, "_blank")}
                    className="bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition shadow-lg shadow-purple-200"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-xl">📄</span>
                    </div>
                    Click to Open Register Form
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </button>
                    <button
                      onClick={shareToWhatsApp}
                      className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-600 rounded-xl font-bold hover:bg-green-100 transition border border-green-100"
                    >
                      <Share2 className="w-4 h-4" />
                      WhatsApp
                    </button>
                  </div>
                </div>

                <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight text-left mb-1">Direct URL:</p>
                  <p className="text-slate-600 text-xs break-all font-mono text-left bg-white p-2 rounded-lg border border-slate-100">
                    {qrData}
                  </p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded-lg w-full border border-amber-100">
                  <span>⚠️</span>
                  <span>This secure link is single-use and will expire in 10 minutes.</span>
                </div>

                <button
                  onClick={() => { setQrData(null); setVisitorName(""); }}
                  className="text-sm text-slate-400 hover:text-slate-800 underline font-semibold"
                >
                  Generate another link
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
