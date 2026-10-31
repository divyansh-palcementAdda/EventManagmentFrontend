import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Edit, Trash2, Check, User, RefreshCw, AlertCircle, Lock } from 'lucide-react';
import AddAndEditRole from '../../Components/Modals/AddRole/addAndEditRole';
import { DeleteModal } from '../../Components/reusable';
import roleService from '../../Api-Services/roleService';
import permissionService from '../../Api-Services/permissionService';
import toast from 'react-hot-toast';

const RolesAndPermissions = () => {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  // Load all permissions catalog
  const loadPermissions = async () => {
    try {
      setLoadingPerms(true);
      const res = await permissionService.getAllPermissions();
      const perms = res?.data || res || [];
      setAllPermissions(perms);
    } catch (err) {
      console.error('Failed to load permissions catalog', err);
      toast.error('Failed to load permission catalog');
    } finally {
      setLoadingPerms(false);
    }
  };

  // Load roles list
  const loadRoles = useCallback(async (preserveSelectedId = null) => {
    try {
      setLoadingRoles(true);
      const res = await roleService.getAllRoles();
      const roleList = res?.data || res || [];
      setRoles(roleList);

      if (roleList.length > 0) {
        if (preserveSelectedId) {
          const match = roleList.find((r) => r.id === preserveSelectedId);
          setSelectedRole(match || roleList[0]);
        } else if (!selectedRole || !roleList.some((r) => r.id === selectedRole.id)) {
          setSelectedRole(roleList[0]);
        }
      } else {
        setSelectedRole(null);
      }
    } catch (err) {
      console.error('Failed to load roles', err);
      toast.error('Failed to load roles');
    } finally {
      setLoadingRoles(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    loadPermissions();
    loadRoles();
  }, []);

  const handleAddRole = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

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

  const handleTogglePermissionDirectly = async (permissionName) => {
    if (!selectedRole) return;
    if (selectedRole.systemDefined && selectedRole.name === 'SUPER_ADMIN') {
      toast.error('SUPER_ADMIN possesses all permissions by system guarantee.');
      return;
    }

    const currentNames = selectedRole.permissionNames || [];
    const isGranted = currentNames.includes(permissionName);

    let updatedNames = isGranted
      ? currentNames.filter((n) => n !== permissionName)
      : [...currentNames, permissionName];

    // Map names to IDs
    const updatedIds = allPermissions
      .filter((p) => updatedNames.includes(p.name))
      .map((p) => p.id);

    try {
      setActionLoading(true);
      const res = await roleService.assignPermissions(selectedRole.id, updatedIds);
      const updatedRole = res?.data || res;
      setSelectedRole(updatedRole);
      setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
      toast.success(
        isGranted
          ? `Revoked ${permissionName} from ${selectedRole.name}`
          : `Granted ${permissionName} to ${selectedRole.name}`
      );
    } catch (err) {
      console.error('Failed to update permission', err);
      toast.error(err?.message || 'Failed to update permission');
    } finally {
      setActionLoading(false);
    }
  };

  // Group permissions by resource
  const groupedPermissions = allPermissions.reduce((acc, p) => {
    const res = p.resource || 'GENERAL';
    if (!acc[res]) acc[res] = [];
    acc[res].push(p);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Roles & Permissions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Dynamic RBAC: configure system roles, permissions, and administrative boundaries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadPermissions();
              loadRoles(selectedRole?.id);
            }}
            disabled={loadingRoles || loadingPerms}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
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
        {/* Roles List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-700" />
              Roles Catalog ({roles.length})
            </h2>
          </div>

          {loadingRoles ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-green-700" />
              <span className="text-xs">Loading roles...</span>
            </div>
          ) : roles.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">No roles found</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {roles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-600 bg-green-50/60 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-sm text-gray-900">
                            {role.name}
                          </span>
                          {role.systemDefined && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-300">
                              <Lock className="w-2.5 h-2.5" />
                              System
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {role.description || 'No description provided'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            {role.userCount ?? 0} Users
                          </span>
                          <span>•</span>
                          <span>{role.permissionNames?.length ?? 0} Permissions</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEditRole(role)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                          title="Edit Role"
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

        {/* Selected Role Permissions Matrix */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
          {selectedRole ? (
            <>
              {/* Active Role Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-100 gap-2">
                <div>
                  <div className="flex items-center gap-2">
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
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedRole.description || 'Configured access boundaries'}
                  </p>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {selectedRole.permissionNames?.length ?? 0} of {allPermissions.length} permissions granted
                </div>
              </div>

              {/* Notice for System roles */}
              {selectedRole.name === 'SUPER_ADMIN' && (
                <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-200 flex items-center gap-2">
                  <Shield className="w-4 h-4 flex-shrink-0 text-blue-600" />
                  <span>The SUPER_ADMIN role automatically retains all permissions across all modules.</span>
                </div>
              )}

              {/* Permissions list grouped by Resource */}
              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {Object.entries(groupedPermissions).map(([resource, perms]) => (
                  <div key={resource} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3.5 py-1.5 border-b border-gray-200 flex items-center justify-between">
                      <span className="font-semibold text-xs tracking-wider uppercase text-gray-700">
                        {resource} Module
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {perms.filter((p) => selectedRole.permissionNames?.includes(p.name)).length} / {perms.length} active
                      </span>
                    </div>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map((perm) => {
                        const hasPerm = selectedRole.permissionNames?.includes(perm.name);
                        return (
                          <div
                            key={perm.id}
                            onClick={() => handleTogglePermissionDirectly(perm.name)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                              hasPerm
                                ? 'bg-green-50/70 border-green-400 text-green-950'
                                : 'bg-white border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center flex-shrink-0 border ${
                                hasPerm
                                  ? 'bg-green-700 border-green-700 text-white'
                                  : 'border-gray-300 bg-white'
                              }`}
                            >
                              {hasPerm && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-mono font-semibold text-xs text-gray-900 flex items-center justify-between">
                                <span>{perm.name}</span>
                                {perm.action && (
                                  <span className="text-[10px] text-gray-400 font-sans uppercase">
                                    {perm.action}
                                  </span>
                                )}
                              </div>
                              {perm.description && (
                                <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                                  {perm.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a role from the list to inspect permissions</p>
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
    </div>
  );
};

export default RolesAndPermissions;
