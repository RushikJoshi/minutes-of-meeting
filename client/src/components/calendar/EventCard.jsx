import React from 'react';

export default function EventCard({ eventInfo }) {
  const { event } = eventInfo;
  const meeting = event.extendedProps.meeting;
  
  // Determine category color based on meeting properties
  let categoryColor = 'bg-blue-50 text-blue-700 border-blue-100/50';
  let dotColor = 'bg-blue-500';
  
  if (meeting?.priority === 'high') {
    categoryColor = 'bg-rose-50 text-rose-700 border-rose-100/50';
    dotColor = 'bg-rose-500';
  } else if (meeting?.status === 'completed') {
    categoryColor = 'bg-emerald-50 text-emerald-700 border-emerald-100/50';
    dotColor = 'bg-emerald-500';
  } else if (meeting?.type === 'offline') {
    categoryColor = 'bg-indigo-50 text-indigo-700 border-indigo-100/50';
    dotColor = 'bg-indigo-500';
  }

  // Formatting time
  let startTime = '';
  if (event.start) {
    startTime = new Date(event.start).toLocaleTimeString(undefined, { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    }).toLowerCase();
  }

  return (
    <div 
      className={`flex items-center gap-2 overflow-hidden rounded-lg px-2 py-1 text-[10px] font-bold border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${categoryColor}`}
      title={`${event.title} ${startTime ? `(${startTime})` : ''}`}
    >
      <div className={`h-1.5 w-1.5 flex-none rounded-full animate-pulse ${dotColor}`}></div>
      {startTime && <span className="opacity-60 flex-none">{startTime}</span>}
      <span className="truncate flex-1 tracking-tight">{event.title}</span>
    </div>
  );
}
