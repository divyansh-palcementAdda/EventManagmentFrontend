import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const eventsService = {
  // Get all events with pagination
  getEvents: async (page = 0, size = 10, sort = ['createdAt,desc']) => {
    try {
      const params = { page, size, sort };
      const response = await axiosInstance.get(API_ROUTES.EVENTS.LIST, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create a new event
  createEvent: async (eventData) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.EVENTS.CREATE, eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update an event
  updateEvent: async (eventId, eventData) => {
    try {
      const response = await axiosInstance.put(`/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
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
      throw error.response?.data || error;
    }
  },

  // Update event status
  updateEventStatus: async (eventId, status) => {
    try {
      const response = await axiosInstance.patch(
        API_ROUTES.EVENTS.UPDATE_STATUS.replace(':id', eventId),
        null,
        { params: { status } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete / cancel an event
  deleteEvent: async (eventId) => {
    try {
      const response = await axiosInstance.delete(
        API_ROUTES.EVENTS.DELETE.replace(':id', eventId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get sequential event days
  getEventDays: async (eventId) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.EVENTS.DAYS.replace(':id', eventId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get overall dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await axiosInstance.get(API_ROUTES.EVENTS.DASHBOARD_STATS);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Gatekeepers
  getGatekeepers: async (eventId) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.EVENTS.GATEKEEPERS.replace(':id', eventId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  assignGatekeeper: async (eventId, userId) => {
    try {
      const response = await axiosInstance.post(
        API_ROUTES.EVENTS.ASSIGN_GATEKEEPER.replace(':id', eventId),
        { userId }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  removeGatekeeper: async (eventId, userId) => {
    try {
      const response = await axiosInstance.delete(
        API_ROUTES.EVENTS.REMOVE_GATEKEEPER.replace(':id', eventId).replace(':userId', userId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default eventsService;
