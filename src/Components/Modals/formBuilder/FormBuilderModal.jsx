import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit2,
  CheckCircle,
  History,
  Eye,
  Settings2,
  Save,
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import categoryService from '../../../Api-Services/categoryService';

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Single-line Text' },
  { value: 'TEXTAREA', label: 'Multi-line Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'EMAIL', label: 'Email Address' },
  { value: 'PHONE', label: 'Phone Number' },
  { value: 'SELECT', label: 'Dropdown Select' },
  { value: 'RADIO', label: 'Radio Choice' },
  { value: 'CHECKBOX', label: 'Checkbox' }
];

const FormBuilderModal = ({ isOpen, onClose, eventCategoryId, categoryName, onPublished }) => {
  const [activeTab, setActiveTab] = useState('fields'); // 'fields', 'preview', 'history'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Draft fields list
  const [fields, setFields] = useState([]);
  const [history, setHistory] = useState([]);

  // Field Edit Modal State
  const [editingIndex, setEditingIndex] = useState(null);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [fieldForm, setFieldForm] = useState({
    fieldKey: '',
    label: '',
    fieldType: 'TEXT',
    placeholder: '',
    helpText: '',
    required: false,
    visible: true,
    displayOrder: 0,
    options: '', // comma-separated for editing
    validationRules: {}
  });

  // Publish Dialog
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [changelog, setChangelog] = useState('');

  // Interactive preview values
  const [previewValues, setPreviewValues] = useState({});

  useEffect(() => {
    if (isOpen && eventCategoryId) {
      loadDraftFields();
    }
  }, [isOpen, eventCategoryId]);

  const loadDraftFields = async () => {
    setLoading(true);
    try {
      const res = await categoryService.getDraftFields(eventCategoryId);
      const loaded = res.data || [];
      // Sort by display order
      loaded.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      setFields(loaded);
    } catch (err) {
      console.error('Failed to load draft fields:', err);
      toast.error(err.message || 'Failed to load form fields');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await categoryService.getVersionHistory(eventCategoryId);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load version history:', err);
      toast.error('Failed to load version history');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      loadHistory();
    }
  };

  const handleOpenAddField = () => {
    setEditingIndex(null);
    setFieldForm({
      fieldKey: '',
      label: '',
      fieldType: 'TEXT',
      placeholder: '',
      helpText: '',
      required: false,
      visible: true,
      displayOrder: fields.length + 1,
      options: '',
      validationRules: {}
    });
    setFieldModalOpen(true);
  };

  const handleOpenEditField = (index) => {
    const f = fields[index];
    setEditingIndex(index);
    setFieldForm({
      id: f.id,
      fieldKey: f.fieldKey || '',
      label: f.label || '',
      fieldType: f.fieldType || 'TEXT',
      placeholder: f.placeholder || '',
      helpText: f.helpText || '',
      required: f.required ?? false,
      visible: f.visible ?? true,
      displayOrder: f.displayOrder ?? index + 1,
      options: Array.isArray(f.options) ? f.options.join(', ') : '',
      validationRules: f.validationRules || {}
    });
    setFieldModalOpen(true);
  };

  const handleSaveFieldToDraft = (e) => {
    e.preventDefault();
    if (!fieldForm.label.trim()) {
      toast.error('Field Label is required');
      return;
    }

    let key = fieldForm.fieldKey.trim();
    if (!key) {
      key = fieldForm.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    }

    // Check duplicate key
    const duplicate = fields.some(
      (f, idx) => idx !== editingIndex && f.fieldKey.toLowerCase() === key.toLowerCase()
    );
    if (duplicate) {
      toast.error(`Field key "${key}" already exists in this form`);
      return;
    }

    const optionsArray = ['SELECT', 'RADIO', 'CHECKBOX'].includes(fieldForm.fieldType)
      ? fieldForm.options
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

    const newField = {
      ...fieldForm,
      fieldKey: key,
      label: fieldForm.label.trim(),
      options: optionsArray,
      displayOrder: parseInt(fieldForm.displayOrder, 10) || 0
    };

    let updatedList;
    if (editingIndex !== null) {
      updatedList = [...fields];
      updatedList[editingIndex] = newField;
    } else {
      updatedList = [...fields, newField];
    }

    // Reassign sequential display order
    updatedList.forEach((item, idx) => {
      item.displayOrder = idx + 1;
    });

    setFields(updatedList);
    setFieldModalOpen(false);
    toast.success(editingIndex !== null ? 'Field updated' : 'Field added to draft');
  };

  const handleDeleteField = (index) => {
    const updated = fields.filter((_, idx) => idx !== index);
    updated.forEach((item, idx) => {
      item.displayOrder = idx + 1;
    });
    setFields(updated);
    toast.success('Field removed from draft');
  };

  const handleMove = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    updated.forEach((item, idx) => {
      item.displayOrder = idx + 1;
    });
    setFields(updated);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await categoryService.saveDraftFields(eventCategoryId, fields);
      toast.success('Draft fields saved successfully');
      loadDraftFields();
    } catch (err) {
      console.error('Failed to save draft fields:', err);
      toast.error(err.message || 'Failed to save draft fields');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // First save draft
      await categoryService.saveDraftFields(eventCategoryId, fields);
      // Then publish
      const res = await categoryService.publishFormVersion(eventCategoryId, changelog.trim());
      toast.success(`Published Version v${res.data?.versionNumber || 1}!`);
      setPublishModalOpen(false);
      setChangelog('');
      if (onPublished) onPublished(res.data);
      onClose();
    } catch (err) {
      console.error('Failed to publish version:', err);
      toast.error(err.message || 'Failed to publish form version');
    } finally {
      setPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Dynamic Registration Form Builder</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                  {categoryName || 'Category'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Customize attendee registration fields, configure validations, and publish immutable schema versions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Action Bar */}
        <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleTabChange('fields')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'fields'
                  ? 'bg-white text-indigo-600 shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Draft Fields ({fields.length})</span>
            </button>

            <button
              onClick={() => handleTabChange('preview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-600 shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Form Preview</span>
            </button>

            <button
              onClick={() => handleTabChange('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-indigo-600 shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Version History</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-gray-500" />
              <span>{saving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              onClick={() => setPublishModalOpen(true)}
              disabled={publishing || loading || fields.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Version</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
              <span className="text-sm">Loading form schema...</span>
            </div>
          ) : activeTab === 'fields' ? (
            /* Fields Builder Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Form Questions & Fields</h3>
                  <p className="text-xs text-gray-500">
                    Define custom attendee inputs. Reorder with arrows.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddField}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs border border-indigo-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <Settings2 className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-medium text-gray-600">No custom fields defined yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    Click "Add Question" to configure registration questions (like College Roll Number, Organization, T-shirt size).
                  </p>
                  <button
                    onClick={handleOpenAddField}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Add First Question
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {fields.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 bg-white border border-gray-200 hover:border-indigo-300 rounded-xl transition-all shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleMove(idx, -1)}
                            disabled={idx === 0}
                            className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMove(idx, 1)}
                            disabled={idx === fields.length - 1}
                            className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">{f.label}</span>
                            <span className="font-mono text-[10px] text-gray-400">({f.fieldKey})</span>
                            {f.required && (
                              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-600 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px]">
                              {f.fieldType}
                            </span>
                            {f.placeholder && <span>Hint: "{f.placeholder}"</span>}
                            {f.options && f.options.length > 0 && (
                              <span className="text-gray-400">
                                {f.options.length} options: {f.options.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditField(idx)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Field"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(idx)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'preview' ? (
            /* Live Form Preview Tab */
            <div className="max-w-xl mx-auto bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
              <div className="mb-4 pb-3 border-b border-gray-200">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Live Preview
                </span>
                <h4 className="text-lg font-bold text-gray-900 mt-0.5">Attendee Registration</h4>
                <p className="text-xs text-gray-500">
                  This is how the questions appear to attendees during pass registration.
                </p>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No questions in draft to preview.
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>

                      {field.fieldType === 'TEXT' || field.fieldType === 'EMAIL' || field.fieldType === 'PHONE' || field.fieldType === 'NUMBER' ? (
                        <input
                          type={field.fieldType.toLowerCase()}
                          placeholder={field.placeholder || ''}
                          value={previewValues[field.fieldKey] || ''}
                          onChange={(e) =>
                            setPreviewValues({ ...previewValues, [field.fieldKey]: e.target.value })
                          }
                          className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      ) : field.fieldType === 'TEXTAREA' ? (
                        <textarea
                          rows="3"
                          placeholder={field.placeholder || ''}
                          value={previewValues[field.fieldKey] || ''}
                          onChange={(e) =>
                            setPreviewValues({ ...previewValues, [field.fieldKey]: e.target.value })
                          }
                          className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      ) : field.fieldType === 'SELECT' ? (
                        <select
                          value={previewValues[field.fieldKey] || ''}
                          onChange={(e) =>
                            setPreviewValues({ ...previewValues, [field.fieldKey]: e.target.value })
                          }
                          className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="">{field.placeholder || '-- Select an option --'}</option>
                          {field.options?.map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.fieldType === 'RADIO' ? (
                        <div className="space-y-1.5 pt-1">
                          {field.options?.map((opt, oIdx) => (
                            <label key={oIdx} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                              <input
                                type="radio"
                                name={field.fieldKey}
                                value={opt}
                                checked={previewValues[field.fieldKey] === opt}
                                onChange={(e) =>
                                  setPreviewValues({ ...previewValues, [field.fieldKey]: e.target.value })
                                }
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : field.fieldType === 'CHECKBOX' ? (
                        <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={!!previewValues[field.fieldKey]}
                            onChange={(e) =>
                              setPreviewValues({ ...previewValues, [field.fieldKey]: e.target.checked })
                            }
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{field.placeholder || field.label}</span>
                        </label>
                      ) : null}

                      {field.helpText && (
                        <p className="text-[11px] text-gray-400">{field.helpText}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Version History Tab */
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Immutable Schema Versions</h3>
                <p className="text-xs text-gray-500">
                  Every published version is permanently preserved so past attendee registrations retain their original field layout.
                </p>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  No published versions yet. Current configuration is in draft.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((ver) => (
                    <div
                      key={ver.id}
                      className="p-4 bg-white border border-gray-200 rounded-xl space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                            v{ver.versionNumber}
                          </span>
                          <span className="text-xs text-gray-500">
                            {ver.publishedAt ? new Date(ver.publishedAt).toLocaleString() : 'Published'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {ver.fields?.length || 0} fields
                        </span>
                      </div>
                      {ver.changelog && (
                        <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
                          {ver.changelog}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Close */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Close Builder
          </button>
        </div>
      </div>

      {/* Field Editor Dialog */}
      {fieldModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-md font-bold text-gray-900">
                {editingIndex !== null ? 'Edit Question' : 'Add Question'}
              </h3>
              <button
                onClick={() => setFieldModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFieldToDraft} className="mt-4 space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Question Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. College Roll Number / T-Shirt Size"
                  value={fieldForm.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    const autoKey = label
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '_')
                      .replace(/^_+|_+$/g, '');
                    setFieldForm({
                      ...fieldForm,
                      label,
                      fieldKey: fieldForm.fieldKey || autoKey
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Field Key (Slug)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. roll_number"
                    value={fieldForm.fieldKey}
                    onChange={(e) => setFieldForm({ ...fieldForm, fieldKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Field Type *
                  </label>
                  <select
                    value={fieldForm.fieldType}
                    onChange={(e) => setFieldForm({ ...fieldForm, fieldType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {['SELECT', 'RADIO', 'CHECKBOX'].includes(fieldForm.fieldType) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Options (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Small, Medium, Large, XL"
                    value={fieldForm.options}
                    onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Placeholder / Helper Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. Enter your roll number..."
                  value={fieldForm.placeholder}
                  onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={fieldForm.required}
                    onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Mandatory / Required</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={fieldForm.visible}
                    onChange={(e) => setFieldForm({ ...fieldForm, visible: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Visible to Attendee</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setFieldModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Version Dialog */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-md font-bold text-gray-900 mb-2">Publish Form Schema Version</h3>
            <p className="text-xs text-gray-500 mb-4">
              Publishing snapshots all {fields.length} draft fields into a new immutable version. Future attendee registrations will use this version.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Changelog / Version Notes
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Added t-shirt size and updated required fields."
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setPublishModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{publishing ? 'Publishing...' : 'Confirm & Publish'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormBuilderModal;

