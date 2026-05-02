import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Toast from "./components/Toast";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Meetings from "./pages/Meetings";
import CreateMeeting from "./pages/CreateMeeting";
import MeetingDetails from "./pages/MeetingDetails";
import ShareView from "./pages/ShareView";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import ActionItems from "./pages/ActionItems";
import MinutesEditor from "./pages/MinutesEditor";
import TemplateBuilder from "./pages/TemplateBuilder";
import JoinMeeting from "./pages/JoinMeeting";
import VisitorPage from "./pages/VisitorPage";
import RoleSelection from "./pages/RoleSelection";
import DocumentVerification from "./pages/DocumentVerification";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import VisitorDashboard from "./pages/VisitorDashboard";
import VisitorFormPublic from "./pages/VisitorFormPublic";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import VisitorVerification from "./pages/VisitorVerification";
import Profile from "./pages/Profile";
import { useEffect, useState } from "react";
import API from "./api/api";
import { useAuth } from "./hooks/useAuth";
import { useWorkspace } from "./hooks/useWorkspace";
import { Toaster } from "react-hot-toast";

function App() {
  const { isAuthenticated } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [countdownMinutes, setCountdownMinutes] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !activeWorkspaceId) return;

    const checkUpcomingMeetings = async () => {
      try {
        const res = await API.get("/upcoming");
        if (res.status === 200) {
          const meetings = Array.isArray(res.data) ? res.data : [];
          if (meetings.length > 0) {
            const meeting = meetings[0];

            // Calculate meeting start time
            const now = new Date();
            let meetingStartTime = null;

            if (meeting.date && meeting.startTime) {
              const meetingDate = new Date(meeting.date);
              const timeStr = meeting.startTime.trim();

              // Try to parse various time formats
              let timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
              if (timeMatch) {
                // 12-hour format: "10:00 AM"
                let hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const ampm = timeMatch[3].toUpperCase();

                if (ampm === 'PM' && hours !== 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;

                meetingDate.setHours(hours, minutes, 0, 0);
                meetingStartTime = meetingDate;
              } else {
                // Try 24-hour format: "14:30"
                timeMatch = timeStr.match(/(\d+):(\d+)/);
                if (timeMatch) {
                  const hours = parseInt(timeMatch[1]);
                  const minutes = parseInt(timeMatch[2]);

                  if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                    meetingDate.setHours(hours, minutes, 0, 0);
                    meetingStartTime = meetingDate;
                  }
                }
              }
            }

            if (meetingStartTime && meetingStartTime > now) {
              const timeDiff = meetingStartTime - now;
              const minutesUntilStart = Math.ceil(timeDiff / (1000 * 60));

              // Show notification for meetings starting within 10 minutes
              if (minutesUntilStart <= 10 && minutesUntilStart > 0) {
                setCurrentMeeting(meeting);
                setCountdownMinutes(minutesUntilStart);
              } else if (currentMeeting && currentMeeting._id === meeting._id && minutesUntilStart <= 0) {
                // Meeting has started, clear the notification
                setCurrentMeeting(null);
                setCountdownMinutes(null);
              }
            }
          } else {
            // No upcoming meetings, clear any existing notification
            setCurrentMeeting(null);
            setCountdownMinutes(null);
          }
        }
      } catch (err) {
        console.log("Error checking upcoming meetings:", err);
      }
    };

    checkUpcomingMeetings();
    const interval = setInterval(checkUpcomingMeetings, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated, activeWorkspaceId, currentMeeting]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/v/:token" element={<VisitorFormPublic />} />
        <Route path="/v/:name/:token" element={<VisitorFormPublic />} />
        <Route path="/visitor-form/*" element={<VisitorFormPublic />} />
        <Route path="/visitor/verify/:token" element={<VisitorVerification />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/document-verification" element={<DocumentVerification />} />
        <Route path="/share/:token" element={<ShareView />} />
        <Route path="/join/:id" element={<JoinMeeting />} />
        <Route path="/visitor-dashboard" element={<VisitorDashboard />} />
        <Route path="/receptionist-dashboard" element={<ReceptionistDashboard />} />
        <Route path="/visitor-panel" element={<VisitorPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/meetings/new" element={<CreateMeeting />} />
            <Route path="/meeting/:id" element={<MeetingDetails />} />
            <Route path="/meeting/:id/create-mom" element={<MinutesEditor />} />
            <Route path="/meeting/:id/minutes" element={<MinutesEditor />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/action-items" element={<ActionItems />} />
            <Route path="/template-builder" element={<TemplateBuilder />} />
          </Route>
        </Route>
      </Routes>

      {currentMeeting && countdownMinutes !== null && (
        <Toast
          message={`📅 Your Meeting "${currentMeeting.title}" starts in ${countdownMinutes} minute${countdownMinutes !== 1 ? 's' : ''}!`}
          onClose={() => {
            setCurrentMeeting(null);
            setCountdownMinutes(null);
          }}
          autoDismiss={false}
        />
      )}
    </BrowserRouter>
  );
}

export default App;
