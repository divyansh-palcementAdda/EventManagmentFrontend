import { jsPDF } from 'jspdf';
import backpass from '../assets/final.png';
import { formatPassDisplayDate } from '../Components/emailPass/bulkDownloadpass';

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
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn('Failed to load image for pass:', src);
      resolve(null);
    };
    img.src = src;
  });
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
  const cat = (
    pass.categoryName ||
    pass.category ||
    pass.categoryCode ||
    pass.passCategoryName ||
    pass.passCategoryCode ||
    ''
  ).toUpperCase();
  return cat.includes('VIP') || cat.includes('NO_QR');
};

/**
 * Render a single pass onto a 1826x686 HTML5 canvas
 */
export const renderPassToCanvas = async (pass, bgImg, event = {}) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1826;
  canvas.height = 686;
  const ctx = canvas.getContext('2d');

  // 1. Draw base pass background
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, 1826, 686);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1826, 686);
  }

  const noQr = isNoQrPass(pass);
  const qrUrl = !noQr ? getPassQrUrl(pass) : null;
  const qrImg = qrUrl ? await loadImage(qrUrl) : null;

  // Coordinate calculations matching PassImageService (1826 x 686)
  const qrBoxWidth = Math.round(1826 * 0.15); // ~274px
  const qrBoxHeight = qrBoxWidth;
  const qrBoxX = Math.round(1826 - 1826 * 0.095 - qrBoxWidth); // ~1378px
  const qrBoxY = Math.round(686 * 0.2); // ~137px

  // 2. Draw QR code or No-QR Amber Badge
  if (noQr || !qrImg) {
    if (noQr) {
      // Draw amber badge box
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight, 16);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 24px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('WALK-IN', qrBoxX + qrBoxWidth / 2, qrBoxY + qrBoxHeight / 2 - 14);
      ctx.font = 'bold 16px Arial, Helvetica, sans-serif';
      ctx.fillText('NO QR REQUIRED', qrBoxX + qrBoxWidth / 2, qrBoxY + qrBoxHeight / 2 + 16);
    }
  } else if (qrImg) {
    ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight);
  }

  // 3. Category Badge Text
  const cat = (
    pass.categoryName ||
    pass.category ||
    pass.categoryCode ||
    pass.passCategoryName ||
    ''
  ).toUpperCase();

  const catBoxWidth = Math.round(1826 * 0.22); // ~402px
  const catBoxHeight = Math.round(686 * 0.09); // ~62px
  const catBoxX = Math.round(1826 - 1826 * 0.055 - catBoxWidth); // ~1324px
  const catBoxY = Math.round(686 * (1.0 - 0.26 - 0.09)); // ~446px

  // 3. Category Badge (Upper box)
  if (cat) {
    ctx.save();
    ctx.font = 'bold 32px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(cat, catBoxX + catBoxWidth / 2, catBoxY + catBoxHeight / 2);
    ctx.restore();
  }

  // 4. Serial Number Badge (Middle box)
  const serialBoxWidth = catBoxWidth;
  const serialBoxHeight = catBoxHeight;
  const serialBoxX = catBoxX;
  const serialBoxY = Math.round(686 * (1.0 - 0.17 - 0.09)); // ~508px

  if (seqBadge) {
    ctx.save();
    ctx.font = 'bold 32px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(seqBadge, serialBoxX + serialBoxWidth / 2, serialBoxY + serialBoxHeight / 2);
    ctx.restore();
  }

  // 5. Date Badge (Lower box)
  const dateBoxWidth = catBoxWidth;
  const dateBoxHeight = catBoxHeight;
  const dateBoxX = catBoxX;
  const dateBoxY = Math.round(686 * (1.0 - 0.08 - 0.09)); // ~570px

  const formattedDate = formatPassDisplayDate(pass.validDays, event);
  if (formattedDate) {
    ctx.save();
    ctx.font = 'bold 26px Arial, Helvetica, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(formattedDate, dateBoxX + dateBoxWidth / 2, dateBoxY + dateBoxHeight / 2);
    ctx.restore();
  }

  // 6. Left Sequence Strip (Rotated -90 degrees on left strip)
  if (seqBadge) {
    ctx.save();
    ctx.translate(34, 620);
    ctx.rotate(-Math.PI / 2);
    ctx.font = 'bold 22px Arial, Helvetica, sans-serif';
    ctx.fillStyle = '#121212';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(seqBadge, 0, 0);
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

  const total = passList.length;

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);

    const pass = passList[i];
    const canvas = await renderPassToCanvas(pass, bgImg, event);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      doc.addPage([PASS_HEIGHT_MM, PASS_WIDTH_MM], 'landscape');
    }

    doc.addImage(dataUrl, 'JPEG', 0, 0, PASS_WIDTH_MM, PASS_HEIGHT_MM, undefined, 'FAST');
  }

  return doc;
};

/**
 * Generate a standalone PDF containing ONLY the passes and trigger file download
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

  const total = passList.length;

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);

    const slotIndex = i % passesPerPage;
    if (i > 0 && slotIndex === 0) {
      doc.addPage('a4', 'portrait');
    }

    const pass = passList[i];
    const canvas = await renderPassToCanvas(pass, bgImg);
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
