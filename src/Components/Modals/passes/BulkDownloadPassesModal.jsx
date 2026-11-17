import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  Printer,
  FileSpreadsheet,
  Filter,
  CheckCircle,
  Loader2,
  AlertCircle,
  QrCode,
  Layers,
  GraduationCap,
  Users,
  ShieldCheck,
  Shield,
} from 'lucide-react';
import passService from '../../../Api-Services/passService';
import { categoryService } from '../../../Api-Services/categoryService';
import toast from 'react-hot-toast';
import useScrollLock from '../../../hooks/useScrollLock';

const BulkDownloadPassesModal = ({ isOpen, onClose, event, eventDays = [], categories = [] }) => {
  const [localCategories, setLocalCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [useRange, setUseRange] = useState(false);
  const [fromSeq, setFromSeq] = useState('');
  const [toSeq, setToSeq] = useState('');
  const [dayId, setDayId] = useState('');

  const [loading, setLoading] = useState(false);
  const [passesData, setPassesData] = useState([]);
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false);

  const effectiveCategories = useMemo(() => {
    return (categories && categories.length > 0) ? categories : localCategories;
  }, [categories, localCategories]);

  const categoryOptions = useMemo(() => {
    const list = [{ value: 'ALL', label: 'All Categories' }];
    if (effectiveCategories && effectiveCategories.length > 0) {
      effectiveCategories.forEach((cat) => {
        const code = cat.categoryCode || cat.passCategoryCode || cat.code;
        const name = cat.categoryName || cat.passCategoryName || cat.name || code;
        const isNoQr = cat.activationMode === 'NO_QR_WALK_IN' ||
          cat.qrRequired === false ||
          (code && code.toUpperCase() === 'VIP') ||
          (name && name.toUpperCase().includes('VIP'));
        list.push({ value: code, label: name, isNoQr });
      });
      const hasVip = list.some((c) => c.value?.toUpperCase() === 'VIP' || c.label?.toUpperCase()?.includes('VIP'));
      if (!hasVip) {
        list.push({ value: 'VIP', label: 'VIP (No QR Badge)', isNoQr: true });
      }
    } else {
      list.push({ value: 'STUDENT', label: 'Student' });
      list.push({ value: 'VIP', label: 'VIP (No QR Badge)', isNoQr: true });
      list.push({ value: 'OTHER', label: 'Other' });
    }
    return list;
  }, [effectiveCategories]);

  const isNoQrPass = (p) => {
    if (!p) return false;
    if (p.qrRequired === false) return true;
    if (p.activationMode === 'NO_QR_WALK_IN') return true;
    if (p.qrData === null || p.qrData === '' || p.qrData === undefined) return true;
    const catCode = (p.categoryCode || '').toUpperCase();
    const catName = (p.categoryName || '').toUpperCase();
    const passCat = (
      typeof p.category === 'string'
        ? p.category
        : p.category?.name || p.categoryCode || p.categoryName || ''
    ).toUpperCase();
    const passNum = (p.passNumber || '').toUpperCase();
    if (
      passCat === 'VIP' || passCat.includes('VIP') ||
      catCode === 'VIP' || catCode.includes('VIP') ||
      catName === 'VIP' || catName.includes('VIP') ||
      passNum.includes('VIP')
    ) {
      return true;
    }
    const matchCat = effectiveCategories.find((c) => {
      const cCode = (c.categoryCode || c.passCategoryCode || c.code || '').toUpperCase();
      const cName = (c.categoryName || c.passCategoryName || c.name || '').toUpperCase();
      return cCode === passCat || cCode === catCode || cName === passCat || cName === catName;
    });
    if (matchCat && (matchCat.qrRequired === false || matchCat.activationMode === 'NO_QR_WALK_IN' || (matchCat.categoryCode && matchCat.categoryCode.toUpperCase().includes('VIP')) || (matchCat.name && matchCat.name.toUpperCase().includes('VIP')))) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (isOpen && event?.id) {
      if (!categories || categories.length === 0) {
        categoryService.getEventCategories(event.id, false)
          .then((res) => {
            let list = [];
            if (Array.isArray(res)) list = res;
            else if (Array.isArray(res?.data)) list = res.data;
            else if (Array.isArray(res?.data?.content)) list = res.data.content;
            setLocalCategories(list);
          })
          .catch((err) => console.error('Failed to load categories in bulk download:', err));
      }
    }
  }, [isOpen, event, categories]);

  useEffect(() => {
    if (isOpen) {
      setStatusFilter('');
      setCategoryFilter('ALL');
      setUseRange(false);
      setFromSeq('');
      setToSeq('');
      setDayId('');
      setPassesData([]);
      setIsPrintViewOpen(false);
    }
  }, [isOpen]);

  useScrollLock(isOpen && !!event);

  if (!isOpen || !event) return null;

  const fetchPassesForExport = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (categoryFilter && categoryFilter !== 'ALL') filters.category = categoryFilter;
      if (useRange) {
        if (!fromSeq || !toSeq) {
          toast.error('Please specify both starting and ending sequence numbers.');
          setLoading(false);
          return null;
        }
        if (parseInt(fromSeq) > parseInt(toSeq)) {
          toast.error('Starting sequence cannot be greater than ending sequence.');
          setLoading(false);
          return null;
        }
        filters.fromSequence = parseInt(fromSeq);
        filters.toSequence = parseInt(toSeq);
      }
      if (dayId) filters.dayId = dayId;

      const res = await passService.exportPasses(event.id, filters);
      const data = res.data || [];
      setPassesData(data);
      if (data.length === 0) {
        toast.error('No passes found matching the specified criteria.');
      }
      return data;
    } catch (err) {
      toast.error(err.message || 'Failed to fetch passes for export');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getQrUrl = (tokenOrPass) => {
    const identifier = typeof tokenOrPass === 'string'
      ? tokenOrPass
      : (tokenOrPass?.passNumber || tokenOrPass?.qrData || '');
    const activationUrl = `${window.location.origin}/activate/${encodeURIComponent(identifier)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activationUrl)}`;
  };

  // ─── KEY FIX: Opens a fresh browser window with 1 pass per page ───────────
  const openPrintWindow = (data) => {
    const formatDate = (p) => {
      if (!p.validDays || p.validDays.length === 0) return '';
      const dates = p.validDays.map(d => d.eventDate || d.label).filter(Boolean);
      const parsed = dates.map(d => new Date(d)).filter(d => !isNaN(d));
      if (parsed.length === 0) return dates[0] || '';
      if (parsed.length === 1)
        return parsed[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const sorted = parsed.sort((a, b) => a - b);
      const first = sorted[0], last = sorted[sorted.length - 1];
      if (first.toDateString() === last.toDateString())
        return first.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const mo = first.toLocaleDateString('en-US', { month: 'short' });
      return `${mo} ${first.getDate()}–${last.getDate()}, ${first.getFullYear()}`;
    };

    const cardsHtml = data.map((p) => {
      const noQr = isNoQrPass(p);
      const category = p.category || 'PASS';
      const seqNum = p.sequenceNumber
        ? String(p.sequenceNumber).padStart(4, '0')
        : (p.passNumber?.split('-')?.pop() || '');
      const dateStr = formatDate(p);
      const qrUrl = noQr ? null : getQrUrl(p);

      return `
        <div class="pass-page">
          <div class="pass-card">
            ${noQr
          ? `<div class="no-qr-box">
                   <div class="no-qr-icon">&#10003;</div>
                   <div class="badge-label">Badge Pass</div>
                   <div class="no-qr-label">Walk-In · No QR Code</div>
                 </div>`
          : `<img src="${qrUrl}" alt="QR" class="qr-img" />`
        }
            <div class="category">${category}</div>
            <div class="seq-num">${seqNum}</div>
            ${dateStr ? `<div class="date">${dateStr}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Passes – ${event.eventCode || event.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; font-family: Arial, sans-serif; }

    /* ── 1 pass per page ── */
    .pass-page {
      width: 100%;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      page-break-after: always;
      break-after: page;
    }
    .pass-page:last-of-type {
      page-break-after: avoid;
      break-after: avoid;
    }

    .pass-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 48px 60px;
      min-width: 280px;
    }

    .qr-img     { width: 220px; height: 220px; display: block; }
    .category   { font-weight: 800; font-size: 18px; text-transform: uppercase;
                  letter-spacing: 3px; margin-top: 20px; color: #111; }
    .seq-num    { font-family: 'Courier New', monospace; font-weight: 900;
                  font-size: 24px; color: #111; margin-top: 6px; }
    .date       { font-size: 13px; color: #555; margin-top: 8px; }

    .no-qr-box  { display: flex; flex-direction: column; align-items: center;
                  gap: 6px; margin-bottom: 8px; }
    .no-qr-icon { font-size: 56px; color: #d97706; line-height: 1; }
    .badge-label{ font-weight: 800; font-size: 15px; color: #92400e;
                  text-transform: uppercase; letter-spacing: 2px; }
    .no-qr-label{ font-size: 11px; color: #b45309; }

    @media print {
      @page { margin: 0; size: A4 portrait; }
      body  { margin: 0; }
      .pass-page {
        width: 100vw;
        height: 100vh;
        page-break-after: always;
        break-after: page;
      }
      .pass-page:last-of-type {
        page-break-after: avoid;
        break-after: avoid;
      }
    }
  </style>
</head>
<body>
  ${cardsHtml}
  <script>
    // Wait for QR images to load, then auto-print
    var imgs = document.querySelectorAll('img');
    var total = imgs.length;
    if (total === 0) {
      window.print();
    } else {
      var loaded = 0;
      function tryPrint() { if (++loaded >= total) window.print(); }
      imgs.forEach(function(img) {
        if (img.complete) { tryPrint(); }
        else { img.onload = tryPrint; img.onerror = tryPrint; }
      });
      // Safety fallback: print after 4 s regardless
      setTimeout(function() { window.print(); }, 4000);
    }
  <\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Pop-up blocked! Please allow pop-ups for this site and try again.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };
  // ─────────────────────────────────────────────────────────────────────────

  const handlePrintCards = async () => {
    const data = await fetchPassesForExport();
    if (data && data.length > 0) {
      setPassesData(data);
      setIsPrintViewOpen(true);
      openPrintWindow(data);
    }
  };

  const handleExportCsv = async () => {
    const data = await fetchPassesForExport();
    if (!data || data.length === 0) return;

    const headers = ['Pass Number', 'Sequence', 'Category', 'Status', 'Attendee Name', 'Attendee Email', 'Event Code', 'Event Name', 'Venue'];
    const rows = data.map((p) => [
      `"${p.passNumber || ''}"`,
      p.sequenceNumber || '',
      `"${p.category || 'STUDENT'}"`,
      `"${p.status || ''}"`,
      `"${p.attendeeName || ''}"`,
      `"${p.attendeeEmail || ''}"`,
      `"${p.eventCode || ''}"`,
      `"${p.eventName || ''}"`,
      `"${p.venue || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `passes_${event.eventCode}_${categoryFilter.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${data.length} passes to CSV`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-600 text-white rounded-lg shadow-sm">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Bulk Download Passes</h2>
                <p className="text-xs text-gray-500">
                  Event: <span className="font-semibold text-purple-700">{event.name}</span> ({event.eventCode})
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

          {/* Form Filter Options */}
          <div className="p-6 space-y-4 text-xs text-gray-700">
            {/* Category Filter */}
            <div>
              <label className="block font-semibold text-gray-800 mb-1.5">Pass Category</label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategoryFilter(cat.value)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${categoryFilter === cat.value
                      ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <span>{cat.label}</span>
                    {cat.isNoQr && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                        No QR
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block font-semibold text-gray-800 mb-1.5">Pass Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">All Statuses (Active, Available, Revoked)</option>
                <option value="NOT_ACTIVATED">Unactivated Passes Only (Available)</option>
                <option value="ACTIVATED">Activated Passes Only (Claimed)</option>
                <option value="REVOKED">Revoked Passes Only</option>
              </select>
            </div>

            {/* Sequence Range Toggle */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-3">
              <label className="flex items-center gap-2 font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useRange}
                  onChange={(e) => setUseRange(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Filter by Pass Sequence Number Range</span>
              </label>

              {useRange && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">From Sequence #</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 1"
                      value={fromSeq}
                      onChange={(e) => setFromSeq(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">To Sequence #</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 50"
                      value={toSeq}
                      onChange={(e) => setToSeq(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Permitted Day Filter */}
            {eventDays.length > 0 && (
              <div>
                <label className="block font-semibold text-gray-800 mb-1.5">Permitted Event Day</label>
                <select
                  value={dayId}
                  onChange={(e) => setDayId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">All Days</option>
                  {eventDays.map((d) => (
                    <option key={d.id} value={d.id}>
                      Day {d.dayNumber}: {d.eventDate || d.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Format explanation */}
            {(() => {
              const selectedCatObj = categoryOptions.find((c) => c.value === categoryFilter);
              const isSelectedCategoryNoQr = selectedCatObj?.isNoQr || categoryFilter?.toUpperCase() === 'VIP';
              return (
                <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${isSelectedCategoryNoQr
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-purple-50 border-purple-200 text-purple-900'
                  }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {isSelectedCategoryNoQr ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        Print-Ready Walk-In Badges (No QR Code)
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 text-purple-700" />
                        Print-Ready Event Passes &amp; Badges — 1 QR per page
                      </>
                    )}
                  </div>
                  <p className={isSelectedCategoryNoQr ? 'text-amber-800' : 'text-purple-700'}>
                    {isSelectedCategoryNoQr
                      ? 'VIP and walk-in passes do not contain QR codes. Badges will be generated with clear serial numbers and official security authentication.'
                      : 'Opens a new print window with exactly 1 QR pass per page. 200 passes = 200 PDF pages.'}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Actions */}
          <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
            <button
              onClick={handleExportCsv}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 transition shadow-sm disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              Export CSV
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePrintCards}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Fetching Passes...
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    Print / Download PDF Passes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Screen-only preview (non-printable) */}
      {isPrintViewOpen && (
        <div className="fixed inset-0 z-[60] bg-white overflow-y-auto p-6 text-gray-900">
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-gray-900 text-white rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">Print Preview ({passesData.length} Passes)</h3>
              <p className="text-xs text-gray-400">
                A new print tab was opened automatically — 1 QR per page. If it didn&apos;t open, click &quot;Re-open Print Window&quot;.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => openPrintWindow(passesData)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
              >
                <Printer className="w-4 h-4" /> Re-open Print Window
              </button>
              <button
                onClick={() => setIsPrintViewOpen(false)}
                className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>

          {/* Screen preview grid – visual reference only */}
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {passesData.map((p, idx) => {
              const noQr = isNoQrPass(p);
              return (
                <div
                  key={p.passId || idx}
                  className="rounded-xl p-4 bg-white flex flex-col items-center justify-center text-center"
                  style={{ minHeight: '220px' }}
                >
                  {noQr ? (
                    <div className="flex flex-col items-center gap-1">
                      <ShieldCheck className="w-10 h-10 text-amber-500" />
                      <span className="font-bold text-[10px] text-amber-800 uppercase tracking-wide">No QR</span>
                    </div>
                  ) : (
                    <img
                      src={getQrUrl(p)}
                      alt={`QR for ${p.passNumber}`}
                      className="w-24 h-24 object-contain mx-auto"
                      loading="lazy"
                    />
                  )}
                  <div className="mt-2 font-bold text-xs text-black uppercase tracking-widest">{p.category || 'PASS'}</div>
                    <div className="font-mono font-black text-xs text-black">
                      {p.sequenceNumber ? String(p.sequenceNumber).padStart(4, '0') : p.passNumber?.split('-')?.pop()}
                    </div>
                  </div>
                  );
            })}
                </div>
                        </div>
          )
                    }
        </>
      );
};

      export default BulkDownloadPassesModal;
