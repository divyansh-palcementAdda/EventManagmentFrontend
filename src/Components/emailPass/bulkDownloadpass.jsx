import React from 'react';

import frontPass from '../../assets/14.png';
import backpass from '../../assets/final.png';

export { frontPass, backpass };

/**
 * BulkDownloadPass
 *
 * Renders a full pass card (front pass + back pass).
 * Front pass (14.png) on top, back pass (final.png) below it.
 * Back pass has QR overlay + serial number & category on the two brown badge strips.
 *
 * Props:
 *  - qrImageUrl   : string  (data-URL or hosted URL for the QR code image)
 *  - seatOrSeq    : string  (serial number, e.g. "#0001" or "0001")
 *  - category     : string  (category label, e.g. "STANDARD", "STUDENT", "VIP")
 *  - validDays    : array   (array of valid day objects with eventDate)
 *  - eventDate    : string  (fallback date string, e.g. "14TH – 16TH NOVEMBER, 2026")
 *  - eventVenue   : string  (venue string, e.g. "RENAISSANCE UNIVERSITY, CAMPUS INDORE")
 *  - wrapperStyle : object  (optional style override for outer page wrapper)
 *  - cardStyle    : object  (optional style override for the pass card)
 *  - showWrapper  : boolean (whether to render outer 100vh/centering wrapper, default true)
 */
export const ordinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return {
        day: n,
        suffix: s[(v - 20) % 10] || s[v] || s[0],
    };
};

export const formatPassDisplayDate = (days, eventOrFallback = null) => {
    let parsed = [];
    if (Array.isArray(days) && days.length > 0) {
        parsed = days
            .map((d) => {
                const raw = d.eventDate || d.date || d.label;
                if (!raw) return null;
                const dt = new Date(raw.includes('T') ? raw : raw + 'T00:00:00');
                return isNaN(dt.getTime()) ? null : dt;
            })
            .filter(Boolean);
    }

    if (parsed.length === 0 && eventOrFallback) {
        if (typeof eventOrFallback === 'string') {
            if (eventOrFallback.trim()) {
                const dt = new Date(eventOrFallback.includes('T') ? eventOrFallback : eventOrFallback + 'T00:00:00');
                if (!isNaN(dt.getTime())) {
                    parsed.push(dt);
                } else {
                    return eventOrFallback;
                }
            }
        } else if (typeof eventOrFallback === 'object') {
            if (eventOrFallback.startsAt) {
                const d1 = new Date(eventOrFallback.startsAt);
                if (!isNaN(d1.getTime())) parsed.push(d1);
            }
            if (eventOrFallback.endsAt) {
                const d2 = new Date(eventOrFallback.endsAt);
                if (!isNaN(d2.getTime()) && (!parsed[0] || d2.toDateString() !== parsed[0].toDateString())) {
                    parsed.push(d2);
                }
            }
        }
    }

    if (parsed.length === 0) {
        return 'Dec 11th, 12th 2026';
    }

    // Sort chronologically
    parsed.sort((a, b) => a.getTime() - b.getTime());

    const d1 = parsed[0];
    const month = d1.toLocaleDateString('en-US', { month: 'short' });
    const year = d1.getFullYear();
    const day1 = d1.getDate();
    const ord1 = ordinal(day1).suffix;

    if (parsed.length === 1) {
        return `${month} ${day1}${ord1} ${year}`;
    }

    const allSameMonthYear = parsed.every(
        (d) => d.toLocaleDateString('en-US', { month: 'short' }) === month && d.getFullYear() === year
    );

    if (allSameMonthYear) {
        const daysFormatted = parsed
            .map((d) => `${d.getDate()}${ordinal(d.getDate()).suffix}`)
            .join(', ');
        return `${month} ${daysFormatted} ${year}`;
    }

    return `${month} ${day1}${ord1} – ${parsed[parsed.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

export const buildDateLabelText = (days, fallbackDate = '') => {
    return formatPassDisplayDate(days, fallbackDate || 'Dec 11th, 12th 2026');
};

const BulkDownloadPass = ({
    qrImageUrl = null,
    seatOrSeq = '',
    category = '',
    validDays = [],
    eventDate = '',
    eventVenue = '',
    wrapperStyle = {},
    cardStyle = {},
    showWrapper = true,
}) => {
    const buildDateLabel = (days) => {
        if (!days || days.length === 0) return null;

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

        if (parsed.length === 0) return null;

        const renderOrdinal = (day, key) => {
            const { suffix } = ordinal(day);

            return (
                <React.Fragment key={key}>
                    {day}
                    <sup
                        style={{
                            fontSize: '65%',
                            verticalAlign: 'super',
                            lineHeight: 0,
                            position: 'relative',
                            top: '1px',
                        }}
                    >
                        {suffix}
                    </sup>
                </React.Fragment>
            );
        };

        if (parsed.length === 1) {
            const p = parsed[0];

            return (
                <>
                    {renderOrdinal(p.day, 0)} {p.month}, {p.year}
                </>
            );
        }

        const allSameMonth = parsed.every(
            (p) => p.month === parsed[0].month && p.year === parsed[0].year
        );

        if (allSameMonth) {
            return (
                <>
                    {parsed.map((p, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && ', '}
                            {renderOrdinal(p.day, i)}
                        </React.Fragment>
                    ))}{' '}
                    {parsed[0].month}, {parsed[0].year}
                </>
            );
        }

        return (
            <>
                {parsed.map((p, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && ', '}
                        {renderOrdinal(p.day, i)} {p.month}
                    </React.Fragment>
                ))}
                , {parsed[parsed.length - 1].year}
            </>
        );
    };

    const formattedSeq = seatOrSeq
        ? (String(seatOrSeq).startsWith('#') ? String(seatOrSeq) : `#${seatOrSeq}`)
        : '';
    const formattedDate = formatPassDisplayDate(validDays, eventDate || 'Dec 11th, 12th 2026');

    const cardContent = (
        <div
            className="bulk-pass-card"
            style={{
                width: '100%',
                maxWidth: '600px',
                minWidth: '280px',
                backgroundColor: '#ffffff',
                overflow: 'hidden',
                boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                boxSizing: 'border-box',
                borderRadius: '8px',
                ...cardStyle,
            }}
        >
            {/* ── FRONT PASS (Commented for now - only backPass needed) ──────────────── */}
            {/*
            <div style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
                <img
                    src={frontPass}
                    alt="RCF Pass Front"
                    style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        objectFit: 'cover',
                    }}
                />
            </div>
            */}

            {/* ── BACK PASS + QR overlay + badge text ──────────────────── */}
            <div style={{ position: 'relative', width: '100%', lineHeight: 0 }}>
                <img
                    src={backpass}
                    alt="RCF Pass Back"
                    style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        objectFit: 'cover',
                    }}
                />

                {/* QR Code — positioned inside the square box on the right side of back pass */}
                <div
                    style={{
                        position: 'absolute',
                        top: '20%',
                        right: '9.5%',
                        width: '15%',
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

                {/* Unified text cluster directly below QR box (Category, Sequence, Date) */}
                {(category || formattedSeq || formattedDate) && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '60.5%',
                            bottom: '8.5%',
                            right: '6.5%',
                            width: '21%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-evenly',
                            textAlign: 'center',
                            lineHeight: 1.15,
                            pointerEvents: 'none',
                            boxSizing: 'border-box',
                        }}
                    >
                        {category && (
                            <span
                                style={{
                                    fontSize: 'clamp(6.5px, 1.7vw, 13px)',
                                    fontWeight: '800',
                                    color: '#000000',
                                    fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
                                    letterSpacing: '1.5px',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    display: 'block',
                                }}
                            >
                                {category}
                            </span>
                        )}

                        {formattedSeq && (
                            <span
                                style={{
                                    fontSize: 'clamp(7px, 1.8vw, 13.5px)',
                                    fontWeight: '800',
                                    color: '#000000',
                                    fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
                                    letterSpacing: '0.8px',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    display: 'block',
                                }}
                            >
                                {formattedSeq}
                            </span>
                        )}

                        {formattedDate && (
                            <span
                                style={{
                                    fontSize: 'clamp(5.5px, 1.35vw, 10.5px)',
                                    fontWeight: '700',
                                    color: '#000000',
                                    fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
                                    letterSpacing: '0.3px',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'center',
                                    display: 'block',
                                }}
                            >
                                {formattedDate}
                            </span>
                        )}
                    </div>
                )}

                {/* Sequence Number — in the left brown strip, rotated */}
                {formattedSeq && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '5%',
                            left: '-2%',
                            width: '5.5%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: 'rotate(-90deg)',
                            transformOrigin: 'center center',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 'clamp(4px, 1.1vw, 12px)',
                                fontWeight: '700',
                                color: '#121212',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                                letterSpacing: '3.5px',
                                lineHeight: 2,
                                whiteSpace: 'nowrap',
                                textAlign: 'center',
                                marginTop: '9px',
                            }}
                        >
                            {formattedSeq}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    if (!showWrapper) {
        return cardContent;
    }

    return (
        /* ── Outer page wrapper ─────────────────────────────────────── */
        <div
            className="bulk-pass-wrapper"
            style={{
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(12px, 3vw, 32px) clamp(8px, 2vw, 16px)',
                fontFamily: "'Telegraf', 'Segoe UI', Arial, sans-serif",
                boxSizing: 'border-box',
                pageBreakAfter: 'always',
                breakAfter: 'page',
                ...wrapperStyle,
            }}
        >
            {cardContent}
        </div>
    );
};

export default BulkDownloadPass;
