import React, { useState, useEffect } from 'react';
import passService from '../../../Api-Services/passService';
import {
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  HelpCircle,
  Hash,
  ListFilter,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ManagePassValidityModal = ({
  isOpen,
  onClose,
  event,
  eventDays = [],
  selectedPasses = [],
  singlePass = null,
  onValidityUpdated,
}) => {
  // Selection mode: INDIVIDUAL, RANGE, ALL_ELIGIBLE
  const [selectionMode, setSelectionMode] = useState('INDIVIDUAL');
  const [fromSequence, setFromSequence] = useState('');
  const [toSequence, setToSequence] = useState('');

  // Validity Mode: 'ALL' or 'CUSTOM'
  const [validityMode, setValidityMode] = useState('ALL');
  const [selectedDayIds, setSelectedDayIds] = useState([]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (singlePass) {
        setSelectionMode('INDIVIDUAL');
        if (singlePass.validDays && singlePass.validDays.length > 0) {
          setValidityMode('CUSTOM');
          setSelectedDayIds(singlePass.validDays.map((d) => d.id));
        } else {
          setValidityMode('ALL');
          setSelectedDayIds([]);
        }
      } else if (selectedPasses.length > 0) {
        setSelectionMode('INDIVIDUAL');
        setValidityMode('ALL');
        setSelectedDayIds([]);
      } else {
        setSelectionMode('RANGE');
        setValidityMode('ALL');
        setSelectedDayIds([]);
      }
    }
  }, [isOpen, singlePass, selectedPasses]);

  if (!isOpen || !event) return null;

  const toggleDay = (dayId) => {
    setSelectedDayIds((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]
    );
  };

  const selectAllDays = () => {
    setSelectedDayIds(eventDays.map((d) => d.id));
  };

  const clearAllDays = () => {
    setSelectedDayIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // If single pass update
    if (singlePass) {
      setSaving(true);
      try {
        const payload = validityMode === 'ALL' ? [] : selectedDayIds;
        await passService.updateSinglePassValidity(singlePass.id, payload);
        toast.success(`Pass ${singlePass.passNumber} validity updated!`);
        if (onValidityUpdated) onValidityUpdated();
        onClose();
      } catch (err) {
        const message = err.message || err.error || 'Failed to update pass validity';
        setErrorMsg(message);
        toast.error(message);
      } finally {
        setSaving(false);
      }
      return;
    }

    // Bulk / Range / Selection update
    if (selectionMode === 'INDIVIDUAL' && selectedPasses.length === 0) {
      setErrorMsg('No passes selected. Please select passes or choose Range mode.');
      return;
    }

    if (selectionMode === 'RANGE') {
      const from = parseInt(fromSequence);
      const to = parseInt(toSequence);
      if (isNaN(from) || isNaN(to) || from < 1 || to < from) {
        setErrorMsg('Please specify a valid sequence range (From <= To).');
        return;
      }
    }

    if (validityMode === 'CUSTOM' && selectedDayIds.length === 0) {
      setErrorMsg('Please select at least one event day or choose "Valid for All Days".');
      return;
    }

    const payload = {
      selectionMode,
      passIds: selectionMode === 'INDIVIDUAL' ? selectedPasses.map((p) => p.id) : null,
      fromSequence: selectionMode === 'RANGE' ? parseInt(fromSequence) : null,
      toSequence: selectionMode === 'RANGE' ? parseInt(toSequence) : null,
      allEligible: selectionMode === 'ALL_ELIGIBLE',
      validDayIds: validityMode === 'ALL' ? [] : selectedDayIds,
    };

    setSaving(true);
    try {
      const res = await passService.updatePassValidity(event.id, payload);
      const data = res.data;
      toast.success(
        data?.message || `Successfully updated validity for ${data?.updatedPassesCount || 0} passes!`
      );
      if (onValidityUpdated) onValidityUpdated();
      onClose();
    } catch (err) {
      const message = err.message || err.error || 'Failed to update pass validity';
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Calendar className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Manage Event-Day Pass Validity</h2>
              <p className="text-xs text-purple-200">
                {singlePass ? `Pass: ${singlePass.passNumber}` : `Event: ${event.name}`}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Target Pass Selection (only if not a single pass) */}
          {!singlePass && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5 text-purple-600" /> 1. Select Target Passes
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectionMode('INDIVIDUAL')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectionMode === 'INDIVIDUAL'
                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-600/20'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="font-bold text-xs">Selected Passes</span>
                  <span className="text-[11px] text-gray-500 mt-1">
                    {selectedPasses.length} currently selected
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectionMode('RANGE')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectionMode === 'RANGE'
                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-600/20'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="font-bold text-xs">Sequence Range</span>
                  <span className="text-[11px] text-gray-500 mt-1">e.g. #0001 to #0100</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectionMode('ALL_ELIGIBLE')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectionMode === 'ALL_ELIGIBLE'
                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-600/20'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="font-bold text-xs">All Eligible Passes</span>
                  <span className="text-[11px] text-gray-500 mt-1">All active & available</span>
                </button>
              </div>

              {/* Mode-specific details */}
              {selectionMode === 'INDIVIDUAL' && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600">
                  {selectedPasses.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {selectedPasses.map((p) => (
                        <span
                          key={p.id}
                          className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-200 text-purple-700"
                        >
                          {p.passNumber}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="italic text-gray-400">
                      No passes selected in the table. Check checkboxes in the passes list, or use Range mode.
                    </span>
                  )}
                </div>
              )}

              {selectionMode === 'RANGE' && (
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                        From Sequence #
                      </label>
                      <div className="relative">
                        <Hash className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={fromSequence}
                          onChange={(e) => setFromSequence(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                        To Sequence #
                      </label>
                      <div className="relative">
                        <Hash className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          min="1"
                          placeholder="100"
                          value={toSequence}
                          onChange={(e) => setToSequence(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Applies strictly to passes belonging to this event within the sequence numbers.
                  </p>
                </div>
              )}

              {selectionMode === 'ALL_ELIGIBLE' && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>
                    This will update all passes currently issued for this event (excluding revoked passes).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Event Days Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600" /> 2. Permitted Check-in Days
              </label>
              {validityMode === 'CUSTOM' && (
                <div className="space-x-2 text-[11px]">
                  <button
                    type="button"
                    onClick={selectAllDays}
                    className="text-purple-600 hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={clearAllDays}
                    className="text-gray-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Validity Radio Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  validityMode === 'ALL'
                    ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-600/20'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="validityMode"
                  checked={validityMode === 'ALL'}
                  onChange={() => setValidityMode('ALL')}
                  className="mt-0.5 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-bold text-xs">All Event Days</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Pass is valid for check-in on any active day of the event
                  </div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  validityMode === 'CUSTOM'
                    ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-600/20'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="validityMode"
                  checked={validityMode === 'CUSTOM'}
                  onChange={() => setValidityMode('CUSTOM')}
                  className="mt-0.5 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-bold text-xs">Specific Days Only</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Limit entry strictly to selected calendar dates / days
                  </div>
                </div>
              </label>
            </div>

            {/* Days Checkbox List (shown when CUSTOM selected) */}
            {validityMode === 'CUSTOM' && (
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-2 max-h-48 overflow-y-auto">
                {eventDays.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No multi-day schedule found for this event.</p>
                ) : (
                  eventDays.map((day) => {
                    const checked = selectedDayIds.includes(day.id);
                    return (
                      <label
                        key={day.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition text-xs ${
                          checked
                            ? 'bg-white border-purple-300 text-purple-900 shadow-xs'
                            : 'bg-white/60 border-gray-200 text-gray-600 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDay(day.id)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <div>
                            <span className="font-bold text-gray-900 mr-2">Day {day.dayNumber}:</span>
                            <span className="text-gray-600">{day.label || 'Session Day'}</span>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-gray-500">
                          {day.eventDate}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Live Preview Summary Card */}
          <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-xl text-xs space-y-1.5">
            <div className="font-bold text-purple-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-700" /> Verification Preview
            </div>
            <div className="text-purple-800 flex justify-between">
              <span>Target:</span>
              <span className="font-semibold">
                {singlePass
                  ? `Single Pass (${singlePass.passNumber})`
                  : selectionMode === 'INDIVIDUAL'
                  ? `${selectedPasses.length} selected passes`
                  : selectionMode === 'RANGE'
                  ? `Sequence Range [${fromSequence || '?'} - ${toSequence || '?'}]`
                  : 'All Eligible Event Passes'}
              </span>
            </div>
            <div className="text-purple-800 flex justify-between">
              <span>Permitted Entry:</span>
              <span className="font-semibold">
                {validityMode === 'ALL'
                  ? 'All Event Days (Unrestricted)'
                  : selectedDayIds.length > 0
                  ? `${selectedDayIds.length} specific day(s) permitted`
                  : 'None selected'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Validity...
                </>
              ) : (
                'Save Validity Rules'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagePassValidityModal;

