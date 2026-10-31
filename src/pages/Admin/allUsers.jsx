import React, { useState, useEffect, useCallback } from 'react';
import { Searchbar, Table, Button, DeleteModal } from '../../Components/reusable';
import AddAndEditUsers from '../../Components/Modals/addUsers/addAndEditUsers';
import { Plus, Edit, Trash2, Mail, Phone, Shield, RefreshCw, KeyRound } from 'lucide-react';
import userService from '../../Api-Services/userService';
import roleService from '../../Api-Services/roleService';
import toast from 'react-hot-toast';

const AllUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [users, setUsers] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const itemsPerPage = 10;

  // Fetch available roles for filter dropdown
  useEffect(() => {
    roleService.getAllRoles()
      .then((res) => {
        setRolesList(res?.data || res || []);
      })
      .catch((err) => console.error('Failed to load roles list', err));
  }, []);

  // Fetch users from backend with pagination and filters
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage - 1, // backend is 0-indexed
        size: itemsPerPage,
        sortBy: 'createdAt',
        sortDir: 'desc',
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedStatus) params.status = selectedStatus;
      if (selectedRole) params.roleId = selectedRole;

      const res = await userService.getUsers(params);
      const data = res?.data || res;
      const content = data?.content || [];
      const totalPgs = data?.totalPages ?? data?.page?.totalPages ?? 1;
      const totalEls = data?.totalElements ?? data?.page?.totalElements ?? content.length;

      setUsers(content);
      setTotalPages(totalPgs > 0 ? totalPgs : 1);
      setTotalElements(totalEls);
    } catch (err) {
      console.error('Failed to fetch users', err);
      toast.error(err?.message || 'Failed to load system users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedStatus, selectedRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setSelectedStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (e) => {
    setSelectedRole(e.target.value);
    setCurrentPage(1);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setActionLoading(true);
      await userService.deleteUser(userToDelete.id);
      toast.success('User deleted successfully');
      setDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user', err);
      toast.error(err?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveUser = async (formData) => {
    try {
      setActionLoading(true);
      if (editingUser) {
        await userService.updateUser(editingUser.id, {
          fullName: formData.fullName,
          mobileNumber: formData.mobileNumber,
          accountStatus: formData.accountStatus,
          roleIds: formData.roleIds,
        });
        toast.success('User updated successfully');
      } else {
        await userService.createUser(formData);
        toast.success('User created successfully');
      }
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Failed to save user', err);
      toast.error(err?.message || 'Failed to save user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    try {
      setActionLoading(true);
      await userService.resetPassword(resetPasswordUser.id, newPassword);
      toast.success(`Password reset for ${resetPasswordUser.fullName}`);
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (err) {
      console.error('Failed to reset password', err);
      toast.error(err?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      ACTIVE: 'bg-green-100 text-green-700 border border-green-200',
      INACTIVE: 'bg-gray-100 text-gray-700 border border-gray-200',
      SUSPENDED: 'bg-red-100 text-red-700 border border-red-200',
      DEACTIVATED: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    };
    const s = (status || 'ACTIVE').toUpperCase();
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles[s] || statusStyles.INACTIVE}`}>
        {s}
      </span>
    );
  };

  const columns = [
    {
      header: 'Full Name',
      accessor: 'fullName',
      render: (val, row) => (
        <div>
          <div className="font-semibold text-gray-900">{val || row.name || 'Unnamed'}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Mobile',
      accessor: 'mobileNumber',
      render: (phone) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Phone className="w-3.5 h-3.5 text-gray-400" />
          {phone || '—'}
        </div>
      ),
    },
    {
      header: 'Roles',
      accessor: 'roles',
      render: (roles) => {
        if (!roles || roles.length === 0) {
          return <span className="text-xs text-gray-400">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((r) => (
              <span
                key={r.id || r.name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <Shield className="w-3 h-3" />
                {r.name}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'accountStatus',
      render: (status) => getStatusBadge(status),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditUser(row)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit User"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setResetPasswordUser(row);
              setNewPassword('');
            }}
            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Reset Password"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteUser(row)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete User"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">System Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage system operators, event administrators, and gatekeeper accounts ({totalElements} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="neutral"
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 border border-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={handleAddUser}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white"
          >
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="md:col-span-2">
          <Searchbar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by full name or email..."
          />
        </div>
        <div>
          <select
            value={selectedStatus}
            onChange={handleStatusFilterChange}
            className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 text-sm text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DEACTIVATED">DEACTIVATED</option>
          </select>
        </div>
        <div>
          <select
            value={selectedRole}
            onChange={handleRoleFilterChange}
            className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 text-sm text-gray-700"
          >
            <option value="">All Roles</option>
            {rolesList.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-green-700" />
            <p className="text-sm">Loading users from backend...</p>
          </div>
        ) : (
          <Table
            columns={columns}
            data={users}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            emptyMessage="No system users found matching current criteria"
          />
        )}
      </div>

      {/* Add / Edit Modal */}
      <AddAndEditUsers
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSave={handleSaveUser}
        loading={actionLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to permanently delete user "${userToDelete?.fullName || userToDelete?.email}"? This action cannot be undone.`}
        loading={actionLoading}
      />

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-600" />
              Reset Password
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Set a new password for <span className="font-semibold text-gray-800">{resetPasswordUser.fullName}</span> ({resetPasswordUser.email}).
            </p>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="neutral"
                  onClick={() => setResetPasswordUser(null)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={actionLoading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {actionLoading ? 'Resetting...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;
