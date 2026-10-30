import React, { useState } from 'react';
import { Searchbar, Table, Button, Pagination, DeleteModal } from '../../Components/reusable';
import AddAndEditUsers from '../../Components/Modals/addUsers/addAndEditUsers';
import { Plus, Edit, Trash2, Mail, Phone, Shield } from 'lucide-react';

const AllUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1234567890', role: 'admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', role: 'user', status: 'active' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '+1234567892', role: 'moderator', status: 'active' },
    { id: 4, name: 'Sarah Williams', email: 'sarah@example.com', phone: '+1234567893', role: 'user', status: 'inactive' },
    { id: 5, name: 'David Brown', email: 'david@example.com', phone: '+1234567894', role: 'user', status: 'active' },
    { id: 6, name: 'Emily Davis', email: 'emily@example.com', phone: '+1234567895', role: 'user', status: 'suspended' },
    { id: 7, name: 'Robert Wilson', email: 'robert@example.com', phone: '+1234567896', role: 'admin', status: 'active' },
    { id: 8, name: 'Lisa Anderson', email: 'lisa@example.com', phone: '+1234567897', role: 'moderator', status: 'active' },
    { id: 9, name: 'James Taylor', email: 'james@example.com', phone: '+1234567898', role: 'user', status: 'active' },
    { id: 10, name: 'Amanda Martinez', email: 'amanda@example.com', phone: '+1234567899', role: 'user', status: 'inactive' },
    { id: 11, name: 'Christopher Lee', email: 'chris@example.com', phone: '+1234567800', role: 'user', status: 'active' },
    { id: 12, name: 'Jessica Garcia', email: 'jessica@example.com', phone: '+1234567801', role: 'moderator', status: 'active' },
  ]);

  const itemsPerPage = 5;

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
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

  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (id) => {
    setUserToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = () => {
    setUsers(prev => prev.filter(u => u.id !== userToDelete));
    setDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleSaveUser = (formData) => {
    if (editingUser) {
      setUsers(prev =>
        prev.map(u => (u.id === editingUser.id ? { ...formData, id: editingUser.id } : u))
      );
    } else {
      setUsers(prev => [...prev, { ...formData, id: prev.length + 1 }]);
    }
    setIsModalOpen(false);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      suspended: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleStyles = {
      admin: 'bg-purple-100 text-purple-700',
      moderator: 'bg-blue-100 text-blue-700',
      user: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleStyles[role] || roleStyles.user}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    {
      header: 'Email',
      accessor: 'email',
      render: (email) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          {email}
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (phone) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          {phone}
        </div>
      ),
    },
    { header: 'Role', accessor: 'role', render: getRoleBadge },
    { header: 'Status', accessor: 'status', render: getStatusBadge },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditUser(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => handleDeleteUser(id)}
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">All Users</h1>
        <p className="text-gray-600">Manage and view all users</p>
      </div>

      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <Searchbar
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="max-w-md"
          />
        </div>
        <Button
          variant="primary"
          onClick={handleAddUser}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <Table
          columns={columns}
          data={paginatedUsers}
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
      <AddAndEditUsers
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
        onSave={handleSaveUser}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />
    </div>
  );
};

export default AllUsers;
