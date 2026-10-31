import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      const currentPath = window.location.pathname;

      // Handle 401 Unauthorized - redirect only for protected routes
      if (status === 401 && !currentPath.startsWith('/activate') && !currentPath.startsWith('/student-fill-form')) {
        sessionStorage.clear();
        if (currentPath !== '/' && currentPath !== '/login') {
          window.location.href = '/login';
        }
      }

      if (status === 403) {
        console.error('Access forbidden');
      }

      if (status === 500) {
        console.error('Server error');
      }
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
