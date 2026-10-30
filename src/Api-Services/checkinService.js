import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const checkinService = {
  // Perform check-in scan
  scanCheckin: async (rawToken, eventId, requestId) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.CHECKIN.SCAN, {
        rawToken,
        eventId,
        requestId,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get check-in details for an event
  getCheckinDetails: async (eventId) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.CHECKIN.VIEW.replace(':eventId', eventId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get check-in logs
  getCheckinLogs: async () => {
    try {
      const response = await axiosInstance.get(API_ROUTES.CHECKIN.LOGS);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default checkinService;
