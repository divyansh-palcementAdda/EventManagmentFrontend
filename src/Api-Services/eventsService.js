import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const eventsService = {
  // Get all events with pagination
  getEvents: async (page = 0, size = 10, sort = ['createdAt,desc']) => {
    try {
      const params = {
        page,
        size,
        sort,
      };
      const response = await axiosInstance.get(API_ROUTES.EVENTS.LIST, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create a new event
  createEvent: async (eventData) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.EVENTS.CREATE, eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update an event
  updateEvent: async (eventId, eventData) => {
    try {
      const response = await axiosInstance.put(
        API_ROUTES.EVENTS.UPDATE.replace(':id', eventId),
        eventData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete an event
  deleteEvent: async (eventId) => {
    try {
      const response = await axiosInstance.delete(
        API_ROUTES.EVENTS.DELETE.replace(':id', eventId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get event by ID
  getEventById: async (eventId) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.EVENTS.VIEW.replace(':id', eventId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cancel an event
  cancelEvent: async (eventId) => {
    try {
      const response = await axiosInstance.post(
        API_ROUTES.EVENTS.CANCEL.replace(':id', eventId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default eventsService;
