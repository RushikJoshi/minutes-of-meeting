/*
import React, { useState, useEffect } from "react";
import axios from "../api/api";
import { toast } from "react-hot-toast";

const VisitorForm = ({ onSuccess }) => {
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [meetingsError, setMeetingsError] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      setMeetingsLoading(true);
      setMeetingsError(false);
      try {
        const res = await axios.get("/api/meetings");
        setMeetings(res.data);
      } catch (err) {
        setMeetingsError(true);
        console.error("Failed to fetch meetings", err);
      } finally {
        setMeetingsLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const verifyAadhar = async (num) => {
    if (num.length !== 12) return;
    setIsVerifying(true);
    setVerificationStatus(null);
    try {
      const res = await axios.post("/api/visitors/verify-aadhar/public", { aadharNumber: num });
      if (res.data.status === "verified") {
        setVerificationStatus("verified");
        toast.success(`Aadhar Verified: ${res.data.name}`);
      } else {
        setVerificationStatus("invalid");
        toast.error("Invalid Aadhar Number");
      }
    } catch (err) {
      setVerificationStatus("invalid");
      toast.error("Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.set("meetingId", selectedMeetingId);
    try {
      await axios.post("/api/visitors/public", Object.fromEntries(formData));
      toast.success("Check-in successful! Please wait for your host.");
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Check-in failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Name</label>
          <input name="name" required className="input-field" placeholder="Full Name" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Company</label>
          <input name="company" className="input-field" placeholder="Company Name" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Purpose</label>
          <select name="purpose" className="input-field appearance-none">
            <option value="Client Visit">Client Visit</option>
            <option value="Meeting">Meeting</option>
            <option value="Interview">Interview</option>
            <option value="Delivery">Delivery</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Meeting</label>
          <select
            name="meetingId"
            className="input-field appearance-none"
            value={selectedMeetingId}
            onChange={e => setSelectedMeetingId(e.target.value)}
            required
          >
            <option value="">Select Meeting</option>
            {meetingsLoading && <option disabled>Loading meetings...</option>}
            {meetingsError && <option disabled>Error loading meetings</option>}
            {!meetingsLoading && !meetingsError && meetings.length === 0 && (
              <option disabled>No meetings available</option>
            )}
            {!meetingsLoading && !meetingsError && meetings.map(m => (
              <option key={m._id} value={m._id}>
                {m.title}{m.startTime ? ` (${new Date(m.startTime).toLocaleString()})` : ""}
              </option>
            ))}
            <option value="walkin">Walk-in (No Meeting)</option>
          </select>
        </div>
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-tight">Identity & Document</label>
        <div className="grid grid-cols-2 gap-3">
          <select name="documentType" className="input-field appearance-none py-2 text-sm">
            <option value="AADHAR">Aadhar</option>
            <option value="PAN">PAN</option>
            <option value="DL">DL</option>
          </select>
          <div className="relative">
            <input
              name="documentNumber"
              placeholder="ID Number (12 digits for Aadhar)"
              onChange={e => e.target.value.length === 12 && verifyAadhar(e.target.value)}
              className="input-field py-2 text-sm"
            />
            {isVerifying && (
              <span className="absolute right-3 top-3 text-[10px] text-blue-500 font-bold animate-pulse">Verifying...</span>
            )}
            {verificationStatus === "verified" && (
              <span className="absolute right-3 top-2.5 text-emerald-500 text-xs font-semibold">✅</span>
            )}
            {verificationStatus === "invalid" && (
              <span className="absolute right-3 top-2.5 text-red-500 text-xs font-semibold">❌</span>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary w-full"
      >
        Complete Check-In
      </button>
    </form>
  );
};

export default VisitorForm;
*/

export default function VisitorForm() {
  return null;
}