import React from 'react';
// import forDivImg from '../../assets/for div.png';
// import forDiv2Img from '../../assets/for div2.png';
import RCFPassBack from '../../assets/RCF Pass back.png'

/**
 * PassEmailTemplate
 *
 * Renders a fully responsive email-style pass card.
 * Uses RCFPassBack image as background with only a QR code overlay.
 *
 * Props:
 *  - qrImageUrl : string  (data-URL or hosted URL for the QR code image)
 */
const PassEmailTemplate = ({
  qrImageUrl = null,
}) => {
  return (
    /* ── Outer page wrapper ─────────────────────────────────────── */
    <div
      style={{
        backgroundColor: '#f3f4f6',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 32px) clamp(8px, 2vw, 16px)',
        fontFamily: "'Telegraf', 'Segoe UI', Arial, sans-serif",
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Card ──────────────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          minWidth: '280px',
          backgroundColor: '#ffffff',
          // borderRadius: 'clamp(8px, 2vw, 16px)',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          boxSizing: 'border-box',
        }}
      >
        {/* ── RCF Pass Back image + QR overlay ─────────────────────── */}
        <div style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
          <img
            src={RCFPassBack}
            alt="RCF Pass"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'cover',
            }}
          />

          {/* QR Code — absolutely positioned inside the right-side box on the image */}
          <div
            style={{
              position: 'absolute',
              top: '22%',
              right: '10%',
              width: '17%',
              aspectRatio: '1 / 1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {qrImageUrl ? (
              <img
                src={qrImageUrl}
                alt="QR Code"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(5px, 1.8vw, 11px)',
                  fontWeight: '700',
                  color: '#1a1a1a',
                }}
              >
                QR
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};


export default PassEmailTemplate;
