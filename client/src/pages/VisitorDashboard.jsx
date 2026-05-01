import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { CheckCircle, Calendar, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { getPublicFrontendBaseUrl } from "../utils/publicUrl";

export default function VisitorDashboard() {
  const [publicMeetings, setPublicMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [visitorLoading, setVisitorLoading] = useState(true);
  const [visitorData, setVisitorData] = useState(null);
  const [publicFrontendBase, setPublicFrontendBase] = useState(getPublicFrontendBaseUrl());
  const navigate = useNavigate();

  const fullName = localStorage.getItem('visitorName') || "Guest";
  const firstName = fullName.split(' ')[0];

  // These come from state (fetched from server) so they're always up-to-date
  const entryCode = visitorData?.entryCode || "";
  const visitorToken = visitorData?.token || "";

  useEffect(() => {
    let cancelled = false;

    async function fetchVisitorData() {
      let visitor = null;
      const storedId = localStorage.getItem('visitorId');
      const storedToken = localStorage.getItem('visitorToken');
      const storedEmail = localStorage.getItem('visitorEmail');

      // Try 1: by MongoDB ID
      if (!visitor && storedId && storedId !== "undefined" && storedId !== "null") {
        try {
          const vRes = await API.get(`/api/visitors/single/${storedId}`);
          if (vRes.data?.visitor) visitor = vRes.data.visitor;
        } catch (e) { console.warn("ID lookup failed:", e.message); }
      }

      // Try 2: by UUID token
      if (!visitor && storedToken && storedToken !== "undefined" && storedToken !== "") {
        try {
          const vRes = await API.get(`/api/visitors/verify/${storedToken}`);
          if (vRes.data?.visitor) {
            visitor = vRes.data.visitor;
            localStorage.setItem("visitorId", visitor._id);
          }
        } catch (e) { console.warn("Token lookup failed:", e.message); }
      }

      // Try 3: by email
      if (!visitor && storedEmail && storedEmail !== "") {
        try {
          const vRes = await API.get(`/api/visitors/by-email/${encodeURIComponent(storedEmail)}`);
          if (vRes.data?.visitor) {
            visitor = vRes.data.visitor;
            localStorage.setItem("visitorId", visitor._id);
            localStorage.setItem("visitorToken", visitor.token || "");
          }
        } catch (e) { console.warn("Email lookup failed:", e.message); }
      }

      if (!cancelled) {
        if (visitor) setVisitorData(visitor);
        setVisitorLoading(false);
      }
    }

    async function fetchMeetings() {
      try {
        const res = await API.get("/api/visitors/public/meetings");
        if (!cancelled) setPublicMeetings(res.data || []);
      } catch {
        // non-critical
      } finally {
        if (!cancelled) setMeetingsLoading(false);
      }
    }

    fetchMeetings();
    fetchVisitorData();

    // Ensure QR URL is reachable from phones (even if dashboard opened on localhost)
    (async () => {
      try {
        const meta = await API.get("/api/meta/public-client-base");
        if (!cancelled && meta.data?.baseUrl) setPublicFrontendBase(meta.data.baseUrl);
      } catch {
        // ignore; fall back to origin/env
      }
    })();

    // Poll every 5 seconds so status auto-updates when host approves
    const poll = setInterval(fetchVisitorData, 5000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, []);

  const handleExit = () => {
    localStorage.removeItem("pendingRole");
    localStorage.removeItem("visitorId");
    localStorage.removeItem("visitorName");
    localStorage.removeItem("visitorToken");
    localStorage.removeItem("visitorEmail");
    navigate("/role-selection");
    toast.success("Exited from portal");
  };

  // QR should point to a URL reachable from the scanning device.
  const frontendBase = publicFrontendBase || getPublicFrontendBaseUrl();
  const qrData = visitorToken
    ? `${frontendBase}/visitor/verify/${visitorToken}`
    : "";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto fade-up">

        <div className="mb-10 flex items-center justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome, {firstName}!</h1>
            <p className="text-slate-500 mt-1">Manage your access and view today's schedule.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-purple-700">
                Verified Access
              </span>
            </div>
            <button
              onClick={handleExit}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition border border-red-100 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Exit Portal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Verification Status Card */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 z-0" />

              <div className="relative z-10 w-full">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner mx-auto rotate-3">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>

                <h2 className="text-2xl font-black text-slate-900 leading-tight">Identity Verified</h2>
                <p className="text-sm text-green-600 font-bold mt-2">Entry Pass Confirmed ✅</p>

                {visitorLoading ? (
                  <div className="mt-8 flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                    <p className="text-xs text-slate-400 font-semibold">Loading your pass...</p>
                  </div>
                ) : visitorData?.status === "APPROVED" || visitorData?.status === "CHECKED_IN" ? (
                  <>
                    <div className="mt-6 flex justify-center">
                      <div className="p-2 bg-white rounded-2xl shadow-sm border-2 border-emerald-100">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`}
                          alt="Entry Pass QR"
                          className="w-28 h-28"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                      Show this QR to the receptionist to check in.
                    </p>

                    <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full text-left">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Your Entry Code:</p>
                      <p className="text-xl font-mono font-black text-slate-900 bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm tracking-[0.3em]">
                        {entryCode}
                      </p>
                    </div>

                    <div className="mt-6 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-[10px] text-emerald-700 font-bold">WELCOME TO THE OFFICE</p>
                    </div>
                  </>
                ) : (
                  <div className="mt-8 p-5 bg-amber-50 rounded-2xl border border-amber-100 w-full text-left">
                    <p className="text-sm font-bold text-amber-800">⏳ Awaiting Approval</p>
                    <p className="text-xs text-amber-600 mt-1">Your entry pass (QR + Code) will appear here once the host approves your request. Refresh this page after approval.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Public Meetings */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Upcoming Meetings</h2>
              </div>

              {meetingsLoading ? (
                <div className="flex flex-col items-center py-20">
                  <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                  <p className="text-slate-400 mt-4 font-medium">Loading schedule...</p>
                </div>
              ) : publicMeetings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publicMeetings.map((m) => (
                    <div
                      key={m._id}
                      className="group flex flex-col p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-purple-200 hover:shadow-xl hover:shadow-purple-50 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-3 py-1 bg-white text-purple-600 text-[10px] font-black rounded-lg border border-purple-100 shadow-sm uppercase tracking-widest">
                          Public
                        </span>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400">STARTS AT</p>
                          <p className="text-sm font-black text-slate-900">
                            {m.startTime ? new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "--:--"}
                          </p>
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2 group-hover:text-purple-600 transition-colors">{m.title}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-auto">
                        {m.date ? new Date(m.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : "Date TBD"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium italic">No public meetings scheduled for today.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
