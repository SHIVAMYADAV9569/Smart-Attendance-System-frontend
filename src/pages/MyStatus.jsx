import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { attendanceAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import StudentAttendanceStatus from '../components/StudentAttendanceStatus';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

// IST timezone helper function (manual timezone conversion)
const getISTTime = (date) => {
  const now = new Date(date);
  // IST is UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60 * 1000));
  return istTime;
};

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export default function MyStatus() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekData, setWeekData] = useState([]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchWeeklyStats();
    } else {
      setLoading(false);
    }
  }, [currentWeek, user]);

  const fetchWeeklyStats = async () => {
    try {
      setLoading(true);
      
      // Get start and end of current week (Sunday to Saturday)
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
      
      // Fetch all records and filter for the week
      const response = await attendanceAPI.getMyRecords({ limit: 100 });
      const allRecords = response.data?.records || [];
      
      // Filter records for current week
      const filteredRecords = allRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      });

      // Calculate weekly stats
      const presentDays = filteredRecords.filter(r => r.status === 'present').length;
      const lateDays = filteredRecords.filter(r => r.status === 'late').length;
      const absentDays = filteredRecords.filter(r => r.status === 'absent').length;
      const totalDays = 7; // Always 7 days in a week
      
      // Calculate percentage
      const attendedDays = presentDays + lateDays;
      const attendancePercentage = totalDays > 0 ? ((attendedDays / totalDays) * 100).toFixed(1) : 0;

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

      setWeekData(dailyData);
      
      setStats({
        presentDays,
        lateDays,
        absentDays,
        totalDays,
        attendancePercentage,
        weekStart: format(weekStart, 'MMM dd'),
        weekEnd: format(weekEnd, 'MMM dd, yyyy')
      });
      
      setError('');
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load attendance statistics');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // For Faculty/Admin - show students status AND own attendance
  if (user?.role === 'faculty' || user?.role === 'admin') {
  return (
     <div>
       <div className="container mx-auto px-4 py-8">
         <h1 className="text-3xl font-bold text-gray-800 mb-8">Students Attendance Status - Today</h1>
         
         {/* Faculty's Own Attendance Section */}
         <div className="mb-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-300">
           <h2 className="text-xl font-bold text-gray-800 mb-4">📷 Your Attendance</h2>
           <p className="text-gray-600 mb-4">
             Mark your attendance using face recognition (same as students)
           </p>
           <a
             href="/mark-attendance"
             className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition transform hover:scale-105"
           >
             📸 Mark Your Attendance
           </a>
         </div>
         
         <StudentAttendanceStatus />
       </div>
     </div>
   );
  }

  // For Students - show personal stats
  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">Loading your attendance status...</div>
        </div>
      </div>
    );
  }

  const weekRange = stats ? `${stats.weekStart} - ${stats.weekEnd}` : '';
  const attendancePercentage = stats ? parseFloat(stats.attendancePercentage) : 0;
  
  // Prepare pie chart data
  const pieData = stats ? [
    { name: 'Present', value: stats.presentDays },
    { name: 'Late', value: stats.lateDays },
    { name: 'Absent', value: stats.absentDays }
  ] : [];
  
  // Prepare bar chart data for daily view
  const barChartData = weekData.map(day => ({
    day: day.dayName,
    present: day.status === 'present' ? 1 : 0,
    late: day.status === 'late' ? 1 : 0,
    absent: day.status === 'absent' ? 1 : 0
  }));

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Week Navigation */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-2xl font-bold text-gray-800">My Attendance Status</div>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousWeek}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              ← Previous Week
            </button>
            <button
              onClick={handleCurrentWeek}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
            >
              Current Week
            </button>
            <button
              onClick={handleNextWeek}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Next Week →
            </button>
          </div>
        </div>

        {/* Week Display */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-700">{weekRange}</h2>
          <p className="text-gray-500 mt-2">Weekly Attendance Analysis</p>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-green-100 rounded-lg shadow-lg p-6">
            <div className="text-gray-600 text-sm font-bold">PRESENT</div>
            <div className="text-4xl font-bold text-green-600 mt-2">{stats?.presentDays || 0}</div>
            <div className="text-gray-500 text-xs mt-2">Days</div>
          </div>

          <div className="bg-yellow-100 rounded-lg shadow-lg p-6">
            <div className="text-gray-600 text-sm font-bold">LATE</div>
            <div className="text-4xl font-bold text-yellow-600 mt-2">{stats?.lateDays || 0}</div>
            <div className="text-gray-500 text-xs mt-2">Days</div>
          </div>

          <div className="bg-red-100 rounded-lg shadow-lg p-6">
            <div className="text-gray-600 text-sm font-bold">ABSENT</div>
            <div className="text-4xl font-bold text-red-600 mt-2">{stats?.absentDays || 0}</div>
            <div className="text-gray-500 text-xs mt-2">Days</div>
          </div>

          <div className="bg-blue-100 rounded-lg shadow-lg p-6">
            <div className="text-gray-600 text-sm font-bold">ATTENDANCE %</div>
            <div className={`text-4xl font-bold mt-2 ${
              attendancePercentage >= 75 ? 'text-blue-600' : 
              attendancePercentage >= 50 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {attendancePercentage}%
            </div>
            <div className="text-gray-500 text-xs mt-2">This week</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pie Chart - Status Distribution */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Status Distribution</h3>
            {pieData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                No attendance data available for this month
              </div>
            )}
          </div>

          {/* Bar Chart - Daily Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Daily Attendance</h3>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="#10b981" name="Present" />
                  <Bar dataKey="late" fill="#f59e0b" name="Late" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                No daily data available
              </div>
            )}
          </div>
        </div>

        {/* Weekly Records Table */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Daily Records for Week ({weekRange})</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Day</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Check In (IST)</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Check Out (IST)</th>
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {weekData.length > 0 ? (
                  weekData.map((record, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                      <td className="py-3 px-4 capitalize">{record.fullDay}</td>
                      <td className="py-3 px-4">
                        {record.checkInTime ? format(getISTTime(record.checkInTime), 'hh:mm a') : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {record.checkOutTime ? format(getISTTime(record.checkOutTime), 'hh:mm a') : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            record.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'late'
                              ? 'bg-yellow-100 text-yellow-800'
                              : record.status === 'weekend'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {record.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      No attendance records for this week
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Weekly Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Total Days in Week</p>
              <p className="text-2xl font-bold text-gray-800">{stats?.totalDays || 7}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Present Days</p>
              <p className="text-2xl font-bold text-green-600">{stats?.presentDays || 0}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Late Days</p>
              <p className="text-2xl font-bold text-yellow-600">{stats?.lateDays || 0}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Absent Days</p>
              <p className="text-2xl font-bold text-red-600">{stats?.absentDays || 0}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">Weekly Attendance Percentage:</p>
              <p className={`text-3xl font-bold ${
                attendancePercentage >= 75 ? 'text-green-600' : 
                attendancePercentage >= 50 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {attendancePercentage}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
