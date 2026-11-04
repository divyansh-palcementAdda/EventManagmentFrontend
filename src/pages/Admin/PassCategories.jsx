import React, { useState, useEffect } from 'react';
import {
  Tags,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  CheckCircle,
  XCircle,
  Globe,
  Calendar,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import categoryService from '../../Api-Services/categoryService';
import eventsService from '../../Api-Services/eventsService';
import Pagination from '../../Components/reusable/pagination';

const ITEMS_PER_PAGE = 10;

const PassCategories = () => {
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    scope: 'GLOBAL',
    eventId: '',
    description: '',
    displayOrder: 0,
    active: true
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = {};
      if (scopeFilter) params.scope = scopeFilter;
      if (activeFilter !== '') params.active = activeFilter === 'true';
      const res = await categoryService.getCategories(params);
      const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      setCategories(list);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      toast.error(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await eventsService.getEvents(0, 100);
      setEvents(res.data?.content || []);
    } catch (err) {
      console.error('Failed to fetch events for selector:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [scopeFilter, activeFilter]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      code: '',
      scope: 'GLOBAL',
      eventId: '',
      description: '',
      displayOrder: 0,
      active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      code: cat.code || '',
      scope: cat.scope || 'GLOBAL',
      eventId: cat.eventId || '',
      description: cat.description || '',
      displayOrder: cat.displayOrder ?? 0,
      active: cat.active ?? true
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleToggleActive = async (cat) => {
    try {
      await categoryService.toggleCategoryActive(cat.id);
      toast.success(`Category "${cat.name}" status updated`);
      fetchCategories();
    } catch (err) {
      console.error('Failed to toggle category status:', err);
      toast.error(err.message || 'Failed to toggle category status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Category Name is required');
      return;
    }
    if (!editingCategory && !formData.code.trim()) {
      toast.error('Category Code is required');
      return;
    }
    if (formData.scope === 'EVENT_SPECIFIC' && !formData.eventId) {
      toast.error('Event selection is required for event-specific categories');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description?.trim(),
          displayOrder: parseInt(formData.displayOrder, 10) || 0,
          active: formData.active
        });
        toast.success('Category updated successfully');
      } else {
        await categoryService.createCategory({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          scope: formData.scope,
          eventId: formData.scope === 'EVENT_SPECIFIC' ? formData.eventId : null,
          description: formData.description?.trim(),
          displayOrder: parseInt(formData.displayOrder, 10) || 0
        });
        toast.success('Category created successfully');
      }
      handleCloseModal();
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category:', err);
      toast.error(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoriesList = Array.isArray(categories) ? categories : [];
  const filteredCategories = categoriesList.filter((cat) => {
    const q = search.toLowerCase();
    const matchesName = cat.name?.toLowerCase().includes(q);
    const matchesCode = cat.code?.toLowerCase().includes(q);
    const matchesDesc = cat.description?.toLowerCase().includes(q);
    const matchesEvent = cat.eventName?.toLowerCase().includes(q);
    return matchesName || matchesCode || matchesDesc || matchesEvent;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / ITEMS_PER_PAGE));
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleScopeFilterChange = (e) => {
    setScopeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleActiveFilterChange = (e) => {
    setActiveFilter(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Tags className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pass Categories</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Manage global reusable categories and event-scoped pass types
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, code, event..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={scopeFilter}
            onChange={handleScopeFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
          >
            <option value="">All Scopes</option>
            <option value="GLOBAL">Global Only</option>
            <option value="EVENT_SPECIFIC">Event-Specific Only</option>
          </select>

          <select
            value={activeFilter}
            onChange={handleActiveFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="px-6 py-3.5">S.No</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Scope</th>
                <th className="px-6 py-3.5">Associated Event</th>
                <th className="px-6 py-3.5 text-center">Passes Created</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading && categories.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading pass categories...
                  </td>
                </tr>
              ) : paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No pass categories found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat, index) => (
                  <tr key={cat.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-500">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{cat.name}</div>
                      {cat.description && (
                        <div className="text-xs text-gray-500 line-clamp-1 mt-0.5 max-w-xs">
                          {cat.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {cat.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {cat.scope === 'GLOBAL' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          <Globe className="w-3 h-3" />
                          Global
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Calendar className="w-3 h-3" />
                          Event-Specific
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {cat.scope === 'EVENT_SPECIFIC' ? (
                        <div className="font-medium text-gray-900">
                          {cat.eventName || cat.eventCode || 'Bound Event'}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Available to all events</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                        {cat.totalPasses ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        title="Click to toggle status"
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
                            <XCircle className="w-3 h-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(cat)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination — only when filtered results exceed 5 */}
      {filteredCategories.length > 5 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalElements={filteredCategories.length}
          />
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Tags className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingCategory ? 'Edit Pass Category' : 'Create Pass Category'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. VIP, Delegate, Student"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {!editingCategory && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Category Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '')
                      })
                    }
                    placeholder="e.g. VIP, DELEGATE, STUDENT"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Unique uppercase identifier used in pass numbering and APIs.
                  </p>
                </div>
              )}

              {!editingCategory && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Scope *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                        formData.scope === 'GLOBAL'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="scope"
                        value="GLOBAL"
                        checked={formData.scope === 'GLOBAL'}
                        onChange={(e) => setFormData({ ...formData, scope: e.target.value, eventId: '' })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-semibold text-sm">Global</div>
                        <div className="text-xs text-gray-500">Reusable across all events</div>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                        formData.scope === 'EVENT_SPECIFIC'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="scope"
                        value="EVENT_SPECIFIC"
                        checked={formData.scope === 'EVENT_SPECIFIC'}
                        onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-semibold text-sm">Event-Specific</div>
                        <div className="text-xs text-gray-500">Only for a single event</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {!editingCategory && formData.scope === 'EVENT_SPECIFIC' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Select Event *
                  </label>
                  <select
                    required
                    value={formData.eventId}
                    onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">-- Choose an Event --</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} ({ev.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description of this pass category..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                {editingCategory && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Status
                    </label>
                    <div className="flex items-center h-10">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.active}
                          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ms-3 text-sm font-medium text-gray-700">
                          {formData.active ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassCategories;

