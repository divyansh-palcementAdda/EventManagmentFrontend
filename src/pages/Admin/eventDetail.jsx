import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PassEmailTemplate from '../../Components/emailPass/mailPass';
import { useParams, useNavigate } from 'react-router-dom';
import eventsService from '../../Api-Services/eventsService';
import passService from '../../Api-Services/passService';
import categoryService from '../../Api-Services/categoryService';
import passAllotmentService from '../../Api-Services/passAllotmentService';
import EventCategoriesCard from '../../Components/eventCategories/EventCategoriesCard';
import BulkDownloadPassesModal from '../../Components/Modals/passes/BulkDownloadPassesModal';
import BulkFullPassDownloadModal from '../../Components/Modals/passes/BulkFullPassDownloadModal';
import BulkDownloadPass, { backpass } from '../../Components/emailPass/bulkDownloadpass';
import BulkActivationModal from '../../Components/Modals/passes/BulkActivationModal';
import ManagePassValidityModal from '../../Components/Modals/passes/ManagePassValidityModal';
import GatekeeperManagementModal from '../../Components/Modals/gatekeepers/GatekeeperManagementModal';
import AllotPassesModal from '../../Components/Modals/passes/AllotPassesModal';
import PassAllotmentAnalyticsModal from '../../Components/Modals/passes/PassAllotmentAnalyticsModal';
import useScrollLock from '../../hooks/useScrollLock';
import { generatePassesPdf, openPassesPdfPreview } from '../../utils/passPdfGenerator';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  Ticket,
  Shield,
  ShieldCheck,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Printer,
  QrCode,
  Download,
  AlertTriangle,
  Loader2,
  X,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  Check,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Eye,
  ArrowUpDown,
  SlidersHorizontal,
  Tags,
  Smartphone,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';

const getCategoryCardStyle = (code, index, isSelected) => {
  const upper = (code || '').toUpperCase();
  if (isSelected) {
    return {
      container: 'border-purple-600 bg-purple-50/90 shadow-md ring-2 ring-purple-500/25 -translate-y-0.5',
      badge: 'bg-purple-600 text-white',
      iconBox: 'bg-purple-600 text-white',
    };
  }

  if (upper.includes('VIP')) {
    return {
      container: 'border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50/20 hover:shadow-sm',
      badge: 'bg-amber-100 text-amber-800 border border-amber-200',
      iconBox: 'bg-amber-100 text-amber-700',
    };
  }
  if (upper.includes('STUDENT')) {
    return {
      container: 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-sm',
      badge: 'bg-blue-100 text-blue-800 border border-blue-200',
      iconBox: 'bg-blue-100 text-blue-700',
    };
  }
  if (upper.includes('STAFF') || upper.includes('CREW')) {
    return {
      container: 'border-gray-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/20 hover:shadow-sm',
      badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      iconBox: 'bg-emerald-100 text-emerald-700',
    };
  }
  if (upper.includes('PRESS') || upper.includes('MEDIA')) {
    return {
      container: 'border-gray-200 bg-white hover:border-rose-400 hover:bg-rose-50/20 hover:shadow-sm',
      badge: 'bg-rose-100 text-rose-800 border border-rose-200',
      iconBox: 'bg-rose-100 text-rose-700',
    };
  }

  const palettes = [
    {
      container: 'border-gray-200 bg-white hover:border-purple-400 hover:bg-purple-50/20 hover:shadow-sm',
      badge: 'bg-purple-100 text-purple-800 border border-purple-200',
      iconBox: 'bg-purple-100 text-purple-700',
    },
    {
      container: 'border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/20 hover:shadow-sm',
      badge: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      iconBox: 'bg-indigo-100 text-indigo-700',
    },
    {
      container: 'border-gray-200 bg-white hover:border-teal-400 hover:bg-teal-50/20 hover:shadow-sm',
      badge: 'bg-teal-100 text-teal-800 border border-teal-200',
      iconBox: 'bg-teal-100 text-teal-700',
    },
  ];
  return palettes[index % palettes.length];
};

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Event & Days State
  const [event, setEvent] = useState(null);
  const [eventDays, setEventDays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live Statistics State
  const [passStats, setPassStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [gatekeeperCount, setGatekeeperCount] = useState(0);

  // Passes Pagination & Filtering State (Server-Side)
  const [passes, setPasses] = useState([]);
  const [passesLoading, setPassesLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [checkInFilter, setCheckInFilter] = useState('ALL');
  const [dayFilter, setDayFilter] = useState('ALL');
  const [fromSeqFilter, setFromSeqFilter] = useState('');
  const [toSeqFilter, setToSeqFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('sequenceNumber');
  const [sortDir, setSortDir] = useState('asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const isPassTableFiltered =
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    Boolean(debouncedSearch?.trim()) ||
    checkInFilter !== 'ALL' ||
    dayFilter !== 'ALL' ||
    Boolean(fromSeqFilter) ||
    Boolean(toSeqFilter);

  const resetAllPassFilters = () => {
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
    setDebouncedSearch('');
    setCheckInFilter('ALL');
    setDayFilter('ALL');
    setFromSeqFilter('');
    setToSeqFilter('');
    setPage(0);
  };

  // Selection for bulk actions
  const [selectedPassMap, setSelectedPassMap] = useState({});

  // Pass Generation Modal State
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [batchSize, setBatchSize] = useState(5);
  const [genCategory, setGenCategory] = useState('STUDENT');
  const [selectedGenDayIds, setSelectedGenDayIds] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [newlyGeneratedPasses, setNewlyGeneratedPasses] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);

  // Modals State
  const [isBulkDownloadOpen, setIsBulkDownloadOpen] = useState(false);
  const [isBulkFullPassModalOpen, setIsBulkFullPassModalOpen] = useState(false);
  const [isBulkActivateOpen, setIsBulkActivateOpen] = useState(false);
  const [isValidityModalOpen, setIsValidityModalOpen] = useState(false);
  const [singlePassForValidity, setSinglePassForValidity] = useState(null);
  const [isGatekeeperModalOpen, setIsGatekeeperModalOpen] = useState(false);

  // Pass Allotments State
  const [allotmentsSummary, setAllotmentsSummary] = useState(null);
  const [allotmentsLoading, setAllotmentsLoading] = useState(false);
  const [isAllotModalOpen, setIsAllotModalOpen] = useState(false);
  const [expandedRecipients, setExpandedRecipients] = useState({});
  const [analyticsModalState, setAnalyticsModalState] = useState({
    isOpen: false,
    allottedTo: '',
    categoryCode: '',
    categoryName: '',
  });

  // Printable Pass Modal
  const [activePrintPass, setActivePrintPass] = useState(null);

  // Full Pass (Email Template) Modal
  const [activeFullPass, setActiveFullPass] = useState(null);

  const checkIsNoQr = (p) => {
    if (!p) return false;
    if (p.qrRequired === false) return true;
    if (p.activationMode === 'NO_QR_WALK_IN') return true;
    if (p.qrData === null || p.qrData === '') return true;
    const passCat = (
      typeof p.category === 'string'
        ? p.category
        : p.category?.name || p.categoryCode || p.categoryName || ''
    ).toUpperCase();
    if (passCat === 'VIP' || passCat.includes('VIP')) return true;
    const cat = availableCategories.find(
      (c) => (c.categoryCode || c.passCategoryCode || c.code || '').toUpperCase() === passCat
    );
    if (cat && (cat.qrRequired === false || cat.activationMode === 'NO_QR_WALK_IN')) {
      return true;
    }
    return false;
  };

  const isNoQrActivePrintPass = useMemo(() => {
    return checkIsNoQr(activePrintPass);
  }, [activePrintPass, availableCategories]);

  const isNoQrActiveFullPass = useMemo(() => {
    return checkIsNoQr(activeFullPass);
  }, [activeFullPass, availableCategories]);

  const handlePrintSinglePass = (pass) => {
    if (!pass) return;
    const isNoQr = checkIsNoQr(pass);
    const qrUrl = isNoQr ? null : getQrImageUrl(pass.rawToken || pass.passNumber, event?.id || eventId);
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Pop-up blocked! Please allow pop-ups for this site.');
      return;
    }
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Pass ${pass.passNumber || ''}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #f3f4f6;
      font-family: Arial, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .screen-toolbar {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(17, 24, 39, 0.94);
      padding: 8px 16px;
      border-radius: 30px;
      color: #fff;
    }
    .screen-btn {
      border: none;
      background: #9333ea;
      color: white;
      font-weight: 700;
      font-size: 12px;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
    }
    .screen-btn-secondary { background: rgba(255, 255, 255, 0.15); }
    .pass-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 24px;
      max-width: 320px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .title { font-size: 15px; font-weight: 800; color: #111; margin-top: 8px; }
    .venue { font-size: 11px; color: #6b7280; margin-top: 4px; }
    .qr-box { margin: 16px auto; width: 180px; height: 180px; }
    .qr-img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .pass-num { font-family: monospace; font-size: 18px; font-weight: 900; color: #6b21a8; letter-spacing: 1px; }
    .badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #f3e8ff; color: #7e22ce; margin-top: 6px; }
    .attendee { margin-top: 12px; font-size: 12px; color: #374151; background: #faf5ff; padding: 6px; border-radius: 6px; }
    @media print {
      @page { size: auto; margin: 0; }
      .screen-toolbar { display: none !important; }
      html, body { background: transparent !important; margin: 0 !important; padding: 0 !important; }
      .pass-container { min-height: 0 !important; height: auto !important; padding: 0 !important; background: transparent !important; display: block !important; }
      .card { border: none !important; box-shadow: none !important; margin: 0 auto !important; max-width: 100% !important; page-break-after: avoid !important; break-after: avoid !important; }
    }
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <button class="screen-btn" onclick="window.print()">&#128424; Print Pass</button>
    <button class="screen-btn screen-btn-secondary" onclick="window.close()">Close</button>
  </div>
  <div class="pass-container">
    <div class="card">
      <div style="font-size: 9px; font-weight: 900; letter-spacing: 2px; color: #7e22ce;">OFFICIAL EVENT PASS</div>
      <div class="title">${event?.name || ''}</div>
      <div class="venue">${event?.venue || ''}</div>
      ${qrUrl ? `<div class="qr-box"><img src="${qrUrl}" alt="QR" class="qr-img"/></div>` : `<div style="padding: 24px; color: #b45309; font-weight: 700; font-size: 12px;">WALK-IN BADGE (NO QR)</div>`}
      <div class="pass-num">${pass.passNumber}</div>
      <div class="badge">${(pass.category || 'GENERAL').toUpperCase()} PASS</div>
      ${pass.attendeeName ? `<div class="attendee">Attendee: <strong>${pass.attendeeName}</strong></div>` : ''}
    </div>
  </div>
  <script>
    var img = document.querySelector('.qr-img');
    if (img && img.complete) setTimeout(function(){ window.print(); }, 350);
    else if (img) img.onload = function(){ setTimeout(function(){ window.print(); }, 350); };
    else setTimeout(function(){ window.print(); }, 350);
  <\/script>
</body>
</html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const handlePrintSingleFullPass = async (p) => {
    if (!p) return;
    try {
      await openPassesPdfPreview([p], event, { autoPrint: false });
      toast.success(`Opened pass-only PDF for ${p.passNumber}`);
      return;
    } catch (err) {
      console.warn('Direct PDF preview failed, falling back to window print:', err);
    }

    const isNoQr = checkIsNoQr(p);
    const qrUrl = isNoQr ? null : getQrImageUrl(p.rawToken || p.passNumber, event?.id || eventId);
    const seq = p.sequenceNumber ? String(p.sequenceNumber).padStart(4, '0') : p.passNumber?.split('-')?.pop() || '';
    const seqBadge = seq ? (seq.startsWith('#') ? seq : `#${seq}`) : '';
    const cat = (p.categoryName || p.category || p.categoryCode || 'GENERAL').toUpperCase();
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Pop-up blocked! Please allow pop-ups for this site.');
      return;
    }
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Pass ${p.passNumber || ''}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #f3f4f6;
      font-family: Arial, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .screen-toolbar {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(17, 24, 39, 0.94);
      backdrop-filter: blur(10px);
      padding: 8px 16px;
      border-radius: 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      color: #fff;
    }
    .mode-badge {
      font-size: 10px;
      font-weight: 800;
      background: #10b981;
      color: #064e3b;
      padding: 3px 8px;
      border-radius: 12px;
    }
    .screen-btn {
      border: none;
      background: #9333ea;
      color: white;
      font-weight: 700;
      font-size: 12px;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .screen-btn-mode {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
    }
    .screen-btn-download {
      background: #059669;
    }
    .screen-btn-download:hover { background: #047857; }
    .screen-btn-secondary {
      background: rgba(255, 255, 255, 0.12);
    }
    .pass-page {
      width: 100%;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px 16px;
    }
    .bulk-pass-card {
      width: 100%;
      max-width: 600px;
      background: #ffffff;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      border-radius: 8px;
      position: relative;
    }
    .pass-back { position: relative; width: 100%; line-height: 0; }
    .pass-img { width: 100%; height: auto; display: block; object-fit: cover; }
    .qr-container {
      position: absolute;
      top: 20%;
      right: 9.5%;
      width: 15%;
      aspect-ratio: 1 / 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .serial-badge {
      position: absolute;
      bottom: 17%;
      right: 5.5%;
      width: 22%;
      height: 9%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .serial-badge span {
      font-size: 11px;
      font-weight: 700;
      color: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      letter-spacing: 1.5px;
      white-space: nowrap;
      text-transform: uppercase;
    }
    .category-badge {
      position: absolute;
      bottom: 26%;
      right: 5.5%;
      width: 22%;
      height: 9%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .category-badge span {
      font-size: 11px;
      font-weight: 700;
      color: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      letter-spacing: 1.5px;
      white-space: nowrap;
      text-transform: uppercase;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }
    .left-seq-strip {
      position: absolute;
      bottom: 5%;
      left: -2%;
      width: 5.5%;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(-90deg);
      transform-origin: center center;
    }
    .left-seq-strip span {
      font-size: 10px;
      font-weight: 700;
      color: #121212;
      font-family: Arial, Helvetica, sans-serif;
      letter-spacing: 3.5px;
      line-height: 2;
      white-space: nowrap;
      margin-top: 9px;
    }
  </style>
  <style id="dynamicPrintStyle">
    @media print {
      @page { size: 182.6mm 68.6mm; margin: 0; }
      *, *::before, *::after { box-sizing: border-box !important; }
      html, body { width: 182.6mm !important; height: auto !important; margin: 0 !important; padding: 0 !important; background: transparent !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .screen-toolbar { display: none !important; }
      .pass-page { width: 182.6mm !important; height: 68.6mm !important; max-height: 68.6mm !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; display: block !important; position: relative !important; overflow: hidden !important; page-break-after: avoid !important; break-after: avoid !important; }
      .bulk-pass-card { width: 182.6mm !important; height: 68.6mm !important; max-width: 182.6mm !important; max-height: 68.6mm !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important; border: none !important; background: transparent !important; overflow: hidden !important; position: relative !important; }
      .pass-back { width: 182.6mm !important; height: 68.6mm !important; margin: 0 !important; padding: 0 !important; position: relative !important; }
      .pass-img { width: 182.6mm !important; height: 68.6mm !important; object-fit: fill !important; display: block !important; }
      .serial-badge span, .category-badge span { font-size: 13px !important; }
      .left-seq-strip span { font-size: 11px !important; }
    }
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="font-size:13px; font-weight:700;">&#128424; Pass ${p.passNumber}</span>
      <span class="mode-badge" id="modeBadge">PASS ONLY (NO BACKGROUND)</span>
    </div>
    <div style="display:flex; align-items:center; gap:8px;">
      <button class="screen-btn screen-btn-download" onclick="downloadViaCanvasPdf()">📥 Download Pass-Only PDF</button>
      <button class="screen-btn" onclick="window.print()">&#128424; Print / Save as PDF</button>
      <button class="screen-btn screen-btn-mode" id="btnToggleMode" onclick="togglePrintMode()">Switch to A4 Landscape</button>
      <button class="screen-btn screen-btn-secondary" onclick="window.close()">Close</button>
    </div>
  </div>
  <div class="pass-page">
    <div class="bulk-pass-card">
      <div class="pass-back">
        <img src="${backpass}" alt="Pass Back" class="pass-img" />
        <div class="qr-container">
          ${qrUrl ? `<img src="${qrUrl}" alt="QR" class="qr-img" />` : `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:8px;font-weight:800;color:#92400e;background-color:#fef3c7;border:1.5px dashed #f59e0b;border-radius:4px;"><span>BADGE</span><span style="font-size:6px;font-weight:600;color:#b45309;">NO QR</span></div>`}
        </div>
        ${seqBadge ? `<div class="serial-badge"><span>${seqBadge}</span></div>` : ''}
        ${cat ? `<div class="category-badge"><span>${cat}</span></div>` : ''}
        ${seqBadge ? `<div class="left-seq-strip"><span>${seqBadge}</span></div>` : ''}
      </div>
    </div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script>
    var currentMode = 'pass-only';
    function setPrintMode(mode) {
      currentMode = mode;
      var styleEl = document.getElementById('dynamicPrintStyle');
      var badge = document.getElementById('modeBadge');
      var btn = document.getElementById('btnToggleMode');
      if (mode === 'a4') {
        badge.textContent = 'A4 LANDSCAPE';
        btn.textContent = 'Switch to Pass Only (No Background)';
        styleEl.innerHTML = '@media print { @page { size: landscape; margin: 0; } html, body { width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; background: transparent !important; } .screen-toolbar { display: none !important; } .pass-page { width: 100% !important; height: 100vh !important; max-height: 100vh !important; min-height: 0 !important; margin: 0 auto !important; padding: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; } .bulk-pass-card { width: 100% !important; max-width: 98% !important; height: auto !important; margin: 0 auto !important; box-shadow: none !important; border-radius: 0 !important; border: none !important; background: transparent !important; } .pass-back { width: 100% !important; height: auto !important; position: relative !important; } .pass-img { width: 100% !important; height: auto !important; max-height: 98vh !important; object-fit: contain !important; display: block !important; margin: 0 auto !important; } .serial-badge span, .category-badge span { font-size: 13px !important; } .left-seq-strip span { font-size: 11px !important; } }';
      } else {
        badge.textContent = 'PASS ONLY (NO BACKGROUND)';
        btn.textContent = 'Switch to A4 Landscape';
        styleEl.innerHTML = '@media print { @page { size: 182.6mm 68.6mm; margin: 0; } *, *::before, *::after { box-sizing: border-box !important; } html, body { width: 182.6mm !important; height: auto !important; margin: 0 !important; padding: 0 !important; background: transparent !important; } .screen-toolbar { display: none !important; } .pass-page { width: 182.6mm !important; height: 68.6mm !important; max-height: 68.6mm !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; display: block !important; position: relative !important; overflow: hidden !important; page-break-after: avoid !important; break-after: avoid !important; } .bulk-pass-card { width: 182.6mm !important; height: 68.6mm !important; max-width: 182.6mm !important; max-height: 68.6mm !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important; border: none !important; background: transparent !important; overflow: hidden !important; position: relative !important; } .pass-back { width: 182.6mm !important; height: 68.6mm !important; margin: 0 !important; padding: 0 !important; position: relative !important; } .pass-img { width: 182.6mm !important; height: 68.6mm !important; object-fit: fill !important; display: block !important; } .serial-badge span, .category-badge span { font-size: 13px !important; } .left-seq-strip span { font-size: 11px !important; } }';
      }
    }
    function togglePrintMode() {
      setPrintMode(currentMode === 'pass-only' ? 'a4' : 'pass-only');
    }
    function downloadViaCanvasPdf() {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('PDF library is loading, please try again in a few seconds.');
        return;
      }
      var card = document.querySelector('.bulk-pass-card');
      if (!card) return;
      var bgImg = card.querySelector('.pass-img');
      var qrImg = card.querySelector('.qr-img');
      var catSpan = card.querySelector('.category-badge span');
      var seqSpan = card.querySelector('.serial-badge span');
      var leftSpan = card.querySelector('.left-seq-strip span');

      var canvas = document.createElement('canvas');
      canvas.width = 1826;
      canvas.height = 686;
      var ctx = canvas.getContext('2d');
      if (bgImg && bgImg.naturalWidth) {
        ctx.drawImage(bgImg, 0, 0, 1826, 686);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1826, 686);
      }

      var qrBoxWidth = Math.round(1826 * 0.15);
      var qrBoxHeight = qrBoxWidth;
      var qrBoxX = Math.round(1826 - (1826 * 0.095) - qrBoxWidth);
      var qrBoxY = Math.round(686 * 0.20);
      if (qrImg && qrImg.naturalWidth) {
        ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight);
      }

      var catBoxWidth = Math.round(1826 * 0.22);
      var catBoxHeight = Math.round(686 * 0.09);
      var catBoxX = Math.round(1826 - (1826 * 0.055) - catBoxWidth);
      var catBoxY = Math.round(686 * (1.0 - 0.26 - 0.09));
      if (catSpan && catSpan.textContent) {
        ctx.save();
        ctx.font = 'bold 32px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(catSpan.textContent.trim(), catBoxX + catBoxWidth / 2, catBoxY + catBoxHeight / 2);
        ctx.restore();
      }

      var serialBoxWidth = catBoxWidth;
      var serialBoxHeight = catBoxHeight;
      var serialBoxX = catBoxX;
      var serialBoxY = Math.round(686 * (1.0 - 0.17 - 0.09));
      if (seqSpan && seqSpan.textContent) {
        ctx.save();
        ctx.font = 'bold 32px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(seqSpan.textContent.trim(), serialBoxX + serialBoxWidth / 2, serialBoxY + serialBoxHeight / 2);
        ctx.restore();
      }

      if (leftSpan && leftSpan.textContent) {
        ctx.save();
        ctx.translate(34, 620);
        ctx.rotate(-Math.PI / 2);
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.fillStyle = '#121212';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(leftSpan.textContent.trim(), 0, 0);
        ctx.restore();
      }

      var doc = new window.jspdf.jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [68.6, 182.6],
        compress: true
      });
      var dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(dataUrl, 'JPEG', 0, 0, 182.6, 68.6);
      doc.save('Pass_${p.passNumber}.pdf');
    }

    var img = document.querySelector('.pass-img');
    if (img && !img.complete) {
      img.onload = function() { /* ready */ };
    }
  <\/script>
</body>
</html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  // Dynamic category cards list for interactive filter cards
  const categoryCardsList = useMemo(() => {
    if (availableCategories && availableCategories.length > 0) {
      return availableCategories.map((c) => ({
        id: c.id || c.categoryCode || c.code,
        code: c.categoryCode || c.passCategoryCode || c.code,
        name: c.categoryName || c.passCategoryName || c.name || c.categoryCode || c.code,
        description: c.description || '',
        activationMode: c.activationMode || 'SELF_SERVICE',
        identityPolicy: c.identityPolicy || 'COLLECT_IDENTITY',
        qrRequired: c.qrRequired ?? true,
        passLimit: c.passLimit ?? null,
        enabled: c.enabled ?? c.isActive ?? true,
      }));
    }
    return [
      {
        id: 'STUDENT',
        code: 'STUDENT',
        name: 'Student Pass',
        activationMode: 'SELF_SERVICE',
        identityPolicy: 'COLLECT_IDENTITY',
        qrRequired: true,
        enabled: true,
      },
      {
        id: 'OTHER',
        code: 'OTHER',
        name: 'General / Other',
        activationMode: 'SELF_SERVICE',
        identityPolicy: 'NO_IDENTITY',
        qrRequired: true,
        enabled: true,
      },
    ];
  }, [availableCategories]);

  // Pass action modal (per-row)
  const [passActionModalId, setPassActionModalId] = useState(null);

  // Revoke Modal
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [passToRevoke, setPassToRevoke] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');



  // 300ms Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0); // Reset to page 0 on search input change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial Data Fetch
  useEffect(() => {
    fetchEventDetails();
    fetchEventDays();
    fetchPassStats();
    fetchGatekeepers();
    fetchConfiguredCategories();
    fetchAllotmentsSummary();
  }, [eventId]);

  // Fetch Passes whenever filters, pagination, or sorting change
  useEffect(() => {
    fetchPasses();
  }, [
    eventId,
    page,
    pageSize,
    debouncedSearch,
    statusFilter,
    checkInFilter,
    dayFilter,
    fromSeqFilter,
    toSeqFilter,
    categoryFilter,
    sortBy,
    sortDir,
  ]);

  // Update Live Statistics counters whenever table filters change
  useEffect(() => {
    fetchPassStats();
  }, [
    eventId,
    debouncedSearch,
    statusFilter,
    checkInFilter,
    dayFilter,
    fromSeqFilter,
    toSeqFilter,
    categoryFilter,
  ]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const response = await eventsService.getEventById(eventId);
      setEvent(response.data);
    } catch (error) {
      toast.error('Failed to fetch event details');
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDays = async () => {
    try {
      const response = await eventsService.getEventDays(eventId);
      setEventDays(response.data || []);
    } catch (error) {
      console.error('Error fetching event days:', error);
    }
  };

  const fetchPassStats = async () => {
    setStatsLoading(true);
    try {
      const params = {};
      if (debouncedSearch && debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter && categoryFilter !== 'ALL') params.category = categoryFilter;
      if (checkInFilter && checkInFilter !== 'ALL') params.checkInStatus = checkInFilter;
      if (dayFilter && dayFilter !== 'ALL') params.eventDayId = dayFilter;
      if (fromSeqFilter && !isNaN(parseInt(fromSeqFilter, 10))) {
        params.fromSequence = parseInt(fromSeqFilter, 10);
      }
      if (toSeqFilter && !isNaN(parseInt(toSeqFilter, 10))) {
        params.toSequence = parseInt(toSeqFilter, 10);
      }

      const response = await passService.getPassStats(eventId, params);
      setPassStats(response.data);
    } catch (error) {
      console.error('Error fetching pass stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchConfiguredCategories = async () => {
    try {
      const res = await categoryService.getEventCategories(eventId, false);
      let cats = [];
      if (Array.isArray(res)) {
        cats = res;
      } else if (Array.isArray(res?.data)) {
        cats = res.data;
      } else if (Array.isArray(res?.data?.content)) {
        cats = res.data.content;
      } else if (Array.isArray(res?.content)) {
        cats = res.content;
      }
      setAvailableCategories(cats);
      if (cats.length > 0) {
        setGenCategory((prev) => {
          const exists = cats.some((c) => (c.categoryCode || c.passCategoryCode || c.code) === prev);
          return exists ? prev : (cats[0].categoryCode || cats[0].passCategoryCode || cats[0].code || 'STUDENT');
        });
      } else {
        setGenCategory('STUDENT');
      }
    } catch (err) {
      console.error('Failed to load categories for pass generation:', err);
      try {
        const fallbackRes = await categoryService.getCategories();
        let list = [];
        if (Array.isArray(fallbackRes)) list = fallbackRes;
        else if (Array.isArray(fallbackRes?.data)) list = fallbackRes.data;
        else if (Array.isArray(fallbackRes?.data?.content)) list = fallbackRes.data.content;
        setAvailableCategories(list);
        if (list.length > 0) {
          setGenCategory(list[0].categoryCode || list[0].code || 'STUDENT');
        }
      } catch (e) {
        setAvailableCategories([]);
        setGenCategory('STUDENT');
      }
    }
  };

  const fetchGatekeepers = async () => {
    try {
      const response = await eventsService.getGatekeepers(eventId);
      const list = response.data || [];
      setGatekeeperCount(list.length);
    } catch (error) {
      console.error('Error fetching gatekeepers:', error);
    }
  };

  const fetchPasses = async () => {
    setPassesLoading(true);
    try {
      const params = {
        page,
        size: pageSize,
        sortBy,
        sortDir,
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (checkInFilter !== 'ALL') params.checkInStatus = checkInFilter;
      if (dayFilter !== 'ALL') params.eventDayId = dayFilter;
      if (fromSeqFilter && !isNaN(parseInt(fromSeqFilter))) {
        params.fromSequence = parseInt(fromSeqFilter);
      }
      if (toSeqFilter && !isNaN(parseInt(toSeqFilter))) {
        params.toSequence = parseInt(toSeqFilter);
      }

      const response = await passService.getPassesByEvent(eventId, params);
      const data = response.data;
      setPasses(data?.content || []);
      setTotalPages(data?.page?.totalPages || 0);
      setTotalElements(data?.page?.totalElements || 0);
    } catch (error) {
      console.error('Error fetching passes:', error);
      toast.error('Failed to fetch passes');
    } finally {
      setPassesLoading(false);
    }
  };

  const fetchAllotmentsSummary = useCallback(async () => {
    if (!eventId) return;
    setAllotmentsLoading(true);
    try {
      const res = await passAllotmentService.getAllotmentsSummary(eventId);
      const data = res?.data?.overallStats ? res.data : (res?.data !== undefined ? res.data : res);
      setAllotmentsSummary(data);
    } catch (error) {
      console.error('Error fetching pass allotments summary:', error);
    } finally {
      setAllotmentsLoading(false);
    }
  }, [eventId]);

  const toggleRecipientExpand = (recipientName) => {
    setExpandedRecipients((prev) => ({
      ...prev,
      [recipientName]: !prev[recipientName],
    }));
  };

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        fetchEventDetails(),
        fetchEventDays(),
        fetchPasses(),
        fetchPassStats(),
        fetchGatekeepers(),
        fetchConfiguredCategories(),
        fetchAllotmentsSummary(),
      ]);
      toast.success('Event data refreshed!');
    } catch (err) {
      toast.error('Failed to refresh data');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await eventsService.updateEventStatus(eventId, newStatus);
      toast.success(`Event status updated to ${newStatus}`);
      fetchEventDetails();
    } catch (err) {
      toast.error('Failed to update event status');
    }
  };

  const handleGeneratePasses = async (e) => {
    e.preventDefault();
    const catConfig = availableCategories.find(
      (c) => (c.categoryCode || c.passCategoryCode || c.code) === genCategory
    );
    if (batchSize < 1 || batchSize > 500) {
      toast.error('Batch size must be between 1 and 500');
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        eventId,
        batchSize: parseInt(batchSize),
        categoryCode: genCategory,
        eventCategoryId: catConfig?.id || null,
        category: (genCategory === 'STUDENT' || genCategory === 'OTHER') ? genCategory : 'OTHER',
        validDayIds: selectedGenDayIds.length > 0 ? selectedGenDayIds : null,
      };

      const response = await passService.generatePasses(payload);
      const generated = response.data || [];
      setNewlyGeneratedPasses(generated);
      toast.success(`Successfully generated ${generated.length} passes!`);
      fetchPasses();
      fetchPassStats();
      fetchEventDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to generate passes');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokePass = async () => {
    if (!passToRevoke) return;
    try {
      await passService.revokePass(passToRevoke.id, revokeReason);
      toast.success('Pass revoked successfully');
      setRevokeModalOpen(false);
      setPassToRevoke(null);
      setRevokeReason('');
      fetchPasses();
      fetchPassStats();
    } catch (err) {
      toast.error(err.message || 'Failed to revoke pass');
    }
  };

  // Row selection helpers
  const selectedPassesList = useMemo(() => {
    return Object.values(selectedPassMap);
  }, [selectedPassMap]);

  const toggleSelectPass = (pass) => {
    setSelectedPassMap((prev) => {
      const copy = { ...prev };
      if (copy[pass.id]) {
        delete copy[pass.id];
      } else {
        copy[pass.id] = pass;
      }
      return copy;
    });
  };

  const toggleSelectAllOnPage = () => {
    const allSelectedOnPage = passes.length > 0 && passes.every((p) => !!selectedPassMap[p.id]);
    if (allSelectedOnPage) {
      setSelectedPassMap((prev) => {
        const copy = { ...prev };
        passes.forEach((p) => delete copy[p.id]);
        return copy;
      });
    } else {
      setSelectedPassMap((prev) => {
        const copy = { ...prev };
        passes.forEach((p) => {
          copy[p.id] = p;
        });
        return copy;
      });
    }
  };

  const clearSelection = () => {
    setSelectedPassMap({});
  };

  const handleOpenValidityForSingle = (pass) => {
    setSinglePassForValidity(pass);
    setIsValidityModalOpen(true);
  };

  const handleOpenValidityBulk = () => {
    setSinglePassForValidity(null);
    setIsValidityModalOpen(true);
  };

  const toggleGenDaySelection = (dayId) => {
    setSelectedGenDayIds((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      PUBLISHED: 'bg-purple-100 text-purple-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-700'
          }`}
      >
        {status}
      </span>
    );
  };

  const getPassStatusBadge = (status) => {
    const statusStyles = {
      NOT_ACTIVATED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      ACTIVATED: 'bg-green-50 text-green-700 border-green-200',
      REVOKED: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-semibold border ${statusStyles[status] || 'bg-gray-50 text-gray-700 border-gray-200'
          }`}
      >
        {status?.replace('_', ' ')}
      </span>
    );
  };

  // QR Code URL helper
  const getQrImageUrl = (tokenOrNumber) => {
    const activationUrl = `${window.location.origin}/activate/${encodeURIComponent(tokenOrNumber)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      activationUrl
    )}`;
  };

  // Lock body scroll whenever any inline modal is open
  useScrollLock(isGenModalOpen);
  useScrollLock(!!activePrintPass);
  useScrollLock(revokeModalOpen);
  useScrollLock(!!activeFullPass);
  useScrollLock(!!passActionModalId);
  useScrollLock(isBulkFullPassModalOpen);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-10 w-10 text-purple-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center py-12">
        <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
        <button
          onClick={() => navigate('/admin/events')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/events')}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition shadow-sm shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{event.name}</h1>
              <span className="font-mono text-xs sm:text-sm font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded shrink-0">
                {event.eventCode}
              </span>
              {getStatusBadge(event.status)}
            </div>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5 truncate">{event.description || 'No description provided'}</p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {event.status === 'DRAFT' && (
            <button
              onClick={() => handleStatusChange('ACTIVE')}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-green-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-green-700 transition shadow-sm"
            >
              Activate Event
            </button>
          )}
          {event.status === 'ACTIVE' && (
            <button
              onClick={() => handleStatusChange('COMPLETED')}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-gray-700 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-800 transition shadow-sm"
            >
              Complete Event
            </button>
          )}

          <button
            onClick={() => setIsGatekeeperModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-purple-50 border border-purple-200 text-purple-700 text-xs sm:text-sm font-bold rounded-lg hover:bg-purple-100 transition shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" /> Gatekeepers
            <span className="bg-purple-200 text-purple-900 text-xs px-1.5 py-0.2 rounded-full font-mono">
              {gatekeeperCount}
            </span>
          </button>

          <button
            onClick={() => navigate(`/admin/checkin/${event.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600 text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-purple-700 transition shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Gate Scanner
          </button>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-purple-600" /> Event Details
          </h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Pass Series:</span>
              <span className="font-mono font-semibold text-gray-900">{event.passSeriesCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Venue:</span>
              <span className="text-gray-900 font-medium truncate ml-2">{event.venue || 'TBD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Timezone:</span>
              <span className="text-gray-900">{event.timezone || 'UTC'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
              <span className="text-gray-500">Dates:</span>
              <span className="text-gray-900 font-medium">
                {formatDate(event.startsAt)} - {formatDate(event.endsAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Pass Capacity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-600" /> Pass Capacity
          </h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Maximum Allowed:</span>
              <span className="font-bold text-gray-900">{event.maximumPasses || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Generated:</span>
              <span className="font-bold text-purple-600">
                {event.totalPassesGenerated || totalElements}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Passes Remaining:</span>
              <span className="font-bold text-green-600">
                {Math.max(
                  0,
                  (event.maximumPasses || 0) - (event.totalPassesGenerated || totalElements)
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Check-in Policy:</span>
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                {event.checkInPolicy?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Event Days */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 space-y-3 sm:col-span-2 lg:col-span-1">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-600" /> Event Days ({eventDays.length})
          </h3>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {eventDays.length === 0 ? (
              <p className="text-xs text-gray-500">Single day event.</p>
            ) : (
              eventDays.map((day) => (
                <div
                  key={day.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs border border-gray-100"
                >
                  <span className="font-bold text-gray-800">Day {day.dayNumber}</span>
                  <span className="text-gray-600">{day.eventDate || day.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Pass Categories & Policies Card */}
      <EventCategoriesCard eventId={eventId} eventCode={event?.eventCode} onCategoriesUpdated={fetchConfiguredCategories} />

      {/* Pass Allotment Management Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 space-y-4 bg-gradient-to-r from-gray-50/50 to-purple-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Pass Allotment Management</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Internal Tracking
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Track passes allotted to representatives, real-time activation rates, and entry check-ins.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAllotModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Allot Passes
              </button>

              <button
                type="button"
                onClick={fetchAllotmentsSummary}
                className="p-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg transition shadow-sm"
                title="Refresh Allotments"
              >
                <RefreshCw className={`w-4 h-4 ${allotmentsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Top-Level Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pt-1">
            <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-gray-200 text-center shadow-xs">
              <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium uppercase tracking-wider block">
                Total Allotted
              </span>
              <div className="text-sm sm:text-lg font-black text-gray-900 font-mono mt-0.5">
                {allotmentsLoading ? '...' : (allotmentsSummary?.overallStats?.totalAllotted ?? 0)}
              </div>
            </div>

            <div className="p-2.5 sm:p-3 bg-purple-50/70 rounded-xl border border-purple-200 text-center shadow-xs">
              <span className="text-[10px] sm:text-[11px] text-purple-700 font-medium uppercase tracking-wider block">
                Total Activated
              </span>
              <div className="text-sm sm:text-lg font-black text-purple-800 font-mono mt-0.5">
                {allotmentsLoading ? '...' : (allotmentsSummary?.overallStats?.totalActivated ?? 0)}
              </div>
            </div>

            <div className="p-2.5 sm:p-3 bg-green-50/70 rounded-xl border border-green-200 text-center shadow-xs">
              <span className="text-[10px] sm:text-[11px] text-green-700 font-medium uppercase tracking-wider block">
                Total Available
              </span>
              <div className="text-sm sm:text-lg font-black text-green-800 font-mono mt-0.5">
                {allotmentsLoading ? '...' : (allotmentsSummary?.overallStats?.totalAvailable ?? 0)}
              </div>
            </div>

            <div className="p-2.5 sm:p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-center shadow-xs">
              <span className="text-[10px] sm:text-[11px] text-blue-700 font-medium uppercase tracking-wider block">
                Total Checked In
              </span>
              <div className="text-sm sm:text-lg font-black text-blue-800 font-mono mt-0.5">
                {allotmentsLoading ? '...' : (allotmentsSummary?.overallStats?.totalCheckedIn ?? 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="overflow-x-auto">
          {allotmentsLoading ? (
            <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              <span className="text-xs">Loading allotment records...</span>
            </div>
          ) : !allotmentsSummary?.recipients || allotmentsSummary.recipients.length === 0 ? (
            <div className="p-8 text-center text-gray-500 space-y-2">
              <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">No passes allotted yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Allot passes to representatives, student heads, or departments to monitor distribution and entry check-ins.
              </p>
              <button
                type="button"
                onClick={() => setIsAllotModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition mt-2"
              >
                <Plus className="w-3.5 h-3.5" /> Allot First Batch
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Allotted To</th>
                  <th className="py-3 px-4 text-center">Total Allotted</th>
                  <th className="py-3 px-4">Category Distribution</th>
                  <th className="py-3 px-4 text-center">Total Activated</th>
                  <th className="py-3 px-4 text-center">Available</th>
                  <th className="py-3 px-4 text-center">Checked In</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                {allotmentsSummary.recipients.map((recipient) => {
                  const isExpanded = !!expandedRecipients[recipient.allottedTo];
                  return (
                    <React.Fragment key={recipient.allottedTo}>
                      {/* Recipient Primary Row */}
                      <tr
                        className={`hover:bg-purple-50/30 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-purple-50/20' : ''
                        }`}
                        onClick={() => toggleRecipientExpand(recipient.allottedTo)}
                      >
                        {/* Allotted To */}
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                              {recipient.allottedTo.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-bold text-gray-900">{recipient.allottedTo}</span>
                          </div>
                        </td>

                        {/* Total Allotted */}
                        <td className="py-3 px-4 text-center font-mono font-bold text-gray-900">
                          {recipient.totalAllotted}
                        </td>

                        {/* Category Distribution */}
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px]">
                            {recipient.categoryDistribution || '—'}
                          </span>
                        </td>

                        {/* Total Activated */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                            {recipient.totalActivated}
                          </span>
                        </td>

                        {/* Available */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 font-mono">
                            {recipient.totalAvailable}
                          </span>
                        </td>

                        {/* Checked In */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                            {recipient.totalCheckedIn}
                          </span>
                        </td>

                        {/* Action - Expand Toggle */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRecipientExpand(recipient.allottedTo);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition"
                          >
                            <span>Categories ({recipient.categories?.length || 0})</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Category Breakdown Table */}
                      {isExpanded && (
                        <tr className="bg-gray-50/60">
                          <td colSpan="7" className="p-3 sm:p-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-xs">
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                                  Category Breakdown for {recipient.allottedTo}
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                      <th className="py-2 px-3">Category</th>
                                      <th className="py-2 px-3 text-center">Allotted</th>
                                      <th className="py-2 px-3 text-center">Activated</th>
                                      <th className="py-2 px-3 text-center">Available</th>
                                      <th className="py-2 px-3 text-center">Checked In</th>
                                      <th className="py-2 px-3 text-right">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 text-xs">
                                    {recipient.categories?.map((cat) => (
                                      <tr key={cat.categoryCode} className="hover:bg-purple-50/20">
                                        {/* Category */}
                                        <td className="py-2 px-3">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-gray-900">{cat.categoryName}</span>
                                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded">
                                              {cat.categoryCode}
                                            </span>
                                          </div>
                                        </td>

                                        {/* Allotted */}
                                        <td className="py-2 px-3 text-center font-mono font-bold text-gray-900">
                                          {cat.allotted}
                                        </td>

                                        {/* Activated */}
                                        <td className="py-2 px-3 text-center font-mono text-purple-700 font-semibold">
                                          {cat.activated}
                                        </td>

                                        {/* Available */}
                                        <td className="py-2 px-3 text-center font-mono text-green-700 font-semibold">
                                          {cat.available}
                                        </td>

                                        {/* Checked In */}
                                        <td className="py-2 px-3 text-center font-mono text-blue-700 font-semibold">
                                          {cat.checkedIn}
                                        </td>

                                        {/* Action: View Analytics */}
                                        <td className="py-2 px-3 text-right">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setAnalyticsModalState({
                                                isOpen: true,
                                                allottedTo: recipient.allottedTo,
                                                categoryCode: cat.categoryCode,
                                                categoryName: cat.categoryName,
                                              });
                                            }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition"
                                          >
                                            <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                                            <span>View Analytics</span>
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Enhanced Passes for This Event Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Section Header & Live Metric Chips */}
        <div className="p-4 sm:p-5 border-b border-gray-200 space-y-4 bg-gradient-to-r from-gray-50/50 to-purple-50/20">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Passes for this Event</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  {event.eventCode}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage unique pass identities, multi-day validity rules, bulk downloads, and gate check-in status.
              </p>
            </div>

            {/* Primary Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewlyGeneratedPasses([]);
                  if (availableCategories.length > 0) {
                    const exists = availableCategories.some(
                      (c) => (c.categoryCode || c.passCategoryCode || c.code) === genCategory
                    );
                    if (!exists) {
                      const first = availableCategories[0];
                      setGenCategory(first.categoryCode || first.passCategoryCode || first.code || 'STUDENT');
                    }
                  } else {
                    setGenCategory('STUDENT');
                  }
                  setIsGenModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Generate Passes
              </button>

              <button
                type="button"
                onClick={handleOpenValidityBulk}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold shadow-sm transition"
              >
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" /> Manage Validity
              </button>

              <button
                type="button"
                onClick={() => setIsBulkFullPassModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Bulk Full Pass (PDF)
              </button>

              <button
                type="button"
                onClick={() => setIsBulkDownloadOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" /> Bulk Download
              </button>

              <button
                type="button"
                onClick={() => setIsBulkActivateOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold shadow-sm transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" /> Bulk Activate
              </button>

              <button
                type="button"
                onClick={() => setIsGatekeeperModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold shadow-sm transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" /> Gatekeepers ({gatekeeperCount})
              </button>

              <button
                type="button"
                onClick={handleRefreshAll}
                className="p-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg transition shadow-sm"
                title="Refresh Passes & Statistics"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Live Statistics Counter Badges */}
          <div className="space-y-1.5 pt-1">
            {isPassTableFiltered && (
              <div className="flex items-center justify-between text-xs px-0.5">
                <span className="text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-purple-600" />
                  Showing counts for active table filters
                </span>
                <button
                  type="button"
                  onClick={resetAllPassFilters}
                  className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
              <div className="p-2 sm:p-2.5 bg-white rounded-xl border border-gray-200 text-center shadow-xs">
                <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
                  Total Passes {isPassTableFiltered && <span className="text-purple-600 font-bold">(Filtered)</span>}
                </span>
                <div className="text-sm sm:text-base font-black text-gray-900">
                  {statsLoading ? '...' : passStats?.totalPasses ?? totalElements}
                </div>
              </div>
              <div className="p-2 sm:p-2.5 bg-green-50/70 rounded-xl border border-green-200 text-center shadow-xs">
                <span className="text-[10px] sm:text-[11px] text-green-700 font-medium">Available</span>
                <div className="text-sm sm:text-base font-black text-green-800">
                  {statsLoading ? '...' : passStats?.availablePasses ?? 0}
                </div>
              </div>
              <div className="p-2 sm:p-2.5 bg-purple-50/70 rounded-xl border border-purple-200 text-center shadow-xs">
                <span className="text-[10px] sm:text-[11px] text-purple-700 font-medium">Activated</span>
                <div className="text-sm sm:text-base font-black text-purple-800">
                  {statsLoading ? '...' : passStats?.activatedPasses ?? 0}
                </div>
              </div>
              <div className="p-2 sm:p-2.5 bg-red-50/70 rounded-xl border border-red-200 text-center shadow-xs">
                <span className="text-[10px] sm:text-[11px] text-red-700 font-medium">Revoked</span>
                <div className="text-sm sm:text-base font-black text-red-800">
                  {statsLoading ? '...' : passStats?.revokedPasses ?? 0}
                </div>
              </div>
              <div className="p-2 sm:p-2.5 bg-purple-50/70 rounded-xl border border-purple-200 text-center shadow-xs col-span-2 sm:col-span-3 lg:col-span-1">
                <span className="text-[10px] sm:text-[11px] text-purple-700 font-medium">Checked-In</span>
                <div className="text-sm sm:text-base font-black text-purple-800">
                  {statsLoading ? '...' : passStats?.checkedInCount ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Pass Categories Cards with Click-to-Filter */}
          <div className="space-y-2.5 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-purple-100 text-purple-700">
                  <Tags className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">Pass Categories</h3>
                <span className="text-[11px] text-gray-400 font-normal hidden sm:inline">
                  — Select a card to filter passes in the table below
                </span>
              </div>
              <div className="flex items-center gap-2">
                {categoryFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('ALL');
                      setPage(0);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition shadow-2xs"
                  >
                    <X className="w-3 h-3 text-purple-600" />
                    <span>Clear Category Filter ({categoryFilter})</span>
                  </button>
                )}
                <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {categoryCardsList.length} Categories
                </span>
              </div>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
              {/* All Passes Master Card */}
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('ALL');
                  setPage(0);
                }}
                className={`p-3 rounded-xl text-left transition-all duration-200 relative flex flex-col justify-between gap-2.5 group cursor-pointer border ${
                  categoryFilter === 'ALL'
                    ? 'border-purple-600 bg-purple-50/90 shadow-md ring-2 ring-purple-500/25 -translate-y-0.5'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/20 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        categoryFilter === 'ALL'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-700'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate leading-snug group-hover:text-purple-700 transition-colors">
                        All Passes
                      </h4>
                      <span
                        className={`inline-block font-mono text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                          categoryFilter === 'ALL'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        ALL
                      </span>
                    </div>
                  </div>
                  {categoryFilter === 'ALL' ? (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-600 text-white shadow-2xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" /> Active
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] text-gray-400 group-hover:text-purple-600 transition-colors opacity-0 group-hover:opacity-100 font-medium">
                      Filter
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                    Complete Event
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                    {categoryCardsList.length} Categories
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 text-[11px]">
                  <span className="text-[10px] text-gray-500 font-medium">
                    Total: <strong className="text-gray-900">{statsLoading ? '...' : (passStats?.totalPasses ?? totalElements)}</strong>
                  </span>
                  <span
                    className={`text-[10px] font-semibold transition-colors ${
                      categoryFilter === 'ALL'
                        ? 'text-purple-700 font-bold'
                        : 'text-gray-400 group-hover:text-purple-600'
                    }`}
                  >
                    {categoryFilter === 'ALL' ? 'Showing all ↓' : 'Show all'}
                  </span>
                </div>
              </button>

              {/* Dynamic Categories Cards */}
              {categoryCardsList.map((cat, idx) => {
                const isSelected = categoryFilter === cat.code;
                const style = getCategoryCardStyle(cat.code, idx, isSelected);

                return (
                  <button
                    key={cat.id || cat.code}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setCategoryFilter('ALL');
                      } else {
                        setCategoryFilter(cat.code);
                      }
                      setPage(0);
                    }}
                    className={`p-3 rounded-xl text-left transition-all duration-200 relative flex flex-col justify-between gap-2.5 group cursor-pointer border ${style.container}`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${style.iconBox}`}
                        >
                          <Ticket className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4
                            className="font-bold text-xs sm:text-sm text-gray-900 truncate leading-snug group-hover:text-purple-700 transition-colors"
                            title={cat.name}
                          >
                            {cat.name}
                          </h4>
                          <span className={`inline-block font-mono text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${style.badge}`}>
                            {cat.code}
                          </span>
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-600 text-white shadow-2xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" /> Active
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] text-gray-400 group-hover:text-purple-600 transition-colors opacity-0 group-hover:opacity-100 font-medium">
                          Filter
                        </span>
                      )}
                    </div>

                    {/* Mode & Policy Badges */}
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      {cat.activationMode === 'SELF_SERVICE' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium">
                          <Smartphone className="w-2.5 h-2.5" /> Self-Service
                        </span>
                      )}
                      {cat.activationMode === 'SCAN_AUTO_ACTIVATE' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/60 font-medium">
                          <CheckCircle className="w-2.5 h-2.5" /> Auto-Activate
                        </span>
                      )}
                      {cat.activationMode === 'NO_QR_WALK_IN' && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60 font-medium">
                          <ShieldAlert className="w-2.5 h-2.5" /> Walk-In
                        </span>
                      )}

                      {cat.qrRequired ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                          <QrCode className="w-2.5 h-2.5" /> QR
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                          No QR
                        </span>
                      )}

                      {cat.passLimit ? (
                        <span className="px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-200 text-[10px]">
                          Max: {cat.passLimit}
                        </span>
                      ) : null}
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 text-[11px]">
                      <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            cat.enabled ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {cat.enabled ? 'Active' : 'Disabled'}
                      </span>
                      <span
                        className={`text-[10px] font-semibold transition-colors ${
                          isSelected
                            ? 'text-purple-700 font-bold'
                            : 'text-gray-400 group-hover:text-purple-600'
                        }`}
                      >
                        {isSelected ? 'Filtering table ↓' : 'Click to filter'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search, Filter Toolbar & Advanced Filters */}
          <div className="space-y-2 sm:space-y-3 pt-2 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold pb-1 -mx-1 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${statusFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  All Statuses
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('NOT_ACTIVATED');
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${statusFilter === 'NOT_ACTIVATED'
                    ? 'bg-yellow-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ACTIVATED');
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${statusFilter === 'ACTIVATED'
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Activated
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('REVOKED');
                    setPage(0);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${statusFilter === 'REVOKED'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Revoked
                </button>

                {categoryFilter !== 'ALL' && (
                  <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-bold shrink-0">
                    <span>Category: {categoryFilter}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter('ALL');
                        setPage(0);
                      }}
                      className="p-0.5 hover:bg-purple-200 rounded text-purple-600 transition"
                      title="Clear category filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Search Bar & Advanced Filter Toggle */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pass #, attendee, email..."
                    className="w-full pl-9 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`p-2 border rounded-lg text-xs font-semibold transition flex items-center gap-1 shrink-0 ${showAdvancedFilters || checkInFilter !== 'ALL' || dayFilter !== 'ALL' || fromSeqFilter
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  title="Advanced Filters"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Filters</span>
                </button>
              </div>
            </div>

            {/* Advanced Filters Expandable Drawer */}
            {showAdvancedFilters && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Pass Category Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Pass Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setPage(0);
                    }}
                    className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    {
                      availableCategories.length > 0 ? (
                        availableCategories.map((c) => (
                          <option key={c.id} value={c.categoryCode}>
                            {c.categoryName} ({c.categoryCode})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="STUDENT">STUDENT</option>
                          <option value="OTHER">OTHER</option>
                        </>
                      )
                    }
                  </select >
                </div >

                {/* Check-In Filter */}
                < div >
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Check-in Status
                  </label>
                  <select
                    value={checkInFilter}
                    onChange={(e) => {
                      setCheckInFilter(e.target.value);
                      setPage(0);
                    }}
                    className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="ALL">All Entries</option>
                    <option value="CHECKED_IN">Checked In</option>
                    <option value="NOT_CHECKED_IN">Not Checked In</option>
                  </select>
                </div >

                {/* Event Day Filter */}
                < div >
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Permitted Day
                  </label>
                  <select
                    value={dayFilter}
                    onChange={(e) => {
                      setDayFilter(e.target.value);
                      setPage(0);
                    }}
                    className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="ALL">All Permitted Days</option>
                    {eventDays.map((d) => (
                      <option key={d.id} value={d.id}>
                        Day {d.dayNumber} ({d.eventDate})
                      </option>
                    ))}
                  </select>
                </div >

                {/* Sequence Range Filters */}
                < div className="sm:col-span-2 lg:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-2" >
                  <div className="flex-1 w-full">
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                      From Sequence #
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1"
                      value={fromSeqFilter}
                      onChange={(e) => {
                        setFromSeqFilter(e.target.value);
                        setPage(0);
                      }}
                      className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                      To Sequence #
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={toSeqFilter}
                      onChange={(e) => {
                        setToSeqFilter(e.target.value);
                        setPage(0);
                      }}
                      className="w-full p-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  {
                    (checkInFilter !== 'ALL' || categoryFilter !== 'ALL' || dayFilter !== 'ALL' || fromSeqFilter || toSeqFilter) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCheckInFilter('ALL');
                          setCategoryFilter('ALL');
                          setDayFilter('ALL');
                          setFromSeqFilter('');
                          setToSeqFilter('');
                          setPage(0);
                        }}
                        className="mt-4 sm:mt-5 px-2 py-1.5 text-xs text-red-600 hover:underline whitespace-nowrap"
                      >
                        Clear
                      </button>
                    )
                  }
                </div >
              </div >
            )}

            {/* Bulk Selection Notification Bar */}
            {
              selectedPassesList.length > 0 && (
                <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs text-purple-900">
                  <div className="flex items-center gap-2">
                    <span className="font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full text-[11px]">
                      {selectedPassesList.length}
                    </span>
                    <span>pass(es) selected on this page / view</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenValidityBulk}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs"
                    >
                      <Layers className="w-3.5 h-3.5" /> Set Validity
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="px-2 py-1 text-gray-500 hover:text-gray-700 font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )
            }
          </div >
        </div >

        {/* Passes Table Body */}
        {
          passesLoading ? (
            <div className="p-8 sm:p-12 text-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
              <p className="text-sm mt-2">Loading passes from server...</p>
            </div>
          ) : passes.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-gray-500 space-y-2">
              <Ticket className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-300" />
              <p className="font-bold text-gray-700 text-sm sm:text-base">
                {totalElements === 0 ? 'No passes generated yet.' : 'No passes match your filter criteria.'}
              </p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                {totalElements === 0
                  ? 'Click "Generate Passes" or "Bulk Activate from Excel" to issue credentials for attendees.'
                  : 'Try clearing your search query or adjusting filter values.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 text-gray-600 text-[10px] sm:text-xs uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 w-8">
                      <input
                        type="checkbox"
                        checked={passes.length > 0 && passes.every((p) => !!selectedPassMap[p.id])}
                        onChange={toggleSelectAllOnPage}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                    </th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3">Pass ID</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3">Category</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3">Status</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3">Check-in</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3">Attendee</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3">Days</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {passes.map((p) => {
                    const isSelected = !!selectedPassMap[p.id];
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-gray-50/80 transition ${isSelected ? 'bg-purple-50/40' : ''
                          }`}
                      >
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectPass(p)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          <div className="font-mono font-bold text-purple-700 text-xs sm:text-sm">
                            {p.passNumber}
                          </div>
                          {p.sequenceNumber && (
                            <div className="text-[9px] sm:text-[10px] text-gray-400 font-mono">
                              Seq #{String(p.sequenceNumber).padStart(4, '0')}
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${p.category === 'STUDENT'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}
                            >
                              {p.category || 'STUDENT'}
                            </span>
                            {checkIsNoQr(p) && (
                              <span className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold" title="Walk-In / Badge Only (No QR)">
                                No QR
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3">{getPassStatusBadge(p.status)}</td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          {p.checkedIn ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                                <span className="hidden sm:inline">Checked In</span>
                                <span className="sm:hidden">In</span>
                                {p.checkInCount > 1 ? `(${p.checkInCount}x)` : ''}
                              </span>
                              {p.lastCheckedInAt && (
                                <div className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 hidden sm:flex">
                                  <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                  {formatDateTime(p.lastCheckedInAt)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-medium bg-gray-50 text-gray-500 border border-gray-200">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" /> <span className="hidden sm:inline">Not Checked In</span><span className="sm:hidden">No</span>
                            </span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          {p.attendeeName ? (
                            <div>
                              <div className="font-semibold text-gray-900 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{p.attendeeName}</div>
                              <div className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">{p.attendeeEmail}</div>
                              {p.attendeeMobileNumber && (
                                <div className="text-[9px] sm:text-[10px] text-gray-400 hidden sm:block">{p.attendeeMobileNumber}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] sm:text-xs text-gray-400 italic">Unclaimed</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          {p.validDays && p.validDays.length > 0 ? (
                            <div className="flex flex-wrap gap-0.5 sm:gap-1 max-w-[100px] sm:max-w-xs">
                              {p.validDays.map((d) => (
                                <span
                                  key={d.id}
                                  className="bg-purple-50 text-purple-700 border border-purple-200 px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold"
                                  title={d.eventDate}
                                >
                                  D{d.dayNumber}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] sm:text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-200">
                              All
                            </span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-right space-x-0.5 sm:space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenValidityForSingle(p)}
                            className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[10px] sm:text-xs font-semibold transition"
                            title="Manage Event-Day Validity"
                          >
                            <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">Validity</span>
                          </button>

                          {/* Pass button: Opens action modal */}
                          <button
                            type="button"
                            onClick={() => setPassActionModalId(p.id)}
                            className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-1 bg-white border border-gray-300 rounded text-[10px] sm:text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-xs"
                          >
                            <Printer className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">Pass</span>
                          </button>

                          {p.status !== 'REVOKED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setPassToRevoke(p);
                                setRevokeModalOpen(true);
                              }}
                              className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs text-red-600 hover:bg-red-50 rounded transition font-medium"
                            >
                              <span className="hidden sm:inline">Revoke</span>
                              <span className="sm:hidden">×</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        }

        {/* Server-Side Pagination Footer */}
        <div className="px-4 sm:px-5 py-4 border-t border-gray-200 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-600">
              {totalElements > 0 ? (
                <>
                  Showing <span className="font-bold text-purple-700">{page * pageSize + 1}</span> to{' '}
                  <span className="font-bold text-purple-700">
                    {Math.min((page + 1) * pageSize, totalElements)}
                  </span>{' '}
                  of <span className="font-bold text-purple-700">{totalElements}</span> passes
                </>
              ) : (
                <span className="text-gray-500">No passes found</span>
              )}
            </span>
            {totalElements > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setPage(0);
                  }}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 cursor-pointer hover:border-purple-400 transition"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalElements > 0 && totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button
                type="button"
                disabled={page === 0 || passesLoading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition-all duration-200 text-xs font-semibold shadow-sm"
              >
                Previous
              </button>
              {(() => {
                const maxVisible = 3;
                let startPage, endPage;

                if (totalPages <= maxVisible) {
                  startPage = 0;
                  endPage = totalPages - 1;
                } else {
                  const half = Math.floor(maxVisible / 2);
                  if (page <= half) {
                    startPage = 0;
                    endPage = maxVisible - 1;
                  } else if (page >= totalPages - half - 1) {
                    startPage = totalPages - maxVisible;
                    endPage = totalPages - 1;
                  } else {
                    startPage = page - half;
                    endPage = page + half;
                  }
                }

                const visiblePages = [];
                for (let i = startPage; i <= endPage; i++) {
                  visiblePages.push(i);
                }

                return visiblePages.map((pageIndex) => (
                  <button
                    key={pageIndex}
                    type="button"
                    onClick={() => setPage(pageIndex)}
                    disabled={passesLoading}
                    className={`w-9 h-9 rounded-lg transition-all duration-200 text-xs font-bold shadow-sm ${
                      page === pageIndex
                        ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white border-purple-600 shadow-md hover:from-purple-700 hover:to-purple-800 transform hover:scale-105'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700'
                    }`}
                  >
                    {pageIndex + 1}
                  </button>
                ));
              })()}
              <button
                type="button"
                disabled={page >= totalPages - 1 || passesLoading}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition-all duration-200 text-xs font-semibold shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div >

      {/* GENERATE PASSES MODAL */}
      {
        isGenModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Generate Unique Passes</h2>
                  <p className="text-xs text-gray-500 truncate">Event: {event.name}</p>
                </div>
                <button
                  onClick={() => setIsGenModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {newlyGeneratedPasses.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-bold text-green-900 text-sm sm:text-base">
                      {newlyGeneratedPasses.length} Passes Generated!
                    </h3>
                    <p className="text-xs text-green-700 mt-1">
                      Raw QR tokens have been generated. Below is the batch preview.
                    </p>

                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y border rounded-lg text-xs">
                    {newlyGeneratedPasses.map((p) => {
                      const isNoQr = p.qrRequired === false || p.activationMode === 'NO_QR_WALK_IN' || (!p.rawToken && p.category === 'VIP');
                      return (
                        <div key={p.id} className="p-2.5 flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-purple-700">{p.passNumber}</span>
                              {isNoQr && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
                                  No QR / Badge
                                </span>
                              )}
                            </div>
                            {p.rawToken && (
                              <div className="text-[10px] text-gray-400 font-mono truncate max-w-xs">
                                Token: {p.rawToken}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setActivePrintPass(p);
                              setIsGenModalOpen(false);
                            }}
                            className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold rounded text-xs flex items-center gap-1 shrink-0 ml-2"
                          >
                            <Printer className="w-3.5 h-3.5" /> View Pass
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsGenModalOpen(false)}
                    className="w-full py-2.5 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-900 transition text-sm"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGeneratePasses} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Pass Category
                    </label>
                    <select
                      value={genCategory || 'STUDENT'}
                      onChange={(e) => setGenCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      {availableCategories.length > 0 ? (
                        availableCategories.map((c) => {
                          const code = c.categoryCode || c.passCategoryCode || c.code || 'STUDENT';
                          const name = c.categoryName || c.passCategoryName || c.name || code;
                          const isNoQr = c.activationMode === 'NO_QR_WALK_IN' || c.qrRequired === false;
                          return (
                            <option
                              key={c.id || code}
                              value={code}
                            >
                              {name} ({code}){isNoQr ? ' — [Staff Walk-In / No QR Badge]' : ''}
                            </option>
                          );
                        })
                      ) : (
                        <>
                          <option value="STUDENT">Student (STUDENT)</option>
                          <option value="VIP">VIP (VIP) — [Staff Walk-In / No QR Badge]</option>
                          <option value="OTHER">Other / General (OTHER)</option>
                        </>
                      )}
                    </select>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Determines the registration fields presented to attendees upon scanning.
                    </p>

                  </div >
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Batch Size (Number of passes to generate)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={batchSize}
                      onChange={(e) => setBatchSize(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Format: {event.eventCode}-{event.passSeriesCode}-000001
                    </p>

                  </div>

                  {/* Day Selection Checkboxes */}
                  {
                    eventDays.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                          Permitted Event Days (Leave blank to permit ALL days)
                        </label>
                        <div className="space-y-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
                          {eventDays.map((day) => {
                            const checked = selectedGenDayIds.includes(day.id);
                            return (
                              <label
                                key={day.id}
                                className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleGenDaySelection(day.id)}
                                  className="rounded text-purple-600 focus:ring-purple-500"
                                />
                                <span className="font-semibold">Day {day.dayNumber}:</span>
                                <span className="truncate">{day.eventDate || day.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )
                  }

                  <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsGenModalOpen(false)}
                      className="px-4 py-2 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={generating}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                        </>
                      ) : (
                        'Generate Passes'
                      )}
                    </button>
                  </div>
                </form>
              )
              }
            </div >
          </div >
        )}

      {/* PRINTABLE PASS MODAL */}
      {
        activePrintPass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header / Close */}
              <div className="p-3 bg-gray-100 border-b flex justify-between items-center text-xs font-semibold text-gray-700">
                <span>Printable Event Pass Card</span>
                <button
                  onClick={() => setActivePrintPass(null)}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* The Pass Card (Printable Area) */}
              <div id="printable-card" className="p-4 sm:p-6 text-center space-y-4 bg-white">
                <div className="border-b pb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                    OFFICIAL EVENT PASS
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 mt-2 truncate">{event.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{event.venue || 'Event Venue'}</p>
                </div>

                {/* QR Code Container or No-QR Walk-In Badge */}
                {isNoQrActivePrintPass ? (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 p-5 rounded-2xl mx-auto max-w-xs shadow-xs text-center space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="text-sm font-black text-amber-900 uppercase tracking-wide">
                      Walk-In Badge Pass
                    </div>
                    <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300">
                      No QR Code Required
                    </span>
                    <p className="text-[11px] text-amber-700 pt-1 leading-relaxed">
                      Official on-site badge admission. Verified at entry using Pass Identifier.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-xl border inline-block mx-auto shadow-inner">
                    <img
                      src={getQrImageUrl(activePrintPass.rawToken || activePrintPass.passNumber, event?.id || eventId)}
                      alt="QR Pass"
                      className="w-36 h-36 sm:w-44 sm:h-44 object-contain mx-auto"
                    />
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-400 font-medium">Pass Identifier</p>
                  <p className="font-mono font-black text-lg sm:text-xl text-purple-800 tracking-wider break-all">
                    {activePrintPass.passNumber}
                  </p>

                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${activePrintPass.category === 'STUDENT'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                    >
                      {activePrintPass.category || 'STUDENT'} PASS
                    </span>
                  </div>


                </div>

                {activePrintPass.attendeeName ? (
                  <div className="bg-purple-50/70 p-2.5 rounded-lg text-xs">
                    <span className="text-gray-500">Attendee: </span>
                    <strong className="text-gray-900">{activePrintPass.attendeeName}</strong>
                  </div>
                ) : isNoQrActivePrintPass ? (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 font-medium">
                    Staff On-Site Admission Only • No attendee QR registration required
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    Scan QR with your smartphone to activate attendee registration
                  </div>
                )}

                {activePrintPass.validDays && activePrintPass.validDays.length > 0 && (
                  <div className="text-[11px] text-gray-600 flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="font-medium">Valid for:</span>
                    {activePrintPass.validDays.map((d) => (
                      <span
                        key={d.id}
                        className="bg-gray-100 font-semibold px-2 py-0.5 rounded text-[10px]"
                      >
                        Day {d.dayNumber}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Print actions footer */}
              <div className="p-4 bg-gray-50 border-t flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintSinglePass(activePrintPass)}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Pass
                </button>
                <button
                  type="button"
                  onClick={() => setActivePrintPass(null)}
                  className="px-4 py-2 border bg-white rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* REVOKE PASS MODAL */}
      {
        revokeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                <h3 className="font-bold text-base sm:text-lg text-gray-900">Revoke Pass</h3>
              </div>
              <p className="text-xs text-gray-600">
                Are you sure you want to revoke pass{' '}
                <strong className="font-mono text-gray-900 break-all">{passToRevoke?.passNumber}</strong>? Once
                revoked, it cannot be used for gate check-in or reactivation.
              </p>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Revocation Reason
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Lost badge, cancelled registration, duplicate issuance"
                  rows={3}
                  className="w-full p-2.5 border rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevokeModalOpen(false)}
                  className="px-3.5 py-1.5 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRevokePass}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow transition"
                >
                  Confirm Revocation
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* VIEW FULL PASS MODAL */}
      {
        activeFullPass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-3 bg-gray-100 border-b flex justify-between items-center text-xs font-semibold text-gray-700">
                <span>Full Event Pass</span>
                <button
                  onClick={() => setActiveFullPass(null)}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Pass Template */}
              <PassEmailTemplate
                attendeeName={activeFullPass.attendeeName || ''}
                attendeeEmail={activeFullPass.attendeeEmail || ''}
                passCode={activeFullPass.passNumber}
                passCategory={activeFullPass.category || 'General'}
                category={activeFullPass.categoryName || activeFullPass.category || ''}
                eventName={event?.name || ''}
                eventDate={`${formatDate(event?.startsAt)} – ${formatDate(event?.endsAt)}`}
                eventVenue={event?.venue || ''}
                seatOrSeq={activeFullPass.sequenceNumber ? String(activeFullPass.sequenceNumber).padStart(4, '0') : ''}
                validDays={activeFullPass.validDays || []}
                qrImageUrl={isNoQrActiveFullPass ? null : getQrImageUrl(activeFullPass.rawToken || activeFullPass.passNumber)}
              />

              {/* Print actions footer */}
              <div className="p-3 bg-gray-50 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await generatePassesPdf([activeFullPass], event);
                      toast.success(`Downloaded pass ${activeFullPass.passNumber} as PDF!`);
                    } catch (e) {
                      console.error('PDF error:', e);
                      handlePrintSingleFullPass(activeFullPass);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download Pass (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintSingleFullPass(activeFullPass)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFullPass(null)}
                  className="px-4 py-2 border bg-white rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* PASS ACTION MODAL */}
      {
        passActionModalId && (() => {
          const p = passes.find(pass => pass.id === passActionModalId);
          if (!p) return null;
          const isNoQr = checkIsNoQr(p);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-base font-bold text-gray-900">Pass Options</h3>
                  <button
                    onClick={() => setPassActionModalId(null)}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePrintPass(p);
                      setPassActionModalId(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition text-left"
                  >
                    {isNoQr ? <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" /> : <QrCode className="w-5 h-5 text-purple-600 shrink-0" />}
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{isNoQr ? 'View Badge' : 'QR Card'}</div>
                      <div className="text-xs text-gray-500">{isNoQr ? 'View walk-in badge pass' : 'View QR code card'}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFullPass(p);
                      setPassActionModalId(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition text-left"
                  >
                    <Printer className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">View Full Pass</div>
                      <div className="text-xs text-gray-500">View complete pass details</div>
                    </div>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setPassActionModalId(null)}
                  className="w-full py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })()
      }

      {/* MANAGE PASS VALIDITY MODAL */}
      <ManagePassValidityModal
        isOpen={isValidityModalOpen}
        onClose={() => {
          setIsValidityModalOpen(false);
          setSinglePassForValidity(null);
        }}
        event={event}
        eventDays={eventDays}
        selectedPasses={selectedPassesList}
        singlePass={singlePassForValidity}
        onValidityUpdated={() => {
          clearSelection();
          fetchPasses();
          fetchPassStats();
        }}
      />

      {/* GATEKEEPER MANAGEMENT MODAL */}
      <GatekeeperManagementModal
        isOpen={isGatekeeperModalOpen}
        onClose={() => setIsGatekeeperModalOpen(false)}
        event={event}
        onGatekeepersChanged={fetchGatekeepers}
      />

      {/* BULK DOWNLOAD PASSES MODAL */}
      <BulkDownloadPassesModal
        isOpen={isBulkDownloadOpen}
        onClose={() => setIsBulkDownloadOpen(false)}
        event={event}
        eventDays={eventDays}
        categories={availableCategories}
      />

      {/* BULK FULL PASS DOWNLOAD MODAL */}
      <BulkFullPassDownloadModal
        isOpen={isBulkFullPassModalOpen}
        onClose={() => setIsBulkFullPassModalOpen(false)}
        event={event}
        eventDays={eventDays}
        categories={availableCategories}
        totalAvailable={totalElements}
      />

      {/* BULK ACTIVATION FROM EXCEL MODAL */}
      <BulkActivationModal
        isOpen={isBulkActivateOpen}
        onClose={() => setIsBulkActivateOpen(false)}
        event={event}
        categories={availableCategories}
        onActivationComplete={handleRefreshAll}
      />

      {/* ALLOT PASSES MODAL */}
      <AllotPassesModal
        isOpen={isAllotModalOpen}
        onClose={() => setIsAllotModalOpen(false)}
        eventId={eventId}
        categories={availableCategories}
        onAllotmentSuccess={() => {
          fetchAllotmentsSummary();
          fetchPassStats();
          fetchPasses();
        }}
      />

      {/* PASS ALLOTMENT ANALYTICS MODAL */}
      <PassAllotmentAnalyticsModal
        isOpen={analyticsModalState.isOpen}
        onClose={() => setAnalyticsModalState((prev) => ({ ...prev, isOpen: false }))}
        eventId={eventId}
        allottedTo={analyticsModalState.allottedTo}
        categoryCode={analyticsModalState.categoryCode}
        categoryName={analyticsModalState.categoryName}
      />
    </div >
  );
};

export default EventDetail;
