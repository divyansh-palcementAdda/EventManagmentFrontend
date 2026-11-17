import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const passAllotmentService = {
  // Get all allotments summary for an event grouped by recipient
  getAllotmentsSummary: async (eventId) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.ALLOTMENTS.SUMMARY(eventId));
      return response.data?.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get sequences for a specific category
  getSequencesForCategory: async (eventId, categoryCode) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.ALLOTMENTS.SEQUENCES(eventId), {
        params: { categoryCode },
      });
      return response.data?.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get summary of passes in a specific sequence range
  getSequenceSummary: async (eventId, categoryCode, fromSequence, toSequence) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.ALLOTMENTS.SEQUENCE_SUMMARY(eventId), {
        params: { categoryCode, fromSequence, toSequence },
      });
      return response.data?.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create a new pass allotment
  createAllotment: async (eventId, payload) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.ALLOTMENTS.CREATE(eventId), payload);
      return response.data?.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get category analytics with filter, search, and pagination
  getCategoryAnalytics: async (eventId, params = {}) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.ALLOTMENTS.ANALYTICS(eventId), {
        params,
      });
      return response.data?.data !== undefined ? response.data.data : response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default passAllotmentService;
