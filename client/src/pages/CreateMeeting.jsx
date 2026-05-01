import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import MeetingForm from "../components/MeetingForm";

const MEETINGS_QUERY_KEY = ["meetings"];

export default function CreateMeeting() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMeeting = useMutation({
    mutationFn: async (payload) => (await API.post("/create-meeting", payload)).data,
    onSuccess: () => {
      toast.success("Meeting created.");
      queryClient.invalidateQueries({ queryKey: MEETINGS_QUERY_KEY });
      navigate("/meetings");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Unable to create meeting.");
    },
  });

  return (
    <div className="page-shell overflow-hidden h-full flex flex-col">
      <div className="page-container fade-up flex-1 flex flex-col min-h-0 space-y-6">
        <div className="shrink-0 flex items-end justify-between gap-4">
          <div>
            <h1 className="section-title">Create meeting</h1>
            <p className="section-subtitle">Fill the details and invite participants.</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)} disabled={createMeeting.isPending}>
            Back
          </button>
        </div>

        <div className="flex-1 overflow-auto pb-10">
          <div className="w-full">
            <MeetingForm
              isSubmitting={createMeeting.isPending}
              showHeader={false}
              chrome="plain"
              onSubmit={(payload) => createMeeting.mutateAsync(payload)}
              submitLabel="Create meeting"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
