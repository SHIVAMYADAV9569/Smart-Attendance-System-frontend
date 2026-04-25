import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterFace from './pages/RegisterFace';
import MarkAttendance from './pages/MarkAttendance';
import MyStatus from './pages/MyStatus';
import MyRecord from './pages/MyRecord';
import StudentRegistration from './pages/StudentRegistration';
import StudentDashboard from './pages/StudentDashboard';
import UnifiedStudentDashboard from './pages/UnifiedStudentDashboard';
import StudentMarkAttendance from './pages/StudentMarkAttendance';
import AttendanceHistory from './components/AttendanceHistory';
import DashboardOverview from './components/DashboardOverview';
import LiveFeed from './components/LiveFeed';
import AttendanceReport from './components/AttendanceReport';
import FacultyLectures from './components/FacultyLectures';
import FacultyMarkAttendance from './components/FacultyMarkAttendance';
import FacultyMarkAttendancePage from './pages/FacultyMarkAttendance';
import FacultyLayout from './components/FacultyLayout';
import StudentLayout from './components/StudentLayout';
import StudentDashboardOverview from './components/StudentDashboardOverview';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
}

// Face Registration Required Component
function FaceRegistrationRequired({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  // Check if user has registered their face
  const hasFaceRegistered = user.faceData || user.hasFaceData;

  // If face is not registered, redirect to register-face page
  if (!hasFaceRegistered) {
    return <Navigate to="/register-face" replace />;
  }

  return children;
}

// MyStatus Route Handler - FacultyLayout for faculty, StudentLayout for students
function MyStatusRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (user.role === 'faculty' || user.role === 'admin') {
    return (
      <FacultyLayout>
        <MyStatus />
      </FacultyLayout>
    );
  }

  return (
    <StudentLayout>
      <MyStatus />
    </StudentLayout>
  );
}

// Student Route
function StudentRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'student') return children;

  return <Navigate to="/dashboard" />;
}

// Admin/Faculty Route
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin' || user.role === 'faculty') return children;

  return <Navigate to="/attendance" />;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/student-register" element={<StudentRegistration />} />
          <Route path="/register-face" element={<ProtectedRoute><RegisterFace /></ProtectedRoute>} />

          {/* Protected Routes */}
          <Route
            path="/mark-attendance"
            element={
              <StudentRoute>
                <MarkAttendance />
              </StudentRoute>
            }
          />

          {/* Student Routes with Layout */}
          <Route
            path="/student-home"
            element={
              <FaceRegistrationRequired>
                <StudentLayout>
                  <StudentDashboardOverview />
                </StudentLayout>
              </FaceRegistrationRequired>
            }
          />

          <Route
            path="/student-mark-attendance"
            element={
              <FaceRegistrationRequired>
                <StudentLayout>
                  <StudentMarkAttendance />
                </StudentLayout>
              </FaceRegistrationRequired>
            }
          />

          <Route
            path="/student-dashboard"
            element={
              <FaceRegistrationRequired>
                <Navigate to="/student-home" />
              </FaceRegistrationRequired>
            }
          />

          <Route
            path="/attendance"
            element={
              <FaceRegistrationRequired>
                <Navigate to="/student-mark-attendance" />
              </FaceRegistrationRequired>
            }
          />

          <Route
            path="/mark-attendance"
            element={
              <FaceRegistrationRequired>
                <Navigate to="/student-mark-attendance" />
              </FaceRegistrationRequired>
            }
          />

          <Route
            path="/my-records"
            element={
              <FaceRegistrationRequired>
                <StudentLayout>
                  <AttendanceHistory />
                </StudentLayout>
              </FaceRegistrationRequired>
            }
          />

          <Route
            path="/my-record"
            element={
              <FaceRegistrationRequired>
                <StudentLayout>
                  <MyRecord />
                </StudentLayout>
              </FaceRegistrationRequired>
            }
          />

          {/* My Status - FacultyLayout for faculty, StudentLayout for students */}
          <Route
            path="/my-status"
            element={<MyStatusRoute />}
          />

          {/* Student My Status - Separate Route */}
          <Route
            path="/student/my-status"
           element={
              <FaceRegistrationRequired>
                <StudentLayout>
                  <MyStatus />
                </StudentLayout>
              </FaceRegistrationRequired>
            }
          />

          {/* Faculty Mark Own Attendance */}
          <Route
            path="/faculty/attendance"
            element={
              <FacultyLayout>
                <FacultyMarkAttendancePage />
              </FacultyLayout>
            }
          />

          <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <FacultyLayout>
                  <div className="space-y-6">
                    <DashboardOverview />
                    <LiveFeed />
                  </div>
                </FacultyLayout>
              </AdminRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <AdminRoute>
                <FacultyLayout>
                  <AttendanceReport />
                </FacultyLayout>
              </AdminRoute>
            }
          />

          <Route
            path="/my-lectures"
            element={
              <AdminRoute>
                <FacultyLayout>
                  <FacultyLectures />
                </FacultyLayout>
              </AdminRoute>
            }
          />

          <Route
            path="/lecture/:lectureId/attendance"
            element={
              <AdminRoute>
                <FacultyLayout>
                  <FacultyMarkAttendance />
                </FacultyLayout>
              </AdminRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/attendance" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
