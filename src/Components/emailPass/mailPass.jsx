import React from 'react';
import forDivImg from '../../assets/for div.png';         
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
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(5px, 1.4vw, 10px)',
                  fontWeight: '800',
                  color: '#92400e',
                  backgroundColor: '#fef3c7',
                  border: '1.5px dashed #f59e0b',
                  borderRadius: '6px',
                  textAlign: 'center',
                  padding: '2px',
                  lineHeight: '1.2',
                }}
              >
                <span>BADGE</span>
                <span style={{ fontSize: 'clamp(4px, 1vw, 8px)', fontWeight: '600', color: '#b45309' }}>NO QR</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};


export default PassEmailTemplate;
