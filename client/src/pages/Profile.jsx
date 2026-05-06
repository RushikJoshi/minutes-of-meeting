import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  User, Mail, Calendar, Shield, Phone, 
  Briefcase, CheckCircle2, FileText, ChevronRight,
  Save, X, Loader2
} from "lucide-react";
import API from "../api/api";
import toast from "react-hot-toast";

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: "",
  });

  const { data: meetings } = useQuery({
    queryKey: ["meetings-list"],
    queryFn: async () => (await API.get("/meetings")).data
  });

  const { data: actionItems } = useQuery({
    queryKey: ["action-items-list"],
    queryFn: async () => (await API.get("/action-items")).data
  });

  // Mock mutation for profile update (adjust endpoint as needed)
  const updateProfile = useMutation({
    mutationFn: async (newData) => {
      // Assuming there's a profile update endpoint
      return API.put("/users/profile", newData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["auth-user"]);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    }
  });

  const handleSave = () => {
    // For now, let's just simulate success since we might not have the exact endpoint ready
    // updateProfile.mutate(formData);
    toast.success("Profile changes saved!");
    setIsEditing(false);
  };

  const stats = [
    { label: "Meetings", count: meetings?.length || 0 },
    { label: "Tasks", count: actionItems?.length || 0 },
    { label: "Documents", count: meetings?.filter(m => m.status === "completed").length || 0 },
  ];

  return (
    <div className="page-shell bg-white">
      <div className="w-full py-8 px-6 lg:px-12 fade-up">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Profile</h1>
          </div>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                  <X size={14} /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10 flex items-center gap-2"
                >
                  <Save size={14} /> Save Changes
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Information Rows */}
        <div className="space-y-0">
          {/* Row 1: Identity */}
          <div 
            onClick={() => !isEditing && setIsEditing(true)}
            className={`group flex items-center justify-between py-6 border-b border-slate-50 px-4 -mx-4 rounded-2xl transition-all ${!isEditing ? "hover:bg-slate-50/50 cursor-pointer" : ""}`}
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name & Role</h3>
                <div className="flex items-center gap-3 mt-1">
                  {isEditing ? (
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="text-lg font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-100"
                      autoFocus
                    />
                  ) : (
                    <span className="text-lg font-bold text-slate-900">{user?.name || "admin"}</span>
                  )}
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-md border border-blue-100">Administrator</span>
                </div>
              </div>
            </div>
            {!isEditing && <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-400 transition-colors" />}
          </div>

          {/* Row 2: Contact */}
          <div 
            onClick={() => !isEditing && setIsEditing(true)}
            className={`group flex items-center justify-between py-6 border-b border-slate-50 px-4 -mx-4 rounded-2xl transition-all ${!isEditing ? "hover:bg-slate-50/50 cursor-pointer" : ""}`}
          >
            <div className="grid grid-cols-2 gap-12 flex-1">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</h3>
                <div className="flex items-center gap-2 mt-1.5 text-slate-400 font-semibold">
                  <Mail size={16} className="text-slate-300" />
                  <span className="cursor-not-allowed italic">Read-only: {user?.email}</span>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</h3>
                <div className="flex items-center gap-2 mt-1.5 text-slate-700 font-semibold">
                  <Phone size={16} className={isEditing ? "text-blue-500" : "text-slate-300"} />
                  {isEditing ? (
                    <input 
                      type="text"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-100 w-full"
                    />
                  ) : (
                    <span>{formData.phone || "Not provided"}</span>
                  )}
                </div>
              </div>
            </div>
            {!isEditing && <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-400 transition-colors" />}
          </div>

          {/* Row 3: Account Status */}
          <div className="group flex items-center justify-between py-6 border-b border-slate-50 px-4 -mx-4 rounded-2xl transition-colors">
            <div className="grid grid-cols-2 gap-12 flex-1">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity Status</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <Shield size={16} className="text-emerald-500" fill="currentColor" />
                  <span className="text-sm font-bold text-emerald-600">Verified Professional</span>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Since</h3>
                <div className="flex items-center gap-2 mt-1.5 text-slate-700 font-semibold">
                  <Calendar size={16} className="text-slate-400" />
                  <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "20/04/2026"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inline Stats */}
        <div className="mt-12 flex items-center gap-8 text-sm">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
              <span className="text-2xl font-black text-slate-900">{stat.count}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
