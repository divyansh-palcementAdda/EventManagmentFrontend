import React, { useState, useEffect, useCallback } from 'react';
import { Searchbar, Table, Button, DeleteModal } from '../../Components/reusable';
import AddAndEditAttendees from '../../Components/Modals/addAttendees/addAndEditAttendees';
import { Plus, Edit, Trash2, Mail, Phone, Calendar, CheckCircle2, Ticket, Users, RefreshCw, Download, Building, Check, Eye, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import attendeeService from '../../Api-Services/attendeeService';
import eventsService from '../../Api-Services/eventsService';
import toast from 'react-hot-toast';

const Attendees = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedHasPass, setSelectedHasPass] = useState('');
  const [selectedCheckedIn, setSelectedCheckedIn] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [attendees, setAttendees] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attendeeToDelete, setAttendeeToDelete] = useState(null);

  const itemsPerPage = 10;

  // Load events for dropdown
  useEffect(() => {
    eventsService.getEvents(0, 100)
      .then((res) => {
        const data = res?.data || res;
        const list = data?.content || [];
        setEvents(list);
      })
      .catch((err) => console.error('Failed to load events for filter', err));
  }, []);

  // Load statistics for current event or global
  const fetchStats = useCallback(async () => {
    try {
      const res = await attendeeService.getStats(selectedEventId || undefined);
      setStats(res?.data || res);
    } catch (err) {
      console.error('Failed to fetch attendee stats', err);
    }
  }, [selectedEventId]);

  // Fetch attendees from backend
  const fetchAttendees = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage - 1,
        size: itemsPerPage,
        sortBy: 'registeredAt',
        sortDir: 'desc',
      };
      if (selectedEventId) params.eventId = selectedEventId;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedStatus) params.status = selectedStatus;
      if (selectedHasPass !== '') params.hasPass = selectedHasPass === 'true';
      if (selectedCheckedIn !== '') params.checkedIn = selectedCheckedIn === 'true';

      const res = await attendeeService.getAttendees(params);
      const data = res?.data || res;
      const content = data?.content || [];
      const totalPgs = data?.totalPages ?? data?.page?.totalPages ?? 1;
      const totalEls = data?.totalElements ?? data?.page?.totalElements ?? content.length;

      setAttendees(content);
      setTotalPages(totalPgs > 0 ? totalPgs : 1);
      setTotalElements(totalEls);
    } catch (err) {
      console.error('Failed to fetch attendees', err);
      toast.error(err?.message || 'Failed to load attendees');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedEventId, searchTerm, selectedStatus, selectedHasPass, selectedCheckedIn]);

  useEffect(() => {
    fetchAttendees();
    fetchStats();
  }, [fetchAttendees, fetchStats]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleEventFilterChange = (e) => {
    setSelectedEventId(e.target.value);
    setCurrentPage(1);
  };

  const handleAddAttendee = () => {
    setEditingAttendee(null);
    setIsModalOpen(true);
  };

  const handleEditAttendee = (attendee) => {
    setEditingAttendee(attendee);
    setIsModalOpen(true);
  };

  const handleDeleteAttendee = (attendee) => {
    setAttendeeToDelete(attendee);
    setDeleteModalOpen(true);
  };

  const confirmDeleteAttendee = async () => {
    if (!attendeeToDelete) return;
    try {
      setActionLoading(true);
      await attendeeService.deleteAttendee(attendeeToDelete.id);
      toast.success('Attendee deleted successfully');
      setDeleteModalOpen(false);
      setAttendeeToDelete(null);
      fetchAttendees();
      fetchStats();
    } catch (err) {
      console.error('Failed to delete attendee', err);
      toast.error(err?.message || 'Failed to delete attendee');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveAttendee = async (formData) => {
    try {
      setActionLoading(true);
      if (editingAttendee) {
        await attendeeService.updateAttendee(editingAttendee.id, formData);
        toast.success('Attendee updated successfully');
      } else {
        await attendeeService.createAttendee(formData);
        toast.success('Attendee registered successfully');
      }
      setIsModalOpen(false);
      setEditingAttendee(null);
      fetchAttendees();
      fetchStats();
    } catch (err) {
      console.error('Failed to save attendee', err);
      toast.error(err?.message || 'Failed to save attendee');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.loading('Generating export...', { id: 'export-toast' });
      const params = {};
      if (selectedEventId) params.eventId = selectedEventId;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedStatus) params.status = selectedStatus;

      const blob = await attendeeService.exportAttendees(params);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendees-export-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Attendees exported successfully', { id: 'export-toast' });
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Failed to export attendees', { id: 'export-toast' });
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'CONFIRMED').toUpperCase();
    const statusStyles = {
      CONFIRMED: 'bg-green-100 text-green-700 border border-green-200',
      PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      CANCELLED: 'bg-red-100 text-red-700 border border-red-200',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles[s] || statusStyles.PENDING}`}>
        {s}
      </span>
    );
  };

  const columns = [
    {
      header: 'Attendee',
      accessor: 'fullName',
      render: (name, row) => (
        <div>
          <div className="font-semibold text-gray-900">{name || row.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 text-gray-400" />
            {row.email}
          </div>
          {(row.organization || row.designation) && (
            <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
              <Building className="w-3 h-3 text-gray-400" />
              {[row.designation, row.organization].filter(Boolean).join(' • ')}
            </div>
          )}
          {(row.college || row.course) && (
            <div className="text-[11px] text-purple-600 flex items-center gap-1 mt-0.5 font-medium">
              <GraduationCap className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span>{[row.course, row.college].filter(Boolean).join(' • ')}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Event',
      accessor: 'eventName',
      render: (eventName) => (
        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
          {eventName || '—'}
        </span>
      ),
    },
    {
      header: 'Pass Status',
      accessor: 'hasPass',
      render: (hasPass, row) => {
        const passAssigned = hasPass || Boolean(row?.passNumber) || Boolean(row?.passId) || Boolean(row?.linkedPass);
        if (!passAssigned) {
          return <span className="text-xs text-gray-400 font-medium">No Pass</span>;
        }

        const passNum = row.passNumber || row.linkedPass?.passNumber;
        const passStatus = (row.passStatus || row.linkedPass?.status || 'ACTIVATED').toUpperCase();
        const category = row.passCategory || row.category || row.linkedPass?.category;

        const getPassBadgeColor = (status) => {
          switch (status) {
            case 'ACTIVATED':
              return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'REVOKED':
              return 'bg-red-50 text-red-800 border-red-200';
            case 'NOT_ACTIVATED':
            case 'UNACTIVATED':
              return 'bg-amber-50 text-amber-800 border-amber-200';
            default:
              return 'bg-blue-50 text-blue-800 border-blue-200';
          }
        };

        const getStatusTagColor = (status) => {
          switch (status) {
            case 'ACTIVATED':
              return 'bg-emerald-100 text-emerald-800';
            case 'REVOKED':
              return 'bg-red-100 text-red-800';
            case 'NOT_ACTIVATED':
            case 'UNACTIVATED':
              return 'bg-amber-100 text-amber-800';
            default:
              return 'bg-gray-100 text-gray-700';
          }
        };

        return (
          <div className="space-y-1">
            <div className={`inline-flex items-center gap-1.5 font-mono text-xs font-bold px-2 py-0.5 rounded border ${getPassBadgeColor(passStatus)}`}>
              <Ticket className="w-3.5 h-3.5 shrink-0" />
              <span>{passNum || 'Assigned'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${getStatusTagColor(passStatus)}`}>
                {passStatus}
              </span>
              {category && (
                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {category}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Check-In',
      accessor: 'checkedIn',
      render: (checkedIn, row) => {
        const isCheckedIn = Boolean(checkedIn) || row?.checkInStatus === 'CHECKED_IN';
        if (!isCheckedIn) {
          return (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              Not Checked In
            </span>
          );
        }
        const checkInTime = row.checkedInAt || row.lastCheckedInAt;
        return (
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              Checked In
            </span>
            {checkInTime && (
              <div className="text-[10px] text-gray-400 mt-0.5">
                {new Date(checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Registration',
      accessor: 'registrationStatus',
      render: (status) => getStatusBadge(status),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => (
        <div className="flex gap-1.5">
          <button
            onClick={() => navigate(`/admin/attendees/${id}`)}
            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditAttendee(row)}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit Attendee"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteAttendee(row)}
            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title="Delete Attendee"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Attendees</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse registered attendees, linked passes, and check-in statuses ({totalElements} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="neutral"
            onClick={() => {
              fetchAttendees();
              fetchStats();
            }}
            disabled={loading}
            className="flex items-center gap-2 border border-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="neutral"
            onClick={handleExport}
            className="flex items-center gap-2 border border-gray-300"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="primary"
            onClick={handleAddAttendee}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white"
          >
            <Plus className="w-4 h-4" />
            Add Attendee
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Registered</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalAttendees ?? totalElements ?? 0}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-green-600 uppercase tracking-wider">Confirmed</div>
          <div className="text-2xl font-bold text-green-700 mt-1">{stats?.confirmedAttendees ?? attendees.filter(a => a.registrationStatus === 'CONFIRMED').length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">Passes Assigned</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{stats?.withPass ?? attendees.filter(a => a.passNumber || a.passId || a.hasPass).length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Checked In</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats?.checkedIn ?? stats?.checkedInCount ?? attendees.filter(a => a.checkedIn).length}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="lg:col-span-2">
          <Searchbar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by name, email, or organization..."
          />
        </div>
        <div>
          <select
            value={selectedEventId}
            onChange={handleEventFilterChange}
            className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 text-sm text-gray-700"
          >
            <option value="">All Events</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 text-sm text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PENDING">PENDING</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div>
          <select
            value={selectedCheckedIn}
            onChange={(e) => {
              setSelectedCheckedIn(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 text-sm text-gray-700"
          >
            <option value="">Check-In: All</option>
            <option value="true">Checked In Only</option>
            <option value="false">Not Checked In</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-green-700" />
            <p className="text-sm">Loading attendees...</p>
          </div>
        ) : (
          <Table
            columns={columns}
            data={attendees}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            emptyMessage="No attendees found matching current criteria"
          />
        )}
      </div>

      {/* Add / Edit Attendee Modal */}
      <AddAndEditAttendees
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAttendee(null);
        }}
        attendee={editingAttendee}
        onSave={handleSaveAttendee}
        events={events}
        selectedEventId={selectedEventId}
        loading={actionLoading}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAttendeeToDelete(null);
        }}
        onConfirm={confirmDeleteAttendee}
        title="Delete Attendee"
        message={`Are you sure you want to delete "${attendeeToDelete?.fullName || attendeeToDelete?.name}"? Linked passes or check-ins may also be affected.`}
        loading={actionLoading}
      />
    </div>
  );
};

export default Attendees;
