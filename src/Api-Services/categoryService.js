import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const categoryService = {
  // Global & Event-Specific Categories
  getCategories: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.PASS_CATEGORIES.LIST, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getCategoryById: async (id) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.PASS_CATEGORIES.VIEW.replace(':id', id));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createCategory: async (data) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.PASS_CATEGORIES.CREATE, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateCategory: async (id, data) => {
    try {
      const response = await axiosInstance.put(API_ROUTES.PASS_CATEGORIES.UPDATE.replace(':id', id), data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  toggleCategoryActive: async (id) => {
    try {
      const response = await axiosInstance.patch(API_ROUTES.PASS_CATEGORIES.TOGGLE_ACTIVE.replace(':id', id));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getAvailableForEvent: async (eventId) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.PASS_CATEGORIES.AVAILABLE_FOR_EVENT.replace(':eventId', eventId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Event Pass Category Configurations & Policies
  getEventCategories: async (eventId, enabledOnly = false) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.EVENT_CATEGORIES.LIST.replace(':eventId', eventId),
        { params: { enabledOnly } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  configureEventCategory: async (eventId, data) => {
    try {
      const response = await axiosInstance.post(
        API_ROUTES.EVENT_CATEGORIES.CONFIGURE.replace(':eventId', eventId),
        data
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getEventCategoryById: async (eventId, eventCategoryId) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.EVENT_CATEGORIES.VIEW
          .replace(':eventId', eventId)
          .replace(':eventCategoryId', eventCategoryId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateEventCategoryPolicy: async (eventId, eventCategoryId, data) => {
    try {
      const response = await axiosInstance.put(
        API_ROUTES.EVENT_CATEGORIES.UPDATE_POLICY
          .replace(':eventId', eventId)
          .replace(':eventCategoryId', eventCategoryId),
        data
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  toggleEventCategoryActive: async (eventId, eventCategoryId) => {
    try {
      const response = await axiosInstance.patch(
        API_ROUTES.EVENT_CATEGORIES.TOGGLE_ACTIVE
          .replace(':eventId', eventId)
          .replace(':eventCategoryId', eventCategoryId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Dynamic Form Builder
  getDraftFields: async (eventCategoryId) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.FORM_BUILDER.DRAFT.replace(':eventCategoryId', eventCategoryId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  saveDraftFields: async (eventCategoryId, fields) => {
    try {
      const response = await axiosInstance.put(
        API_ROUTES.FORM_BUILDER.DRAFT.replace(':eventCategoryId', eventCategoryId),
        fields
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteField: async (eventCategoryId, fieldConfigId) => {
    try {
      const response = await axiosInstance.delete(
        API_ROUTES.FORM_BUILDER.DELETE_FIELD
          .replace(':eventCategoryId', eventCategoryId)
          .replace(':fieldConfigId', fieldConfigId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  publishFormVersion: async (eventCategoryId, changelog = '') => {
    try {
      const response = await axiosInstance.post(
        API_ROUTES.FORM_BUILDER.PUBLISH.replace(':eventCategoryId', eventCategoryId),
        { changelog }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getPublishedSchema: async (eventCategoryId) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.FORM_BUILDER.PUBLISHED.replace(':eventCategoryId', eventCategoryId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getVersionHistory: async (eventCategoryId) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.FORM_BUILDER.HISTORY.replace(':eventCategoryId', eventCategoryId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Walk-in Admission
  getWalkInCategories: async (eventId) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.WALKIN.CATEGORIES, {
        params: { eventId },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  admitWalkIn: async (walkInData) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.WALKIN.ADMIT, walkInData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default categoryService;

