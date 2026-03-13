import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { faceAPI, attendanceAPI } from '../api';
import { loadFaceModels, getFaceDescriptor } from '../utils/faceRecognition';
import Webcam from 'react-webcam';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const { user } = useAuth();
  const webcamRef = useRef(null);
  
  // States
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadFaceModels().then(() => setModelsReady(true)).catch(console.error);
  }, []);
  useEffect(() => {
    checkTodayAttendance();
  }, []);

  const checkTodayAttendance = async () => {
    try {
      const response = await faceAPI.getTodayAttendance();
      setTodayAttendance(response.data);
    } catch (err) {
      console.log('No attendance today');
    }
  };

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setError('');
      setResult(null);
    } else {
      setError('Failed to capture image. Please try again.');
    }
  }, []);

  const retakeImage = () => {
    setCapturedImage(null);
    setResult(null);
    setError('');
  };

  const markAttendance = async () => {
    if (!capturedImage) {
      setError('Please capture your face first');
      return;
    }
    if (!modelsReady) {
      setError('Face recognition models are loading. Please wait...');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const faceDescriptor = await getFaceDescriptor(capturedImage);
      if (!faceDescriptor) {
        setError('No face detected. Ensure your face is clearly visible.');
        setResult({ success: false, message: 'No face detected' });
        setLoading(false);
        return;
      }
      const response = await faceAPI.recognize(faceDescriptor);
      
      setResult({
        success: true,
        message: response.data.message,
        status: response.data.status,
        time: response.data.time,
        date: response.data.date,
        confidence: response.data.confidence
      });

      // Refresh today's attendance
      checkTodayAttendance();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Face recognition failed';
      const status = err.response?.data?.status;
      
      setResult({
        success: false,
        message: errorMsg,
        status: status || 'error'
      });
      
      if (errorMsg.includes('Face not matched')) {
        setError('❌ Face Not Match - Attendance NOT marked');
      } else if (errorMsg.includes('Attendance closed')) {
        setError('⛔ Attendance Closed - You are late (after 2:00 PM)');
      } else if (errorMsg.includes('Already checked in')) {
        setError('⚠️ Attendance already marked for today');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get attendance status color
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
    const timeValue = hour * 60 + minute; // minutes since midnight
    
    const nineAM = 9 * 60; // 540
    const nineTenAM = 9 * 60 + 10; // 550
    const twoPM = 14 * 60; // 840
    
    if (timeValue >= nineAM && timeValue <= nineTenAM) {
      return { status: 'present', message: 'You will be marked as PRESENT', color: 'text-green-600' };
    } else if (timeValue > nineTenAM && timeValue < twoPM) {
      return { status: 'late', message: 'You will be marked as LATE', color: 'text-yellow-600' };
    } else if (timeValue >= twoPM) {
      return { status: 'closed', message: 'Attendance is CLOSED', color: 'text-red-600' };
    } else {
      return { status: 'early', message: 'Attendance will open at 9:00 AM', color: 'text-blue-600' };
    }
  };

  const timeRule = getCurrentTimeRule();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">📚 Smart Attendance System</h1>
              <p className="text-blue-100">Face Recognition Based Attendance</p>
            </div>
            <div className="mt-4 md:mt-0 text-center">
              <p className="text-4xl font-bold">{format(currentTime, 'hh:mm:ss a')}</p>
              <p className="text-blue-100">{format(currentTime, 'EEEE, MMMM do, yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Time Rule Banner */}
        <div className={`rounded-xl shadow-lg p-4 mb-6 border-l-4 ${
          timeRule.status === 'present' ? 'bg-green-50 border-green-500' :
          timeRule.status === 'late' ? 'bg-yellow-50 border-yellow-500' :
          timeRule.status === 'closed' ? 'bg-red-50 border-red-500' :
          'bg-blue-50 border-blue-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Time Rule:</p>
              <p className={`text-xl font-bold ${timeRule.color}`}>{timeRule.message}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">9:00-9:10 AM = Present</p>
              <p className="text-sm text-gray-500">9:10 AM-2:00 PM = Late</p>
              <p className="text-sm text-gray-500">After 2:00 PM = Closed</p>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Panel - Student Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">👤 Student Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-4xl">
                  👤
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{user?.name || 'Student'}</p>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Roll Number</p>
                  <p className="font-bold text-gray-800">{user?.rollNumber || user?.enrollmentNumber || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Course</p>
                  <p className="font-bold text-gray-800">{user?.course || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-bold text-gray-800">{user?.department || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-bold text-gray-800 capitalize">{user?.role || 'Student'}</p>
                </div>
              </div>
            </div>

            {/* Today's Attendance Status */}
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-lg font-bold text-gray-800 mb-3">📋 Today's Attendance</h3>
              {todayAttendance?.status && todayAttendance.status !== 'absent' ? (
                <div className={`p-4 rounded-lg border-2 ${getStatusColor(todayAttendance.status)}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getStatusIcon(todayAttendance.status)}</span>
                    <div>
                      <p className="font-bold text-lg">Status: {todayAttendance.status.toUpperCase()}</p>
                      <p className="text-sm">
                        Time: {todayAttendance.checkInTime ? format(new Date(todayAttendance.checkInTime), 'hh:mm a') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <p className="text-gray-600">No attendance marked today</p>
                  <p className="text-sm text-gray-500">Use the camera to mark your attendance</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Face Capture */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">📸 Mark Attendance</h2>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
                <p className="font-bold">{error}</p>
              </div>
            )}

            {/* Result Message */}
            {result && (
              <div className={`p-4 rounded-lg mb-4 border-2 ${
                result.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{result.success ? '✅' : '❌'}</span>
                  <div>
                    <p className={`font-bold text-lg ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                      {result.message}
                    </p>
                    {result.success && (
                      <>
                        <p className="text-sm text-gray-600">Status: {result.status?.toUpperCase()}</p>
                        <p className="text-sm text-gray-600">Time: {result.time}</p>
                        <p className="text-sm text-gray-600">Date: {result.date}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Camera / Captured Image */}
            <div className="mb-4">
              {!capturedImage ? (
                <div className="relative">
                  <div className="border-4 border-dashed border-blue-400 rounded-lg overflow-hidden bg-black">
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full"
                      videoConstraints={{
                        width: 400,
                        height: 300,
                        facingMode: 'user'
                      }}
                    />
                    {/* Face Guide Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-green-400 rounded-full w-32 h-40 opacity-60"></div>
                    </div>
                  </div>
                  <p className="text-center text-gray-600 text-sm mt-2">Position your face in the oval</p>
                </div>
              ) : (
                <div className="border-4 border-green-400 rounded-lg overflow-hidden">
                  <img src={capturedImage} alt="Captured" className="w-full" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
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

            {/* Info Messages */}
            {todayAttendance?.status === 'present' || todayAttendance?.status === 'late' ? (
              <p className="text-center text-yellow-600 text-sm mt-3">
                ⚠️ You have already marked attendance today
              </p>
            ) : timeRule.status === 'closed' ? (
              <p className="text-center text-red-600 text-sm mt-3">
                ⛔ Attendance is closed for today (After 2:00 PM)
              </p>
            ) : null}
          </div>
        </div>

        {/* Bottom Panel - Attendance History */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Attendance Rules & Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
              <h3 className="font-bold text-green-800 mb-2">✅ Present</h3>
              <p className="text-green-700 text-sm">Mark attendance between 9:00 AM and 9:10 AM</p>
              <p className="text-green-600 text-xs mt-1">You are on time!</p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
              <h3 className="font-bold text-yellow-800 mb-2">⏰ Late</h3>
              <p className="text-yellow-700 text-sm">Mark attendance after 9:10 AM and before 2:00 PM</p>
              <p className="text-yellow-600 text-xs mt-1">You are late but attendance is accepted</p>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
              <h3 className="font-bold text-red-800 mb-2">❌ Absent / Closed</h3>
              <p className="text-red-700 text-sm">After 2:00 PM - Attendance not allowed</p>
              <p className="text-red-600 text-xs mt-1">You will be marked absent</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2">📋 Important Rules:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• You can mark attendance only once per day</li>
              <li>• Your face must match the registered face photo</li>
              <li>• If face does not match, attendance will NOT be marked</li>
              <li>• Keep your face clearly visible in the camera</li>
              <li>• Ensure good lighting for better face recognition</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
