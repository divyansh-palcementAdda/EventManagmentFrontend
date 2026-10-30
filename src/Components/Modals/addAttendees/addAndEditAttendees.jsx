import React, { useState } from 'react';
import { Input, Button } from '../../../Components/reusable';
import { X, User, Mail, Phone, Calendar, CheckCircle, Save, XCircle } from 'lucide-react';

const AddAndEditAttendees = ({ isOpen, onClose, attendee, onSave }) => {
  const [formData, setFormData] = useState({
    name: attendee?.name || '',
    email: attendee?.email || '',
    phone: attendee?.phone || '',
    event: attendee?.event || '',
    status: attendee?.status || 'confirmed',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.event.trim()) newErrors.event = 'Event is required';
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
    setFormData({ name: '', email: '', phone: '', event: '', status: 'confirmed' });
    setErrors({});
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
            label="Full Name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
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
            label="Phone"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            required
            icon={Phone}
          />
          <Input
            label="Event"
            id="event"
            value={formData.event}
            onChange={handleChange}
            error={errors.event}
            required
            icon={Calendar}
          />
          <div className="flex flex-col">
            <label htmlFor="status" className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-400" />
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
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
            >
              <Save className="w-4 h-4" />
              {attendee ? 'Update' : 'Add Attendee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAndEditAttendees;
