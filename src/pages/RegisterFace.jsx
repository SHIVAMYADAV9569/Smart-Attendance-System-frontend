import React, { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { faceAPI } from '../api';
import { useAuth } from '../context/AuthContext';

export default function RegisterFace() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setError('');
    } else {
      setError('Failed to capture image. Please try again.');
    }
  }, []);

  const handleRegisterFace = async () => {
    if (!capturedImage) {
      setError('Please capture a face image first');
      return;
    }

    setLoading(true);
    try {
      await faceAPI.registerFace(capturedImage);
      setSuccess('✅ Face registered successfully! Redirecting to your records...');
      setTimeout(() => {
        navigate('/my-record');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register face. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError('');
  };

  const handleSkip = () => {
    navigate('/my-record');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📸 Register Your Face</h1>
          <p className="text-gray-600 text-lg">
            Capture a clear photo of your face for attendance recognition
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-bold">❌ Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-bold text-lg">✅ Success</p>
            <p>{success}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
          <h3 className="font-bold text-blue-900 mb-2">📋 Instructions for Best Results:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>✓ Ensure good lighting - face should be well lit</li>
            <li>✓ Look directly at the camera</li>
            <li>✓ Keep your face centered in the frame</li>
            <li>✓ Avoid wearing sunglasses or hats</li>
            <li>✓ Clear facial expressions (neutral or slight smile)</li>
          </ul>
        </div>

        {!capturedImage ? (
          <>
            {/* Webcam Feed */}
            <div className="mb-6">
              <div className="border-4 border-dashed border-purple-400 rounded-lg overflow-hidden bg-black relative">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={400}
                  height={300}
                  className="w-full"
                  videoConstraints={{
                    width: 400,
                    height: 300,
                    facingMode: 'user'
                  }}
                />
                {/* Center Guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-green-400 rounded-full w-32 h-40 opacity-50"></div>
                </div>
              </div>
              <p className="text-center text-gray-600 text-sm mt-2">Position your face in the center area</p>
            </div>

            {/* Capture Button */}
            <button
              onClick={capture}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-4 rounded-lg transition text-lg mb-4"
            >
              📷 Capture Photo
            </button>

            <p className="text-center text-gray-600 text-sm">
              Already have your face registered?{' '}
              <button
                onClick={() => navigate('/my-record')}
                className="text-blue-600 hover:text-blue-800 font-bold underline"
              >
                View My Records
              </button>
            </p>
          </>
        ) : (
          <>
            {/* Captured Image */}
            <div className="mb-6">
              <p className="text-center text-gray-600 font-semibold mb-2">Preview</p>
              <div className="border-4 border-purple-400 rounded-lg overflow-hidden bg-gray-100">
                <img src={capturedImage} alt="Captured Face" className="w-full" />
              </div>
            </div>

            {/* Quality Check */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded">
              <p className="text-yellow-900 font-semibold mb-2">🔍 Quality Check:</p>
              <p className="text-yellow-800 text-sm">
                Make sure the photo shows your face clearly. If you're not satisfied, retake the photo.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleRetake}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                🔄 Retake Photo
              </button>
              <button
                onClick={handleRegisterFace}
                disabled={loading}
                className={`font-bold py-3 px-4 rounded-lg transition text-white ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                }`}
              >
                {loading ? '⏳ Registering...' : '✅ Register Face'}
              </button>
            </div>

            <button
              onClick={handleSkip}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 font-semibold py-2"
            >
              Skip For Now
            </button>
          </>
        )}

        {/* User Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Registering as: <span className="font-bold">{user?.name || 'User'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
