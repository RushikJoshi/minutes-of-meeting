import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import MeetingModal from "../components/MeetingModal";
import MeetingCard from "../components/MeetingCard";
import Pagination from "../components/Pagination";

const MEETINGS_QUERY_KEY = ["meetings"];

export default function Meetings() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const meetingsPerPage = 9;

  const meetingsQuery = useQuery({
    queryKey: MEETINGS_QUERY_KEY,
    queryFn: async () => {
      const response = await API.get("/meetings");
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, payload }) => (await API.patch(`/meeting/${id}`, payload)).data,
    onSuccess: () => {
      toast.success("Meeting updated.");
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
      setEditingMeeting(null);
      setShowModal(false);
    },
  });

  const deleteMeeting = useMutation({
    mutationFn: async (id) => API.delete(`/meeting/${id}`),
    onSuccess: () => {
      toast.success("Meeting deleted.");
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });

      // If we deleted the last item on the current page, go back one page
      if (currentMeetings.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    },
  });

  const filteredMeetings = useMemo(() => {
    return (meetingsQuery.data || []).filter((meeting) => {
      const matchesSearch =
        !search ||
        `${meeting.title} ${meeting.agenda} ${meeting.participants?.map((participant) => participant.email).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesStatus = status === "all" || meeting.status === status;
      const matchesPriority = priority === "all" || meeting.priority === priority;
      const matchesDate = !dateFilter || (meeting.date && new Date(meeting.date).toISOString().substring(0, 10) === dateFilter);
      return matchesSearch && matchesStatus && matchesPriority && matchesDate;
    });
  }, [meetingsQuery.data, priority, search, status, dateFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredMeetings.length / meetingsPerPage);
  const indexOfLast = currentPage * meetingsPerPage;
  const indexOfFirst = indexOfLast - meetingsPerPage;
  const currentMeetings = filteredMeetings.slice(indexOfFirst, indexOfLast);

  const handleDelete = (meeting) => {
    if (window.confirm(`Delete "${meeting.title}"? This also removes its MOM and action items.`)) {
      deleteMeeting.mutate(meeting._id);
    }
  };

  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    setShowModal(true);
  };

  return (
    <div className="page-shell overflow-hidden h-full flex flex-col">
      <div className="page-container fade-up flex-1 flex flex-col min-h-0 space-y-6">

        {/* Header & Filters */}
        <div className="shrink-0 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="section-title">Meetings</h1>
              <p className="section-subtitle"></p>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                navigate("/meetings/new");
              }}
            >
              New meeting
            </button>
          </div>

          <div className="page-card p-4 sm:p-5">
            <div className="grid gap-3 md:grid-cols-5">
              <input
                className="input-field md:col-span-2"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by title, agenda, or participant email"
              />
              <input
                type="date"
                className="input-field"
                value={dateFilter}
                onChange={(event) => {
                  setDateFilter(event.target.value);
                  setCurrentPage(1);
                }}
              />
              <select
                className="input-field"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All status</option>
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                className="input-field"
                value={priority}
                onChange={(event) => {
                  setPriority(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {meetingsQuery.isLoading ? (
            <div className="page-card p-8 text-sm text-slate-500 h-full flex items-center justify-center">Loading meetings...</div>
          ) : currentMeetings.length ? (
            <div className="flex-1">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {currentMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting._id}
                    meeting={meeting}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="page-card p-10 text-center flex-1 flex flex-col items-center justify-center">
              <h2 className="text-xl font-black text-slate-900">No meetings match the current filters.</h2>
              <p className="mt-2 text-sm text-slate-500">Try a broader search or create a new meeting.</p>
            </div>
          )}

          {/* Pagination UI */}
          <div className="shrink-0 pb-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      <MeetingModal
        open={showModal && Boolean(editingMeeting)}
        meeting={editingMeeting}
        onClose={() => {
          setEditingMeeting(null);
          setShowModal(false);
        }}
        isSubmitting={updateMeeting.isPending}
        onSubmit={async (payload) => {
          await updateMeeting.mutateAsync({ id: editingMeeting._id, payload });
        }}
      />
    </div>
  );
}
