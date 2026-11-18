import React from "react";
import defaultLogo from "../../assets/logo.png";

const PassActivationEmail = ({
  logoUrl = defaultLogo,
  userName = "Abhishek Sharma",
  eventName = "Coffee Event 2026",
  passTier = "VIP GUEST",
  passId = "#CE26-VIP-8849-AK",
  date = "Oct 24–26, 2026",
  time = "09:00 AM IST",
  dates = "Oct 24–26, 2026 • 09:00 AM IST",
  venue = "Hall 4, Pragati Maidan, New Delhi",
  pdfAttachmentUrl = "#",
}) => {
  // Extract date and time if only dates string is provided
  const displayDate =
    date || (dates && dates.includes("•") ? dates.split("•")[0].trim() : dates);
  const displayTime =
    time || (dates && dates.includes("•") ? dates.split("•")[1].trim() : "");

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Top Logo */}
        {logoUrl && (
          <div style={styles.logoWrapper}>
            <img src={logoUrl} alt="Logo" style={styles.logo} />
          </div>
        )}

        {/* Simple Activation Message / SMS */}
        <div style={styles.statusBox}>
          <div style={styles.iconCircle}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={styles.heading}>Pass Activated!</h2>
          <p style={styles.subtext}>
            Hello <strong style={{ color: "#111827" }}>{userName}</strong>, your pass for{" "}
            <strong style={{ color: "#111827" }}>{eventName}</strong> has been successfully activated.
          </p>
        </div>

        {/* Details Card */}
        <div style={styles.detailsCard}>
          <div style={styles.detailRow}>
            <span style={styles.label}>Pass Holder</span>
            <span style={styles.value}>{userName}</span>
          </div>

          <div style={styles.detailRow}>
            <span style={styles.label}>Date</span>
            <span style={styles.value}>{displayDate}</span>
          </div>

          {displayTime && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Time</span>
              <span style={styles.value}>{displayTime}</span>
            </div>
          )}

          <div style={styles.detailRow}>
            <span style={styles.label}>Venue</span>
            <span style={styles.value}>{venue}</span>
          </div>

          {passId && (
            <div style={styles.detailRow}>
              <span style={styles.label}>Pass ID</span>
              <span style={styles.codeValue}>{passId}</span>
            </div>
          )}
        </div>

        {/* Pass Download Button */}
        <div style={styles.buttonWrapper}>
          <button type="button" style={styles.downloadButton}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "8px" }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Pass
          </button>
        </div>

        {/* Simple Note */}
        <div style={styles.footerNote}>
          Please show this confirmation or Pass ID at the entrance.
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    backgroundColor: "#f3f4f6",
    padding: "40px 16px",
    minHeight: "100%",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
  },
  container: {
    backgroundColor: "#ffffff",
    maxWidth: "480px",
    width: "100%",
    borderRadius: "14px",
    padding: "32px 28px",
    boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e5e7eb",
    boxSizing: "border-box",
  },
  logoWrapper: {
    textAlign: "center",
    marginBottom: "20px",
  },
  logo: {
    maxHeight: "100px",
    maxWidth: "260px",
    height: "auto",
    objectFit: "contain",
    display: "inline-block",
  },
  statusBox: {
    textAlign: "center",
    marginBottom: "24px",
  },
  iconCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#ecfdf5",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
  },
  heading: {
    margin: "0 0 8px 0",
    fontSize: "22px",
    fontWeight: "700",
    color: "#111827",
  },
  subtext: {
    margin: "0",
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#4b5563",
  },
  detailsCard: {
    backgroundColor: "#f9fafb",
    border: "1px solid #f0f2f5",
    borderRadius: "10px",
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
  },
  label: {
    color: "#6b7280",
    fontWeight: "500",
  },
  value: {
    color: "#111827",
    fontWeight: "600",
    textAlign: "right",
    maxWidth: "65%",
  },
  codeValue: {
    fontFamily: "monospace",
    color: "#059669",
    fontWeight: "700",
    backgroundColor: "#ecfdf5",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "13px",
  },
  buttonWrapper: {
    marginTop: "24px",
    textAlign: "center",
  },
  downloadButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    color: "#ffffff",
    border: "none",
    padding: "11px 24px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
  },
  footerNote: {
    marginTop: "20px",
    textAlign: "center",
    fontSize: "12px",
    color: "#9ca3af",
  },
};

export default PassActivationEmail;
