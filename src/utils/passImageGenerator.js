import { BrowserQRCodeSvgWriter } from '@zxing/browser';
import frontPassImg from '../assets/14.png';
import backPassImg from '../assets/final.png';

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const buildDateLabel = (days) => {
  if (!days || days.length === 0) return '';
  const parsed = days
    .filter((d) => d.eventDate)
    .map((d) => {
      const dt = new Date(d.eventDate + 'T00:00:00');
      return {
        day: dt.getDate(),
        month: dt.toLocaleString('en-US', { month: 'long' }).toUpperCase(),
        year: dt.getFullYear(),
      };
    });

  if (parsed.length === 0) return '';
  if (parsed.length === 1) {
    const p = parsed[0];
    return `${ordinal(p.day)} ${p.month}, ${p.year}`;
  }

  const allSameMonth = parsed.every(
    (p) => p.month === parsed[0].month && p.year === parsed[0].year
  );

  if (allSameMonth) {
    return `${parsed.map((p) => ordinal(p.day)).join(', ')} ${parsed[0].month}, ${parsed[0].year}`;
  }

  return `${parsed.map((p) => `${ordinal(p.day)} ${p.month}`).join(', ')}, ${parsed[parsed.length - 1].year}`;
};

const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image asset: ${src}`));
    img.src = src;
  });
};

const generateQrCodeImage = async (text, width, height) => {
  try {
    const writer = new BrowserQRCodeSvgWriter();
    const svgElement = writer.write(text, width, height);
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    return await loadImage(svgDataUrl);
  } catch (err) {
    console.warn('ZXing QR code render failed, attempting fallback API:', err);
    try {
      const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${width}x${height}&data=${encodeURIComponent(text)}`;
      return await loadImage(fallbackUrl);
    } catch {
      return null;
    }
  }
};

const isNoQrPass = (passData) => {
  if (!passData) return false;
  if (passData.qrRequired === false) return true;
  if (passData.activationMode === 'NO_QR_WALK_IN') return true;
  const cat = (passData.category || passData.categoryName || passData.categoryCode || '').toUpperCase();
  const num = (passData.passNumber || '').toUpperCase();
  return cat.includes('VIP') || cat.includes('NO_QR') || num.includes('VIP');
};

/**
 * generatePassCanvas
 * Renders the composite pass (Front + Back) with all dynamic overlays.
 * Returns an HTMLCanvasElement.
 */
export const generatePassCanvas = async (passData = {}, attendeeData = {}) => {
  const [frontImg, backImg] = await Promise.all([
    loadImage(frontPassImg),
    loadImage(backPassImg),
  ]);

  const width = frontImg.naturalWidth || 1826;
  const frontHeight = frontImg.naturalHeight || 686;
  const backHeight = backImg.naturalHeight || 686;
  const totalHeight = frontHeight + backHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');

  // Smooth rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw Front Pass
  ctx.drawImage(frontImg, 0, 0, width, frontHeight);

  // Date overlay on front pass
  const dateText = buildDateLabel(passData.validDays);
  if (dateText) {
    ctx.font = "300 24px 'Telegraf', 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = '#000000';
    ctx.letterSpacing = '0.5px';
    ctx.fillText(dateText, width * 0.42, frontHeight * (1 - 0.22));
  }

  // 2. Draw Back Pass
  const backOffsetY = frontHeight;
  ctx.drawImage(backImg, 0, backOffsetY, width, backHeight);

  // 3. QR Code or Badge No-QR
  const noQr = isNoQrPass(passData);
  const qrBoxWidth = Math.round(width * 0.15); // ~274px
  const qrBoxHeight = qrBoxWidth;
  const qrBoxX = Math.round(width - width * 0.095 - qrBoxWidth);
  const qrBoxY = Math.round(backOffsetY + backHeight * 0.20);

  if (noQr) {
    // Draw badge placeholder
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
    ctx.font = "bold 34px 'Poppins', 'Segoe UI', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('BADGE', qrBoxX + qrBoxWidth / 2, qrBoxY + qrBoxHeight / 2 - 10);

    ctx.fillStyle = '#b45309';
    ctx.font = "bold 24px 'Poppins', 'Segoe UI', sans-serif";
    ctx.fillText('NO QR', qrBoxX + qrBoxWidth / 2, qrBoxY + qrBoxHeight / 2 + 30);
  } else {
    // Generate QR
    const qrIdentifier = passData.passNumber || attendeeData?.passNumber || passData.rawToken || 'EVENT-PASS';
    const activationUrl = `${window.location.origin}/activate/${encodeURIComponent(qrIdentifier)}`;
    const qrImg = await generateQrCodeImage(activationUrl, qrBoxWidth, qrBoxHeight);
    if (qrImg) {
      ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrBoxWidth, qrBoxHeight);
    }
  }

  // 4. Category Badge (upper brown strip)
  const catBoxWidth = Math.round(width * 0.22);
  const catBoxHeight = Math.round(backHeight * 0.09);
  const catBoxX = Math.round(width - width * 0.055 - catBoxWidth);
  const catBoxY = Math.round(backOffsetY + backHeight * (1 - 0.26 - 0.09));

  const categoryName = (
    passData.categoryName ||
    passData.categoryCode ||
    passData.category ||
    'STUDENT'
  ).toUpperCase();

  ctx.font = "900 32px 'Poppins', 'Segoe UI', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Text shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillText(categoryName, catBoxX + catBoxWidth / 2 + 2, catBoxY + catBoxHeight / 2 + 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(categoryName, catBoxX + catBoxWidth / 2, catBoxY + catBoxHeight / 2);

  // 5. Serial Number Badge (lower brown strip)
  const seq = passData.sequenceNumber || attendeeData?.sequenceNumber || 1;
  const seqFormatted = String(seq).padStart(4, '0');
  const serialText = `#${seqFormatted}`;

  const serialBoxWidth = catBoxWidth;
  const serialBoxHeight = catBoxHeight;
  const serialBoxX = catBoxX;
  const serialBoxY = Math.round(backOffsetY + backHeight * (1 - 0.17 - 0.09));

  ctx.font = "800 30px 'Poppins', 'Segoe UI', sans-serif";
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillText(serialText, serialBoxX + serialBoxWidth / 2 + 2, serialBoxY + serialBoxHeight / 2 + 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(serialText, serialBoxX + serialBoxWidth / 2, serialBoxY + serialBoxHeight / 2);

  // 6. Rotated Sequence Number on Left Strip
  ctx.save();
  ctx.translate(Math.round(width * 0.03), Math.round(backOffsetY + backHeight * 0.70));
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#121212';
  ctx.font = "900 24px 'Poppins', 'Segoe UI', sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(serialText, 0, 0);
  ctx.restore();

  return canvas;
};

/**
 * generatePassImageBlob
 * Generates PNG Blob for upload to backend
 */
export const generatePassImageBlob = async (passData, attendeeData) => {
  const canvas = await generatePassCanvas(passData, attendeeData);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/png',
      0.95
    );
  });
};

/**
 * generatePassImageDataUrl
 * Generates Data URL for display or download
 */
export const generatePassImageDataUrl = async (passData, attendeeData) => {
  const canvas = await generatePassCanvas(passData, attendeeData);
  return canvas.toDataURL('image/png', 0.95);
};
