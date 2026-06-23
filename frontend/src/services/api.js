import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('brushiq_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  register: (fullName, email, phone, password) => 
    api.post('/auth/register', { fullName, email, phone, password }),
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  googleLogin: (googleId, email, fullName, photoUrl) => 
    api.post('/auth/google', { googleId, email, fullName, photoUrl }),
  forgotPassword: (email, phone) => 
    api.post('/auth/forgot-password', { email, phone }),
  getMe: () => 
    api.get('/auth/me'),
};

// Family Member endpoints
export const familyService = {
  getMembers: () => 
    api.get('/family'),
  addMember: (name, age, gender, relationship, profilePhotoUrl) => 
    api.post('/family', { name, age, gender, relationship, profilePhotoUrl }),
  updateMember: (id, name, age, gender, relationship, profilePhotoUrl) => 
    api.put(`/family/${id}`, { name, age, gender, relationship, profilePhotoUrl }),
  deleteMember: (id) => 
    api.delete(`/family/${id}`),
};

// Toothbrush endpoints
export const toothbrushService = {
  getToothbrushes: (familyMemberId = null) => 
    api.get('/toothbrushes', { params: familyMemberId ? { familyMemberId } : {} }),
  addToothbrush: (familyMemberId, brand, model, color, type, purchaseDate) => 
    api.post('/toothbrushes', { familyMemberId, brand, model, color, type, purchaseDate }),
  updateToothbrush: (id, brand, model, color, type, purchaseDate) => 
    api.put(`/toothbrushes/${id}`, { brand, model, color, type, purchaseDate }),
  deleteToothbrush: (id) => 
    api.delete(`/toothbrushes/${id}`),
};

// Scan endpoints
export const scanService = {
  analyzeScan: (formData) => 
    api.post('/scans/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  saveScan: (scanData) => 
    api.post('/scans', scanData),
  getHistory: (toothbrushId) => 
    api.get('/scans', { params: { toothbrushId } }),
  getScanDetails: (id) => 
    api.get(`/scans/${id}`),
};

// Reminder endpoints
export const reminderService = {
  getReminders: (familyMemberId = null) => 
    api.get('/reminders', { params: familyMemberId ? { familyMemberId } : {} }),
  createReminder: (familyMemberId, toothbrushId, type, nextReminderDate, message) => 
    api.post('/reminders', { familyMemberId, toothbrushId, type, nextReminderDate, message }),
  completeReminder: (id) => 
    api.put(`/reminders/${id}/complete`),
};

// Tips endpoints
export const tipsService = {
  getTips: () => 
    api.get('/tips'),
  getPersonalizedTips: (familyMemberId) => 
    api.get('/tips/personalized', { params: { familyMemberId } }),
};

// Dashboard endpoints
export const dashboardService = {
  getStats: () => 
    api.get('/dashboard'),
};

export default api;
