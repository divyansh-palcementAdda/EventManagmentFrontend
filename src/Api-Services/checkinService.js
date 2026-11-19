import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const checkinService = {
  // Pre-verification inspects pass eligibility, attendee details, and day validity without committing check-in
  verifyPass: async (rawToken, eventId, eventDayId = null) => {
    try {
      const payload = {
        rawToken,
        eventId,
      };
      if (eventDayId) {
        payload.eventDayId = eventDayId;
      }

      const response = await axiosInstance.post(API_ROUTES.CHECKIN.VERIFY, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Perform check-in scan for multi-day or single-day entry with optional goodies provided toggle
  scanCheckin: async (rawToken, eventId, eventDayId = null, requestId = null, goodiesProvided = false) => {
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
      if (typeof goodiesProvided === 'boolean') {
        payload.goodiesProvided = goodiesProvided;
      }

      const response = await axiosInstance.post(API_ROUTES.CHECKIN.SCAN, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Fetch check-in and goodies distribution statistics for an event
  getCheckinStats: async (eventId, eventDayId = null) => {
    try {
      const params = { eventId };
      if (eventDayId) params.eventDayId = eventDayId;
      const response = await axiosInstance.get(`${API_ROUTES.CHECKIN.SCAN}/stats`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Authorized correction of goodies status for a specific check-in record
  updateGoodiesStatus: async (checkInId, goodiesProvided) => {
    try {
      const response = await axiosInstance.patch(`${API_ROUTES.CHECKIN.SCAN}/${checkInId}/goodies`, null, {
        params: { goodiesProvided }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default checkinService;
