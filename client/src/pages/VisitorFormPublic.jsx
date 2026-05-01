import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User, Mail, Phone, MapPin, Camera, Clock, CheckCircle,
  RefreshCw, Briefcase, Download, Share2, AlertCircle, FileCheck
} from "lucide-react";
import Webcam from "react-webcam";
import API from "../api/api";
import toast from "react-hot-toast";

export default function VisitorFormPublic() {
  const { token, name: nameParam } = useParams();
  const navigate = useNavigate();
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const [validationStatus, setValidationStatus] = useState("loading"); // loading, valid, invalid
  const [errorMsg, setErrorMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [visitorData, setVisitorData] = useState(null);
  const [currentTime, setCurrentTime] = useState("");
  const [formData, setFormData] = useState({
    name: nameParam || "",
    email: "",
    mobile: "",
    address: "",
    purpose: "",
    meetingWithName: "",
    meetingWithEmail: "",
    meetingTime: "",
    documentType: "AADHAR",
    documentNumber: "",
    photoUrl: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraFileInputRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const localhostUrl = `${window.location.protocol}//localhost${window.location.port ? `:${window.location.port}` : ""}${window.location.pathname}${window.location.search}${window.location.hash}`;

  useEffect(() => {
    // Desktop webcam requires HTTPS OR localhost. When the form is opened via LAN IP (HTTP),
    // automatically switch to the same path on localhost so camera works like before.
    const host = window.location.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    if (!isMobile && !window.isSecureContext && !isLocalHost) {
      window.location.replace(localhostUrl);
    }
  }, [isMobile, localhostUrl]);

  useEffect(() => {
    async function validateQRToken() {
      if (!token) {
        setValidationStatus("invalid");
        setErrorMsg("No token provided in URL.");
        return;
      }
      try {
        const res = await API.get(`/api/visitors/validate-token/${token}`);
        if (res.data.success) {
          if (res.data.isUsed) {
            localStorage.setItem("pendingRole", "visitor");
            localStorage.setItem("visitorName", res.data.name);
            localStorage.setItem("visitorId", res.data.visitorId);
            localStorage.setItem("visitorToken", res.data.token || token);
            localStorage.setItem("entryCode", res.data.entryCode || "");
            navigate("/visitor-dashboard", { replace: true });
            return;
          }
          setValidationStatus("valid");
          setFormData((prev) => ({ ...prev, name: res.data.name }));
        }
      } catch (err) {
        setValidationStatus("invalid");
        setErrorMsg(err?.response?.data?.message || "Invalid or Expired QR Code.");
      }
    }
    validateQRToken();
  }, [token]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setFormData((prev) => ({ ...prev, photoUrl: imageSrc }));
    setCameraOpen(false);
    toast.success("Photo Captured!");
  }, [webcamRef]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photoUrl: reader.result }));
        toast.success("Photo Selected from Gallery!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photoUrl: reader.result }));
        toast.success("Photo Captured!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await API.post("/api/visitors/create", {
        token,
        ...formData
      });

      if (res.data.success) {
        toast.success("Request Submitted for Approval!");
        // Save visitor identity to localStorage so the dashboard can fetch live data
        const v = res.data.visitor;
        localStorage.setItem("visitorId", v._id);
        localStorage.setItem("visitorToken", v.token || "");
        localStorage.setItem("visitorName", v.name || formData.name);
        localStorage.setItem("visitorEmail", v.email || formData.email);
        setVisitorData(v);
        setSubmitted(true);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Submission Failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (validationStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-semibold">Preparing Registration Form...</p>
        </div>
      </div>
    );
  }

  if (validationStatus === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-200 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">❌</div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-slate-500 mt-2">{errorMsg}</p>
          <button onClick={() => navigate("/")} className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Go Home</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="bg-white max-w-xl w-full rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="p-10 text-center">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
            <h1 className="text-3xl font-semibold text-slate-900">Form Submitted Successfully</h1>
            <p className="text-slate-500 mt-4 leading-relaxed">
              Hello <strong>{formData.name}</strong>, your visit request has been recorded.
            </p>

            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">📧</div>
                <div>
                  <p className="font-bold text-slate-900">Check Your Email</p>
                  <p className="text-sm text-slate-500">We have sent a confirmation to <strong>{formData.email}</strong>.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">🤝</div>
                <div>
                  <p className="font-bold text-slate-900">Waiting for {formData.meetingWithName}</p>
                  <p className="text-sm text-slate-500">The host will review your request and approve it shortly.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-xs text-amber-700 font-semibold text-left">
                Note: You will receive a separate email with your Entry QR Code once approved.
              </p>
            </div>

            <button
              onClick={() => navigate("/")}
              className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden relative">
        <div className="bg-slate-900 p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Visitor Registration</h2>
              <p className="text-slate-400 text-sm mt-1">Please provide accurate details for security approval.</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">System Status</p>
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mt-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Live & Secure
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Personal Info */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 ml-1">Full Name</label>
                <input name="name" value={formData.name} readOnly className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl font-bold text-slate-600 outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 ml-1">Mobile Number</label>
                <input name="mobile" value={formData.mobile} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="e.g. 9876543210" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-600 ml-1">Your Email Address</label>
                <input name="email" value={formData.email} onChange={handleInputChange} required type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="you@example.com" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-600 ml-1">Residential Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} required rows="2" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none" placeholder="Enter your full address" />
              </div>
            </div>
          </section>

          {/* Meeting Details */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Meeting Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-600 ml-1">Purpose of Visit</label>
                <input name="purpose" value={formData.purpose} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="e.g. Project Discussion / Job Interview" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 ml-1">Whom to Meet (Name)</label>
                <input name="meetingWithName" value={formData.meetingWithName} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 ml-1">Whom to Meet (Email)</label>
                <input name="meetingWithEmail" value={formData.meetingWithEmail} onChange={handleInputChange} required type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="host@company.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 ml-1">Preferred Meeting Time</label>
                <input name="meetingTime" type="datetime-local" value={formData.meetingTime} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
            </div>
          </section>

          {/* Identity & Photo */}
          <section className="space-y-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Camera className="w-4 h-4" /> Photo & Identity
            </h3>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-4">
                <div className="relative w-full aspect-square max-w-[200px] mx-auto bg-slate-100 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
                  {cameraOpen ? (
                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
                  ) : formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Captured" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                      <Camera className="w-12 h-12 mb-2" />
                    </div>
                  )}
                </div>
                <div className="flex justify-center gap-2">
                  {!cameraOpen ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          // `getUserMedia` requires HTTPS (localhost is treated as secure).
                          if (window.isSecureContext) setCameraOpen(true);
                          else cameraFileInputRef.current?.click();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                      >
                        <Camera className="w-3 h-3" /> Camera
                      </button>
                      <button type="button" onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition">
                        <Share2 className="w-3 h-3" /> Gallery
                      </button>
                      <input
                        type="file"
                        ref={cameraFileInputRef}
                        onChange={handleCameraFileChange}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                      />
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </>
                  ) : (
                    <button type="button" onClick={capturePhoto} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition animate-pulse">
                      Capture Photo
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 ml-1">Document Type</label>
                  <select name="documentType" value={formData.documentType} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition appearance-none font-bold">
                    <option value="AADHAR">Aadhar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="DL">Driving License</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 ml-1">ID Number</label>
                  <input name="documentNumber" value={formData.documentNumber} onChange={handleInputChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition uppercase font-bold" placeholder="XXXX XXXX XXXX" />
                </div>
              </div>
            </div>
          </section>

          <button
            disabled={submitting}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-2xl shadow-blue-200 flex items-center justify-center gap-3"
          >
            {submitting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <FileCheck className="w-6 h-6" />}
            {submitting ? "Submitting..." : "Submit for Approval"}
          </button>
        </form>
      </div>
    </div>
  );
}
