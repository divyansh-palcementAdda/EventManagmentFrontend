import { jsPDF } from 'jspdf';
import { BrowserQRCodeSvgWriter } from '@zxing/browser';
import backpass from '../assets/back.png';
import { formatPassDisplayDate } from '../Components/emailPass/bulkDownloadpass';

/**
 * Helper to draw centered text with custom letter-spacing on an HTML5 canvas context.
 * Uses native ctx.letterSpacing when available, with a per-character fallback.
 */
export const drawTextWithLetterSpacing = (ctx, text, centerX, centerY, spacingPx = 0) => {
  if (!text) return;
  if ('letterSpacing' in ctx) {
    ctx.letterSpacing = `${spacingPx}px`;
    ctx.fillText(text, centerX, centerY);
    ctx.letterSpacing = '0px';
  } else {
    const chars = Array.from(text);
    const charWidths = chars.map((c) => ctx.measureText(c).width);
    const totalW = charWidths.reduce((a, b) => a + b, 0) + (chars.length - 1) * spacingPx;
    let curX = centerX - totalW / 2;
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], curX + charWidths[i] / 2, centerY);
      curX += charWidths[i] + spacingPx;
    }
  }
};

/**
 * Preload an image from a URL or Base64 into an HTMLImageElement
 */
const loadImage = (src) => {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    if (typeof src === 'string' && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('Failed to load image for pass:', typeof src === 'string' ? src.slice(0, 60) : src);
      resolve(null);
    };
    img.src = src;
  });
};

/**
 * Generate a QR code image element locally using ZXing SVG writer with fallback to online API
 */
export const generateQrImage = async (text, size = 300) => {
  if (!text) return null;
  try {
    const writer = new BrowserQRCodeSvgWriter();
    const svgElement = writer.write(text, size, size);
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    return await loadImage(svgDataUrl);
  } catch (err) {
    console.warn('Local ZXing QR generation failed, attempting fallback API:', err);
    try {
      const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
      return await loadImage(fallbackUrl);
    } catch {
      return null;
    }
  }
};

/**
 * Helper to build QR Code URL for a pass
 */
export const getPassQrUrl = (tokenOrPass) => {
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
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const activationUrl = `${origin}/activate/${encodeURIComponent(identifier)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    activationUrl
  )}`;
};

/**
 * Check if a pass is designated as NO-QR (e.g. VIP / NO_QR)
 */
export const isNoQrPass = (pass) => {
  if (!pass) return false;
  if (pass.qrRequired === false || pass.activationMode === 'NO_QR_WALK_IN') return true;
  const cat = (
    pass.categoryName ||
    pass.category ||
    pass.categoryCode ||
    pass.passCategoryName ||
    pass.passCategoryCode ||
    ''
  ).toUpperCase();
  const num = (pass.passNumber || '').toUpperCase();
  return cat.includes('VIP') || cat.includes('NO_QR') || num.includes('VIP');
};

/**
 * Render a single pass onto a 1826x686 HTML5 canvas
 */
export const renderPassToCanvas = async (pass, bgImg, event = {}, existingCanvas = null) => {
  const canvas = existingCanvas || document.createElement('canvas');
  if (canvas.width !== 1826 || canvas.height !== 686) {
    canvas.width = 1826;
    canvas.height = 686;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1826, 686);

  // 1. Draw base pass background
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, 1826, 686);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1826, 686);
  }

  const noQr = isNoQrPass(pass);
  let qrImg = null;

  if (!noQr) {
    if (pass.qrImageUrl || pass.qrCodeUrl) {
      qrImg = await loadImage(pass.qrImageUrl || pass.qrCodeUrl);
    }
    if (!qrImg) {
      const identifier =
        typeof pass === 'string'
          ? pass
          : pass?.rawToken ||
          pass?.passNumber ||
          pass?.qrData ||
          pass?.token ||
          pass?.id ||
          '';
      if (identifier) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
        const activationUrl = `${origin}/activate/${encodeURIComponent(identifier)}`;
        qrImg = await generateQrImage(activationUrl, 450);
      }
    }
  }

  // Coordinate calculations matching PassImageService (1826 x 686)
  const badgeAreaRight = Math.round(1826 * 0.945); // ~1725px (right edge of badge area)
  const badgeAreaLeft = Math.round(1826 * 0.735); // ~1341px (left edge of badge area)
  const clusterCenterX = (badgeAreaLeft + badgeAreaRight) / 2; // ~1533px (centered in badge area)
  const qrBoxWidth = Math.round(1826 * 0.22); // ~402px (increased from 15% to 22%)
  const qrBoxHeight = qrBoxWidth;
  const qrBoxX = clusterCenterX - qrBoxWidth / 2; // Center QR with text
  const qrBoxY = Math.round(686 * 0.12); // ~82px (moved up to create more space below)

  // 2. Draw QR code or No-QR Amber Badge
  if (noQr || !qrImg) {
    if (noQr) {
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight, 16);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      ctx.fillStyle = '#92400e';
      ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WALK-IN', clusterCenterX, qrBoxY + qrBoxHeight / 2 - 14);
      ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
      ctx.fillText('NO QR REQUIRED', clusterCenterX, qrBoxY + qrBoxHeight / 2 + 16);
    }
  } else if (qrImg) {
    ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight);
  }

  // 3. Category Badge Text (tight gap directly below QR)
  const cat = (
    pass.categoryName ||
    pass.category ||
    pass.categoryCode ||
    pass.passCategoryName ||
    pass.passCategoryCode ||
    'GENERAL'
  ).toUpperCase();

  const seq = pass.sequenceNumber
    ? String(pass.sequenceNumber).padStart(4, '0')
    : pass.passNumber?.split('-')?.pop() || '';
  const seqBadge = seq ? (seq.startsWith('#') ? seq : `#${seq}`) : '';

  if (cat) {
    ctx.save();
    let fontSize = 32;
    ctx.font = `bold ${fontSize}px 'Arial Black', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    const spacing = 4.0;
    const measuredW = ctx.measureText(cat).width + (cat.length - 1) * spacing;
    if (measuredW > 380) {
      fontSize = Math.max(18, Math.floor(fontSize * (380 / measuredW)));
      ctx.font = `bold ${fontSize}px 'Arial Black', Arial, sans-serif`;
    }
    drawTextWithLetterSpacing(ctx, cat, clusterCenterX, 495, spacing);
    ctx.restore();
  }

  // 4. Serial Number Badge (tight gap directly below Category)
  if (seqBadge) {
    ctx.save();
    let fontSize = 34;
    ctx.font = `bold ${fontSize}px 'Arial Black', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    const spacing = 1.5;
    drawTextWithLetterSpacing(ctx, seqBadge, clusterCenterX, 535, spacing);
    ctx.restore();
  }

  // 5. Date Badge (tight gap directly below Serial)
  const formattedDate = formatPassDisplayDate(pass.validDays, event);
  if (formattedDate) {
    ctx.save();
    let fontSize = 26;
    ctx.font = `bold ${fontSize}px 'Arial Black', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    const spacing = 0.8;
    const measuredW = ctx.measureText(formattedDate).width + (formattedDate.length - 1) * spacing;
    if (measuredW > 380) {
      fontSize = Math.max(16, Math.floor(fontSize * (380 / measuredW)));
      ctx.font = `bold ${fontSize}px 'Arial Black', Arial, sans-serif`;
    }
    drawTextWithLetterSpacing(ctx, formattedDate, clusterCenterX, 578, spacing);
    ctx.restore();
  }

  // 6. Left Sequence Strip (Rotated -90 degrees on left strip)
  if (seqBadge) {
    ctx.save();
    ctx.translate(34, 620);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "bold 22px 'Segoe UI', Roboto, Arial, sans-serif";
    ctx.fillStyle = '#121212';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    drawTextWithLetterSpacing(ctx, seqBadge, 0, 0, 1.0);
    ctx.restore();
  }

  return canvas;
};

/**
 * Exact pass dimensions in millimeters: 182.6mm width, 68.6mm height
 */
export const PASS_WIDTH_MM = 182.6;
export const PASS_HEIGHT_MM = 68.6;

/**
 * Build the jsPDF document containing ONLY the passes (exact pass dimensions, 0mm margin, zero blank background)
 */
export const createPassesPdfDoc = async (passList, event = {}, onProgress = null) => {
  if (!passList || passList.length === 0) {
    throw new Error('No passes provided for PDF generation');
  }

  const bgImg = await loadImage(backpass);
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PASS_HEIGHT_MM, PASS_WIDTH_MM],
    compress: true,
  });

  const canvas = document.createElement('canvas');
  canvas.width = 1826;
  canvas.height = 686;

  const total = passList.length;

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);

    const pass = passList[i];
    await renderPassToCanvas(pass, bgImg, event, canvas);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      doc.addPage([PASS_HEIGHT_MM, PASS_WIDTH_MM], 'landscape');
    }

    doc.addImage(dataUrl, 'JPEG', 0, 0, PASS_WIDTH_MM, PASS_HEIGHT_MM, undefined, 'FAST');

    // Yield to the UI loop every 5 passes to avoid freezing the browser on large downloads (e.g. 600 passes)
    if (i % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return doc;
};

/**
 * Generate a standalone PDF containing ONLY the passes and trigger direct file download
 */
export const generatePassesPdf = async (passList, event = {}, onProgress = null) => {
  const doc = await createPassesPdfDoc(passList, event, onProgress);
  const total = passList.length;
  const sanitizedEventName = (event?.eventCode || event?.name || 'Event')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${sanitizedEventName}_Passes_${total}.pdf`;
  doc.save(filename);
  return doc;
};

/**
 * Open the pass-only PDF directly in a new browser tab/window
 * ZERO white background, exact pass size (182.6mm x 68.6mm)
 * Optionally triggers print inside the PDF viewer
 */
export const openPassesPdfPreview = async (
  passList,
  event = {},
  { autoPrint = false, onProgress = null } = {}
) => {
  const doc = await createPassesPdfDoc(passList, event, onProgress);
  if (autoPrint) {
    doc.autoPrint();
  }
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
  return blobUrl;
};

/**
 * Generate an A4 Sheet PDF fitting 3 passes per A4 portrait page with light cut guidelines.
 * Ideal for physical printing onto standard A4 paper/cardstock without wasting paper.
 */
export const createA4SheetPdfDoc = async (passList, event = {}, onProgress = null) => {
  if (!passList || passList.length === 0) {
    throw new Error('No passes provided for A4 sheet PDF generation');
  }

  const bgImg = await loadImage(backpass);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
    compress: true,
  });

  const a4Width = 210;
  const a4Height = 297;
  const passW = PASS_WIDTH_MM; // 182.6 mm
  const passH = PASS_HEIGHT_MM; // 68.6 mm
  const marginX = (a4Width - passW) / 2; // ~13.7 mm
  const startY = 12; // top margin
  const gapY = 8; // gap between passes
  const passesPerPage = 3;

  const canvas = document.createElement('canvas');
  canvas.width = 1826;
  canvas.height = 686;

  const total = passList.length;

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);

    const slotIndex = i % passesPerPage;
    if (i > 0 && slotIndex === 0) {
      doc.addPage('a4', 'portrait');
    }

    const pass = passList[i];
    await renderPassToCanvas(pass, bgImg, event, canvas);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    const y = startY + slotIndex * (passH + gapY);

    // Draw pass image
    doc.addImage(dataUrl, 'JPEG', marginX, y, passW, passH, undefined, 'FAST');

    // Draw thin crop/cut guidelines around each pass
    doc.saveGraphicsState();
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(marginX, y, passW, passH);
    doc.restoreGraphicsState();

    if (i % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return doc;
};

/**
 * Generate A4 Sheet PDF and trigger file download
 */
export const downloadA4SheetPdf = async (passList, event = {}, onProgress = null) => {
  const doc = await createA4SheetPdfDoc(passList, event, onProgress);
  const total = passList.length;
  const sanitizedEventName = (event?.eventCode || event?.name || 'Event')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${sanitizedEventName}_A4_Print_Sheets_${total}.pdf`;
  doc.save(filename);
  return doc;
};

/**
 * Open A4 Sheet PDF directly in a new browser tab/window
 */
export const openA4SheetPdfPreview = async (
  passList,
  event = {},
  { autoPrint = false, onProgress = null } = {}
) => {
  const doc = await createA4SheetPdfDoc(passList, event, onProgress);
  if (autoPrint) {
    doc.autoPrint();
  }
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
  return blobUrl;
};

export default generatePassesPdf;
