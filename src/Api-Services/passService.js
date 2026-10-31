import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const passService = {
  // Generate passes in batch with optional permitted event day IDs
  generatePasses: async (generateRequest) => {
    try {
      const response = await axiosInstance.post(
        API_ROUTES.PASSES.GENERATE,
        generateRequest
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // List passes for an event
  getPassesByEvent: async (eventId, page = 0, size = 20) => {
    try {
      const params = { page, size };
      const response = await axiosInstance.get(
        API_ROUTES.PASSES.LIST_BY_EVENT.replace(':eventId', eventId),
        { params }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get single pass details
  getPassById: async (passId) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.PASSES.VIEW.replace(':id', passId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Public pass validation by scanned raw token
  validatePass: async (token) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.PASSES.VALIDATE, {
        params: { token },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Public pass activation
  activatePass: async (activationData) => {
    try {
      const response = await axiosInstance.post(
        API_ROUTES.PASSES.ACTIVATE,
        activationData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Revoke pass (admin only)
  revokePass: async (passId, reason = '') => {
    try {
      const response = await axiosInstance.post(
        API_ROUTES.PASSES.REVOKE.replace(':id', passId),
        null,
        { params: { reason } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get live pass statistics for an event
  getPassStats: async (eventId) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.PASSES.STATS.replace(':eventId', eventId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Export passes for bulk QR printing
  exportPasses: async (eventId, filters = {}) => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.PASSES.EXPORT.replace(':eventId', eventId),
        { params: filters }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Download bulk activation Excel template
  downloadTemplate: async () => {
    try {
      const response = await axiosInstance.get(
        API_ROUTES.PASSES.TEMPLATE,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Preview bulk activation assignments & conflicts
  previewBulkActivation: async (eventId, formData) => {
    try {
      const response = await axiosInstance.post(
        API_ROUTES.PASSES.BULK_PREVIEW.replace(':eventId', eventId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Confirm transactional bulk activation batch
  confirmBulkActivation: async (eventId, confirmRequest) => {
    try {
      const response = await axiosInstance.post(
        API_ROUTES.PASSES.BULK_CONFIRM.replace(':eventId', eventId),
        confirmRequest
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default passService;

