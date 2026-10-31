import React, { useState, useEffect } from 'react';
import { Input, Button } from '../../../Components/reusable';
import { X, User, Mail, Phone, Shield, CheckCircle, Save, XCircle, Lock } from 'lucide-react';
import roleService from '../../../Api-Services/roleService';

const AddAndEditUsers = ({ isOpen, onClose, user, onSave, loading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    roleId: '',
    accountStatus: 'ACTIVE',
  });

  const [availableRoles, setAvailableRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadRoles();
      if (user) {
        setFormData({
          fullName: user.fullName || user.name || '',
          email: user.email || '',
          mobileNumber: user.mobileNumber || user.phone || '',
          password: '',
          roleId: user.roles && user.roles.length > 0 ? user.roles[0].id : '',
          accountStatus: user.accountStatus || 'ACTIVE',
        });
      } else {
        setFormData({
          fullName: '',
          email: '',
          mobileNumber: '',
          password: '',
          roleId: '',
          accountStatus: 'ACTIVE',
        });
      }
      setErrors({});
    }
  }, [isOpen, user]);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const res = await roleService.getAllRoles();
      const rolesList = res?.data || res || [];
      setAvailableRoles(rolesList);
      if (!user && rolesList.length > 0 && !formData.roleId) {
        setFormData((prev) => ({ ...prev, roleId: rolesList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load roles', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';

    if (!user) {
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.roleId) {
      newErrors.roleId = 'Please select a role';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      mobileNumber: formData.mobileNumber.trim() || null,
      accountStatus: formData.accountStatus,
      roleIds: formData.roleId ? [formData.roleId] : [],
    };

    if (!user) {
      payload.password = formData.password;
    }

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-700 to-green-800 rounded-t-xl">
          <h2 className="text-xl font-semibold text-white">
            {user ? 'Edit System User' : 'Add New System User'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Full Name"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
            required
            icon={User}
            placeholder="e.g. John Doe"
          />

          <Input
            label="Email Address"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            disabled={!!user} // Email is immutable once created
            icon={Mail}
            placeholder="user@example.com"
          />

          {!user && (
            <Input
              label="Temporary / Initial Password"
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              icon={Lock}
              placeholder="At least 8 characters"
            />
          )}

          <Input
            label="Mobile Number (Optional)"
            id="mobileNumber"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            error={errors.mobileNumber}
            icon={Phone}
            placeholder="e.g. +1 555-0199"
          />

          <div className="flex flex-col">
            <label htmlFor="roleId" className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              Role Assignment
            </label>
            <select
              id="roleId"
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              disabled={loadingRoles}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 ${
                errors.roleId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">-- Select Role --</option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} {role.systemDefined ? '(System)' : ''}
                </option>
              ))}
            </select>
            {errors.roleId && <p className="text-xs text-red-500 mt-1">{errors.roleId}</p>}
          </div>

          <div className="flex flex-col">
            <label htmlFor="accountStatus" className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-400" />
              Account Status
            </label>
            <select
              id="accountStatus"
              name="accountStatus"
              value={formData.accountStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="DEACTIVATED">DEACTIVATED</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="neutral"
              onClick={onClose}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAndEditUsers;
