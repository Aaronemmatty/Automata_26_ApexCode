import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/layout/ProtectedRoute'

// Lazy-load all pages for faster initial bundle
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AssignmentsPage = lazy(() => import('./pages/AssignmentsPage'))
const AttendancePage = lazy(() => import('./pages/AttendancePage'))
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage'))
const UploadPage = lazy(() => import('./pages/UploadPage'))
const TimetableSetupPage = lazy(() => import('./pages/TimetableSetupPage'))
const CollegeEventsPage = lazy(() => import('./pages/events/CollegeEventsPage'))
const ClassroomDashboardPage = lazy(() => import('./pages/classroom/ClassroomDashboardPage'))
const ChatBotPage = lazy(() => import('./pages/ChatBotPage'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="activities" element={<ActivitiesPage />} />
          <Route path="timetable" element={<TimetableSetupPage />} />
          <Route path="events" element={<CollegeEventsPage />} />
          <Route path="classroom" element={<ClassroomDashboardPage />} />
          <Route path="documents" element={<UploadPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="chat" element={<ChatBotPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
