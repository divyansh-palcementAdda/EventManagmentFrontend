import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  FileSpreadsheet,
  Filter,
  CheckCircle,
  Loader2,
  AlertCircle,
  QrCode,
  Layers,
  GraduationCap,
  Users,
} from 'lucide-react';
import passService from '../../../Api-Services/passService';
import toast from 'react-hot-toast';

const BulkDownloadPassesModal = ({ isOpen, onClose, event, eventDays = [] }) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [useRange, setUseRange] = useState(false);
  const [fromSeq, setFromSeq] = useState('');
  const [toSeq, setToSeq] = useState('');
  const [dayId, setDayId] = useState('');

  const [loading, setLoading] = useState(false);
  const [passesData, setPassesData] = useState([]);
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStatusFilter('');
      setCategoryFilter('ALL');
      setUseRange(false);
      setFromSeq('');
      setToSeq('');
      setDayId('');
      setPassesData([]);
      setIsPrintViewOpen(false);
    }
  }, [isOpen]);

  if (!isOpen || !event) return null;

  const fetchPassesForExport = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (categoryFilter && categoryFilter !== 'ALL') filters.category = categoryFilter;
      if (useRange) {
        if (!fromSeq || !toSeq) {
          toast.error('Please specify both starting and ending sequence numbers.');
          setLoading(false);
          return null;
        }
        if (parseInt(fromSeq) > parseInt(toSeq)) {
          toast.error('Starting sequence cannot be greater than ending sequence.');
          setLoading(false);
          return null;
        }
        filters.fromSequence = parseInt(fromSeq);
        filters.toSequence = parseInt(toSeq);
      }
      if (dayId) filters.dayId = dayId;

      const res = await passService.exportPasses(event.id, filters);
      const data = res.data || [];
      setPassesData(data);
      if (data.length === 0) {
        toast.error('No passes found matching the specified criteria.');
      }
      return data;
    } catch (err) {
      toast.error(err.message || 'Failed to fetch passes for export');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePrintCards = async () => {
    const data = await fetchPassesForExport();
    if (data && data.length > 0) {
      setIsPrintViewOpen(true);
    }
  };

  const handleExportCsv = async () => {
    const data = await fetchPassesForExport();
    if (!data || data.length === 0) return;

    // Build CSV content
    const headers = ['Pass Number', 'Sequence', 'Category', 'Status', 'Attendee Name', 'Attendee Email', 'Event Code', 'Event Name', 'Venue'];
    const rows = data.map((p) => [
      `"${p.passNumber || ''}"`,
      p.sequenceNumber || '',
      `"${p.category || 'STUDENT'}"`,
      `"${p.status || ''}"`,
      `"${p.attendeeName || ''}"`,
      `"${p.attendeeEmail || ''}"`,
      `"${p.eventCode || ''}"`,
      `"${p.eventName || ''}"`,
      `"${p.venue || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `passes_${event.eventCode}_${categoryFilter.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${data.length} passes to CSV`);
  };

  const getQrUrl = (tokenOrPass) => {
    const identifier = typeof tokenOrPass === 'string'
      ? tokenOrPass
      : (tokenOrPass?.passNumber || tokenOrPass?.qrData || '');
    const activationUrl = `${window.location.origin}/activate/${encodeURIComponent(identifier)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activationUrl)}`;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-600 text-white rounded-lg shadow-sm">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Bulk Download Passes</h2>
                <p className="text-xs text-gray-500">
                  Event: <span className="font-semibold text-purple-700">{event.name}</span> ({event.eventCode})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Filter Options */}
          <div className="p-6 space-y-4 text-xs text-gray-700">
            {/* Category Filter */}
            <div>
              <label className="block font-semibold text-gray-800 mb-1.5">Pass Category</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'ALL', label: 'All Categories' },
                  { value: 'STUDENT', label: '🎓 Student' },
                  { value: 'OTHER', label: '👥 Other' },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategoryFilter(cat.value)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition ${
                      categoryFilter === cat.value
                        ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block font-semibold text-gray-800 mb-1.5">Pass Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">All Statuses (Active, Available, Revoked)</option>
                <option value="NOT_ACTIVATED">Unactivated Passes Only (Available)</option>
                <option value="ACTIVATED">Activated Passes Only (Claimed)</option>
                <option value="REVOKED">Revoked Passes Only</option>
              </select>
            </div>

            {/* Sequence Range Toggle */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-3">
              <label className="flex items-center gap-2 font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useRange}
                  onChange={(e) => setUseRange(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Filter by Pass Sequence Number Range</span>
              </label>

              {useRange && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">From Sequence #</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 1"
                      value={fromSeq}
                      onChange={(e) => setFromSeq(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">To Sequence #</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 50"
                      value={toSeq}
                      onChange={(e) => setToSeq(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Permitted Day Filter */}
            {eventDays.length > 0 && (
              <div>
                <label className="block font-semibold text-gray-800 mb-1.5">Permitted Event Day</label>
                <select
                  value={dayId}
                  onChange={(e) => setDayId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">All Days</option>
                  {eventDays.map((d) => (
                    <option key={d.id} value={d.id}>
                      Day {d.dayNumber}: {d.eventDate || d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Format explanation */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-purple-700" />
                Print-Ready QR Passes
              </div>
              <p className="text-purple-700">
                Generates high-resolution QR badges formatted with event title, category, pass ID, venue, and dates. Unactivated passes omit personal data for security.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
            <button
              onClick={handleExportCsv}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 transition shadow-sm disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Export CSV
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePrintCards}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Fetching Passes...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    Print Passes Sheet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT PREVIEW OVERLAY / WINDOW */}
      {isPrintViewOpen && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto p-6 text-gray-900 print:p-0">
          {/* Top Bar for Screen only */}
          <div className="no-print max-w-6xl mx-auto mb-6 p-4 bg-gray-900 text-white rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">Print Preview ({passesData.length} Passes)</h3>
              <p className="text-xs text-gray-400">
                Click "Print Now" to generate print-ready physical cards or PDF badges.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
              >
                <Printer className="w-4 h-4" /> Print Now (PDF / Paper)
              </button>
              <button
                onClick={() => setIsPrintViewOpen(false)}
                className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
            {passesData.map((p, idx) => (
              <div
                key={p.passId || idx}
                className="border-2 border-gray-300 rounded-2xl p-5 bg-white shadow-sm flex flex-col items-center justify-between text-center relative print:shadow-none print:border-gray-800 print:break-inside-avoid print:page-break-after-avoid"
                style={{ minHeight: '360px' }}
              >
                <div className="w-full border-b pb-2">
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold tracking-wider">
                    <span className="text-purple-700 uppercase font-extrabold">{p.eventCode}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      p.category === 'OTHER'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {p.category === 'OTHER' ? '👥 OTHER PASS' : '🎓 STUDENT PASS'}
                    </span>
                    <span>PASS #{p.sequenceNumber || idx + 1}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-900 mt-1 truncate">{p.eventName}</h4>
                  <p className="text-[11px] text-gray-500 truncate">{p.venue || 'Official Venue'}</p>
                </div>

                <div className="my-3 p-2 bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
                  <img
                    src={getQrUrl(p)}
                    alt={`QR for ${p.passNumber}`}
                    className="w-36 h-36 object-contain mx-auto"
                    loading="lazy"
                  />
                </div>

                <div className="w-full">
                  <div className="font-mono font-black text-sm tracking-wider text-purple-900 bg-purple-50 py-1 px-2 rounded border border-purple-200">
                    {p.passNumber}
                  </div>

                  {p.attendeeName ? (
                    <div className="mt-2 text-xs font-semibold text-gray-800">
                      Attendee: <span className="text-purple-700">{p.attendeeName}</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-[10px] font-medium text-amber-700 bg-amber-50 rounded px-1.5 py-0.5">
                      Unactivated · Scan QR to register attendee
                    </div>
                  )}

                  {p.validDays && p.validDays.length > 0 && (
                    <div className="mt-1 text-[10px] text-gray-500">
                      Valid: {p.validDays.map((d) => `Day ${d.dayNumber}`).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default BulkDownloadPassesModal;
