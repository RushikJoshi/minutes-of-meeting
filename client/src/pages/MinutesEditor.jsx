import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import API from "../api/api";
import WordLikeEditor from "../components/editor/WordLikeEditor";

export default function MinutesEditor() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [lastSavedMom, setLastSavedMom] = useState(null);

  const minutesQuery = useQuery({
    queryKey: ["meeting-minutes", id],
    queryFn: async () => (await API.get(`/meeting/${id}/minutes`)).data,
    enabled: Boolean(id),
  });

  const saveMinutes = useMutation({
    mutationFn: async (variables) =>
      (await API.put(`/meeting/${id}/minutes`, variables)).data,
    onSuccess: (data) => {
      setLastSavedMom(data?.mom || null);
      queryClient.invalidateQueries({ queryKey: ["meeting-minutes", id] });
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      queryClient.invalidateQueries({ queryKey: ["action-items"] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to save MOM.");
    },
  });

  const uploadImage = useMutation({
    mutationFn: async (file) => {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("entityType", "mom");
      payload.append("entityId", id);
      const response = await API.post("/attachments", payload);
      return response.data;
    },
  });

  const meeting = minutesQuery.data?.meeting;
  const mom = lastSavedMom || minutesQuery.data?.mom;
  const [realtimeActionItems, setRealtimeActionItems] = useState([]);
  const [editorHtml, setEditorHtml] = useState("");

  // Sync editorHtml when mom loads
  useEffect(() => {
    if (mom?.contentHtml) {
      setEditorHtml(mom.contentHtml);
    }
  }, [mom?.contentHtml]);

  // Merge database items and real-time items for display
  const allActionItems = useMemo(() => {
    const dbItems = mom?.actionItems || [];
    const combined = [...dbItems, ...realtimeActionItems];
    const seen = new Set();
    return combined.filter(item => {
      const key = `${item.assignedTo}|${item.task}|${item.deadline}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [mom?.actionItems, realtimeActionItems]);

  if (minutesQuery.isLoading) {
    return <div className="page-shell"><div className="page-card p-8 text-sm text-slate-500">Loading the MOM editor...</div></div>;
  }

  if (!meeting) {
    return <div className="page-shell"><div className="page-card p-8 text-sm text-rose-600">Unable to load meeting minutes.</div></div>;
  }

  return (
    <div className="page-shell">
      <div className="page-container space-y-6 fade-up">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link className="text-sm font-semibold text-blue-700 hover:underline" to={`/meeting/${id}`}>
              Back to meeting
            </Link>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">{meeting.title}</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary !bg-white !text-blue-600 hover:!bg-blue-50"
              onClick={async () => {
                try {
                  console.log("[MinutesEditor] Publish button clicked", { htmlLength: editorHtml.length });
                  await saveMinutes.mutateAsync({ 
                    contentHtml: editorHtml || "<p></p>", 
                    docStatus: "published",
                    actionItems: allActionItems,
                    summary: mom?.summary,
                    decisions: mom?.decisions,
                    isManual: true,
                  });
                  toast.success("MOM published.");
                } catch (err) {
                  toast.error(err?.response?.data?.message || "Failed to publish MOM.");
                }
              }}
              disabled={saveMinutes.isPending}
            >
              Publish current MOM
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={saveMinutes.isPending}
              onClick={async () => {
                try {
                  // Ensure latest editor + side-panel fields are persisted before export.
                  await saveMinutes.mutateAsync({
                    contentHtml: editorHtml || mom?.contentHtml || "<p></p>",
                    docStatus: mom?.docStatus || "draft",
                    actionItems: allActionItems,
                    summary: mom?.summary,
                    decisions: mom?.decisions,
                    isManual: true,
                  });

                  const url = `${API.defaults.baseURL}/meeting/${id}/download-pdf?regen=1&t=${Date.now()}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                } catch (err) {
                  toast.error(err?.response?.data?.message || "Failed to export PDF.");
                }
              }}
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <WordLikeEditor
            title="Minutes of Meeting"
            subtitle={`${new Date(meeting.date).toLocaleDateString()} | ${meeting.startTime || "Time TBD"} - ${meeting.endTime || "Time TBD"}`}
            initialContent={mom?.contentHtml || "<p></p>"}
            saving={saveMinutes.isPending}
            onSave={async (contentHtml, isManual) => {
              console.log("[MinutesEditor] onSave triggered", { isManual, length: contentHtml?.length });
              try {
                const result = await saveMinutes.mutateAsync({ 
                  contentHtml, 
                  docStatus: mom?.docStatus || "draft",
                  actionItems: allActionItems,
                  summary: mom?.summary,
                  decisions: mom?.decisions,
                  isManual,
                });
                setLastSavedMom(result?.mom || null);
                if (isManual) toast.success("Saved.");
              } catch (err) {
                toast.error(err?.response?.data?.message || "Save failed.");
              }
            }}
            onContentChange={(html) => setEditorHtml(html)}
            onDetectedActionItems={(items) => setRealtimeActionItems(items)}
            onUploadImage={async (file) => {
              const uploaded = await uploadImage.mutateAsync(file);
              return { src: `${API.defaults.baseURL}${uploaded.urlPath}` };
            }}
          />

          <aside className="space-y-6">
            <div className="page-card p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Document status</div>
              <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{mom?.docStatus || "draft"}</div>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Every save writes HTML to MongoDB and refreshes action items, meeting previews, and the PDF export path.
              </p>
            </div>

            <div className="page-card p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Extra Details (WordPad)</div>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Executive Summary</label>
                  <textarea
                    className="w-full rounded-xl border-slate-200 text-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    placeholder="Brief summary of the meeting..."
                    value={mom?.summary || ""}
                    onChange={(e) => {
                      setLastSavedMom(prev => ({ ...prev, summary: e.target.value }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Key Decisions</label>
                  <textarea
                    className="w-full rounded-xl border-slate-200 text-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    placeholder="What was decided?"
                    value={mom?.decisions || ""}
                    onChange={(e) => {
                      setLastSavedMom(prev => ({ ...prev, decisions: e.target.value }));
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="page-card p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Generated action items</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-3">
                    <input
                      id="manual-task"
                      type="text"
                      placeholder="What needs to be done?"
                      className="w-full rounded-xl border-none bg-white px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target.value.trim()) {
                          const task = e.target.value.trim();
                          const newItems = [...allActionItems, { task, assignedTo: "Unassigned", status: "pending" }];
                          saveMinutes.mutate({ 
                            contentHtml: mom?.contentHtml || "<p></p>", 
                            actionItems: newItems,
                            isManual: true 
                          });
                          e.target.value = "";
                        }
                      }}
                    />
                    <div className="text-[10px] text-slate-400 px-1">Press Enter to add manually</div>
                  </div>
                </div>

                {allActionItems.length ? (
                  allActionItems.map((item, index) => (
                    <div key={`${item.task}-${index}`} className="group relative rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                      <div className="text-sm font-bold text-slate-900">{item.task || item.title}</div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">{item.assignedTo || "Unassigned"}</span>
                        {item.deadline && (
                          <span className="rounded-full bg-blue-50 text-blue-600 px-2 py-0.5">
                            {new Date(item.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <button 
                        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-opacity"
                        onClick={() => {
                          const newItems = allActionItems.filter((_, i) => i !== index);
                          saveMinutes.mutate({ 
                            contentHtml: mom?.contentHtml || "<p></p>", 
                            actionItems: newItems,
                            isManual: true 
                          });
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    Type a task above or write sentences like "Dharmik will complete API by Friday" in the editor.
                  </div>
                )}
              </div>
            </div>

            <div className="page-card p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Meeting context</div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <ContextRow label="Agenda" value={meeting.agenda || "No agenda"} />
                <ContextRow label="Participants" value={String(meeting.participants?.length || 0)} />
                <ContextRow label="Reminder" value={`${meeting.reminderMinutes || 0} minutes`} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ContextRow({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 font-semibold text-slate-800">{value}</div>
    </div>
  );
}
