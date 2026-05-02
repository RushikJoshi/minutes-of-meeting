import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function DocumentVerification() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    documentType: "AADHAR",
    documentNumber: "",
    mobile: "",
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const verifyDocuments = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/verify-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "Verification Failed");
        setLoading(false);
        return;
      }

      toast.success(data.message || "Details Verified Successfully");

      const role = localStorage.getItem("pendingRole") || "visitor";

      // Final Redirect
      if (role === "admin") navigate("/admin-dashboard", { replace: true });
      else if (role === "employee") navigate("/employee-dashboard", { replace: true });
      else navigate("/visitor-dashboard", { replace: true });

    } catch (err) {
      toast.error(err?.response?.data?.message || "Verification error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_32%)] pointer-events-none" />
      <div className="relative w-full max-w-md bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100 fade-up">

        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/role-selection")}
          className="flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 mb-4 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Roles
        </button>

        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Verify Document</h1>
        <p className="text-center text-sm text-slate-500 mb-6">Please provide your details to continue.</p>

        <form onSubmit={verifyDocuments} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Select Document Type *</label>
            <select
              name="documentType"
              value={formData.documentType}
              onChange={handleInputChange}
              className="input-field w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200 appearance-none bg-white"
            >
              <option value="AADHAR">Aadhar Card</option>
              <option value="PAN">PAN Card</option>
              <option value="DL">Driving License</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              {formData.documentType === "AADHAR" && "Aadhar Card Number *"}
              {formData.documentType === "PAN" && "PAN Card Number *"}
              {formData.documentType === "DL" && "Driving License Number *"}
            </label>
            <input
              name="documentNumber"
              value={formData.documentNumber}
              onChange={handleInputChange}
              required
              maxLength={formData.documentType === "AADHAR" ? 12 : 15}
              className="input-field w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200 uppercase"
              placeholder={
                formData.documentType === "AADHAR" ? "12 Digit Aadhar Number" :
                  formData.documentType === "PAN" ? "ABCDE1234F" :
                    "DL-XXXX-XXXXXXX"
              }
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mobile Number *</label>
            <input
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              required
              type="tel"
              className="input-field w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-200"
              placeholder="+91 9876543210"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Upload Image (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition"
            />
          </div>

          <button
            disabled={loading}
            className="btn-primary w-full py-3 mt-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Verifying Details..." : "Submit & Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
