import axiosInstance from '../axiosInstance/axios.jsx';
import API_ROUTES from '../All-Api-Routes/apiroutes.js';

export const userService = {
  // Get paginated users with filters
  getUsers: async (params = {}) => {
    try {
      const response = await axiosInstance.get(API_ROUTES.USERS.LIST, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single user by ID
  getUserById: async (id) => {
    try {
      const url = API_ROUTES.USERS.VIEW.replace(':id', id);
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await axiosInstance.post(API_ROUTES.USERS.CREATE, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update existing user
  updateUser: async (id, userData) => {
    try {
      const url = API_ROUTES.USERS.UPDATE.replace(':id', id);
      const response = await axiosInstance.put(url, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user status (ACTIVE, SUSPENDED, DEACTIVATED)
  updateStatus: async (id, status) => {
    try {
      const url = API_ROUTES.USERS.UPDATE_STATUS.replace(':id', id);
      const response = await axiosInstance.patch(url, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Assign roles to user
  assignRoles: async (id, roleIds) => {
    try {
      const url = API_ROUTES.USERS.ROLES.replace(':id', id);
      const response = await axiosInstance.put(url, { roleIds });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Remove single role from user
  removeRole: async (id, roleId) => {
    try {
      const url = API_ROUTES.USERS.REMOVE_ROLE.replace(':id', id).replace(':roleId', roleId);
      const response = await axiosInstance.delete(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Admin reset user password
  resetPassword: async (id, newPassword) => {
    try {
      const url = API_ROUTES.USERS.PASSWORD.replace(':id', id);
      const response = await axiosInstance.put(url, { newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      const url = API_ROUTES.USERS.DELETE.replace(':id', id);
      const response = await axiosInstance.delete(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default userService;

