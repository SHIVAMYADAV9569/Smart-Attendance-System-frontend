import React, { useEffect, useState } from 'react';
import { dashboardAPI, lectureAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [todayLectures, setTodayLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLectures, setLoadingLectures] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('month');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    fetchTodayLectures();
  }, [filter]);

  const fetchTodayLectures = async () => {
    try {
      setLoadingLectures(true);
      const response = await lectureAPI.getTodayLectures();
      setTodayLectures(response.data.lectures || []);
    } catch (err) {
      console.error('Error fetching today lectures:', err);
    } finally {
      setLoadingLectures(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getOverview();
      setOverview(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getLectureStatusColor = (status) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const handleMarkAttendance = (lectureId) => {
    navigate(`/lecture/${lectureId}/attendance`);
  };

  const handleManageLectures = () => {
    navigate('/my-lectures');
  };

  if (loading) return <div className="text-center py-12">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-gray-600 text-sm font-bold">TODAY'S PRESENT</div>
          <div className="text-4xl font-bold text-green-600 mt-2">
            {overview?.today?.present || 0}
          </div>
          <div className="text-gray-500 text-xs mt-2">
            Out of {overview?.today?.totalUsers || 0} users
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-gray-600 text-sm font-bold">TODAY'S ABSENT</div>
          <div className="text-4xl font-bold text-red-600 mt-2">
            {overview?.today?.absent || 0}
          </div>
          <div className="text-gray-500 text-xs mt-2">
            Attendance percentage: {(((overview?.today?.present || 0) / (overview?.today?.totalUsers || 1)) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-gray-600 text-sm font-bold">THIS MONTH</div>
          <div className="text-2xl font-bold text-blue-600 mt-2">
            {overview?.thisMonth?.totalRecords || 0}
          </div>
          <div className="text-gray-500 text-xs mt-2">
            Avg attendance: {overview?.thisMonth?.average}
          </div>
        </div>
      </div>

      {/* Today's Lectures */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">📚 Today's Lectures</h2>
          <button
            onClick={handleManageLectures}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
          >
            Manage All Lectures
          </button>
        </div>

        {loadingLectures ? (
          <div className="text-center py-4 text-gray-500">Loading lectures...</div>
        ) : todayLectures.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No lectures scheduled for today</p>
            <button
              onClick={handleManageLectures}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Create a Lecture
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayLectures.map((lecture) => (
              <div
                key={lecture._id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{lecture.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getLectureStatusColor(lecture.status)}`}>
                      {lecture.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {lecture.startTime} - {lecture.endTime}
                    {lecture.subject && ` | ${lecture.subject}`}
                  </p>
                </div>
                <button
                  onClick={() => handleMarkAttendance(lecture._id)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
                >
                  Mark Attendance
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Recent Check-ins</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {overview?.recentActivity?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          ) : (
            overview?.recentActivity?.map((activity, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded border-l-4 border-blue-500"
              >
                <div>
                  <p className="font-semibold text-gray-800">{activity.userId?.name}</p>
                  <p className="text-xs text-gray-500">{activity.userId?.enrollmentNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-700">
                    {new Date(activity.checkInTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    CHECK IN
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
