import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, faceAPI } from '../api';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';

const COLORS = {
  present: '#10b981',
  late: '#f59e0b',
  absent: '#ef4444'
};

export default function MyRecord() {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    total: 7
  });
  const [faceImage, setFaceImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    fetchStudentData();
  }, [currentWeek]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Get start and end of current week (Sunday to Saturday)
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
      
      // Fetch records and filter for the week
      const response = await attendanceAPI.getMyRecords({ limit: 100 });
      const allRecords = response.data?.records || [];
      
      // Filter records for current week
      const filteredRecords = allRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });

      // Calculate weekly stats
      const present = filteredRecords.filter(r => r.status === 'present').length;
      const late = filteredRecords.filter(r => r.status === 'late').length;
      const absent = 7 - present - late;

      // Prepare daily data for the week
      const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
      const dailyData = daysOfWeek.map(day => {
        const dayRecord = filteredRecords.find(r => isSameDay(new Date(r.date), day));
        return {
          date: format(day, 'yyyy-MM-dd'),
          dayName: format(day, 'EEE'),
          fullDay: format(day, 'EEEE'),
          status: dayRecord?.status || 'absent',
          checkInTime: dayRecord?.checkInTime || null,
          checkOutTime: dayRecord?.checkOutTime || null
        };
      });

      setAttendanceData(dailyData);
      setWeeklyStats({
        present,
        late,
        absent: absent < 0 ? 0 : absent,
        total: 7
      });

      // Fetch user's face image from user context or localStorage
      if (user?.faceData) {
        setFaceImage(user.faceData);
      } else {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const image = userData.faceData || userData.faceImage;
          if (image) setFaceImage(image);
        }
      }

      setError('');
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError('Failed to load your attendance records');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-300';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'absent': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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

  // Prepare chart data
  const pieChartData = [
    { name: 'Present', value: weeklyStats.present, color: COLORS.present },
    { name: 'Late', value: weeklyStats.late, color: COLORS.late },
    { name: 'Absent', value: weeklyStats.absent, color: COLORS.absent }
  ].filter(item => item.value > 0);

  const barChartData = attendanceData.map(day => ({
    day: day.dayName,
    present: day.status === 'present' ? 1 : 0,
    late: day.status === 'late' ? 1 : 0,
    absent: day.status === 'absent' ? 1 : 0
  }));

  const calculatePercentage = (value) => {
    if (weeklyStats.total === 0) return 0;
    return ((value / weeklyStats.total) * 100).toFixed(1);
  };

  const attendancePercentage = ((weeklyStats.present + weeklyStats.late) / weeklyStats.total * 100).toFixed(1);

  const handlePreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const handleNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const handleCurrentWeek = () => setCurrentWeek(new Date());

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your records...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-md">
              👤
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Record</h1>
              <p className="text-blue-100">Student Attendance Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Student Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Passport Size Photo - Smaller */}
            <div className="relative">
              <div className="w-[100px] h-[130px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center border-3 border-blue-400 shadow-md overflow-hidden">
                {faceImage ? (
                  <img 
                    src={faceImage} 
                    alt="Registered Face" 
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center top' }}
                    onError={(e) => {
                      console.error('Failed to load face image');
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-5xl">👤</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full shadow-md text-xs">
                ✅
              </div>
              <p className="text-center text-xs text-gray-500 mt-1 font-medium">Registered</p>
            </div>

            {/* Student Details */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{user?.name || 'Student'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-800">{user?.email || 'N/A'}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-semibold text-gray-800 capitalize">{user?.role || 'Student'}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Face Status</p>
                  <p className="font-semibold text-green-700">Registered ✅</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Week Selector */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">📊 Weekly Analysis</h3>
              <p className="text-sm text-gray-500">
                {format(startOfWeek(currentWeek, { weekStartsOn: 0 }), 'MMM dd')} - {format(endOfWeek(currentWeek, { weekStartsOn: 0 }), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePreviousWeek} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition">← Previous</button>
              <button onClick={handleCurrentWeek} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition">Current</button>
              <button onClick={handleNextWeek} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition">Next →</button>
            </div>
          </div>
        </div>

        {/* Weekly Attendance Percentage Banner */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 text-white ${
          attendancePercentage >= 75 ? 'bg-gradient-to-r from-green-500 to-green-600' :
          attendancePercentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
          'bg-gradient-to-r from-red-500 to-red-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium opacity-90">Weekly Attendance</p>
              <p className="text-5xl font-bold">{attendancePercentage}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Present: {weeklyStats.present} days</p>
              <p className="text-sm opacity-90">Late: {weeklyStats.late} days</p>
              <p className="text-sm opacity-90">Absent: {weeklyStats.absent} days</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Present Days</p>
                <p className="text-3xl font-bold text-green-600">{weeklyStats.present}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{calculatePercentage(weeklyStats.present)}% this week</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Late Entries</p>
                <p className="text-3xl font-bold text-yellow-600">{weeklyStats.late}</p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{calculatePercentage(weeklyStats.late)}% this week</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Absent Days</p>
                <p className="text-3xl font-bold text-red-600">{weeklyStats.absent}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{calculatePercentage(weeklyStats.absent)}% this week</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Days</p>
                <p className="text-3xl font-bold text-blue-600">{weeklyStats.total}</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
            <p className="text-sm text-gray-500 mt-2">This week</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Attendance Distribution</h3>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
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
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No attendance data available
              </div>
            )}
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Daily Attendance (This Week)</h3>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill={COLORS.present} name="Present" />
                  <Bar dataKey="late" fill={COLORS.late} name="Late" />
                  <Bar dataKey="absent" fill={COLORS.absent} name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No attendance data
              </div>
            )}
          </div>
        </div>

        {/* Weekly Attendance Records */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📝 Weekly Attendance Records</h3>
          {attendanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-bold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">Day</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">Check In</th>
                    <th className="text-left py-3 px-4 font-bold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((record, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{format(new Date(record.date), 'dd MMM yyyy')}</td>
                      <td className="py-3 px-4">{record.fullDay}</td>
                      <td className="py-3 px-4">
                        {record.checkInTime ? format(new Date(record.checkInTime), 'hh:mm a') : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)} {record.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No attendance records found for this week
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4">📋 Weekly Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-blue-100 text-sm">Total Days</p>
              <p className="text-3xl font-bold">{weeklyStats.total} days</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-green-100 text-sm">Present</p>
              <p className="text-3xl font-bold">{weeklyStats.present} days</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-yellow-100 text-sm">Late</p>
              <p className="text-3xl font-bold">{weeklyStats.late} days</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-red-100 text-sm">Absent</p>
              <p className="text-3xl font-bold">{weeklyStats.absent} days</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-blue-100">
              Weekly Attendance Percentage: {' '}
              <span className="font-bold text-white text-2xl">
                {attendancePercentage}%
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
