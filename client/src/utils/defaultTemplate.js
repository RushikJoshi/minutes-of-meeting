export const defaultTemplate = {
  name: "Default Corporate MOM",
  sections: [
    {
      id: "meeting-details",
      title: "1. Meeting Details",
      type: "grid",
      columns: 2,
      fields: [
        { id: "f-type", label: "Type", type: "text" },
        { id: "f-date", label: "Date", type: "text" },
        { id: "f-time", label: "Time", type: "text" },
        { id: "f-duration", label: "Duration", type: "text" },
        { id: "f-venue", label: "Venue", type: "text" },
        { id: "f-calledBy", label: "Called By", type: "text" },
        { id: "f-chairedBy", label: "Chaired By", type: "text" },
        { id: "f-refId", label: "Ref ID", type: "text" },
      ]
    },
    {
      id: "attendees",
      title: "2. Attendees",
      type: "table",
      columns: 1,
      fields: [
        { id: "f-srno", label: "Sr No", type: "text" },
        { id: "f-name", label: "Name", type: "text" },
        { id: "f-designation", label: "Designation", type: "text" },
        { id: "f-department", label: "Department", type: "text" },
        { id: "f-status", label: "Status", type: "text" },
      ]
    },
    {
      id: "objective",
      title: "3. Meeting Objective",
      type: "rich-text",
      columns: 1,
      fields: []
    },
    {
      id: "agenda",
      title: "4. Agenda Items",
      type: "table",
      columns: 1,
      fields: [
        { id: "f-itemno", label: "Item No", type: "text" },
        { id: "f-topic", label: "Agenda Topic", type: "text" },
        { id: "f-owner", label: "Owner", type: "text" },
      ]
    },
    {
      id: "discussion",
      title: "5. Discussion Summary",
      type: "table",
      columns: 1,
      fields: [
        { id: "f-agendaid", label: "Agenda", type: "text" },
        { id: "f-keypoints", label: "Key Discussion Points", type: "text" },
        { id: "f-decision", label: "Decision Taken", type: "text" },
      ]
    },
    {
      id: "action-items",
      title: "6. Action Items Tracker",
      type: "table",
      columns: 1,
      fields: [
        { id: "f-ai-srno", label: "Sr No", type: "text" },
        { id: "f-task", label: "Task", type: "text" },
        { id: "f-assigned", label: "Assigned To", type: "text" },
        { id: "f-priority", label: "Priority", type: "text" },
        { id: "f-deadline", label: "Deadline", type: "text" },
        { id: "f-aistatus", label: "Status", type: "text" },
      ]
    },
    {
      id: "risks",
      title: "7. Risks / Issues Raised",
      type: "table",
      columns: 1,
      fields: [
        { id: "f-r-srno", label: "Sr No", type: "text" },
        { id: "f-risk", label: "Risk / Issue", type: "text" },
        { id: "f-impact", label: "Impact", type: "text" },
        { id: "f-r-owner", label: "Owner", type: "text" },
        { id: "f-resolution", label: "Resolution Plan", type: "text" },
      ]
    },
    {
      id: "approvals",
      title: "8. Approvals / Confirmations",
      type: "table",
      columns: 1,
      fields: [
        { id: "f-subject", label: "Subject", type: "text" },
        { id: "f-approvedby", label: "Approved By", type: "text" },
        { id: "f-apdate", label: "Date", type: "text" },
      ]
    },
    {
      id: "next-meeting",
      title: "9. Next Meeting Schedule",
      type: "grid",
      columns: 3,
      fields: [
        { id: "f-nm-date", label: "Date", type: "text" },
        { id: "f-nm-time", label: "Time", type: "text" },
        { id: "f-nm-purpose", label: "Purpose", type: "text" },
      ]
    },
    {
      id: "closing-remarks",
      title: "10. Closing Remarks",
      type: "rich-text",
      columns: 1,
      fields: []
    },
    {
      id: "prepared-by",
      title: "11. Prepared & Approved By",
      type: "grid",
      columns: 3,
      fields: [
        { id: "f-preparedby", label: "Prepared By", type: "text" },
        { id: "f-reviewedby", label: "Reviewed By", type: "text" },
        { id: "f-approvedby2", label: "Approved By", type: "text" },
      ]
    },
    {
      id: "confidentiality",
      title: "12. Confidentiality Note",
      type: "alert",
      columns: 1,
      fields: [
        { id: "f-note", label: "Note", type: "text", value: "This MOM contains internal business discussions and confidential information. Unauthorized sharing is prohibited." }
      ]
    }
  ]
};
