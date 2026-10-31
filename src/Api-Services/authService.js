import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const authService = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.AUTH.LOGIN, {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Refresh access token
  refreshToken: async (token) => {
    try {
      const refreshTokenValue = token || sessionStorage.getItem('refreshToken');
      const response = await axiosInstance.post(API_ROUTES.AUTH.REFRESH_TOKEN, {
        refreshToken: refreshTokenValue,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const refreshToken = sessionStorage.getItem('refreshToken');
      if (refreshToken) {
        await axiosInstance.post(API_ROUTES.AUTH.LOGOUT, { refreshToken }).catch(() => {});
      }
    } finally {
      sessionStorage.clear();
      window.location.href = '/login';
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.AUTH.CHANGE_PASSWORD, passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get current user profile (/auth/me)
  getProfile: async () => {
    try {
      const response = await axiosInstance.get(API_ROUTES.AUTH.ME);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get current access token
  getToken: () => {
    return sessionStorage.getItem('accessToken');
  },

  // Get current refresh token
  getRefreshToken: () => {
    return sessionStorage.getItem('refreshToken');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = sessionStorage.getItem('accessToken');
    return !!token;
  },
};

export default authService;
