import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Ticket,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Clock,
  RefreshCw,
  Search,
} from 'lucide-react';
import passService from '../../Api-Services/passService';

const parseRawInput = (input) => {
  if (!input) return '';
  const trimmed = input.trim();

  // JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed.passNumber || parsed.token || parsed.rawToken || parsed.passId || trimmed;
    } catch {}
  }

  // URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('/activate') || trimmed.includes('/pass/')) {
    try {
      const url = new URL(trimmed, window.location.origin);
      const queryPass = url.searchParams.get('passNumber') ||
                        url.searchParams.get('token') ||
                        url.searchParams.get('rawToken') ||
                        url.searchParams.get('passId');
      if (queryPass) return queryPass;

      const parts = url.pathname.split('/').filter(Boolean);
      const actIdx = parts.indexOf('activate');
      if (actIdx !== -1 && parts[actIdx + 1]) {
        return decodeURIComponent(parts[actIdx + 1]);
      }
      const passIdx = parts.indexOf('pass');
      if (passIdx !== -1 && parts[passIdx + 1]) {
        return decodeURIComponent(parts[passIdx + 1]);
      }
    } catch {}
  }

  return trimmed;
};

const ActivatePass = () => {
  const { token: routeToken } = useParams();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token') ||
                     searchParams.get('passNumber') ||
                     searchParams.get('passId') ||
                     searchParams.get('rawToken');
  const navigate = useNavigate();

  const rawParamToken = routeToken || queryToken || '';
  const initialToken = parseRawInput(rawParamToken);

  const [inputToken, setInputToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [passData, setPassData] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [isActivatedSuccess, setIsActivatedSuccess] = useState(false);
  const [activationResult, setActivationResult] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    organization: '',
    designation: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (initialToken) {
      setInputToken(initialToken);
      validateScannedToken(initialToken);
    }
  }, [initialToken]);

  const validateScannedToken = async (rawTokenToValidate) => {
    const cleanToken = parseRawInput(rawTokenToValidate);
    if (!cleanToken) return;

    setValidating(true);
    setValidationError(null);
    setPassData(null);
    setIsActivatedSuccess(false);

    try {
      const response = await passService.validatePass(cleanToken);
      const data = response.data || response;
      setPassData(data);

      if (!data.valid) {
        setValidationError(data.message || 'Pass token is invalid.');
      } else if (!data.isEligibleForActivation) {
        setValidationError(data.message || 'Pass is not eligible for activation.');
      }
    } catch (err) {
      const errorMsg =
        err.message ||
        err.response?.data?.message ||
        'Unable to validate pass token. Please ensure the QR code is correct.';
      setValidationError(errorMsg);
    } finally {
      setValidating(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    const cleanToken = parseRawInput(inputToken);
    if (!cleanToken) {
      toast.error('Please enter a pass identifier or scan a valid QR code');
      return;
    }
    navigate(`/activate/${encodeURIComponent(cleanToken)}`);
    validateScannedToken(cleanToken);
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
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
    } else if (!/^\+?[0-9]{7,15}$/.test(formData.mobileNumber.trim())) {
      errors.mobileNumber = 'Please enter a valid mobile number (7 to 15 digits)';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (!passData?.eventId) {
      toast.error('Event details missing. Please refresh and try again.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        rawToken: passData.passNumber || inputToken.trim(),
        eventId: passData.eventId,
        attendeeFullName: formData.fullName.trim(),
        attendeeEmail: formData.email.trim().toLowerCase(),
        attendeeMobileNumber: formData.mobileNumber.trim(),
        attendeeOrganization: formData.organization?.trim() || null,
        attendeeDesignation: formData.designation?.trim() || null,
      };

      const response = await passService.activatePass(payload);
      const resData = response.data || response;
      setActivationResult(resData);
      setIsActivatedSuccess(true);
      toast.success('Your event pass has been successfully activated!');
    } catch (err) {
      // Preserve form data on error
      if (err.errors && typeof err.errors === 'object') {
        setFormErrors(err.errors);
      }
      const message =
        err.message ||
        err.response?.data?.message ||
        'Failed to activate pass. It may already be activated or expired.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-6 sm:p-8 text-center relative">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Ticket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Event Pass Activation</h1>
          <p className="text-purple-200 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            Link your personal attendee profile to your official event badge to enable gate entry.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Manual Token Search Bar (Shown when no token or searching another) */}
          {!initialToken && (
            <form onSubmit={handleManualSearch} className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">
                Enter Pass Identifier or Token
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="e.g. TEST123-SZ83KSCE-0001"
                  className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <Search className="w-4 h-4" /> Verify
                </button>
              </div>
            </form>
          )}

          {/* Validating State */}
          {validating && (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 space-y-2">
              <Loader2 className="w-9 h-9 animate-spin text-purple-600" />
              <p className="text-sm font-semibold text-gray-700">Validating pass badge...</p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {isActivatedSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Pass Activated!</h2>
                <p className="text-xs text-emerald-700 mt-1">Admission Registration Confirmed</p>
              </div>

              <p className="text-xs text-gray-600 max-w-sm mx-auto">
                This pass has been registered to <strong className="text-gray-900">{formData.fullName}</strong>.
                A confirmation has been sent to <strong>{formData.email}</strong>.
              </p>

              <div className="bg-white rounded-xl p-4 shadow-xs border border-emerald-100 text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between items-center border-b pb-1.5">
                  <span className="text-gray-500">Pass Number:</span>
                  <span className="font-mono font-bold text-purple-700 text-sm">{passData?.passNumber}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-1.5">
                  <span className="text-gray-500">Event:</span>
                  <span className="font-semibold text-gray-900">{passData?.eventName}</span>
                </div>
                {passData?.venue && (
                  <div className="flex justify-between items-center border-b pb-1.5">
                    <span className="text-gray-500">Venue:</span>
                    <span className="text-gray-700">{passData.venue}</span>
                  </div>
                )}
                {passData?.validDays && passData.validDays.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Valid Days:</span>
                    <span className="text-purple-600 font-semibold">
                      {passData.validDays.map((d) => d.label || `Day ${d.dayNumber}`).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-gray-500 pt-2">
                Present this physical pass card or your confirmation email to the gatekeeper on event day.
              </p>
            </div>
          )}

          {/* PASS STATUS NOTICE (ALREADY ACTIVATED, REVOKED, OR INVALID) */}
          {!validating && !isActivatedSuccess && validationError && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-rose-900 text-sm">Pass Status Notice</h3>
                    <p className="text-rose-700 text-xs mt-1 leading-relaxed">{validationError}</p>
                  </div>
                </div>

                {passData && (
                  <div className="mt-4 pt-3 border-t border-rose-200 text-xs text-gray-700 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pass Number:</span>
                      <span className="font-mono font-bold">{passData.passNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Event:</span>
                      <span className="font-medium">{passData.eventName} ({passData.eventCode})</span>
                    </div>
                    {passData.attendeeName && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Claimed By:</span>
                        <span className="font-semibold text-purple-700">{passData.attendeeName}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    setPassData(null);
                    setInputToken('');
                    navigate('/activate');
                  }}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition underline"
                >
                  Scan or enter another pass
                </button>
              </div>
            </div>
          )}

          {/* ELIGIBLE PASS ACTIVATION FORM */}
          {!validating && !isActivatedSuccess && passData && passData.isEligibleForActivation && (
            <div className="space-y-6">
              {/* Event Badge Summary */}
              <div className="bg-purple-50/70 border border-purple-200/60 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
                    Eligible for Activation
                  </span>
                  <span className="font-mono text-xs font-bold text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-200">
                    {passData.passNumber}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900">{passData.eventName}</h3>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  {passData.venue && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      <span>{passData.venue}</span>
                    </div>
                  )}
                  {passData.startsAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      <span>{formatDate(passData.startsAt)}</span>
                    </div>
                  )}
                </div>

                {passData.validDays && passData.validDays.length > 0 && (
                  <div className="pt-2 border-t border-purple-200/60 text-xs text-gray-600 flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium">Valid Days:</span>
                    {passData.validDays.map((d) => (
                      <span key={d.id} className="bg-white border border-purple-200 text-purple-800 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                        {d.label || `Day ${d.dayNumber}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Alice Smith"
                      className="w-full pl-9 pr-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {formErrors.fullName && (
                    <span className="text-[11px] text-rose-500 mt-1 block">{formErrors.fullName}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="alice@example.com"
                        className="w-full pl-9 pr-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    {formErrors.email && (
                      <span className="text-[11px] text-rose-500 mt-1 block">{formErrors.email}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        placeholder="10-digit number"
                        className="w-full pl-9 pr-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    {formErrors.mobileNumber && (
                      <span className="text-[11px] text-rose-500 mt-1 block">{formErrors.mobileNumber}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Organization / Company (Optional)
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        placeholder="e.g. Acme Corp"
                        className="w-full pl-9 pr-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Designation / Role (Optional)
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                        placeholder="e.g. Developer, Guest"
                        className="w-full pl-9 pr-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Activating Pass...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Activate & Claim Pass</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-center text-gray-400">
                  By activating, this physical pass badge will be permanently linked to your profile.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivatePass;
