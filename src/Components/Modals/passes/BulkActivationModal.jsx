import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ShieldAlert,
  Mail,
  Ticket,
  Users,
  Check,
  RefreshCw,
} from 'lucide-react';
import passService from '../../../Api-Services/passService';
import toast from 'react-hot-toast';

const BulkActivationModal = ({ isOpen, onClose, event, onActivationComplete }) => {
  // Step tracker: 1 = Pass Selection, 2 = Upload Excel, 3 = Assignment Preview, 4 = Results
  const [currentStep, setCurrentStep] = useState(1);

  // Stats
  const [passStats, setPassStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Step 1: Selection Mode ('AUTO', 'RANGE', 'INDIVIDUAL')
  const [selectionMode, setSelectionMode] = useState('AUTO');
  const [fromSequence, setFromSequence] = useState('');
  const [toSequence, setToSequence] = useState('');

  // Step 2: Excel File
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Step 3: Preview Data
  const [previewData, setPreviewData] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ELIGIBLE, CONFLICTS

  // Step 4: Submission & Results
  const [submitting, setSubmitting] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  useEffect(() => {
    if (isOpen && event) {
      setCurrentStep(1);
      setSelectionMode('AUTO');
      setFromSequence('');
      setToSequence('');
      setFile(null);
      setPreviewData(null);
      setBatchResult(null);
      setActiveTab('ALL');
      fetchLiveStats();
    }
  }, [isOpen, event]);

  const fetchLiveStats = async () => {
    if (!event?.id) return;
    setStatsLoading(true);
    try {
      const res = await passService.getPassStats(event.id);
      setPassStats(res.data);
    } catch (err) {
      console.error('Failed to fetch pass stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  if (!isOpen || !event) return null;

  // Step 1 Navigation
  const handleProceedToUpload = () => {
    if (selectionMode === 'RANGE') {
      if (!fromSequence || !toSequence) {
        toast.error('Please enter both From and To sequence numbers.');
        return;
      }
      if (parseInt(fromSequence) > parseInt(toSequence)) {
        toast.error('Starting sequence cannot be greater than ending sequence.');
        return;
      }
    }
    setCurrentStep(2);
  };

  // Step 2 File Handling
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      toast.error('Invalid file format. Please upload an Excel file (.xlsx or .xls).');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }
    setFile(f);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await passService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendee_bulk_activation_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Downloaded sample Excel template');
    } catch (err) {
      toast.error('Failed to download sample template');
    }
  };

  const handleGeneratePreview = async () => {
    if (!file) {
      toast.error('Please upload an Excel spreadsheet before proceeding.');
      return;
    }

    setPreviewLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('selectionMode', selectionMode);
      if (selectionMode === 'RANGE') {
        formData.append('fromSequence', fromSequence);
        formData.append('toSequence', toSequence);
      }

      const res = await passService.previewBulkActivation(event.id, formData);
      setPreviewData(res.data);
      setCurrentStep(3);
    } catch (err) {
      toast.error(err.message || 'Failed to generate preview. Check spreadsheet format.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Step 3 Confirmation Submission
  const handleConfirmActivation = async () => {
    if (!previewData || !previewData.canConfirm) {
      toast.error('Cannot confirm: Batch contains conflicts or invalid rows.');
      return;
    }

    setSubmitting(true);
    try {
      const assignments = previewData.items
        .filter((item) => item.resultStatus === 'ELIGIBLE')
        .map((item) => ({
          passId: item.passId,
          attendeeFullName: item.attendeeFullName,
          attendeeEmail: item.attendeeEmail,
          attendeeMobileNumber: item.attendeeMobileNumber,
          attendeeOrganization: item.attendeeOrganization,
          attendeeDesignation: item.attendeeDesignation,
        }));

      const payload = {
        eventId: event.id,
        batchId: previewData.batchId,
        assignments,
      };

      const res = await passService.confirmBulkActivation(event.id, payload);
      setBatchResult(res.data);
      setCurrentStep(4);
      toast.success(`Successfully activated ${res.data?.activatedCount || assignments.length} passes!`);
      if (onActivationComplete) onActivationComplete();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm bulk activation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadResultReport = () => {
    if (!batchResult || !batchResult.activatedPassNumbers) return;
    const headers = ['Batch Reference', 'Pass Number', 'Status'];
    const rows = batchResult.activatedPassNumbers.map((num) => [
      `"${batchResult.batchReference}"`,
      `"${num}"`,
      '"ACTIVATED"',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `activation_report_${batchResult.batchReference}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter preview items for active tab
  const getFilteredItems = () => {
    if (!previewData?.items) return [];
    if (activeTab === 'ELIGIBLE') {
      return previewData.items.filter((i) => i.resultStatus === 'ELIGIBLE');
    }
    if (activeTab === 'CONFLICTS') {
      return previewData.items.filter((i) => i.resultStatus !== 'ELIGIBLE');
    }
    return previewData.items;
  };

  const calculateRangeCount = () => {
    const f = parseInt(fromSequence);
    const t = parseInt(toSequence);
    if (!isNaN(f) && !isNaN(t) && t >= f) {
      return t - f + 1;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Bulk Activate from Excel</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  {event.eventCode}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Assign attendees to generated passes and trigger activation emails.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step Breadcrumb */}
        <div className="px-6 py-3 bg-gray-50/80 border-b border-gray-200/60 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
            <span
              className={`flex items-center gap-1.5 ${
                currentStep >= 1 ? 'text-purple-700 font-bold' : 'text-gray-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </span>
              Pass Selection
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span
              className={`flex items-center gap-1.5 ${
                currentStep >= 2 ? 'text-purple-700 font-bold' : 'text-gray-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </span>
              Upload Excel
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span
              className={`flex items-center gap-1.5 ${
                currentStep >= 3 ? 'text-purple-700 font-bold' : 'text-gray-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                3
              </span>
              Assignment Preview
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span
              className={`flex items-center gap-1.5 ${
                currentStep === 4 ? 'text-green-700 font-bold' : 'text-gray-400'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep === 4 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                4
              </span>
              Confirmation & Results
            </span>
          </div>

          {passStats && (
            <div className="hidden md:flex items-center gap-2 text-[11px] text-gray-500">
              <span>Available: <strong className="text-green-600">{passStats.availablePasses}</strong></span>
              <span>·</span>
              <span>Activated: <strong className="text-purple-600">{passStats.activatedPasses}</strong></span>
            </div>
          )}
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: PASS SELECTION */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Event Statistics Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                  <div className="text-xs text-gray-500 font-medium">Total Passes</div>
                  <div className="text-lg font-bold text-gray-900 mt-0.5">
                    {statsLoading ? '...' : passStats?.totalPasses ?? 0}
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                  <div className="text-xs text-green-700 font-medium">Available (Unactivated)</div>
                  <div className="text-lg font-bold text-green-800 mt-0.5">
                    {statsLoading ? '...' : passStats?.availablePasses ?? 0}
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                  <div className="text-xs text-purple-700 font-medium">Already Activated</div>
                  <div className="text-lg font-bold text-purple-800 mt-0.5">
                    {statsLoading ? '...' : passStats?.activatedPasses ?? 0}
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                  <div className="text-xs text-red-700 font-medium">Revoked Passes</div>
                  <div className="text-lg font-bold text-red-800 mt-0.5">
                    {statsLoading ? '...' : passStats?.revokedPasses ?? 0}
                  </div>
                </div>
              </div>

              {/* Selection Method */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Select Pass Assignment Method
                </label>
                <div className="space-y-3">
                  {/* Option A: Auto Available */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      selectionMode === 'AUTO'
                        ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectionMode"
                      value="AUTO"
                      checked={selectionMode === 'AUTO'}
                      onChange={() => setSelectionMode('AUTO')}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-sm text-gray-900">
                        Option A: Select Available Passes Automatically
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Backend automatically assigns the earliest available unactivated passes in sequential order.
                      </p>
                    </div>
                  </label>

                  {/* Option B: Range Selection */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                      selectionMode === 'RANGE'
                        ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectionMode"
                      value="RANGE"
                      checked={selectionMode === 'RANGE'}
                      onChange={() => setSelectionMode('RANGE')}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="font-bold text-sm text-gray-900">
                          Option B: Select a Pass-Number Sequence Range
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Specify an explicit numeric series range (e.g. sequence 10 to 20). Calculates all positions in the series and flags any existing activations or revocations.
                        </p>
                      </div>

                      {selectionMode === 'RANGE' && (
                        <div className="grid grid-cols-2 gap-3 pt-2 bg-white p-3 rounded-lg border border-purple-200">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              From Sequence #
                            </label>
                            <input
                              type="number"
                              min="1"
                              placeholder="e.g. 1"
                              value={fromSequence}
                              onChange={(e) => setFromSequence(e.target.value)}
                              className="w-full px-3 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                              {event.eventCode}-{event.passSeriesCode}-{String(fromSequence || '1').padStart(4, '0')}
                            </p>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              To Sequence #
                            </label>
                            <input
                              type="number"
                              min="1"
                              placeholder="e.g. 25"
                              value={toSequence}
                              onChange={(e) => setToSequence(e.target.value)}
                              className="w-full px-3 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                              {event.eventCode}-{event.passSeriesCode}-{String(toSequence || '25').padStart(4, '0')}
                            </p>
                          </div>

                          {calculateRangeCount() !== null && (
                            <div className="col-span-2 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded">
                              Selected Series Span: {calculateRangeCount()} total pass positions.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: UPLOAD EXCEL */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Template Download Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 gap-3">
                <div>
                  <h4 className="font-bold text-sm text-purple-900">Need the standard spreadsheet format?</h4>
                  <p className="text-xs text-purple-700 mt-0.5">
                    Download our official Excel template with pre-styled headers and sample attendee rows.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition whitespace-nowrap"
                >
                  <Download className="w-4 h-4" /> Download Sample (.xlsx)
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
                  dragActive
                    ? 'border-purple-600 bg-purple-50'
                    : file
                    ? 'border-green-500 bg-green-50/30'
                    : 'border-gray-300 hover:border-purple-400 bg-gray-50/50'
                }`}
              >
                {file ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-10 h-10 text-green-600 mx-auto" />
                    <div className="font-bold text-gray-900 text-sm">{file.name}</div>
                    <p className="text-xs text-gray-500 font-mono">
                      {(file.size / 1024).toFixed(1)} KB · Ready to preview
                    </p>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-xs font-semibold text-red-600 hover:underline pt-1"
                    >
                      Remove and replace file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                    <div>
                      <label className="text-sm font-bold text-purple-700 hover:underline cursor-pointer">
                        Click to browse file
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                      <span className="text-sm text-gray-500"> or drag and drop here</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Supports Excel spreadsheet (.xlsx, .xls) up to 5MB (max 500 attendees per batch).
                    </p>
                  </div>
                )}
              </div>

              {/* Column Requirements */}
              <div className="bg-gray-50 border rounded-xl p-4 text-xs text-gray-600 space-y-2">
                <div className="font-bold text-gray-800">Expected Excel Columns:</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <span className="font-bold text-purple-700">Full Name</span>
                    <div className="text-[10px] text-red-500 mt-0.5">*Required</div>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <span className="font-bold text-purple-700">Email</span>
                    <div className="text-[10px] text-red-500 mt-0.5">*Required & Unique</div>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <span className="font-bold text-purple-700">Mobile Number</span>
                    <div className="text-[10px] text-gray-400 mt-0.5">Optional</div>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <span className="font-bold text-purple-700">Organization</span>
                    <div className="text-[10px] text-gray-400 mt-0.5">Optional</div>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <span className="font-bold text-purple-700">Designation</span>
                    <div className="text-[10px] text-gray-400 mt-0.5">Optional</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ASSIGNMENT PREVIEW & CONFLICT MATRIX */}
          {currentStep === 3 && previewData && (
            <div className="space-y-5">
              {/* Summary Stats Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border text-center">
                  <div className="text-gray-500 text-[11px]">Uploaded Rows</div>
                  <div className="text-base font-bold text-gray-900 mt-0.5">
                    {previewData.totalUploadedRows}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                  <div className="text-blue-700 text-[11px]">Target Passes</div>
                  <div className="text-base font-bold text-blue-900 mt-0.5">
                    {previewData.totalTargetPasses}
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                  <div className="text-green-700 text-[11px]">Eligible Assignments</div>
                  <div className="text-base font-bold text-green-900 mt-0.5">
                    {previewData.eligibleCount}
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                  <div className="text-amber-700 text-[11px]">Activated Conflicts</div>
                  <div className="text-base font-bold text-amber-900 mt-0.5">
                    {previewData.conflictActivatedCount}
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                  <div className="text-red-700 text-[11px]">Errors / Revoked</div>
                  <div className="text-base font-bold text-red-900 mt-0.5">
                    {previewData.invalidRowCount + previewData.conflictRevokedCount + previewData.conflictAttendeeExistsCount}
                  </div>
                </div>
              </div>

              {/* Safe Policy Banner */}
              {!previewData.canConfirm ? (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-800">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Confirmation Blocked (All-or-Nothing Policy): </span>
                    {previewData.rejectionReason || 'One or more rows have conflicts or validation errors.'}
                    <p className="mt-1 text-[11px] text-red-700">
                      To prevent partial activations or data overwrites, resolve the conflicting rows or re-adjust your pass sequence range before continuing.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-xs text-green-800">
                  <CheckCircle className="w-5 h-5 shrink-0 text-green-600" />
                  <div>
                    <span className="font-bold">Ready for Activation: </span>
                    All {previewData.eligibleCount} assignments are verified and eligible. No conflicts detected.
                  </div>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 border-b text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  className={`pb-2 px-1 border-b-2 transition ${
                    activeTab === 'ALL'
                      ? 'border-purple-600 text-purple-700 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  All Rows ({previewData.items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ELIGIBLE')}
                  className={`pb-2 px-1 border-b-2 transition ${
                    activeTab === 'ELIGIBLE'
                      ? 'border-green-600 text-green-700 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Eligible ({previewData.eligibleCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('CONFLICTS')}
                  className={`pb-2 px-1 border-b-2 transition ${
                    activeTab === 'CONFLICTS'
                      ? 'border-red-600 text-red-700 font-bold'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Conflicts & Errors (
                  {previewData.items.length - previewData.eligibleCount})
                </button>
              </div>

              {/* Assignments Preview Table */}
              <div className="border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider border-b sticky top-0">
                    <tr>
                      <th className="px-3 py-2 w-12 text-center">Row</th>
                      <th className="px-3 py-2">Proposed Pass</th>
                      <th className="px-3 py-2">Attendee</th>
                      <th className="px-3 py-2">Current Status</th>
                      <th className="px-3 py-2">Result</th>
                      <th className="px-3 py-2">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {getFilteredItems().map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/70">
                        <td className="px-3 py-2 font-mono text-center text-gray-500">
                          {item.rowNumber}
                        </td>
                        <td className="px-3 py-2 font-mono font-semibold text-purple-800">
                          {item.passNumber || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-semibold text-gray-900">{item.attendeeFullName || '-'}</div>
                          <div className="text-[11px] text-gray-500">{item.attendeeEmail || '-'}</div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                            {item.currentPassStatus || 'NONE'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {item.resultStatus === 'ELIGIBLE' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> Eligible
                            </span>
                          ) : item.resultStatus === 'CONFLICT_ALREADY_ACTIVATED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Already Activated
                            </span>
                          ) : item.resultStatus === 'CONFLICT_REVOKED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              Revoked
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              Invalid Row
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-gray-600 max-w-xs truncate">
                          {item.conflictReason || 'Verified'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: EXECUTION & RESULTS */}
          {currentStep === 4 && batchResult && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">Bulk Activation Complete!</h3>
                <p className="text-xs text-gray-500 mt-1">
                  All assigned passes were transactionally locked, confirmed, and activated.
                </p>
              </div>

              {/* Results Details */}
              <div className="max-w-md mx-auto grid grid-cols-2 gap-3 text-left text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-500">Batch Reference:</span>
                  <div className="font-mono font-bold text-purple-700">{batchResult.batchReference}</div>
                </div>
                <div>
                  <span className="text-gray-500">Event:</span>
                  <div className="font-semibold text-gray-900">{batchResult.eventName}</div>
                </div>
                <div>
                  <span className="text-gray-500">Passes Activated:</span>
                  <div className="font-bold text-green-700 text-sm">{batchResult.activatedCount} Passes</div>
                </div>
                <div>
                  <span className="text-gray-500">Confirmation Emails:</span>
                  <div className="font-bold text-purple-700 text-sm">
                    {batchResult.emailsQueued} Enqueued in Outbox
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadResultReport}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-gray-500" /> Download Batch Report (.csv)
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex items-center justify-between">
          <div>
            {currentStep > 1 && currentStep < 4 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 4 && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            )}

            {currentStep === 1 && (
              <button
                type="button"
                onClick={handleProceedToUpload}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
              >
                Next: Upload Excel <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={!file || previewLoading}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow disabled:opacity-50"
              >
                {previewLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Spreadsheet...
                  </>
                ) : (
                  <>
                    Generate Assignment Preview <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleConfirmActivation}
                disabled={!previewData?.canConfirm || submitting}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Confirming Batch...
                  </>
                ) : (
                  <>
                    Confirm & Activate Batch <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActivationModal;

