import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const roleService = {
  // Get paginated roles
  getRoles: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.ROLES.LIST, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all active roles (unpaginated, for dropdowns/pickers)
  getAllRoles: async () => {
    try {
      const response = await axiosInstance.get(API_ROUTES.ROLES.ALL);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get role by ID
  getRoleById: async (id) => {
    try {
      const url = API_ROUTES.ROLES.VIEW.replace(':id', id);
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create role
  createRole: async (roleData) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.ROLES.CREATE, roleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update role
  updateRole: async (id, roleData) => {
    try {
      const url = API_ROUTES.ROLES.UPDATE.replace(':id', id);
      const response = await axiosInstance.put(url, roleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete role (fails if system-defined or in use)
  deleteRole: async (id) => {
    try {
      const url = API_ROUTES.ROLES.DELETE.replace(':id', id);
      const response = await axiosInstance.delete(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Atomically replace permissions for a role
  assignPermissions: async (id, permissionIds) => {
    try {
      const url = API_ROUTES.ROLES.PERMISSIONS.replace(':id', id);
      const response = await axiosInstance.put(url, { permissionIds });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remove a single permission from a role
  removePermission: async (id, permissionId) => {
    try {
      const url = API_ROUTES.ROLES.REMOVE_PERMISSION.replace(':id', id).replace(':permissionId', permissionId);
      const response = await axiosInstance.delete(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get users assigned to this role
  getRoleUsers: async (id, params = {}) => {
    try {
      const url = API_ROUTES.ROLES.USERS.replace(':id', id);
      const response = await axiosInstance.get(url, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default roleService;

