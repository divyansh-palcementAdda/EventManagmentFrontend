import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const attendeesService = {
  // Get all attendees with pagination and filters
  getAttendees: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.ATTENDEES.LIST, { params });
      return response.data.data; // API returns { success, message, data: { content, page } }
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get attendee by ID
  getAttendeeById: async (id) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.ATTENDEES.VIEW.replace(':id', id)
      );
      return response.data.data; // API returns { success, message, data }
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create new attendee
  createAttendee: async (data) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.ATTENDEES.CREATE, data);
      return response.data.data; // API returns { success, message, data }
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update attendee
  updateAttendee: async (id, data) => {
    try {
      const response = await axiosInstance.put(
        API_ROUTES.ATTENDEES.UPDATE.replace(':id', id),
        data
      );
      return response.data.data; // API returns { success, message, data }
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete attendee
  deleteAttendee: async (id) => {
    try {
      const response = await axiosInstance.delete(
        API_ROUTES.ATTENDEES.DELETE.replace(':id', id)
      );
      return response.data.data; // API returns { success, message, data }
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default attendeesService;
