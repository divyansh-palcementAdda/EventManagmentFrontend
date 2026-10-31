import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Searchbar, Table, Button, DeleteModal } from '../../Components/reusable';
import AddAndEditEvents from '../../Components/Modals/addEvents/addAndEditEvents';
import eventsService from '../../Api-Services/eventsService';
import { Plus, Edit, Trash2, Calendar, MapPin, Users, Eye, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePermissions } from '../../permissionContext/permissionContext.jsx';

const Events = () => {
  const navigate = useNavigate();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const pageSize = 5;

  const statusOptions = [
    { label: 'DRAFT', value: 'DRAFT' },
    { label: 'PUBLISHED', value: 'PUBLISHED' },
    { label: 'ACTIVE', value: 'ACTIVE' },
    { label: 'COMPLETED', value: 'COMPLETED' },
    { label: 'CANCELLED', value: 'CANCELLED' },
  ];

  const fetchEvents = async (search = '', page) => {
    setLoading(true);
    try {
      const response = await eventsService.getEvents(page - 1, pageSize, ['createdAt,desc'], search);
      setEvents(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(response.data.totalElements || 0);
    } catch (error) {
      toast.error('Failed to fetch events');
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(searchTerm, currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleViewEvent = (eventId) => {
    navigate(`/admin/events/${eventId}`);
  };

  const handleDeleteEvent = (id) => {
    setEventToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDeleteEvent = async () => {
    try {
      await eventsService.deleteEvent(eventToDelete);
      toast.success('Event deleted successfully');
      setCurrentPage(1);
      await fetchEvents(searchTerm, 1);
    } catch (error) {
      toast.error('Failed to delete event');
      console.error('Error deleting event:', error);
    } finally {
      setDeleteModalOpen(false);
      setEventToDelete(null);
    }
  };

  const handleSaveEvent = async (formData) => {
    try {
      let result;
      if (editingEvent) {
        result = await eventsService.updateEvent(editingEvent.id, formData);
        toast.success('Event updated successfully');
      } else {
        result = await eventsService.createEvent(formData);
        toast.success('Event created successfully');
      }
      setCurrentPage(1);
      await fetchEvents(searchTerm, 1);
      setIsModalOpen(false);
      return result;
    } catch (error) {
      console.error('Error saving event:', error);
      // Re-throw so AddAndEditEvents modal can map fieldErrors without wiping form state
      throw error;
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await eventsService.updateEventStatus(eventId, newStatus);
      toast.success('Event status updated successfully');
      await fetchEvents(searchTerm, currentPage);
    } catch (error) {
      toast.error('Failed to update event status');
      console.error('Error updating status:', error);
    }
  };

  const StatusDropdown = ({ currentStatus, eventId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (newStatus) => {
      handleStatusChange(eventId, newStatus);
      setIsOpen(false);
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {getStatusBadge(currentStatus)}
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg w-32 mt-1 left-0">
            <ul className="py-1 text-sm">
              {statusOptions.map((option) => (
                <li key={option.value}>
                  <button
                    onClick={() => handleSelect(option.value)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PUBLISHED: 'bg-blue-100 text-blue-700',
      ACTIVE: 'bg-green-100 text-green-700',
      COMPLETED: 'bg-purple-100 text-purple-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.DRAFT}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const columns = [
    {
      header: 'S.No',
      accessor: 'id',
      render: (id, row, index) => {
        return (currentPage - 1) * pageSize + index + 1;
      },
    },
    { header: 'Event Name', accessor: 'name' },
    { header: 'Event Code', accessor: 'eventCode' },
    {
      header: 'Status',
      accessor: 'status',
      render: (status, row) => (
        <StatusDropdown currentStatus={status} eventId={row.id} />
      ),
    },
    {
      header: 'Start Date',
      accessor: 'startsAt',
      render: (date) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          {formatDate(date)}
        </div>
      ),
    },
    {
      header: 'Venue',
      accessor: 'venue',
      render: (venue) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          {venue}
        </div>
      ),
    },
    {
      header: 'Max Passes',
      accessor: 'maximumPasses',
      render: (passes) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          {passes}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewEvent(id)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4 text-green-600" />
          </button>
          {canUpdate('events') && (
            <button
              onClick={() => handleEditEvent(row)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4 text-blue-600" />
            </button>
          )}
          {canDelete('events') && (
            <button
              onClick={() => handleDeleteEvent(id)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">All Events</h1>
        <p className="text-gray-600">Manage and view all events</p>
      </div>

      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <Searchbar
            placeholder="Search events..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="max-w-md"
          />
        </div>
        {canCreate('events') && (
          <Button
            variant="primary"
            onClick={handleAddEvent}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </Button>
        )}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={events}
        enablePagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={pageSize}
        useBackendPagination={true}
        className="border-0 rounded-xl"
      />

      {/* Add/Edit Modal */}
      <AddAndEditEvents
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={editingEvent}
        onSave={handleSaveEvent}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteEvent}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
      />
    </div>
  );
};

export default Events;
