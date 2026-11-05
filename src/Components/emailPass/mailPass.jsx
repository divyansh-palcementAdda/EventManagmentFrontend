import React from 'react';
import forDivImg from '../../assets/for div.png';
import forDiv2Img from '../../assets/for div2.png';

/**
 * PassEmailTemplate
 *
 * Renders a fully responsive email-style pass card.
 * All fields are dynamic via props so the same component works
 * for previews, print, and actual email generation.
 *
 * Props:
 *  - attendeeName   : string
 *  - attendeeEmail  : string
 *  - passCode       : string  (unique pass identifier / QR value)
 *  - passCategory   : string  (e.g. "VIP", "General", "Speaker")
 *  - eventName      : string
 *  - eventDate      : string  (formatted, e.g. "Dec 10 – Dec 12, 2026")
 *  - eventVenue     : string
 *  - seatOrSeq      : string  (seat / sequence / badge number)
 *  - validDays      : string  (e.g. "All Days" or "Day 1, Day 2")
 *  - organizerName  : string
 *  - organizerEmail : string
 *  - qrImageUrl     : string  (data-URL or hosted URL for the QR code image)
 *  - logoUrl        : string  (optional organiser logo URL)
 *  - termsAndConditions : string[]  (optional custom T&C list; falls back to defaults)
 */
const PassEmailTemplate = ({
  attendeeName = 'John Doe',
  attendeeEmail = 'johndoe@example.com',
  passCode = 'EVT-2026-00001',
  passCategory = 'General Admission',
  eventName = 'Annual Tech Summit 2026',
  eventDate = 'December 10 – 12, 2026',
  eventVenue = 'RENAISSANCE UNIVERSITY CAMPUS, INDORE',
  seatOrSeq = '001',
  validDays = 'All Days',
  organizerName = 'Events Co.',
  organizerEmail = 'events@example.com',
  qrImageUrl = null,
  logoUrl = null,
  termsAndConditions = null,
}) => {
  const defaultTerms = [
    'Entry is permitted only with a valid event pass.',
    'Each pass is valid for one person only and is non-transferable.',
    'Please carry a valid government-issued photo ID for verification.',
    'Re-entry is subject to event management approval.',
    'The organisers reserve the right to deny entry or make changes to the event schedule without prior notice.',
  ];
  const terms = termsAndConditions || defaultTerms;
  return (
    /* ── Outer page wrapper ─────────────────────────────────────── */
    <div
      style={{
        backgroundColor: '#f3f4f6',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: "'Telegraf', 'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* ── Card ──────────────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        }}
      >
        {/* ── Hero banner image ─────────────────────────────────── */}
        <div style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
          <img
            src={forDivImg}
            alt="Event pass banner"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'cover',
            }}
          />
          {/* Date + Venue overlay — right half, vertically centered-bottom, black text */}
          <div
            style={{
              position: 'absolute',
              top: '55%',
              left: '52%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            {/* Date */}
            <p
              style={{
                margin: '0',
                color: '#1a1a1a',
                fontSize: '13px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                lineHeight: 1.4,
              }}
            >
              {eventDate}
            </p>

            {/* Venue — first 2 words on line 1, rest on line 2 */}
            <p
              style={{
                margin: '0',
                color: '#1a1a1a',
                fontSize: '13px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                lineHeight: 1.4,
              }}
            >
              {(() => {
                const words = eventVenue.split(' ');
                const line1 = words.slice(0, 2).join(' ');
                const line2 = words.slice(2).join(' ');
                return (
                  <>
                    {line1}
                    {line2 && <><br />{line2}</>}
                  </>
                );
              })()}
            </p>
          </div>
        </div>

        {/* ── Second banner image + T&C overlay ────────────────── */}
        <div style={{ position: 'relative', width: '100%', lineHeight: 0, marginTop: '8px' }}>
          <img
            src={forDiv2Img}
            alt="Event pass banner 2"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'cover',
            }}
          />

          {/* T&C — absolutely positioned over the bottom half of the second image */}
          <div
            style={{
              position: 'absolute',
              bottom: '6%',
              left: '14%',
              right: '18%',
            }}
          >
            {/* Heading */}
            <p
              style={{
                margin: '0 0 4px 0',
                fontSize: '10px',
                fontWeight: '700',
                color: '#1a1a1a',
                textDecoration: 'underline',
                fontFamily: "'Telegraf', 'Segoe UI', Arial, sans-serif",
                lineHeight: 1.3,
              }}
            >
              Terms &amp; Conditions – {eventName}
            </p>

            {/* Bullet list */}
            <ul style={{ margin: '0', padding: '0', listStyle: 'none' }}>
              {terms.map((term, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '5px',
                    marginBottom: '2px',
                    fontSize: '8.5px',
                    color: '#1a1a1a',
                    lineHeight: '1.4',
                    fontFamily: "'Telegraf', 'Segoe UI', Arial, sans-serif",
                  }}
                >
                  <span style={{ fontSize: '10px', lineHeight: '1.2', flexShrink: 0 }}>•</span>
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};


export default PassEmailTemplate;
