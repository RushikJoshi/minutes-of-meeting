import React, { useState, useEffect } from "react";
import {
  Users, Search, CheckCircle, LogIn, LogOut,
  Clock, User, Phone, RefreshCw, Briefcase,
  MessageCircle, FileDown, XCircle, MapPin,
  Mail, CreditCard, Calendar, Shield, AlertCircle
} from "lucide-react";
import API from "../api/api";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  PENDING:    { color: "bg-amber-100 text-amber-700 border-amber-200",   dot: "bg-amber-500",   label: "Pending" },
  APPROVED:   { color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Approved" },
  CHECKED_IN: { color: "bg-blue-100 text-blue-700 border-blue-200",      dot: "bg-blue-500",    label: "Checked In" },
  CHECKED_OUT:{ color: "bg-slate-100 text-slate-600 border-slate-200",   dot: "bg-slate-400",   label: "Checked Out" },
  REJECTED:   { color: "bg-red-100 text-red-700 border-red-200",         dot: "bg-red-500",     label: "Rejected" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border shadow-sm flex items-center gap-4 ${color}`}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-current bg-opacity-10">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

import logoIcon from "../assets/logo_icon_final.png";

export default function ReceptionistDashboard() {
  const [visitors, setVisitors]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [activeFilter, setActiveFilter]   = useState("ALL");

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchVisitors = async () => {
    try {
      const res = await API.get("/api/visitors");
      setVisitors(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await API.post(`/api/visitors/${action}/${id}`);
      if (res.data.success) {
        const labels = { "check-in": "Checked In", "check-out": "Checked Out" };
        toast.success(`Visitor ${labels[action] || action}`);
        fetchVisitors();
        if (selectedVisitor?._id === id) setSelectedVisitor(res.data.visitor);
      }
    } catch (err) {
      toast.error("Action Failed");
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await API.get(`/api/visitors/action/reject/${id}`);
      toast.success("Visitor rejected");
      fetchVisitors();
      if (selectedVisitor?._id === id) setSelectedVisitor(prev => ({ ...prev, status: "REJECTED" }));
    } catch (err) {
      toast.error("Reject failed");
    }
  };

  const shareWhatsApp = (v) => {
    const text = `*Visitor Pass*\n👤 Name: ${v.name}\n📱 Mobile: ${v.mobile}\n🎯 Purpose: ${v.purpose}\n🏢 Host: ${v.meetingWithName}\n🔑 Entry Code: ${v.entryCode || "N/A"}\n📊 Status: ${v.status}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const downloadPass = (v) => {
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
      <head>
        <title>Visitor Pass - ${v.entryCode || "N/A"}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; margin: 0; padding: 25mm; font-family: 'Inter', sans-serif; background-color: #ffffff; color: #1e293b; }
          .document-wrapper { width: 100%; max-width: 170mm; margin: 0 auto; display: flex; flex-direction: column; min-height: 247mm; }
          .header-line { height: 4px; background: linear-gradient(to right, #0f172a, #3b82f6); border-radius: 2px; margin-bottom: 32px; }
          .section-title { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 16px; }
          .info-card { background: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #f1f5f9; }
          .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 13px; font-weight: 600; color: #1e293b; }
          @media print { body { padding: 25mm; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="document-wrapper">
          <!-- Top Header -->
          <div class="flex justify-between items-end mb-4">
            <div>
              <div class="text-2xl font-black tracking-tighter text-slate-900">MOM <span class="text-blue-600">SYSTEM</span></div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gitakshmi Technologies PVT LTD</div>
            </div>
            <div class="text-right">
              <h2 class="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Visitor Visit Record</h2>
              <div class="text-[9px] font-bold text-slate-400">Ref: ${v._id?.slice(-8).toUpperCase()}</div>
            </div>
          </div>
          
          <div class="header-line"></div>

          <!-- Highlight Section -->
          <div class="mb-12 flex justify-between items-start">
            <div>
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visitor Name</div>
              <h1 class="text-5xl font-black text-slate-900 tracking-tight uppercase">${v.name}</h1>
            </div>
            <!-- Removed status badge as per request -->
          </div>

          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-6 mb-12">
            <div class="space-y-6">
              <div class="info-card">
                <div class="label">Contact Information</div>
                <div class="space-y-4 mt-4">
                  <div>
                    <div class="label text-[9px]">Mobile Number</div>
                    <div class="value">${v.mobile}</div>
                  </div>
                  <div>
                    <div class="label text-[9px]">Email Address</div>
                    <div class="value">${v.email || "—"}</div>
                  </div>
                </div>
              </div>

              <div class="info-card">
                <div class="label">Identification Details</div>
                <div class="mt-4">
                  <div class="label text-[9px]">ID Proof Type / Number</div>
                  <div class="value uppercase">${v.document?.type || "—"} : ${v.document?.number || "—"}</div>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div class="info-card h-full">
                <div class="label">Visit Details</div>
                <div class="space-y-4 mt-4">
                  <div>
                    <div class="label text-[9px]">Purpose of Visit</div>
                    <div class="value capitalize">${v.purpose}</div>
                  </div>
                  <div>
                    <div class="label text-[9px]">Designated Host</div>
                    <div class="value">${v.meetingWithName}</div>
                  </div>
                  <div>
                    <div class="label text-[9px]">Security Entry Code</div>
                    <div class="value tracking-[0.3em]">${v.entryCode || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Timeline Section -->
          <div class="mb-12">
            <div class="section-title">Logistics & Timestamps</div>
            <div class="grid grid-cols-2 gap-8">
              <div class="flex items-center gap-4">
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                <div>
                  <div class="label">Check-In Time</div>
                  <div class="value">${v.inTime ? new Date(v.inTime).toLocaleString() : "—"}</div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-2 h-2 rounded-full bg-slate-400"></div>
                <div>
                  <div class="label">Check-Out Time</div>
                  <div class="value">${v.outTime ? new Date(v.outTime).toLocaleString() : "—"}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div>Generated by Security Management System</div>
            <div>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => {
      win.print();
    }, 500);
  };

  // Stats
  const today = new Date(); today.setHours(0,0,0,0);
  const todayVisitors = visitors.filter(v => new Date(v.createdAt) >= today);
  const stats = {
    total:      todayVisitors.length,
    checkedIn:  visitors.filter(v => v.status === "CHECKED_IN").length,
    pending:    visitors.filter(v => v.status === "PENDING").length,
    approved:   visitors.filter(v => v.status === "APPROVED").length,
  };

  const FILTERS = ["ALL", "PENDING", "APPROVED", "CHECKED_IN", "CHECKED_OUT", "REJECTED"];

  const filteredVisitors = visitors.filter(v => {
    const matchFilter = activeFilter === "ALL" || v.status === activeFilter;
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      v.entryCode?.includes(searchTerm) ||
      v.name?.toLowerCase().includes(term) ||
      v.mobile?.includes(searchTerm) ||
      v.token === searchTerm;
    return matchFilter && matchSearch;
  });

  // Auto-select on QR/code scan
  useEffect(() => {
    let term = searchTerm.trim();
    if (term.includes("/visitor/verify/")) {
      const parts = term.split("/");
      term = parts[parts.length - 1];
    }
    if (term.length >= 6) {
      const match = visitors.find(v => v.token === term || v.entryCode === term);
      if (match) setSelectedVisitor(match);
    }
  }, [searchTerm, visitors]);

  // Timeline steps
  const getTimeline = (v) => [
    { label: "Registered",  time: v.createdAt,   done: true,               icon: User },
    { label: "Approved",    time: v.approvedAt,   done: v.status !== "PENDING" && v.status !== "REJECTED", icon: CheckCircle },
    { label: "Checked In",  time: v.inTime,       done: !!v.inTime,         icon: LogIn },
    { label: "Checked Out", time: v.outTime,      done: !!v.outTime,        icon: LogOut },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* Navbar */}
      <nav className="bg-slate-900 text-white shadow-2xl">
        <div className="w-full px-4 sm:px-6 lg:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2.5 transition-transform hover:scale-105 overflow-hidden">
              <img src={logoIcon} alt="Logo" className="w-full h-full object-contain object-center" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-semibold tracking-tight">Reception Console</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Security & Visitor Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-bold">Live</span>
            </div>
            <button onClick={fetchVisitors} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="w-full px-4 sm:px-6 lg:px-6 py-6 flex-1 space-y-6">

        {/* Live Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today's Visitors" value={stats.total}     icon={Users}        color="border-slate-200 text-slate-600" />
          <StatCard label="Checked In"        value={stats.checkedIn} icon={LogIn}         color="border-blue-200 text-blue-600" />
          <StatCard label="Pending Approval"  value={stats.pending}   icon={AlertCircle}   color="border-amber-200 text-amber-600" />
          <StatCard label="Approved"          value={stats.approved}  icon={CheckCircle}   color="border-emerald-200 text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left: List */}
          <div className="lg:col-span-7 space-y-4">

            {/* Search + Filter */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search name, mobile, or 6-digit entry code..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold transition"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap transition ${activeFilter === f ? "bg-blue-600 text-white shadow" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  >
                    {f === "ALL" ? `All (${visitors.length})` : f.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Visitor Cards */}
            <div className="space-y-3">
              {loading ? (
                <div className="py-16 text-center bg-white rounded-2xl border">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
                  <p className="text-slate-400 font-bold text-sm">Loading visitors...</p>
                </div>
              ) : filteredVisitors.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold">No visitors found</p>
                </div>
              ) : filteredVisitors.map(v => (
                <div
                  key={v._id}
                  onClick={() => setSelectedVisitor(v)}
                  className={`group bg-white p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-4 transition-all hover:shadow-md ${selectedVisitor?._id === v._id ? "border-blue-500 shadow-lg shadow-blue-50 ring-1 ring-blue-500" : "border-slate-100 hover:border-slate-200"}`}
                >
                  {/* Photo */}
                  <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-sm">
                    {v.photoUrl
                      ? <img src={v.photoUrl.startsWith("data:") ? v.photoUrl : `${API.defaults.baseURL}${v.photoUrl}`} className="w-full h-full object-cover" alt={v.name} />
                      : <User className="w-full h-full p-3 text-slate-300" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate">{v.name}</h4>
                      {v.entryCode && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-lg text-[10px] font-semibold tracking-widest shrink-0">
                          {v.entryCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold mt-1 flex-wrap">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{v.mobile}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{v.purpose}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{v.meetingWithName}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="text-right shrink-0 space-y-1">
                    <StatusBadge status={v.status} />
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(v.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Details Pane */}
          <div className="lg:col-span-5">
            <div className="sticky top-6">
              {!selectedVisitor ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
                  <Shield className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold text-sm">Select a visitor to view full details</p>
                  <p className="text-slate-300 text-xs mt-1">Or scan / enter entry code above</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

                  {/* Header Banner */}
                  <div className="h-28 bg-gradient-to-r from-slate-800 via-slate-900 to-blue-900 relative">

                    <div className="absolute -bottom-10 left-6">
                      <div className="w-20 h-20 bg-white rounded-2xl p-1 shadow-xl">
                        <div className="w-full h-full bg-slate-50 rounded-xl overflow-hidden">
                          {selectedVisitor.photoUrl
                            ? <img src={selectedVisitor.photoUrl.startsWith("data:") ? selectedVisitor.photoUrl : `${API.defaults.baseURL}${selectedVisitor.photoUrl}`} className="w-full h-full object-cover" alt={selectedVisitor.name} />
                            : <User className="w-full h-full p-4 text-slate-300" />}
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-4">
                      <StatusBadge status={selectedVisitor.status} />
                    </div>
                  </div>

                  <div className="pt-12 px-6 pb-6 space-y-5">

                    {/* Name & Entry Code */}
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{selectedVisitor.name}</h3>
                      {selectedVisitor.entryCode && (
                        <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl">
                          <span className="text-[10px] font-semibold text-blue-400 uppercase">Entry Code</span>
                          <span className="text-lg font-semibold text-blue-700 tracking-[0.2em]">{selectedVisitor.entryCode}</span>
                        </div>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      {[
                        { icon: Mail,     label: "Email",    value: selectedVisitor.email },
                        { icon: Phone,    label: "Mobile",   value: selectedVisitor.mobile },
                        { icon: User,     label: "Host",     value: selectedVisitor.meetingWithName },
                        { icon: Calendar, label: "Time",     value: selectedVisitor.meetingTime ? new Date(selectedVisitor.meetingTime).toLocaleString() : "—" },
                        { icon: Briefcase,label: "Purpose",  value: selectedVisitor.purpose, span: true },
                        { icon: MapPin,   label: "Address",  value: selectedVisitor.address, span: true },
                        { icon: CreditCard,label:"ID Proof", value: `${selectedVisitor.document?.type || "—"}: ${selectedVisitor.document?.number || "—"}`, span: true },
                      ].map(({ icon: Icon, label, value, span }) => (
                        <div key={label} className={`p-2.5 bg-slate-50 rounded-xl border border-slate-100 ${span ? "col-span-2" : ""}`}>
                          <div className="flex items-center gap-1 mb-1">
                            <Icon className="w-3 h-3 text-slate-400" />
                            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
                          </div>
                          <p className="font-bold text-slate-800 text-xs leading-tight">{value || "—"}</p>
                        </div>
                      ))}
                    </div>

                    {/* Timeline */}
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Visit Timeline</p>
                      <div className="space-y-2">
                        {getTimeline(selectedVisitor).map(({ label, time, done, icon: Icon }, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1">
                              <p className={`text-xs font-bold ${done ? "text-slate-800" : "text-slate-400"}`}>{label}</p>
                            </div>
                            <p className="text-[10px] font-semibold text-slate-400">
                              {time ? new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2.5">
                      {selectedVisitor.status === "APPROVED" && (
                        <button
                          onClick={() => handleAction(selectedVisitor._id, "check-in")}
                          className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 text-sm"
                        >
                          <LogIn className="w-4 h-4" /> CHECK IN
                        </button>
                      )}
                      {selectedVisitor.status === "CHECKED_IN" && (
                        <button
                          onClick={() => handleAction(selectedVisitor._id, "check-out")}
                          className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100 text-sm"
                        >
                          <LogOut className="w-4 h-4" /> CHECK OUT
                        </button>
                      )}
                      {(selectedVisitor.status === "CHECKED_OUT") && (
                        <div className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4" /> VISIT COMPLETED
                        </div>
                      )}
                      {(selectedVisitor.status === "PENDING" || selectedVisitor.status === "APPROVED") && (
                        <button
                          onClick={() => handleReject(selectedVisitor._id)}
                          className="w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition text-sm"
                        >
                          <XCircle className="w-4 h-4" /> REJECT VISITOR
                        </button>
                      )}

                      {/* Share & Download */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => shareWhatsApp(selectedVisitor)}
                          className="py-2.5 bg-green-50 text-green-700 border border-green-100 rounded-xl font-semibold flex items-center justify-center gap-1.5 hover:bg-green-100 transition text-xs"
                        >
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                        </button>
                        <button
                          onClick={() => downloadPass(selectedVisitor)}
                          className="py-2.5 bg-slate-900 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-700 transition text-xs"
                        >
                          <FileDown className="w-4 h-4" /> Download Pass
                        </button>
                      </div>
                    </div>

                    {/* Timing row */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                        <p className="text-[9px] font-semibold text-emerald-500 uppercase mb-1">Check-In</p>
                        <p className="font-bold text-emerald-800">{selectedVisitor.inTime ? new Date(selectedVisitor.inTime).toLocaleTimeString() : "—"}</p>
                      </div>
                      <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-[9px] font-semibold text-blue-500 uppercase mb-1">Check-Out</p>
                        <p className="font-bold text-blue-800">{selectedVisitor.outTime ? new Date(selectedVisitor.outTime).toLocaleTimeString() : "—"}</p>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
