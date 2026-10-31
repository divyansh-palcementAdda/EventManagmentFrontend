import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const permissionService = {
  // Get paginated permissions
  getPermissions: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.PERMISSIONS.LIST, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all permissions (complete catalog)
  getAllPermissions: async () => {
    try {
      const response = await axiosInstance.get(API_ROUTES.PERMISSIONS.ALL);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get distinct permission resources
  getResources: async () => {
    try {
      const response = await axiosInstance.get(API_ROUTES.PERMISSIONS.RESOURCES);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get permission by ID
  getPermissionById: async (id) => {
    try {
      const url = API_ROUTES.PERMISSIONS.VIEW.replace(':id', id);
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create permission
  createPermission: async (permissionData) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.PERMISSIONS.CREATE, permissionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update permission
  updatePermission: async (id, permissionData) => {
    try {
      const url = API_ROUTES.PERMISSIONS.UPDATE.replace(':id', id);
      const response = await axiosInstance.put(url, permissionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default permissionService;

