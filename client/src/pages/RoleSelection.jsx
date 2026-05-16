import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Users, Building2, UserCircle, ArrowRight, ArrowLeft, ExternalLink, Copy, Share2 } from "lucide-react";
import API from "../api/api";
import toast from "react-hot-toast";
import { getPublicFrontendBaseUrl } from "../utils/publicUrl";

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
    /*
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
    */
  ];

  const handleRoleSelect = async (role) => {
    /*
    if (role === "visitor") {
      setSelectedRole("visitor");
      return;
    }
    if (role === "receptionist") {
      navigate("/receptionist-dashboard");
      return;
    }
    */
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
        let baseUrl = getPublicFrontendBaseUrl();
        try {
          const meta = await API.get("/api/meta/public-client-base");
          if (meta.data?.baseUrl) baseUrl = meta.data.baseUrl;
        } catch {
          // ignore; fall back to current origin/env
        }
        const url = `${baseUrl}/v/${res.data.token}`;
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

  const copyLinkOnly = async () => {
    const link = String(qrData || "").trim();
    if (!link) {
      toast.error("Link not available yet");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      toast.success("URL copied (clickable in WhatsApp)");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const shareToWhatsApp = async () => {
    const link = String(qrData || "").trim();
    if (!link) {
      toast.error("Link not available yet");
      return;
    }

    // Prefer native share (mobile) so WhatsApp treats the URL as a real link preview/clickable.
    if (navigator.share) {
      try {
        await navigator.share({ title: "GT MOM", url: link });
        return;
      } catch {
        // ignore and fall back to wa link
      }
    }

    const encoded = encodeURIComponent(link);

    // Fallback: send ONLY the URL (most reliable for WhatsApp link detection).
    const opened = window.open(`https://wa.me/?text=${encoded}`, "_blank");
    if (!opened) window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
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

            {/* 
            {!qrData ? (
              ... (commented out visitor flow) ...
            )}
            */}
            <div className="text-slate-400 py-4">Visitor modules are moved to a separate project.</div>
          </div>
        )}
      </div>
    </div>
  );
}
