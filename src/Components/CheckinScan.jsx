import React, { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle, XCircle, Loader2, X, User, Calendar, Tag } from 'lucide-react';
import Button from './reusable/button';
import checkinService from '../Api-Services/checkinService';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';

const CheckinScan = ({ eventId: propEventId }) => {
  const [scannedData, setScannedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('unknown');
  const html5QrCodeRef = useRef(null);

  const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Initialize QR scanner on component mount
  useEffect(() => {
    // Check camera permissions first
    checkCameraPermission();
    return () => {
      stopScanner();
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      // Check if running on HTTPS or localhost
      const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      if (!isSecureContext) {
        setScannerError('Camera access requires HTTPS. Please use HTTPS or localhost. Current connection is not secure.');
        setIsScanning(false);
        return;
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      // Start scanner after permission granted
      startScanner();
    } catch (err) {
      console.error('Camera permission error:', err);
      setCameraPermission('denied');
      setScannerError('Camera permission denied. Please allow camera access in browser settings and try again.');
      setIsScanning(false);
    }
  };

  // Initialize QR scanner
  const startScanner = async () => {
    try {
      setIsScanning(true);
      setScannerError(null);
      setScannedData(null);
      setResult(null);
      setError(null);

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }

      // Mobile-optimized camera configuration
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // Use rear camera (environment) for mobile devices
      const cameraConfig = {
        facingMode: "environment",
      };

      console.log('Starting scanner with config:', config);
      await html5QrCodeRef.current.start(
        cameraConfig,
        config,
        (decodedText, decodedResult) => {
          console.log('QR code scanned:', decodedText);
          // QR code scanned successfully
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors, they're normal during scanning
          console.log('Scanning error (normal):', errorMessage);
        }
      );
      console.log('Scanner started successfully');
    } catch (err) {
      console.error('Scanner start error:', err);
      setScannerError("Unable to start camera. Please check camera permissions and try again.");
      setIsScanning(false);
      toast.error("Failed to start camera. Please allow camera access.");
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      setIsScanning(false);
    } catch (err) {
      console.error("Failed to stop scanner:", err);
    }
  };

  const handleScanSuccess = (decodedText) => {
    // Stop scanning after successful scan
    stopScanner();

    // Parse QR code data - expecting JSON with rawToken, eventId
    try {
      let parsedData;
      if (typeof decodedText === 'string') {
        // Try to parse as JSON
        try {
          parsedData = JSON.parse(decodedText);
        } catch {
          // If not JSON, treat as raw token
          parsedData = { rawToken: decodedText };
        }
      } else {
        parsedData = decodedText;
      }

      setScannedData({
        rawToken: parsedData.rawToken || parsedData.token || decodedText,
        eventId: parsedData.eventId || propEventId || '',
        requestId: generateRequestId(),
      });

      toast.success("QR code scanned successfully!");
    } catch (err) {
      setError({ message: "Invalid QR code format" });
      toast.error("Invalid QR code format");
    }
  };

  const handleCheckIn = async () => {
    if (!scannedData) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await checkinService.scanCheckin(
        scannedData.rawToken,
        scannedData.eventId,
        scannedData.requestId
      );

      setResult(response);
      toast.success('Check-in successful!');

      // Prepare for next student after 2 seconds
      setTimeout(() => {
        setScannedData(null);
        setResult(null);
        setError(null);
        startScanner();
      }, 2000);
    } catch (err) {
      setError(err);
      toast.error(err.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = () => {
    setScannedData(null);
    setResult(null);
    setError(null);
    startScanner();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-4 md:mb-6">
          <div className="p-2 md:p-3 bg-purple-100 rounded-lg">
            <QrCode className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Check-in Scan</h1>
            <p className="text-xs md:text-sm text-gray-600">Scan QR code to check in</p>
          </div>
        </div>

        {/* QR Scanner - Shows when scanning */}
        {isScanning && (
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
            <div className="flex justify-between items-center p-3 bg-gray-800">
              <h3 className="font-semibold text-white text-sm md:text-base">Scanning...</h3>
              <Button
                type="button"
                variant="danger"
                onClick={stopScanner}
                className="px-3 py-1 md:px-4 md:py-2 text-sm"
              >
                <X className="h-4 w-4 mr-1" />
              </Button>
            </div>
            <div
              id="qr-reader"
              className="w-full"
              style={{ minHeight: '300px', maxHeight: '500px' }}
            ></div>
            {scannerError && (
              <div className="p-3 bg-red-900 text-red-100 text-sm">
                {scannerError}
              </div>
            )}
            <div className="p-3 bg-gray-800 text-gray-300 text-xs text-center">
              Point camera at QR code
            </div>
          </div>
        )}

        {/* Fallback: Scanner not started or failed */}
        {!isScanning && !scannedData && !result && !error && (
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 text-center">
            {scannerError ? (
              <>
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                <p className="text-sm text-red-800 mb-4">{scannerError}</p>
              </>
            ) : (
              <>
                <Loader2 className="h-12 w-12 text-purple-600 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-gray-600 mb-4">Initializing camera...</p>
              </>
            )}
            <Button
              type="button"
              variant="success"
              onClick={startScanner}
              className="w-full py-3 text-base"
            >
              <QrCode className="mr-2 h-5 w-5" />
              Start Scanner
            </Button>
          </div>
        )}

        {/* Scanned Data Display - Shows after successful scan */}
        {scannedData && !result && !error && (
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Scanned Pass Details</h3>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Tag className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">QR Token</p>
                  <p className="text-sm font-mono text-gray-900 break-all">
                    {scannedData.rawToken.substring(0, 20)}...
                  </p>
                </div>
              </div>

              {scannedData.eventId && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">Event ID</p>
                    <p className="text-sm font-mono text-gray-900 break-all">
                      {scannedData.eventId}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="success"
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full py-3 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Check In
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="neutral"
              onClick={handleRescan}
              disabled={loading}
              className="w-full mt-3 py-3 text-base"
            >
              Rescan
            </Button>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 text-lg mb-2">Check-in Successful!</h3>
                <div className="text-sm text-green-800 space-y-1">
                  {result.data && (
                    <>
                      {result.data.attendeeName && (
                        <p><strong>Attendee:</strong> {result.data.attendeeName}</p>
                      )}
                      {result.data.passType && (
                        <p><strong>Pass Type:</strong> {result.data.passType}</p>
                      )}
                      {result.data.timestamp && (
                        <p><strong>Time:</strong> {new Date(result.data.timestamp).toLocaleString()}</p>
                      )}
                    </>
                  )}
                </div>
                <p className="mt-3 text-xs text-green-600">Preparing for next student...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Result */}
        {error && (
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 text-lg mb-2">Check-in Failed</h3>
                <p className="text-sm text-red-800 mb-3">
                  {error.message || 'An error occurred during check-in'}
                </p>
                {error.error && (
                  <p className="text-xs text-red-600 font-mono break-all mb-4">
                    Error: {error.error}
                  </p>
                )}
                <Button
                  type="button"
                  variant="neutral"
                  onClick={handleRescan}
                  className="w-full py-3 text-base"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckinScan;
