import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Check,
  User,
  RefreshCw,
  AlertCircle,
  Lock,
  Search,
  X,
  RotateCcw,
  Save,
  CheckCheck,
  CheckSquare,
  Square,
  Filter,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import AddAndEditRole from '../../Components/Modals/AddRole/addAndEditRole';
import { DeleteModal } from '../../Components/reusable';
import roleService from '../../Api-Services/roleService';
import permissionService from '../../Api-Services/permissionService';
import toast from 'react-hot-toast';

const RolesAndPermissions = () => {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);

  // Canonical permission tracking:
  // savedPermissionIds = IDs stored on backend for selected role
  // selectedPermissionIds = active draft selection
  const [savedPermissionIds, setSavedPermissionIds] = useState(new Set());
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set());

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Loading states
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [loadingRolePerms, setLoadingRolePerms] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
  const [pendingRoleId, setPendingRoleId] = useState(null);

  // Active selected role object
  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  // Check if current draft differs from saved baseline
  const hasUnsavedChanges = useMemo(() => {
    if (!selectedRole || selectedRole.name === 'SUPER_ADMIN') return false;
    if (savedPermissionIds.size !== selectedPermissionIds.size) return true;
    for (const id of selectedPermissionIds) {
      if (!savedPermissionIds.has(id)) return true;
    }
    return false;
  }, [selectedRole, savedPermissionIds, selectedPermissionIds]);

  // Load all permissions catalog
  const loadPermissions = async () => {
    try {
      setLoadingPerms(true);
      const res = await permissionService.getAllPermissions();
      const perms = res?.data || res || [];
      setAllPermissions(perms);
      return perms;
    } catch (err) {
      console.error('Failed to load permissions catalog', err);
      toast.error('Failed to load permission catalog');
      return [];
    } finally {
      setLoadingPerms(false);
    }
  };

  // Synchronize permissions for a specific role
  const syncRolePermissions = useCallback(async (role, catalog = allPermissions) => {
    if (!role) {
      setSavedPermissionIds(new Set());
      setSelectedPermissionIds(new Set());
      return;
    }

    if (role.name === 'SUPER_ADMIN') {
      const allIds = new Set(catalog.map((p) => p.id));
      setSavedPermissionIds(allIds);
      setSelectedPermissionIds(allIds);
      return;
    }

    // Attempt direct extraction from role payload first
    let extractedIds = [];
    if (role.permissionIds && Array.isArray(role.permissionIds) && role.permissionIds.length > 0) {
      extractedIds = role.permissionIds;
    } else if (role.permissions && Array.isArray(role.permissions) && role.permissions.length > 0) {
      extractedIds = role.permissions.map((p) => (typeof p === 'object' && p !== null ? p.id : p));
    } else if (role.permissionNames && Array.isArray(role.permissionNames) && catalog.length > 0) {
      extractedIds = catalog
        .filter((p) => role.permissionNames.includes(p.name))
        .map((p) => p.id);
    }

    // Always fetch dedicated backend assignment to guarantee fresh synchronization
    try {
      setLoadingRolePerms(true);
      const res = await roleService.getRolePermissions(role.id);
      const perms = res?.data || res || [];
      if (Array.isArray(perms) && perms.length > 0) {
        const fetchedIds = perms.map((p) => (typeof p === 'object' && p !== null ? p.id : p));
        const idSet = new Set(fetchedIds);
        setSavedPermissionIds(idSet);
        setSelectedPermissionIds(new Set(idSet));
        return;
      }
    } catch (err) {
      console.warn('Could not fetch dedicated role permissions, using role payload fallback', err);
    } finally {
      setLoadingRolePerms(false);
    }

    const idSet = new Set(extractedIds);
    setSavedPermissionIds(idSet);
    setSelectedPermissionIds(new Set(idSet));
  }, [allPermissions]);

  // Load roles list
  const loadRoles = useCallback(async (targetRoleId = null) => {
    try {
      setLoadingRoles(true);
      const res = await roleService.getAllRoles();
      const roleList = res?.data || res || [];
      setRoles(roleList);

      if (roleList.length > 0) {
        let nextSelected = null;
        if (targetRoleId) {
          nextSelected = roleList.find((r) => r.id === targetRoleId);
        } else if (selectedRoleId) {
          nextSelected = roleList.find((r) => r.id === selectedRoleId);
        }

        if (!nextSelected) {
          nextSelected = roleList[0];
        }

        setSelectedRoleId(nextSelected.id);
        await syncRolePermissions(nextSelected);
      } else {
        setSelectedRoleId(null);
        setSavedPermissionIds(new Set());
        setSelectedPermissionIds(new Set());
      }
    } catch (err) {
      console.error('Failed to load roles', err);
      toast.error('Failed to load roles');
    } finally {
      setLoadingRoles(false);
    }
  }, [selectedRoleId, syncRolePermissions]);

  // Initial load
  useEffect(() => {
    (async () => {
      const perms = await loadPermissions();
      await loadRoles();
    })();
  }, []);

  // Handle role selection with unsaved changes protection
  const handleSelectRole = (role) => {
    if (role.id === selectedRoleId) return;

    if (hasUnsavedChanges) {
      setPendingRoleId(role.id);
      setUnsavedModalOpen(true);
      return;
    }

    setSelectedRoleId(role.id);
    syncRolePermissions(role);
  };

  const confirmSwitchRole = () => {
    const targetRole = roles.find((r) => r.id === pendingRoleId);
    setUnsavedModalOpen(false);
    setPendingRoleId(null);
    if (targetRole) {
      setSelectedRoleId(targetRole.id);
      syncRolePermissions(targetRole);
      toast.info('Unsaved changes discarded');
    }
  };

  // Toggle individual permission in draft state
  const handleTogglePermission = (permissionId) => {
    if (!selectedRole) return;
    if (selectedRole.name === 'SUPER_ADMIN') {
      toast.error('SUPER_ADMIN possesses all permissions by system guarantee.');
      return;
    }

    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  // Filter permissions based on search query
  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) return allPermissions;
    const query = searchQuery.toLowerCase().trim();
    return allPermissions.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(query);
      const descMatch = p.description?.toLowerCase().includes(query);
      const resMatch = p.resource?.toLowerCase().includes(query);
      const actMatch = p.action?.toLowerCase().includes(query);
      return nameMatch || descMatch || resMatch || actMatch;
    });
  }, [allPermissions, searchQuery]);

  // Filtered permission IDs
  const filteredPermissionIds = useMemo(() => {
    return filteredPermissions.map((p) => p.id);
  }, [filteredPermissions]);

  // Group filtered permissions by resource
  const groupedPermissions = useMemo(() => {
    return filteredPermissions.reduce((acc, p) => {
      const res = p.resource || 'GENERAL';
      if (!acc[res]) acc[res] = [];
      acc[res].push(p);
      return acc;
    }, {});
  }, [filteredPermissions]);

  // Bulk actions on visible filtered permissions
  const handleSelectAllVisible = () => {
    if (!selectedRole || selectedRole.name === 'SUPER_ADMIN') return;
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      filteredPermissionIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleClearVisible = () => {
    if (!selectedRole || selectedRole.name === 'SUPER_ADMIN') return;
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      filteredPermissionIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  // Toggle all permissions within a specific module
  const handleToggleModulePermissions = (modulePermissions) => {
    if (!selectedRole || selectedRole.name === 'SUPER_ADMIN') return;
    const moduleIds = modulePermissions.map((p) => p.id);
    const allModuleSelected = moduleIds.every((id) => selectedPermissionIds.has(id));

    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (allModuleSelected) {
        moduleIds.forEach((id) => next.delete(id));
      } else {
        moduleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Discard draft changes and restore backend baseline
  const handleDiscardChanges = () => {
    setSelectedPermissionIds(new Set(savedPermissionIds));
    toast.info('Changes discarded');
  };

  // Save changes to backend
  const handleSaveChanges = async () => {
    if (!selectedRole) return;
    if (selectedRole.name === 'SUPER_ADMIN') {
      toast.error('SUPER_ADMIN permissions are immutable.');
      return;
    }

    try {
      setSavingPermissions(true);
      const permissionIdsArray = Array.from(selectedPermissionIds);
      const res = await roleService.assignPermissions(selectedRole.id, permissionIdsArray);
      const updatedRole = res?.data || res;

      // Update baseline
      const newSavedSet = new Set(permissionIdsArray);
      setSavedPermissionIds(newSavedSet);
      setSelectedPermissionIds(new Set(newSavedSet));

      // Update in local roles catalog
      setRoles((prev) =>
        prev.map((r) => {
          if (r.id === selectedRole.id) {
            return {
              ...r,
              ...updatedRole,
              permissionCount: permissionIdsArray.length,
              permissionIds: permissionIdsArray,
            };
          }
          return r;
        })
      );

      toast.success(`Successfully saved ${permissionIdsArray.length} permissions for ${selectedRole.name}`);
    } catch (err) {
      console.error('Failed to save permissions', err);
      toast.error(err?.message || 'Failed to save permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  // Modal actions: Add / Edit Role
  const handleAddRole = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleSaveRole = async (formData) => {
    try {
      setActionLoading(true);
      if (editingRole) {
        await roleService.updateRole(editingRole.id, {
          name: formData.name,
          description: formData.description,
        });
        if (formData.permissionIds) {
          await roleService.assignPermissions(editingRole.id, formData.permissionIds);
        }
        toast.success(`Role ${formData.name} updated successfully`);
      } else {
        await roleService.createRole({
          name: formData.name,
          description: formData.description,
          permissionIds: formData.permissionIds,
        });
        toast.success(`Role ${formData.name} created successfully`);
      }
      setIsModalOpen(false);
      setEditingRole(null);
      await loadRoles(editingRole?.id);
    } catch (err) {
      console.error('Failed to save role', err);
      toast.error(err?.message || 'Failed to save role');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Role
  const handleDeleteRole = (role) => {
    if (role.systemDefined) {
      toast.error('System-defined roles cannot be deleted.');
      return;
    }
    if (role.userCount > 0) {
      toast.error(`Cannot delete role with ${role.userCount} active users assigned.`);
      return;
    }
    setRoleToDelete(role);
    setDeleteModalOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      setActionLoading(true);
      await roleService.deleteRole(roleToDelete.id);
      toast.success(`Role ${roleToDelete.name} deleted successfully`);
      setDeleteModalOpen(false);
      setRoleToDelete(null);
      await loadRoles();
    } catch (err) {
      console.error('Failed to delete role', err);
      toast.error(err?.message || 'Failed to delete role');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculations for active selection
  const totalCount = allPermissions.length;
  const grantedCount = selectedPermissionIds.size;
  const coveragePercent = totalCount > 0 ? Math.round((grantedCount / totalCount) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Roles & Permissions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Dynamic RBAC: configure system roles, assign permissions, and enforce administrative boundaries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadPermissions();
              loadRoles(selectedRoleId);
            }}
            disabled={loadingRoles || loadingPerms}
            className="flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRoles || loadingPerms ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleAddRole}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Role
          </button>
        </div>
      </div>

      {/* Main Grid: Left side Roles list, Right side Permissions matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles Catalog (Left Panel) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-green-700" />
              Roles Catalog ({roles.length})
            </h2>
          </div>

          {loadingRoles ? (
            <div className="py-12 text-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-green-700" />
              <span className="text-xs">Loading roles...</span>
            </div>
          ) : roles.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">No roles found</div>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {roles.map((role) => {
                const isSelected = selectedRoleId === role.id;
                // Live count display: if role is currently active, show the draft count, otherwise role count
                const permCount = isSelected
                  ? selectedPermissionIds.size
                  : (role.permissionCount ?? role.permissionIds?.length ?? role.permissions?.length ?? 0);

                const isDraftModified = isSelected && hasUnsavedChanges;

                return (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all relative ${
                      isSelected
                        ? 'border-green-600 bg-green-50/70 shadow-sm ring-1 ring-green-600/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-sm text-gray-900">
                            {role.name}
                          </span>
                          {role.systemDefined && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-300">
                              <Lock className="w-2.5 h-2.5" />
                              System
                            </span>
                          )}
                          {isDraftModified && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                              Unsaved
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {role.description || 'No description provided'}
                        </p>
                        <div className="flex items-center gap-3 mt-2.5 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            {role.userCount ?? 0} Users
                          </span>
                          <span>•</span>
                          <span className="font-medium text-gray-700">
                            {permCount} Permissions
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditRole(role)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                          title="Edit Role Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {!role.systemDefined && (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                            title="Delete Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Role Permissions Matrix (Right Panel) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
          {selectedRole ? (
            <div className="space-y-4">
              {/* Active Role Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-gray-900 font-mono">
                      {selectedRole.name}
                    </h2>
                    {selectedRole.systemDefined ? (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                        System Protected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                        Custom Role
                      </span>
                    )}
                    {hasUnsavedChanges && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                        Unsaved Edits
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedRole.description || 'Configured access boundaries'}
                  </p>
                </div>

                {/* Progress / Granted Metric */}
                <div className="flex flex-col sm:items-end gap-1">
                  <div className="text-xs font-semibold text-gray-800">
                    <span className="text-green-700 font-bold">{grantedCount}</span> of {totalCount} permissions granted
                  </div>
                  <div className="w-36 bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${coveragePercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {coveragePercent}% system coverage
                  </span>
                </div>
              </div>

              {/* SUPER_ADMIN Notice Banner */}
              {selectedRole.name === 'SUPER_ADMIN' && (
                <div className="p-3.5 bg-blue-50 text-blue-900 text-xs rounded-lg border border-blue-200 flex items-center gap-2.5 shadow-sm">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 text-blue-600" />
                  <div className="leading-relaxed">
                    <span className="font-semibold">System Guarantee: </span>
                    The <span className="font-mono font-bold">SUPER_ADMIN</span> role permanently retains all system permissions across all modules. Permissions cannot be modified.
                  </div>
                </div>
              )}

              {/* Search & Bulk Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search permissions by name, description, module, or action..."
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 bg-white placeholder-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Bulk Select / Clear for Visible */}
                {selectedRole.name !== 'SUPER_ADMIN' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleSelectAllVisible}
                      disabled={filteredPermissions.length === 0}
                      className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                      title="Select all currently visible permissions"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-green-700" />
                      Select Visible ({filteredPermissions.length})
                    </button>
                    <button
                      onClick={handleClearVisible}
                      disabled={filteredPermissions.length === 0}
                      className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                      title="Clear all currently visible permissions"
                    >
                      <Square className="w-3.5 h-3.5 text-gray-500" />
                      Clear Visible
                    </button>
                  </div>
                )}
              </div>

              {/* Match Counter Info */}
              {searchQuery && (
                <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                  <span>
                    Showing <span className="font-semibold text-gray-700">{filteredPermissions.length}</span> of {allPermissions.length} permissions matching "{searchQuery}"
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-green-700 hover:underline font-medium"
                  >
                    Reset Filter
                  </button>
                </div>
              )}

              {/* Permissions list grouped by Resource */}
              <div className="space-y-4 max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
                {loadingRolePerms ? (
                  <div className="py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-green-700" />
                    <span className="text-xs">Synchronizing permissions...</span>
                  </div>
                ) : filteredPermissions.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-gray-300 rounded-lg space-y-2">
                    <SlidersHorizontal className="w-6 h-6 text-gray-400 mx-auto" />
                    <p className="text-sm font-medium text-gray-600">No permissions found matching "{searchQuery}"</p>
                    <p className="text-xs text-gray-400">Try adjusting your search terms</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  Object.entries(groupedPermissions).map(([resource, perms]) => {
                    const activeInGroup = perms.filter((p) => selectedPermissionIds.has(p.id)).length;
                    const allInGroupSelected = activeInGroup === perms.length;

                    return (
                      <div key={resource} className="border border-gray-200 rounded-lg overflow-hidden shadow-xs">
                        {/* Module Section Header */}
                        <div className="bg-gray-50 px-3.5 py-2 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs tracking-wider uppercase text-gray-800">
                              {resource} Module
                            </span>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                              {activeInGroup} / {perms.length} active
                            </span>
                          </div>

                          {selectedRole.name !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleToggleModulePermissions(perms)}
                              className="text-[11px] font-medium text-green-700 hover:text-green-900 transition-colors"
                            >
                              {allInGroupSelected ? 'Deselect Module' : 'Select All in Module'}
                            </button>
                          )}
                        </div>

                        {/* Permission Items Grid */}
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                          {perms.map((perm) => {
                            const isGranted = selectedPermissionIds.has(perm.id);
                            const isImmutable = selectedRole.name === 'SUPER_ADMIN';

                            return (
                              <div
                                key={perm.id}
                                onClick={() => !isImmutable && handleTogglePermission(perm.id)}
                                className={`p-2.5 rounded-lg border transition-all flex items-start gap-2.5 ${
                                  isImmutable
                                    ? 'bg-blue-50/40 border-blue-200 text-blue-950 cursor-default'
                                    : isGranted
                                    ? 'bg-green-50/70 border-green-500 text-green-950 cursor-pointer shadow-xs'
                                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50/60 cursor-pointer'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                                    isImmutable
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : isGranted
                                      ? 'bg-green-700 border-green-700 text-white'
                                      : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {isGranted && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-mono font-semibold text-xs text-gray-900 flex items-center justify-between gap-1">
                                    <span className="truncate">{perm.name}</span>
                                    {perm.action && (
                                      <span className="text-[10px] text-gray-500 font-sans uppercase font-medium bg-gray-100 px-1 py-0.2 rounded border border-gray-200">
                                        {perm.action}
                                      </span>
                                    )}
                                  </div>
                                  {perm.description && (
                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-tight line-clamp-2">
                                      {perm.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sticky Action Bar for Unsaved Changes */}
              {selectedRole.name !== 'SUPER_ADMIN' && (
                <div
                  className={`pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 transition-opacity ${
                    hasUnsavedChanges ? 'opacity-100' : 'opacity-70'
                  }`}
                >
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    {hasUnsavedChanges ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span className="font-semibold text-amber-800">
                          You have unsaved changes for {selectedRole.name} ({selectedPermissionIds.size} selected)
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400">All permissions are synced with the backend</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleDiscardChanges}
                      disabled={!hasUnsavedChanges || savingPermissions}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Discard Changes
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      disabled={!hasUnsavedChanges || savingPermissions}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-green-700 hover:bg-green-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-40"
                    >
                      {savingPermissions ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-gray-400">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-40 text-green-700" />
              <p className="text-sm font-medium text-gray-600">Select a role from the catalog</p>
              <p className="text-xs text-gray-400 mt-1">Inspect and manage granular module permissions</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Role Modal */}
      <AddAndEditRole
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRole(null);
        }}
        onSave={handleSaveRole}
        role={editingRole}
        allPermissions={allPermissions}
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRoleToDelete(null);
        }}
        onConfirm={confirmDeleteRole}
        title="Delete Role"
        message={`Are you sure you want to delete role "${roleToDelete?.name}"? This action cannot be undone.`}
        loading={actionLoading}
      />

      {/* Unsaved Changes Confirmation Modal when switching roles */}
      {unsavedModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-gray-900">Unsaved Changes</h3>
            </div>
            <p className="text-sm text-gray-600">
              You have unsaved permission changes for <span className="font-mono font-bold text-gray-800">{selectedRole?.name}</span>. Switching roles will discard these changes.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setUnsavedModalOpen(false);
                  setPendingRoleId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={confirmSwitchRole}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
              >
                Discard & Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesAndPermissions;
