import React from "react";

const EventReminderEmail = ({
  userName = "Abhishek Sharma",
  eventName = "Coffee Event 2026",
  eventDate = "25 November 2026",
  eventTime = "10:00 AM IST",
  venue = "Brilliant Convention Centre, Indore",
  passType = "VIP GUEST",
  passId = "#CE26-VIP-8849",
  activationLink = "#",
}) => {
  return (
    <div className="ere-body">
      <style>{`
        /* ─── Reset & Base ─── */
        .ere-body {
          width: 100%;
          padding: 32px 16px;
          background: #f2f6f3;
          box-sizing: border-box;
          font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
        }

        /* ─── Outer Card ─── */
        .ere-card {
          max-width: 620px;
          width: 100%;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #d8e8dc;
          overflow: hidden;
          color: #112217;
        }

        /* ══════════════════════════════
           1. TOP BRAND NAV BAR
        ══════════════════════════════ */
        .ere-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: #ffffff;
          border-bottom: 1px solid #e2ede5;
        }

        .ere-nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ere-nav-icon {
          width: 36px;
          height: 36px;
          background: #07261a;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .ere-nav-name {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #07261a;
          text-transform: uppercase;
          line-height: 1.2;
        }

        .ere-nav-sub {
          font-size: 10px;
          color: #52695c;
          letter-spacing: 0.04em;
          font-weight: 500;
        }

        .ere-nav-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #d1fae5;
          color: #047857;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid #a7f3d0;
          white-space: nowrap;
        }

        .ere-nav-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          flex-shrink: 0;
        }

        /* ══════════════════════════════
           2. TICKET / BOARDING PASS CARD
        ══════════════════════════════ */
        .ere-ticket {
          margin: 24px;
          border-radius: 14px;
          border: 1px solid #c8dece;
          overflow: visible;
        }

        /* — Ticket Header (dark fill) — */
        .ere-ticket-header {
          background: #07261a;
          padding: 20px 22px 22px;
          border-radius: 14px 14px 0 0;
        }

        .ere-ticket-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ere-ticket-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ere-pill-entry {
          background: rgba(16, 185, 129, 0.18);
          color: #6ee7b7;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .ere-ticket-fasttrack {
          font-size: 10px;
          color: #6ee7b7;
          opacity: 0.75;
          letter-spacing: 0.03em;
        }

        .ere-pill-vip {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 4px 11px;
          border-radius: 999px;
          border: 1px solid rgba(251, 191, 36, 0.35);
        }

        .ere-ticket-title {
          font-size: 22px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 4px;
          letter-spacing: -0.01em;
        }

        .ere-ticket-subtitle {
          font-size: 12px;
          color: #a7c4b4;
          letter-spacing: 0.04em;
          margin: 0;
        }

        /* — Logistics Row — */
        .ere-logistics {
          display: flex;
          background: #f4f8f4;
          border-top: 1px solid #c8dece;
        }

        .ere-logistics-col {
          flex: 1;
          padding: 16px 18px;
        }

        .ere-logistics-col:first-child {
          border-right: 1px solid #c8dece;
        }

        .ere-logistics-label {
          display: block;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #52695c;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .ere-logistics-icon-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .ere-logistics-icon {
          font-size: 15px;
          line-height: 1.4;
          flex-shrink: 0;
        }

        .ere-logistics-main {
          font-size: 13px;
          font-weight: 700;
          color: #0a3323;
          margin: 0 0 2px;
        }

        .ere-logistics-helper {
          font-size: 10px;
          color: #52695c;
          line-height: 1.5;
          margin: 0;
        }

        /* — Tear Line — */
        .ere-tearline {
          position: relative;
          height: 1px;
          margin: 0;
          border: none;
          display: flex;
          align-items: center;
        }

        .ere-tearline-track {
          flex: 1;
          border-top: 2px dashed #b4cfbc;
          margin: 0 20px;
        }

        .ere-notch {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f2f6f3;
          border: 1px solid #c8dece;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          margin: 0 -1px;
        }

        /* — Attendee Block — */
        .ere-attendee {
          padding: 20px 22px;
          background: #ffffff;
          border-radius: 0 0 14px 14px;
        }

        .ere-attendee-label {
          display: block;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #52695c;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .ere-attendee-name {
          font-size: 18px;
          font-weight: 800;
          color: #07261a;
          margin: 0 0 10px;
        }

        .ere-pass-id-pill {
          display: inline-block;
          background: #f4f8f4;
          border: 1px solid #c8dece;
          border-radius: 8px;
          padding: 6px 14px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          font-weight: 700;
          color: #0a3323;
          letter-spacing: 0.03em;
          margin-bottom: 18px;
        }

        .ere-pass-id-verified {
          color: #10b981;
          font-weight: 700;
        }

        .ere-cta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          padding-top: 16px;
          border-top: 1px dashed #c8dece;
        }

        .ere-cta-text {
          font-size: 11px;
          color: #52695c;
          line-height: 1.6;
          flex: 1;
          min-width: 140px;
        }

        .ere-cta-btn {
          display: inline-block;
          background: #07261a;
          color: #ffffff !important;
          text-decoration: none;
          padding: 11px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.01em;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ══════════════════════════════
           3. DAY-OF ARRIVAL GRID
        ══════════════════════════════ */
        .ere-logistics-grid {
          display: flex;
          gap: 14px;
          margin: 0 24px 20px;
          flex-wrap: wrap;
        }

        .ere-logistics-card {
          flex: 1;
          min-width: 200px;
          background: #f4f8f4;
          border: 1px solid #d8e8dc;
          border-radius: 12px;
          padding: 18px 16px;
        }

        .ere-logistics-card-icon-wrap {
          width: 36px;
          height: 36px;
          background: #07261a;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 17px;
          margin-bottom: 12px;
        }

        .ere-logistics-card-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #0a3323;
          text-transform: uppercase;
          margin: 0 0 6px;
        }

        .ere-logistics-card-body {
          font-size: 12px;
          color: #52695c;
          line-height: 1.65;
          margin: 0;
        }

        /* ══════════════════════════════
           4. GATE ADVISORY CALLOUT
        ══════════════════════════════ */
        .ere-advisory {
          margin: 0 24px 24px;
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 12px;
          padding: 16px 18px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .ere-advisory-icon {
          font-size: 20px;
          flex-shrink: 0;
          line-height: 1.3;
        }

        .ere-advisory-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #92400e;
          text-transform: uppercase;
          margin: 0 0 4px;
        }

        .ere-advisory-body {
          font-size: 12px;
          color: #78350f;
          line-height: 1.65;
          margin: 0;
        }

        /* ══════════════════════════════
           5. FOOTER
        ══════════════════════════════ */
        .ere-footer {
          background: #f4f8f4;
          border-top: 1px solid #d8e8dc;
          padding: 24px 24px 20px;
          text-align: center;
        }

        .ere-footer-org {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #047857;
          text-transform: uppercase;
          margin: 0 0 8px;
        }

        .ere-footer-support {
          font-size: 11px;
          color: #52695c;
          line-height: 1.65;
          margin: 0 0 14px;
        }

        .ere-footer-support a {
          color: #047857;
          text-decoration: none;
          font-weight: 600;
        }

        .ere-footer-links {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 6px 0;
          margin-bottom: 14px;
        }

        .ere-footer-link {
          font-size: 10px;
          color: #047857;
          text-decoration: none;
          font-weight: 600;
          letter-spacing: 0.03em;
        }

        .ere-footer-sep {
          font-size: 10px;
          color: #a3b8a8;
          margin: 0 8px;
        }

        .ere-footer-legal {
          font-size: 10px;
          color: #7a9480;
          line-height: 1.6;
          margin: 0;
        }

        /* ══════════════════════════════
           MOBILE RESPONSIVE
        ══════════════════════════════ */
        @media screen and (max-width: 600px) {
          .ere-body {
            padding: 12px 8px;
          }

          .ere-card {
            border-radius: 14px;
          }

          .ere-nav {
            padding: 12px 16px;
          }

          .ere-nav-name {
            font-size: 11px;
          }

          .ere-ticket {
            margin: 16px;
          }

          .ere-ticket-header {
            padding: 16px;
          }

          .ere-ticket-title {
            font-size: 18px;
          }

          .ere-logistics {
            flex-direction: column;
          }

          .ere-logistics-col:first-child {
            border-right: none;
            border-bottom: 1px solid #c8dece;
          }

          .ere-logistics-grid {
            margin: 0 16px 16px;
            flex-direction: column;
          }

          .ere-advisory {
            margin: 0 16px 16px;
          }

          .ere-cta-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .ere-cta-btn {
            width: 100%;
            text-align: center;
          }

          .ere-attendee {
            padding: 16px;
          }

          .ere-footer {
            padding: 20px 16px;
          }
        }
      `}</style>

      <div className="ere-card">

        {/* ── 1. BRAND NAV BAR ── */}
        <div className="ere-nav">
          <div className="ere-nav-brand">
            <div className="ere-nav-icon">☕</div>
            <div>
              <div className="ere-nav-name">Coffee Expo 2026</div>
              <div className="ere-nav-sub">Global Roasters Summit · Indore</div>
            </div>
          </div>
          <div className="ere-nav-badge">
            <span className="ere-nav-dot" />
            Event Reminder
          </div>
        </div>

        {/* ── 2. TICKET / BOARDING PASS ── */}
        <div className="ere-ticket">

          {/* Dark Header */}
          <div className="ere-ticket-header">
            <div className="ere-ticket-header-row">
              <div className="ere-ticket-header-left">
                <span className="ere-pill-entry">Official Entry Pass</span>
                <span className="ere-ticket-fasttrack">Fast-Track Gate</span>
              </div>
              <span className="ere-pill-vip">{passType}</span>
            </div>
            <p className="ere-ticket-title">{eventName}</p>
            <p className="ere-ticket-subtitle">Indore Specialty Roasters Conclave</p>
          </div>

          {/* Logistics Row */}
          <div className="ere-logistics">
            <div className="ere-logistics-col">
              <span className="ere-logistics-label">Event Date &amp; Time</span>
              <div className="ere-logistics-icon-row">
                <span className="ere-logistics-icon">📅</span>
                <div>
                  <p className="ere-logistics-main">{eventDate}</p>
                  <p className="ere-logistics-helper">{eventTime} (Entry from 09:00 AM)</p>
                </div>
              </div>
            </div>
            <div className="ere-logistics-col">
              <span className="ere-logistics-label">Venue &amp; Location</span>
              <div className="ere-logistics-icon-row">
                <span className="ere-logistics-icon">📍</span>
                <div>
                  <p className="ere-logistics-main">Brilliant Convention Centre</p>
                  <p className="ere-logistics-helper">Scheme 78, Part II, Vijay Nagar, Indore, MP</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tear Line */}
          <div className="ere-tearline">
            <div className="ere-notch" />
            <div className="ere-tearline-track" />
            <div className="ere-notch" />
          </div>

          {/* Attendee Block */}
          <div className="ere-attendee">
            <span className="ere-attendee-label">Attendee Name</span>
            <p className="ere-attendee-name">{userName}</p>
            <div className="ere-pass-id-pill">
              Pass ID: {passId} · <span className="ere-pass-id-verified">✓ Verified</span>
            </div>

            <div className="ere-cta-row">
              <p className="ere-cta-text">
                Need to view or save your full badge? Tap below to open your secure digital QR pass.
              </p>
              <a href={activationLink} className="ere-cta-btn">
                View My Event Pass →
              </a>
            </div>
          </div>

        </div>

        {/* ── 3. DAY-OF ARRIVAL GRID ── */}
        <div className="ere-logistics-grid">
          <div className="ere-logistics-card">
            <div className="ere-logistics-card-icon-wrap">⏰</div>
            <p className="ere-logistics-card-title">Arrival Timing</p>
            <p className="ere-logistics-card-body">
              Gates open for VIPs at 09:00 AM (1 hr early access). Keynotes start sharply at 10:30 AM.
            </p>
          </div>
          <div className="ere-logistics-card">
            <div className="ere-logistics-card-icon-wrap">🪪</div>
            <p className="ere-logistics-card-title">What to Bring</p>
            <p className="ere-logistics-card-body">
              Valid government ID matching <strong style={{ color: "#0a3323" }}>{userName}</strong> + digital QR pass on your phone.
            </p>
          </div>
        </div>

        {/* ── 4. GATE ADVISORY CALLOUT ── */}
        <div className="ere-advisory">
          <span className="ere-advisory-icon">⚠️</span>
          <div>
            <p className="ere-advisory-title">Important Gate Advisory</p>
            <p className="ere-advisory-body">
              Please have your QR code ready at 100% phone screen brightness before approaching express Turnstile A to avoid lines. Physical prints are also accepted.
            </p>
          </div>
        </div>

        {/* ── 5. FOOTER ── */}
        <div className="ere-footer">
          <p className="ere-footer-org">Coffee Expo 2026 Organizing Committee</p>
          <p className="ere-footer-support">
            Need assistance with your registration or accessibility accommodations?{" "}
            Reply directly to this email or contact{" "}
            <a href="mailto:support@eventmanagement.com">support@eventmanagement.com</a>.
          </p>
          <div className="ere-footer-links">
            <a href="#" className="ere-footer-link">View Event Schedule</a>
            <span className="ere-footer-sep">•</span>
            <a href="#" className="ere-footer-link">Attendee Code of Conduct</a>
            <span className="ere-footer-sep">•</span>
            <a href="#" className="ere-footer-link">Venue Parking Guide</a>
          </div>
          <p className="ere-footer-legal">
            © 2026 Coffee Expo — Global Roasters Summit. All rights reserved.<br />
            Brilliant Convention Centre, Scheme 78, Part II, Vijay Nagar, Indore, Madhya Pradesh 452010.<br />
            You are receiving this email because you registered for Coffee Expo 2026.
          </p>
        </div>

      </div>
    </div>
  );
};

export default EventReminderEmail;
