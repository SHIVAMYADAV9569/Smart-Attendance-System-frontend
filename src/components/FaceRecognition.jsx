import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { faceAPI } from '../api';
import { loadFaceModels, getFaceDescriptor } from '../utils/faceRecognition';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function FaceRecognition() {
  const webcamRef = useRef(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [result, setResult] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showTestMode, setShowTestMode] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadFaceModels().then(() => setModelsReady(true)).catch(console.error);
  }, []);
  useEffect(() => {
    checkTodayAttendance();
  }, []);

  const checkTodayAttendance = async () => {
    try {
      setCheckingStatus(true);
      const response = await faceAPI.getTodayAttendance();
      setTodayAttendance(response.data);
    } catch (err) {
      console.log('No attendance marked yet');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleRecognize = useCallback(async () => {
    if (todayAttendance?.status && todayAttendance.status !== 'absent') {
      setSuccess('Already face match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setError('Failed to capture image. Please try again.');
        return;
      }
      if (!modelsReady) {
        setError('Face recognition models are loading. Please wait...');
        setLoading(false);
        return;
      }

      const faceDescriptor = await getFaceDescriptor(imageSrc);
      if (!faceDescriptor) {
        setError('No face detected in image. Ensure your face is clearly visible.');
        setLoading(false);
        return;
      }

      const response = await faceAPI.recognize(faceDescriptor);
      
      setSuccess(response.data.message);
      setResult({
        time: response.data.time,
        date: response.data.date,
        status: response.data.status,
        confidence: (response.data.confidence * 100).toFixed(2),
        checkInTime: response.data.checkInTime,
        checkOutTime: response.data.checkOutTime
      });

      // Refresh attendance status
      setTimeout(() => {
        checkTodayAttendance();
      }, 1000);

      // Clear message after 6 seconds
      setTimeout(() => {
        setSuccess('');
        setResult(null);
      }, 6000);
    } catch (err) {
      // Handle different error types
      if (err.response?.status === 401) {
        const confidenceScore = err.response?.data?.confidence ? 
          (err.response.data.confidence * 100).toFixed(2) : 'N/A';
        
        let errorMsg = `Face matching confidence: ${confidenceScore}%\n\n`;
        errorMsg += `${err.response?.data?.message || 'Confidence score too low for recognition'}\n\n`;
        errorMsg += `Suggested actions:\n`;
        errorMsg += `• Ensure good lighting (natural light is best)\n`;
        errorMsg += `• Position your face directly facing camera\n`;
        errorMsg += `• Keep your face centered\n`;
        errorMsg += `• Try to match the conditions from face registration\n`;
        errorMsg += `• Remove glasses/hats if you wore them during registration`;
        
        setError(errorMsg);
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Please register your face first');
      } else if (err.response?.status === 404) {
        setError('User not found. Please login again.');
      } else {
        setError(err.response?.data?.message || 'Face recognition failed. Please try again');
      }
      console.error('Recognition error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  }, [todayAttendance]);

  const handleTestMatch = useCallback(async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setTestResult({
          error: 'Failed to capture image'
        });
        return;
      }

      const response = await faceAPI.testMatch(imageSrc);
      setTestResult(response.data);
    } catch (err) {
      setTestResult({
        error: err.response?.data?.message || 'Test failed'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-400';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      case 'absent': return 'bg-red-100 text-red-800 border-red-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">📸 Mark Attendance</h2>
      <p className="text-gray-600 mb-6">Use face recognition to mark your attendance</p>

      {/* Status Box */}
      {!checkingStatus && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${
          todayAttendance?.status && todayAttendance.status !== 'absent'
            ? 'bg-green-50 border-green-400'
            : 'bg-blue-50 border-blue-400'
        }`}>
          {todayAttendance?.status && todayAttendance.status !== 'absent' ? (
            <div>
              <p className="text-green-800 font-bold">✅ Attendance Already Marked</p>
              <p className="text-green-700 text-sm mt-1">
                Status: <span className="font-semibold">{todayAttendance.status.toUpperCase()}</span>
              </p>
              {todayAttendance.checkInTime && (
                <p className="text-green-700 text-sm">
                  Check In: {new Date(todayAttendance.checkInTime).toLocaleTimeString()}
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-blue-800 font-bold">ℹ️ Ready to Mark Attendance</p>
              <p className="text-blue-700 text-sm mt-1">Position your face clearly and click the button below</p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-bold text-lg mb-2">⚠️ Face Recognition Failed</p>
            <p className="whitespace-pre-line text-sm mb-3">{error}</p>
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
              💡 Tip: Make sure you registered your face in good lighting and from a similar angle.
            </p>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg">
            <p className="font-bold">✅ Success</p>
            <p>{success}</p>
          </div>
        )}

        {/* Webcam Feed */}
        <div className="border-4 border-dashed border-purple-300 rounded-lg overflow-hidden bg-black">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={500}
            height={400}
            className="w-full"
            videoConstraints={{
              width: 500,
              height: 400,
              facingMode: 'user'
            }}
          />
        </div>

        {/* Result Box */}
        {result && (
          <div className={`border-2 rounded-lg p-4 ${getStatusColor(result.status)}`}>
            <h3 className="font-bold mb-2">Recognition Result</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="opacity-75">Status</p>
                <p className="font-bold text-lg">{result.status.toUpperCase()}</p>
              </div>
              <div>
                <p className="opacity-75">Confidence</p>
                <p className="font-bold text-lg">{result.confidence}%</p>
              </div>
              <div>
                <p className="opacity-75">Time</p>
                <p className="font-semibold">{result.time}</p>
              </div>
              <div>
                <p className="opacity-75">Date</p>
                <p className="font-semibold">{result.date}</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Result Box */}
        {testResult && (
          <div className={`border-2 rounded-lg p-4 ${
            testResult.error 
              ? 'bg-red-50 border-red-400' 
              : testResult.needsImprovement 
              ? 'bg-yellow-50 border-yellow-400'
              : 'bg-green-50 border-green-400'
          }`}>
            <p className="font-bold mb-2">
              {testResult.error 
                ? '❌ Test Failed' 
                : testResult.needsImprovement
                ? '⚠️ Face Quality Check'
                : '✅ Face Match Good'
              }
            </p>
            {testResult.error ? (
              <p className="text-sm">{testResult.error}</p>
            ) : (
              <>
                <p className="text-sm mb-2">
                  Confidence: <span className="font-bold">{testResult.confidencePercentage}%</span> 
                  {' '} (Threshold: {(testResult.threshold * 100).toFixed(0)}%)
                </p>
                {testResult.tips && testResult.tips.length > 0 && (
                  <div className="text-sm mt-2">
                    <p className="font-semibold mb-1">Suggestions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {testResult.tips.map((tip, idx) => (
                        <li key={idx} className="text-xs">{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleTestMatch}
            disabled={loading || showTestMode}
            className={`font-bold py-3 px-4 rounded-lg transition ${
              loading || showTestMode
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {loading ? '⏳ Testing...' : '🔍 Test Match'}
          </button>

          <button
            onClick={handleRecognize}
            disabled={loading || (todayAttendance?.status && todayAttendance.status !== 'absent')}
            className={`font-bold py-3 px-4 rounded-lg transition ${
              loading || (todayAttendance?.status && todayAttendance.status !== 'absent')
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
            }`}
          >
            {loading ? (
              <>⏳ Processing...</>
            ) : (
              <>✓ Mark Attendance</>
            )}
          </button>
        </div>

        {/* Register Face Reminder */}
        <p className="text-center text-sm text-gray-600">
          Don't have your face registered yet?{' '}
          <button
            onClick={() => navigate('/register-face')}
            className="text-blue-600 hover:text-blue-800 font-bold underline"
          >
            Register Face
          </button>
        </p>
      </div>
    </div>
  );
}
