import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const whatsappService = {
  // Get master settings, independent feature toggles, and template mappings
  getSettings: async () => {
    try {
      const response = await axiosInstance.get(API_ROUTES.WHATSAPP.SETTINGS);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update master settings and independent feature toggles
  updateSettings: async (settingsData) => {
    try {
      const response = await axiosInstance.put(API_ROUTES.WHATSAPP.UPDATE_SETTINGS, settingsData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Test Botsense API connection & retrieve connected WhatsApp numbers
  testConnection: async () => {
    try {
      const response = await axiosInstance.post(API_ROUTES.WHATSAPP.TEST_CONNECTION);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Retrieve approved templates from Botsense for admin mapping
  getTemplates: async () => {
    try {
      const response = await axiosInstance.get(API_ROUTES.WHATSAPP.TEMPLATES);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // List and filter outbound WhatsApp message logs
  getLogs: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.WHATSAPP.LOGS, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Public OTP status check for event
  getOtpStatus: async (eventId = null) => {
    try {
      const params = eventId ? { eventId } : {};
      const response = await axiosInstance.get(API_ROUTES.WHATSAPP.OTP_STATUS, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Public send OTP to attendee's WhatsApp number
  sendOtp: async (data) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.WHATSAPP.OTP_SEND, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Public verify OTP and retrieve verificationToken
  verifyOtp: async (data) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.WHATSAPP.OTP_VERIFY, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default whatsappService;
