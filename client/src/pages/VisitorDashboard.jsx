import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { CheckCircle, Calendar, LogOut } from "lucide-react";
import toast from "react-hot-toast";

export default function VisitorDashboard() {
  const [publicMeetings, setPublicMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const visitorId = localStorage.getItem('visitorId') || Math.random().toString(36).substr(2, 9).toUpperCase();
  const fullName = localStorage.getItem('visitorName') || "Guest";
  const firstName = fullName.split(' ')[0]; // Take only the first name

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await API.get("/api/visitors/public/meetings");
        if (!cancelled) setPublicMeetings(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExit = () => {
    localStorage.removeItem("pendingRole");
    localStorage.removeItem("visitorId");
    localStorage.removeItem("visitorName");
    navigate("/role-selection");
    toast.success("Exited from portal");
  };

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

              <div className="relative z-10">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner mx-auto rotate-3">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>

                <h2 className="text-2xl font-black text-slate-900 leading-tight">Identity Verified</h2>
                <p className="text-sm text-green-600 font-bold mt-2">Entry Pass Confirmed ✅</p>
                
                <div className="mt-6 flex justify-center">
                  <div className="p-2 bg-white rounded-2xl shadow-sm border-2 border-emerald-100">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('http://10.125.183.132:5174/visitor-dashboard')}`}
                      alt="Entry Pass QR"
                      className="w-28 h-28"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                  Your identity has been successfully verified. You are now authorized to enter the building.
                </p>

                <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 w-full text-left">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Your Digital ID:</p>
                  <p className="text-sm font-mono font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm">
                    {visitorId}
                  </p>
                </div>

                <div className="mt-6 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-[10px] text-emerald-700 font-bold">WELCOME TO THE OFFICE</p>
                </div>
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

              {loading ? (
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
