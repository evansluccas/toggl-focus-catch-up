import { Navigate, Route, Routes } from "react-router-dom";
import Shell from "./components/Shell";
import CalendarPage from "./pages/Calendar";
import ReportsPage from "./pages/Reports";
import ProjectsPage from "./pages/Projects";
import TasksPage from "./pages/Tasks";
import TimelinePage from "./pages/Timeline";
import MembersPage from "./pages/Members";
import ApprovalsPage from "./pages/Approvals";
import TimeOffPage from "./pages/TimeOff";

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/calendar" replace />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/time-off" element={<TimeOffPage />} />
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </Shell>
  );
}
