import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
 e.preventDefault();
 e.stopPropagation();  // Prevent any bubbling
 
 setError('');
 setLoading(true);

 console.log('🔐 Login attempt for:', email);

 try {
 const response = await login(email, password);
 console.log('✅ Login response received:', response);
   
   // Small delay to ensure state updates propagate
  await new Promise(resolve => setTimeout(resolve, 100));
   
   // Redirect based on role
 if (response.user.role === 'faculty' || response.user.role === 'admin') {
  console.log('🔄 Navigating to dashboard...');
    navigate('/dashboard', { replace: true });
  } else {
  console.log('🔄 Navigating to student-home...');
    navigate('/student-home', { replace: true });
  }
 } catch (err) {
  console.error('❌ Login error:', err);
  setError(err.response?.data?.message || 'Login failed');
 } finally {
  setLoading(false);
 }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Face Attendance
        </h1>
        <p className="text-center text-gray-600 mb-8">Smart Campus Attendance System</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600 hover:text-blue-800 font-bold">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}