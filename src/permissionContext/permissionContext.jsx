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
      const permissionData = response?.data || response || [];
      
      // Extract permission names from the response
      const permissionNames = permissionData.map(p => p.name || p);
      setPermissions(permissionNames);
      
      // Store in session storage for persistence
      sessionStorage.setItem('permissions', JSON.stringify(permissionNames));
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
          // Try to restore from session storage first
          const storedPermissions = sessionStorage.getItem('permissions');
          const storedTimestamp = sessionStorage.getItem('permissionTimestamp');
          
          if (storedPermissions && storedTimestamp) {
            // Check if stored permissions are recent (less than 1 hour old)
            const age = Date.now() - parseInt(storedTimestamp);
            if (age < 3600000) {
              setPermissions(JSON.parse(storedPermissions));
              setInitialized(true);
              return;
            }
          }
          
          // Fetch fresh permissions
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
  const hasPermission = (permissionName) => {
    if (!permissionName) return false;
    return permissions.includes(permissionName);
  };

  const canRead = (resource) => {
    return hasPermission(`read:${resource}`) || hasPermission(`${resource}:read`);
  };

  const canCreate = (resource) => {
    return hasPermission(`create:${resource}`) || hasPermission(`${resource}:create`);
  };

  const canUpdate = (resource) => {
    return hasPermission(`update:${resource}`) || hasPermission(`${resource}:update`) || hasPermission(`edit:${resource}`) || hasPermission(`${resource}:edit`);
  };

  const canDelete = (resource) => {
    return hasPermission(`delete:${resource}`) || hasPermission(`${resource}:delete`);
  };

  const canExport = (resource) => {
    return hasPermission(`export:${resource}`) || hasPermission(`${resource}:export`);
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
