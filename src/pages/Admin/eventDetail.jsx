import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventsService from '../../Api-Services/eventsService';
import passService from '../../Api-Services/passService';
import BulkDownloadPassesModal from '../../Components/Modals/passes/BulkDownloadPassesModal';
import BulkActivationModal from '../../Components/Modals/passes/BulkActivationModal';
import ManagePassValidityModal from '../../Components/Modals/passes/ManagePassValidityModal';
import GatekeeperManagementModal from '../../Components/Modals/gatekeepers/GatekeeperManagementModal';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  Ticket,
  Shield,
  ShieldCheck,
  CheckCircle,
  CheckCircle2,
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
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Event & Days State
  const [event, setEvent] = useState(null);
  const [eventDays, setEventDays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live Statistics State
  const [passStats, setPassStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [gatekeeperCount, setGatekeeperCount] = useState(0);

  // Passes Pagination & Filtering State (Server-Side)
  const [passes, setPasses] = useState([]);
  const [passesLoading, setPassesLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [checkInFilter, setCheckInFilter] = useState('ALL');
  const [dayFilter, setDayFilter] = useState('ALL');
  const [fromSeqFilter, setFromSeqFilter] = useState('');
  const [toSeqFilter, setToSeqFilter] = useState('');
  const [sortBy, setSortBy] = useState('sequenceNumber');
  const [sortDir, setSortDir] = useState('asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Selection for bulk actions
  const [selectedPassMap, setSelectedPassMap] = useState({});

  // Pass Generation Modal State
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [batchSize, setBatchSize] = useState(5);
  const [selectedGenDayIds, setSelectedGenDayIds] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [newlyGeneratedPasses, setNewlyGeneratedPasses] = useState([]);

  // Modals State
  const [isBulkDownloadOpen, setIsBulkDownloadOpen] = useState(false);
  const [isBulkActivateOpen, setIsBulkActivateOpen] = useState(false);
  const [isValidityModalOpen, setIsValidityModalOpen] = useState(false);
  const [singlePassForValidity, setSinglePassForValidity] = useState(null);
  const [isGatekeeperModalOpen, setIsGatekeeperModalOpen] = useState(false);

  // Printable Pass Modal
  const [activePrintPass, setActivePrintPass] = useState(null);

  // Revoke Modal
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [passToRevoke, setPassToRevoke] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  // 300ms Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0); // Reset to page 0 on search input change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial Data Fetch
  useEffect(() => {
    fetchEventDetails();
    fetchEventDays();
    fetchPassStats();
    fetchGatekeepers();
  }, [eventId]);

  // Fetch Passes whenever filters, pagination, or sorting change
  useEffect(() => {
    fetchPasses();
  }, [
    eventId,
    page,
    pageSize,
    debouncedSearch,
    statusFilter,
    checkInFilter,
    dayFilter,
    fromSeqFilter,
    toSeqFilter,
    sortBy,
    sortDir,
  ]);

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

  const fetchGatekeepers = async () => {
    try {
      const response = await eventsService.getGatekeepers(eventId);
      const list = response.data || [];
      setGatekeeperCount(list.length);
    } catch (error) {
      console.error('Error fetching gatekeepers:', error);
    }
  };

  const fetchPasses = async () => {
    setPassesLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
        sortBy,
        sortDir,
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (checkInFilter !== 'ALL') params.checkInStatus = checkInFilter;
      if (dayFilter !== 'ALL') params.eventDayId = dayFilter;
      if (fromSeqFilter && !isNaN(parseInt(fromSeqFilter))) {
        params.fromSequence = parseInt(fromSeqFilter);
      }
      if (toSeqFilter && !isNaN(parseInt(toSeqFilter))) {
        params.toSequence = parseInt(toSeqFilter);
      }

      const response = await passService.getPassesByEvent(eventId, params);
      const data = response.data;
      setPasses(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (error) {
      console.error('Error fetching passes:', error);
      toast.error('Failed to fetch passes');
    } finally {
      setPassesLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        fetchEventDetails(),
        fetchEventDays(),
        fetchPasses(),
        fetchPassStats(),
        fetchGatekeepers(),
      ]);
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
        validDayIds: selectedGenDayIds.length > 0 ? selectedGenDayIds : null,
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

  // Row selection helpers
  const selectedPassesList = useMemo(() => {
    return Object.values(selectedPassMap);
  }, [selectedPassMap]);

  const toggleSelectPass = (pass) => {
    setSelectedPassMap((prev) => {
      const copy = { ...prev };
      if (copy[pass.id]) {
        delete copy[pass.id];
      } else {
        copy[pass.id] = pass;
      }
      return copy;
    });
  };

  const toggleSelectAllOnPage = () => {
    const allSelectedOnPage = passes.length > 0 && passes.every((p) => !!selectedPassMap[p.id]);
    if (allSelectedOnPage) {
      setSelectedPassMap((prev) => {
        const copy = { ...prev };
        passes.forEach((p) => delete copy[p.id]);
        return copy;
      });
    } else {
      setSelectedPassMap((prev) => {
        const copy = { ...prev };
        passes.forEach((p) => {
          copy[p.id] = p;
        });
        return copy;
      });
    }
  };

  const clearSelection = () => {
    setSelectedPassMap({});
  };

  const handleOpenValidityForSingle = (pass) => {
    setSinglePassForValidity(pass);
    setIsValidityModalOpen(true);
  };

  const handleOpenValidityBulk = () => {
    setSinglePassForValidity(null);
    setIsValidityModalOpen(true);
  };

  const toggleGenDaySelection = (dayId) => {
    setSelectedGenDayIds((prev) =>
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-700'
          }`}
      >
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
      <span
        className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusStyles[status] || 'bg-gray-50 text-gray-700 border-gray-200'
          }`}
      >
        {status?.replace('_', ' ')}
      </span>
    );
  };

  // QR Code URL helper
  const getQrImageUrl = (tokenOrNumber) => {
    const activationUrl = `${window.location.origin}/activate/${encodeURIComponent(tokenOrNumber)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      activationUrl
    )}`;
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
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/events')}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{event.name}</h1>
              <span className="font-mono text-xs sm:text-sm font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded shrink-0">
                {event.eventCode}
              </span>
              {getStatusBadge(event.status)}
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">{event.description || 'No description provided'}</p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {event.status === 'DRAFT' && (
            <button
              onClick={() => handleStatusChange('ACTIVE')}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-green-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-green-700 transition shadow-sm"
            >
              Activate Event
            </button>
          )}
          {event.status === 'ACTIVE' && (
            <button
              onClick={() => handleStatusChange('COMPLETED')}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-gray-700 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-800 transition shadow-sm"
            >
              Complete Event
            </button>
          )}

          <button
            onClick={() => setIsGatekeeperModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs sm:text-sm font-bold rounded-lg hover:bg-indigo-100 transition shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" /> Gatekeepers
            <span className="bg-indigo-200 text-indigo-900 text-xs px-1.5 py-0.2 rounded-full font-mono">
              {gatekeeperCount}
            </span>
          </button>

          <button
            onClick={() => navigate(`/admin/checkin/${event.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Gate Scanner
          </button>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-purple-600" /> Event Details
          </h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Pass Series:</span>
              <span className="font-mono font-semibold text-gray-900">{event.passSeriesCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Venue:</span>
              <span className="text-gray-900 font-medium truncate ml-2">{event.venue || 'TBD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Timezone:</span>
              <span className="text-gray-900">{event.timezone || 'UTC'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-gray-500">Dates:</span>
              <span className="text-gray-900 font-medium">
                {formatDate(event.startsAt)} - {formatDate(event.endsAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Pass Capacity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-600" /> Pass Capacity
          </h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Maximum Allowed:</span>
              <span className="font-bold text-gray-900">{event.maximumPasses || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Generated:</span>
              <span className="font-bold text-purple-600">
                {event.totalPassesGenerated || totalElements}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Passes Remaining:</span>
              <span className="font-bold text-green-600">
                {Math.max(
                  0,
                  (event.maximumPasses || 0) - (event.totalPassesGenerated || totalElements)
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Check-in Policy:</span>
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {event.checkInPolicy?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Event Days */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 space-y-3 sm:col-span-2 lg:col-span-1">
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
        <div className="p-4 sm:p-5 border-b border-gray-200 space-y-4 bg-gradient-to-r from-gray-50/50 to-purple-50/20">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Passes for this Event</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  {event.eventCode}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage unique pass identities, multi-day validity rules, bulk downloads, and gate check-in status.
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Generate Passes
              </button>

              <button
                type="button"
                onClick={handleOpenValidityBulk}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold shadow-sm transition"
              >
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" /> Manage Validity
              </button>

              <button
                type="button"
                onClick={() => setIsBulkDownloadOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" /> Bulk Download
              </button>

              <button
                type="button"
                onClick={() => setIsBulkActivateOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold shadow-sm transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" /> Bulk Activate
              </button>

              <button
                type="button"
                onClick={() => setIsGatekeeperModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold shadow-sm transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" /> Gatekeepers ({gatekeeperCount})
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 pt-1">
            <div className="p-2 sm:p-2.5 bg-white rounded-xl border border-gray-200 text-center shadow-xs">
              <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">Total Passes</span>
              <div className="text-sm sm:text-base font-black text-gray-900">
                {statsLoading ? '...' : passStats?.totalPasses ?? totalElements}
              </div>
            </div>
            <div className="p-2 sm:p-2.5 bg-green-50/70 rounded-xl border border-green-200 text-center shadow-xs">
              <span className="text-[10px] sm:text-[11px] text-green-700 font-medium">Available</span>
              <div className="text-sm sm:text-base font-black text-green-800">
                {statsLoading ? '...' : passStats?.availablePasses ?? 0}
              </div>
            </div>
            <div className="p-2 sm:p-2.5 bg-purple-50/70 rounded-xl border border-purple-200 text-center shadow-xs">
              <span className="text-[10px] sm:text-[11px] text-purple-700 font-medium">Activated</span>
              <div className="text-sm sm:text-base font-black text-purple-800">
                {statsLoading ? '...' : passStats?.activatedPasses ?? 0}
              </div>
            </div>
            <div className="p-2 sm:p-2.5 bg-red-50/70 rounded-xl border border-red-200 text-center shadow-xs">
              <span className="text-[10px] sm:text-[11px] text-red-700 font-medium">Revoked</span>
              <div className="text-sm sm:text-base font-black text-red-800">
                {statsLoading ? '...' : passStats?.revokedPasses ?? 0}
              </div>
            </div>
            <div className="p-2 sm:p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 text-center shadow-xs col-span-2 sm:col-span-3 lg:col-span-1">
              <span className="text-[10px] sm:text-[11px] text-blue-700 font-medium">Checked-In</span>
              <div className="text-sm sm:text-base font-black text-blue-800">
                {statsLoading ? '...' : passStats?.checkedInCount ?? 0}
              </div>
            </div>
          </div>

          {/* Search, Filter Toolbar & Advanced Filters */}
          <div className="space-y-2 sm:space-y-3 pt-2 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold pb-1 -mx-1 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${statusFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  All Statuses
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('NOT_ACTIVATED');
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${statusFilter === 'NOT_ACTIVATED'
                    ? 'bg-yellow-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ACTIVATED');
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${statusFilter === 'ACTIVATED'
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Activated
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('REVOKED');
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${statusFilter === 'REVOKED'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Revoked
                </button>
              </div>

              {/* Search Bar & Advanced Filter Toggle */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pass #, attendee, email..."
                    className="w-full pl-9 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
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

                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`p-2 border rounded-lg text-xs font-semibold transition flex items-center gap-1 shrink-0 ${showAdvancedFilters || checkInFilter !== 'ALL' || dayFilter !== 'ALL' || fromSeqFilter
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  title="Advanced Filters"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>
            </div>

            {/* Advanced Filters Expandable Drawer */}
            {showAdvancedFilters && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Check-In Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Check-in Status
                  </label>
                  <select
                    value={checkInFilter}
                    onChange={(e) => {
                      setCheckInFilter(e.target.value);
                      setPage(0);
                    }}
                    className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="ALL">All Entries</option>
                    <option value="CHECKED_IN">Checked In</option>
                    <option value="NOT_CHECKED_IN">Not Checked In</option>
                  </select>
                </div>

                {/* Event Day Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Permitted Day
                  </label>
                  <select
                    value={dayFilter}
                    onChange={(e) => {
                      setDayFilter(e.target.value);
                      setPage(0);
                    }}
                    className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="ALL">All Permitted Days</option>
                    {eventDays.map((d) => (
                      <option key={d.id} value={d.id}>
                        Day {d.dayNumber} ({d.eventDate})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sequence Range Filters */}
                <div className="sm:col-span-2 lg:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="flex-1 w-full">
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                      From Sequence #
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1"
                      value={fromSeqFilter}
                      onChange={(e) => {
                        setFromSeqFilter(e.target.value);
                        setPage(0);
                      }}
                      className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                      To Sequence #
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={toSeqFilter}
                      onChange={(e) => {
                        setToSeqFilter(e.target.value);
                        setPage(0);
                      }}
                      className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  {(checkInFilter !== 'ALL' || dayFilter !== 'ALL' || fromSeqFilter || toSeqFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCheckInFilter('ALL');
                        setDayFilter('ALL');
                        setFromSeqFilter('');
                        setToSeqFilter('');
                        setPage(0);
                      }}
                      className="mt-4 sm:mt-5 px-2 py-1.5 text-xs text-red-600 hover:underline whitespace-nowrap"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Bulk Selection Notification Bar */}
            {selectedPassesList.length > 0 && (
              <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs text-purple-900">
                <div className="flex items-center gap-2">
                  <span className="font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full text-[11px]">
                    {selectedPassesList.length}
                  </span>
                  <span>pass(es) selected on this page / view</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenValidityBulk}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Layers className="w-3.5 h-3.5" /> Set Validity
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-2 py-1 text-gray-500 hover:text-gray-700 font-semibold"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Passes Table Body */}
        {passesLoading ? (
          <div className="p-8 sm:p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="text-sm mt-2">Loading passes from server...</p>
          </div>
        ) : passes.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-gray-500 space-y-2">
            <Ticket className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300" />
            <p className="font-bold text-gray-700 text-sm sm:text-base">
              {totalElements === 0 ? 'No passes generated yet.' : 'No passes match your filter criteria.'}
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {totalElements === 0
                ? 'Click "Generate Passes" or "Bulk Activate from Excel" to issue credentials for attendees.'
                : 'Try clearing your search query or adjusting filter values.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-600 text-[10px] sm:text-xs uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 w-8">
                    <input
                      type="checkbox"
                      checked={passes.length > 0 && passes.every((p) => !!selectedPassMap[p.id])}
                      onChange={toggleSelectAllOnPage}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3">Pass ID</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3">Status</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3">Check-in</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3">Attendee</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3">Days</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {passes.map((p) => {
                  const isSelected = !!selectedPassMap[p.id];
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50/80 transition ${isSelected ? 'bg-purple-50/40' : ''
                        }`}
                    >
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectPass(p)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="font-mono font-bold text-purple-700 text-xs sm:text-sm">
                          {p.passNumber}
                        </div>
                        {p.sequenceNumber && (
                          <div className="text-[9px] sm:text-[10px] text-gray-400 font-mono">
                            Seq #{String(p.sequenceNumber).padStart(4, '0')}
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">{getPassStatusBadge(p.status)}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        {p.checkedIn ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                              <span className="hidden sm:inline">Checked In</span>
                              <span className="sm:hidden">In</span>
                              {p.checkInCount > 1 ? `(${p.checkInCount}x)` : ''}
                            </span>
                            {p.lastCheckedInAt && (
                              <div className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 hidden sm:flex">
                                <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                {formatDateTime(p.lastCheckedInAt)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-200">
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" /> <span className="hidden sm:inline">Not Checked In</span><span className="sm:hidden">No</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        {p.attendeeName ? (
                          <div>
                            <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{p.attendeeName}</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">{p.attendeeEmail}</div>
                            {p.attendeeMobileNumber && (
                              <div className="text-[9px] sm:text-[10px] text-gray-400 hidden sm:block">{p.attendeeMobileNumber}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] sm:text-xs text-gray-400 italic">Unclaimed</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        {p.validDays && p.validDays.length > 0 ? (
                          <div className="flex flex-wrap gap-0.5 sm:gap-1 max-w-[100px] sm:max-w-xs">
                            {p.validDays.map((d) => (
                              <span
                                key={d.id}
                                className="bg-purple-50 text-purple-700 border border-purple-200 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold"
                                title={d.eventDate}
                              >
                                D{d.dayNumber}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] sm:text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-200">
                            All
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-right space-x-0.5 sm:space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenValidityForSingle(p)}
                          className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[10px] sm:text-xs font-semibold transition"
                          title="Manage Event-Day Validity"
                        >
                          <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">Validity</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActivePrintPass(p)}
                          className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1 bg-white border border-gray-300 rounded text-[10px] sm:text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
                        >
                          <Printer className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">Pass</span>
                        </button>

                        {p.status !== 'REVOKED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setPassToRevoke(p);
                              setRevokeModalOpen(true);
                            }}
                            className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs text-red-600 hover:bg-red-50 rounded transition font-medium"
                          >
                            <span className="hidden sm:inline">Revoke</span>
                            <span className="sm:hidden">×</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Footer */}
        {totalElements > 0 && (
          <div className="px-4 sm:px-5 py-3 border-t border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-[10px] sm:text-xs">
                Showing <strong className="text-gray-900">{page * pageSize + 1}</strong> to{' '}
                <strong className="text-gray-900">
                  {Math.min((page + 1) * pageSize, totalElements)}
                </strong>{' '}
                of <strong className="text-gray-900">{totalElements}</strong> passes
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-xs">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setPage(0);
                  }}
                  className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-medium focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1 self-center sm:self-auto">
              <button
                type="button"
                disabled={page === 0 || passesLoading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 sm:px-3 py-1 font-semibold text-gray-900 text-[10px] sm:text-xs">
                {page + 1} / {Math.max(1, totalPages)}
              </span>
              <button
                type="button"
                disabled={page >= totalPages - 1 || passesLoading}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="p-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* GENERATE PASSES MODAL */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Generate Unique Passes</h2>
                <p className="text-xs text-gray-500 truncate">Event: {event.name}</p>
              </div>
              <button
                onClick={() => setIsGenModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newlyGeneratedPasses.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-bold text-green-900 text-sm sm:text-base">
                    {newlyGeneratedPasses.length} Passes Generated!
                  </h3>
                  <p className="text-xs text-green-700 mt-1">
                    Raw QR tokens have been generated. Below is the batch preview.
                  </p>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y border rounded-lg text-xs">
                  {newlyGeneratedPasses.map((p) => (
                    <div key={p.id} className="p-2.5 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
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
                        className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold rounded text-xs flex items-center gap-1 shrink-0 ml-2"
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
                        const checked = selectedGenDayIds.includes(day.id);
                        return (
                          <label
                            key={day.id}
                            className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleGenDaySelection(day.id)}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span className="font-semibold">Day {day.dayNumber}:</span>
                            <span className="truncate">{day.eventDate || day.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
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
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
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
            <div id="printable-card" className="p-4 sm:p-6 text-center space-y-4 bg-white">
              <div className="border-b pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  OFFICIAL EVENT PASS
                </span>
                <h3 className="text-base sm:text-lg font-black text-gray-900 mt-2 truncate">{event.name}</h3>
                <p className="text-xs text-gray-500 truncate">{event.venue || 'Event Venue'}</p>
              </div>

              {/* QR Code Container */}
              <div className="bg-gray-50 p-3 rounded-xl border inline-block mx-auto shadow-inner">
                <img
                  src={getQrImageUrl(activePrintPass.rawToken || activePrintPass.passNumber)}
                  alt="QR Pass"
                  className="w-36 h-36 sm:w-44 sm:h-44 object-contain mx-auto"
                />
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium">Pass Identifier</p>
                <p className="font-mono font-black text-lg sm:text-xl text-purple-800 tracking-wider break-all">
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <h3 className="font-bold text-base sm:text-lg text-gray-900">Revoke Pass</h3>
            </div>
            <p className="text-xs text-gray-600">
              Are you sure you want to revoke pass{' '}
              <strong className="font-mono text-gray-900 break-all">{passToRevoke?.passNumber}</strong>? Once
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
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
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

      {/* MANAGE PASS VALIDITY MODAL */}
      <ManagePassValidityModal
        isOpen={isValidityModalOpen}
        onClose={() => {
          setIsValidityModalOpen(false);
          setSinglePassForValidity(null);
        }}
        event={event}
        eventDays={eventDays}
        selectedPasses={selectedPassesList}
        singlePass={singlePassForValidity}
        onValidityUpdated={() => {
          clearSelection();
          fetchPasses();
          fetchPassStats();
        }}
      />

      {/* GATEKEEPER MANAGEMENT MODAL */}
      <GatekeeperManagementModal
        isOpen={isGatekeeperModalOpen}
        onClose={() => setIsGatekeeperModalOpen(false)}
        event={event}
        onGatekeepersChanged={fetchGatekeepers}
      />

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
