import React from 'react';
import PassEmailTemplate from '../../Components/emailPass/mailPass';

/**
 * PassPreview – a dev/test page to visually inspect the pass template.
 * Accessible at /pass-preview  (no auth required).
 *
 * In production you would replace the static props below with real
 * data from the API (attendee, pass, event objects).
 */
const PassPreview = () => {
  return (
    <PassEmailTemplate
      attendeeName="Sarah Johnson"
      attendeeEmail="sarah.johnson@example.com"
      passCode="EVT-2026-00123"
      passCategory="VIP"
      eventName="Annual Tech Summit 2026"
      eventDate="December 10 – 12, 2026"
      eventVenue="RENAISSANCE UNIVERSITY CAMPUS, INDORE"
      seatOrSeq="042"
      validDays="All Days"
      organizerName="Events Co."
      organizerEmail="support@eventsco.com"
      /* Pass a QR data-URL here when available. */
      qrImageUrl={null}
      logoUrl={null}
    />
  );
};

export default PassPreview;
