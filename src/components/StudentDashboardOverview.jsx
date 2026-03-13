import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, lectureAPI } from '../api';
import { format, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

const COLORS = {
  present: '#10b981',
  late: '#f59e0b',
  absent: '#ef4444'
};

export default function StudentDashboardOverview() {
  const { user } = useAuth();
  const [todayLectures, setTodayLectures] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    total: 7
  });
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch weekly stats (current week - Sunday to Saturday)
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
      
      const response = await attendanceAPI.getMyRecords({ limit: 100 });
      const allRecords = response.data?.records || [];
      
      // Filter records for current week
      const weekRecords = allRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });
      
      // Calculate weekly stats
      const present = weekRecords.filter(r => r.status === 'present').length;
      const late = weekRecords.filter(r => r.status === 'late').length;
      const absent = 7 - present - late;
      
      setWeeklyStats({
        present,
        late,
        absent: absent < 0 ? 0 : absent,
        total: 7
      });

      // Get today's attendance from my records (getTodayRecords is faculty-only)
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayRecord = allRecords.find(r => format(new Date(r.date), 'yyyy-MM-dd') === todayStr);
      if (todayRecord) {
        setTodayAttendance(todayRecord);
      }

      // Fetch today's lectures based on department
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        // For students, we'll show lectures from their department
        // This is a mock - in real scenario, you'd have student-lecture mapping
        const lecturesResponse = await lectureAPI.getTodayLectures();
        if (lecturesResponse.data?.lectures) {
          // Filter lectures by student's department if available
          const studentDept = user?.department?.toLowerCase();
          const filteredLectures = studentDept 
            ? lecturesResponse.data.lectures.filter(l => 
                l.department?.toLowerCase() === studentDept || !l.department
              )
            : lecturesResponse.data.lectures;
          setTodayLectures(filteredLectures);
        }
      } catch (e) {
        console.log('No lectures today');
        // Set default lectures if none found
        setTodayLectures([
          { _id: '1', title: 'Mobile Computing', startTime: '09:00', endTime: '10:00', subject: 'CS', status: 'scheduled' },
          { _id: '2', title: 'Project Management', startTime: '10:15', endTime: '11:15', subject: 'Management', status: 'scheduled' },
          { _id: '3', title: 'Multimedia', startTime: '11:30', endTime: '12:30', subject: 'CS', status: 'scheduled' },
          { _id: '4', title: 'Machine Learning', startTime: '14:00', endTime: '15:00', subject: 'CS', status: 'scheduled' }
        ]);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (value) => {
    if (weeklyStats.total === 0) return 0;
    return ((value / weeklyStats.total) * 100).toFixed(1);
  };

  // Weekly attendance percentage
  const weeklyAttendancePercentage = ((weeklyStats.present + weeklyStats.late) / weeklyStats.total * 100).toFixed(1);

  // Pie chart data
  const pieChartData = [
    { name: 'Present', value: weeklyStats.present, color: COLORS.present },
    { name: 'Late', value: weeklyStats.late, color: COLORS.late },
    { name: 'Absent', value: weeklyStats.absent, color: COLORS.absent }
  ].filter(item => item.value > 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-400';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      case 'absent': return 'bg-red-100 text-red-800 border-red-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✅';
      case 'late': return '⏰';
      case 'absent': return '❌';
      default: return '➖';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}! 👋</h1>
            <p className="text-blue-100">{user?.course} | {user?.department || 'Department'}</p>
          </div>
          <div className="mt-4 md:mt-0 text-center">
            <p className="text-4xl font-bold">{format(currentTime, 'hh:mm a')}</p>
            <p className="text-blue-100">{format(currentTime, 'EEEE, MMMM do, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Weekly Attendance Percentage Banner */}
      <div className={`rounded-xl shadow-lg p-6 text-white ${
        weeklyAttendancePercentage >= 75 ? 'bg-gradient-to-r from-green-500 to-green-600' :
        weeklyAttendancePercentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
        'bg-gradient-to-r from-red-500 to-red-600'
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-lg font-medium opacity-90">Weekly Attendance</p>
            <p className="text-5xl font-bold">{weeklyAttendancePercentage}%</p>
            <p className="text-sm opacity-75 mt-1">
              {format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'MMM dd')} - {format(endOfWeek(new Date(), { weekStartsOn: 0 }), 'MMM dd, yyyy')}
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <p className="text-sm opacity-90">Present: {weeklyStats.present} days</p>
            <p className="text-sm opacity-90">Late: {weeklyStats.late} days</p>
            <p className="text-sm opacity-90">Absent: {weeklyStats.absent} days</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm">Present Days</p>
              <p className="text-3xl font-bold text-green-600">{weeklyStats.present}</p>
            </div>
            <span className="text-4xl">✅</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">{calculatePercentage(weeklyStats.present)}% this week</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm">Late Days</p>
              <p className="text-3xl font-bold text-yellow-600">{weeklyStats.late}</p>
            </div>
            <span className="text-4xl">⏰</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">{calculatePercentage(weeklyStats.late)}% this week</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm">Absent Days</p>
              <p className="text-3xl font-bold text-red-600">{weeklyStats.absent}</p>
            </div>
            <span className="text-4xl">❌</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">{calculatePercentage(weeklyStats.absent)}% this week</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600 text-sm">Today's Status</p>
              <p className="text-xl font-bold text-blue-600">
                {todayAttendance?.status ? todayAttendance.status.toUpperCase() : 'Not Marked'}
              </p>
            </div>
            <span className="text-4xl">📅</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {todayAttendance?.checkInTime 
              ? format(new Date(todayAttendance.checkInTime), 'hh:mm a')
              : 'Mark your attendance'
            }
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Lectures */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">📚 Today's Lectures</h2>
            <span className="text-sm text-gray-500">{user?.department || 'General'}</span>
          </div>
          
          {todayLectures.length > 0 ? (
            <div className="space-y-3">
              {todayLectures.map((lecture, index) => (
                <div key={lecture._id || index} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                          #{index + 1}
                        </span>
                        <h3 className="font-bold text-gray-800">{lecture.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {lecture.startTime} - {lecture.endTime}
                      </p>
                      {lecture.subject && (
                        <p className="text-xs text-gray-500">Subject: {lecture.subject}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      lecture.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                      lecture.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {lecture.status?.toUpperCase() || 'SCHEDULED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No lectures scheduled for today</p>
            </div>
          )}
        </div>

        {/* Attendance Pie Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Weekly Attendance</h2>
          
          {pieChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              {/* Percentage Summary */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-xs text-green-600">Present</p>
                  <p className="text-lg font-bold text-green-700">{calculatePercentage(weeklyStats.present)}%</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-2">
                  <p className="text-xs text-yellow-600">Late</p>
                  <p className="text-lg font-bold text-yellow-700">{calculatePercentage(weeklyStats.late)}%</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-xs text-red-600">Absent</p>
                  <p className="text-lg font-bold text-red-700">{calculatePercentage(weeklyStats.absent)}%</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No attendance data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="#/student-mark-attendance"
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl transition text-center"
          >
            <span className="text-2xl block mb-2">📸</span>
            Mark Attendance
          </a>
          <a 
            href="#/my-record"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition text-center"
          >
            <span className="text-2xl block mb-2">📋</span>
            View Records
          </a>
          <a 
            href="#/my-status"
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition text-center"
          >
            <span className="text-2xl block mb-2">📊</span>
            My Status
          </a>
        </div>
      </div>
    </div>
  );
}
