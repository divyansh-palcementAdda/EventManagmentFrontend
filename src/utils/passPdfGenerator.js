import { jsPDF } from 'jspdf';
import backpass from '../assets/final.png';
import { formatPassDisplayDate } from '../Components/emailPass/bulkDownloadpass';

/**
 * Preload an image from a URL or Base64 into an HTMLImageElement
 */
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
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

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 10]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BADGE', qrBoxX + qrBoxWidth / 2, qrBoxY + qrBoxHeight / 2 - 16);

      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 26px Arial, Helvetica, sans-serif';
      ctx.fillText('NO QR', qrBoxX + qrBoxWidth / 2, qrBoxY + qrBoxHeight / 2 + 24);
    } else if (qrImg) {
      ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight);
    }
  } else {
    ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight);
  }

  // Pass details
  const seq = pass.sequenceNumber
    ? String(pass.sequenceNumber).padStart(4, '0')
    : pass.passNumber?.split('-')?.pop() || '';
  const seqBadge = seq ? (seq.startsWith('#') ? seq : `#${seq}`) : '';
  const cat = (
    pass.categoryName ||
    pass.category ||
    pass.categoryCode ||
    'GENERAL'
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
 * Generate a standalone PDF containing ONLY the passes (exact pass dimensions, 0mm margin, zero blank background)
 *
 * @param {Array} passList Array of pass objects
 * @param {Object} event Event object
 * @param {Function} onProgress Optional progress callback (current, total)
 * @returns {Promise<jsPDF>} The generated jsPDF document
 */
export const generatePassesPdf = async (passList, event = {}, onProgress = null) => {
  if (!passList || passList.length === 0) {
    throw new Error('No passes provided for PDF generation');
  }

  // Preload base pass image
  const bgImg = await loadImage(backpass);

  // Exact pass dimensions in millimeters: 182.6mm width, 68.6mm height
  const passWidthMm = 182.6;
  const passHeightMm = 68.6;

  // Initialize jsPDF with exact custom format [height, width] in landscape mode
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [passHeightMm, passWidthMm],
    compress: true,
  });

  const total = passList.length;

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);

    const pass = passList[i];
    const canvas = await renderPassToCanvas(pass, bgImg, event);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    if (i > 0) {
      doc.addPage([passHeightMm, passWidthMm], 'landscape');
    }

    doc.addImage(dataUrl, 'JPEG', 0, 0, passWidthMm, passHeightMm, undefined, 'FAST');
  }

  const sanitizedEventName = (event?.eventCode || event?.name || 'Event')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${sanitizedEventName}_Passes_${total}.pdf`;

  doc.save(filename);
  return doc;
};

export default generatePassesPdf;
