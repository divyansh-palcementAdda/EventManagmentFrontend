import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  QrCode,
  Tag,
  ShieldAlert,
} from 'lucide-react';
import passAllotmentService from '../../../Api-Services/passAllotmentService';
import toast from 'react-hot-toast';
import useScrollLock from '../../../hooks/useScrollLock';

const PassAllotmentAnalyticsModal = ({
  isOpen,
  onClose,
  eventId,
  allottedTo,
  categoryCode,
  categoryName,
}) => {
  useScrollLock(isOpen);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [passes, setPasses] = useState([]);
  const [search, setSearch] = useState('');
  const [activationStatus, setActivationStatus] = useState('ALL');
  const [checkInStatus, setCheckInStatus] = useState('ALL');
  const [page, setPage] = useState(0);
  const [size] = useState(15);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchAnalytics = useCallback(async () => {
    if (!isOpen || !eventId || !allottedTo || !categoryCode) return;

    setLoading(true);
    try {
      const params = {
        allottedTo,
        categoryCode,
        page,
        size,
      };
      if (search.trim()) params.search = search.trim();
      if (activationStatus && activationStatus !== 'ALL') params.activationStatus = activationStatus;
      if (checkInStatus && checkInStatus !== 'ALL') params.checkInStatus = checkInStatus;

      const res = await passAllotmentService.getCategoryAnalytics(eventId, params);
      const data = res?.data?.summary ? res.data : (res?.data !== undefined ? res.data : res);
      setSummary(data?.summary || null);
      if (data?.passes) {
        setPasses(data.passes.content || (Array.isArray(data.passes) ? data.passes : []));
        setTotalPages(data.passes.totalPages || 0);
        setTotalElements(data.passes.totalElements || 0);
      } else {
        setPasses([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (err) {
      console.error('Failed to load pass allotment analytics:', err);
      toast.error(err.message || 'Failed to load allotment analytics');
    } finally {
      setLoading(false);
    }
  }, [isOpen, eventId, allottedTo, categoryCode, search, activationStatus, checkInStatus, page, size]);

  // Refetch when filters or pagination change
  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen, fetchAnalytics]);

  // Reset page when search or status filters change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleActivationFilterChange = (e) => {
    setActivationStatus(e.target.value);
    setPage(0);
  };

  const handleCheckInFilterChange = (e) => {
    setCheckInStatus(e.target.value);
    setPage(0);
  };

  // Helper for formatting date-time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '—';
    try {
      const d = new Date(timestamp);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  // CSV Export for the passes in this category allotment
  const exportToCsv = () => {
    if (!passes || passes.length === 0) {
      toast.error('No passes to export');
      return;
    }

    const headers = [
      'Pass Number',
      'Sequence #',
      'Category',
      'Attendee Name',
      'Attendee Email',
      'Activation Status',
      'Check-in Status',
      'Activated At',
      'Checked-in At',
    ];

    const rows = passes.map((p) => [
      `"${p.passNumber || ''}"`,
      p.sequenceNumber || '',
      `"${p.categoryName || p.category || ''}"`,
      `"${(p.attendeeName || '').replace(/"/g, '""')}"`,
      `"${(p.attendeeEmail || '').replace(/"/g, '""')}"`,
      p.status || '',
      p.checkedIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN',
      p.activatedAt ? formatDateTime(p.activatedAt) : '',
      p.firstCheckInTime ? formatDateTime(p.firstCheckInTime) : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `allotment_${allottedTo}_${categoryCode}_passes.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 bg-gradient-to-r from-purple-50/70 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Allotment Analytics: <span className="text-purple-700">{allottedTo}</span>
                </h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  {categoryName || categoryCode} ({categoryCode})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Detailed pass lifecycle, attendee activations, and gate check-in status
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCsv}
              disabled={loading || passes.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-2xs transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" /> Export CSV
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 5 Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. Total Allotted */}
            <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs text-center">
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">
                Total Allotted
              </span>
              <span className="text-lg sm:text-xl font-black text-gray-900 font-mono">
                {summary ? summary.totalAllotted : '—'}
              </span>
            </div>

            {/* 2. Total Activated */}
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 shadow-2xs text-center">
              <span className="text-[11px] font-medium text-purple-700 uppercase tracking-wider block">
                Activated
              </span>
              <span className="text-lg sm:text-xl font-black text-purple-700 font-mono">
                {summary ? summary.activated : '—'}
              </span>
            </div>

            {/* 3. Available (Allotted - Activated) */}
            <div className="p-3 bg-green-50/60 rounded-xl border border-green-200 shadow-2xs text-center">
              <span className="text-[11px] font-medium text-green-700 uppercase tracking-wider block">
                Available to Activate
              </span>
              <span className="text-lg sm:text-xl font-black text-green-700 font-mono">
                {summary ? summary.available : '—'}
              </span>
            </div>

            {/* 4. Checked In */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 shadow-2xs text-center">
              <span className="text-[11px] font-medium text-blue-700 uppercase tracking-wider block">
                Checked In
              </span>
              <span className="text-lg sm:text-xl font-black text-blue-700 font-mono">
                {summary ? summary.checkedIn : '—'}
              </span>
            </div>

            {/* 5. Activated but Not Checked In */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 shadow-2xs text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider block">
                Pending Check-in
              </span>
              <span className="text-lg sm:text-xl font-black text-amber-700 font-mono">
                {summary ? summary.activatedNotCheckedIn : '—'}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search pass #, name, or email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Status Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-500 font-medium">Activation:</span>
                <select
                  value={activationStatus}
                  onChange={handleActivationFilterChange}
                  className="text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVATED">Activated</option>
                  <option value="NOT_ACTIVATED">Not Activated</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-500 font-medium">Check-In:</span>
                <select
                  value={checkInStatus}
                  onChange={handleCheckInFilterChange}
                  className="text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL">All Gate Status</option>
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="NOT_CHECKED_IN">Not Checked In</option>
                </select>
              </div>

              <button
                type="button"
                onClick={fetchAnalytics}
                className="p-1.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-600 transition"
                title="Refresh Table"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Pass #</th>
                    <th className="py-2.5 px-3">Seq #</th>
                    <th className="py-2.5 px-3">Attendee Details</th>
                    <th className="py-2.5 px-3 text-center">Activation</th>
                    <th className="py-2.5 px-3 text-center">Check-In</th>
                    <th className="py-2.5 px-3">Activated At</th>
                    <th className="py-2.5 px-3">Checked In At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                          <span>Loading passes...</span>
                        </div>
                      </td>
                    </tr>
                  ) : passes.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <AlertCircle className="w-6 h-6 text-gray-400" />
                          <span className="font-medium">No passes match the selected filters</span>
                          <span className="text-[11px] text-gray-400">Try adjusting your search or filters</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    passes.map((pass) => (
                      <tr key={pass.passId} className="hover:bg-purple-50/20 transition-colors">
                        {/* Pass Number */}
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-700">
                          {pass.passNumber}
                        </td>

                        {/* Sequence Number */}
                        <td className="py-2.5 px-3 font-mono text-gray-500">
                          #{pass.sequenceNumber}
                        </td>

                        {/* Attendee Details */}
                        <td className="py-2.5 px-3">
                          {pass.attendeeName ? (
                            <div>
                              <div className="font-semibold text-gray-900">{pass.attendeeName}</div>
                              {pass.attendeeEmail && (
                                <div className="text-[11px] text-gray-500">{pass.attendeeEmail}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Not activated yet</span>
                          )}
                        </td>

                        {/* Activation Status Badge */}
                        <td className="py-2.5 px-3 text-center">
                          {pass.status === 'ACTIVATED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                              <CheckCircle2 className="w-3 h-3 text-green-600" /> Activated
                            </span>
                          ) : pass.status === 'REVOKED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <ShieldAlert className="w-3 h-3 text-red-600" /> Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">
                              <Clock className="w-3 h-3 text-yellow-600" /> Not Activated
                            </span>
                          )}
                        </td>

                        {/* Check-in Status Badge */}
                        <td className="py-2.5 px-3 text-center">
                          {pass.checkedIn ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <UserCheck className="w-3 h-3 text-blue-600" /> Checked In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-200">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Activated At */}
                        <td className="py-2.5 px-3 text-[11px] text-gray-600">
                          {formatDateTime(pass.activatedAt)}
                        </td>

                        {/* Checked In At */}
                        <td className="py-2.5 px-3 text-[11px] text-gray-600">
                          {formatDateTime(pass.firstCheckInTime)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50/50 text-xs text-gray-600">
                <span>
                  Showing page <span className="font-bold text-gray-900">{page + 1}</span> of{' '}
                  <span className="font-bold text-gray-900">{totalPages}</span> ({totalElements} total passes)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                    disabled={page === 0 || loading}
                    className="p-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                    disabled={page >= totalPages - 1 || loading}
                    className="p-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end p-3 sm:p-4 border-t border-gray-100 bg-gray-50/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-2xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PassAllotmentAnalyticsModal;
