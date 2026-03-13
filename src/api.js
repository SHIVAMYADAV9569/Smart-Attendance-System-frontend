import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = (error.response?.data?.message || '').toLowerCase();
    const url = error.config?.url || '';

    // Do NOT clear auth for face recognition failures (business logic, not auth failure)
    const isFaceRecognitionError = url.includes('/face/recognize') ||
      message.includes('face not matched') ||
      message.includes('face not match') ||
      message.includes('confidence score') ||
      message.includes('attendance closed');
    if (isFaceRecognitionError) {
      return Promise.reject(error);
    }

    // Only clear auth for token-invalid responses, NOT for role-based "Access denied"
    const isTokenInvalid = status === 401 || (status === 403 && message.includes('token'));
    if (isTokenInvalid) {
      console.error('❌ Authentication error - clearing invalid token');
      console.error('Error details:', error.response?.data);

      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setTimeout(() => {
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me')
};

export const faceAPI = {
  registerFace: (faceImage, faceDescriptor) =>
    api.post('/face/register-face', { faceImage, faceDescriptor }),
  recognize: (faceDescriptor) =>
    api.post('/face/recognize', { faceDescriptor }),
  getTodayAttendance: () => api.get('/face/today'),
  testMatch: (faceDescriptor) =>
    api.post('/face/debug/test-match', { faceDescriptor })
};

export const attendanceAPI = {
  getMyRecords: (params) => api.get('/attendance/my-records', { params }),
  getAllRecords: (params) => api.get('/attendance/all', { params }),
  getSummary: (params) => api.get('/attendance/summary', { params }),
  getTodayRecords: () => api.get('/attendance/today-records'),
  getStats: (userId, params) => api.get(`/attendance/stats/${userId}`, { params }),
  getMonthlyStats: (params) => api.get('/attendance/monthly-stats', { params }),
  getStudentsStatusToday: () => api.get('/attendance/students-status/today'),
  markAttendance: (studentId, status, lectureId) => 
   api.post('/attendance/mark-attendance', { studentId, status, lectureId })
};

export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getReport: (params) => api.get('/dashboard/report', { params }),
  getLiveFeed: () => api.get('/dashboard/live-feed'),
  getHeatmap: (params) => api.get('/dashboard/heatmap', { params })
};

export const lectureAPI = {
  // Lecture management
  createLecture: (data) => api.post('/lectures', data),
  getMyLectures: (params) => api.get('/lectures/my-lectures', { params }),
  getTodayLectures: () => api.get('/lectures/today'),
  getLectureById: (lectureId) => api.get(`/lectures/${lectureId}`),
  updateLecture: (lectureId, data) => api.put(`/lectures/${lectureId}`, data),
  deleteLecture: (lectureId) => api.delete(`/lectures/${lectureId}`),

  // Lecture attendance
  getLectureStudents: (lectureId) => api.get(`/lectures/${lectureId}/students`),
  markAttendance: (lectureId, data) => api.post(`/lectures/${lectureId}/attendance`, data),
  markBulkAttendance: (lectureId, data) => api.post(`/lectures/${lectureId}/attendance/bulk`, data),
  getLectureAttendanceSummary: (lectureId) => api.get(`/lectures/${lectureId}/attendance/summary`),
  getStudentLectureAttendance: (userId, params) => api.get(`/lectures/student/${userId}/attendance`, { params })
};

export default api;
