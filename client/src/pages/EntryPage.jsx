import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function EntryPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("Checking your entry pass...");

  useEffect(() => {
    const verify = async () => {
      try {
        // Use the token from URL to verify with backend
        const res = await API.post("/api/visitors/verify-entry", { token });
        if (res.data.success) {
          setStatus("success");
          setMessage("Entry Allowed ✅. Welcome!");
        } else {
          setStatus("error");
          setMessage(res.data.message || "Invalid or Expired QR ❌");
        }
      } catch (err) {
        setStatus("error");
        setMessage(err?.response?.data?.message || "Invalid or Expired QR ❌");
      }
    };

    if (token) {
      verify();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Verifying Pass...</h2>
            <p className="text-slate-500 mt-2">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Access Granted</h2>
            <p className="text-green-600 font-medium mt-2">{message}</p>
            <div className="mt-8 p-4 bg-green-50 rounded-2xl border border-green-100 w-full">
              <p className="text-sm text-green-800 italic">"Please proceed to the reception area."</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
            <p className="text-red-600 font-medium mt-2">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 px-6 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
