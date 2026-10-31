import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Searchbar, Table, Button, DeleteModal } from '../../../Components/reusable';
import AttendeeModal from '../../../Components/Modals/Attendees/AttendeeModal';
import attendeesService from '../../../Api-Services/attendeesService';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';

const Attendees = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attendeeToDelete, setAttendeeToDelete] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchAttendees();
  }, [currentPage, searchTerm]);

  const fetchAttendees = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage - 1, // Convert to 0-based for API
        size: itemsPerPage,
      };
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await attendeesService.getAttendees(params);
      console.log('API Response:', response);
      setAttendees(response.content || []);
      setTotalPages(response.page?.totalPages || 0);
      setTotalElements(response.page?.totalElements || 0);
    } catch (error) {
      toast.error('Failed to fetch attendees');
      console.error('Error fetching attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleAddAttendee = () => {
    setEditingAttendee(null);
    setIsModalOpen(true);
  };

  const handleEditAttendee = (attendee) => {
    setEditingAttendee(attendee);
    setIsModalOpen(true);
  };

  const handleViewAttendee = (id) => {
    navigate(`/admin/attendees/${id}`);
  };

  const handleDeleteAttendee = (attendee) => {
    setAttendeeToDelete(attendee);
    setDeleteModalOpen(true);
  };

  const confirmDeleteAttendee = async () => {
    if (!attendeeToDelete) return;
    try {
      await attendeesService.deleteAttendee(attendeeToDelete.id);
      toast.success('Attendee deleted successfully');
      setDeleteModalOpen(false);
      setAttendeeToDelete(null);
      fetchAttendees();
    } catch (error) {
      toast.error('Failed to delete attendee');
      console.error('Error deleting attendee:', error);
    }
  };

  const handleSaveAttendee = async (formData) => {
    setModalLoading(true);
    try {
      if (editingAttendee) {
        await attendeesService.updateAttendee(editingAttendee.id, formData);
        toast.success('Attendee updated successfully');
      } else {
        await attendeesService.createAttendee(formData);
        toast.success('Attendee created successfully');
      }
      setIsModalOpen(false);
      setEditingAttendee(null);
      fetchAttendees();
    } catch (error) {
      toast.error(`Failed to ${editingAttendee ? 'update' : 'create'} attendee`);
      console.error('Error saving attendee:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      CONFIRMED: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.PENDING}`}>
        {status}
      </span>
    );
  };

  const getCheckInBadge = (checkedIn) => {
    return checkedIn ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Checked In
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Not Checked In
      </span>
    );
  };

  const columns = [
    { header: 'Full Name', accessor: 'fullName' },
    { header: 'Email', accessor: 'email' },
    { header: 'Mobile', accessor: 'mobileNumber' },
    { header: 'Organization', accessor: 'organization' },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Status', accessor: 'registrationStatus', render: getStatusBadge },
    { header: 'Check-in', accessor: 'checkedIn', render: getCheckInBadge },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewAttendee(id)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => handleEditAttendee(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-green-600" />
          </button>
          <button
            onClick={() => handleDeleteAttendee(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">All Attendees</h1>
        <p className="text-gray-600">Manage and view all event attendees</p>
      </div>

      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <Searchbar
            placeholder="Search attendees..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="max-w-md"
          />
        </div>
        <Button
          variant="primary"
          onClick={handleAddAttendee}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Attendee
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
        </div>
      ) : (
        <Table
          columns={columns}
          data={attendees}
          enablePagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalElements={totalElements}
          className="border-0 rounded-xl"
        />
      )}

      {/* Add/Edit Modal */}
      <AttendeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        attendee={editingAttendee}
        onSave={handleSaveAttendee}
        loading={modalLoading}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteAttendee}
        title="Delete Attendee"
        message="Are you sure you want to delete this attendee? This action cannot be undone."
      />
    </div>
  );
};

export default Attendees;
