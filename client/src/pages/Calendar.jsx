import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import API from "../api/api";
import MeetingModal from "../components/MeetingModal";
import { meetingToCalendarEvent } from "../utils/meetingUtils";
import CalendarView from "../components/calendar/CalendarView";
import MeetingDetailPanel from "../components/calendar/MeetingDetailPanel";

const MEETINGS_QUERY_KEY = ["meetings"];

export default function Calendar() {
  const queryClient = useQueryClient();
  const [createDate, setCreateDate] = useState("");
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const meetingsQuery = useQuery({
    queryKey: MEETINGS_QUERY_KEY,
    queryFn: async () => {
      const response = await API.get("/meetings");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const createMeeting = useMutation({
    mutationFn: async (payload) => {
      const response = await API.post("/create-meeting", payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Meeting created and synced to the calendar.");
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
      setShowCreateModal(false);
    },
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await API.patch(`/meeting/${id}`, payload);
      return response.data;
    },
    onSuccess: (meeting) => {
      toast.success("Meeting updated.");
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
      setEditingMeeting(null);
      setSelectedMeeting(meeting);
    },
  });

  const calendarEvents = useMemo(
    () => (meetingsQuery.data || []).map((meeting) => meetingToCalendarEvent(meeting)),
    [meetingsQuery.data]
  );

  const handleDateClick = (info) => {
    setCreateDate(info.dateStr);
    setShowCreateModal(true);
  };

  const handleEventClick = (info) => {
    setSelectedMeeting(info.event.extendedProps.meeting);
  };

  const handleCloseDetails = () => {
    setSelectedMeeting(null);
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
    setShowCreateModal(true);
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
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setCreateDate(new Date().toISOString().slice(0, 10));
              setShowCreateModal(true);
            }}
          >
            Schedule meeting
          </button>
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
                  onDateClick={handleDateClick}
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
                  onEdit={handleEditMeeting}
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
                  onEdit={handleEditMeeting}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <MeetingModal
        open={showCreateModal || Boolean(editingMeeting)}
        onClose={() => {
          setShowCreateModal(false);
          setEditingMeeting(null);
        }}
        initialDate={createDate}
        meeting={editingMeeting}
        isSubmitting={createMeeting.isPending || updateMeeting.isPending}
        onSubmit={async (payload) => {
          if (editingMeeting?._id) {
            await updateMeeting.mutateAsync({ id: editingMeeting._id, payload });
            return;
          }
          await createMeeting.mutateAsync(payload);
        }}
      />
    </div>
  );
}
