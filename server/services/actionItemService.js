const ActionItem = require("../models/ActionItem");

async function syncActionItemsFromMom({ organizationId, meetingId, mom }) {
  const momId = mom._id;
  const list = Array.isArray(mom.actionItems) ? mom.actionItems : [];

  // Replace-all strategy (simple + safe). For large scale, switch to diff sync.
  await ActionItem.deleteMany({ organizationId, meetingId, momId });

  const docs = list
    .map((it) => ({
      organizationId,
      meetingId,
      momId,
      sourceItemId: it?._id ? String(it._id) : "",
      title: it?.title || it?.task || "",
      task: it?.task || it?.title || "",
      assignedTo: it?.assignedTo || "",
      deadline: it?.deadline ? new Date(it.deadline) : undefined,
      status: it?.status === "completed" || it?.status === "done" ? "completed" : "pending",
    }))
    .filter((d) => d.title || d.task || d.assignedTo || d.deadline);

  if (docs.length) await ActionItem.insertMany(docs);
}

module.exports = { syncActionItemsFromMom };
