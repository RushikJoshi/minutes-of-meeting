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
    <div className="bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/60 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] p-8 h-full flex flex-col calendar-wrapper transition-all duration-500">
      <style>{`
        .calendar-wrapper .fc {
          --fc-border-color: rgba(226, 232, 240, 0.5);
          --fc-button-bg-color: #ffffff;
          --fc-button-border-color: transparent;
          --fc-button-text-color: #64748b;
          --fc-button-hover-bg-color: #f8fafc;
          --fc-button-hover-border-color: #e2e8f0;
          --fc-button-active-bg-color: #0f172a;
          --fc-button-active-border-color: #0f172a;
          --fc-event-bg-color: transparent;
          --fc-event-border-color: transparent;
          --fc-today-bg-color: rgba(59, 130, 246, 0.03);
          font-family: inherit;
        }
        .calendar-wrapper .fc-toolbar {
          margin-bottom: 2.5rem !important;
          padding: 0 0.5rem;
        }
        .calendar-wrapper .fc-toolbar-title {
          font-size: 1.75rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.04em;
          background: linear-gradient(to right, #0f172a, #334155);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .calendar-wrapper .fc-button {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-radius: 1rem;
          padding: 0.6rem 1.25rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: white;
          border: 1px solid #f1f5f9;
        }
        .calendar-wrapper .fc-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          background: #f8fafc;
          border-color: #e2e8f0;
        }
        .calendar-wrapper .fc-button-primary:not(:disabled).fc-button-active {
          background-color: #0f172a !important;
          border-color: #0f172a !important;
          color: white !important;
          box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.3);
        }
        .calendar-wrapper .fc-col-header-cell {
          padding: 1.25rem 0;
          font-size: 0.7rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #94a3b8;
          border: none;
        }
        .calendar-wrapper .fc-daygrid-day {
          transition: background-color 0.2s;
        }
        .calendar-wrapper .fc-daygrid-day:hover {
          background-color: rgba(248, 250, 252, 0.8);
        }
        .calendar-wrapper .fc-daygrid-day-number {
          font-size: 0.95rem;
          font-weight: 800;
          color: #475569;
          padding: 1rem;
        }
        .calendar-wrapper .fc-day-today {
          background-color: rgba(59, 130, 246, 0.02) !important;
        }
        .calendar-wrapper .fc-day-today .fc-daygrid-day-number {
          color: #2563eb;
          position: relative;
        }
        .calendar-wrapper .fc-day-today .fc-daygrid-day-number::after {
          content: '';
          position: absolute;
          bottom: 0.75rem;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background: #2563eb;
          border-radius: 50%;
        }
        .calendar-wrapper .fc-event {
          margin: 3px 6px;
          border-radius: 10px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .calendar-wrapper .fc-event:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
        }
        .calendar-wrapper .fc-scrollgrid {
          border: none !important;
          border-radius: 2rem;
          overflow: hidden;
        }
        .calendar-wrapper .fc-theme-standard td, .calendar-wrapper .fc-theme-standard th {
          border: 1px solid rgba(241, 245, 249, 0.8);
        }
      `}</style>
      <div className="flex-1 min-h-[600px]">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,today,next',
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
