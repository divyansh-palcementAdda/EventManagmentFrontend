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
} from 'lucide-react';
import passService from '../../Api-Services/passService';

const ActivatePass = () => {
  const { token: routeToken } = useParams();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token');
  const navigate = useNavigate();

  const token = routeToken || queryToken || '';

  const [inputToken, setInputToken] = useState(token);
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
    if (token) {
      setInputToken(token);
      validateScannedToken(token);
    }
  }, [token]);

  const validateScannedToken = async (rawTokenToValidate) => {
    if (!rawTokenToValidate || !rawTokenToValidate.trim()) return;

    setValidating(true);
    setValidationError(null);
    setPassData(null);
    setIsActivatedSuccess(false);

    try {
      const response = await passService.validatePass(rawTokenToValidate.trim());
      // response is ApiResponse<ValidatePassResponse>
      const data = response.data || response;
      setPassData(data);

      if (!data.valid) {
        setValidationError(data.message || 'Pass token is invalid.');
      } else if (!data.isEligibleForActivation) {
        setValidationError(data.message);
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
    if (!inputToken.trim()) {
      toast.error('Please enter a pass token or scan a valid QR code');
      return;
    }
    navigate(`/activate/${encodeURIComponent(inputToken.trim())}`);
    validateScannedToken(inputToken.trim());
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
    } else if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
      errors.mobileNumber = 'Mobile number must be exactly 10 digits';
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
        rawToken: inputToken.trim(),
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
    <div className="registration-page">
      <div className="form-card max-w-2xl">
        {/* Header Icon */}
        <div className="form-header">
          <div className="form-header-icon bg-purple-600 text-white">
            <Ticket className="w-8 h-8" />
          </div>
          <h1 className="form-heading">Event Pass Activation</h1>
          <p className="form-subtitle">
            Scan your physical QR pass or enter the token to link your attendee profile and activate entry.
          </p>
        </div>

        {/* Token Search Bar (shown when no token or manual re-entry) */}
        {!token && (
          <form onSubmit={handleManualSearch} className="mb-6">
            <label className="form-label">Enter Pass Token</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Paste raw QR token or pass code..."
                className="form-input flex-1 px-4 py-2 border rounded-lg"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
              >
                Validate Pass
              </button>
            </div>
          </form>
        )}

        {/* Validating Spinner */}
        {validating && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-3" />
            <p className="font-medium text-gray-700">Validating pass token...</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {isActivatedSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Pass Activated Successfully!</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Your pass has been claimed and registered to <strong className="text-gray-900">{formData.fullName}</strong>.
              A confirmation email has been dispatched to <strong>{formData.email}</strong>.
            </p>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100 text-left max-w-md mx-auto space-y-2 mt-4">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-gray-500">Pass Number:</span>
                <span className="font-mono font-bold text-purple-700 text-base">{passData?.passNumber}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-gray-500">Event:</span>
                <span className="font-medium text-gray-900">{passData?.eventName}</span>
              </div>
              {passData?.venue && (
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-gray-500">Venue:</span>
                  <span className="text-gray-700">{passData.venue}</span>
                </div>
              )}
              {passData?.validDays && passData.validDays.length > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Valid Days:</span>
                  <span className="text-purple-600 font-medium">
                    {passData.validDays.map((d) => d.label || `Day ${d.dayNumber}`).join(', ')}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 pt-2">
              Present your original physical QR card or digital pass email at the entrance gate for check-in.
            </p>
          </div>
        )}

        {/* ALREADY ACTIVATED OR REVOKED OR ERROR STATE */}
        {!validating && !isActivatedSuccess && validationError && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 text-base">Pass Status Notice</h3>
                  <p className="text-red-700 text-sm mt-1">{validationError}</p>
                </div>
              </div>

              {passData && (
                <div className="mt-4 pt-4 border-t border-red-200 grid grid-cols-2 gap-2 text-xs text-gray-700">
                  <div>
                    <span className="font-semibold">Event:</span> {passData.eventName} ({passData.eventCode})
                  </div>
                  <div>
                    <span className="font-semibold">Pass Number:</span> {passData.passNumber}
                  </div>
                  {passData.attendeeName && (
                    <div className="col-span-2">
                      <span className="font-semibold">Activated by:</span> {passData.attendeeName} ({passData.attendeeEmail})
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setValidationError(null);
                  setPassData(null);
                  navigate('/activate');
                }}
                className="text-sm font-medium text-purple-600 hover:text-purple-700 underline"
              >
                Scan or enter another pass
              </button>
            </div>
          </div>
        )}

        {/* ELIGIBLE FOR ACTIVATION FORM */}
        {!validating && !isActivatedSuccess && passData && passData.isEligibleForActivation && (
          <div className="space-y-6">
            {/* Event Metadata Banner */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full uppercase tracking-wider">
                  Pass Ready for Activation
                </span>
                <span className="font-mono text-sm font-bold text-gray-800 bg-white px-2.5 py-1 rounded-md border border-gray-200">
                  {passData.passNumber}
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">{passData.eventName}</h2>
              <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-2">
                {passData.venue && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    <span>{passData.venue}</span>
                  </div>
                )}
                {passData.startsAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      {formatDate(passData.startsAt)} - {formatDate(passData.endsAt)}
                    </span>
                  </div>
                )}
              </div>

              {passData.validDays && passData.validDays.length > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-100/60 flex items-center gap-2 text-xs">
                  <span className="font-medium text-gray-700">Permitted Event Days:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {passData.validDays.map((day) => (
                      <span
                        key={day.id}
                        className="bg-white text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[11px] font-semibold"
                      >
                        {day.label || `Day ${day.dayNumber}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">
                  Full Name <span className="form-label-required">*</span>
                </label>
                <div className="form-input-wrapper">
                  <User className="form-input-icon text-gray-400 w-5 h-5 ml-3" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Johnathan Doe"
                    className="form-input w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                {formErrors.fullName && <div className="form-error text-xs text-red-500 mt-1">{formErrors.fullName}</div>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">
                    Email Address <span className="form-label-required">*</span>
                  </label>
                  <div className="form-input-wrapper">
                    <Mail className="form-input-icon text-gray-400 w-5 h-5 ml-3" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="form-input w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {formErrors.email && <div className="form-error text-xs text-red-500 mt-1">{formErrors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Mobile Number <span className="form-label-required">*</span>
                  </label>
                  <div className="form-input-wrapper">
                    <Phone className="form-input-icon text-gray-400 w-5 h-5 ml-3" />
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      className="form-input w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  {formErrors.mobileNumber && (
                    <div className="form-error text-xs text-red-500 mt-1">{formErrors.mobileNumber}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Organization / University (Optional)</label>
                  <div className="form-input-wrapper">
                    <Building className="form-input-icon text-gray-400 w-5 h-5 ml-3" />
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="Company or College name"
                      className="form-input w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Designation / Role (Optional)</label>
                  <div className="form-input-wrapper">
                    <Briefcase className="form-input-icon text-gray-400 w-5 h-5 ml-3" />
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="e.g. Software Engineer, Student"
                      className="form-input w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Activating Pass...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      <span>Activate & Confirm My Pass</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-gray-500 mt-2">
                Pass activation is single-use and irreversible. Your pass will be bound to your identity.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivatePass;

