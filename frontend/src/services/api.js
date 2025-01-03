import axios from 'axios';
import { decryptFile } from '../utils/encryption';

const API_URL = process.env.REACT_APP_API_URL || 'https://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to handle authentication
api.interceptors.request.use(
  (config) => {
    // Get CSRF token from cookie if it exists
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];

    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// The CSRF token will be automatically handled by Django's CSRF middleware
// No need to manually set it in headers

export const register = async (userData) => {
  try {
    const response = await api.post('/accounts/register/', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    const response = await api.post('/accounts/login/', credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await api.post('/accounts/logout/');
    return response.data;
  } catch (error) {
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
  try {
    const response = await api.post('/files/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const downloadFile = async (fileId) => {
  try {
    const response = await api.get(`/files/${fileId}/download/`, {
      responseType: 'blob',
      headers: {
        'Accept': '*/*'
      },
      withCredentials: true
    });
    
    // Extract headers (case-insensitive with Axios)
    const headers = response.headers;
    const contentType = headers['x-original-content-type'] || 'application/octet-stream';
    const contentDisposition = headers['content-disposition'];
    const encryptionKey = headers['x-encryption-key'];
    const encryptionIv = headers['x-encryption-iv'];


    let filename = 'downloaded_file';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    let fileData = response.data;
    
    // Handle client-side decryption if needed
    if (encryptionKey && encryptionIv) {
      try {
        const decryptedBlob = await decryptFile(fileData, encryptionKey, encryptionIv);
        fileData = decryptedBlob;
      } catch (decryptError) {
        throw new Error('Failed to decrypt file');
      }
    }

    // Create final blob with correct content type
    const finalBlob = new Blob([fileData], { type: contentType });
    
    // Create and trigger download
    const url = window.URL.createObjectURL(finalBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);

  } catch (error) {
    throw error;
  }
};

export const deleteFile = async (fileId) => {
  try {
    await api.delete(`/files/${fileId}/`);
  } catch (error) {
    // Check if it's a 500 error due to file being locked
    if (error.response?.status === 500) {
      throw new Error('File is currently in use. Please try again in a moment.');
    }
    throw new Error('Failed to delete file');
  }
};

export const getSharedFiles = async () => {
  const response = await api.get('/files/shared/');
  return response.data;
};

export const shareFile = async (fileId, email, permission) => {
  try {
    const response = await api.post(`/files/${fileId}/share/`, {
      email,
      permission
    });
    return response.data;
  } catch (error) {
    throw error;
  }
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

export const createShareableLink = async (fileId, hours) => {
  try {
    const response = await api.post(`/files/share-link/${fileId}/`, { hours });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api; 