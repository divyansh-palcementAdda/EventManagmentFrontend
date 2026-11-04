import React, { useState, useEffect } from 'react';
import {
  Tags,
  Plus,
  Settings2,
  FileText,
  CheckCircle,
  XCircle,
  QrCode,
  ShieldAlert,
  Loader2,
  RefreshCw,
  X,
  Smartphone,
  UserCheck,
  UserX
} from 'lucide-react';
import toast from 'react-hot-toast';
import categoryService from '../../Api-Services/categoryService';
import FormBuilderModal from '../Modals/formBuilder/FormBuilderModal';

const ACTIVATION_MODES = [
  { value: 'SELF_SERVICE', label: 'Self-Service (Attendee Scans & Registers)' },
  { value: 'SCAN_AUTO_ACTIVATE', label: 'Scan Auto-Activate (Instant Mobile Activation)' },
  { value: 'NO_QR_WALK_IN', label: 'No QR Walk-In (Staff On-Site Admission Only)' }
];

const IDENTITY_POLICIES = [
  { value: 'COLLECT_IDENTITY', label: 'Collect Identity (Registration Form Required)' },
  { value: 'NO_IDENTITY', label: 'No Identity (Anonymous / Badge Only)' }
];

const EventCategoriesCard = ({ eventId, eventCode }) => {
  const [eventCategories, setEventCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Configure New Category Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    passCategoryId: '',
    activationMode: 'SELF_SERVICE',
    identityPolicy: 'COLLECT_IDENTITY',
    qrRequired: true,
    passLimit: null
  });

  // Edit Policy Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [policyForm, setPolicyForm] = useState({
    activationMode: 'SELF_SERVICE',
    identityPolicy: 'COLLECT_IDENTITY',
    qrRequired: true,
    passLimit: null
  });

  // Form Builder Modal State
  const [formBuilderOpen, setFormBuilderOpen] = useState(false);
  const [selectedForBuilder, setSelectedForBuilder] = useState(null);

  const fetchEventCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryService.getEventCategories(eventId, false);
      const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      setEventCategories(list);
    } catch (err) {
      console.error('Failed to fetch event categories:', err);
      toast.error(err.message || 'Failed to fetch categories for this event');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCategories = async () => {
    try {
      const res = await categoryService.getAvailableForEvent(eventId);
      const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      setAvailableCategories(list);
    } catch (err) {
      console.error('Failed to fetch available categories:', err);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchEventCategories();
    }
  }, [eventId]);

  const handleOpenAdd = () => {
    fetchAvailableCategories();
    setAddForm({
      passCategoryId: '',
      activationMode: 'SELF_SERVICE',
      identityPolicy: 'COLLECT_IDENTITY',
      qrRequired: true,
      passLimit: null
    });
    setAddModalOpen(true);
  };

  const handleOpenEditPolicy = (cat) => {
    setEditingCategory(cat);
    setPolicyForm({
      activationMode: cat.activationMode || 'SELF_SERVICE',
      identityPolicy: cat.identityPolicy || 'COLLECT_IDENTITY',
      qrRequired: cat.qrRequired ?? true,
      passLimit: cat.passLimit ?? null
    });
    setEditModalOpen(true);
  };

  const handleOpenFormBuilder = (cat) => {
    setSelectedForBuilder(cat);
    setFormBuilderOpen(true);
  };

  const handleToggleActive = async (cat) => {
    try {
      await categoryService.toggleEventCategoryActive(eventId, cat.id);
      toast.success(`Category "${cat.passCategoryName}" status updated`);
      fetchEventCategories();
    } catch (err) {
      console.error('Failed to toggle category active status:', err);
      toast.error(err.message || 'Failed to update category status');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.passCategoryId) {
      toast.error('Please select a category');
      return;
    }

    try {
      await categoryService.configureEventCategory(eventId, {
        passCategoryId: addForm.passCategoryId,
        activationMode: addForm.activationMode,
        identityPolicy: addForm.identityPolicy,
        qrRequired: addForm.activationMode === 'NO_QR_WALK_IN' ? false : addForm.qrRequired,
        passLimit: addForm.passLimit ? parseInt(addForm.passLimit, 10) : null
      });
      toast.success('Category enabled for event');
      setAddModalOpen(false);
      fetchEventCategories();
    } catch (err) {
      console.error('Failed to enable category:', err);
      toast.error(err.message || 'Failed to enable category');
    }
  };

  const handlePolicySubmit = async (e) => {
    e.preventDefault();
    try {
      await categoryService.updateEventCategoryPolicy(eventId, editingCategory.id, {
        activationMode: policyForm.activationMode,
        identityPolicy: policyForm.identityPolicy,
        qrRequired: policyForm.activationMode === 'NO_QR_WALK_IN' ? false : policyForm.qrRequired,
        passLimit: policyForm.passLimit ? parseInt(policyForm.passLimit, 10) : null
      });
      toast.success('Category policy updated');
      setEditModalOpen(false);
      fetchEventCategories();
    } catch (err) {
      console.error('Failed to update policy:', err);
      toast.error(err.message || 'Failed to update policy');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50/70 to-indigo-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Pass Categories & Activation Policies</h2>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
              {eventCategories.length} Configured
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure admission policies, QR issuance, and customize dynamic registration forms per category.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchEventCategories}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            title="Refresh Categories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Enable Category
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Activation Mode</th>
              <th className="px-5 py-3">Identity Policy</th>
              <th className="px-5 py-3 text-center">QR Required</th>
              <th className="px-5 py-3 text-center">Registration Form</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && eventCategories.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-500 mb-1" />
                  Loading categories...
                </td>
              </tr>
            ) : eventCategories.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-8 text-center text-gray-500">
                  No pass categories configured for this event yet. Click "Enable Category" to get started.
                </td>
              </tr>
            ) : (
              eventCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{cat.passCategoryName}</span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {cat.passCategoryCode}
                      </span>
                    </div>
                    {cat.passLimit && (
                      <span className="text-[11px] text-gray-400 mt-0.5 block">
                        Limit: {cat.passLimit} passes
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    {cat.activationMode === 'SELF_SERVICE' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Smartphone className="w-3 h-3" /> Self-Service
                      </span>
                    )}
                    {cat.activationMode === 'SCAN_AUTO_ACTIVATE' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        <CheckCircle className="w-3 h-3" /> Auto-Activate
                      </span>
                    )}
                    {cat.activationMode === 'NO_QR_WALK_IN' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <ShieldAlert className="w-3 h-3" /> Walk-In Only
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    {cat.identityPolicy === 'COLLECT_IDENTITY' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-700 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Collect Identity
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-purple-700 font-medium">
                        <UserX className="w-3.5 h-3.5 text-purple-600" /> No Identity (Anonymous)
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    {cat.qrRequired ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700">
                        <QrCode className="w-3 h-3 text-gray-600" /> QR Issued
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        No QR
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    {cat.currentFormVersionNumber ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                        v{cat.currentFormVersionNumber} Published
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">Default</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => handleToggleActive(cat)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        cat.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {cat.active ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> Disabled
                        </>
                      )}
                    </button>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenFormBuilder(cat)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                        title="Customize Dynamic Form"
                      >
                        <FileText className="w-3.5 h-3.5" /> Form Builder
                      </button>

                      <button
                        onClick={() => handleOpenEditPolicy(cat)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Configure Category Policy"
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Enable Category Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-md font-bold text-gray-900">Enable Category for Event</h3>
              <button onClick={() => setAddModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Category *
                </label>
                <select
                  required
                  value={addForm.passCategoryId}
                  onChange={(e) => setAddForm({ ...addForm, passCategoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Category --</option>
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) - {c.scope}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Activation Mode *
                </label>
                <select
                  value={addForm.activationMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    setAddForm({
                      ...addForm,
                      activationMode: mode,
                      qrRequired: mode === 'NO_QR_WALK_IN' ? false : addForm.qrRequired,
                      identityPolicy: mode === 'NO_QR_WALK_IN' ? 'COLLECT_IDENTITY' : addForm.identityPolicy
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ACTIVATION_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Identity Policy *
                </label>
                <select
                  disabled={addForm.activationMode === 'NO_QR_WALK_IN'}
                  value={addForm.identityPolicy}
                  onChange={(e) => setAddForm({ ...addForm, identityPolicy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  {IDENTITY_POLICIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addQrRequired"
                  disabled={addForm.activationMode === 'NO_QR_WALK_IN'}
                  checked={addForm.activationMode === 'NO_QR_WALK_IN' ? false : addForm.qrRequired}
                  onChange={(e) => setAddForm({ ...addForm, qrRequired: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="addQrRequired" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Generate Physical / Digital QR Codes for passes
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pass Limit (Optional)
                </label>
                <input
                  type="number"
                  placeholder="Unlimited"
                  value={addForm.passLimit || ''}
                  onChange={(e) => setAddForm({ ...addForm, passLimit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Enable Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Policy Modal */}
      {editModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-md font-bold text-gray-900">
                Configure Policy — {editingCategory.passCategoryName}
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePolicySubmit} className="mt-4 space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Activation Mode *
                </label>
                <select
                  value={policyForm.activationMode}
                  onChange={(e) => {
                    const mode = e.target.value;
                    setPolicyForm({
                      ...policyForm,
                      activationMode: mode,
                      qrRequired: mode === 'NO_QR_WALK_IN' ? false : policyForm.qrRequired,
                      identityPolicy: mode === 'NO_QR_WALK_IN' ? 'COLLECT_IDENTITY' : policyForm.identityPolicy
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {ACTIVATION_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Identity Policy *
                </label>
                <select
                  disabled={policyForm.activationMode === 'NO_QR_WALK_IN'}
                  value={policyForm.identityPolicy}
                  onChange={(e) => setPolicyForm({ ...policyForm, identityPolicy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  {IDENTITY_POLICIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editQrRequired"
                  disabled={policyForm.activationMode === 'NO_QR_WALK_IN'}
                  checked={policyForm.activationMode === 'NO_QR_WALK_IN' ? false : policyForm.qrRequired}
                  onChange={(e) => setPolicyForm({ ...policyForm, qrRequired: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="editQrRequired" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Generate Physical / Digital QR Codes for passes
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pass Limit (Optional)
                </label>
                <input
                  type="number"
                  placeholder="Unlimited"
                  value={policyForm.passLimit || ''}
                  onChange={(e) => setPolicyForm({ ...policyForm, passLimit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Builder Modal */}
      {selectedForBuilder && (
        <FormBuilderModal
          isOpen={formBuilderOpen}
          onClose={() => {
            setFormBuilderOpen(false);
            setSelectedForBuilder(null);
          }}
          eventCategoryId={selectedForBuilder.id}
          categoryName={selectedForBuilder.passCategoryName}
          onPublished={() => {
            fetchEventCategories();
          }}
        />
      )}
    </div>
  );
};

export default EventCategoriesCard;

