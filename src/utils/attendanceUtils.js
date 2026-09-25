/**
 * Utility helpers for Attendance times, dates, and durations.
 * Fixes Google Sheets 1899 date artifacts ("Sat Dec 30 1899 ...")
 * and prevents desynced local sessions.
 */

// Helper: get today's date as YYYY-MM-DD in local timezone
export const getTodayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Robust parser for attendance time values.
 * Handles:
 * - "Sat Dec 30 1899 10:03:00 GMT+0642 ..." -> extracts 10:03:00, maps to sessionDateStr
 * - "10:03 AM" or "09:07 PM" -> maps to sessionDateStr
 * - ISO string or Date object -> maps to sessionDateStr if year < 2020
 */
export const parseAttendanceTime = (rawTime, sessionDateStr) => {
    if (!rawTime) return null;

    const baseDate = sessionDateStr
        ? new Date(`${sessionDateStr}T00:00:00`)
        : new Date();

    // 1. String formatted as 12-hour time (e.g., "10:03 AM", "9:07 AM", "10:03:00 AM")
    if (typeof rawTime === 'string') {
        const timeMatch = rawTime.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
        if (timeMatch) {
            let h = parseInt(timeMatch[1], 10);
            const m = parseInt(timeMatch[2], 10);
            const s = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
            const ampm = timeMatch[4] ? timeMatch[4].toUpperCase() : null;
            if (ampm === 'PM' && h < 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            const d = new Date(baseDate);
            d.setHours(h, m, s, 0);
            return d;
        }
    }

    // 2. Parse as Date object or string
    const d = new Date(rawTime);
    if (!isNaN(d.getTime())) {
        // If year is < 2020 (Google Sheets uses Dec 30, 1899 for pure time values)
        if (d.getFullYear() < 2020) {
            const corrected = new Date(baseDate);
            corrected.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), 0);
            return corrected;
        }
        return d;
    }

    return baseDate;
};

/**
 * Format a Date or time string into standard "hh:mm A" (e.g., "10:03 AM")
 */
export const formatAttendanceTime = (dateObjOrRaw, sessionDateStr) => {
    if (!dateObjOrRaw) return '';
    const dateObj = dateObjOrRaw instanceof Date
        ? dateObjOrRaw
        : parseAttendanceTime(dateObjOrRaw, sessionDateStr);

    if (!dateObj || isNaN(dateObj.getTime())) return '';
    return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

/**
 * Format date for badge display when session is from a prior day (e.g., "Sep 24")
 */
export const formatSessionDateLabel = (dateObjOrRaw, sessionDateStr) => {
    const dateObj = dateObjOrRaw instanceof Date
        ? dateObjOrRaw
        : parseAttendanceTime(dateObjOrRaw, sessionDateStr);

    if (!dateObj || isNaN(dateObj.getTime())) {
        if (sessionDateStr) {
            const d = new Date(`${sessionDateStr}T00:00:00`);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        }
        return '';
    }
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/**
 * Safe duration calculator in hours (e.g., "1.50")
 */
export const calculateDurationHours = (clockInTime, sessionDateStr, now = new Date()) => {
    if (!clockInTime) return '0.00';
    const inDate = parseAttendanceTime(clockInTime, sessionDateStr);
    if (!inDate || isNaN(inDate.getTime())) return '0.00';

    const diffMs = now.getTime() - inDate.getTime();
    if (diffMs <= 0) return '0.00';

    const hours = diffMs / (1000 * 60 * 60);
    return hours.toFixed(2);
};

/**
 * Clean up stale attendance keys in localStorage.
 * Marks any non-active prior day keys as isClockedIn: false.
 */
export const cleanupStaleAttendanceKeys = (todayStr, activeSessionDate) => {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('attendance_')) {
                const keyDate = key.replace('attendance_', '');
                if (keyDate !== activeSessionDate) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(key));
                        if (parsed && parsed.isClockedIn) {
                            parsed.isClockedIn = false;
                            localStorage.setItem(key, JSON.stringify(parsed));
                        }
                    } catch (e) { }
                }
            }
        }
    } catch (e) { }
};
