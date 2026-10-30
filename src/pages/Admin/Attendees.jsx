import React, { useState } from 'react';
import { Searchbar, Table, Button, Pagination, DeleteModal } from '../../Components/reusable';
import AddAndEditAttendees from '../../Components/Modals/addAttendees/addAndEditAttendees';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Attendees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttendee, setEditingAttendee] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attendeeToDelete, setAttendeeToDelete] = useState(null);
  const [attendees, setAttendees] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1234567890', event: 'Tech Conference 2024', status: 'confirmed' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', event: 'Workshop Series', status: 'pending' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '+1234567892', event: 'Networking Event', status: 'confirmed' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', phone: '+1234567893', event: 'Tech Conference 2024', status: 'cancelled' },
    { id: 5, name: 'David Brown', email: 'david@example.com', phone: '+1234567894', event: 'Workshop Series', status: 'confirmed' },
    { id: 6, name: 'Emily Davis', email: 'emily@example.com', phone: '+1234567895', event: 'Networking Event', status: 'pending' },
    { id: 7, name: 'Robert Wilson', email: 'robert@example.com', phone: '+1234567896', event: 'Tech Conference 2024', status: 'confirmed' },
    { id: 8, name: 'Lisa Anderson', email: 'lisa@example.com', phone: '+1234567897', event: 'Workshop Series', status: 'confirmed' },
    { id: 9, name: 'James Taylor', email: 'james@example.com', phone: '+1234567898', event: 'Networking Event', status: 'pending' },
    { id: 10, name: 'Amanda Martinez', email: 'amanda@example.com', phone: '+1234567899', event: 'Tech Conference 2024', status: 'confirmed' },
    { id: 11, name: 'Christopher Lee', email: 'chris@example.com', phone: '+1234567800', event: 'Workshop Series', status: 'cancelled' },
    { id: 12, name: 'Jessica Garcia', email: 'jessica@example.com', phone: '+1234567801', event: 'Networking Event', status: 'confirmed' },
  ]);

  const itemsPerPage = 5;

  const filteredAttendees = attendees.filter(attendee =>
    attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendee.event.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAttendees.length / itemsPerPage);
  const paginatedAttendees = filteredAttendees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const handleDeleteAttendee = (id) => {
    setAttendeeToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDeleteAttendee = () => {
    setAttendees(prev => prev.filter(a => a.id !== attendeeToDelete));
    setDeleteModalOpen(false);
    setAttendeeToDelete(null);
  };

  const handleSaveAttendee = (formData) => {
    if (editingAttendee) {
      setAttendees(prev =>
        prev.map(a => (a.id === editingAttendee.id ? { ...formData, id: editingAttendee.id } : a))
      );
    } else {
      setAttendees(prev => [...prev, { ...formData, id: prev.length + 1 }]);
    }
    setIsModalOpen(false);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      confirmed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Event', accessor: 'event' },
    { header: 'Status', accessor: 'status', render: getStatusBadge },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditAttendee(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => handleDeleteAttendee(id)}
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <Table
          columns={columns}
          data={paginatedAttendees}
          className="border-0 rounded-xl"
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddAndEditAttendees
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        attendee={editingAttendee}
        onSave={handleSaveAttendee}
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
