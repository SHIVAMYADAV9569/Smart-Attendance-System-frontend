import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth= () => useContext(AuthContext);

export const AuthProvider= ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
    
  console.log('🔍 Auth init - Token exists:', !!storedToken, 'User exists:', !!storedUser);
    
  if (storedToken && storedUser) {
      // Check if token is expired
    try {
      const decoded = jwtDecode(storedToken);
      const currentTime = Date.now() / 1000;
        
      console.log('🔐 Token decoded, exp:', decoded.exp ? new Date(decoded.exp * 1000).toLocaleString() : 'no exp');
      console.log('⏰ Current time:', new Date(currentTime * 1000).toLocaleString());
        
      if (decoded.exp && decoded.exp < currentTime) {
        console.log('❌ Token expired - clearing');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
          setLoading(false);
        return;
        }
        
        // Token is valid
      console.log('✅ Token valid, setting user');
        setToken(storedToken);
      try {
          setUser(JSON.parse(storedUser));
        console.log('✅ User loaded:', JSON.parse(storedUser).email);
        } catch (parseError) {
       console.error('❌ Failed to parse user data:', parseError.message);
       localStorage.removeItem('user');
        }
      } catch (decodeError) {
     console.error('❌ Failed to decode token:', decodeError.message);
       // Don't clear on decode error - might be transient
      }
      setLoading(false);
    } else {
    console.log('ℹ️ No stored credentials');
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
  try {
   const response = await authAPI.login({ email, password });
   const userData = response.data.user;
   const token = response.data.token;
     
  console.log('✅ Login successful, saving credentials...');
     
     // Save to state FIRST
     setToken(token);
     setUser(userData);
     
     // Then save to localStorage
   localStorage.setItem('token', token);
   localStorage.setItem('user', JSON.stringify(userData));
     
  console.log('✅ Credentials saved to state and localStorage');
  console.log('👤 User:', userData.email, 'Role:', userData.role);
     
   return response.data;
   } catch (error) {
  console.error('❌ Login failed:', error.message);
     throw error;
   }
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    setToken(response.data.token);
    setUser(response.data.user);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
