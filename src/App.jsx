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

// MyStatus Route Handler - decides layout based on role
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

  return <MyStatus />;
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
              <StudentRoute>
                <StudentLayout>
                  <StudentDashboardOverview />
                </StudentLayout>
              </StudentRoute>
            }
          />

          <Route
            path="/student-mark-attendance"
            element={
              <StudentRoute>
                <StudentLayout>
                  <StudentMarkAttendance />
                </StudentLayout>
              </StudentRoute>
            }
          />

          <Route
            path="/student-dashboard"
            element={
              <StudentRoute>
                <Navigate to="/student-home" />
              </StudentRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <StudentRoute>
                <Navigate to="/student-mark-attendance" />
              </StudentRoute>
            }
          />

          <Route
            path="/mark-attendance"
            element={
              <StudentRoute>
                <Navigate to="/student-mark-attendance" />
              </StudentRoute>
            }
          />

          <Route
            path="/my-records"
            element={
              <StudentRoute>
                <StudentLayout>
                  <AttendanceHistory />
                </StudentLayout>
              </StudentRoute>
            }
          />

          <Route
            path="/my-record"
            element={
              <StudentRoute>
                <StudentLayout>
                  <MyRecord />
                </StudentLayout>
              </StudentRoute>
            }
          />

          <Route
            path="/my-status"
            element={
              <StudentRoute>
                <StudentLayout>
                  <MyStatus />
                </StudentLayout>
              </StudentRoute>
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
