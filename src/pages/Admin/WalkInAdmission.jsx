import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Calendar,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Loader2,
  Mail,
  Phone,
  User,
  Building,
  Briefcase,
  Ticket,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import eventsService from '../../Api-Services/eventsService';
import categoryService from '../../Api-Services/categoryService';

const WalkInAdmission = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [eventDays, setEventDays] = useState([]);
  const [selectedDayId, setSelectedDayId] = useState('');

  const [walkInCategories, setWalkInCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [currentSchema, setCurrentSchema] = useState(null);

  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState({
    attendeeFullName: '',
    attendeeEmail: '',
    attendeeMobileNumber: '',
    attendeeOrganization: '',
    attendeeDesignation: ''
  });
  const [dynamicAnswers, setDynamicAnswers] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Success view state
  const [admissionResult, setAdmissionResult] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await eventsService.getEvents(0, 100);
      const list = res.data?.content || [];
      setEvents(list);
      if (list.length > 0) {
        setSelectedEventId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      toast.error('Failed to load events list');
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      const ev = events.find((e) => e.id === selectedEventId);
      setSelectedEvent(ev || null);
      loadEventDaysAndCategories(selectedEventId);
    } else {
      setSelectedEvent(null);
      setEventDays([]);
      setWalkInCategories([]);
      setSelectedDayId('');
      setSelectedCategoryId('');
    }
  }, [selectedEventId]);

  const loadEventDaysAndCategories = async (eventId) => {
    setLoadingCategories(true);
    try {
      const [daysRes, catRes] = await Promise.all([
        eventsService.getEventDays(eventId),
        categoryService.getWalkInCategories(eventId)
      ]);

      const days = daysRes.data || [];
      setEventDays(days);
      if (days.length > 0) {
        setSelectedDayId(days[0].id);
      } else {
        setSelectedDayId('');
      }

      const cats = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.content || []);
      setWalkInCategories(cats);
      if (cats.length > 0) {
        setSelectedCategoryId(cats[0].passCategoryId);
      } else {
        setSelectedCategoryId('');
      }
    } catch (err) {
      console.error('Failed to load event data:', err);
      toast.error('Failed to load event details or categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (selectedCategoryId && walkInCategories.length > 0) {
      const cat = walkInCategories.find((c) => c.passCategoryId === selectedCategoryId);
      if (cat && cat.id) {
        loadPublishedSchema(cat.id);
      } else {
        setCurrentSchema(null);
      }
    } else {
      setCurrentSchema(null);
    }
  }, [selectedCategoryId, walkInCategories]);

  const loadPublishedSchema = async (eventCategoryId) => {
    try {
      const res = await categoryService.getPublishedSchema(eventCategoryId);
      setCurrentSchema(res.data || null);
    } catch (err) {
      // Schema may not be published yet (default fields)
      setCurrentSchema(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!selectedEventId) errors.event = 'Please select an event';
    if (!selectedDayId && eventDays.length > 0) errors.day = 'Please select an active check-in day';
    if (!selectedCategoryId) errors.category = 'Please select a walk-in pass category';

    if (!formData.attendeeFullName.trim()) {
      errors.attendeeFullName = 'Attendee full name is required';
    }
    if (!formData.attendeeEmail.trim()) {
      errors.attendeeEmail = 'Attendee email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.attendeeEmail.trim())) {
      errors.attendeeEmail = 'Please enter a valid email address';
    }

    if (currentSchema?.fields) {
      currentSchema.fields.forEach((field) => {
        if (field.required && field.visible !== false) {
          const val = dynamicAnswers[field.fieldKey];
          if (val === undefined || val === null || val === '') {
            errors[field.fieldKey] = `${field.label} is required`;
          }
        }
      });
    }

    return errors;
  };

  const handleAdmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        eventId: selectedEventId,
        eventDayId: selectedDayId || null,
        passCategoryId: selectedCategoryId,
        attendeeFullName: formData.attendeeFullName.trim(),
        attendeeEmail: formData.attendeeEmail.trim().toLowerCase(),
        attendeeMobileNumber: formData.attendeeMobileNumber.trim() || null,
        attendeeOrganization: formData.attendeeOrganization.trim() || null,
        attendeeDesignation: formData.attendeeDesignation.trim() || null,
        answers: Object.keys(dynamicAnswers).length > 0 ? dynamicAnswers : null
      };

      const res = await categoryService.admitWalkIn(payload);
      setAdmissionResult(res.data || res);
      toast.success('Attendee admitted and checked in successfully!');
    } catch (err) {
      console.error('Walk-in admission failed:', err);
      toast.error(err.message || 'Admission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForNext = () => {
    setAdmissionResult(null);
    setFormData({
      attendeeFullName: '',
      attendeeEmail: '',
      attendeeMobileNumber: '',
      attendeeOrganization: '',
      attendeeDesignation: ''
    });
    setDynamicAnswers({});
    setFormErrors({});
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">On-Site Walk-In Admission</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Rapid on-site attendee registration and single-action gate check-in
            </p>
          </div>
        </div>

        <button
          onClick={() => selectedEventId && loadEventDaysAndCategories(selectedEventId)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          title="Refresh Form Data"
        >
          <RefreshCw className={`w-4 h-4 ${loadingCategories ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ADMISSION SUCCESS SCREEN */}
      {admissionResult ? (
        <div className="bg-white rounded-2xl p-8 border border-emerald-200 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-12 h-12" />
          </div>

          <div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider">
              Admission Confirmed & Checked In
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">
              {admissionResult.attendeeFullName}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{admissionResult.attendeeEmail}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 max-w-md mx-auto text-left text-sm space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Allocated Pass Number:</span>
              <span className="font-mono font-bold text-indigo-700 text-base">
                {admissionResult.passNumber}
              </span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Pass Category:</span>
              <span className="font-semibold text-gray-900">
                {admissionResult.categoryCode}
              </span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Event:</span>
              <span className="font-semibold text-gray-900">
                {admissionResult.eventCode} — {admissionResult.eventName}
              </span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Checked-In Day:</span>
              <span className="font-bold text-emerald-700">
                Day {admissionResult.dayNumber || 1}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Check-In Timestamp:</span>
              <span className="text-gray-600 text-xs">
                {new Date(admissionResult.checkedInAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleResetForNext}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 mx-auto text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Admit Next Walk-In Attendee</span>
            </button>
          </div>
        </div>
      ) : (
        /* ADMISSION ENTRY FORM */
        <form onSubmit={handleAdmit} className="space-y-6">
          {/* Step 1: Event & Category Configuration */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              1. Event & Category Selection
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Event Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Event *
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.code})
                    </option>
                  ))}
                </select>
                {formErrors.event && (
                  <span className="text-xs text-rose-500 mt-1 block">{formErrors.event}</span>
                )}
              </div>

              {/* Event Day */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Active Check-In Day *
                </label>
                <select
                  value={selectedDayId}
                  onChange={(e) => setSelectedDayId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {eventDays.length === 0 ? (
                    <option value="">Single Day Admission</option>
                  ) : (
                    eventDays.map((d) => (
                      <option key={d.id} value={d.id}>
                        Day {d.dayNumber}: {d.eventDate || d.label}
                      </option>
                    ))
                  )}
                </select>
                {formErrors.day && (
                  <span className="text-xs text-rose-500 mt-1 block">{formErrors.day}</span>
                )}
              </div>

              {/* Walk-In Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Walk-In Pass Category *
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {walkInCategories.length === 0 ? (
                    <option value="">No Walk-In Categories Configured</option>
                  ) : (
                    walkInCategories.map((c) => (
                      <option key={c.passCategoryId} value={c.passCategoryId}>
                        {c.passCategoryName} ({c.passCategoryCode})
                      </option>
                    ))
                  )}
                </select>
                {walkInCategories.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Please enable a category with NO_QR_WALK_IN mode on this event first.
                  </p>
                )}
                {formErrors.category && (
                  <span className="text-xs text-rose-500 mt-1 block">{formErrors.category}</span>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Attendee Details */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              2. Attendee Registration Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="attendeeFullName"
                    value={formData.attendeeFullName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    className={`w-full pl-9 pr-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      formErrors.attendeeFullName
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                {formErrors.attendeeFullName && (
                  <span className="text-xs text-rose-500 mt-1 block">
                    {formErrors.attendeeFullName}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    name="attendeeEmail"
                    value={formData.attendeeEmail}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className={`w-full pl-9 pr-3.5 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                      formErrors.attendeeEmail
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-gray-300 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                {formErrors.attendeeEmail && (
                  <span className="text-xs text-rose-500 mt-1 block">
                    {formErrors.attendeeEmail}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    name="attendeeMobileNumber"
                    value={formData.attendeeMobileNumber}
                    onChange={handleChange}
                    placeholder="+919876543210"
                    className="w-full pl-9 pr-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Organization / Company
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="attendeeOrganization"
                    value={formData.attendeeOrganization}
                    onChange={handleChange}
                    placeholder="e.g. Acme Corp / University"
                    className="w-full pl-9 pr-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Designation / Role
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="attendeeDesignation"
                    value={formData.attendeeDesignation}
                    onChange={handleChange}
                    placeholder="e.g. Guest / Delegate"
                    className="w-full pl-9 pr-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Dynamic Category Questions (if custom schema) */}
            {currentSchema?.fields && currentSchema.fields.length > 0 && (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Category Form Fields (Schema v{currentSchema.versionNumber})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentSchema.fields
                    .filter((f) => f.visible !== false)
                    .map((field) => (
                      <div key={field.fieldKey} className="space-y-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        {['TEXT', 'EMAIL', 'PHONE', 'NUMBER'].includes(field.fieldType) ? (
                          <input
                            type={
                              field.fieldType === 'NUMBER'
                                ? 'number'
                                : field.fieldType === 'EMAIL'
                                ? 'email'
                                : 'text'
                            }
                            placeholder={field.placeholder || ''}
                            value={dynamicAnswers[field.fieldKey] || ''}
                            onChange={(e) => {
                              setDynamicAnswers({
                                ...dynamicAnswers,
                                [field.fieldKey]: e.target.value
                              });
                              if (formErrors[field.fieldKey]) {
                                setFormErrors({ ...formErrors, [field.fieldKey]: null });
                              }
                            }}
                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                              formErrors[field.fieldKey]
                                ? 'border-rose-400 focus:ring-rose-500'
                                : 'border-gray-300 focus:ring-indigo-500'
                            }`}
                          />
                        ) : field.fieldType === 'SELECT' ? (
                          <select
                            value={dynamicAnswers[field.fieldKey] || ''}
                            onChange={(e) => {
                              setDynamicAnswers({
                                ...dynamicAnswers,
                                [field.fieldKey]: e.target.value
                              });
                              if (formErrors[field.fieldKey]) {
                                setFormErrors({ ...formErrors, [field.fieldKey]: null });
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">{field.placeholder || '-- Select an option --'}</option>
                            {field.options?.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder={field.placeholder || ''}
                            value={dynamicAnswers[field.fieldKey] || ''}
                            onChange={(e) =>
                              setDynamicAnswers({
                                ...dynamicAnswers,
                                [field.fieldKey]: e.target.value
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        )}
                        {formErrors[field.fieldKey] && (
                          <span className="text-xs text-rose-500 block">
                            {formErrors[field.fieldKey]}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Submission */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || walkInCategories.length === 0}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Admitting Attendee...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Admit & Check In Attendee</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default WalkInAdmission;

