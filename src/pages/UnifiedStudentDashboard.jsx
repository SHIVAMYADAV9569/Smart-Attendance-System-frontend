import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { faceAPI, attendanceAPI, authAPI } from '../api';
import Webcam from 'react-webcam';
import { format, parseISO, subMonths } from 'date-fns';
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

export default function UnifiedStudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  
  // States
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'myStatus'
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [error, setError] = useState('');
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // My Status states
  const [monthlyStats, setMonthlyStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
    total: 0
  });
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [statsLoading, setStatsLoading] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check today's attendance on load
  useEffect(() => {
    checkTodayAttendance();
    fetchMyStatusData();
  }, []);

  // Fetch My Status data when month changes
  useEffect(() => {
    fetchMyStatusData();
  }, [selectedMonth]);

  const checkTodayAttendance = async () => {
    try {
      const response = await faceAPI.getTodayAttendance();
      setTodayAttendance(response.data);
    } catch (err) {
      console.log('No attendance today');
    }
  };

  const fetchMyStatusData = async () => {
    try {
      setStatsLoading(true);
      const month = selectedMonth.getMonth();
      const year = selectedMonth.getFullYear();
      const statsResponse = await attendanceAPI.getMonthlyStats({ month, year });
      
      if (statsResponse.data) {
        setMonthlyStats({
          present: statsResponse.data.presentDays || 0,
          late: statsResponse.data.lateDays || 0,
          absent: statsResponse.data.absentDays || 0,
          total: statsResponse.data.workingDays || 0
        });
        setAttendanceHistory(statsResponse.data.dailyData || []);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setError('');
      setAttendanceResult(null);
    } else {
      setError('Failed to capture image. Please try again.');
    }
  }, []);

  const retakeImage = () => {
    setCapturedImage(null);
    setAttendanceResult(null);
    setError('');
  };

  const markAttendance = async () => {
    if (!capturedImage) {
      setError('Please capture your face first');
      return;
    }

    setLoading(true);
    setError('');
    setAttendanceResult(null);

    try {
      const response = await faceAPI.recognize(capturedImage);
      
      setAttendanceResult({
        success: true,
        message: response.data.message,
        status: response.data.status,
        time: response.data.time,
        date: response.data.date,
        confidence: response.data.confidence
      });

      // Refresh data
      checkTodayAttendance();
      fetchMyStatusData();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Face recognition failed';
      const status = err.response?.data?.status;
      
      setAttendanceResult({
        success: false,
        message: errorMsg,
        status: status || 'error'
      });
      
      if (errorMsg.toLowerCase().includes('face not matched') || errorMsg.toLowerCase().includes('not match')) {
        setError('❌ Face Not Match - Attendance NOT marked');
      } else if (errorMsg.toLowerCase().includes('attendance closed') || errorMsg.toLowerCase().includes('already late')) {
        setError('⛔ Attendance Closed - Already Late (after 2:00 PM)');
      } else if (errorMsg.toLowerCase().includes('already checked in')) {
        setError('⚠️ Attendance already marked for today');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get status color
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

  // Check time rules
  const getCurrentTimeRule = () => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const timeValue = hour * 60 + minute;
    
    const nineAM = 9 * 60;
    const nineTenAM = 9 * 60 + 10;
    const twoPM = 14 * 60;
    
    if (timeValue >= nineAM && timeValue <= nineTenAM) {
      return { status: 'present', message: 'You will be marked as PRESENT', color: 'text-green-600', bgColor: 'bg-green-50' };
    } else if (timeValue > nineTenAM && timeValue < twoPM) {
      return { status: 'late', message: 'You will be marked as LATE', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    } else if (timeValue >= twoPM) {
      return { status: 'closed', message: 'Attendance is CLOSED', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else {
      return { status: 'early', message: 'Attendance opens at 9:00 AM', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    }
  };

  const timeRule = getCurrentTimeRule();

  // Calculate percentages
  const calculatePercentage = (value) => {
    if (monthlyStats.total === 0) return 0;
    return ((value / monthlyStats.total) * 100).toFixed(1);
  };

  // Chart data
  const pieChartData = [
    { name: 'Present', value: monthlyStats.present, color: COLORS.present },
    { name: 'Late', value: monthlyStats.late, color: COLORS.late },
    { name: 'Absent', value: monthlyStats.absent, color: COLORS.absent }
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <h1 className="text-2xl font-bold">{user?.name || 'Student'}</h1>
                <p className="text-blue-100 text-sm">{user?.email}</p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{format(currentTime, 'hh:mm a')}</p>
                <p className="text-blue-100 text-sm">{format(currentTime, 'dd MMM yyyy')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-xl shadow-lg p-2 flex">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📸 Mark Attendance
          </button>
          <button
            onClick={() => setActiveTab('myStatus')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition ${
              activeTab === 'myStatus'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📊 My Status
          </button>
        </div>
      </div>

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Time Rule Banner */}
          <div className={`rounded-xl shadow-lg p-4 mb-6 border-l-4 ${timeRule.bgColor} border-${timeRule.color.split('-')[1]}-500`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Time Rule:</p>
                <p className={`text-xl font-bold ${timeRule.color}`}>{timeRule.message}</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>9:00-9:10 AM = Present</p>
                <p>9:10 AM-2:00 PM = Late</p>
                <p>After 2:00 PM = Closed</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">👤 Student Information</h2>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-3xl">
                  {user?.faceData ? '👤' : '👤'}
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-800">{user?.name}</p>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Course</p>
                  <p className="font-bold text-gray-800">{user?.course || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-bold text-gray-800">{user?.department || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Roll Number</p>
                  <p className="font-bold text-gray-800">{user?.rollNumber || user?.enrollmentNumber || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-bold text-gray-800">{format(currentTime, 'dd/MM/yyyy')}</p>
                </div>
              </div>

              {/* Today's Status */}
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Today's Attendance</h3>
                {todayAttendance?.status && todayAttendance.status !== 'absent' ? (
                  <div className={`p-4 rounded-lg border-2 ${getStatusColor(todayAttendance.status)}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getStatusIcon(todayAttendance.status)}</span>
                      <div>
                        <p className="font-bold text-lg">{todayAttendance.status.toUpperCase()}</p>
                        <p className="text-sm">
                          Time: {todayAttendance.checkInTime ? format(new Date(todayAttendance.checkInTime), 'hh:mm a') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <p className="text-gray-600">Not marked yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Face Capture */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📸 Face Recognition</h2>

              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
                  <p className="font-bold">{error}</p>
                </div>
              )}

              {attendanceResult && (
                <div className={`p-4 rounded-lg mb-4 border-2 ${
                  attendanceResult.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{attendanceResult.success ? '✅' : '❌'}</span>
                    <div>
                      <p className={`font-bold text-lg ${attendanceResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {attendanceResult.message}
                      </p>
                      {attendanceResult.success && (
                        <>
                          <p className="text-sm text-gray-600">Status: <span className="font-bold">{attendanceResult.status?.toUpperCase()}</span></p>
                          <p className="text-sm text-gray-600">Time: {attendanceResult.time}</p>
                          <p className="text-sm text-gray-600">Date: {attendanceResult.date}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                {!capturedImage ? (
                  <div className="relative">
                    <div className="border-4 border-dashed border-blue-400 rounded-lg overflow-hidden bg-black">
                      <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full"
                        videoConstraints={{ width: 400, height: 300, facingMode: 'user' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="border-2 border-green-400 rounded-full w-32 h-40 opacity-60"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-4 border-green-400 rounded-lg overflow-hidden">
                    <img src={capturedImage} alt="Captured" className="w-full" />
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                {!capturedImage ? (
                  <button
                    onClick={captureImage}
                    disabled={timeRule.status === 'closed' || todayAttendance?.status === 'present' || todayAttendance?.status === 'late'}
                    className={`flex-1 font-bold py-3 px-4 rounded-lg transition ${
                      timeRule.status === 'closed' || todayAttendance?.status === 'present' || todayAttendance?.status === 'late'
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    📷 Capture Face
                  </button>
                ) : (
                  <>
                    <button
                      onClick={retakeImage}
                      disabled={loading}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
                    >
                      🔄 Retake
                    </button>
                    <button
                      onClick={markAttendance}
                      disabled={loading || timeRule.status === 'closed'}
                      className={`flex-1 font-bold py-3 px-4 rounded-lg transition ${
                        loading || timeRule.status === 'closed'
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {loading ? '⏳ Processing...' : '✅ Mark Attendance'}
                    </button>
                  </>
                )}
              </div>

              {(todayAttendance?.status === 'present' || todayAttendance?.status === 'late') && (
                <p className="text-center text-yellow-600 text-sm mt-3">
                  ⚠️ Attendance already marked for today
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Status Tab */}
      {activeTab === 'myStatus' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Month Selector */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-bold text-gray-800">📊 Monthly Analysis</h2>
              <input
                type="month"
                value={format(selectedMonth, 'yyyy-MM')}
                onChange={(e) => setSelectedMonth(new Date(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600 text-sm">Present Days</p>
                  <p className="text-3xl font-bold text-green-600">{monthlyStats.present}</p>
                </div>
                <span className="text-4xl">✅</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">{calculatePercentage(monthlyStats.present)}%</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600 text-sm">Late Days</p>
                  <p className="text-3xl font-bold text-yellow-600">{monthlyStats.late}</p>
                </div>
                <span className="text-4xl">⏰</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">{calculatePercentage(monthlyStats.late)}%</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600 text-sm">Absent Days</p>
                  <p className="text-3xl font-bold text-red-600">{monthlyStats.absent}</p>
                </div>
                <span className="text-4xl">❌</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">{calculatePercentage(monthlyStats.absent)}%</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600 text-sm">Total Days</p>
                  <p className="text-3xl font-bold text-blue-600">{monthlyStats.total}</p>
                </div>
                <span className="text-4xl">📅</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Working days</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Attendance Distribution</h3>
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
                <div className="flex items-center justify-center h-64 text-gray-500">No data</div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Attendance Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-800 font-semibold">Present Percentage</span>
                  <span className="text-2xl font-bold text-green-600">{calculatePercentage(monthlyStats.present)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-800 font-semibold">Late Percentage</span>
                  <span className="text-2xl font-bold text-yellow-600">{calculatePercentage(monthlyStats.late)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-red-800 font-semibold">Absent Percentage</span>
                  <span className="text-2xl font-bold text-red-600">{calculatePercentage(monthlyStats.absent)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Attendance History</h3>
            {attendanceHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-bold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-700">Day</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-700">Time</th>
                      <th className="text-left py-3 px-4 font-bold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map((record, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{format(parseISO(record.date), 'dd MMM yyyy')}</td>
                        <td className="py-3 px-4">{format(parseISO(record.date), 'EEEE')}</td>
                        <td className="py-3 px-4">
                          {record.checkInTime ? format(parseISO(record.checkInTime), 'hh:mm a') : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(record.status)}`}>
                            {getStatusIcon(record.status)} {record.status?.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No attendance records found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}