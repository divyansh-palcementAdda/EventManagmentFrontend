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

  // Logout user
  logout: () => {
    sessionStorage.clear();
    window.location.href = '/login';
  },

  // Get current token
  getToken: () => {
    return sessionStorage.getItem('accessToken');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = sessionStorage.getItem('accessToken');
    return !!token;
  },

  // Register user (if endpoint exists)
  register: async (userData) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.AUTH.REGISTER, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await axiosInstance.get(API_ROUTES.AUTH.PROFILE);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default authService;
