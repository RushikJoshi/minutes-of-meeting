import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import API from "../api/api";
import { meetingToCalendarEvent } from "../utils/meetingUtils";
import CalendarView from "../components/calendar/CalendarView";
import MeetingDetailPanel from "../components/calendar/MeetingDetailPanel";
import { Calendar as CalendarIcon, Clock, ChevronRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const MEETINGS_QUERY_KEY = ["meetings"];

export default function Calendar() {
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const meetingsQuery = useQuery({
    queryKey: MEETINGS_QUERY_KEY,
    queryFn: async () => {
      const response = await API.get("/meetings");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const calendarEvents = useMemo(
    () => (meetingsQuery.data || []).map((meeting) => meetingToCalendarEvent(meeting)),
    [meetingsQuery.data]
  );

  const upcomingMeetings = useMemo(() => {
    return (meetingsQuery.data || [])
      .filter(m => new Date(m.startTime) >= new Date())
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 4);
  }, [meetingsQuery.data]);

  const handleEventClick = (info) => {
    setSelectedMeeting(info.event.extendedProps.meeting);
  };

  const handleCloseDetails = () => {
    setSelectedMeeting(null);
  };

  return (
    <div className="page-shell">
      <div className="page-container fade-up">
        {/* Unique Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                <CalendarIcon size={20} />
              </div>
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Scheduler</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Meeting Calendar</h1>
          </div>
          
          <Link 
            to="/meetings/new"
            className="btn-primary !px-6 !py-4 flex items-center gap-2 text-sm shadow-2xl"
          >
            <Plus size={18} strokeWidth={3} />
            <span>Schedule New Meeting</span>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 min-h-[750px]">
          {/* Left Sidebar: Agenda & Stats */}
          <div className="lg:w-80 flex flex-col gap-6">
            <div className="page-card p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Upcoming Agenda</h3>
              <div className="space-y-4">
                {upcomingMeetings.length > 0 ? (
                  upcomingMeetings.map((m, idx) => (
                    <div key={idx} className="group cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-1 h-10 bg-blue-500 rounded-full group-hover:scale-y-125 transition-transform" />
                        <div>
                          <div className="text-sm font-bold truncate w-56">{m.title}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold mt-1">
                            <Clock size={10} />
                            {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 italic">No upcoming meetings</div>
                )}
              </div>
              <button className="w-full mt-6 py-3 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                View Full Agenda <ChevronRight size={12} />
              </button>
            </div>

            <div className="page-card p-6 border-slate-100 flex-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Calendar Summary</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">Total Meetings</span>
                  <span className="text-xl font-black text-slate-900">{meetingsQuery.data?.length || 0}</span>
                </div>
                <div className="h-px bg-slate-50" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">Pending MOMs</span>
                  <span className="text-xl font-black text-blue-600">
                    {meetingsQuery.data?.filter(m => m.status === 'completed' && !m.isMomGenerated).length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Content: Calendar Grid */}
          <div className="flex-1 relative">
            <div className="h-full">
              {meetingsQuery.isLoading ? (
                <div className="flex h-full items-center justify-center bg-white/50 backdrop-blur rounded-[2.5rem] border border-slate-100">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600 border-r-transparent animate-spin rounded-full" />
                    <span className="text-sm font-bold text-slate-500">Syncing Calendar...</span>
                  </div>
                </div>
              ) : (
                <CalendarView
                  events={calendarEvents}
                  onEventClick={handleEventClick}
                />
              )}
            </div>

            {/* Float Detail Panel */}
            {selectedMeeting && (
              <div className="absolute inset-0 z-50 lg:left-auto lg:w-[450px] animate-in slide-in-from-right-10">
                <MeetingDetailPanel
                  meeting={selectedMeeting}
                  onClose={handleCloseDetails}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
