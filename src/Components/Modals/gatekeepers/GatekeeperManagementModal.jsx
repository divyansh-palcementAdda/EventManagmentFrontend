import React, { useState, useEffect, useCallback } from 'react';
import eventsService from '../../../Api-Services/eventsService';
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Search,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  Mail,
  Phone,
  Calendar,
  User,
  Key,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const GatekeeperManagementModal = ({ isOpen, onClose, event, onGatekeepersChanged }) => {
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned', 'search_assign', 'create'

  // Assigned Gatekeepers State
  const [assignedList, setAssignedList] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  // Search Eligible State
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibleList, setEligibleList] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [eligiblePage, setEligiblePage] = useState(0);
  const [eligibleTotalPages, setEligibleTotalPages] = useState(0);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
  });
  const [creating, setCreating] = useState(false);

  // Removing State
  const [gatekeeperToRemove, setGatekeeperToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  // Action busy states for individual assignment buttons
  const [assigningUserId, setAssigningUserId] = useState(null);

  const fetchAssigned = useCallback(async () => {
    if (!event?.id) return;
    setLoadingAssigned(true);
    try {
      const res = await eventsService.getGatekeepers(event.id);
      setAssignedList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch assigned gatekeepers:', err);
      toast.error('Failed to load assigned gatekeepers');
    } finally {
      setLoadingAssigned(false);
    }
  }, [event?.id]);

  const fetchEligible = useCallback(
    async (query = searchQuery, page = 0) => {
      if (!event?.id) return;
      setLoadingEligible(true);
      try {
        const res = await eventsService.searchEligibleGatekeepers(event.id, query, page, 8);
        const data = res.data;
        setEligibleList(data?.content || []);
        setEligiblePage(data?.number || 0);
        setEligibleTotalPages(data?.totalPages || 0);
      } catch (err) {
        console.error('Failed to search eligible gatekeepers:', err);
        toast.error('Failed to search staff members');
      } finally {
        setLoadingEligible(false);
      }
    },
    [event?.id, searchQuery]
  );

  useEffect(() => {
    if (isOpen && event?.id) {
      fetchAssigned();
    }
  }, [isOpen, event?.id, fetchAssigned]);

  useEffect(() => {
    if (isOpen && activeTab === 'search_assign' && event?.id) {
      const timer = setTimeout(() => {
        fetchEligible(searchQuery, 0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, activeTab, isOpen, event?.id, fetchEligible]);

  if (!isOpen || !event) return null;

  const handleAssignExisting = async (user) => {
    setAssigningUserId(user.userId);
    try {
      await eventsService.assignGatekeeper(event.id, user.userId);
      toast.success(`${user.fullName || 'User'} assigned as Gatekeeper!`);
      fetchAssigned();
      fetchEligible(searchQuery, eligiblePage);
      if (onGatekeepersChanged) onGatekeepersChanged();
    } catch (err) {
      const msg = err.message || err.error || 'Failed to assign gatekeeper';
      toast.error(msg);
    } finally {
      setAssigningUserId(null);
    }
  };

  const handleCreateAndAssign = async (e) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    setCreating(true);
    try {
      const res = await eventsService.createAndAssignGatekeeper(event.id, createForm);
      toast.success(`Gatekeeper account created and assigned!`);
      setCreateForm({ fullName: '', email: '', mobileNumber: '', password: '' });
      setActiveTab('assigned');
      fetchAssigned();
      if (onGatekeepersChanged) onGatekeepersChanged();
    } catch (err) {
      const msg = err.message || err.error || 'Failed to create gatekeeper';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!gatekeeperToRemove) return;
    setRemoving(true);
    try {
      await eventsService.removeGatekeeper(event.id, gatekeeperToRemove.userId);
      toast.success(`Gatekeeper access revoked for ${gatekeeperToRemove.fullName}`);
      setGatekeeperToRemove(null);
      fetchAssigned();
      if (activeTab === 'search_assign') {
        fetchEligible(searchQuery, eligiblePage);
      }
      if (onGatekeepersChanged) onGatekeepersChanged();
    } catch (err) {
      const msg = err.message || err.error || 'Failed to remove gatekeeper';
      toast.error(msg);
    } finally {
      setRemoving(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm((prev) => ({ ...prev, password: pwd }));
  };

  const formatAssignedDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Event Gatekeeper Management</h2>
                <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                  {event.eventCode}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Authorized staff permitted to validate passes and record check-ins for {event.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50/70 px-6 pt-2 text-xs font-bold gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('assigned')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'assigned'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Assigned Gatekeepers
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'assigned'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {assignedList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('search_assign');
              fetchEligible('', 0);
            }}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'search_assign'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Assign Existing Staff
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'create'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Create New Gatekeeper
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* TAB 1: ASSIGNED GATEKEEPERS */}
          {activeTab === 'assigned' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Active Gate Staff ({assignedList.length})
                  </h3>
                  <p className="text-xs text-gray-500">
                    These accounts are authorized to use the QR scanner app for this event.
                  </p>
                </div>
                <button
                  onClick={fetchAssigned}
                  className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  title="Refresh list"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {loadingAssigned ? (
                <div className="p-10 text-center text-gray-400">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto text-indigo-600" />
                  <p className="text-xs mt-2">Loading authorized gatekeepers...</p>
                </div>
              ) : assignedList.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 space-y-3">
                  <Shield className="w-10 h-10 text-gray-300 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-700">No Gatekeepers Assigned</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                      No staff members are currently assigned to scan passes for this event. Gate check-in will be restricted.
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('search_assign')}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
                    >
                      Assign Existing Staff
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('create')}
                      className="px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition"
                    >
                      Create New Account
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider font-semibold border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3">Gatekeeper</th>
                          <th className="px-4 py-3">Contact</th>
                          <th className="px-4 py-3">Assigned Info</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {assignedList.map((g) => (
                          <tr key={g.id || g.userId} className="hover:bg-gray-50/70 transition">
                            <td className="px-4 py-3 font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                                  {g.fullName ? g.fullName.charAt(0) : 'U'}
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900">{g.fullName}</div>
                                  <div className="text-[10px] text-gray-400">ID: {g.userId?.slice(0, 8)}...</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span>{g.email}</span>
                              </div>
                              {g.mobileNumber && (
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  <span>{g.mobileNumber}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              <div className="flex items-center gap-1 text-[11px]">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span>{formatAssignedDate(g.assignedAt)}</span>
                              </div>
                              {g.assignedBy && (
                                <div className="text-[10px] text-gray-400">By: {g.assignedBy}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setGatekeeperToRemove(g)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SEARCH & ASSIGN EXISTING STAFF */}
          {activeTab === 'search_assign' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Search System Gatekeepers</h3>
                <p className="text-xs text-gray-500">
                  Find registered staff members with the GATEKEEPER role to authorize them for this event.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff by full name or email address..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Search Results */}
              {loadingEligible ? (
                <div className="p-8 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  <p className="text-xs mt-2">Searching gatekeepers...</p>
                </div>
              ) : eligibleList.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border">
                  <User className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold">No gatekeeper users found</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Try another search term, or click "Create New Gatekeeper" to register one.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                    {eligibleList.map((user) => (
                      <div
                        key={user.userId}
                        className="p-3 flex items-center justify-between hover:bg-gray-50 transition text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                            {user.fullName ? user.fullName.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{user.fullName}</div>
                            <div className="text-gray-500 text-[11px] flex items-center gap-2">
                              <span>{user.email}</span>
                              {user.mobileNumber && <span>• {user.mobileNumber}</span>}
                            </div>
                          </div>
                        </div>

                        <div>
                          {user.alreadyAssigned ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Already Assigned
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAssignExisting(user)}
                              disabled={assigningUserId === user.userId}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                            >
                              {assigningUserId === user.userId ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Assigning...
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3.5 h-3.5" /> Assign to Event
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination if multiple pages */}
                  {eligibleTotalPages > 1 && (
                    <div className="flex justify-between items-center text-xs text-gray-500 pt-2">
                      <span>
                        Page {eligiblePage + 1} of {eligibleTotalPages}
                      </span>
                      <div className="space-x-1">
                        <button
                          type="button"
                          disabled={eligiblePage === 0}
                          onClick={() => fetchEligible(searchQuery, eligiblePage - 1)}
                          className="px-2.5 py-1 border rounded disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          disabled={eligiblePage >= eligibleTotalPages - 1}
                          onClick={() => fetchEligible(searchQuery, eligiblePage + 1)}
                          className="px-2.5 py-1 border rounded disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CREATE NEW GATEKEEPER */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateAndAssign} className="space-y-4 max-w-lg mx-auto">
              <div className="text-center pb-2">
                <h3 className="text-sm font-bold text-gray-900">Create & Assign New Gatekeeper</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Registers a new user with the GATEKEEPER role and immediately grants check-in permission for this event.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={createForm.fullName}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, fullName: e.target.value }))
                    }
                    placeholder="e.g. John Gatekeeper"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="e.g. gatekeeper@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={createForm.mobileNumber}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, mobileNumber: e.target.value }))
                    }
                    placeholder="e.g. +1 555-0199"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700">
                    Password (Optional — Leave blank to auto-generate)
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    Generate Random
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={createForm.password}
                    onChange={(e) =>
                      setCreateForm((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder="Auto-generated if empty"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>
                {createForm.password && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    Please copy and share this password with the staff member.
                  </p>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('assigned')}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating & Assigning...
                    </>
                  ) : (
                    'Create & Assign Gatekeeper'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>

      {/* CONFIRM REVOCATION SUB-MODAL */}
      {gatekeeperToRemove && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-gray-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">Revoke Gatekeeper Assignment</h4>
                <p className="text-xs text-gray-500">Immediate access termination</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to revoke check-in authorization for{' '}
              <strong className="text-gray-900">{gatekeeperToRemove.fullName}</strong> (
              <span className="font-mono text-gray-700">{gatekeeperToRemove.email}</span>)?
              They will immediately lose access to scan and check in attendees for this event.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGatekeeperToRemove(null)}
                disabled={removing}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={removing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {removing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Revoking...
                  </>
                ) : (
                  'Confirm Revocation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GatekeeperManagementModal;

