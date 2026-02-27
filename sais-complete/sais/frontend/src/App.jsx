import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AssignmentsPage from "./pages/AssignmentsPage";
import AttendancePage from "./pages/AttendancePage";
import ActivitiesPage from "./pages/ActivitiesPage";
import UploadPage from "./pages/UploadPage";
import TimetableSetupPage from "./pages/TimetableSetupPage";
import CollegeEventsPage from "./pages/events/CollegeEventsPage";
import ClassroomDashboardPage from "./pages/classroom/ClassroomDashboardPage";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="timetable" element={<TimetableSetupPage />} />
        <Route path="events" element={<CollegeEventsPage />} />
        <Route path="classroom" element={<ClassroomDashboardPage />} />
        <Route path="documents" element={<UploadPage />} />
        <Route path="upload" element={<UploadPage />} />
      </Route>
    </Routes>
  );
}
