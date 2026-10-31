import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers = [];

// Function to add subscribers waiting for token refresh
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Function to notify all subscribers that token is refreshed
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Refresh token API call
const refreshToken = async () => {
  const refreshTokenValue = sessionStorage.getItem('refreshToken');
  if (!refreshTokenValue) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/auth/refresh`,
    { refreshToken: refreshTokenValue },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};

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

// Response interceptor to handle errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const { status } = error.response;
      const currentPath = window.location.pathname;

      // Handle 401 Unauthorized - try to refresh token
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Skip refresh for public routes
        if (currentPath.startsWith('/activate') || currentPath.startsWith('/student-fill-form')) {
          sessionStorage.clear();
          if (currentPath !== '/' && currentPath !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        if (isRefreshing) {
          // If already refreshing, wait for the new token
          return new Promise((resolve) => {
            subscribeTokenRefresh((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosInstance(originalRequest));
            });
          });
        }

        isRefreshing = true;

        try {
          const data = await refreshToken();

          // Store new tokens
          sessionStorage.setItem('accessToken', data.data.accessToken);
          sessionStorage.setItem('refreshToken', data.data.refreshToken);

          // Update header with new token
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;

          // Notify all waiting requests
          onTokenRefreshed(data.data.accessToken);

          isRefreshing = false;

          // Retry the original request
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];

          // If refresh fails, clear session and redirect to login
          sessionStorage.clear();
          if (currentPath !== '/' && currentPath !== '/login') {
            window.location.href = '/login';
          }

          return Promise.reject(refreshError);
        }
      }

      // Handle 401 without retry (already tried or no refresh token)
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
