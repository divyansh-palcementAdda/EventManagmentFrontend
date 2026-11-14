import React from "react";

const PassActivationEmail = ({
  userName = "Abhishek Sharma",
  eventName = "Coffee Event 2026",
  passTier = "VIP GUEST",
  passId = "#CE26-VIP-8849-AK",
  dates = "Oct 24–26, 2026 • 09:00 AM IST",
  venue = "Hall 4, Pragati Maidan, New Delhi",
  pdfAttachmentUrl = "#",
}) => {
  return (
    <div className="pae-wrapper" style={s.wrapper}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        .pae-root * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .pae-footer-link {
          color: #10b981;
          text-decoration: none;
          font-size: 12px;
        }
        .pae-footer-link:hover { text-decoration: underline; }

        .pae-dl-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #10b981;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s;
        }
        .pae-dl-btn:hover { background: #059669; }

        @media (max-width: 600px) {
          .pae-ticket-cols { flex-direction: column !important; }
          .pae-ticket-col { border-left: none !important; border-top: 1px solid rgba(255,255,255,0.08) !important; padding-top: 14px !important; padding-left: 0 !important; margin-top: 14px !important; }
          .pae-pdf-row { flex-direction: column !important; align-items: stretch !important; }
          .pae-pdf-row .pae-dl-btn { margin-left: 0 !important; width: 100% !important; justify-content: center !important; margin-top: 12px !important; }
        }

        @media (max-width: 360px) {
          .pae-wrapper { padding: 12px 6px !important; }
          .pae-card { border-radius: 10px !important; }
          .pae-header { padding: 14px 14px !important; flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .pae-header-title { font-size: 12px !important; letter-spacing: 1px !important; }
          .pae-header-sub { font-size: 10px !important; }
          .pae-hero { padding: 28px 16px 24px !important; }
          .pae-hero h1 { font-size: 20px !important; }
          .pae-hero p { font-size: 13px !important; }
          .pae-ticket-outer { padding: 0 12px 20px !important; }
          .pae-ticket-banner { padding: 10px 14px !important; flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .pae-ticket-event-row { padding: 12px 14px 10px !important; }
          .pae-ticket-event-name { font-size: 16px !important; }
          .pae-ticket-meta-row { padding: 12px 14px !important; flex-direction: column !important; gap: 10px !important; }
          .pae-ticket-body { padding: 14px !important; }
          .pae-cred-code { font-size: 14px !important; letter-spacing: 1px !important; }
          .pae-cred-box { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .pae-pdf-section { padding: 0 12px 20px !important; }
          .pae-pdf-card { padding: 14px 12px !important; }
          .pae-pdf-filename { font-size: 12px !important; word-break: break-all !important; }
          .pae-instr-section { padding: 0 12px 20px !important; }
          .pae-footer { padding: 24px 16px !important; }
        }
      `}</style>

      {/* ─── Outer card ─────────────────────────────────────────────────────── */}
      <div className="pae-root pae-card" style={s.card}>

        {/* ══════════════════════════════════════════════════════════
            1. TOP BRAND BANNER
        ══════════════════════════════════════════════════════════ */}
        <div className="pae-header" style={s.header}>
          {/* Logo + event title */}
          <div style={s.headerLeft}>
            <div style={s.logoMark}>
              <span style={{ fontSize: 18 }}>☕</span>
            </div>
            <div>
              <div className="pae-header-title" style={s.headerTitle}>COFFEE EXPO 2026</div>
              <div className="pae-header-sub" style={s.headerSub}>Global Roasters Summit &nbsp;•&nbsp; Delhi</div>
            </div>
          </div>

          {/* Verified badge */}
          <div style={s.verifiedBadge}>
            <span style={{ color: "#10b981", fontSize: 8 }}>●</span>&nbsp;VERIFIED ACTIVATION
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            2. HERO CONFIRMATION AREA
        ══════════════════════════════════════════════════════════ */}
        <div className="pae-hero" style={s.hero}>
          {/* Glowing circular badge */}
          <div style={s.heroBadgeWrap}>
            <div style={s.heroBadge}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <circle cx="18" cy="18" r="18" fill="rgba(16,185,129,0.15)" />
                <path d="M11 18.5L15.5 23L25 13" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {/* VIP pill */}
            <div style={s.vipPill}>
              <span style={{ fontSize: 9 }}>★</span> VIP
            </div>
          </div>

          <h1 style={s.heroHeading}>Pass Activated &amp; Confirmed!</h1>

          <p style={s.heroMsg}>
            Hello <strong style={{ color: "#1a1a1a" }}>{userName}</strong>, your credential is ready.
            Your VIP pass has been successfully verified in our registry. Present the digital badge
            below at the <strong style={{ color: "#10b981" }}>express entrance gate</strong>.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════
            3. PHYSICAL TICKET STUB / BOARDING PASS
        ══════════════════════════════════════════════════════════ */}
        <div className="pae-ticket-outer" style={s.ticketOuter}>
          <div style={s.ticket}>

            {/* Ticket top banner */}
            <div className="pae-ticket-banner" style={s.ticketBanner}>
              <div style={s.ticketBannerLeft}>
                <span style={s.ticketTierLabel}>ALL-ACCESS PASS</span>
                <span style={s.ticketTierSep}>|</span>
                <span style={s.ticketTierLabel}>Tier: Priority #1</span>
              </div>
              <div style={s.vipGuestBadge}>
                <span style={{ fontSize: 9 }}>★</span>&nbsp;{passTier}
              </div>
            </div>

            {/* Event title row */}
            <div className="pae-ticket-event-row" style={s.ticketEventRow}>
              <span className="pae-ticket-event-name" style={s.ticketEventName}>{eventName}</span>
            </div>

            {/* Meta row */}
            <div className="pae-ticket-meta-row" style={s.ticketMetaRow}>
              <div style={s.ticketMetaItem}>
                <span style={s.ticketMetaIcon}>📅</span>
                <div>
                  <div style={s.ticketMetaLabel}>DATES &amp; SCHEDULE</div>
                  <div style={s.ticketMetaValue}>{dates}</div>
                </div>
              </div>
              <div style={s.ticketMetaItem}>
                <span style={s.ticketMetaIcon}>📍</span>
                <div>
                  <div style={s.ticketMetaLabel}>VENUE &amp; ZONE</div>
                  <div style={s.ticketMetaValue}>{venue}</div>
                </div>
              </div>
            </div>

            {/* ── Tear perforation ── */}
            <div style={s.tearRow}>
              <div style={s.notchLeft} />
              <div style={s.dashedLine} />
              <div style={s.notchRight} />
            </div>

            {/* Two-column attendee details */}
            <div className="pae-ticket-body" style={s.ticketBody}>
              <div className="pae-ticket-cols" style={s.ticketCols}>
                {/* Left col */}
                <div style={s.ticketColLeft}>
                  <div style={s.ticketColLabel}>PASS HOLDER</div>
                  <div style={s.ticketColName}>{userName}</div>
                  <div style={s.ticketColRole}>Specialty Coffee Buyer</div>
                </div>

                {/* Right col */}
                <div className="pae-ticket-col" style={s.ticketColRight}>
                  <div style={s.ticketColLabel}>ACCESS LEVEL</div>
                  <div style={s.ticketColAccess}>Full Floor + VIP Lounge</div>
                  <div style={s.ticketColSubAccess}>Fast-Track Line A</div>
                </div>
              </div>

              {/* Credential code */}
              <div className="pae-cred-box" style={s.credBox}>
                <div className="pae-cred-inner pae-cred-box" style={s.credInner}>
                  <span className="pae-cred-code" style={s.credCode}>{passId}</span>
                  <span style={s.authPill}>AUTHENTICATED</span>
                </div>
              </div>

              {/* VIP perks tags */}
              <div style={s.perksRow}>
                {["✓ Cupping Lab", "✓ Roaster Networking", "✓ Tasting Kit Included"].map((perk) => (
                  <span key={perk} style={s.perkTag}>{perk}</span>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            5. PDF ATTACHMENT CARD
        ══════════════════════════════════════════════════════════ */}
        <div className="pae-pdf-section" style={s.pdfSection}>
          <div className="pae-pdf-row pae-pdf-card" style={s.pdfCard}>
            <div style={s.pdfLeft}>
              <div style={s.pdfIconWrap}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="6" fill="#fee2e2" />
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#ef4444" />
                  <path d="M14 2v6h6" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                  <text x="6" y="19" fontSize="5.5" fontWeight="800" fill="#ffffff" fontFamily="sans-serif">PDF</text>
                </svg>
              </div>
              <div>
                <div className="pae-pdf-filename" style={s.pdfFileName}>Coffee_Event_2026_VIP_Pass.pdf</div>
                <div style={s.pdfMeta}>1.4 MB &nbsp;·&nbsp; Attached to this email</div>
                <div style={s.pdfSubMeta}>✔ Verified high-res printable copy</div>
              </div>
            </div>
            <a href={pdfAttachmentUrl} className="pae-dl-btn" style={{ marginLeft: "auto", marginTop: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 3v13M5 14l7 7 7-7" />
                <path d="M3 21h18" />
              </svg>
              Download
            </a>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            6. ARRIVAL INSTRUCTIONS
        ══════════════════════════════════════════════════════════ */}
        <div className="pae-instr-section" style={s.instrSection}>
          <div style={s.instrBox}>
            <div style={s.instrHeader}>
              <span style={{ fontSize: 18 }}>📋</span>
              <span style={s.instrTitle}>Important Arrival Instructions</span>
            </div>
            <ul style={s.instrList}>
              <li style={s.instrItem}>
                <span style={s.instrBullet}>🪪</span>
                <span>Carry a <strong>valid Photo ID</strong> matching the attendee name on your pass.</span>
              </li>
              <li style={s.instrItem}>
                <span style={s.instrBullet}>⏰</span>
                <span><strong>VIP Early Floor Access:</strong> Doors open at <strong>08:30 AM IST</strong>, 30 minutes before General Admission.</span>
              </li>
              <li style={s.instrItem}>
                <span style={s.instrBullet}>🎁</span>
                <span>Collect your <strong>Tasting Kit</strong> from the reception desk at the <strong>Main Foyer</strong>.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            8. FOOTER
        ══════════════════════════════════════════════════════════ */}
        <div className="pae-footer" style={s.footer}>
          <div style={s.footerLogo}>☕ Coffee Expo 2026</div>
          <p style={s.footerOrg}>
            Organized by the <strong>Global Roasters Summit Organizing Committee</strong>
          </p>
          <p style={s.footerSupport}>
            Questions? Email us at&nbsp;
            <a href="mailto:support@eventmanagement.com" style={s.footerEmail}>
              support@eventmanagement.com
            </a>
          </p>
          <div style={s.footerLinks}>
            <a href="#" className="pae-footer-link">Manage Registration</a>
            <span style={s.footerDot}>·</span>
            <a href="#" className="pae-footer-link">Code of Conduct</a>
            <span style={s.footerDot}>·</span>
            <a href="#" className="pae-footer-link">Privacy Policy</a>
          </div>
          <p style={s.footerCopy}>© 2026 Event Management Platform. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────────────────────── */
const s = {
  /* Outer page wrapper */
  wrapper: {
    width: "100%",
    backgroundColor: "#edf1ee",
    padding: "32px 16px",
    boxSizing: "border-box",
  },

  /* ── Main card ── */
  card: {
    maxWidth: 640,
    width: "100%",
    margin: "0 auto",
    backgroundColor: "#f8faf9",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #dce8e1",
    boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
  },

  /* ── 1. Header ── */
  header: {
    background: "linear-gradient(135deg, #081714 0%, #0d2420 60%, #0f2e28 100%)",
    padding: "20px 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "rgba(16,185,129,0.15)",
    border: "1.5px solid rgba(16,185,129,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "2px",
    lineHeight: 1.2,
  },
  headerSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    letterSpacing: "0.8px",
    marginTop: 2,
  },
  verifiedBadge: {
    background: "rgba(16,185,129,0.12)",
    border: "1px solid rgba(16,185,129,0.4)",
    color: "#10b981",
    borderRadius: 100,
    padding: "5px 12px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "1px",
    display: "flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
  },

  /* ── 2. Hero ── */
  hero: {
    padding: "44px 36px 32px",
    textAlign: "center",
    background: "#f8faf9",
  },
  heroBadgeWrap: {
    position: "relative",
    display: "inline-block",
    marginBottom: 24,
  },
  heroBadge: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    background: "rgba(16,185,129,0.08)",
    border: "2px solid rgba(16,185,129,0.25)",
    boxShadow: "0 0 32px rgba(16,185,129,0.20)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
  },
  vipPill: {
    position: "absolute",
    bottom: -8,
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(90deg, #f59e0b, #d97706)",
    color: "#ffffff",
    borderRadius: 100,
    padding: "3px 10px",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "1px",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 8px rgba(245,158,11,0.4)",
  },
  heroHeading: {
    margin: "0 0 16px",
    fontSize: 28,
    fontWeight: 800,
    color: "#0d1f1a",
    letterSpacing: "-0.5px",
    lineHeight: 1.2,
  },
  heroMsg: {
    margin: 0,
    fontSize: 15,
    color: "#4b6358",
    lineHeight: 1.75,
    maxWidth: 460,
    marginLeft: "auto",
    marginRight: "auto",
  },

  /* ── 3. Ticket ── */
  ticketOuter: {
    padding: "0 28px 28px",
  },
  ticket: {
    background: "#ffffff",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid #dce8e1",
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
  },
  ticketBanner: {
    background: "linear-gradient(90deg, #0d2a24 0%, #0f3328 100%)",
    padding: "13px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  ticketBannerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  ticketTierLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "1.5px",
  },
  ticketTierSep: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
  },
  vipGuestBadge: {
    background: "linear-gradient(90deg, #f59e0b, #d97706)",
    color: "#ffffff",
    borderRadius: 100,
    padding: "4px 12px",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "1px",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  ticketEventRow: {
    padding: "16px 20px 12px",
    borderBottom: "1px solid #f0f4f2",
  },
  ticketEventName: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0d1f1a",
    letterSpacing: "-0.3px",
  },
  ticketMetaRow: {
    display: "flex",
    gap: 0,
    padding: "14px 20px",
    flexWrap: "wrap",
    borderBottom: "1px solid #f0f4f2",
  },
  ticketMetaItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
    minWidth: 200,
    padding: "0 10px 0 0",
  },
  ticketMetaIcon: {
    fontSize: 18,
    lineHeight: 1,
    marginTop: 2,
  },
  ticketMetaLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "1.2px",
    color: "#7a9a8c",
    marginBottom: 3,
  },
  ticketMetaValue: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1a3328",
    lineHeight: 1.4,
  },

  /* Tear / perforation */
  tearRow: {
    display: "flex",
    alignItems: "center",
    position: "relative",
    padding: "0 0",
    margin: "4px 0",
  },
  notchLeft: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#f8faf9",
    border: "1px solid #dce8e1",
    flexShrink: 0,
    marginLeft: -9,
    zIndex: 2,
  },
  dashedLine: {
    flex: 1,
    borderTop: "1.5px dashed #cdd9d4",
    margin: "0 4px",
  },
  notchRight: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#f8faf9",
    border: "1px solid #dce8e1",
    flexShrink: 0,
    marginRight: -9,
    zIndex: 2,
  },

  ticketBody: {
    padding: "20px",
  },
  ticketCols: {
    display: "flex",
    gap: 0,
    marginBottom: 18,
  },
  ticketColLeft: {
    flex: 1,
    paddingRight: 20,
  },
  ticketColRight: {
    flex: 1,
    paddingLeft: 20,
    borderLeft: "1px solid #edf2ef",
  },
  ticketColLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "1.2px",
    color: "#7a9a8c",
    marginBottom: 4,
  },
  ticketColName: {
    fontSize: 17,
    fontWeight: 800,
    color: "#0d1f1a",
    marginBottom: 3,
  },
  ticketColRole: {
    fontSize: 12,
    color: "#5a7a6e",
    fontWeight: 500,
  },
  ticketColAccess: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0d1f1a",
    marginBottom: 3,
  },
  ticketColSubAccess: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: 600,
  },

  /* Credential code */
  credBox: {
    background: "linear-gradient(135deg, #081714 0%, #0d2420 100%)",
    borderRadius: 10,
    padding: "14px 18px",
    marginBottom: 14,
  },
  credInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  credCode: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: 18,
    fontWeight: 700,
    color: "#10b981",
    letterSpacing: "2px",
  },
  authPill: {
    background: "rgba(16,185,129,0.15)",
    border: "1px solid rgba(16,185,129,0.4)",
    color: "#10b981",
    borderRadius: 100,
    padding: "3px 10px",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "1px",
  },

  /* Perks */
  perksRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  perkTag: {
    background: "rgba(16,185,129,0.08)",
    border: "1px solid rgba(16,185,129,0.25)",
    color: "#0f7a5a",
    borderRadius: 100,
    padding: "5px 12px",
    fontSize: 11,
    fontWeight: 600,
  },

  /* ── 5. PDF ── */
  pdfSection: {
    padding: "0 28px 28px",
  },
  pdfCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    background: "#ffffff",
    border: "1.5px solid #e4ede9",
    borderRadius: 12,
    padding: "16px 18px",
    flexWrap: "wrap",
  },
  pdfLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  pdfIconWrap: {
    flexShrink: 0,
  },
  pdfFileName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0d1f1a",
    marginBottom: 2,
  },
  pdfMeta: {
    fontSize: 11,
    color: "#7a9a8c",
    marginBottom: 2,
  },
  pdfSubMeta: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: 600,
  },

  /* ── 6. Instructions ── */
  instrSection: {
    padding: "0 28px 28px",
  },
  instrBox: {
    background: "rgba(245,158,11,0.05)",
    border: "1.5px solid rgba(245,158,11,0.25)",
    borderRadius: 12,
    padding: "20px",
  },
  instrHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  instrTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#92400e",
    letterSpacing: "0.3px",
  },
  instrList: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  instrItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    fontSize: 13,
    color: "#4b3c1c",
    lineHeight: 1.6,
  },
  instrBullet: {
    fontSize: 16,
    flexShrink: 0,
    lineHeight: 1.4,
  },

  /* ── 8. Footer ── */
  footer: {
    background: "linear-gradient(135deg, #081714 0%, #0d2420 100%)",
    padding: "32px 28px",
    textAlign: "center",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  footerLogo: {
    color: "#10b981",
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "1px",
    marginBottom: 10,
  },
  footerOrg: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    margin: "0 0 6px",
    lineHeight: 1.6,
  },
  footerSupport: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    margin: "0 0 16px",
  },
  footerEmail: {
    color: "#10b981",
    textDecoration: "none",
    fontWeight: 600,
  },
  footerLinks: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 16,
  },
  footerDot: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 12,
    lineHeight: 1.6,
  },
  footerCopy: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    margin: 0,
  },
};

export default PassActivationEmail;
