import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const attendeeService = {
  // Get paginated attendees with rich filters
  getAttendees: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.ATTENDEES.LIST, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get attendee by ID
  getAttendeeById: async (id) => {
    try {
      const url = API_ROUTES.ATTENDEES.VIEW.replace(':id', id);
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create attendee
  createAttendee: async (attendeeData) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.ATTENDEES.CREATE, attendeeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update attendee
  updateAttendee: async (id, attendeeData) => {
    try {
      const url = API_ROUTES.ATTENDEES.UPDATE.replace(':id', id);
      const response = await axiosInstance.put(url, attendeeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete attendee
  deleteAttendee: async (id) => {
    try {
      const url = API_ROUTES.ATTENDEES.DELETE.replace(':id', id);
      const response = await axiosInstance.delete(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get attendee statistics (total, confirmed, cancelled, checked-in, passes)
  getStats: async (eventId) => {
    try {
      const params = eventId ? { eventId } : {};
      const response = await axiosInstance.get(API_ROUTES.ATTENDEES.STATS, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Export attendees as CSV/Excel or JSON
  exportAttendees: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.ATTENDEES.EXPORT, {
        params,
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default attendeeService;

