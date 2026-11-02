import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  QrCode,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  User,
  Calendar,
  Clock,
  RefreshCw,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Building,
  Briefcase,
  Search,
  Camera,
  CameraOff,
  Check,
  HelpCircle,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import toast from 'react-hot-toast';
import checkinService from '../Api-Services/checkinService';
import eventsService from '../Api-Services/eventsService';

/**
 * Scanning State Machine:
 * IDLE             -> Camera active or waiting to scan
 * PROCESSING       -> Synchronously locked, verifying scanned pass with backend
 * RESULT_DISPLAYED -> Verification result displayed (attendee card, pass status)
 * CHECKING_IN      -> Check-in request in progress
 * SUCCESS          -> Entry approved and recorded
 * ERROR            -> Verification or network error displayed
 */
const SCAN_STATES = {
  IDLE: 'IDLE',
  PROCESSING: 'PROCESSING',
  RESULT_DISPLAYED: 'RESULT_DISPLAYED',
  CHECKING_IN: 'CHECKING_IN',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};

const ERROR_CONFIGS = {
  EVENT_ACCESS_DENIED: {
    title: 'Event Access Denied',
    explanation: 'You do not have permission or an active gatekeeper assignment for this event.',
    action: 'Please select an event you are assigned to, or request a Super Admin to assign you as a gatekeeper.',
    severity: 'warning',
    color: 'amber',
  },
  PASS_EVENT_MISMATCH: {
    title: 'Pass Belongs to Different Event',
    explanation: 'This pass was generated for a different event than the one currently selected in the scanner.',
    action: 'Check the event name printed on the physical pass and choose that event from the dropdown selector.',
    severity: 'danger',
    color: 'rose',
  },
  PASS_NOT_ACTIVATED: {
    title: 'Pass Not Activated',
    explanation: 'The attendee has not completed registration or activated this pass yet.',
    action: 'Ask the attendee to scan the pass QR code with their mobile camera to complete registration.',
    severity: 'warning',
    color: 'amber',
  },
  PASS_ALREADY_CHECKED_IN: {
    title: 'Pass Already Checked In',
    explanation: 'This pass has already been admitted for this day or session. Duplicate entry is not permitted.',
    action: 'Check the admission timestamp or verify attendee identity if re-entry assistance is needed.',
    severity: 'warning',
    color: 'orange',
  },
  PASS_REVOKED: {
    title: 'Pass Revoked',
    explanation: 'This pass has been cancelled or invalidated by event administration.',
    action: 'Entry cannot be granted. Direct the attendee to event support or customer helpdesk.',
    severity: 'danger',
    color: 'red',
  },
  PASS_NOT_VALID_FOR_DAY: {
    title: 'Not Valid for Today',
    explanation: 'This pass does not include entry permission for this specific day or session.',
    action: 'Review the permitted event days listed on the pass or switch the active check-in day if appropriate.',
    severity: 'warning',
    color: 'amber',
  },
  INVALID_QR_TOKEN: {
    title: 'Invalid Pass QR Code',
    explanation: 'The scanned code is not recognized as a valid EventPass credential.',
    action: 'Ensure the QR code is clearly lit and undamaged, or manually enter the pass identifier.',
    severity: 'danger',
    color: 'rose',
  },
  NO_EVENT_SELECTED: {
    title: 'No Event Selected',
    explanation: 'An active event must be chosen before scanning passes.',
    action: 'Select an event from the top event selector.',
    severity: 'info',
    color: 'blue',
  },
  VERIFICATION_FAILED: {
    title: 'Verification Failed',
    explanation: 'The pass could not be verified against the server.',
    action: 'Check network connectivity and scan the pass again.',
    severity: 'danger',
    color: 'rose',
  },
};

const getScanErrorDisplay = (code, rawMessage) => {
  const normalizedCode = (code || '').toUpperCase().trim();
  if (ERROR_CONFIGS[normalizedCode]) {
    return {
      code: normalizedCode,
      ...ERROR_CONFIGS[normalizedCode],
      rawMessage,
    };
  }

  // Fallback heuristic detection if raw server message matches known patterns
  const lowerMsg = (rawMessage || '').toLowerCase();
  if (lowerMsg.includes('not authorized') || lowerMsg.includes('access denied')) {
    return {
      code: 'EVENT_ACCESS_DENIED',
      ...ERROR_CONFIGS.EVENT_ACCESS_DENIED,
      rawMessage,
    };
  }
  if (lowerMsg.includes('different event') || lowerMsg.includes('mismatch')) {
    return {
      code: 'PASS_EVENT_MISMATCH',
      ...ERROR_CONFIGS.PASS_EVENT_MISMATCH,
      rawMessage,
    };
  }
  if (lowerMsg.includes('not activated')) {
    return {
      code: 'PASS_NOT_ACTIVATED',
      ...ERROR_CONFIGS.PASS_NOT_ACTIVATED,
      rawMessage,
    };
  }
  if (lowerMsg.includes('already checked in')) {
    return {
      code: 'PASS_ALREADY_CHECKED_IN',
      ...ERROR_CONFIGS.PASS_ALREADY_CHECKED_IN,
      rawMessage,
    };
  }
  if (lowerMsg.includes('revoked')) {
    return {
      code: 'PASS_REVOKED',
      ...ERROR_CONFIGS.PASS_REVOKED,
      rawMessage,
    };
  }
  if (lowerMsg.includes('not valid for') || lowerMsg.includes('day')) {
    return {
      code: 'PASS_NOT_VALID_FOR_DAY',
      ...ERROR_CONFIGS.PASS_NOT_VALID_FOR_DAY,
      rawMessage,
    };
  }

  return {
    code: normalizedCode || 'VERIFICATION_FAILED',
    title: 'Scan Notice',
    explanation: rawMessage || 'Pass verification could not be completed.',
    action: 'Please verify the pass details and try scanning again.',
    severity: 'danger',
    color: 'rose',
    rawMessage,
  };
};

const CheckinScan = ({ eventId: propEventId }) => {
  const { eventId: paramEventId } = useParams();
  const navigate = useNavigate();

  // Events & Days selection
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(propEventId || paramEventId || '');
  const [eventDays, setEventDays] = useState([]);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [eventSearch, setEventSearch] = useState('');

  // State Machine
  const [scanState, setScanState] = useState(SCAN_STATES.IDLE);
  const [verificationResult, setVerificationResult] = useState(null);
  const [checkInResult, setCheckInResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  // Computed error presentation
  const errorDisplay = useMemo(() => {
    if (!errorCode && !errorMessage) return null;
    return getScanErrorDisplay(errorCode, errorMessage);
  }, [errorCode, errorMessage]);

  // Filtered events for quick searchable dropdown
  const filteredEvents = useMemo(() => {
    if (!eventSearch.trim()) return events;
    const q = eventSearch.toLowerCase().trim();
    return events.filter(
      (ev) =>
        ev.name?.toLowerCase().includes(q) ||
        ev.eventCode?.toLowerCase().includes(q)
    );
  }, [events, eventSearch]);

  // Scanner UI & Camera
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('unknown');
  const [cameraError, setCameraError] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [autoCheckIn, setAutoCheckIn] = useState(false);

  // Synchronous Guards (Refs prevent frame-rate callback storms & duplicate requests)
  const isLockedRef = useRef(false);
  const scanStateRef = useRef(SCAN_STATES.IDLE);
  const lastScannedPayloadRef = useRef(null);
  const browserReaderRef = useRef(null);
  const controlsRef = useRef(null);
  const videoRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Sync ref with state
  const setMachineState = (newState) => {
    scanStateRef.current = newState;
    setScanState(newState);
  };

  const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  // Helper to extract identifier from URL, JSON, or plain string
  const parseQrPayload = (raw) => {
    if (!raw) return '';
    const trimmed = raw.trim();

    // 1. JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parsed.passNumber || parsed.token || parsed.rawToken || parsed.passId || trimmed;
      } catch { }
    }

    // 2. URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('/activate') || trimmed.includes('/pass/')) {
      try {
        const url = new URL(trimmed, window.location.origin);
        // Query param
        const queryPass = url.searchParams.get('passNumber') ||
          url.searchParams.get('token') ||
          url.searchParams.get('rawToken') ||
          url.searchParams.get('passId');
        if (queryPass) return queryPass;

        // Path /activate/{token}
        const parts = url.pathname.split('/').filter(Boolean);
        const actIdx = parts.indexOf('activate');
        if (actIdx !== -1 && parts[actIdx + 1]) {
          return decodeURIComponent(parts[actIdx + 1]);
        }
        const passIdx = parts.indexOf('pass');
        if (passIdx !== -1 && parts[passIdx + 1]) {
          return decodeURIComponent(parts[passIdx + 1]);
        }
      } catch { }
    }

    return trimmed;
  };

  // Load events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventsService.getEvents(0, 50);
        const list = res.data?.content || [];
        setEvents(list);
        if (!selectedEventId && list.length > 0) {
          setSelectedEventId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };
    fetchEvents();
  }, []);

  // When selected event changes, load event days
  useEffect(() => {
    if (!selectedEventId) {
      setEventDays([]);
      setSelectedDayId('');
      return;
    }

    const fetchDays = async () => {
      try {
        const res = await eventsService.getEventDays(selectedEventId);
        const days = res.data || [];
        setEventDays(days);

        if (days.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          const matchingDay = days.find((d) => d.eventDate === todayStr);
          setSelectedDayId(matchingDay ? matchingDay.id : days[0].id);
        } else {
          setSelectedDayId('');
        }
      } catch (err) {
        console.error('Failed to load event days:', err);
      }
    };

    fetchDays();
  }, [selectedEventId]);

  // Stop scanner safely
  const stopScanner = useCallback(() => {
    try {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      if (browserReaderRef.current) {
        browserReaderRef.current.reset();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        if (stream.getTracks) {
          stream.getTracks().forEach((track) => track.stop());
        }
        videoRef.current.srcObject = null;
      }
    } catch (e) {
      console.warn('Error during scanner stop:', e);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isLockedRef.current = true;
      stopScanner();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [stopScanner]);

  // Execute verification logic with duplicate prevention
  const processPassVerification = async (rawDecodedText) => {
    if (!rawDecodedText) return;

    const normalizedToken = parseQrPayload(rawDecodedText);
    if (!normalizedToken) {
      setMachineState(SCAN_STATES.ERROR);
      setErrorCode('INVALID_QR');
      setErrorMessage('The scanned QR code is empty or not formatted correctly.');
      toast.error('Invalid QR code format');
      return;
    }

    if (!selectedEventId) {
      setMachineState(SCAN_STATES.ERROR);
      setErrorCode('NO_EVENT_SELECTED');
      setErrorMessage('Please select an event before scanning passes.');
      toast.error('Please select an event');
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // 1. Verify pass with backend
      const response = await checkinService.verifyPass(
        normalizedToken,
        selectedEventId,
        selectedDayId || null
      );

      const data = response.data || response;
      setVerificationResult(data);

      // Auto-check-in if enabled and pass is ready
      if (autoCheckIn && data.eligibleForCheckIn) {
        await executeCheckIn(normalizedToken, data);
      } else {
        setMachineState(SCAN_STATES.RESULT_DISPLAYED);
        if (data.eligibleForCheckIn) {
          toast.success(`Pass Verified: ${data.attendeeName || 'Attendee'}`);
        } else {
          toast(data.message || 'Verification Notice', { icon: '⚠️' });
        }
      }
    } catch (err) {
      setMachineState(SCAN_STATES.ERROR);
      const code = err.errorCode || err.response?.data?.errorCode || 'VERIFICATION_FAILED';
      const msg = err.message || err.response?.data?.message || 'Failed to verify pass. Please verify the event assignment.';
      setErrorCode(code);
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  // Perform final Check-In mutation
  const executeCheckIn = async (passIdentifier = null, verifiedData = null) => {
    const targetToken = passIdentifier || lastScannedPayloadRef.current || manualInput;
    if (!targetToken || !selectedEventId) return;

    setMachineState(SCAN_STATES.CHECKING_IN);

    try {
      const requestId = generateRequestId();
      const response = await checkinService.scanCheckin(
        targetToken,
        selectedEventId,
        selectedDayId || null,
        requestId
      );

      const checkInData = response.data || response;
      setCheckInResult(checkInData);
      setMachineState(SCAN_STATES.SUCCESS);
      toast.success(`Check-In Approved: ${checkInData.attendeeName || 'Attendee'}`);
    } catch (err) {
      setMachineState(SCAN_STATES.ERROR);
      const code = err.errorCode || err.response?.data?.errorCode || 'CHECKIN_REJECTED';
      const msg = err.message || err.response?.data?.message || 'Check-in could not be completed.';
      setErrorCode(code);
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  // Start Camera Scanner
  const startScanner = async () => {
    setCameraError(null);
    setErrorMessage(null);
    setErrorCode(null);

    // Reset synchronous guards
    isLockedRef.current = false;
    setMachineState(SCAN_STATES.IDLE);
    setVerificationResult(null);
    setCheckInResult(null);

    // Verify context
    const isSecure =
      window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!isSecure) {
      setCameraError('Camera access requires HTTPS or localhost context.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Browser does not support camera access.');
      return;
    }

    try {
      setIsScanning(true);

      if (!browserReaderRef.current) {
        browserReaderRef.current = new BrowserMultiFormatReader();
      }

      const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (!videoDevices || videoDevices.length === 0) {
        setCameraError('No camera found on this device.');
        setIsScanning(false);
        return;
      }

      // Select back / environment camera if present
      let selectedDeviceId = videoDevices[0].deviceId;
      const backCamera = videoDevices.find(
        (device) =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('environment') ||
          device.label.toLowerCase().includes('rear')
      );
      if (backCamera) {
        selectedDeviceId = backCamera.deviceId;
      }

      // Attach video element callback
      browserReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result) => {
          if (!result || !result.text) return;

          // SYNCHRONOUS LOCK: Prevents continuous camera frames from triggering repeated API calls
          if (isLockedRef.current || scanStateRef.current !== SCAN_STATES.IDLE) {
            return;
          }

          const rawText = result.text.trim();
          if (!rawText) return;

          // Engage lock synchronously BEFORE any async action
          isLockedRef.current = true;
          setMachineState(SCAN_STATES.PROCESSING);
          lastScannedPayloadRef.current = rawText;

          // Stop camera stream immediately
          stopScanner();

          // Dispatch verification
          processPassVerification(rawText);
        }
      ).catch((err) => {
        console.error('Camera stream error:', err);
        setCameraError('Unable to access camera. Please verify permissions.');
        setIsScanning(false);
      });
    } catch (err) {
      console.error('Scanner init error:', err);
      setCameraError('Camera initialization failed.');
      setIsScanning(false);
    }
  };

  // Reset scanner to scan next pass
  const handleResetScanner = () => {
    isLockedRef.current = false;
    lastScannedPayloadRef.current = null;
    setVerificationResult(null);
    setCheckInResult(null);
    setErrorMessage(null);
    setErrorCode(null);
    setManualInput('');
    setMachineState(SCAN_STATES.IDLE);
    startScanner();
  };

  // Manual code submission
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      toast.error('Please enter a pass identifier or token');
      return;
    }
    stopScanner();
    isLockedRef.current = true;
    setMachineState(SCAN_STATES.PROCESSING);
    lastScannedPayloadRef.current = manualInput.trim();
    processPassVerification(manualInput.trim());
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-4 md:p-6 flex flex-col items-center">
      {/* Top Navbar */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4">
        <button
          onClick={() => {
            stopScanner();
            navigate('/admin');
          }}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-white/10 px-3 py-1.5 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold flex items-center justify-center gap-2">
            <QrCode className="w-6 h-6 text-purple-400" /> Gate Check-In
          </h1>
          <p className="text-xs text-gray-400">Pass Verification & Entry Scanner</p>
        </div>
        <div className="w-16"></div>
      </div>

      <div className="w-full max-w-lg space-y-4">
        {/* Controls: Event & Day Selection */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-300 font-semibold block">Select Event</label>
              {events.length > 5 && (
                <span className="text-[10px] text-gray-400">
                  {filteredEvents.length} of {events.length} events
                </span>
              )}
            </div>

            {events.length > 5 && (
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter events by name or code..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="w-full bg-slate-900/80 text-white placeholder-gray-500 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}

            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                if (scanState !== SCAN_STATES.IDLE) {
                  handleResetScanner();
                }
              }}
              disabled={scanState === SCAN_STATES.PROCESSING || scanState === SCAN_STATES.CHECKING_IN}
              className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {filteredEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.eventCode})
                </option>
              ))}
            </select>
          </div>

          {/* Event Day Selector for Multi-day Check-in */}
          {eventDays.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-300 font-semibold block">
                  Active Check-In Day
                </label>
                {selectedEvent?.timezone && (
                  <span className="text-[10px] text-gray-400 font-mono">
                    TZ: {selectedEvent.timezone}
                  </span>
                )}
              </div>
              <select
                value={selectedDayId}
                onChange={(e) => setSelectedDayId(e.target.value)}
                disabled={scanState === SCAN_STATES.PROCESSING || scanState === SCAN_STATES.CHECKING_IN}
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {eventDays.map((d) => (
                  <option key={d.id} value={d.id}>
                    Day {d.dayNumber}: {d.label} ({d.eventDate})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Check-in Toggle */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
            <span className="text-gray-300">Fast Mode (Auto-Confirm Valid Passes)</span>
            <button
              type="button"
              onClick={() => setAutoCheckIn(!autoCheckIn)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoCheckIn ? 'bg-purple-600' : 'bg-slate-700'
                }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${autoCheckIn ? 'translate-x-4' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>

        {/* CAMERA SCANNER VIEWPORT (When IDLE or starting scanner) */}
        {scanState === SCAN_STATES.IDLE && (
          <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 space-y-4">
            <div className="relative aspect-square max-w-sm mx-auto bg-black rounded-xl overflow-hidden border-2 border-purple-500/50 flex items-center justify-center shadow-xl">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
                playsInline
                muted
              />

              {/* Scanning Reticle */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-dashed border-purple-400 rounded-2xl animate-pulse"></div>
                  <div className="absolute top-4 text-xs text-purple-300 font-mono tracking-wider bg-black/60 px-3 py-1 rounded-full">
                    ALIGN PASS QR CODE
                  </div>
                </div>
              )}

              {/* Camera Off / Idle Placeholder */}
              {!isScanning && (
                <div className="text-center p-6 space-y-3">
                  <Camera className="w-12 h-12 text-gray-500 mx-auto" />
                  <p className="text-sm text-gray-400">Camera scanner is inactive.</p>
                  <button
                    onClick={startScanner}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-lg transition flex items-center gap-2 mx-auto"
                  >
                    <Camera className="w-4 h-4" /> Start Camera Scanner
                  </button>
                </div>
              )}
            </div>

            {/* Camera error notification */}
            {cameraError && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Camera Toggle Button */}
            {isScanning && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={stopScanner}
                  className="px-4 py-1.5 text-xs text-gray-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition inline-flex items-center gap-1.5"
                >
                  <CameraOff className="w-3.5 h-3.5" /> Pause Scanner
                </button>
              </div>
            )}

            {/* Manual Entry Fallback */}
            <div className="pt-2 border-t border-slate-700">
              <p className="text-[11px] text-gray-400 mb-1.5">Or enter pass identifier manually:</p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. TEST123-SZ83KSCE-0001"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 bg-slate-900 text-white text-xs px-3 py-2 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5" /> Verify
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PROCESSING SPINNER */}
        {scanState === SCAN_STATES.PROCESSING && (
          <div className="bg-slate-800/90 rounded-2xl p-8 border border-slate-700 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-white">Verifying Pass...</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Querying pass status, attendee registration, and day validity with the server.
            </p>
          </div>
        )}

        {/* CHECKING-IN SPINNER */}
        {scanState === SCAN_STATES.CHECKING_IN && (
          <div className="bg-slate-800/90 rounded-2xl p-8 border border-slate-700 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto" />
            <h3 className="text-base font-bold text-white">Recording Check-In...</h3>
            <p className="text-xs text-gray-400">Persisting admission entry in the database.</p>
          </div>
        )}

        {/* RESULT DISPLAYED: Pass Details Card */}
        {scanState === SCAN_STATES.RESULT_DISPLAYED && verificationResult && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl animate-fade-in">
            {/* Header Status Banner */}
            <div
              className={`p-4 text-center font-bold text-sm flex items-center justify-center gap-2 ${verificationResult.eligibleForCheckIn
                  ? 'bg-emerald-600 text-white'
                  : verificationResult.status === 'NOT_ACTIVATED'
                    ? 'bg-amber-600 text-white'
                    : verificationResult.status === 'ALREADY_CHECKED_IN'
                      ? 'bg-orange-600 text-white'
                      : 'bg-rose-600 text-white'
                }`}
            >
              {verificationResult.eligibleForCheckIn ? (
                <>
                  <ShieldCheck className="w-5 h-5" /> PASS VERIFIED · READY FOR CHECK-IN
                </>
              ) : verificationResult.status === 'NOT_ACTIVATED' ? (
                <>
                  <AlertTriangle className="w-5 h-5" /> PASS NOT ACTIVATED
                </>
              ) : verificationResult.status === 'ALREADY_CHECKED_IN' ? (
                <>
                  <Clock className="w-5 h-5" /> ALREADY CHECKED IN
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" /> ENTRY REJECTED ({verificationResult.status})
                </>
              )}
            </div>

            {/* Pass Metadata Body */}
            <div className="p-5 space-y-4">
              <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/60 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Pass Number:</span>
                  <span className="font-mono font-bold text-purple-300 text-sm">
                    {verificationResult.passNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Event:</span>
                  <span className="font-semibold text-white">{verificationResult.eventName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Day / Session:</span>
                  <span className="text-gray-200">
                    Day {verificationResult.dayNumber}: {verificationResult.eventDayLabel}
                  </span>
                </div>
              </div>

              {/* Attendee Info Card */}
              {verificationResult.attendeeName ? (
                <div className="bg-slate-900/40 rounded-xl p-3.5 border border-slate-700/60 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-base text-white">
                      {verificationResult.attendeeName}
                    </span>
                  </div>
                  {verificationResult.attendeeEmail && (
                    <div className="text-xs text-gray-300 pl-6">
                      {verificationResult.attendeeEmail}
                    </div>
                  )}
                  {verificationResult.attendeeOrganization && (
                    <div className="text-xs text-gray-400 pl-6 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      <span>{verificationResult.attendeeOrganization}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Attendee Registration Required</strong>
                    <span>
                      This pass has not been activated yet. The attendee must scan the pass or visit
                      the activation portal before entry can be permitted.
                    </span>
                  </div>
                </div>
              )}

              {/* Status Message */}
              <p className="text-xs text-center text-gray-300 px-2">
                {verificationResult.message}
              </p>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                {verificationResult.eligibleForCheckIn ? (
                  <button
                    type="button"
                    onClick={() => executeCheckIn(verificationResult.passNumber, verificationResult)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" /> Confirm Check-In
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleResetScanner}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-gray-200 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Scan Next Pass
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {scanState === SCAN_STATES.SUCCESS && checkInResult && (
          <div className="bg-slate-800 rounded-2xl border border-emerald-500/50 p-6 text-center space-y-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Check-In Approved!</h2>
              <p className="text-xs text-emerald-300 mt-1">Admission Entry Recorded</p>
            </div>

            <div className="bg-slate-900/70 rounded-xl p-4 text-left text-xs space-y-2 border border-slate-700">
              <div className="flex justify-between">
                <span className="text-gray-400">Attendee:</span>
                <strong className="text-white text-sm">{checkInResult.attendeeName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pass Number:</span>
                <span className="font-mono text-purple-300 font-bold">{checkInResult.passNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Event Session:</span>
                <span className="text-gray-200">
                  Day {checkInResult.dayNumber}: {checkInResult.eventDayLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Checked In By:</span>
                <span className="text-gray-200">{checkInResult.checkedInByName || 'Gatekeeper'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetScanner}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Scan Next Pass
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {scanState === SCAN_STATES.ERROR && errorDisplay && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 text-center space-y-4 shadow-2xl animate-fade-in">
            {/* Status Icon */}
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${errorDisplay.severity === 'danger'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : errorDisplay.severity === 'warning'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
            >
              {errorDisplay.severity === 'danger' ? (
                <XCircle className="w-9 h-9" />
              ) : errorDisplay.severity === 'warning' ? (
                <AlertTriangle className="w-9 h-9" />
              ) : (
                <HelpCircle className="w-9 h-9" />
              )}
            </div>

            {/* Title & Code Badge */}
            <div>
              <h2 className="text-lg font-bold text-white">{errorDisplay.title}</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-900 border border-slate-700 text-purple-300">
                [{errorDisplay.code}]
              </span>
            </div>

            {/* Explanation Card */}
            <div
              className={`rounded-xl p-3.5 text-xs text-left ${errorDisplay.severity === 'danger'
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-200'
                  : errorDisplay.severity === 'warning'
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
                    : 'bg-blue-500/10 border border-blue-500/20 text-blue-200'
                }`}
            >
              <p className="leading-relaxed">{errorDisplay.explanation}</p>
            </div>

            {/* Action Guidance Card */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-left text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span>Recommended Action</span>
              </div>
              <p className="text-gray-300 pl-5 leading-relaxed">{errorDisplay.action}</p>
            </div>

            {/* Contextual Action Shortcut */}
            {errorDisplay.code === 'PASS_NOT_ACTIVATED' && (
              <a
                href="/activate"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/40 text-amber-200 rounded-xl text-xs font-semibold transition"
              >
                <span>Open Pass Activation Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Reset / Retry Button */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleResetScanner}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again / Scan Next Pass
              </button>

              <button
                type="button"
                onClick={() => {
                  handleResetScanner();
                  // Scroll to manual input
                }}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded-xl text-xs transition"
              >
                Manual Entry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckinScan;
