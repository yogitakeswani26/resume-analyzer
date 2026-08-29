import axios, { AxiosInstance, AxiosError } from 'axios';
import { APIResponse } from '../types/index.js';

// Smart API URL detection
const API_URL = (() => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL as string;
  }

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5001/api/v1';
  }

  return 'https://resume-analyzer-api-k3qm.onrender.com/api/v1';
})();

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Safe localStorage access
const safeGetToken = (): string | null => {
  try {
    return localStorage.getItem('token');
  } catch {
    console.warn('[API] Failed to access token from localStorage');
    return null;
  }
};

const safeGetRefreshToken = (): string | null => {
  try {
    return localStorage.getItem('refreshToken');
  } catch {
    console.warn('[API] Failed to access refreshToken from localStorage');
    return null;
  }
};

// Request interceptor - add token to every request
api.interceptors.request.use((config) => {
  const token = safeGetToken();

  if (token) {
    // Set Authorization header ONLY on config.headers (not on .common)
    config.headers.Authorization = `Bearer ${token}`;

    // Also set on api defaults for consistency
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  console.log(`📤 [${config.method?.toUpperCase()}] ${config.url}`, {
    hasToken: !!token,
    tokenLength: token?.length,
    auth: config.headers.Authorization ? '✅ SET' : '❌ NOT SET'
  });

  return config;
});

// Response interceptor - handle 401 and refresh token
api.interceptors.response.use(
  (response) => {
    console.log(`📥 [${response.config.method?.toUpperCase()}] ${response.config.url} → ${response.status}`);
    return response;
  },
  async (error: AxiosError) => {
    console.error(`❌ [${error.config?.method?.toUpperCase()}] ${error.config?.url} → ${error.response?.status}`, {
      message: error.message,
      hasData: !!error.response?.data
    });

    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('🔄 401 detected - attempting token refresh...');
      originalRequest._retry = true;

      try {
        const refreshToken = safeGetRefreshToken();
        if (!refreshToken) {
          console.error('❌ No refreshToken in localStorage - logout required');
          throw new Error('No refresh token available');
        }

        console.log('📤 Sending refresh request with refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

        const { accessToken } = response.data.data;
        try {
          localStorage.setItem('token', accessToken);
        } catch {
          console.warn('[API] Failed to save new token to localStorage');
        }

        // Update Zustand store
        const { useAuthStore } = await import('../stores/authStore.js');
        useAuthStore.setState({ token: accessToken });

        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        console.log('✅ Token refreshed successfully');
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed - logging out');
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        } catch {
          console.warn('[API] Failed to clear localStorage on logout');
        }

        // Update Zustand store
        const { useAuthStore } = await import('../stores/authStore.js');
        useAuthStore.setState({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false
        });

        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<APIResponse<any>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<APIResponse<any>>('/auth/login', data),

  refresh: (refreshToken: string) =>
    api.post<APIResponse<any>>('/auth/refresh', { refreshToken }),

  logout: () => api.post<APIResponse<any>>('/auth/logout'),

  me: () => api.get<APIResponse<any>>('/auth/me'),

  // Password reset endpoints
  forgotPassword: (data: { email: string }) =>
    api.post<APIResponse<any>>('/auth/forgot-password', data),

  resetPassword: (data: { token: string; password: string; confirmPassword: string }) =>
    api.post<APIResponse<any>>('/auth/reset-password', data),

  validateResetToken: (token: string) =>
    api.get<APIResponse<any>>(`/auth/validate-reset-token/${token}`),
};

export const resumeAPI = {
  upload: (data: { fileName: string; fileUrl: string; content: string }) =>
    api.post<APIResponse<any>>('/resumes/upload', data),

  uploadFile: (file: File, content?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (content) {
      formData.append('content', content);
    }
    return api.post<APIResponse<any>>('/resumes/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  list: () => api.get<APIResponse<any>>('/resumes'),

  get: (resumeId: string) =>
    api.get<APIResponse<any>>(`/resumes/${resumeId}`),

  delete: (resumeId: string) =>
    api.delete<APIResponse<any>>(`/resumes/${resumeId}`),
};

export const analysisAPI = {
  analyze: (data: { resumeId: string; jobDescription: string }) =>
    api.post<APIResponse<any>>('/analysis/analyze', data),

  list: () => api.get<APIResponse<any>>('/analysis'),

  get: (analysisId: string) =>
    api.get<APIResponse<any>>(`/analysis/${analysisId}`),

  getHealth: (resumeId: string) =>
    api.post<APIResponse<any>>(`/analysis/health/${resumeId}`),

  analyzeWithAI: (resumeId: string) =>
    api.post<APIResponse<any>>(`/analysis/ai/${resumeId}`),

  generateEnhanced: (resumeId: string) =>
    api.post<APIResponse<any>>(`/analysis/enhance/${resumeId}`),

  getRecommendations: (resumeId: string) =>
    api.post<APIResponse<any>>(`/analysis/recommendations/${resumeId}`),

  getSectionAnalysis: (resumeId: string) =>
    api.post<APIResponse<any>>(`/analysis/sections/${resumeId}`),
};

export const recruiterAPI = {
  getCandidates: (filters: any = {}) =>
    api.get<APIResponse<any>>('/recruiter/candidates', { params: filters }),

  compareResumes: (resumeIds: string[]) =>
    api.post<APIResponse<any>>('/recruiter/compare', { resumeIds }),

  matchJobDescription: (jobDescription: string) =>
    api.post<APIResponse<any>>('/recruiter/match-job', { jobDescription }),

  updateCandidateInfo: (resumeId: string, data: any) =>
    api.patch<APIResponse<any>>(`/recruiter/candidate/${resumeId}`, data),

  getAnalytics: (filters: any = {}) =>
    api.get<APIResponse<any>>('/recruiter/analytics', { params: filters }),

  getCandidatePipeline: () =>
    api.get<APIResponse<any>>('/recruiter/pipeline'),

  moveCandidateStatus: (resumeId: string, newStatus: string) =>
    api.post<APIResponse<any>>(`/recruiter/pipeline/${resumeId}/move`, { newStatus }),

  // Bulk actions
  bulkUpdateStatus: (resumeIds: string[], status: string) =>
    api.put<APIResponse<any>>('/recruiter/bulk/status', { resumeIds, status }),

  bulkAddNotes: (resumeIds: string[], notes: string) =>
    api.put<APIResponse<any>>('/recruiter/bulk/notes', { resumeIds, notes }),

  bulkSendEmail: (resumeIds: string[], subject: string, message: string) =>
    api.post<APIResponse<any>>('/recruiter/bulk/email', { resumeIds, subject, message }),

  // Get candidate details with notes
  getCandidateDetails: (resumeId: string) =>
    api.get<APIResponse<any>>(`/recruiter/candidate/${resumeId}/details`),

  // Add note to candidate
  addNote: (resumeId: string, note: string) =>
    api.post<APIResponse<any>>(`/recruiter/note/${resumeId}/add`, { note }),

  // Get notes for a candidate
  getNotes: (resumeId: string) =>
    api.get<APIResponse<any>>(`/recruiter/notes/${resumeId}`),
};

export const userAPI = {
  updateProfile: (userId: string, data: any) =>
    api.patch<APIResponse<any>>(`/users/${userId}`, data),

  changePassword: (userId: string, data: { currentPassword: string; newPassword: string }) =>
    api.post<APIResponse<any>>(`/users/${userId}/change-password`, data),

  deleteAccount: (userId: string, data: { password: string }) =>
    api.delete<APIResponse<any>>(`/users/${userId}`, { data }),
};

export default api;
