import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import API from "../api/api";
import { meetingToCalendarEvent } from "../utils/meetingUtils";
import CalendarView from "../components/calendar/CalendarView";
import MeetingDetailPanel from "../components/calendar/MeetingDetailPanel";

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

  const handleEventClick = (info) => {
    setSelectedMeeting(info.event.extendedProps.meeting);
  };

  const handleCloseDetails = () => {
    setSelectedMeeting(null);
  };

  return (
    <div className="page-shell h-full flex flex-col">
      <div className="page-container flex-1 flex flex-col fade-up space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between shrink-0">
          <div>
            <h1 className="section-title">Meeting Calendar</h1>
            <p className="section-subtitle">

            </p>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="flex-1 min-h-0 relative">
          <div className={`h-full grid gap-6 transition-all duration-300 ${selectedMeeting ? 'md:grid-cols-2 lg:grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>

            {/* Calendar Section */}
            <div className={`h-full min-h-[600px] ${selectedMeeting ? 'hidden md:block' : 'block'}`}>
              {meetingsQuery.isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">Loading calendar...</div>
              ) : meetingsQuery.isError ? (
                <div className="flex h-full items-center justify-center text-sm text-rose-600 bg-white rounded-2xl border border-slate-200">
                  Unable to load meetings right now.
                </div>
              ) : (
                <CalendarView
                  events={calendarEvents}
                  onEventClick={handleEventClick}
                />
              )}
            </div>

            {/* Desktop / Tablet Detail Panel */}
            {selectedMeeting && (
              <div className="hidden md:block h-full max-h-full overflow-hidden">
                <MeetingDetailPanel
                  meeting={selectedMeeting}
                  onClose={handleCloseDetails}
                />
              </div>
            )}
          </div>

          {/* Mobile Full-Screen Modal for Detail Panel */}
          {selectedMeeting && (
            <div className="md:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="w-full max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8">
                <MeetingDetailPanel
                  meeting={selectedMeeting}
                  onClose={handleCloseDetails}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
