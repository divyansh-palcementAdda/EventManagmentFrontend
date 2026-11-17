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

export const buildDateLabelText = (days, fallbackDate = '') => {
    if (!days || days.length === 0) return fallbackDate || '';

    const parsed = days
        .filter((d) => d.eventDate || d.label)
        .map((d) => {
            const raw = d.eventDate || d.label;
            const dt = new Date(raw.includes('T') ? raw : raw + 'T00:00:00');
            if (isNaN(dt.getTime())) return null;
            return {
                day: dt.getDate(),
                month: dt.toLocaleString('en-US', { month: 'long' }).toUpperCase(),
                year: dt.getFullYear(),
            };
        })
        .filter(Boolean);

    if (parsed.length === 0) return fallbackDate || '';

    const formatOrd = (day) => {
        const { suffix } = ordinal(day);
        return `${day}${suffix.toUpperCase()}`;
    };

    if (parsed.length === 1) {
        return `${formatOrd(parsed[0].day)} ${parsed[0].month}, ${parsed[0].year}`;
    }

    const allSameMonth = parsed.every(
        (p) => p.month === parsed[0].month && p.year === parsed[0].year
    );

    if (allSameMonth) {
        return `${parsed.map((p) => formatOrd(p.day)).join(', ')} ${parsed[0].month}, ${parsed[0].year}`;
    }

    return `${parsed.map((p) => `${formatOrd(p.day)} ${p.month}`).join(', ')}, ${parsed[parsed.length - 1].year}`;
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

                {(() => {
                    const dateStr = buildDateLabel(validDays) || eventDate || '14TH – 16TH NOVEMBER, 2026';
                    const rawV = (eventVenue || 'RENAISSANCE UNIVERSITY').trim();
                    let vName = rawV;
                    let vLoc = null;
                    if (rawV.includes(',')) {
                        const parts = rawV.split(',');
                        vName = parts[0].trim();
                        vLoc = parts.slice(1).join(',').trim();
                    } else if (rawV.toUpperCase() === 'RENAISSANCE UNIVERSITY') {
                        vLoc = 'CAMPUS, INDORE';
                    }

                    return (
                        <div
                            style={{
                                position: 'absolute',
                                top: '58%',
                                left: '39.5%',
                                width: '42%',
                                backgroundColor: '#fef3e7',
                                padding: 'clamp(2px, 0.4vw, 5px) 0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'clamp(1px, 0.3vw, 4px)',
                                lineHeight: 1.25,
                            }}
                        >
                            <div style={{ height: '1px', backgroundColor: '#d8c8b8', marginBottom: 'clamp(1px, 0.2vw, 3px)', width: '100%' }} />
                            <div style={{ fontSize: 'clamp(6.5px, 1.25vw, 11.5px)', fontWeight: '700', color: '#121212', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <span style={{ color: '#6f3b25' }}>EVENT DATES: </span>
                                {dateStr}
                            </div>
                            <div style={{ fontSize: 'clamp(6.5px, 1.25vw, 11.5px)', fontWeight: '700', color: '#121212' }}>
                                <span style={{ color: '#6f3b25' }}>VENUE: </span>
                                {vName.toUpperCase()}
                            </div>
                            {vLoc && (
                                <div style={{ fontSize: 'clamp(5.5px, 1.1vw, 10px)', fontWeight: '700', color: '#4a3525' }}>
                                    {vLoc.toUpperCase()}
                                </div>
                            )}
                        </div>
                    );
                })()}
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

                {/* Serial Number badge — first brown strip below the QR box */}
                {formattedSeq && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '17%',
                            right: '5.5%',
                            width: '22%',
                            height: '9%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 'clamp(6px, 1.6vw, 13px)',
                                fontWeight: '700',
                                color: '#ffffff',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                                letterSpacing: '1.5px',
                                whiteSpace: 'nowrap',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                            }}
                        >
                            {formattedSeq}
                        </span>
                    </div>
                )}

                {/* Category badge — second brown strip below serial number */}
                {category && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '26%',
                            right: '5.5%',
                            width: '22%',
                            height: '9%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 'clamp(6px, 1.6vw, 13px)',
                                fontWeight: '700',
                                color: '#ffffff',
                                fontFamily: 'Arial, Helvetica, sans-serif',
                                letterSpacing: '1.5px',
                                whiteSpace: 'nowrap',
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                            }}
                        >
                            {category}
                        </span>
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
