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
  GraduationCap,
  BookOpen,
  School,
  Hash,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import passService from '../../Api-Services/passService';

/**
 * Public Pass Activation States:
 * - INITIAL: Waiting for visitor to enter pass token manually
 * - LOADING: Validating token against the backend
 * - READY_FOR_ACTIVATION: Valid, unactivated pass ready for attendee details entry
 * - SUBMITTING: Activation transaction in progress
 * - ACTIVATION_SUCCESS: Pass confirmed and linked to attendee
 * - ALREADY_ACTIVATED: Pass is already activated (terminal view)
 * - REVOKED: Pass is revoked (terminal view)
 * - INVALID_PASS: Pass token invalid or not found
 * - ERROR: Server or network error during validation
 */
const PAGE_STATES = {
  INITIAL: 'INITIAL',
  LOADING: 'LOADING',
  READY_FOR_ACTIVATION: 'READY_FOR_ACTIVATION',
  SUBMITTING: 'SUBMITTING',
  ACTIVATION_SUCCESS: 'ACTIVATION_SUCCESS',
  ALREADY_ACTIVATED: 'ALREADY_ACTIVATED',
  REVOKED: 'REVOKED',
  INVALID_PASS: 'INVALID_PASS',
  ERROR: 'ERROR',
};

const parseRawInput = (input) => {
  if (!input) return '';
  const trimmed = input.trim();

  // 1. JSON QR format
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed.passNumber || parsed.token || parsed.rawToken || parsed.passId || trimmed;
    } catch {}
  }

  // 2. Full URL QR format
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.includes('/activate') ||
    trimmed.includes('/pass/')
  ) {
    try {
      const url = new URL(trimmed, window.location.origin);
      const queryPass =
        url.searchParams.get('passNumber') ||
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
  const queryToken =
    searchParams.get('token') ||
    searchParams.get('passNumber') ||
    searchParams.get('passId') ||
    searchParams.get('rawToken');
  const navigate = useNavigate();

  const rawParamToken = routeToken || queryToken || '';
  const initialToken = parseRawInput(rawParamToken);

  // Explicit Page State
  const [pageState, setPageState] = useState(
    initialToken ? PAGE_STATES.LOADING : PAGE_STATES.INITIAL
  );

  const [inputToken, setInputToken] = useState(initialToken);
  const [passData, setPassData] = useState(null);
  const [statusNotice, setStatusNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [activationResult, setActivationResult] = useState(null);

  // Form State: preserves all entered values across errors
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    // Student fields
    college: '',
    course: '',
    yearSemester: '',
    studentId: '',
    // Other fields
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
    if (!cleanToken) {
      setPageState(PAGE_STATES.INITIAL);
      return;
    }

    setPageState(PAGE_STATES.LOADING);
    setErrorMessage(null);
    setSubmitError(null);
    setFormErrors({});
    setPassData(null);

    try {
      const response = await passService.validatePass(cleanToken);
      const data = response?.data || response;
      setPassData(data);

      if (!data || !data.valid) {
        setPageState(PAGE_STATES.INVALID_PASS);
        setErrorMessage(data?.message || 'Pass token is invalid or does not exist.');
        return;
      }

      if (data.status === 'ACTIVATED') {
        setPageState(PAGE_STATES.ALREADY_ACTIVATED);
        setErrorMessage(data.message || 'This pass has already been activated and claimed.');
        return;
      }

      if (data.status === 'REVOKED') {
        setPageState(PAGE_STATES.REVOKED);
        setErrorMessage(data.message || 'This pass has been revoked by event administration.');
        return;
      }

      // Check eligibility (handling both eligibleForActivation and isEligibleForActivation)
      const isEligible = Boolean(
        data.eligibleForActivation ??
        data.isEligibleForActivation ??
        (data.valid && data.status === 'NOT_ACTIVATED')
      );

      if (isEligible) {
        setPageState(PAGE_STATES.READY_FOR_ACTIVATION);
        setStatusNotice(data.message || 'Pass is valid and ready for activation.');
      } else {
        setPageState(PAGE_STATES.ERROR);
        setErrorMessage(data.message || 'Pass is not eligible for activation.');
      }
    } catch (err) {
      console.error('Validation error:', err);
      const msg =
        err.message ||
        err.response?.data?.message ||
        'Unable to validate pass badge. Please ensure the QR code is correct.';
      setPageState(PAGE_STATES.INVALID_PASS);
      setErrorMessage(msg);
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
    if (submitError) {
      setSubmitError(null);
    }
  };

  const isStudent = passData?.category === 'STUDENT';

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

    if (isStudent) {
      if (!formData.college.trim()) {
        errors.college = 'College or institution name is required';
      }
      if (!formData.course.trim()) {
        errors.course = 'Course or program name is required';
      }
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

    setPageState(PAGE_STATES.SUBMITTING);
    setSubmitError(null);

    try {
      const payload = {
        rawToken: passData.passNumber || inputToken.trim(),
        eventId: passData.eventId,
        attendeeFullName: formData.fullName.trim(),
        attendeeEmail: formData.email.trim().toLowerCase(),
        attendeeMobileNumber: formData.mobileNumber.trim(),
        // Category specific fields
        attendeeCollege: isStudent ? formData.college.trim() : null,
        attendeeCourse: isStudent ? formData.course.trim() : null,
        attendeeYearSemester: isStudent ? formData.yearSemester?.trim() || null : null,
        attendeeStudentId: isStudent ? formData.studentId?.trim() || null : null,
        attendeeOrganization: isStudent
          ? formData.college.trim()
          : formData.organization?.trim() || null,
        attendeeDesignation: isStudent
          ? formData.designation?.trim() || 'Student'
          : formData.designation?.trim() || null,
      };

      const response = await passService.activatePass(payload);
      const resData = response.data || response;
      setActivationResult(resData);
      setPageState(PAGE_STATES.ACTIVATION_SUCCESS);
      toast.success('Your event pass has been successfully activated!');
    } catch (err) {
      console.error('Activation failure:', err);
      // Return to READY_FOR_ACTIVATION so the form remains open and inputs are preserved
      setPageState(PAGE_STATES.READY_FOR_ACTIVATION);

      const errorMsg =
        err.message ||
        err.response?.data?.message ||
        'Failed to activate pass. It may already be activated or expired.';
      setSubmitError(errorMsg);
      toast.error(errorMsg);

      // If backend validation provides field errors
      if (err.errors && typeof err.errors === 'object') {
        setFormErrors(err.errors);
      }
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
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 px-4 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header Banner */}
        <div
          className={`p-6 sm:p-8 text-center relative text-white ${
            isStudent
              ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800'
              : 'bg-gradient-to-r from-purple-700 via-indigo-800 to-purple-900'
          }`}
        >
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            {isStudent ? (
              <GraduationCap className="w-8 h-8 text-white" />
            ) : (
              <Ticket className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isStudent ? 'Student Pass Registration' : 'Event Pass Activation'}
          </h1>
          <p className="text-purple-100/90 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            {isStudent
              ? 'Complete your verified student registration to link your badge for official campus/event admission.'
              : 'Link your attendee profile to your official event badge to enable secure gate check-in.'}
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* INITIAL STATE: Manual Token Search */}
          {pageState === PAGE_STATES.INITIAL && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-base font-semibold text-gray-800">Scan or Enter Badge Code</h3>
                <p className="text-xs text-gray-500">
                  Scan the QR code on your printed physical badge, or enter the pass identifier below.
                </p>
              </div>

              <form onSubmit={handleManualSearch} className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 block">
                  Pass Identifier or Token
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    placeholder="e.g. TEST123-EPXHJ38Y-0001"
                    className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                  >
                    <Search className="w-4 h-4" /> Verify
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LOADING STATE: Validating Spinner */}
          {pageState === PAGE_STATES.LOADING && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
              <p className="text-sm font-semibold text-gray-700">Validating pass badge...</p>
              <p className="text-xs text-gray-400">Verifying credential status and event eligibility</p>
            </div>
          )}

          {/* ACTIVATION SUCCESS STATE */}
          {pageState === PAGE_STATES.ACTIVATION_SUCCESS && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Pass Activated!</h2>
                <p className="text-xs text-emerald-700 mt-1">Admission Registration Confirmed</p>
              </div>

              <p className="text-xs text-gray-600 max-w-sm mx-auto">
                This pass has been registered to{' '}
                <strong className="text-gray-900">{formData.fullName}</strong>.
                A confirmation has been queued for <strong>{formData.email}</strong>.
              </p>

              <div className="bg-white rounded-xl p-4 shadow-xs border border-emerald-100 text-left text-xs space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between items-center border-b pb-1.5">
                  <span className="text-gray-500">Pass Number:</span>
                  <span className="font-mono font-bold text-purple-700 text-sm">
                    {passData?.passNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-1.5">
                  <span className="text-gray-500">Pass Category:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      isStudent
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {passData?.category || 'STUDENT'}
                  </span>
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
                {isStudent && formData.college && (
                  <div className="flex justify-between items-center border-b pb-1.5">
                    <span className="text-gray-500">College:</span>
                    <span className="text-gray-800 font-medium">{formData.college}</span>
                  </div>
                )}
                {isStudent && formData.course && (
                  <div className="flex justify-between items-center border-b pb-1.5">
                    <span className="text-gray-500">Course:</span>
                    <span className="text-gray-800 font-medium">{formData.course}</span>
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
                Present this pass badge or your confirmation email to the gatekeeper on event day for check-in.
              </p>

              <button
                type="button"
                onClick={() => {
                  setPageState(PAGE_STATES.INITIAL);
                  setPassData(null);
                  setInputToken('');
                  navigate('/activate');
                }}
                className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-semibold rounded-lg transition"
              >
                Activate Another Pass
              </button>
            </div>
          )}

          {/* ALREADY ACTIVATED TERMINAL STATE */}
          {pageState === PAGE_STATES.ALREADY_ACTIVATED && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-950">Pass Already Claimed</h3>
                <p className="text-xs text-blue-700 mt-1">
                  {errorMessage || 'This badge has already been activated and linked to an attendee.'}
                </p>
              </div>

              {passData && (
                <div className="bg-white rounded-xl p-4 border border-blue-100 text-left text-xs space-y-2 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pass Number:</span>
                    <span className="font-mono font-bold text-blue-900">{passData.passNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-semibold text-gray-800">{passData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Event:</span>
                    <span className="font-medium text-gray-800">{passData.eventName}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-blue-800/80 max-w-sm mx-auto">
                If you are the holder of this badge, you do not need to register again. Simply present this badge at the event entrance for admission.
              </p>

              <button
                type="button"
                onClick={() => {
                  setPageState(PAGE_STATES.INITIAL);
                  setPassData(null);
                  setInputToken('');
                  navigate('/activate');
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                Scan or enter another pass
              </button>
            </div>
          )}

          {/* REVOKED TERMINAL STATE */}
          {pageState === PAGE_STATES.REVOKED && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <XCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-rose-950">Pass Revoked</h3>
                <p className="text-xs text-rose-700 mt-1">
                  {errorMessage || 'This pass has been revoked by event administration and cannot be activated.'}
                </p>
              </div>

              {passData && (
                <div className="bg-white rounded-xl p-4 border border-rose-100 text-left text-xs space-y-2 max-w-sm mx-auto">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pass Number:</span>
                    <span className="font-mono font-bold text-rose-900">{passData.passNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Event:</span>
                    <span className="font-medium text-gray-800">{passData.eventName}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-rose-800/80 max-w-sm mx-auto">
                This pass badge is no longer valid for admission. Please contact event support for assistance.
              </p>

              <button
                type="button"
                onClick={() => {
                  setPageState(PAGE_STATES.INITIAL);
                  setPassData(null);
                  setInputToken('');
                  navigate('/activate');
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline"
              >
                Scan or enter another pass
              </button>
            </div>
          )}

          {/* INVALID PASS OR GENERAL ERROR TERMINAL STATE */}
          {(pageState === PAGE_STATES.INVALID_PASS || pageState === PAGE_STATES.ERROR) && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-rose-950">
                  {pageState === PAGE_STATES.INVALID_PASS ? 'Invalid Pass Badge' : 'Activation Notice'}
                </h3>
                <p className="text-xs text-rose-700 mt-1">
                  {errorMessage || 'The scanned pass code could not be resolved or is not eligible for activation.'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPageState(PAGE_STATES.INITIAL);
                    setPassData(null);
                    setInputToken('');
                    navigate('/activate');
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
                >
                  Enter Another Code
                </button>
              </div>
            </div>
          )}

          {/* READY_FOR_ACTIVATION & SUBMITTING STATES: SHOW SUMMARY AND REGISTRATION FORM */}
          {(pageState === PAGE_STATES.READY_FOR_ACTIVATION ||
            pageState === PAGE_STATES.SUBMITTING) &&
            passData && (
              <div className="space-y-6 animate-fade-in">
                {/* 1. Pass Status Notice Card */}
                <div
                  className={`border rounded-xl p-4 space-y-2 ${
                    isStudent
                      ? 'bg-blue-50/70 border-blue-200/60'
                      : 'bg-purple-50/70 border-purple-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 text-white text-[10px] font-black rounded-full uppercase tracking-wider ${
                          isStudent ? 'bg-blue-600' : 'bg-purple-600'
                        }`}
                      >
                        Eligible for Activation
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          isStudent
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-purple-100 text-purple-800 border-purple-300'
                        }`}
                      >
                        {passData.category || 'STUDENT'} CATEGORY
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                      {passData.passNumber}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900">{passData.eventName}</h3>

                  <p className="text-xs text-gray-600 font-medium">
                    {statusNotice || 'Pass is valid and ready for activation.'}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 pt-1">
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
                    <div className="pt-2 border-t border-gray-200/60 text-xs text-gray-600 flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium">Valid Days:</span>
                      {passData.validDays.map((d) => (
                        <span
                          key={d.id}
                          className="bg-white border border-gray-200 text-gray-800 font-semibold px-1.5 py-0.5 rounded text-[10px]"
                        >
                          {d.label || `Day ${d.dayNumber}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Submission Error Notice (if any) */}
                {submitError && (
                  <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <strong className="block font-semibold">Activation Notice</strong>
                      <span>{submitError}</span>
                    </div>
                  </div>
                )}

                {/* 3. Category-Specific Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
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
                        disabled={pageState === PAGE_STATES.SUBMITTING}
                        placeholder={isStudent ? 'e.g. Rahul Sharma' : 'e.g. Alice Smith'}
                        className={`w-full pl-9 pr-3.5 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                          formErrors.fullName
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                            : 'border-gray-300 focus:ring-purple-500'
                        }`}
                      />
                    </div>
                    {formErrors.fullName && (
                      <span className="text-[11px] text-rose-500 mt-1 block">
                        {formErrors.fullName}
                      </span>
                    )}
                  </div>

                  {/* Email & Mobile Number */}
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
                          disabled={pageState === PAGE_STATES.SUBMITTING}
                          placeholder="you@example.com"
                          className={`w-full pl-9 pr-3.5 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                            formErrors.email
                              ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                              : 'border-gray-300 focus:ring-purple-500'
                          }`}
                        />
                      </div>
                      {formErrors.email && (
                        <span className="text-[11px] text-rose-500 mt-1 block">
                          {formErrors.email}
                        </span>
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
                          disabled={pageState === PAGE_STATES.SUBMITTING}
                          placeholder="e.g. +919876543210"
                          className={`w-full pl-9 pr-3.5 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                            formErrors.mobileNumber
                              ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                              : 'border-gray-300 focus:ring-purple-500'
                          }`}
                        />
                      </div>
                      {formErrors.mobileNumber && (
                        <span className="text-[11px] text-rose-500 mt-1 block">
                          {formErrors.mobileNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category-Specific Fields */}
                  {isStudent ? (
                    <>
                      {/* Student: College & Course */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            College / Institution <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <School className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              name="college"
                              value={formData.college}
                              onChange={handleChange}
                              disabled={pageState === PAGE_STATES.SUBMITTING}
                              placeholder="e.g. Delhi University / MIT"
                              className={`w-full pl-9 pr-3.5 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                                formErrors.college
                                  ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                                  : 'border-gray-300 focus:ring-blue-500'
                              }`}
                            />
                          </div>
                          {formErrors.college && (
                            <span className="text-[11px] text-rose-500 mt-1 block">
                              {formErrors.college}
                            </span>
                          )}
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            Course / Program <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              name="course"
                              value={formData.course}
                              onChange={handleChange}
                              disabled={pageState === PAGE_STATES.SUBMITTING}
                              placeholder="e.g. B.Tech Computer Science"
                              className={`w-full pl-9 pr-3.5 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                                formErrors.course
                                  ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                                  : 'border-gray-300 focus:ring-blue-500'
                              }`}
                            />
                          </div>
                          {formErrors.course && (
                            <span className="text-[11px] text-rose-500 mt-1 block">
                              {formErrors.course}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Student Optional Fields: Year/Sem & Student ID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            Year / Semester <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            name="yearSemester"
                            value={formData.yearSemester}
                            onChange={handleChange}
                            disabled={pageState === PAGE_STATES.SUBMITTING}
                            placeholder="e.g. 3rd Year / 6th Sem"
                            className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            Student ID / Roll No <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
                          </label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              name="studentId"
                              value={formData.studentId}
                              onChange={handleChange}
                              disabled={pageState === PAGE_STATES.SUBMITTING}
                              placeholder="e.g. CS2024-042"
                              className="w-full pl-9 pr-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* OTHER Category: Organization & Designation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            Organization / Company <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
                          </label>
                          <div className="relative">
                            <Building className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              name="organization"
                              value={formData.organization}
                              onChange={handleChange}
                              disabled={pageState === PAGE_STATES.SUBMITTING}
                              placeholder="e.g. Acme Innovations"
                              className="w-full pl-9 pr-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            Designation / Role <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
                          </label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              name="designation"
                              value={formData.designation}
                              onChange={handleChange}
                              disabled={pageState === PAGE_STATES.SUBMITTING}
                              placeholder="e.g. Senior Architect"
                              className="w-full pl-9 pr-3.5 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Submission Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={pageState === PAGE_STATES.SUBMITTING}
                      className={`w-full py-3 sm:py-3.5 text-white rounded-xl font-bold text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 ${
                        isStudent
                          ? 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                          : 'bg-purple-600 hover:bg-purple-700 focus:ring-2 focus:ring-purple-500'
                      }`}
                    >
                      {pageState === PAGE_STATES.SUBMITTING ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Activating My Pass...</span>
                        </>
                      ) : (
                        <>
                          {isStudent ? (
                            <GraduationCap className="w-5 h-5" />
                          ) : (
                            <Ticket className="w-5 h-5" />
                          )}
                          <span>Activate My Pass</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-center text-gray-400">
                    By clicking Activate My Pass, this physical event badge will be permanently linked to your profile.
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
