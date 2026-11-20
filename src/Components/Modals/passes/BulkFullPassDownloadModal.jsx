import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  Printer,
  Loader2,
  AlertCircle,
  QrCode,
  Layers,
  Sparkles,
  Ticket,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import passService from '../../../Api-Services/passService';
import { categoryService } from '../../../Api-Services/categoryService';
import toast from 'react-hot-toast';
import useScrollLock from '../../../hooks/useScrollLock';
import BulkDownloadPass, { frontPass, backpass, buildDateLabelText, formatPassDisplayDate } from '../../emailPass/bulkDownloadpass';
import {
  generatePassesPdf,
  openPassesPdfPreview,
  downloadA4SheetPdf,
  openA4SheetPdfPreview,
} from '../../../utils/passPdfGenerator';

const BulkFullPassDownloadModal = ({
  isOpen,
  onClose,
  event,
  eventDays = [],
  categories = [],
  totalAvailable = 0,
}) => {
  const [localCategories, setLocalCategories] = useState([]);
  const [count, setCount] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [useRange, setUseRange] = useState(false);
  const [fromSeq, setFromSeq] = useState('');
  const [toSeq, setToSeq] = useState('');
  const [dayId, setDayId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [previewPasses, setPreviewPasses] = useState([]);
  const [activeTab, setActiveTab] = useState('download'); // 'download' | 'preview'

  const effectiveCategories = useMemo(() => {
    return categories && categories.length > 0 ? categories : localCategories;
  }, [categories, localCategories]);

  const categoryOptions = useMemo(() => {
    const list = [{ value: 'ALL', label: 'All Categories' }];
    if (effectiveCategories && effectiveCategories.length > 0) {
      effectiveCategories.forEach((cat) => {
        const code = cat.categoryCode || cat.passCategoryCode || cat.code;
        const name = cat.categoryName || cat.passCategoryName || cat.name || code;
        list.push({ value: code, label: name });
      });
    }
    return list;
  }, [effectiveCategories]);

  useEffect(() => {
    if (isOpen && event?.id) {
      if (!categories || categories.length === 0) {
        categoryService
          .getEventCategories(event.id, false)
          .then((res) => {
            let list = [];
            if (Array.isArray(res)) list = res;
            else if (Array.isArray(res?.data)) list = res.data;
            else if (Array.isArray(res?.data?.content)) list = res.data.content;
            setLocalCategories(list);
          })
          .catch((err) => console.error('Failed to load categories in bulk full pass modal:', err));
      }
    }
  }, [isOpen, event, categories]);

  useEffect(() => {
    if (isOpen) {
      setCount(10);
      setStatusFilter('ALL');
      setCategoryFilter('ALL');
      setUseRange(false);
      setFromSeq('');
      setToSeq('');
      setDayId('');
      setPreviewPasses([]);
      setActiveTab('download');
      setLoading(false);
    }
  }, [isOpen]);

  useScrollLock(isOpen && !!event);

  if (!isOpen || !event) return null;

  const getQrUrl = (tokenOrPass) => {
    if (!tokenOrPass) return null;
    if (typeof tokenOrPass === 'object') {
      if (tokenOrPass.qrImageUrl) return tokenOrPass.qrImageUrl;
      if (tokenOrPass.qrCodeUrl) return tokenOrPass.qrCodeUrl;
    }
    const identifier =
      typeof tokenOrPass === 'string'
        ? tokenOrPass
        : tokenOrPass?.rawToken ||
        tokenOrPass?.passNumber ||
        tokenOrPass?.qrData ||
        tokenOrPass?.token ||
        tokenOrPass?.id ||
        '';
    if (!identifier) return null;
    const activationUrl = `${window.location.origin}/activate/${encodeURIComponent(identifier)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      activationUrl
    )}`;
  };

  const formatEventDateStr = () => {
    return formatPassDisplayDate([], event);
  };

  const fetchPasses = async (targetCount) => {
    const numericCount = Math.max(1, parseInt(targetCount, 10) || 10);
    setLoading(true);
    setLoadingMsg(`Fetching ${numericCount} passes...`);
    try {
      const validPassStatuses = ['NOT_ACTIVATED', 'ACTIVATED', 'REVOKED'];
      let mappedStatus = null;
      if (statusFilter && statusFilter !== 'ALL') {
        if (statusFilter === 'AVAILABLE') mappedStatus = 'NOT_ACTIVATED';
        else if (statusFilter === 'ACTIVE') mappedStatus = 'ACTIVATED';
        else if (validPassStatuses.includes(statusFilter)) mappedStatus = statusFilter;
      }

      const baseParams = {
        sortBy: 'sequenceNumber',
        sortDir: 'asc',
      };

      if (mappedStatus) baseParams.status = mappedStatus;
      if (categoryFilter && categoryFilter !== 'ALL') baseParams.category = categoryFilter;
      if (dayId) baseParams.eventDayId = dayId;
      if (useRange) {
        if (fromSeq) baseParams.fromSequence = parseInt(fromSeq, 10);
        if (toSeq) baseParams.toSequence = parseInt(toSeq, 10);
      }

      let data = [];
      const pageSize = 100; // Spring Data default maximum page size is 100
      let page = 0;
      let totalPages = 1;
      let hasMore = true;

      while (data.length < numericCount && hasMore) {
        const fetchSize = Math.min(pageSize, numericCount - data.length);
        if (numericCount > pageSize) {
          setLoadingMsg(`Fetching passes (${data.length}/${numericCount})...`);
        }

        const res = await passService.getPassesByEvent(event.id, {
          ...baseParams,
          page,
          size: fetchSize,
        });

        const content = res?.data?.content || (Array.isArray(res?.data) ? res.data : []);
        if (Array.isArray(content) && content.length > 0) {
          data = [...data, ...content];

          const serverTotalPages = res?.data?.page?.totalPages ?? res?.data?.totalPages;
          if (serverTotalPages !== undefined) {
            totalPages = serverTotalPages;
          }

          const serverIsLast = res?.data?.page?.last ?? res?.data?.last;
          if (serverIsLast === true || (serverTotalPages && page + 1 >= serverTotalPages)) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }

        if (!content || content.length === 0) {
          break;
        }
      }

      // If paginated fetching returned fewer passes than requested, fallback/augment with exportPasses
      if (data.length < numericCount) {
        try {
          setLoadingMsg(`Retrieving passes...`);
          const exportRes = await passService.exportPasses(event.id, {
            ...(mappedStatus && { status: mappedStatus }),
            ...(categoryFilter !== 'ALL' && { category: categoryFilter }),
            ...(useRange && fromSeq && { fromSequence: parseInt(fromSeq, 10) }),
            ...(useRange && toSeq && { toSequence: parseInt(toSeq, 10) }),
            ...(dayId && { dayId }),
          });
          const allExport = exportRes?.data || [];
          if (Array.isArray(allExport) && allExport.length > data.length) {
            allExport.sort((a, b) => (Number(a.sequenceNumber) || 0) - (Number(b.sequenceNumber) || 0));
            data = allExport.slice(0, numericCount);
          }
        } catch (exportErr) {
          console.warn('Fallback to exportPasses encountered an error:', exportErr);
        }
      }

      if (data.length === 0) {
        toast.error('No passes found for the specified count and filters.');
        return null;
      }

      if (data.length > numericCount) {
        data = data.slice(0, numericCount);
      }

      return data;
    } catch (err) {
      console.error('Error fetching passes for bulk full pass:', err);
      toast.error(err.message || 'Failed to fetch passes');
      return null;
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  // Open dedicated print window with full pass artwork
  const triggerPdfPrintWindow = (passList) => {
    const defaultEventDate = formatEventDateStr();
    const rawVenue = (event.venue || 'Indore').trim();
    let vName = rawVenue;
    let vLoc = null;
    if (rawVenue.includes(',')) {
      const parts = rawVenue.split(',');
      vName = parts[0].trim();
      vLoc = parts.slice(1).join(',').trim();
    } else if (rawVenue.toUpperCase() === 'RENAISSANCE UNIVERSITY') {
      vLoc = 'CAMPUS, INDORE';
    }

    const cardsHtml = passList
      .map((p) => {
        const qrUrl = getQrUrl(p);
        const seq = p.sequenceNumber
          ? String(p.sequenceNumber).padStart(4, '0')
          : p.passNumber?.split('-')?.pop() || '';
        const seqBadge = seq ? (seq.startsWith('#') ? seq : `#${seq}`) : '';
        const cat = (
          p.categoryName ||
          p.category ||
          p.categoryCode ||
          'GENERAL'
        ).toUpperCase();
        const dateStr = buildDateLabelText(p.validDays, defaultEventDate);

        return `
        <div class="pass-page">
          <div class="bulk-pass-card">
            <!-- FRONT PASS (Commented for now - only backPass needed) -->
            <!--
            <div class="pass-front">
              <img src="${frontPass}" alt="Pass Front" class="pass-img" />
            </div>
            -->

            <!-- BACK PASS -->
            <div class="pass-back">
              <img src="${backpass}" alt="Pass Back" class="pass-img" />
              
              <!-- QR Overlay -->
              <div class="qr-container">
                ${qrUrl
            ? `<img src="${qrUrl}" alt="QR" class="qr-img" />`
            : `<div class="no-qr-box">
                         <span>BADGE</span>
                         <span class="no-qr-sub">NO QR</span>
                       </div>`
          }
              </div>

              <!-- Unified Badge Details Cluster below QR -->
              ${(cat || seqBadge || dateStr)
            ? `<div class="pass-badge-cluster">
                        ${cat ? `<span class="badge-cat">${cat}</span>` : ''}
                        ${seqBadge ? `<span class="badge-seq">${seqBadge}</span>` : ''}
                        ${dateStr ? `<span class="badge-date">${dateStr}</span>` : ''}
                      </div>`
            : ''
          }

              <!-- Left Sequence Strip (Rotated) -->
              ${seqBadge
            ? `<div class="left-seq-strip">
                       <span>${seqBadge}</span>
                     </div>`
            : ''
          }
            </div>
          </div>
        </div>
      `;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Full Passes (${passList.length}) – ${event.name || event.eventCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #f3f4f6;
      font-family: 'Segoe UI', Arial, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Screen Toolbar */
    .screen-toolbar {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(17, 24, 39, 0.94);
      backdrop-filter: blur(10px);
      padding: 8px 16px;
      border-radius: 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      color: #fff;
    }
    .toolbar-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .toolbar-title {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
    }
    .mode-badge {
      font-size: 10px;
      font-weight: 800;
      background: #10b981;
      color: #064e3b;
      padding: 3px 8px;
      border-radius: 12px;
      letter-spacing: 0.5px;
    }
    .toolbar-btns {
      display: flex;
      align-items: center;
      gap: 8px;
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
      transition: all 0.2s;
    }
    .screen-btn:hover { background: #7e22ce; transform: translateY(-1px); }
    .screen-btn-download {
      background: #059669;
    }
    .screen-btn-download:hover { background: #047857; }
    .screen-btn-mode {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
    }
    .screen-btn-mode:hover {
      background: rgba(255, 255, 255, 0.25);
    }
    .screen-btn-secondary {
      background: rgba(255, 255, 255, 0.12);
    }
    .screen-btn-secondary:hover { background: rgba(255, 255, 255, 0.22); }

    /* Pass Page on Screen */
    .pass-page {
      width: 100%;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px 16px;
      page-break-after: always;
      break-after: page;
    }
    .pass-page:last-of-type {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Card styling */
    .bulk-pass-card {
      width: 100%;
      max-width: 600px;
      background: #ffffff;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      border-radius: 8px;
      position: relative;
    }

    .pass-front, .pass-back {
      position: relative;
      width: 100%;
      line-height: 0;
    }
    .pass-img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
    }

    /* Front Overlay */
    .front-details {
      position: absolute;
      top: 58%;
      left: 39.5%;
      width: 42%;
      background-color: #fef3e7;
      padding: 3px 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
      line-height: 1.25;
    }
    .front-line {
      height: 1px;
      background-color: #d8c8b8;
      margin-bottom: 2px;
      width: 100%;
    }
    .front-text {
      font-size: 10px;
      font-weight: 700;
      color: #121212;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .front-text .label {
      color: #6f3b25;
    }
    .front-loc {
      font-size: 8.5px;
      color: #4a3525;
    }

    /* Back Overlays */
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
    .qr-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .no-qr-box {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 800;
      color: #92400e;
      background-color: #fef3c7;
      border: 1.5px dashed #f59e0b;
      border-radius: 4px;
      text-align: center;
      line-height: 1.2;
    }
    .no-qr-sub {
      font-size: 6px;
      font-weight: 600;
      color: #b45309;
    }

    .pass-badge-cluster {
      position: absolute;
      top: 60.5%;
      bottom: 8.5%;
      right: 6.5%;
      width: 21%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-evenly;
      text-align: center;
      line-height: 1.15;
      pointer-events: none;
    }
    .badge-cat {
      font-size: 11px;
      font-weight: 800;
      color: #000000;
      font-family: 'Segoe UI', Roboto, Arial, sans-serif;
      letter-spacing: 1.5px;
      white-space: nowrap;
      text-transform: uppercase;
      display: block;
    }
    .badge-seq {
      font-size: 12px;
      font-weight: 800;
      color: #000000;
      font-family: 'Segoe UI', Roboto, Arial, sans-serif;
      letter-spacing: 0.8px;
      white-space: nowrap;
      text-transform: uppercase;
      display: block;
    }
    .badge-date {
      font-size: 9.5px;
      font-weight: 700;
      color: #000000;
      font-family: 'Segoe UI', Roboto, Arial, sans-serif;
      letter-spacing: 0.3px;
      white-space: nowrap;
      display: block;
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
    /* Default Print Mode: EXACT PASS ONLY (ZERO BACKGROUND / NO EXTRA BLANK PAGE) */
    @media print {
      @page {
        size: landscape;
        margin: 0;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
      }
      html, body {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .screen-toolbar {
        display: none !important;
      }
      .pass-page {
        width: 100vw !important;
        height: 100vh !important;
        max-height: 100vh !important;
        min-height: 0 !important;
        margin: 0 auto !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .pass-page:last-of-type,
      .pass-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .bulk-pass-card {
        width: 100% !important;
        max-width: 98vw !important;
        height: auto !important;
        max-height: 96vh !important;
        margin: 0 auto !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        border: none !important;
        background: transparent !important;
        overflow: hidden !important;
        position: relative !important;
      }
      .pass-back {
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        position: relative !important;
      }
      .pass-img {
        width: 100% !important;
        height: auto !important;
        max-height: 96vh !important;
        object-fit: contain !important;
        display: block !important;
      }
      .serial-badge span, .category-badge span, .date-badge span {
        font-size: 13px !important;
        color: #000000 !important;
      }
      .left-seq-strip span {
        font-size: 11px !important;
      }
    }
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <div class="toolbar-info">
      <span class="toolbar-title">&#128424; Passes (${passList.length})</span>
      <span class="mode-badge" id="modeBadge">PASS ONLY (NO BACKGROUND)</span>
    </div>
    <div class="toolbar-btns">
      <button class="screen-btn screen-btn-download" onclick="downloadViaCanvasPdf()">
        📥 Download Pass-Only PDF
      </button>
      <button class="screen-btn" onclick="window.print()">
        &#128424; Print / Save as PDF
      </button>
      <button class="screen-btn screen-btn-mode" id="btnToggleMode" onclick="togglePrintMode()">
        Switch to A4 Landscape
      </button>
      <button class="screen-btn screen-btn-secondary" onclick="window.close()">
        Close
      </button>
    </div>
  </div>

  ${cardsHtml}

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
        styleEl.innerHTML = '@media print { @page { size: landscape; margin: 0; } html, body { width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; background: transparent !important; } .screen-toolbar { display: none !important; } .pass-page { width: 100% !important; height: 100vh !important; max-height: 100vh !important; min-height: 0 !important; margin: 0 auto !important; padding: 0 !important; display: flex !important; align-items: center !important; justify-content: center !important; page-break-after: always !important; break-after: page !important; page-break-inside: avoid !important; break-inside: avoid !important; } .pass-page:last-of-type, .pass-page:last-child { page-break-after: avoid !important; break-after: avoid !important; } .bulk-pass-card { width: 100% !important; max-width: 98% !important; height: auto !important; margin: 0 auto !important; box-shadow: none !important; border-radius: 0 !important; border: none !important; background: transparent !important; } .pass-back { width: 100% !important; height: auto !important; position: relative !important; } .pass-img { width: 100% !important; height: auto !important; max-height: 98vh !important; object-fit: contain !important; display: block !important; margin: 0 auto !important; } .serial-badge span, .category-badge span, .date-badge span { font-size: 13px !important; color: #000000 !important; } .left-seq-strip span { font-size: 11px !important; } }';
      } else {
        badge.textContent = 'PASS ONLY (NO BACKGROUND)';
        btn.textContent = 'Switch to A4 Landscape';
        styleEl.innerHTML = '@media print { @page { size: 154mm 58mm; margin: 0mm; } *, *::before, *::after { box-sizing: border-box !important; } html, body { width: 154mm !important; height: auto !important; margin: 0 !important; padding: 0 !important; background: transparent !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .screen-toolbar { display: none !important; } .pass-page { width: 154mm !important; height: 58mm !important; max-height: 58mm !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; display: block !important; position: relative !important; overflow: hidden !important; page-break-before: auto !important; break-before: auto !important; page-break-after: always !important; break-after: page !important; page-break-inside: avoid !important; break-inside: avoid !important; } .pass-page:last-of-type, .pass-page:last-child { page-break-after: avoid !important; break-after: avoid !important; } .bulk-pass-card { width: 154mm !important; height: 58mm !important; max-width: 154mm !important; max-height: 58mm !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; border-radius: 0 !important; border: none !important; background: transparent !important; overflow: hidden !important; position: relative !important; } .pass-back { width: 154mm !important; height: 58mm !important; margin: 0 !important; padding: 0 !important; position: relative !important; } .pass-img { width: 154mm !important; height: 58mm !important; object-fit: fill !important; display: block !important; } .serial-badge span, .category-badge span, .date-badge span { font-size: 13px !important; color: #000000 !important; } .left-seq-strip span { font-size: 11px !important; } }';
      }
    }
    function togglePrintMode() {
      setPrintMode(currentMode === 'pass-only' ? 'a4' : 'pass-only');
    }

    async function downloadViaCanvasPdf() {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('PDF library is loading, please try again in a few seconds.');
        return;
      }
      var cards = Array.from(document.querySelectorAll('.pass-page'));
      if (cards.length === 0) return;
      var doc = new window.jspdf.jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [58, 154],
        compress: true
      });
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i].querySelector('.bulk-pass-card');
        if (!card) continue;
        var bgImg = card.querySelector('.pass-img');
        var qrImg = card.querySelector('.qr-img');
        var catSpan = card.querySelector('.category-badge span');
        var seqSpan = card.querySelector('.serial-badge span');
        var dateSpan = card.querySelector('.date-badge span');
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
          ctx.fillStyle = '#000000';
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
          ctx.fillStyle = '#000000';
          ctx.fillText(seqSpan.textContent.trim(), serialBoxX + serialBoxWidth / 2, serialBoxY + serialBoxHeight / 2);
          ctx.restore();
        }

        var dateBoxWidth = catBoxWidth;
        var dateBoxHeight = catBoxHeight;
        var dateBoxX = catBoxX;
        var dateBoxY = Math.round(686 * (1.0 - 0.08 - 0.09));
        if (dateSpan && dateSpan.textContent) {
          ctx.save();
          ctx.font = 'bold 26px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#000000';
          ctx.fillText(dateSpan.textContent.trim(), dateBoxX + dateBoxWidth / 2, dateBoxY + dateBoxHeight / 2);
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

        var dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) doc.addPage([58, 154], 'landscape');
        doc.addImage(dataUrl, 'JPEG', 0, 0, 154, 58);
      }
      doc.save('Passes_' + cards.length + '.pdf');
    }

    // Images loaded handler for manual print button
    var imgs = Array.from(document.querySelectorAll('img'));
    var total = imgs.length;
    var loaded = 0;
    imgs.forEach(function(img) {
      if (img.complete) {
        loaded++;
      } else {
        img.onload = function() { loaded++; };
        img.onerror = function() { loaded++; };
      }
    });
  </script>
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

  const handleDownload = async () => {
    const targetCount = parseInt(count, 10);
    if (isNaN(targetCount) || targetCount < 1) {
      toast.error('Please enter a valid count greater than 0');
      return;
    }

    const data = await fetchPasses(targetCount);
    if (data && data.length > 0) {
      try {
        setLoading(true);
        setLoadingMsg(`Generating pass PDF (1/${data.length})...`);
        await generatePassesPdf(data, event, (curr, tot) => {
          setLoadingMsg(`Generating pass PDF (${curr}/${tot})...`);
        });
        toast.success(`Successfully downloaded ${data.length} passes as PDF!`);
        onClose();
      } catch (err) {
        console.error('Direct PDF export error:', err);
        toast.error(`PDF generation failed: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
        setLoadingMsg('');
      }
    }
  };

  const handleOpenPrintWindow = async (autoPrint = false) => {
    const targetCount = parseInt(count, 10);
    if (isNaN(targetCount) || targetCount < 1) {
      toast.error('Please enter a valid count greater than 0');
      return;
    }

    const data = await fetchPasses(targetCount);
    if (data && data.length > 0) {
      try {
        setLoading(true);
        setLoadingMsg(`Generating pass PDF (1/${data.length})...`);
        await openPassesPdfPreview(data, event, {
          autoPrint,
          onProgress: (curr, tot) => {
            setLoadingMsg(`Generating pass PDF (${curr}/${tot})...`);
          },
        });
        toast.success(`Opened pass-only PDF preview (${data.length} passes) with zero background!`);
      } catch (err) {
        console.error('Pass preview error, falling back to print window:', err);
        triggerPdfPrintWindow(data);
      } finally {
        setLoading(false);
        setLoadingMsg('');
      }
    }
  };

  const handleDownloadA4Sheet = async () => {
    const targetCount = parseInt(count, 10);
    if (isNaN(targetCount) || targetCount < 1) {
      toast.error('Please enter a valid count greater than 0');
      return;
    }

    const data = await fetchPasses(targetCount);
    if (data && data.length > 0) {
      try {
        setLoading(true);
        setLoadingMsg(`Generating A4 print sheets (1/${data.length})...`);
        await downloadA4SheetPdf(data, event, (curr, tot) => {
          setLoadingMsg(`Generating A4 print sheets (${curr}/${tot})...`);
        });
        toast.success(`Downloaded ${data.length} passes on A4 print sheets!`);
        onClose();
      } catch (err) {
        console.error('A4 sheet PDF error:', err);
        toast.error('Failed to generate A4 print sheets.');
      } finally {
        setLoading(false);
        setLoadingMsg('');
      }
    }
  };

  const handlePreview = async () => {
    const targetCount = parseInt(count, 10);
    if (isNaN(targetCount) || targetCount < 1) {
      toast.error('Please enter a valid count');
      return;
    }

    const previewLimit = Math.min(targetCount, 20);
    const data = await fetchPasses(previewLimit);
    if (data && data.length > 0) {
      setPreviewPasses(data);
      setActiveTab('preview');
      toast.success(`Loaded preview of ${data.length} passes`);
    }
  };

  const presetCounts = [5, 10, 25, 50, 100, 250, 500];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl shadow-md">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  Bulk Full Pass Download (PDF)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                  Full Graphic Pass
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Event:{' '}
                <span className="font-semibold text-purple-700">{event.name}</span> (
                {event.eventCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-gray-100 bg-gray-50 px-5 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('download')}
            className={`pb-2.5 px-1 text-xs font-bold border-b-2 transition ${activeTab === 'download'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
          >
            Download Settings
          </button>
          <button
            type="button"
            onClick={() => {
              if (previewPasses.length === 0) {
                handlePreview();
              } else {
                setActiveTab('preview');
              }
            }}
            className={`pb-2.5 px-1 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${activeTab === 'preview'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Pass Preview ({previewPasses.length > 0 ? previewPasses.length : count})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'download' ? (
            <>
              {/* Count Input Box */}
              <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    How many full passes to download?
                  </label>
                  {totalAvailable > 0 && (
                    <span className="text-[11px] text-gray-500">
                      Total: <strong className="text-gray-700">{totalAvailable}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max={totalAvailable > 0 ? totalAvailable : 5000}
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    placeholder="e.g. 10"
                    className="flex-1 px-4 py-2.5 text-base font-bold text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  />
                  <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
                    passes to PDF
                  </div>
                </div>

                {/* Quick Count Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-gray-500">Quick set:</span>
                  {presetCounts.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCount(val)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${Number(count) === val
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      {val}
                    </button>
                  ))}
                  {totalAvailable > 0 && (
                    <button
                      type="button"
                      onClick={() => setCount(totalAvailable)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${Number(count) === totalAvailable
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-50'
                        }`}
                    >
                      All ({totalAvailable})
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-purple-700 transition"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
                  <span>Optional Filters (Category & Status)</span>
                  {showAdvanced ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">
                          Pass Category
                        </label>
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full text-xs py-2 px-3 bg-white border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        >
                          {categoryOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-700 block mb-1">
                          Pass Status
                        </label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full text-xs py-2 px-3 bg-white border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="NOT_ACTIVATED">Available (Not Activated)</option>
                          <option value="ACTIVATED">Activated (Claimed)</option>
                          <option value="REVOKED">Revoked</option>
                        </select>
                      </div>
                    </div>

                    {/* Sequence range */}
                    <div className="pt-2 border-t border-gray-200">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={useRange}
                          onChange={(e) => setUseRange(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                        />
                        Filter by Sequence Range
                      </label>
                      {useRange && (
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <input
                            type="number"
                            placeholder="From Seq (e.g. 1)"
                            value={fromSeq}
                            onChange={(e) => setFromSeq(e.target.value)}
                            className="text-xs p-2 border border-gray-300 rounded-lg bg-white"
                          />
                          <input
                            type="number"
                            placeholder="To Seq (e.g. 50)"
                            value={toSeq}
                            onChange={(e) => setToSeq(e.target.value)}
                            className="text-xs p-2 border border-gray-300 rounded-lg bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Informational Banner */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
                <Printer className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">PDF Format:</strong> Each full pass includes the
                  front badge artwork (with event dates & venue) and back badge artwork (with QR code
                  and category strip). They are formatted 1 pass per page so you can print or Save
                  as PDF directly.
                </div>
              </div>
            </>
          ) : (
            /* Pass Preview Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-semibold">
                  Showing {previewPasses.length} full pass previews:
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await openPassesPdfPreview(previewPasses, event, { autoPrint: false });
                    } catch (e) {
                      console.error('Preview error:', e);
                      triggerPdfPrintWindow(previewPasses);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" /> View Pass-Only PDF
                </button>
              </div>

              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  <span className="text-xs text-gray-500 font-medium">{loadingMsg}</span>
                </div>
              ) : previewPasses.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 border border-dashed rounded-xl">
                  No preview loaded. Click below to load passes preview.
                </div>
              ) : (
                <div className="space-y-6 max-h-[50vh] overflow-y-auto p-2 bg-gray-100 rounded-xl">
                  {previewPasses.map((p, idx) => {
                    const qrUrl = getQrUrl(p);
                    const seq = p.sequenceNumber
                      ? String(p.sequenceNumber).padStart(4, '0')
                      : p.passNumber?.split('-')?.pop() || '';
                    const cat = p.categoryName || p.category || p.categoryCode || 'GENERAL';

                    return (
                      <div key={p.id || idx} className="space-y-1">
                        <div className="flex items-center justify-between px-2 text-[11px] font-bold text-gray-600">
                          <span>Pass #{idx + 1}</span>
                          <span className="font-mono">{p.passNumber}</span>
                        </div>
                        <BulkDownloadPass
                          qrImageUrl={qrUrl}
                          seatOrSeq={seq}
                          category={cat}
                          validDays={p.validDays || []}
                          eventDate={formatEventDateStr()}
                          eventVenue={event.venue || ''}
                          showWrapper={false}
                          cardStyle={{ margin: '0 auto', maxWidth: '480px' }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {activeTab === 'download' && (
              <button
                type="button"
                onClick={handlePreview}
                disabled={loading}
                className="px-3 py-2 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenPrintWindow(false)}
              disabled={loading}
              className="px-3 py-2 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              title="Open pass-only PDF preview with zero white background"
            >
              <Eye className="w-3.5 h-3.5 text-purple-600" />
              Preview Pass PDF
            </button>

            <button
              type="button"
              onClick={handleDownloadA4Sheet}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              title="Print 3 passes per A4 page with cut guides"
            >
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              A4 Print Sheet (3/page)
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{loadingMsg || 'Processing...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Passes (PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkFullPassDownloadModal;

