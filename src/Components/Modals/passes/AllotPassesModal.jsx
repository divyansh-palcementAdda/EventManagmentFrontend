import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Users,
  Layers,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Hash,
  ArrowRight,
} from 'lucide-react';
import passAllotmentService from '../../../Api-Services/passAllotmentService';
import toast from 'react-hot-toast';
import useScrollLock from '../../../hooks/useScrollLock';

const AllotPassesModal = ({
  isOpen,
  onClose,
  eventId,
  categories = [],
  onAllotmentSuccess,
}) => {
  useScrollLock(isOpen);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [sequences, setSequences] = useState([]);
  const [loadingSequences, setLoadingSequences] = useState(false);
  const [selectedSequenceKey, setSelectedSequenceKey] = useState('');
  const [quantity, setQuantity] = useState('');
  const [allottedTo, setAllottedTo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Normalize category options
  const categoryOptions = useMemo(() => {
    return categories.map((cat) => {
      const code = cat.categoryCode || cat.passCategoryCode || cat.code;
      const name = cat.categoryName || cat.passCategoryName || cat.name || code;
      return { code, name };
    });
  }, [categories]);

  // When modal opens, initialize or reset
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setQuantity('');
      setAllottedTo('');
      setRemarks('');
      if (categoryOptions.length > 0 && !selectedCategory) {
        setSelectedCategory(categoryOptions[0].code);
      }
    }
  }, [isOpen, categoryOptions]);

  // Fetch sequences whenever selectedCategory changes
  useEffect(() => {
    if (!isOpen || !eventId || !selectedCategory) {
      setSequences([]);
      setSelectedSequenceKey('');
      return;
    }

    let isMounted = true;
    const fetchSequences = async () => {
      setLoadingSequences(true);
      setErrorMsg('');
      try {
        const data = await passAllotmentService.getSequencesForCategory(eventId, selectedCategory);
        if (isMounted) {
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : [];
          setSequences(list);
          if (list.length > 0) {
            setSelectedSequenceKey(`${list[0].fromSequence}-${list[0].toSequence}`);
          } else {
            setSelectedSequenceKey('');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load sequences:', err);
          setErrorMsg(err.message || 'Failed to load sequences for the selected category.');
          setSequences([]);
          setSelectedSequenceKey('');
        }
      } finally {
        if (isMounted) setLoadingSequences(false);
      }
    };

    fetchSequences();

    return () => {
      isMounted = false;
    };
  }, [isOpen, eventId, selectedCategory]);

  // Current selected sequence object
  const currentSequence = useMemo(() => {
    if (!selectedSequenceKey || sequences.length === 0) return null;
    return sequences.find((s) => `${s.fromSequence}-${s.toSequence}` === selectedSequenceKey) || null;
  }, [selectedSequenceKey, sequences]);

  const maxAvailable = currentSequence ? currentSequence.availablePasses : 0;
  const numQuantity = parseInt(quantity, 10) || 0;

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedSequenceKey('');
    setQuantity('');
    setErrorMsg('');
  };

  const handleSequenceChange = (e) => {
    setSelectedSequenceKey(e.target.value);
    setQuantity('');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCategory) {
      setErrorMsg('Please select a category.');
      return;
    }
    if (!currentSequence) {
      setErrorMsg('Please select a valid sequence.');
      return;
    }
    const trimmedRecipient = allottedTo.trim();
    if (!trimmedRecipient) {
      setErrorMsg('Please enter the recipient or internal representative name.');
      return;
    }
    if (numQuantity <= 0) {
      setErrorMsg('Allotment quantity must be at least 1.');
      return;
    }
    if (numQuantity > maxAvailable) {
      setErrorMsg(`Cannot allot ${numQuantity} passes. Only ${maxAvailable} available in this sequence.`);
      return;
    }

    const payload = {
      categoryCode: selectedCategory,
      fromSequence: currentSequence.fromSequence,
      toSequence: currentSequence.toSequence,
      sequenceIdentifier: currentSequence.sequenceId || currentSequence.displayName,
      allottedTo: trimmedRecipient,
      quantity: numQuantity,
      remarks: remarks.trim() || null,
    };

    setSubmitting(true);
    try {
      await passAllotmentService.createAllotment(eventId, payload);
      toast.success(`Successfully allotted ${numQuantity} ${currentSequence.categoryName || selectedCategory} passes to ${trimmedRecipient}`);
      if (onAllotmentSuccess) {
        onAllotmentSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Allotment error:', err);
      setErrorMsg(err.message || 'Failed to allot passes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-purple-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Allot Passes</h2>
              <p className="text-xs text-gray-500">Assign unallotted passes to internal representatives</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Field 1: Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-600" /> Pass Category
            </label>
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              disabled={submitting || categoryOptions.length === 0}
              className="w-full text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
            >
              {categoryOptions.length === 0 ? (
                <option value="">No categories configured</option>
              ) : (
                categoryOptions.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.name} ({cat.code})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Field 2: Sequence */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600" /> Pass Sequence
              </label>
              {loadingSequences && (
                <span className="text-[11px] text-purple-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading sequences...
                </span>
              )}
            </div>
            <select
              value={selectedSequenceKey}
              onChange={handleSequenceChange}
              disabled={submitting || loadingSequences || sequences.length === 0}
              className="w-full text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
            >
              {sequences.length === 0 ? (
                <option value="">
                  {loadingSequences ? 'Loading sequences...' : 'No generated passes found for category'}
                </option>
              ) : (
                sequences.map((s) => (
                  <option key={`${s.fromSequence}-${s.toSequence}`} value={`${s.fromSequence}-${s.toSequence}`}>
                    {s.displayName || `Seq: ${s.fromSequence} - ${s.toSequence}`} ({s.availablePasses} available)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Field 3: Sequence Badges */}
          {currentSequence && (
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-center">
                <span className="text-[10px] text-gray-500 font-medium block">Total in Sequence</span>
                <span className="text-xs sm:text-sm font-bold text-gray-800 font-mono">
                  {currentSequence.totalPasses}
                </span>
              </div>
              <div className="text-center border-x border-gray-200">
                <span className="text-[10px] text-purple-700 font-medium block">Already Allotted</span>
                <span className="text-xs sm:text-sm font-bold text-purple-700 font-mono">
                  {currentSequence.allottedPasses}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-green-700 font-medium block">Available to Allot</span>
                <span className="text-xs sm:text-sm font-bold text-green-700 font-mono">
                  {currentSequence.availablePasses}
                </span>
              </div>
            </div>
          )}

          {/* Field 4: Quantity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-purple-600" /> Allotment Quantity
              </label>
              {maxAvailable > 0 && (
                <button
                  type="button"
                  onClick={() => setQuantity(String(maxAvailable))}
                  disabled={submitting}
                  className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition"
                >
                  Max ({maxAvailable})
                </button>
              )}
            </div>
            <input
              type="number"
              min="1"
              max={maxAvailable || 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Enter quantity (1 - ${maxAvailable})`}
              disabled={submitting || maxAvailable === 0}
              className="w-full text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
            />
          </div>

          {/* Field 5: Allotted To */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-600" /> Allotted To (Recipient / Representative)
            </label>
            <input
              type="text"
              value={allottedTo}
              onChange={(e) => setAllottedTo(e.target.value)}
              placeholder="e.g. Divyansh, Marketing Team, VIP Desk"
              disabled={submitting}
              className="w-full text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
            />
          </div>

          {/* Field 6: Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" /> Remarks (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Batch for university guests, batch 1"
              disabled={submitting}
              className="w-full text-xs sm:text-sm px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
            />
          </div>

          {/* Preview Box */}
          {numQuantity > 0 && allottedTo.trim() && currentSequence && (
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1.5 text-xs text-purple-900">
              <span className="font-bold text-[11px] uppercase tracking-wider text-purple-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Allotment Summary
              </span>
              <div className="flex justify-between">
                <span className="text-gray-600">Recipient:</span>
                <span className="font-bold text-gray-900">{allottedTo.trim()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category & Sequence:</span>
                <span className="font-medium text-gray-800">
                  {currentSequence.categoryName || selectedCategory} (Pass #{currentSequence.fromSequence} - #{currentSequence.toSequence})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Passes to allot:</span>
                <span className="font-bold text-purple-700">{numQuantity}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-purple-200/60 text-[11px]">
                <span className="text-gray-500">Remaining available in seq:</span>
                <span className="font-semibold text-gray-700">{Math.max(0, maxAvailable - numQuantity)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                loadingSequences ||
                !currentSequence ||
                maxAvailable === 0 ||
                numQuantity <= 0 ||
                numQuantity > maxAvailable ||
                !allottedTo.trim()
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Allotting...
                </>
              ) : (
                <>
                  Confirm Allotment
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllotPassesModal;
