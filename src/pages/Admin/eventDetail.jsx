import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventsService from '../../Api-Services/eventsService';
import passService from '../../Api-Services/passService';
import BulkDownloadPassesModal from '../../Components/Modals/passes/BulkDownloadPassesModal';
import BulkActivationModal from '../../Components/Modals/passes/BulkActivationModal';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  Ticket,
  Shield,
  CheckCircle,
  XCircle,
  Plus,
  Printer,
  QrCode,
  Download,
  AlertTriangle,
  Loader2,
  X,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  Check,
  Layers,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [eventDays, setEventDays] = useState([]);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passesLoading, setPassesLoading] = useState(false);

  // Live Pass Statistics
  const [passStats, setPassStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Pass Generation Modal State
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [batchSize, setBatchSize] = useState(5);
  const [selectedDayIds, setSelectedDayIds] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [newlyGeneratedPasses, setNewlyGeneratedPasses] = useState([]);

  // Bulk Modals State
  const [isBulkDownloadOpen, setIsBulkDownloadOpen] = useState(false);
  const [isBulkActivateOpen, setIsBulkActivateOpen] = useState(false);

  // Table Filters & Search
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Printable Pass Modal
  const [activePrintPass, setActivePrintPass] = useState(null);

  // Revoke Modal
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [passToRevoke, setPassToRevoke] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  useEffect(() => {
    fetchEventDetails();
    fetchEventDays();
    fetchPasses();
    fetchPassStats();
  }, [eventId]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const response = await eventsService.getEventById(eventId);
      setEvent(response.data);
    } catch (error) {
      toast.error('Failed to fetch event details');
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDays = async () => {
    try {
      const response = await eventsService.getEventDays(eventId);
      setEventDays(response.data || []);
    } catch (error) {
      console.error('Error fetching event days:', error);
    }
  };

  const fetchPasses = async () => {
    setPassesLoading(true);
    try {
      const response = await passService.getPassesByEvent(eventId, 0, 100);
      setPasses(response.data?.content || []);
    } catch (error) {
      console.error('Error fetching passes:', error);
    } finally {
      setPassesLoading(false);
    }
  };

  const fetchPassStats = async () => {
    setStatsLoading(true);
    try {
      const response = await passService.getPassStats(eventId);
      setPassStats(response.data);
    } catch (error) {
      console.error('Error fetching pass stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    try {
      await Promise.all([fetchEventDetails(), fetchEventDays(), fetchPasses(), fetchPassStats()]);
      toast.success('Event data refreshed!');
    } catch (err) {
      toast.error('Failed to refresh data');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await eventsService.updateEventStatus(eventId, newStatus);
      toast.success(`Event status updated to ${newStatus}`);
      fetchEventDetails();
    } catch (err) {
      toast.error('Failed to update event status');
    }
  };

  const handleGeneratePasses = async (e) => {
    e.preventDefault();
    if (batchSize < 1 || batchSize > 500) {
      toast.error('Batch size must be between 1 and 500');
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        eventId,
        batchSize: parseInt(batchSize),
        validDayIds: selectedDayIds.length > 0 ? selectedDayIds : null,
      };

      const response = await passService.generatePasses(payload);
      const generated = response.data || [];
      setNewlyGeneratedPasses(generated);
      toast.success(`Successfully generated ${generated.length} passes!`);
      fetchPasses();
      fetchPassStats();
      fetchEventDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to generate passes');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokePass = async () => {
    if (!passToRevoke) return;
    try {
      await passService.revokePass(passToRevoke.id, revokeReason);
      toast.success('Pass revoked successfully');
      setRevokeModalOpen(false);
      setPassToRevoke(null);
      setRevokeReason('');
      fetchPasses();
      fetchPassStats();
    } catch (err) {
      toast.error(err.message || 'Failed to revoke pass');
    }
  };

  const toggleDaySelection = (dayId) => {
    setSelectedDayIds((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      PUBLISHED: 'bg-blue-100 text-blue-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const getPassStatusBadge = (status) => {
    const statusStyles = {
      NOT_ACTIVATED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      ACTIVATED: 'bg-green-50 text-green-700 border-green-200',
      REVOKED: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusStyles[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  const filteredPasses = passes.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchPass = p.passNumber?.toLowerCase().includes(q);
      const matchName = p.attendeeName?.toLowerCase().includes(q);
      const matchEmail = p.attendeeEmail?.toLowerCase().includes(q);
      const matchSeq = p.sequenceNumber ? String(p.sequenceNumber).includes(q) : false;
      return matchPass || matchName || matchEmail || matchSeq;
    }
    return true;
  });

  // QR Code URL helper
  const getQrImageUrl = (tokenOrNumber) => {
    const activationUrl = `${window.location.origin}/activate/${encodeURIComponent(tokenOrNumber)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activationUrl)}`;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-10 w-10 text-purple-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center py-12">
        <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
        <button
          onClick={() => navigate('/admin/events')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/events')}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{event.name}</h1>
              <span className="font-mono text-sm font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded">
                {event.eventCode}
              </span>
              {getStatusBadge(event.status)}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">{event.description || 'No description provided'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {event.status === 'DRAFT' && (
            <button
              onClick={() => handleStatusChange('ACTIVE')}
              className="px-3.5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition shadow-sm"
            >
              Activate Event
            </button>
          )}
          {event.status === 'ACTIVE' && (
            <button
              onClick={() => handleStatusChange('COMPLETED')}
              className="px-3.5 py-2 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition shadow-sm"
            >
              Complete Event
            </button>
          )}
          <button
            onClick={() => {
              setNewlyGeneratedPasses([]);
              setIsGenModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Generate Passes
          </button>
          <button
            onClick={() => navigate(`/admin/checkin/${event.id}`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            <QrCode className="w-4 h-4" /> Gate Scanner
          </button>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-purple-600" /> Event Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Pass Series:</span>
              <span className="font-mono font-semibold text-gray-900">{event.passSeriesCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Venue:</span>
              <span className="text-gray-900 font-medium">{event.venue || 'TBD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Timezone:</span>
              <span className="text-gray-900">{event.timezone || 'UTC'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dates:</span>
              <span className="text-gray-900 font-medium">
                {formatDate(event.startsAt)} - {formatDate(event.endsAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Pass Capacity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-600" /> Pass Capacity
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Maximum Allowed:</span>
              <span className="font-bold text-gray-900">{event.maximumPasses || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Generated:</span>
              <span className="font-bold text-purple-600">{event.totalPassesGenerated || passes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Passes Remaining:</span>
              <span className="font-bold text-green-600">
                {Math.max(0, (event.maximumPasses || 0) - (event.totalPassesGenerated || passes.length))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Check-in Policy:</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {event.checkInPolicy?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Event Days */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-600" /> Event Days ({eventDays.length})
          </h3>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {eventDays.length === 0 ? (
              <p className="text-xs text-gray-500">Single day event.</p>
            ) : (
              eventDays.map((day) => (
                <div
                  key={day.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs border border-gray-100"
                >
                  <span className="font-bold text-gray-800">Day {day.dayNumber}</span>
                  <span className="text-gray-600">{day.eventDate || day.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Passes for This Event Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Section Header & Live Metric Chips */}
        <div className="p-5 border-b border-gray-200 space-y-4 bg-gradient-to-r from-gray-50/50 to-purple-50/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Passes for this Event</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  {event.eventCode}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage unique pass identities, bulk QR generation, Excel batch activation, and gate credentials.
              </p>
            </div>

            {/* Primary Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewlyGeneratedPasses([]);
                  setIsGenModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
              >
                <Plus className="w-4 h-4" /> Generate Passes
              </button>

              <button
                type="button"
                onClick={() => setIsBulkDownloadOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold shadow-sm transition"
              >
                <Download className="w-4 h-4 text-purple-600" /> Bulk Download QR Passes
              </button>

              <button
                type="button"
                onClick={() => setIsBulkActivateOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold shadow-sm transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Bulk Activate from Excel
              </button>

              <button
                type="button"
                onClick={handleRefreshAll}
                className="p-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg transition shadow-sm"
                title="Refresh Passes & Statistics"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Statistics Counter Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            <div className="p-2.5 bg-white rounded-xl border border-gray-200 text-center shadow-xs">
              <span className="text-[11px] text-gray-500 font-medium">Total Passes</span>
              <div className="text-base font-black text-gray-900">
                {statsLoading ? '...' : (passStats?.totalPasses ?? passes.length)}
              </div>
            </div>
            <div className="p-2.5 bg-green-50/70 rounded-xl border border-green-200 text-center shadow-xs">
              <span className="text-[11px] text-green-700 font-medium">Available (Unactivated)</span>
              <div className="text-base font-black text-green-800">
                {statsLoading ? '...' : (passStats?.availablePasses ?? 0)}
              </div>
            </div>
            <div className="p-2.5 bg-purple-50/70 rounded-xl border border-purple-200 text-center shadow-xs">
              <span className="text-[11px] text-purple-700 font-medium">Activated Passes</span>
              <div className="text-base font-black text-purple-800">
                {statsLoading ? '...' : (passStats?.activatedPasses ?? 0)}
              </div>
            </div>
            <div className="p-2.5 bg-red-50/70 rounded-xl border border-red-200 text-center shadow-xs">
              <span className="text-[11px] text-red-700 font-medium">Revoked Passes</span>
              <div className="text-base font-black text-red-800">
                {statsLoading ? '...' : (passStats?.revokedPasses ?? 0)}
              </div>
            </div>
            <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 text-center shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[11px] text-blue-700 font-medium">Gate Checked-In</span>
              <div className="text-base font-black text-blue-800">
                {statsLoading ? '...' : (passStats?.checkedInCount ?? 0)}
              </div>
            </div>
          </div>

          {/* Search & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Passes ({passes.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('NOT_ACTIVATED')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'NOT_ACTIVATED'
                    ? 'bg-yellow-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Available
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVATED')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'ACTIVATED'
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Activated
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('REVOKED')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'REVOKED'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Revoked
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pass #, attendee, email..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Body */}
        {passesLoading ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="text-sm mt-2">Loading passes...</p>
          </div>
        ) : filteredPasses.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <Ticket className="w-12 h-12 mx-auto text-gray-300" />
            <p className="font-bold text-gray-700">
              {passes.length === 0 ? 'No passes generated yet.' : 'No passes match your filter criteria.'}
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {passes.length === 0
                ? 'Click "Generate Passes" or "Bulk Activate from Excel" to issue credentials for attendees.'
                : 'Try clearing your search query or switching status filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3">Pass Identifier</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Attendee Information</th>
                  <th className="px-5 py-3">Permitted Days</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPasses.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-3">
                      <div className="font-mono font-bold text-purple-700 text-sm">
                        {p.passNumber}
                      </div>
                      {p.sequenceNumber && (
                        <div className="text-[10px] text-gray-400 font-mono">
                          Seq #{String(p.sequenceNumber).padStart(4, '0')}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">{getPassStatusBadge(p.status)}</td>
                    <td className="px-5 py-3">
                      {p.attendeeName ? (
                        <div>
                          <div className="font-semibold text-gray-900">{p.attendeeName}</div>
                          <div className="text-xs text-gray-500">{p.attendeeEmail}</div>
                          {p.attendeeMobileNumber && (
                            <div className="text-[10px] text-gray-400">{p.attendeeMobileNumber}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unclaimed (Pending Scan)</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {p.validDays && p.validDays.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.validDays.map((d) => (
                            <span
                              key={d.id}
                              className="bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            >
                              Day {d.dayNumber}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">All Days</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setActivePrintPass(p)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" /> Printable Pass
                      </button>
                      {p.status !== 'REVOKED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setPassToRevoke(p);
                            setRevokeModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition font-medium"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GENERATE PASSES MODAL */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Generate Unique Passes</h2>
                <p className="text-xs text-gray-500">Event: {event.name}</p>
              </div>
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newlyGeneratedPasses.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-bold text-green-900">
                    {newlyGeneratedPasses.length} Passes Generated!
                  </h3>
                  <p className="text-xs text-green-700 mt-1">
                    Raw QR tokens have been generated. Below is the batch preview.
                  </p>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y border rounded-lg text-xs">
                  {newlyGeneratedPasses.map((p) => (
                    <div key={p.id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-purple-700">{p.passNumber}</span>
                        {p.rawToken && (
                          <div className="text-[10px] text-gray-400 font-mono truncate max-w-xs">
                            Token: {p.rawToken}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setActivePrintPass(p);
                          setIsGenModalOpen(false);
                        }}
                        className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold rounded text-xs flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> View Pass
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsGenModalOpen(false)}
                  className="w-full py-2.5 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition text-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleGeneratePasses} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Batch Size (Number of passes to generate)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={batchSize}
                    onChange={(e) => setBatchSize(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Format: {event.eventCode}-{event.passSeriesCode}-000001
                  </p>
                </div>

                {/* Day Selection Checkboxes */}
                {eventDays.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Permitted Event Days (Leave blank to permit ALL days)
                    </label>
                    <div className="space-y-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
                      {eventDays.map((day) => {
                        const checked = selectedDayIds.includes(day.id);
                        return (
                          <label
                            key={day.id}
                            className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleDaySelection(day.id)}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span className="font-semibold">Day {day.dayNumber}:</span>
                            <span>{day.eventDate || day.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGenModalOpen(false)}
                    className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                      </>
                    ) : (
                      'Generate Passes'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PRINTABLE PASS MODAL */}
      {activePrintPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 overflow-hidden">
            {/* Header / Close */}
            <div className="p-3 bg-gray-100 border-b flex justify-between items-center text-xs font-semibold text-gray-700">
              <span>Printable Event Pass Card</span>
              <button
                onClick={() => setActivePrintPass(null)}
                className="p-1 rounded hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* The Pass Card (Printable Area) */}
            <div id="printable-card" className="p-6 text-center space-y-4 bg-white">
              <div className="border-b pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  OFFICIAL EVENT PASS
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-2">{event.name}</h3>
                <p className="text-xs text-gray-500">{event.venue || 'Event Venue'}</p>
              </div>

              {/* QR Code Container */}
              <div className="bg-gray-50 p-3 rounded-xl border inline-block mx-auto shadow-inner">
                <img
                  src={getQrImageUrl(activePrintPass.rawToken || activePrintPass.passNumber)}
                  alt="QR Pass"
                  className="w-44 h-44 object-contain mx-auto"
                />
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium">Pass Identifier</p>
                <p className="font-mono font-black text-xl text-purple-800 tracking-wider">
                  {activePrintPass.passNumber}
                </p>
              </div>

              {activePrintPass.attendeeName ? (
                <div className="bg-purple-50/70 p-2.5 rounded-lg text-xs">
                  <span className="text-gray-500">Attendee: </span>
                  <strong className="text-gray-900">{activePrintPass.attendeeName}</strong>
                </div>
              ) : (
                <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  Scan QR with your smartphone to activate attendee registration
                </div>
              )}

              {activePrintPass.validDays && activePrintPass.validDays.length > 0 && (
                <div className="text-[11px] text-gray-600 flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="font-medium">Valid for:</span>
                  {activePrintPass.validDays.map((d) => (
                    <span
                      key={d.id}
                      className="bg-gray-100 font-semibold px-2 py-0.5 rounded text-[10px]"
                    >
                      Day {d.dayNumber}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Print actions footer */}
            <div className="p-4 bg-gray-50 border-t flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print Pass
              </button>
              <button
                type="button"
                onClick={() => setActivePrintPass(null)}
                className="px-4 py-2 border bg-white rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE PASS MODAL */}
      {revokeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg text-gray-900">Revoke Pass</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to revoke pass{' '}
              <strong className="font-mono text-gray-900">{passToRevoke?.passNumber}</strong>? Once
              revoked, it cannot be used for gate check-in or reactivation.
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Revocation Reason
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Lost badge, cancelled registration, duplicate issuance"
                rows={3}
                className="w-full p-2.5 border rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevokeModalOpen(false)}
                className="px-3.5 py-1.5 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokePass}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow transition"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}
      {/* BULK DOWNLOAD PASSES MODAL */}
      <BulkDownloadPassesModal
        isOpen={isBulkDownloadOpen}
        onClose={() => setIsBulkDownloadOpen(false)}
        event={event}
        eventDays={eventDays}
      />

      {/* BULK ACTIVATION FROM EXCEL MODAL */}
      <BulkActivationModal
        isOpen={isBulkActivateOpen}
        onClose={() => setIsBulkActivateOpen(false)}
        event={event}
        onActivationComplete={handleRefreshAll}
      />
    </div>
  );
};

export default EventDetail;
