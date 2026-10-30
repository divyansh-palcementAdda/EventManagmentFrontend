import React, { useState, useEffect } from 'react'
import { X, Save, Shield, FileText, CheckSquare, XCircle } from 'lucide-react'

const AddAndEditRole = ({ isOpen, onClose, onSave, role, allPermissions }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  })

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions || []
      })
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: []
      })
    }
  }, [role])

  const togglePermission = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Please enter a role name')
      return
    }
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 transform transition-all duration-300 scale-100 hover:scale-[1.01]">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-xl">
          <h2 className="text-xl font-semibold text-white">
            {role ? 'Edit Role' : 'Add New Role'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Role Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                Role Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Admin, Manager, Viewer"
                  className="w-full pl-10 px-4 py-2 border border-purple-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Description
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 pl-3 pointer-events-none">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this role can do"
                  rows="3"
                  className="w-full pl-10 px-4 py-2 border border-purple-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-gray-400" />
                Permissions
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allPermissions.map((permission) => (
                  <div
                    key={permission}
                    onClick={() => togglePermission(permission)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      formData.permissions.includes(permission)
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.permissions.includes(permission)
                            ? 'border-purple-600 bg-purple-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {formData.permissions.includes(permission) && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{permission}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              {role ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddAndEditRole
