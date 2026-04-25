import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { authAPI, faceAPI } from '../api';
import { loadFaceModels, getFaceDescriptor } from '../utils/faceRecognition';

export default function StudentRegistration() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Face Capture, 3: Review
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    course: '',
    department: ''
  });
  
  // Face capture
  const [capturedFace, setCapturedFace] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  
  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.rollNumber || !formData.course) {
      setError('Please fill in all required fields');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        setShowCamera(true);
      }
    }
  };

  const captureFace = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedFace(imageSrc);
      setShowCamera(false);
      setError('');
    } else {
      setError('Failed to capture image. Please try again.');
    }
  }, []);

  const retakePhoto = () => {
    setCapturedFace(null);
    setShowCamera(true);
  };

  useEffect(() => {
    if (currentStep >= 2) {
      loadFaceModels().then(() => setModelsReady(true)).catch(console.error);
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    if (!capturedFace) {
      setError('Please capture your face photo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Register user
      const registerData = {
        ...formData,
        role: 'student'
      };
      
      const registerResponse = await authAPI.register(registerData);
      const token = registerResponse.data.token;
      localStorage.setItem('token', token);

      // Step 2: Get face descriptor and register face
      if (!modelsReady) {
        await loadFaceModels();
      }
      const faceDescriptor = await getFaceDescriptor(capturedFace);
      if (!faceDescriptor) {
        throw new Error('Registration failed. No face detected in photo. Please ensure your face is clearly visible and try again.');
      }

      await faceAPI.registerFace(capturedFace, faceDescriptor);

      // Fetch updated user data from server
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      let userWithFace;
      if (response.ok) {
        userWithFace = await response.json();
      } else {
        // Fallback to registration response
        userWithFace = {
          ...registerResponse.data.user,
          faceData: capturedFace,
          hasFaceData: true
        };
      }
      
      localStorage.setItem('user', JSON.stringify(userWithFace));
      
      setSuccess('Registration successful! You can now mark your attendance.');
      
      // Set registered user and show mark attendance option
      setRegisteredUser(registerResponse.data.user);
      setShowMarkAttendance(true);
      setCurrentStep(4); // New step for attendance
      
    } catch (err) {
      console.error('Registration error:', err);
      
      // Check for face already registered error
      if (err.response?.status === 409 || err.response?.data?.code === 'FACE_ALREADY_REGISTERED') {
        setError('Face already registered. This face is already associated with another account.');
      } else if (err.message && err.message.includes('No face detected')) {
        setError(err.message);
      } else {
        setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎓 Student Registration</h1>
          <p className="text-blue-100">Smart Attendance System with Face Recognition</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium hidden sm:block">Student Details</span>
            </div>
            <div className={`w-16 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium hidden sm:block">Face Capture</span>
            </div>
            <div className={`w-16 h-1 mx-4 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 font-medium hidden sm:block">Review & Submit</span>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6">
            <p className="font-bold">Success!</p>
            <p>{success}</p>
          </div>
        )}

        {/* Step 1: Student Details */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Student Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min 6 characters"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Roll Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter roll number"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Course</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="BCA">BCA</option>
                  <option value="MCA">MCA</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="M.Sc">M.Sc</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Computer Science"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleNextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
              >
                Next: Capture Face →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Face Capture */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">📸 Face Registration</h2>
            <p className="text-gray-600 mb-6">Capture a clear photo of your face for attendance recognition</p>

            {!capturedFace ? (
              <>
                {/* Instructions */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                  <h3 className="font-bold text-blue-900 mb-2">📋 Instructions:</h3>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>✓ Ensure good lighting - face should be well lit</li>
                    <li>✓ Look directly at the camera</li>
                    <li>✓ Keep your face centered in the frame</li>
                    <li>✓ Avoid wearing sunglasses or hats</li>
                    <li>✓ Maintain neutral expression</li>
                  </ul>
                </div>

                {/* Camera */}
                {showCamera && (
                  <div className="mb-6">
                    <div className="border-4 border-dashed border-blue-400 rounded-lg overflow-hidden bg-black relative max-w-md mx-auto">
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
                      {/* Face Guide */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="border-2 border-green-400 rounded-full w-32 h-40 opacity-50"></div>
                      </div>
                    </div>
                    <p className="text-center text-gray-600 text-sm mt-2">Position your face in the center</p>
                  </div>
                )}

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={captureFace}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
                  >
                    📷 Capture Photo
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Preview */}
                <div className="mb-6">
                  <p className="text-center text-gray-600 font-semibold mb-2">Preview</p>
                  <div className="border-4 border-green-400 rounded-lg overflow-hidden max-w-md mx-auto">
                    <img src={capturedFace} alt="Captured Face" className="w-full" />
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded">
                  <p className="text-yellow-900 font-semibold">🔍 Quality Check:</p>
                  <p className="text-yellow-800 text-sm">Make sure the photo shows your face clearly.</p>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={retakePhoto}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    🔄 Retake
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition"
                  >
                    Next: Review →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">✅ Review & Confirm</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Student Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Student Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-semibold">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Roll Number:</span>
                    <span className="font-semibold">{formData.rollNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Course:</span>
                    <span className="font-semibold">{formData.course}</span>
                  </div>
                  {formData.department && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-semibold">{formData.department}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Registered Face */}
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Registered Face</h3>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                  <img src={capturedFace} alt="Registered Face" className="w-full" />
                </div>
                <p className="text-green-600 text-sm mt-2 text-center">✅ Face captured successfully</p>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition"
                disabled={loading}
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`font-bold py-3 px-8 rounded-lg transition ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {loading ? '⏳ Registering...' : '✅ Complete Registration'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Mark Attendance (No Login Required) */}
        {currentStep === 4 && showMarkAttendance && registeredUser && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-4">
                ✅
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Registration Complete!</h2>
              <p className="text-gray-600">Welcome, {registeredUser.name}. You are now logged in.</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4">Your Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-600">Name:</span> <span className="font-semibold">{registeredUser.name}</span></div>
                <div><span className="text-gray-600">Email:</span> <span className="font-semibold">{registeredUser.email}</span></div>
                <div><span className="text-gray-600">Course:</span> <span className="font-semibold">{formData.course}</span></div>
                <div><span className="text-gray-600">Department:</span> <span className="font-semibold">{formData.department || 'N/A'}</span></div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-4">You can now mark your attendance using face recognition</p>
              <button
                onClick={() => navigate('/student-dashboard')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-12 rounded-xl transition text-lg shadow-lg"
              >
                📸 Mark Attendance
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Or <button onClick={() => navigate('/my-record')} className="text-blue-600 hover:underline">view your records</button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
