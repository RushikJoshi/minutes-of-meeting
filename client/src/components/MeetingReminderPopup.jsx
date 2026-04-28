import { useEffect, useState } from "react";

export default function MeetingReminderPopup({ meeting, onClose }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!meeting?.date || !meeting?.startTime) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const meetingDateTime = new Date(meeting.date);

      // Parse startTime (assuming format like "14:30")
      const [hours, minutes] = meeting.startTime.split(':').map(Number);
      meetingDateTime.setHours(hours, minutes, 0, 0);

      const diff = meetingDateTime - now;

      if (diff <= 0) {
        setTimeLeft("Meeting is starting now!");
        return;
      }

      const minutesLeft = Math.floor(diff / (1000 * 60));
      const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);

      if (minutesLeft > 0) {
        setTimeLeft(`${minutesLeft}m ${secondsLeft}s`);
      } else {
        setTimeLeft(`${secondsLeft}s`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [meeting]);

  if (!meeting) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Meeting Reminder</h3>
            <p className="text-sm text-gray-600">Your meeting is about to start</p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-gray-900 mb-1">{meeting.title}</h4>
          <p className="text-sm text-gray-600 mb-2">{meeting.agenda}</p>
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Starts in: <span className="font-semibold text-blue-600 ml-1">{timeLeft}</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            Dismiss
          </button>
          <a
            href={meeting.link || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-center transition duration-200"
          >
            Join Meeting
          </a>
        </div>
      </div>
    </div>
  );
}