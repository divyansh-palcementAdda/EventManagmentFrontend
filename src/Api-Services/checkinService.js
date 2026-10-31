import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const checkinService = {
  // Perform check-in scan for multi-day or single-day entry
  scanCheckin: async (rawToken, eventId, eventDayId = null, requestId = null) => {
    try {
      const payload = {
        rawToken,
        eventId,
      };
      if (eventDayId) {
        payload.eventDayId = eventDayId;
      }
      if (requestId) {
        payload.requestId = requestId;
      }

      const response = await axiosInstance.post(API_ROUTES.CHECKIN.SCAN, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default checkinService;
