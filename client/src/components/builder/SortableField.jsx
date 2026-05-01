import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableField({ id, label, type, onRemove, onChange }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-all">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 flex-shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <input
          className="w-full bg-transparent border-none outline-none text-xs font-bold text-slate-700 focus:bg-white focus:px-2 focus:py-1 focus:rounded-lg focus:border focus:border-blue-300 transition-all"
          value={label}
          onChange={(e) => onChange && onChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="Field label..."
        />
        <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{type}</div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove && onRemove(); }}
        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
