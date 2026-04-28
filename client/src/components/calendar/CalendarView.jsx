import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventCard from './EventCard';

export default function CalendarView({ events, onDateClick, onEventClick }) {
  const renderEventContent = (eventInfo) => {
    return <EventCard eventInfo={eventInfo} />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 h-full flex flex-col calendar-wrapper">
      <style>{`
        /* Custom Tailwind-like styles for FullCalendar */
        .calendar-wrapper .fc {
          --fc-border-color: #f1f5f9;
          --fc-button-bg-color: #ffffff;
          --fc-button-border-color: #e2e8f0;
          --fc-button-text-color: #475569;
          --fc-button-hover-bg-color: #f8fafc;
          --fc-button-hover-border-color: #cbd5e1;
          --fc-button-active-bg-color: #e2e8f0;
          --fc-button-active-border-color: #94a3b8;
          --fc-event-bg-color: transparent;
          --fc-event-border-color: transparent;
          --fc-today-bg-color: #f0f9ff;
          font-family: inherit;
        }
        .calendar-wrapper .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
        }
        .calendar-wrapper .fc-button {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: capitalize;
          border-radius: 0.5rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
        }
        .calendar-wrapper .fc-button-primary:not(:disabled).fc-button-active,
        .calendar-wrapper .fc-button-primary:not(:disabled):active {
          color: #0f172a;
        }
        .calendar-wrapper .fc-col-header-cell {
          padding: 0.75rem 0;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
        }
        .calendar-wrapper .fc-daygrid-day-number {
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          padding: 0.5rem;
        }
        .calendar-wrapper .fc-event {
          margin-top: 2px;
          cursor: pointer;
        }
        .calendar-wrapper .fc-more-popover {
          border-radius: 1rem;
          border-color: #e2e8f0;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .calendar-wrapper .fc-popover-header {
          background: #f8fafc;
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
          padding: 0.75rem 1rem;
          font-weight: 700;
        }
      `}</style>
      <div className="flex-1 min-h-[600px]">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          height="100%"
          selectable
          editable={false}
          dayMaxEvents={3}
          events={events}
          dateClick={onDateClick}
          eventClick={onEventClick}
          eventContent={renderEventContent}
          moreLinkClick="popover"
        />
      </div>
    </div>
  );
}
