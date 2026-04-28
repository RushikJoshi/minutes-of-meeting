import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import API from "../api/api";

export default function ActionItems() {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState("my");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const actionItemsQuery = useQuery({
    queryKey: ["action-items", scope, status, q],
    queryFn: async () => {
      const response = await API.get("/action-items", { params: { scope, status, q } });
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, nextStatus }) =>
      (await API.patch(`/action-items/${id}/status`, { status: nextStatus })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-items"] });
    },
  });

  const grouped = useMemo(() => {
    const overdue = [];
    const dueSoon = [];
    const later = [];
    const noDeadline = [];
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    for (const item of actionItemsQuery.data || []) {
      if (!item.deadline) {
        noDeadline.push(item);
        continue;
      }

      const deadline = new Date(item.deadline);
      if (deadline < now && item.status !== "completed") overdue.push(item);
      else if (deadline <= nextWeek) dueSoon.push(item);
      else later.push(item);
    }

    return { overdue, dueSoon, later, noDeadline };
  }, [actionItemsQuery.data]);

  return (
    <div className="page-shell">
      <div className="page-container space-y-6 fade-up">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="section-title">Action Items</h1>
          </div>
        </div>

        <div className="page-card p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <select className="input-field" value={scope} onChange={(event) => setScope(event.target.value)}>
              <option value="my">My items</option>
              <option value="team">Team items</option>
            </select>
            <select className="input-field" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <input
              className="input-field md:col-span-2"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search by action title, task, or assignee"
            />
          </div>
        </div>

        {actionItemsQuery.isLoading ? (
          <div className="page-card p-8 text-sm text-slate-500">Loading action items...</div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <ActionSection title="Overdue" items={grouped.overdue} onToggle={updateStatus.mutate} />
            <ActionSection title="Due within 7 days" items={grouped.dueSoon} onToggle={updateStatus.mutate} />
            <ActionSection title="Later" items={grouped.later} onToggle={updateStatus.mutate} />
            <ActionSection title="No deadline" items={grouped.noDeadline} onToggle={updateStatus.mutate} />
          </div>
        )}
      </div>
    </div>
  );
}

function ActionSection({ title, items, onToggle }) {
  return (
    <div className="page-card p-5">
      <h2 className="text-lg font-black tracking-tight text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-slate-900">{item.title || item.task}</div>
                  <div className="mt-2 text-sm text-slate-600">
                    {item.assignedTo || "Unassigned"}
                    {item.deadline ? ` | ${new Date(item.deadline).toLocaleDateString()}` : ""}
                  </div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${item.status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                  {item.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    onToggle({
                      id: item._id,
                      nextStatus: item.status === "completed" ? "pending" : "completed",
                    })
                  }
                >
                  {item.status === "completed" ? "Mark pending" : "Mark completed"}
                </button>
                <Link className="text-sm font-semibold text-blue-700 hover:underline" to={`/meeting/${item.meetingId}/minutes`}>
                  Open source MOM
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            No items in this group.
          </div>
        )}
      </div>
    </div>
  );
}
