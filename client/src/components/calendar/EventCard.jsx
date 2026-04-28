import React from 'react';

export default function EventCard({ eventInfo }) {
  const { event } = eventInfo;
  const meeting = event.extendedProps.meeting;
  
  // Determine category color based on meeting properties to match user's request:
  // Internal -> blue, Client -> green, Urgent -> red, Review -> yellow
  let categoryColor = 'bg-blue-100 text-blue-700 border-blue-200';
  let dotColor = 'bg-blue-500';
  
  if (meeting?.priority === 'high') {
    categoryColor = 'bg-red-100 text-red-700 border-red-200';
    dotColor = 'bg-red-500';
  } else if (meeting?.status === 'completed') {
    categoryColor = 'bg-yellow-100 text-yellow-700 border-yellow-200';
    dotColor = 'bg-yellow-500';
  } else if (meeting?.type === 'offline') {
    categoryColor = 'bg-green-100 text-green-700 border-green-200';
    dotColor = 'bg-green-500';
  }

  // Formatting time
  let startTime = '';
  if (event.start) {
    startTime = new Date(event.start).toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  }

  return (
    <div 
      className={`flex items-center gap-1.5 overflow-hidden rounded px-1.5 py-0.5 text-xs font-medium border shadow-sm transition-colors hover:opacity-90 cursor-pointer ${categoryColor}`}
      title={`${event.title} ${startTime ? `(${startTime})` : ''}`}
    >
      <div className={`h-1.5 w-1.5 flex-none rounded-full ${dotColor}`}></div>
      {startTime && <span className="font-semibold flex-none">{startTime}</span>}
      <span className="truncate flex-1">{event.title}</span>
    </div>
  );
}
