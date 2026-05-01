import { useMemo } from "react";
import MeetingForm from "./MeetingForm";

export default function MeetingModal({ open, onClose, onSubmit, meeting = null, initialDate = "", isSubmitting = false }) {
  const formKey = useMemo(() => `${open ? "open" : "closed"}-${meeting?._id || "new"}-${initialDate || ""}`, [open, meeting?._id, initialDate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-6">
        <div className="w-full max-w-3xl">
          <MeetingForm
            key={formKey}
            meeting={meeting}
            initialDate={initialDate}
            isSubmitting={isSubmitting}
            onCancel={onClose}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </div>
  );
}

