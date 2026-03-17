import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { faceAPI } from '../api';
import { loadFaceModels, getFaceDescriptor } from '../utils/faceRecognition';
import Webcam from 'react-webcam';
import { format } from 'date-fns';

export default function StudentMarkAttendance() {
  const { user } = useAuth();
  const webcamRef = useRef(null);
  
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [registeredFace, setRegisteredFace] = useState(null);

  // IST timezone helper function (manual timezone conversion)
  const getISTTime = () => {
    const now = new Date();
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60 * 1000));
    return istTime;
  };

  // Get registered face from user data
  useEffect(() => {
    if (user?.faceData) {
      setRegisteredFace(user.faceData);
    } else {
      // Fallback to localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.faceData) {
          setRegisteredFace(userData.faceData);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getISTTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadFaceModels()
      .then(() => setModelsReady(true))
      .catch((err) => console.error('Failed to load face models:', err));
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
  const webcam = webcamRef.current;
  if (!webcam) {
     setError('Camera not available. Please ensure camera permissions are granted.');
  return;
   }
   
  const imageSrc = webcam.getScreenshot();
  if (imageSrc) {
    // Validate that image has actual content (not a blank/white image)
   const img = new Image();
     img.onload = () => {
       // Check if image has reasonable dimensions
    if (img.width < 100 || img.height < 100) {
         setError('Captured image is too small. Please position your face properly in the frame.');
        setCapturedImage(null);
      return;
      }
      
       // Valid image captured
      setCapturedImage(imageSrc);
       setError('');
       setResult(null);
     };
     img.onerror = () => {
       setError('Failed to process captured image. Please try again.');
       setCapturedImage(null);
     };
     img.src = imageSrc;
   } else {
     setError('Failed to capture image. Please ensure camera is working and try again.');
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
      setError('Face recognition models are still loading. Please wait...');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const faceDescriptor = await getFaceDescriptor(capturedImage);
      if (!faceDescriptor) {
        setError('No face detected in the captured image. Please ensure your face is clearly visible.');
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

      checkTodayAttendance();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Face recognition failed';
      const status = err.response?.data?.status;
      
      setResult({
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

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-400';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      case 'absent': return 'bg-red-100 text-red-800 border-red-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-400';
    }
  };

  // Check time rules using IST
  const getCurrentTimeRule = () => {
    const istTime = getISTTime();
    const hour = istTime.getHours();
    const minute = istTime.getMinutes();
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg p-6 mb-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">📸 Mark Attendance</h1>
            <p className="text-green-100">Face Recognition Based Attendance</p>
          </div>
          <div className="mt-4 md:mt-0 text-center">
            <p className="text-4xl font-bold">{format(currentTime, 'hh:mm a')}</p>
            <p className="text-green-100">{format(currentTime, 'EEEE, MMMM do, yyyy')} IST</p>
          </div>
        </div>
      </div>

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
        {/* Student Info */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">👤 Student Information</h2>
          
          <div className="flex items-center gap-4 mb-6">
            {/* Registered Face Photo */}
            <div className="relative">
              {registeredFace ? (
                <div className="w-[80px] h-[100px] rounded-lg overflow-hidden border-2 border-green-400 shadow-md">
                  <img 
                    src={registeredFace} 
                    alt="Registered Face" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-[80px] h-[100px] bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center border-2 border-gray-300">
                  <span className="text-3xl">👤</span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-0.5 rounded-full text-xs">
                ✅
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{user?.name}</p>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-xs text-green-600 font-medium mt-1">
                {registeredFace ? '✓ Face Registered' : '✗ Face Not Registered'}
              </p>
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
              <p className="text-xs text-gray-500">IST</p>
            </div>
          </div>

          {/* Today's Status */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Today's Attendance</h3>
            {todayAttendance?.status && todayAttendance.status !== 'absent' ? (
              <div className={`p-4 rounded-lg border-2 ${getStatusColor(todayAttendance.status)}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {todayAttendance.status === 'present' ? '✅' : todayAttendance.status === 'late' ? '⏰' : '❌'}
                  </span>
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
          <h2 className="text-xl font-bold text-gray-800 mb-4">📷 Face Recognition</h2>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
              <p className="font-bold">{error}</p>
            </div>
          )}

          {/* Face Match Result */}
          {result && (
            <div className={`p-4 rounded-lg mb-4 border-2 ${
              result.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{result.success ? '✅' : '❌'}</span>
                <div className="flex-1">
                  <p className={`font-bold text-lg ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? result.message : '❌ Face Not Matched'}
                  </p>
                  {!result.success && (
                    <p className="text-sm text-red-600 mt-1">
                      Your captured face does not match the registered photo. Attendance NOT marked.
                    </p>
                  )}
                  {result.success && (
                    <>
                      <p className="text-sm text-gray-600">Status: <span className="font-bold">{result.status?.toUpperCase()}</span></p>
                      <p className="text-sm text-gray-600">Time: {result.time}</p>
                      <p className="text-sm text-gray-600">Date: {result.date}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Registered Face Reference */}
          {registeredFace && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-600 font-medium mb-2">📷 Registered Face (Reference)</p>
              <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-300 inline-block">
                <img src={registeredFace} alt="Registered" className="w-full h-full object-cover" />
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
                <p className="text-center text-gray-600 text-sm mt-2">Position your face in the oval</p>
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

          {timeRule.status === 'closed' && (
            <p className="text-center text-red-600 text-sm mt-3">
              ⛔ Attendance is closed for today (After 2:00 PM)
            </p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-xl shadow-lg p-6 mt-6">
        <h3 className="text-lg font-bold text-blue-800 mb-3">📋 Instructions</h3>
        <ul className="text-blue-700 space-y-2">
          <li>• Ensure good lighting on your face</li>
          <li>• Look directly at the camera</li>
          <li>• Keep your face centered in the frame</li>
          <li>• Remove sunglasses, masks, or hats</li>
          <li>• Your face must match the registered photo exactly</li>
          <li>• If face doesn't match, attendance will NOT be marked</li>
        </ul>
      </div>

      {/* No Face Registered Warning */}
      {!registeredFace && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded mt-6">
          <p className="font-bold">⚠️ Face Not Registered</p>
          <p>You need to register your face before marking attendance. Visit Register Face to set up face recognition.</p>
        </div>
      )}

      {registeredFace && !modelsReady && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded mt-6">
          <p className="font-bold">⏳ Loading face recognition models...</p>
        </div>
      )}
    </div>
  );
}
