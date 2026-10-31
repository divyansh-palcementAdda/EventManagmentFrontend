import React, { useState, useEffect } from 'react';
import { Input, Button } from '../../../Components/reusable';
import { X, User, Mail, Phone, Calendar, Building, Briefcase, CheckCircle, Save, XCircle } from 'lucide-react';

const AddAndEditAttendees = ({ isOpen, onClose, attendee, onSave, events = [], selectedEventId, loading }) => {
  const [formData, setFormData] = useState({
    eventId: '',
    fullName: '',
    email: '',
    mobileNumber: '',
    organization: '',
    designation: '',
    registrationStatus: 'CONFIRMED',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (attendee) {
        setFormData({
          eventId: attendee.eventId || '',
          fullName: attendee.fullName || attendee.name || '',
          email: attendee.email || '',
          mobileNumber: attendee.mobileNumber || attendee.phone || '',
          organization: attendee.organization || '',
          designation: attendee.designation || '',
          registrationStatus: (attendee.registrationStatus || attendee.status || 'CONFIRMED').toUpperCase(),
        });
      } else {
        setFormData({
          eventId: selectedEventId || (events.length > 0 ? events[0].id : ''),
          fullName: '',
          email: '',
          mobileNumber: '',
          organization: '',
          designation: '',
          registrationStatus: 'CONFIRMED',
        });
      }
      setErrors({});
    }
  }, [isOpen, attendee, selectedEventId, events]);

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
    if (!attendee && !formData.eventId) newErrors.eventId = 'Event selection is required';
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
      organization: formData.organization.trim() || null,
      designation: formData.designation.trim() || null,
      registrationStatus: formData.registrationStatus,
    };

    if (!attendee) {
      payload.eventId = formData.eventId;
    }

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-700 to-green-800 rounded-t-xl text-white">
          <h2 className="text-xl font-semibold">
            {attendee ? 'Edit Attendee' : 'Register New Attendee'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!attendee && (
            <div className="flex flex-col">
              <label htmlFor="eventId" className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                Select Event *
              </label>
              <select
                id="eventId"
                name="eventId"
                value={formData.eventId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 ${
                  errors.eventId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Choose Event --</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name} ({evt.eventCode})
                  </option>
                ))}
              </select>
              {errors.eventId && <p className="text-xs text-red-500 mt-1">{errors.eventId}</p>}
            </div>
          )}

          <Input
            label="Full Name"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
            required
            icon={User}
            placeholder="Attendee full name"
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
            icon={Mail}
            placeholder="attendee@example.com"
          />

          <Input
            label="Mobile Number (Optional)"
            id="mobileNumber"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            error={errors.mobileNumber}
            icon={Phone}
            placeholder="+1 555-0100"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Organization (Optional)"
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              icon={Building}
              placeholder="Company / University"
            />
            <Input
              label="Designation (Optional)"
              id="designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              icon={Briefcase}
              placeholder="e.g. Lead Engineer"
            />
          </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 text-sm"
            >
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
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
              {loading ? 'Saving...' : attendee ? 'Update Attendee' : 'Register Attendee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAndEditAttendees;
