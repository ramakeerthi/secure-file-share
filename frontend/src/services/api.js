import axios from 'axios';

const API_URL = 'https://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// The CSRF token will be automatically handled by Django's CSRF middleware
// No need to manually set it in headers

export const register = async (userData) => {
  const response = await api.post('/accounts/register/', userData);
  return response.data;
};

export const login = async (credentials) => {
  try {
    const response = await api.post('/accounts/login/', credentials);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await api.post('/accounts/logout/');
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const refreshToken = async (refresh_token) => {
  const response = await api.post('/accounts/token/refresh/', { refresh: refresh_token });
  return response.data;
};

export const setupMFA = async () => {
  const response = await api.get('/accounts/mfa/setup/');
  return response.data;
};

export const verifyMFA = async (code) => {
  const response = await api.post('/accounts/mfa/setup/', { totp_code: code });
  return response.data;
};

export const loginWithMFA = async (credentials) => {
  const response = await api.post('/accounts/login/', credentials);
  return response.data;
};

export const checkAuth = async () => {
  try {
    const response = await api.get('/accounts/check-auth/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUsers = async () => {
  const response = await api.get('/accounts/users/');
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.put('/accounts/users/', { id: userId, role });
  return response.data;
};

export const getFiles = async () => {
  const response = await api.get('/files/');
  return response.data;
};

export const uploadFile = async (formData) => {
  const response = await api.post('/files/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const downloadFile = async (fileId) => {
  const response = await api.get(`/files/${fileId}/download/`, {
    responseType: 'blob',
  });
  return response;
};

// Add an interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only try to refresh if it's a 401 error, not a login request, and hasn't been retried
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url.includes('/login/') &&
      !originalRequest.url.includes('/check-auth/')
    ) {
      originalRequest._retry = true;

      try {
        await api.post('/token/refresh/');
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, let the error propagate
        throw refreshError;
      }
    }

    throw error;
  }
);

export default api; 