import React, { useState, useEffect } from 'react';
import { Input, Button } from '../../../Components/reusable';
import { X, FileText, Hash, MapPin, Clock, Globe, Settings, CheckSquare, Ticket, Save, XCircle } from 'lucide-react';

const AddAndEditEvents = ({ isOpen, onClose, event, onSave }) => {
  const convertISOToDateTimeLocal = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    name: event?.name || '',
    description: event?.description || '',
    eventCode: event?.eventCode || '',
    venue: event?.venue || '',
    startsAt: event?.startsAt ? convertISOToDateTimeLocal(event.startsAt) : '',
    endsAt: event?.endsAt ? convertISOToDateTimeLocal(event.endsAt) : '',
    timezone: event?.timezone || 'UTC',
    activationPolicy: event?.activationPolicy || 'SELF_SERVICE',
    checkInPolicy: event?.checkInPolicy || 'SINGLE_ENTRY',
    maximumPasses: event?.maximumPasses || '',
    activationStartsAt: event?.activationStartsAt ? convertISOToDateTimeLocal(event.activationStartsAt) : '',
    activationEndsAt: event?.activationEndsAt ? convertISOToDateTimeLocal(event.activationEndsAt) : '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        eventCode: event.eventCode || '',
        venue: event.venue || '',
        startsAt: event.startsAt ? convertISOToDateTimeLocal(event.startsAt) : '',
        endsAt: event.endsAt ? convertISOToDateTimeLocal(event.endsAt) : '',
        timezone: event.timezone || 'UTC',
        activationPolicy: event.activationPolicy || 'SELF_SERVICE',
        checkInPolicy: event.checkInPolicy || 'SINGLE_ENTRY',
        maximumPasses: event.maximumPasses || '',
        activationStartsAt: event.activationStartsAt ? convertISOToDateTimeLocal(event.activationStartsAt) : '',
        activationEndsAt: event.activationEndsAt ? convertISOToDateTimeLocal(event.activationEndsAt) : '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        eventCode: '',
        venue: '',
        startsAt: '',
        endsAt: '',
        timezone: 'UTC',
        activationPolicy: 'SELF_SERVICE',
        checkInPolicy: 'SINGLE_ENTRY',
        maximumPasses: '',
        activationStartsAt: '',
        activationEndsAt: '',
      });
    }
    setErrors({});
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Event name is required';
    if (!formData.eventCode.trim()) newErrors.eventCode = 'Event code is required';
    if (!formData.venue.trim()) newErrors.venue = 'Venue is required';
    if (!formData.startsAt) newErrors.startsAt = 'Start date is required';
    if (!formData.endsAt) newErrors.endsAt = 'End date is required';
    if (!formData.timezone.trim()) newErrors.timezone = 'Timezone is required';
    if (!formData.maximumPasses) newErrors.maximumPasses = 'Maximum passes is required';
    if (!formData.activationStartsAt) newErrors.activationStartsAt = 'Activation start date is required';
    if (!formData.activationEndsAt) newErrors.activationEndsAt = 'Activation end date is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Convert datetime-local to ISO format
    const formattedData = {
      ...formData,
      startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : '',
      endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : '',
      activationStartsAt: formData.activationStartsAt ? new Date(formData.activationStartsAt).toISOString() : '',
      activationEndsAt: formData.activationEndsAt ? new Date(formData.activationEndsAt).toISOString() : '',
      maximumPasses: parseInt(formData.maximumPasses),
    };

    onSave(formattedData);
    setFormData({
      name: '',
      description: '',
      eventCode: '',
      venue: '',
      startsAt: '',
      endsAt: '',
      timezone: 'UTC',
      activationPolicy: 'SELF_SERVICE',
      checkInPolicy: 'SINGLE_ENTRY',
      maximumPasses: '',
      activationStartsAt: '',
      activationEndsAt: '',
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 transform transition-all duration-300 scale-100 hover:scale-[1.01]">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-xl">
          <h2 className="text-xl font-semibold text-white">
            {event ? 'Edit Event' : 'Add New Event'}
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
            label="Event Name"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            icon={FileText}
          />
          <Input
            label="Event Code"
            id="eventCode"
            name="eventCode"
            value={formData.eventCode}
            onChange={handleChange}
            error={errors.eventCode}
            required
            icon={Hash}
          />
          <Input
            label="Venue"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            error={errors.venue}
            required
            icon={MapPin}
          />
          <Input
            label="Start Date & Time"
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            value={formData.startsAt}
            onChange={handleChange}
            error={errors.startsAt}
            required
            icon={Clock}
          />
          <Input
            label="End Date & Time"
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            value={formData.endsAt}
            onChange={handleChange}
            error={errors.endsAt}
            required
            icon={Clock}
          />
          <Input
            label="Timezone"
            id="timezone"
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            error={errors.timezone}
            required
            icon={Globe}
          />
          <div className="flex flex-col">
            <label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              placeholder="Event description..."
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="activationPolicy" className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-400" />
              Activation Policy
            </label>
            <select
              id="activationPolicy"
              name="activationPolicy"
              value={formData.activationPolicy}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="SELF_SERVICE">Self Service</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="checkInPolicy" className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-gray-400" />
              Check-in Policy
            </label>
            <select
              id="checkInPolicy"
              name="checkInPolicy"
              value={formData.checkInPolicy}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="SINGLE_ENTRY">Single Entry</option>
              <option value="MULTIPLE_ENTRY">Multiple Entry</option>
            </select>
          </div>
          <Input
            label="Maximum Passes"
            id="maximumPasses"
            name="maximumPasses"
            type="number"
            value={formData.maximumPasses}
            onChange={handleChange}
            error={errors.maximumPasses}
            required
            icon={Ticket}
          />
          <Input
            label="Activation Start Date & Time"
            id="activationStartsAt"
            name="activationStartsAt"
            type="datetime-local"
            value={formData.activationStartsAt}
            onChange={handleChange}
            error={errors.activationStartsAt}
            required
            icon={Clock}
          />
          <Input
            label="Activation End Date & Time"
            id="activationEndsAt"
            name="activationEndsAt"
            type="datetime-local"
            value={formData.activationEndsAt}
            onChange={handleChange}
            error={errors.activationEndsAt}
            required
            icon={Clock}
          />
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
              {event ? 'Update' : 'Add Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAndEditEvents;
