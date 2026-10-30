import React, { useState } from 'react'
import { Shield, Plus, Edit, Trash2, Check, User } from 'lucide-react'
import AddAndEditRole from '../../Components/Modals/AddRole/addAndEditRole'

const RolesAndPermissions = () => {
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: 'Admin',
      description: 'Full access to all features',
      permissions: ['Dashboard', 'Attendees', 'Events', 'Users', 'Roles & Permissions'],
      userCount: 2,
      color: 'bg-purple-500'
    },
    {
      id: 2,
      name: 'Event Manager',
      description: 'Manage events and attendees',
      permissions: ['Dashboard', 'Attendees', 'Events'],
      userCount: 5,
      color: 'bg-blue-500'
    },
    {
      id: 3,
      name: 'Viewer',
      description: 'Read-only access',
      permissions: ['Dashboard', 'Events'],
      userCount: 12,
      color: 'bg-green-500'
    }
  ])

  const [selectedRole, setSelectedRole] = useState(roles[0])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)

  const allPermissions = [
    'Dashboard',
    'Attendees',
    'Events',
    'Users',
    'Roles & Permissions'
  ]

  const handleAddRole = () => {
    setEditingRole(null)
    setIsModalOpen(true)
  }

  const handleEditRole = (role) => {
    setEditingRole(role)
    setIsModalOpen(true)
  }

  const handleDeleteRole = (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(role => role.id !== roleId))
      if (selectedRole?.id === roleId) {
        setSelectedRole(roles[0])
      }
    }
  }

  const handleSaveRole = (roleData) => {
    if (editingRole) {
      setRoles(roles.map(role =>
        role.id === editingRole.id ? { ...roleData, id: role.id } : role
      ))
      if (selectedRole?.id === editingRole.id) {
        setSelectedRole({ ...roleData, id: editingRole.id })
      }
    } else {
      const newRole = {
        ...roleData,
        id: roles.length + 1,
        userCount: 0,
        color: 'bg-purple-500'
      }
      setRoles([...roles, newRole])
    }
    setIsModalOpen(false)
  }

  const togglePermission = (permission) => {
    if (!selectedRole) return
    const updatedPermissions = selectedRole.permissions.includes(permission)
      ? selectedRole.permissions.filter(p => p !== permission)
      : [...selectedRole.permissions, permission]

    setSelectedRole({ ...selectedRole, permissions: updatedPermissions })
    setRoles(roles.map(role =>
      role.id === selectedRole.id ? { ...role, permissions: updatedPermissions } : role
    ))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Roles & Permissions</h1>
        <p className="text-gray-600">Manage user roles and their access permissions</p>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side - Roles List */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
                <button
                  onClick={handleAddRole}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Role
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedRole?.id === role.id
                        ? 'border-purple-500 bg-purple-50 shadow-sm'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${role.color} flex items-center justify-center`}>
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{role.name}</h3>
                          <p className="text-sm text-gray-500">{role.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditRole(role)
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRole(role.id)
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{role.userCount} users</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Permissions */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Permissions</h2>
                  {selectedRole && (
                    <p className="text-sm text-gray-500 mt-1">
                      Manage permissions for <span className="font-medium text-purple-600">{selectedRole.name}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6">
              {selectedRole ? (
                <div className="space-y-3">
                  {allPermissions.map((permission) => (
                    <div
                      key={permission}
                      onClick={() => togglePermission(permission)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedRole.permissions.includes(permission)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              selectedRole.permissions.includes(permission)
                                ? 'border-purple-600 bg-purple-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedRole.permissions.includes(permission) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{permission}</span>
                        </div>
                        {selectedRole.permissions.includes(permission) && (
                          <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            Active
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a role to view and manage its permissions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <AddAndEditRole
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveRole}
          role={editingRole}
          allPermissions={allPermissions}
        />
      )}
    </div>
  )
}

export default RolesAndPermissions
