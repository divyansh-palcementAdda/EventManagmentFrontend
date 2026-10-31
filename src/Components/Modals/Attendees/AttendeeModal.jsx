import React, { useState, useEffect } from 'react';
import { Input, Button } from '../../reusable';
import { X, User, Mail, Phone, Building, Briefcase, CheckCircle, Save, XCircle } from 'lucide-react';

const AttendeeModal = ({ isOpen, onClose, attendee, onSave, loading }) => {
  const [formData, setFormData] = useState({
    eventId: '',
    fullName: '',
    email: '',
    mobileNumber: '',
    organization: '',
    designation: '',
    registrationStatus: 'PENDING',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (attendee) {
      setFormData({
        eventId: attendee.eventId || attendee.event?.id || '',
        fullName: attendee.fullName || '',
        email: attendee.email || '',
        mobileNumber: attendee.mobileNumber || '',
        organization: attendee.organization || '',
        designation: attendee.designation || '',
        registrationStatus: attendee.registrationStatus || 'PENDING',
      });
    } else {
      setFormData({
        eventId: '',
        fullName: '',
        email: '',
        mobileNumber: '',
        organization: '',
        designation: '',
        registrationStatus: 'PENDING',
      });
    }
    setErrors({});
  }, [attendee, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.eventId.trim()) newErrors.eventId = 'Event ID is required';
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email format';
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile Number is required';
    if (!formData.organization.trim()) newErrors.organization = 'Organization is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 transform transition-all duration-300 scale-100 hover:scale-[1.01]">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-xl">
          <h2 className="text-xl font-semibold text-white">
            {attendee ? 'Edit Attendee' : 'Add New Attendee'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Event ID"
            id="eventId"
            value={formData.eventId}
            onChange={handleChange}
            error={errors.eventId}
            required
            icon={User}
          />
          <Input
            label="Full Name"
            id="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
            required
            icon={User}
          />
          <Input
            label="Email"
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            icon={Mail}
          />
          <Input
            label="Mobile Number"
            id="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            error={errors.mobileNumber}
            required
            icon={Phone}
          />
          <Input
            label="Organization"
            id="organization"
            value={formData.organization}
            onChange={handleChange}
            error={errors.organization}
            required
            icon={Building}
          />
          <Input
            label="Designation"
            id="designation"
            value={formData.designation}
            onChange={handleChange}
            error={errors.designation}
            required
            icon={Briefcase}
          />
          <div className="flex flex-col">
            <label htmlFor="registrationStatus" className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-400" />
              Registration Status
            </label>
            <select
              id="registrationStatus"
              name="registrationStatus"
              value={formData.registrationStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="neutral"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Save className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {attendee ? 'Update' : 'Add Attendee'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendeeModal;
