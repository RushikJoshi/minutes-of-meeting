import React, { useState, useEffect } from "react";
import { 
  Users, Search, CheckCircle, LogIn, LogOut, 
  Clock, Camera, User, Mail, Phone, Calendar, RefreshCw
} from "lucide-react";
import API from "../api/api";
import toast from "react-hot-toast";

export default function ReceptionistDashboard() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 10000); // Auto refresh every 10s
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

  const handleStatusChange = async (id, action) => {
    try {
      const res = await API.post(`/api/visitors/${action}/${id}`);
      if (res.data.success) {
        toast.success(`Visitor marked as ${action === 'check-in' ? 'IN' : 'OUT'}`);
        fetchVisitors();
        if (selectedVisitor?._id === id) {
          setSelectedVisitor(res.data.visitor);
        }
      }
    } catch (err) {
      toast.error("Action Failed");
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.mobile.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black">R</div>
            <h1 className="text-xl font-bold tracking-tight">Reception Console</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase font-black text-slate-500">Live Status</p>
              <p className="text-emerald-400 text-sm font-bold">Active Terminal</p>
            </div>
            <button onClick={fetchVisitors} className="p-2 hover:bg-slate-800 rounded-full transition">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Visitor List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search by Visitor Name or Mobile..." 
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="py-20 text-center"><RefreshCw className="w-10 h-10 animate-spin mx-auto text-blue-600" /></div>
            ) : filteredVisitors.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed text-slate-400 font-bold">No Visitors Found</div>
            ) : filteredVisitors.map(v => (
              <div 
                key={v._id} 
                onClick={() => setSelectedVisitor(v)}
                className={`group bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedVisitor?._id === v._id ? 'border-blue-500 shadow-lg ring-1 ring-blue-500' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border-2 border-white shadow-sm">
                  {v.photoUrl ? <img src={v.photoUrl} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-slate-300" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{v.name}</h4>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {v.mobile}</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {v.purpose}</span>
                  </div>
                </div>
                <div className="text-right px-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-1 ${
                    v.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 
                    v.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                    v.status === 'CHECKED_IN' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {v.status}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">{new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Details Pane */}
        <div className="lg:col-span-4">
          <div className="sticky top-6">
            {!selectedVisitor ? (
              <div className="bg-slate-100 rounded-3xl p-10 text-center border-2 border-dashed border-slate-200">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Select a visitor to view details</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col">
                <div className="h-24 bg-slate-900 relative">
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <div className="w-24 h-24 bg-white rounded-3xl p-1 shadow-xl">
                      <div className="w-full h-full bg-slate-50 rounded-2xl overflow-hidden">
                        {selectedVisitor.photoUrl ? <img src={selectedVisitor.photoUrl} className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 text-slate-200" />}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-16 p-8 text-center space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{selectedVisitor.name}</h3>
                    <p className="text-slate-500 font-bold text-sm tracking-tight">{selectedVisitor.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl text-left border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Host</p>
                      <p className="text-xs font-bold text-slate-800">{selectedVisitor.meetingWithName}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl text-left border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Mobile</p>
                      <p className="text-xs font-bold text-slate-800">{selectedVisitor.mobile}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedVisitor.status === "APPROVED" && (
                      <button 
                        onClick={() => handleStatusChange(selectedVisitor._id, 'check-in')}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                      >
                        <LogIn className="w-5 h-5" />
                        MARK CHECK-IN
                      </button>
                    )}
                    {selectedVisitor.status === "CHECKED_IN" && (
                      <button 
                        onClick={() => handleStatusChange(selectedVisitor._id, 'check-out')}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg"
                      >
                        <LogOut className="w-5 h-5" />
                        MARK CHECK-OUT
                      </button>
                    )}
                    {selectedVisitor.status === "CHECKED_OUT" && (
                      <div className="p-4 bg-slate-100 rounded-2xl text-slate-500 font-bold flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        VISIT COMPLETED
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-left space-y-2">
                    <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase">
                      <Clock className="w-3 h-3" /> Timings
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-blue-900">
                      <div>IN: {selectedVisitor.inTime ? new Date(selectedVisitor.inTime).toLocaleTimeString() : '--:--'}</div>
                      <div>OUT: {selectedVisitor.outTime ? new Date(selectedVisitor.outTime).toLocaleTimeString() : '--:--'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
