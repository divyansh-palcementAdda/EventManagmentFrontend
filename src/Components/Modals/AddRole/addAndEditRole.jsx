import React, { useState, useEffect } from 'react';
import { X, Save, Shield, FileText, CheckSquare, XCircle, AlertCircle } from 'lucide-react';

const AddAndEditRole = ({ isOpen, onClose, onSave, role, allPermissions = [], loading }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role) {
      setName(role.name || '');
      setDescription(role.description || '');
      // RoleResponse can have permissionNames or permissionIds
      if (role.permissionIds && role.permissionIds.length > 0) {
        setSelectedPermissionIds(role.permissionIds);
      } else if (role.permissions && role.permissions.length > 0) {
        const ids = role.permissions.map((p) => (typeof p === 'object' && p !== null ? p.id : p));
        setSelectedPermissionIds(ids);
      } else if (role.permissionNames && allPermissions.length > 0) {
        const ids = allPermissions
          .filter((p) => role.permissionNames.includes(p.name))
          .map((p) => p.id);
        setSelectedPermissionIds(ids);
      } else {
        setSelectedPermissionIds([]);
      }
    } else {
      setName('');
      setDescription('');
      setSelectedPermissionIds([]);
    }
    setError('');
  }, [role, isOpen, allPermissions]);

  const togglePermission = (id) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAllInResource = (resourcePermissions) => {
    const resourceIds = resourcePermissions.map((p) => p.id);
    const allSelected = resourceIds.every((id) => selectedPermissionIds.includes(id));
    if (allSelected) {
      setSelectedPermissionIds((prev) => prev.filter((id) => !resourceIds.includes(id)));
    } else {
      setSelectedPermissionIds((prev) => Array.from(new Set([...prev, ...resourceIds])));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    onSave({
      name: name.trim().toUpperCase(),
      description: description.trim(),
      permissionIds: selectedPermissionIds,
    });
  };

  if (!isOpen) return null;

  // Group permissions by resource
  const groupedPermissions = allPermissions.reduce((acc, p) => {
    const res = p.resource || 'GENERAL';
    if (!acc[res]) acc[res] = [];
    acc[res].push(p);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-700 to-green-800 rounded-t-xl text-white">
          <div>
            <h2 className="text-xl font-semibold">
              {role ? `Edit Role: ${role.name}` : 'Create New Dynamic Role'}
            </h2>
            <p className="text-xs text-green-100 mt-0.5">
              Define permissions and access boundaries for this role
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {role?.systemDefined && (
            <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>This is a system-defined role. Core privileges are maintained automatically.</span>
            </div>
          )}

          {/* Role Name & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Role Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                disabled={role?.systemDefined}
                placeholder="e.g. TICKET_SCANNER"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700 uppercase font-mono disabled:bg-gray-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of responsibilities"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
              />
            </div>
          </div>

          {/* Permissions Matrix grouped by resource */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-bold text-gray-900">
                  Assigned Permissions ({selectedPermissionIds.length} selected)
                </label>
                <p className="text-xs text-gray-500">
                  Select permissions to grant members with this role
                </p>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {Object.entries(groupedPermissions).map(([resource, perms]) => {
                const resourceIds = perms.map((p) => p.id);
                const allSelected = resourceIds.every((id) => selectedPermissionIds.includes(id));
                const someSelected =
                  !allSelected && resourceIds.some((id) => selectedPermissionIds.includes(id));

                return (
                  <div key={resource} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                      <span className="font-semibold text-xs tracking-wider uppercase text-gray-700">
                        {resource} ({perms.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectAllInResource(perms)}
                        className="text-xs text-green-700 hover:text-green-800 font-medium"
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {perms.map((perm) => {
                        const isChecked = selectedPermissionIds.includes(perm.id);
                        return (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-2 p-2 rounded border cursor-pointer text-xs transition-colors ${
                              isChecked
                                ? 'bg-green-50/70 border-green-500 text-green-900'
                                : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(perm.id)}
                              className="mt-0.5 rounded text-green-700 focus:ring-green-700"
                            />
                            <div>
                              <div className="font-mono font-semibold">{perm.name}</div>
                              {perm.description && (
                                <div className="text-[11px] text-gray-500 leading-tight">
                                  {perm.description}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-semibold shadow-sm"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAndEditRole;
