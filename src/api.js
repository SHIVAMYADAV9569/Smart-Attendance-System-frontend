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

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me')
};

export const faceAPI = {
  registerFace: (faceImage) => api.post('/face/register-face', { faceImage }),
  recognize: (faceImage) => api.post('/face/recognize', { faceImage }),
  getTodayAttendance: () => api.get('/face/today'),
  testMatch: (faceImage) => api.post('/face/debug/test-match', { faceImage })
};

export const attendanceAPI = {
  getMyRecords: (params) => api.get('/attendance/my-records', { params }),
  getAllRecords: (params) => api.get('/attendance/all', { params }),
  getSummary: (params) => api.get('/attendance/summary', { params }),
  getTodayRecords: () => api.get('/attendance/today-records'),
  getStats: (userId, params) => api.get(`/attendance/stats/${userId}`, { params }),
  getMonthlyStats: (params) => api.get('/attendance/monthly-stats', { params }),
  getStudentsStatusToday: () => api.get('/attendance/students-status/today')
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
