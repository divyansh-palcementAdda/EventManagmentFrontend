import React, { createContext, useContext, useState, useEffect } from 'react';
import roleService from '../Api-Services/roleService';

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Check if user is logged in
  const isAuthenticated = () => {
    return !!sessionStorage.getItem('accessToken');
  };

  // Get current role ID from session storage
  const getCurrentRoleId = () => {
    return sessionStorage.getItem('roleId');
  };

  // Fetch permissions for the current user's role
  const fetchPermissions = async (roleId) => {
    if (!roleId) {
      console.warn('No roleId provided for permission fetch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await roleService.getPermissionsByRoleId(roleId);
      // API returns { success: true, data: [...permissions] }
      const permissionData = response?.data?.data || response?.data || [];
      
      console.log('Fetched permissions:', permissionData);
      
      // Store full permission objects with resource and action
      setPermissions(permissionData);
      
      // Store in session storage for persistence
      sessionStorage.setItem('permissions', JSON.stringify(permissionData));
      sessionStorage.setItem('permissionTimestamp', Date.now().toString());
      
      setInitialized(true);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setError(err.message || 'Failed to fetch permissions');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize permissions on mount or when auth state changes
  useEffect(() => {
    const initPermissions = async () => {
      if (isAuthenticated()) {
        const roleId = getCurrentRoleId();
        if (roleId) {
          // Always fetch fresh permissions on every reload
          await fetchPermissions(roleId);
        } else {
          setInitialized(true);
        }
      } else {
        setPermissions([]);
        setInitialized(true);
      }
    };

    initPermissions();
  }, []);

  // Clear permissions on logout
  const clearPermissions = () => {
    setPermissions([]);
    sessionStorage.removeItem('permissions');
    sessionStorage.removeItem('permissionTimestamp');
    setInitialized(false);
  };

  // Refresh permissions (useful after role changes)
  const refreshPermissions = async () => {
    const roleId = getCurrentRoleId();
    if (roleId) {
      await fetchPermissions(roleId);
    }
  };

  // Permission checking functions
  const hasPermission = (resource, action) => {
    if (!resource || !action) return false;
    const resourceUpper = resource.toUpperCase();
    const actionUpper = action.toUpperCase();
    const result = permissions.some(
      p => p.resource?.toUpperCase() === resourceUpper && p.action?.toUpperCase() === actionUpper
    );
    console.log(`hasPermission(${resource}, ${action}):`, result);
    return result;
  };

  const canRead = (resource) => {
    const result = hasPermission(resource, 'VIEW');
    console.log(`canRead(${resource}):`, result);
    return result;
  };

  const canCreate = (resource) => {
    return hasPermission(resource, 'CREATE');
  };

  const canUpdate = (resource) => {
    return hasPermission(resource, 'UPDATE');
  };

  const canDelete = (resource) => {
    return hasPermission(resource, 'DELETE');
  };

  const canExport = (resource) => {
    return hasPermission(resource, 'EXPORT');
  };

  const value = {
    permissions,
    loading,
    error,
    initialized,
    fetchPermissions,
    clearPermissions,
    refreshPermissions,
    hasPermission,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export default PermissionContext;
