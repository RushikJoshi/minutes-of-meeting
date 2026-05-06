import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { 
  FileText, Search, Download, ExternalLink, 
  Clock, Calendar as CalendarIcon, User, ChevronRight,
  Filter
} from "lucide-react";
import API from "../api/api";

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings-with-moms"],
    queryFn: async () => {
      const res = await API.get("/meetings");
      return res.data;
    }
  });

  const filteredMeetings = meetings?.filter(m => 
    m.isMomGenerated && m.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Pagination Logic
  const totalItems = filteredMeetings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMeetings = filteredMeetings.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when searching
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="page-shell">
      <div className="w-full space-y-6 fade-up">
        {/* Header Section */}
        <div className="page-card p-8 bg-gradient-to-br from-white to-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">MOM Repository</h1>
            </div>
            
            <div className="relative group max-w-md w-full">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search documents by meeting title..."
                className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-sm"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="page-card overflow-hidden border-none shadow-xl bg-white/70 backdrop-blur-md">
          {isLoading ? (
            <div className="p-20 text-center">
              <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-blue-600/20 border-r-blue-600 mb-4"></div>
              <p className="text-slate-500 font-medium">Fetching your documents...</p>
            </div>
          ) : paginatedMeetings.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document / Meeting</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Organized By</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedMeetings.map((meeting) => (
                      <tr key={meeting._id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <FileText size={20} />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 leading-tight">{meeting.title}</div>
                              <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                MOM Generated
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <CalendarIcon size={14} className="text-slate-400" />
                              <span className="font-semibold">{new Date(meeting.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <Clock size={12} />
                              <span>{meeting.startTime} - {meeting.endTime}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <User size={14} />
                            </div>
                            <span className="text-sm font-medium text-slate-600">{meeting.createdBy?.name || "Admin"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <Link 
                              to={`/meeting/${meeting._id}/minutes`}
                              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                              title="Edit MOM"
                            >
                              <ExternalLink size={18} />
                            </Link>
                            <a 
                              href={`${API.defaults.baseURL}/meeting/${meeting._id}/download-pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                              title="Download PDF"
                            >
                              <Download size={16} />
                              <span>PDF</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                    >
                      <ChevronRight size={18} className="rotate-180" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                          currentPage === page 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter size={32} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No documents found</h3>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto">We couldn't find any generated meeting minutes matching your search.</p>
              <button 
                onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
