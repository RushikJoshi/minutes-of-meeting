import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  CheckCircle, XCircle, User, Briefcase, Phone, 
  MapPin, Clock, Camera, RefreshCw, LogIn, Mail 
} from "lucide-react";
import API from "../api/api";
import toast from "react-hot-toast";

export default function VisitorVerification() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVisitor() {
      try {
        const res = await API.get(`/api/visitors/verify/${token}`);
        if (res.data.success) {
          setVisitor(res.data.visitor);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Invalid or expired link");
      } finally {
        setLoading(false);
      }
    }
    fetchVisitor();
  }, [token]);

  const handleCheckIn = async () => {
    setVerifying(true);
    try {
      const res = await API.post("/api/visitors/verify-entry", { token });
      if (res.data.success) {
        toast.success("Checked In Successfully!");
        setVisitor(res.data.visitor);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Check-in failed");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100 text-center max-w-sm w-full">
          <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900">Verification Failed</h2>
          <p className="text-slate-500 mt-2 font-medium">{error}</p>
          <button onClick={() => navigate("/")} className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold transition-transform hover:scale-105">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-[24px] p-1 mx-auto mb-4 shadow-xl">
            <div className="w-full h-full bg-slate-50 rounded-[20px] overflow-hidden">
              {visitor.photoUrl ? (
                <img src={`${API.defaults.baseURL}${visitor.photoUrl}`} className="w-full h-full object-cover" alt="Visitor" />
              ) : (
                <User className="w-full h-full p-4 text-slate-200" />
              )}
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-white">{visitor.name}</h2>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-semibold uppercase tracking-widest border border-emerald-500/20">
            {visitor.status}
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Host</p>
              <p className="text-sm font-bold text-slate-900">{visitor.meetingWithName}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Purpose</p>
              <p className="text-sm font-bold text-slate-900 truncate">{visitor.purpose}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Phone className="w-4 h-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Mobile</span>
                <span className="text-sm font-bold text-slate-900">{visitor.mobile}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Mail className="w-4 h-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Email</span>
                <span className="text-sm font-bold text-slate-900">{visitor.email || 'Not Provided'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <MapPin className="w-4 h-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Address</span>
                <span className="text-sm font-bold text-slate-900 leading-tight">{visitor.address || 'Not Provided'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Briefcase className="w-4 h-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Identity Document</span>
                <span className="text-sm font-bold text-slate-900">
                  {visitor.document?.type || 'ID'}: {visitor.document?.number || 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-slate-600 bg-blue-50 p-3 rounded-xl border border-blue-100">
              <Clock className="w-4 h-4 text-blue-600" />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-blue-400 uppercase">Meeting Schedule</span>
                <span className="text-sm font-bold text-blue-900">{new Date(visitor.meetingTime).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {visitor.status === "APPROVED" && (
            <button
              onClick={handleCheckIn}
              disabled={verifying}
              className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-semibold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-95"
            >
              {verifying ? <RefreshCw className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
              {verifying ? "VERIFYING..." : "CONFIRM CHECK-IN"}
            </button>
          )}

          {visitor.status === "CHECKED_IN" && (
            <div className="py-5 bg-blue-50 text-blue-700 rounded-[24px] font-semibold text-center flex items-center justify-center gap-3 border-2 border-blue-100">
              <CheckCircle className="w-6 h-6" />
              ALREADY CHECKED IN
            </div>
          )}

          {visitor.status === "PENDING" && (
            <div className="p-6 bg-amber-50 rounded-[24px] text-center border-2 border-dashed border-amber-200">
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-amber-800 font-semibold uppercase text-sm">Waiting for Host Approval</p>
              <p className="text-amber-600 text-xs font-bold mt-1">This pass will be valid once approved.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
