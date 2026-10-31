import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import toast from 'react-hot-toast';
import checkinService from '../Api-Services/checkinService';
import eventsService from '../Api-Services/eventsService';

const CheckinScan = ({ eventId: propEventId }) => {
  const { eventId: paramEventId } = useParams();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(propEventId || paramEventId || '');
  const [eventDays, setEventDays] = useState([]);
  const [selectedDayId, setSelectedDayId] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('unknown');

  const [scanResult, setScanResult] = useState(null); // { success: boolean, data: ..., error: ... }
  const browserReaderRef = useRef(null);
  const videoRef = useRef(null);

  const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  };

  // Load events list for selection if not pre-provided
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
        console.error('Failed to load events for check-in:', err);
      }
    };
    fetchEvents();
  }, []);

  // When selected event changes, load its event days
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
          // Try to select today's day if date matches, else default to first day
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

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (browserReaderRef.current) {
        browserReaderRef.current.reset();
      }
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      const isSecure =
        window.isSecureContext ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (!isSecure) {
        setScannerError('Camera access requires HTTPS or localhost context.');
        return false;
      }

      // Check if browser supports media devices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setScannerError('Browser does not support camera access.');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      stream.getTracks().forEach((t) => t.stop());
      setCameraPermission('granted');
      return true;
    } catch (err) {
      console.error('Camera permission error:', err);
      setCameraPermission('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setScannerError('Camera permission denied. Please allow camera permissions.');
      } else if (err.name === 'NotFoundError') {
        setScannerError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setScannerError('Camera is already in use by another application.');
      } else {
        setScannerError('Camera access failed. Please check your device settings.');
      }
      return false;
    }
  };

  const startScanner = async () => {
    setScanResult(null);
    setScannerError(null);

    const hasPermission = await checkCameraPermission();
    if (!hasPermission) return;

    try {
      setIsScanning(true);

      // Create BrowserMultiFormatReader instance if not exists
      if (!browserReaderRef.current) {
        browserReaderRef.current = new BrowserMultiFormatReader();
      }

      // Get available video devices
      const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (videoDevices.length === 0) {
        setScannerError('No camera devices found on this device.');
        setIsScanning(false);
        return;
      }

      // Prefer back camera (environment facing) on mobile
      let selectedDeviceId = videoDevices[0].deviceId;
      const backCamera = videoDevices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('environment') ||
        device.label.toLowerCase().includes('rear')
      );
      
      if (backCamera) {
        selectedDeviceId = backCamera.deviceId;
      }

      // Start decoding from the selected camera
      browserReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            // QR code detected successfully
            handleScannedData(result.text);
          }
          // Ignore scan errors - they're normal during continuous scanning
        }
      ).catch(err => {
        console.error('Camera start error:', err);
        setScannerError('Failed to start camera. Please verify device camera.');
        setIsScanning(false);
      });

    } catch (err) {
      console.error('Scanner start error:', err);
      setScannerError('Failed to start camera. Please verify device camera.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (browserReaderRef.current) {
        await browserReaderRef.current.reset();
      }
      setIsScanning(false);
    } catch (err) {
      console.error('Error stopping scanner:', err);
      setIsScanning(false);
    }
  };

  // Extract rawToken from URL, JSON, or plain text
  const extractToken = (text) => {
    if (!text) return '';
    const trimmed = text.trim();

    // Check if JSON
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.rawToken) return parsed.rawToken;
      if (parsed.token) return parsed.token;
    } catch {}

    // Check if URL with /activate/:token or ?token=...
    if (trimmed.includes('http://') || trimmed.includes('https://') || trimmed.includes('/activate')) {
      try {
        const url = new URL(trimmed, window.location.origin);
        const searchToken = url.searchParams.get('token');
        if (searchToken) return searchToken;

        const pathParts = url.pathname.split('/').filter(Boolean);
        const activateIdx = pathParts.indexOf('activate');
        if (activateIdx !== -1 && pathParts[activateIdx + 1]) {
          return pathParts[activateIdx + 1];
        }
      } catch {}
    }

    return trimmed;
  };

  const handleScannedData = async (rawDecoded) => {
    // Immediately stop scanner to prevent multiple triggers
    await stopScanner();

    const token = extractToken(rawDecoded);
    if (!token) {
      toast.error('Scanned QR does not contain a valid token');
      setScanResult({
        success: false,
        errorCode: 'INVALID_TOKEN',
        message: 'Scanned QR code does not contain a recognizable token.',
      });
      return;
    }

    if (!selectedEventId) {
      toast.error('Please select an event before scanning');
      setScanResult({
        success: false,
        errorCode: 'NO_EVENT',
        message: 'No event selected. Please choose the event you are scanning for.',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await checkinService.scanCheckin(
        token,
        selectedEventId,
        selectedDayId || null,
        generateRequestId()
      );

      const checkInData = response.data || response;
      setScanResult({
        success: true,
        data: checkInData,
      });
      toast.success(`Check-in Approved: ${checkInData.attendeeName || 'Attendee'}`);
    } catch (err) {
      console.error('Check-in rejected:', err);
      const code = err.errorCode || err.response?.data?.errorCode || 'CHECKIN_REJECTED';
      const msg = err.message || err.response?.data?.message || 'Check-in failed.';
      setScanResult({
        success: false,
        errorCode: code,
        message: msg,
      });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNextScan = () => {
    setScanResult(null);
    startScanner();
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white p-4 md:p-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-white/10 px-3 py-1.5 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Admin</span>
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold flex items-center justify-center gap-2">
            <QrCode className="w-6 h-6 text-purple-400" /> Gate Check-In
          </h1>
          <p className="text-xs text-gray-400">Mobile Scanner & Verification</p>
        </div>
        <div className="w-16"></div>
      </div>

      <div className="w-full max-w-lg space-y-4">
        {/* Controls: Event & Day Selection */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3">
          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1">
              Select Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={isScanning || loading}
              className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.eventCode})
                </option>
              ))}
            </select>
          </div>

          {/* Event Day Selector for Multi-day Check-in */}
          {eventDays.length > 0 && (
            <div>
              <label className="text-xs text-gray-300 font-semibold block mb-1">
                Checking In For Day
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {eventDays.map((day) => {
                  const isSelected = selectedDayId === day.id;
                  return (
                    <button
                      key={day.id}
                      type="button"
                      disabled={isScanning || loading}
                      onClick={() => setSelectedDayId(day.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold text-center transition border ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-2 ring-purple-300'
                          : 'bg-slate-800/80 text-gray-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <div>Day {day.dayNumber}</div>
                      <div className="text-[10px] opacity-75 font-normal truncate">
                        {day.eventDate || day.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SCANNER VIEWPORT */}
        {!scanResult && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center">
            {/* Video element for camera feed */}
            <div
              className={`w-full max-w-[320px] aspect-square rounded-xl overflow-hidden bg-black/40 border-2 ${
                isScanning ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-dashed border-gray-600'
              } flex items-center justify-center relative`}
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-center p-6 text-gray-400">
                    <QrCode className="w-16 h-16 mx-auto mb-3 opacity-40 text-purple-300" />
                    <p className="text-sm font-medium">Camera is ready</p>
                    <p className="text-xs text-gray-500 mt-1">Tap below to activate camera scanner</p>
                  </div>
                </div>
              )}
            </div>

            {scannerError && (
              <div className="mt-3 text-red-400 text-xs flex items-center gap-1.5 text-center">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{scannerError}</span>
              </div>
            )}

            <div className="mt-4 w-full">
              {!isScanning ? (
                <button
                  type="button"
                  onClick={startScanner}
                  disabled={loading || !selectedEventId}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <QrCode className="w-5 h-5" /> Start QR Scanner
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopScanner}
                  className="w-full py-3 px-6 bg-red-600/80 hover:bg-red-700 text-white font-semibold rounded-xl transition"
                >
                  Stop Scanner
                </button>
              )}
            </div>
          </div>
        )}

        {/* LOADING INDICATOR */}
        {loading && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-white">Validating Pass...</h3>
            <p className="text-sm text-gray-300">Checking authorization, token authenticity, and day validity.</p>
          </div>
        )}

        {/* SCAN RESULT: SUCCESS */}
        {scanResult && scanResult.success && (
          <div className="bg-emerald-950/90 border-2 border-emerald-400 rounded-2xl p-6 text-center space-y-4 shadow-2xl shadow-emerald-900/50">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-400">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <span className="bg-emerald-500 text-black text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">
                APPROVED ENTRY
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                {scanResult.data?.attendeeName || 'Attendee'}
              </h2>
              <p className="text-emerald-300 text-xs">{scanResult.data?.attendeeEmail}</p>
            </div>

            <div className="bg-black/30 rounded-xl p-4 text-left text-xs space-y-2 border border-emerald-500/30">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-500/20">
                <span className="text-gray-400">Pass Number:</span>
                <span className="font-mono font-bold text-white text-sm">{scanResult.data?.passNumber}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-emerald-500/20">
                <span className="text-gray-400">Permitted Entry:</span>
                <span className="font-bold text-emerald-300">
                  {scanResult.data?.eventDayLabel || `Day ${scanResult.data?.dayNumber || 1}`}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-emerald-500/20">
                <span className="text-gray-400">Check-in Time:</span>
                <span className="text-white">
                  {scanResult.data?.checkedInAt
                    ? new Date(scanResult.data.checkedInAt).toLocaleTimeString()
                    : new Date().toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Verified By:</span>
                <span className="text-gray-300">{scanResult.data?.checkedInByName || 'Gatekeeper'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextScan}
              className="w-full py-3.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" /> Scan Next Attendee
            </button>
          </div>
        )}

        {/* SCAN RESULT: REJECTED */}
        {scanResult && !scanResult.success && (
          <div className="bg-rose-950/90 border-2 border-rose-500 rounded-2xl p-6 text-center space-y-4 shadow-2xl shadow-rose-900/50">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-400">
              <XCircle className="w-10 h-10" />
            </div>

            <div>
              <span className="bg-rose-500 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full">
                ENTRY REJECTED
              </span>
              <h2 className="text-xl font-bold text-white mt-2">
                {scanResult.errorCode === 'PASS_ALREADY_CHECKED_IN'
                  ? 'Already Checked In!'
                  : scanResult.errorCode === 'PASS_NOT_ACTIVATED'
                  ? 'Pass Not Activated'
                  : scanResult.errorCode === 'PASS_NOT_VALID_FOR_DAY'
                  ? 'Pass Invalid For This Day'
                  : 'Check-In Denied'}
              </h2>
              <p className="text-rose-300 text-xs mt-1 max-w-xs mx-auto">
                {scanResult.message}
              </p>
            </div>

            <div className="bg-black/30 rounded-xl p-3 text-left text-xs border border-rose-500/30">
              <span className="text-gray-400">Error Code: </span>
              <span className="font-mono text-rose-300 font-bold">{scanResult.errorCode}</span>
            </div>

            <button
              type="button"
              onClick={handleNextScan}
              className="w-full py-3.5 px-6 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" /> Try Scanning Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckinScan;
