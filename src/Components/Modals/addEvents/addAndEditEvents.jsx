import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Hash,
  MapPin,
  Clock,
  Globe,
  Settings,
  CheckSquare,
  Ticket,
  Save,
  AlertCircle,
  AlertTriangle,
  Loader2,
  CalendarPlus,
  Info,
  Calendar,
} from 'lucide-react';
import Input from '../../../Components/reusable/input';

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC — Coordinated Universal Time' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata — IST (India Standard Time)' },
  { value: 'America/New_York', label: 'America/New_York — Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'America/Chicago — Central Time (CT)' },
  { value: 'America/Denver', label: 'America/Denver — Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles — Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Europe/London — GMT / British Time' },
  { value: 'Europe/Paris', label: 'Europe/Paris — CET (Central European Time)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin — Central European Time' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai — GST (Gulf Standard Time)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore — SGT (Singapore Time)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo — JST (Japan Standard Time)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney — AEST / AEDT' },
];

const convertISOToDateTimeLocal = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

const getDefaultTimezone = () => {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return detected || 'UTC';
  } catch {
    return 'UTC';
  }
};

const AddAndEditEvents = ({ isOpen, onClose, event, onSave }) => {
  const dialogRef = useRef(null);
  const firstInputRef = useRef(null);
  const previousActiveElement = useRef(null);

  const detectedTz = getDefaultTimezone();
  const timezones = [...COMMON_TIMEZONES];
  if (!timezones.some((t) => t.value === detectedTz)) {
    timezones.unshift({ value: detectedTz, label: `${detectedTz} (Local System Time)` });
  }

  const initialFormState = {
    name: '',
    eventCode: '',
    venue: '',
    description: '',
    startsAt: '',
    endsAt: '',
    timezone: detectedTz,
    activationPolicy: 'SELF_SERVICE',
    checkInPolicy: 'SINGLE_ENTRY',
    maximumPasses: '',
    activationStartsAt: '',
    activationEndsAt: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showScheduledDates, setShowScheduledDates] = useState(false);

  // Initialize or populate form on modal open
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';

      if (event) {
        setFormData({
          name: event.name || '',
          eventCode: event.eventCode || '',
          venue: event.venue || '',
          description: event.description || '',
          startsAt: convertISOToDateTimeLocal(event.startsAt),
          endsAt: convertISOToDateTimeLocal(event.endsAt),
          timezone: event.timezone || detectedTz,
          activationPolicy: event.activationPolicy || 'SELF_SERVICE',
          checkInPolicy: event.checkInPolicy || 'SINGLE_ENTRY',
          maximumPasses: event.maximumPasses != null ? String(event.maximumPasses) : '',
          activationStartsAt: convertISOToDateTimeLocal(event.activationStartsAt),
          activationEndsAt: convertISOToDateTimeLocal(event.activationEndsAt),
        });
        setShowScheduledDates(
          event.activationPolicy === 'SCHEDULED' ||
          Boolean(event.activationStartsAt || event.activationEndsAt)
        );
      } else {
        setFormData({
          ...initialFormState,
          timezone: detectedTz,
        });
        setShowScheduledDates(false);
      }

      setErrors({});
      setGeneralError(null);
      setIsDirty(false);
      setIsSubmitting(false);

      // Focus first input after modal renders
      setTimeout(() => {
        if (firstInputRef.current) {
          firstInputRef.current.focus();
        }
      }, 50);
    } else {
      document.body.style.overflow = '';
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, event]);

  // Handle Escape key to close modal safely
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen || isSubmitting) return;
      if (e.key === 'Escape') {
        handleCloseAttempt();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, isDirty]);

  const handleCloseAttempt = () => {
    if (isSubmitting) return;
    if (isDirty) {
      const confirmDiscard = window.confirm('You have unsaved changes. Are you sure you want to discard them?');
      if (!confirmDiscard) return;
    }
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIsDirty(true);
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'eventCode' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : value,
    }));

    // Clear only this field's error when user updates it
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    // Auto-expand activation window fields if scheduled policy selected
    if (name === 'activationPolicy' && value === 'SCHEDULED') {
      setShowScheduledDates(true);
    }
  };

  const validate = () => {
    const newErrors = {};

    // 1. Name validation (required, max 200)
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = 'Event name is required';
    } else if (trimmedName.length > 200) {
      newErrors.name = 'Event name must not exceed 200 characters';
    }

    // 2. Event Code validation (optional, 2-20 uppercase alphanumeric)
    const trimmedCode = formData.eventCode.trim();
    if (trimmedCode) {
      if (trimmedCode.length < 2 || trimmedCode.length > 20) {
        newErrors.eventCode = 'Event code must be 2 to 20 uppercase alphanumeric characters';
      } else if (!/^[A-Z0-9]{2,20}$/.test(trimmedCode)) {
        newErrors.eventCode = 'Event code must contain only uppercase letters and digits (A-Z, 0-9)';
      }
    }

    // 3. Venue validation (max 300)
    if (formData.venue && formData.venue.trim().length > 300) {
      newErrors.venue = 'Venue must not exceed 300 characters';
    }

    // 4. Description validation (max 2000)
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must not exceed 2000 characters';
    }

    // 5. Schedule validation
    if (!formData.startsAt) {
      newErrors.startsAt = 'Start date and time is required';
    }
    if (!formData.endsAt) {
      newErrors.endsAt = 'End date and time is required';
    }

    if (formData.startsAt && formData.endsAt) {
      const startMs = new Date(formData.startsAt).getTime();
      const endMs = new Date(formData.endsAt).getTime();
      if (isNaN(startMs)) {
        newErrors.startsAt = 'Invalid start date format';
      }
      if (isNaN(endMs)) {
        newErrors.endsAt = 'Invalid end date format';
      }
      if (!isNaN(startMs) && !isNaN(endMs) && endMs < startMs) {
        newErrors.endsAt = 'End date & time must be after start date & time';
      }
    }

    // 6. Timezone validation
    if (!formData.timezone || !formData.timezone.trim()) {
      newErrors.timezone = 'Please select a timezone';
    }

    // 7. Maximum Passes validation (optional, integer 1 to 100,000)
    if (formData.maximumPasses !== '' && formData.maximumPasses != null) {
      const parsedPasses = parseInt(formData.maximumPasses, 10);
      if (isNaN(parsedPasses) || parsedPasses < 1) {
        newErrors.maximumPasses = 'Maximum passes must be at least 1';
      } else if (parsedPasses > 100000) {
        newErrors.maximumPasses = 'Maximum passes cannot exceed 100,000';
      }
    }

    // 8. Activation Window validation
    if (formData.activationPolicy === 'SCHEDULED') {
      if (!formData.activationStartsAt) {
        newErrors.activationStartsAt = 'Activation start date is required for Scheduled activation';
      }
      if (!formData.activationEndsAt) {
        newErrors.activationEndsAt = 'Activation end date is required for Scheduled activation';
      }
    }

    if (formData.activationStartsAt && formData.activationEndsAt) {
      const actStartMs = new Date(formData.activationStartsAt).getTime();
      const actEndMs = new Date(formData.activationEndsAt).getTime();
      if (!isNaN(actStartMs) && !isNaN(actEndMs) && actEndMs < actStartMs) {
        newErrors.activationEndsAt = 'Activation end must be after activation start';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to the first error input
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Build clean payload strictly matching backend CreateEventRequest
      const payload = {
        name: formData.name.trim(),
        eventCode: formData.eventCode.trim() ? formData.eventCode.trim().toUpperCase() : null,
        venue: formData.venue.trim() || null,
        description: formData.description.trim() || null,
        startsAt: new Date(formData.startsAt).toISOString(),
        endsAt: new Date(formData.endsAt).toISOString(),
        timezone: formData.timezone || 'UTC',
        activationPolicy: formData.activationPolicy || 'SELF_SERVICE',
        checkInPolicy: formData.checkInPolicy || 'SINGLE_ENTRY',
        maximumPasses: formData.maximumPasses !== '' && formData.maximumPasses != null
          ? parseInt(formData.maximumPasses, 10)
          : null,
        activationStartsAt: formData.activationStartsAt
          ? new Date(formData.activationStartsAt).toISOString()
          : null,
        activationEndsAt: formData.activationEndsAt
          ? new Date(formData.activationEndsAt).toISOString()
          : null,
      };

      // Call parent onSave which performs the actual API call
      await onSave(payload);

      // On success: clear form, mark clean, and close
      setFormData(initialFormState);
      setErrors({});
      setIsDirty(false);
      onClose();
    } catch (err) {
      // NEVER wipe form state on error! Keep formData intact.
      console.error('Event creation submission failed:', err);

      const status = err.status || err.response?.status;
      const errorCode = err.error || err.response?.data?.error;
      const message = err.message || err.response?.data?.message || 'Failed to save event. Please check inputs and try again.';
      const backendFieldErrors = err.fieldErrors || err.response?.data?.fieldErrors;

      const newErrors = {};

      if (backendFieldErrors && typeof backendFieldErrors === 'object') {
        Object.entries(backendFieldErrors).forEach(([field, msg]) => {
          newErrors[field] = msg;
        });
      }

      // Handle duplicate event code specifically
      if (
        errorCode === 'DUPLICATE_RESOURCE' ||
        (message && message.toLowerCase().includes('event code'))
      ) {
        newErrors.eventCode = message || 'This event code is already in use. Please enter a different code.';
      }

      // Handle specific invalid request messages
      if (message && message.toLowerCase().includes('end date and time must be after start')) {
        newErrors.endsAt = message;
      }
      if (message && message.toLowerCase().includes('activation window end date must be after start')) {
        newErrors.activationEndsAt = message;
      }

      setErrors(newErrors);

      // Provide a clean, user-friendly general error banner if there are unmapped errors or general failures
      if (status === 401) {
        setGeneralError('Your session has expired. Please log in again to continue.');
      } else if (status === 403) {
        setGeneralError('Access Denied: You do not have permission to create or edit events.');
      } else if (Object.keys(newErrors).length === 0) {
        setGeneralError(message);
      } else {
        setGeneralError('Please review and correct the highlighted fields below.');
      }

      // Scroll to the first error
      const firstKey = Object.keys(newErrors)[0];
      if (firstKey) {
        const el = document.getElementById(firstKey);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseAttempt();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 transform transition-all duration-200"
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="flex-shrink-0 px-6 py-5 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg sm:text-xl font-bold tracking-tight">
                {event ? 'Edit Event' : 'Create New Event'}
              </h2>
              <p className="text-xs text-purple-100/90 mt-0.5">
                Configure event details, schedules, and pass registration settings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseAttempt}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= MODAL BODY (SCROLLABLE) ================= */}
        <form id="event-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* General Error Banner */}
          {generalError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">
                <span className="font-semibold block text-red-900">Submission Notice</span>
                <span>{generalError}</span>
              </div>
              <button
                type="button"
                onClick={() => setGeneralError(null)}
                className="text-red-500 hover:text-red-700 p-0.5"
                aria-label="Dismiss error notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* SECTION A — EVENT DETAILS */}
          <div className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 text-xs font-bold text-gray-800 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Section A — Event Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Event Name */}
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <input
                    ref={firstInputRef}
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Renaissance Coffee Festival 2026"
                    maxLength={200}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={`w-full text-sm rounded-lg transition-colors border ${errors.name
                        ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-300 bg-white text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 hover:border-gray-400'
                      } pl-10 pr-3.5 py-2.5 shadow-xs`}
                  />
                </div>
                {errors.name && (
                  <p id="name-error" className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Event Code */}
              <div>
                <label htmlFor="eventCode" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Event Code <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Hash className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="eventCode"
                    name="eventCode"
                    value={formData.eventCode}
                    onChange={handleChange}
                    placeholder="e.g. RCF26"
                    maxLength={20}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.eventCode}
                    aria-describedby={errors.eventCode ? 'eventCode-error' : 'eventCode-helper'}
                    className={`w-full font-mono text-sm uppercase rounded-lg transition-colors border ${errors.eventCode
                        ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-300 bg-white text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 hover:border-gray-400'
                      } pl-10 pr-3.5 py-2.5 shadow-xs`}
                  />
                </div>
                {errors.eventCode ? (
                  <p id="eventCode-error" className="mt-1 text-xs text-red-600 font-medium">
                    {errors.eventCode}
                  </p>
                ) : (
                  <p id="eventCode-helper" className="mt-1 text-[11px] text-gray-500">
                    2–20 alphanumeric chars. Leave empty to auto-generate.
                  </p>
                )}
              </div>

              {/* Venue */}
              <div>
                <label htmlFor="venue" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Venue <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    id="venue"
                    name="venue"
                    value={formData.venue}
                    onChange={handleChange}
                    placeholder="e.g. Convention Hall, Indore"
                    maxLength={300}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.venue}
                    className={`w-full text-sm rounded-lg transition-colors border ${errors.venue
                        ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-300 bg-white text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 hover:border-gray-400'
                      } pl-10 pr-3.5 py-2.5 shadow-xs`}
                  />
                </div>
                {errors.venue && (
                  <p id="venue-error" className="mt-1 text-xs text-red-600 font-medium">
                    {errors.venue}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Description <span className="text-gray-400 font-normal lowercase">(optional)</span>
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {formData.description.length} / 2000
                  </span>
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  maxLength={2000}
                  disabled={isSubmitting}
                  placeholder="Provide brief details about this event..."
                  className={`w-full text-sm rounded-lg transition-colors border ${errors.description
                      ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 bg-white text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 hover:border-gray-400'
                    } p-3 shadow-xs resize-y min-h-[72px]`}
                />
                {errors.description && (
                  <p id="description-error" className="mt-1 text-xs text-red-600 font-medium">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION B — EVENT SCHEDULE */}
          <div className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 text-xs font-bold text-gray-800 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Section B — Event Schedule & Timezone</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date & Time */}
              <div>
                <label htmlFor="startsAt" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <input
                    type="datetime-local"
                    id="startsAt"
                    name="startsAt"
                    value={formData.startsAt}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.startsAt}
                    aria-describedby={errors.startsAt ? 'startsAt-error' : undefined}
                    className={`w-full text-sm rounded-lg transition-colors border ${errors.startsAt
                        ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-300 bg-white text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 hover:border-gray-400'
                      } pl-10 pr-3.5 py-2.5 shadow-xs`}
                  />
                </div>
                {errors.startsAt && (
                  <p id="startsAt-error" className="mt-1 text-xs text-red-600 font-medium">
                    {errors.startsAt}
                  </p>
                )}
              </div>

              {/* End Date & Time */}
              <div>
                <label htmlFor="endsAt" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
                  End Date & Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <input
                    type="datetime-local"
                    id="endsAt"
                    name="endsAt"
                    value={formData.endsAt}
                    onChange={handleChange}
                    min={formData.startsAt || undefined}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.endsAt}
                    aria-describedby={errors.endsAt ? 'endsAt-error' : undefined}
                    className={`w-full text-sm rounded-lg transition-colors border ${errors.endsAt
                        ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-300 bg-white text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 hover:border-gray-400'
                      } pl-10 pr-3.5 py-2.5 shadow-xs`}
                  />
                </div>
                {errors.endsAt && (
                  <p id="endsAt-error" className="mt-1 text-xs text-red-600 font-medium">
                    {errors.endsAt}
                  </p>
                )}
              </div>

              {/* Timezone */}
              <div className="sm:col-span-2">
                <label htmlFor="timezone" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Event Timezone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Globe className="h-4 w-4" />
                  </div>
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full text-sm rounded-lg transition-colors border border-gray-300 bg-white text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 pl-10 pr-3.5 py-2.5 shadow-xs"
                  >
                    {timezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  Sequential event days (Day 1, Day 2) are automatically derived according to this timezone.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION C — REGISTRATION SETTINGS */}
          <div className="bg-gray-50/70 border border-gray-200/80 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200 text-xs font-bold text-gray-800 uppercase tracking-wider">
              <Settings className="w-4 h-4 text-purple-600" />
              <span>Section C — Pass & Registration Policies</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Activation Policy */}
              <div>
                <label htmlFor="activationPolicy" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Activation Policy
                </label>
                <select
                  id="activationPolicy"
                  name="activationPolicy"
                  value={formData.activationPolicy}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full text-sm rounded-lg transition-colors border border-gray-300 bg-white text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 px-3.5 py-2.5 shadow-xs"
                >
                  <option value="SELF_SERVICE">Self Service — Attendee scans QR & fills form</option>
                  <option value="ADMIN_ONLY">Admin Only — Staff manual activation</option>
                  <option value="SCHEDULED">Scheduled Window — Restricted activation period</option>
                </select>
              </div>

              {/* Check-In Policy */}
              <div>
                <label htmlFor="checkInPolicy" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Check-in Policy
                </label>
                <select
                  id="checkInPolicy"
                  name="checkInPolicy"
                  value={formData.checkInPolicy}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full text-sm rounded-lg transition-colors border border-gray-300 bg-white text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 px-3.5 py-2.5 shadow-xs"
                >
                  <option value="SINGLE_ENTRY">Single Entry — One check-in per day</option>
                  <option value="MULTI_ENTRY">Multi Entry — Multiple gate entries permitted</option>
                </select>
              </div>

              {/* Maximum Passes */}
              <div className="sm:col-span-2">
                <label htmlFor="maximumPasses" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Maximum Passes Cap <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Ticket className="h-4 w-4" />
                  </div>
                  <input
                    type="number"
                    id="maximumPasses"
                    name="maximumPasses"
                    value={formData.maximumPasses}
                    onChange={handleChange}
                    placeholder="e.g. 500 (leave blank for unlimited)"
                    min={1}
                    max={100000}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.maximumPasses}
                    aria-describedby={errors.maximumPasses ? 'maximumPasses-error' : undefined}
                    className={`w-full text-sm rounded-lg transition-colors border ${errors.maximumPasses
                        ? 'border-red-400 bg-red-50/30 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-300 bg-white text-gray-900 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 hover:border-gray-400'
                      } pl-10 pr-3.5 py-2.5 shadow-xs`}
                  />
                </div>
                {errors.maximumPasses && (
                  <p id="maximumPasses-error" className="mt-1 text-xs text-red-600 font-medium">
                    {errors.maximumPasses}
                  </p>
                )}
              </div>
            </div>

            {/* Optional Activation Window Expandable */}
            <div className="pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowScheduledDates(!showScheduledDates)}
                className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1.5"
              >
                <span>{showScheduledDates ? '− Hide' : '+ Configure'} Activation Time Window</span>
                <span className="text-[11px] text-gray-500 font-normal">
                  (restricts when attendees can scan and activate passes)
                </span>
              </button>

              {showScheduledDates && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-purple-100 bg-purple-50/40 p-3.5 rounded-lg border">
                  <div>
                    <label htmlFor="activationStartsAt" className="block mb-1 text-[11px] font-semibold text-gray-700 uppercase">
                      Activation Window Opens
                    </label>
                    <input
                      type="datetime-local"
                      id="activationStartsAt"
                      name="activationStartsAt"
                      value={formData.activationStartsAt}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={`w-full text-xs rounded-lg border ${errors.activationStartsAt ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                        } px-3 py-2 shadow-xs`}
                    />
                    {errors.activationStartsAt && (
                      <p className="mt-1 text-xs text-red-600 font-medium">{errors.activationStartsAt}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="activationEndsAt" className="block mb-1 text-[11px] font-semibold text-gray-700 uppercase">
                      Activation Window Closes
                    </label>
                    <input
                      type="datetime-local"
                      id="activationEndsAt"
                      name="activationEndsAt"
                      value={formData.activationEndsAt}
                      onChange={handleChange}
                      min={formData.activationStartsAt || undefined}
                      disabled={isSubmitting}
                      className={`w-full text-xs rounded-lg border ${errors.activationEndsAt ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                        } px-3 py-2 shadow-xs`}
                    />
                    {errors.activationEndsAt && (
                      <p className="mt-1 text-xs text-red-600 font-medium">{errors.activationEndsAt}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* ================= MODAL FOOTER ================= */}
        <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="text-[11px] text-gray-500 hidden sm:block">
            <span className="text-red-500 font-bold">*</span> Mandatory fields
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCloseAttempt}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-gray-300 bg-white rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-xs disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="event-form"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{event ? 'Updating Event...' : 'Creating Event...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{event ? 'Update Event' : 'Create Event'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAndEditEvents;
