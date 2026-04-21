import { useState, useEffect } from 'react';
import { Card, CardBody } from './ui';
import { Clock, LogIn, LogOut, CheckCircle2, X, ClipboardList, Users, StickyNote, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MultiSelectDropdown from './MultiSelectDropdown';
import SearchableDropdown from './SearchableDropdown';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZpWsJEOFlOQkDA55JyjV1q6CkpO37VNbFi7bxrJsB2LeheFwSrDQHbm_oR5D1hl0TKQ/exec';

// Helper: get today's date as YYYY-MM-DD in local timezone (consistent key for localStorage)
const getTodayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function AttendanceCard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [clockInTime, setClockInTime] = useState(null);
    const [clockOutTime, setClockOutTime] = useState(null);
    const [attendanceId, setAttendanceId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [showTodoModal, setShowTodoModal] = useState(false);

    // Entry-based model: array of { id, client, title, notes }
    const [entries, setEntries] = useState([]);
    // Derived unique client names for the multi-select display
    const selectedClients = [...new Set(entries.map(e => e.client))];
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [showClockOutWarning, setShowClockOutWarning] = useState(false);

    const navigate = useNavigate();

    const DEFAULT_CLIENTS = [
        'Alex', 'Allan', 'Amanda', 'Angelo', 'Bashar', 'Bryan', 'Jordan', 'Jorge', 'Julia', 'Kristin', 'Michael', 'Ryan', 'Simon', 'Wing', 'Yannick', 'Zheng', 'Internal'
    ];
    const DEFAULT_EDITORS = ['Zayn', 'Dadan', 'Faqih'];
    const DEFAULT_ILLUSTRATORS = ['Vanda', 'Rosdiana', 'Dayah'];

    // Employee setup dropdown
    const userRole = localStorage.getItem('userRole') || 'video_editor';
    const isIllustrator = userRole === 'illustrator';
    const defaultEmployeeList = isIllustrator ? DEFAULT_ILLUSTRATORS : DEFAULT_EDITORS;
    const customEmployeeStorageKey = isIllustrator ? 'customIllustrators' : 'customEditors';
    const [customEmployees, setCustomEmployees] = useState(() => {
        const saved = localStorage.getItem(customEmployeeStorageKey);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
    });
    const employeeList = [...defaultEmployeeList, ...customEmployees];

    const [customClients, setCustomClients] = useState(() => {
        const saved = localStorage.getItem('customClients');
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        const cleaned = Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
        if (cleaned.length !== parsed.length) localStorage.setItem('customClients', JSON.stringify(cleaned));
        return cleaned;
    });
    const clientList = [...DEFAULT_CLIENTS, ...customClients];

    const [userName, setUserName] = useState(localStorage.getItem('lastUsedEditor') || '');
    const [isEditingName, setIsEditingName] = useState(!localStorage.getItem('lastUsedEditor'));

    // Cache upcoming deadlines for autocomplete
    const [upcomingTitles, setUpcomingTitles] = useState([]);
    useEffect(() => {
        try {
            const cached = localStorage.getItem('ewo_upcoming_deadlines');
            if (cached) {
                setUpcomingTitles(JSON.parse(cached));
            }
        } catch { }
    }, [showTodoModal]);

    const getTitlesForClient = (clientName) => {
        if (!upcomingTitles.length) return [];
        const titles = upcomingTitles
            .filter(p => !p.client || p.client.toLowerCase() === clientName.toLowerCase())
            .map(p => p.title);
        return [...new Set(titles)];
    };


    const [sessionDate, setSessionDate] = useState(getTodayKey());

    // Load initial state from localStorage, then verify against server as fallback
    useEffect(() => {
        const todayStr = getTodayKey();

        // Find if there is any active session in localStorage (even from previous days)
        let activeKeyStr = todayStr;
        let savedAttendance = localStorage.getItem(`attendance_${todayStr}`);

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('attendance_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.isClockedIn) {
                        activeKeyStr = key.replace('attendance_', '');
                        savedAttendance = localStorage.getItem(key);
                        break;
                    }
                } catch (e) { }
            }
        }

        setSessionDate(activeKeyStr);
        let restoredFromLocal = false;

        if (savedAttendance) {
            try {
                const data = JSON.parse(savedAttendance);
                if (data.isClockedIn) {
                    setIsClockedIn(true);
                    setClockInTime(data.clockInTime);
                    setAttendanceId(data.attendanceId);
                    restoredFromLocal = true;
                } else if (data.clockOutTime && activeKeyStr === todayStr) {
                    // Already clocked out today — show the label
                    setIsClockedIn(false);
                    setClockInTime(data.clockInTime);
                    setClockOutTime(data.clockOutTime);
                    restoredFromLocal = true;
                }
            } catch { /* corrupted data, will fall through to server check */ }
        }

        // SERVER VERIFICATION FALLBACK: If localStorage has no active clock-in,
        // ask the backend if this user already clocked in today.
        // This protects against cleared cache, different browser, etc.
        if (!restoredFromLocal && userName) {
            const role = localStorage.getItem('userRole') || 'video_editor';
            const checkUrl = `${APPS_SCRIPT_URL}?action=checkAttendance&name=${encodeURIComponent(userName)}&role=${encodeURIComponent(role)}&date=${encodeURIComponent(todayStr)}`;
            fetch(checkUrl)
                .then(res => res.json())
                .then(result => {
                    if (result.success && result.data) {
                        if (result.data.isClockedIn) {
                            setIsClockedIn(true);
                            setClockInTime(result.data.clockInTime);
                            setAttendanceId(result.data.attendanceId);
                            setSessionDate(todayStr);
                            // Re-persist to localStorage so subsequent reloads are instant
                            localStorage.setItem(`attendance_${todayStr}`, JSON.stringify({
                                isClockedIn: true,
                                clockInTime: result.data.clockInTime,
                                attendanceId: result.data.attendanceId
                            }));
                        } else if (result.data.clockOutTime) {
                            // Already clocked out today — restore label from server
                            setIsClockedIn(false);
                            setClockInTime(result.data.clockInTime);
                            setClockOutTime(result.data.clockOutTime);
                            setSessionDate(todayStr);
                            localStorage.setItem(`attendance_${todayStr}`, JSON.stringify({
                                isClockedIn: false,
                                clockInTime: result.data.clockInTime,
                                clockOutTime: result.data.clockOutTime
                            }));
                        }
                    }
                })
                .catch(() => { /* silently fail — user can still clock in manually */ });
        }

        // Live clock
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [userName]);

    const formatTime = (dateObj) => {
        return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const handleSaveName = () => {
        if (userName.trim()) {
            localStorage.setItem('lastUsedEditor', userName.trim());
            // Add to custom if not in list
            if (!employeeList.includes(userName.trim())) {
                const updatedCustom = [...customEmployees, userName.trim()];
                setCustomEmployees(updatedCustom);
                localStorage.setItem(customEmployeeStorageKey, JSON.stringify(updatedCustom));
            }
            setIsEditingName(false);
        }
    };

    const handleClientsChange = (newSelectedClients) => {
        // Add new clients to custom list if they don't exist
        newSelectedClients.forEach(client => {
            if (!clientList.includes(client)) {
                const newCustomClients = [...customClients, client];
                setCustomClients(newCustomClients);
                localStorage.setItem('customClients', JSON.stringify(newCustomClients));
            }
        });

        // Sync entries: keep existing, remove deselected, add new
        setEntries(prev => {
            const kept = prev.filter(e => newSelectedClients.includes(e.client));
            const existingClients = new Set(kept.map(e => e.client));
            newSelectedClients.forEach(client => {
                if (!existingClients.has(client)) {
                    kept.push({ id: Date.now() + Math.random(), client, title: '', notes: '' });
                }
            });
            return kept;
        });
    };

    const handleEntryChange = (entryId, field, value) => {
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, [field]: value } : e));
    };

    const duplicateEntry = (entryId) => {
        setEntries(prev => {
            const idx = prev.findIndex(e => e.id === entryId);
            if (idx === -1) return prev;
            const source = prev[idx];
            const updated = [...prev];
            updated.splice(idx + 1, 0, { id: Date.now() + Math.random(), client: source.client, title: '', notes: '' });
            return updated;
        });
    };

    const removeEntry = (entryId) => {
        setEntries(prev => prev.filter(e => e.id !== entryId));
    };

    const handleDeleteClient = (name) => {
        const newCustomClients = customClients.filter(c => c !== name);
        setCustomClients(newCustomClients);
        localStorage.setItem('customClients', JSON.stringify(newCustomClients));
        setEntries(prev => prev.filter(e => e.client !== name));
    };

    const openTodoModal = () => {
        setEntries([]);
        setAdditionalNotes('');
        setShowTodoModal(true);
    };

    const handleClockIn = async () => {
        setIsSubmitting(true);
        setStatusMessage('Clocking in...');

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); // e.g. "Mar 13, 2026"
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // e.g. "10:30 PM"
        const newAttendanceId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Calculate status locally to avoid Apps Script remote timezone issues
        let currentStatus = "On Time";
        if (now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15)) {
            currentStatus = "Late";
        }

        let generatedTodo = "I Will do:\n";
        entries.forEach((entry, idx) => {
            const title = entry.title || '';
            const notes = entry.notes || '';
            generatedTodo += `${idx + 1}. ${entry.client}, ${title}, ${notes}\n`;
        });
        if (additionalNotes.trim()) {
            generatedTodo += `\nadditional notes: ${additionalNotes}`;
        }

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'clockIn',
                    attendanceId: newAttendanceId,
                    name: userName,
                    role: userRole,
                    date: dateStr,
                    time: timeStr,
                    status: currentStatus,
                    todo: generatedTodo.trim(),
                    rawTimestamp: now.toISOString()
                }),
                redirect: 'follow'
            });

            const result = await response.json();

            if (result.success) {
                setIsClockedIn(true);
                setClockInTime(now);
                setClockOutTime(null);
                setAttendanceId(newAttendanceId);
                // Use consistent ISO date key (YYYY-MM-DD) so restore logic can find it
                const todayKey = getTodayKey();
                setSessionDate(todayKey);
                localStorage.setItem(`attendance_${todayKey}`, JSON.stringify({
                    isClockedIn: true,
                    clockInTime: now.toISOString(),
                    attendanceId: newAttendanceId
                }));
                // Clear the progress token so they are FORCED to submit a new progress form for this new session
                localStorage.removeItem('lastProgressDate');
                setStatusMessage('Clocked in successfully!');
                setShowTodoModal(false);
                setTimeout(() => setStatusMessage(''), 3000);
            } else {
                setStatusMessage('Error: ' + result.data.message);
            }
        } catch (error) {
            console.error('Clock in error:', error);
            setStatusMessage('Failed to connect to server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClockOut = async () => {
        const todayStr = getTodayKey();
        const lastProgressDate = localStorage.getItem('lastProgressDate');

        if (lastProgressDate !== todayStr) {
            setShowClockOutWarning(true);
            return;
        }

        setIsSubmitting(true);
        setStatusMessage('Clocking out...');

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); // e.g. "Mar 13, 2026"
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // e.g. "10:30 PM"

        let computedDuration = '0.00';
        if (clockInTime) {
            const inTimeObj = new Date(clockInTime);
            if (!isNaN(inTimeObj.getTime())) {
                const diff = (now.getTime() - inTimeObj.getTime()) / (1000 * 60 * 60);
                if (!isNaN(diff) && diff >= 0) {
                    computedDuration = diff.toFixed(2);
                }
            }
        }

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'clockOut',
                    attendanceId: attendanceId,
                    name: userName,
                    role: userRole,
                    date: dateStr,
                    time: timeStr,
                    durationHrs: computedDuration
                }),
                redirect: 'follow'
            });

            const result = await response.json();

            if (result.success) {
                setIsClockedIn(false);
                setClockOutTime(now.toISOString());
                // Use the sessionDate key (which could be from a previous day if they forgot to clock out)
                localStorage.setItem(`attendance_${sessionDate}`, JSON.stringify({
                    isClockedIn: false,
                    clockInTime: clockInTime,
                    clockOutTime: now.toISOString()
                }));
                setStatusMessage('Clocked out successfully! Great job today.');
                setTimeout(() => setStatusMessage(''), 5000);
            } else {
                setStatusMessage('Error: ' + result.data.message);
                // Fix for desynced states: if the server says they didn't clock in, reset the local frontend state
                if (result.data && result.data.message && result.data.message.includes("No Clock In record found")) {
                    localStorage.removeItem(`attendance_${sessionDate}`);
                    setIsClockedIn(false);
                    setClockInTime(null);
                    setAttendanceId(null);
                    setStatusMessage('Local state was stuck. Your session has been reset.');
                }
            }
        } catch (error) {
            console.error('Clock out error:', error);
            setStatusMessage('Failed to connect to server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLate = () => {
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        // Return true if it's past 9:15 AM
        return hours > 9 || (hours === 9 && minutes > 15);
    };

    if (isEditingName) {
        return (
            <Card className="attendance-card" style={{ marginBottom: 'var(--space-6)' }}>
                <CardBody>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <h3 style={{ margin: '0 0 var(--space-2)' }}>Employee Setup</h3>
                            <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: 'var(--text-sm)' }}>
                                Please enter your name first so we can track your attendance correctly.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                            <div style={{ width: '250px' }}>
                                <SearchableDropdown
                                    value={userName}
                                    onChange={setUserName}
                                    options={employeeList}
                                    placeholder="Select or add your name"
                                    allowCustom={true}
                                />
                            </div>
                            <button
                                onClick={handleSaveName}
                                disabled={!userName.trim()}
                                style={{
                                    padding: 'var(--space-2) var(--space-4)',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--primary-500)',
                                    color: 'white',
                                    border: 'none',
                                    cursor: userName.trim() ? 'pointer' : 'not-allowed',
                                    fontWeight: 600,
                                    fontSize: 'var(--text-sm)',
                                    opacity: userName.trim() ? 1 : 0.6
                                }}
                            >
                                Save Name
                            </button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <>
            <Card className="attendance-card" style={{ marginBottom: 'var(--space-6)' }}>
                <CardBody>
                    <div className="attendance-header-layout" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>

                        {/* Profile & Greeting */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 auto', minWidth: '240px' }}>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.2 }}>
                                        Hello, {userName}!
                                    </h3>
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        style={{ background: 'white', border: '1px solid var(--gray-200)', color: 'var(--gray-600)', cursor: 'pointer', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 500 }}>
                                    <Clock size={14} /> Schedule: 09:00 AM - 06:00 PM
                                </div>
                            </div>
                        </div>

                        {/* Clock, Status & Action Buttons Container */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: '3 1 auto', minWidth: '300px', borderLeft: '2px solid var(--gray-200)', paddingLeft: '1.5rem', gap: '1rem' }} className="responsive-border">
                            {/* Left Col: Clock & Date */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gray-900)', fontFamily: 'var(--font-heading)', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                                    {formatTime(currentTime)}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 500, marginBottom: clockInTime ? '0.5rem' : '0' }}>
                                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                {clockInTime && (
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                        <div style={{ fontSize: '0.75rem', color: sessionDate !== getTodayKey() ? 'var(--orange-500)' : 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: sessionDate !== getTodayKey() ? 'rgba(255, 152, 0, 0.1)' : 'var(--success-bg)', padding: '4px 10px', borderRadius: '20px' }}>
                                            <CheckCircle2 size={13} />
                                            {(() => {
                                                const inTimeObj = new Date(clockInTime);
                                                const timeStr = formatTime(inTimeObj);

                                                if (sessionDate !== getTodayKey()) {
                                                    const dateStr = inTimeObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                    return `Since ${dateStr}, ${timeStr}`;
                                                }
                                                return `In at ${timeStr}`;
                                            })()}
                                        </div>
                                        {clockOutTime && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'var(--gray-100)', padding: '4px 10px', borderRadius: '20px' }}>
                                                <LogOut size={13} />
                                                {(() => {
                                                    const outTimeObj = new Date(clockOutTime);
                                                    const timeStr = formatTime(outTimeObj);

                                                    if (sessionDate !== getTodayKey()) {
                                                        const dateStr = outTimeObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                        return `Out on ${dateStr}, ${timeStr}`;
                                                    }
                                                    return `Out at ${timeStr}`;
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right Col: Action Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                                {statusMessage && (
                                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-600)', textAlign: 'right', maxWidth: '140px' }}>
                                        {statusMessage}
                                    </span>
                                )}

                                {!isClockedIn ? (
                                    <button
                                        onClick={openTodoModal}
                                        disabled={isSubmitting}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                                            padding: 'var(--space-2) var(--space-4)',
                                            borderRadius: 'var(--radius-md)',
                                            border: 'none',
                                            fontWeight: 600,
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            background: isLate() ? 'var(--orange-500)' : 'var(--primary-500)',
                                            color: 'white',
                                            transition: 'all 0.2s',
                                            opacity: isSubmitting ? 0.7 : 1
                                        }}
                                    >
                                        <LogIn size={18} />
                                        {isSubmitting ? 'Processing...' : 'Clock In'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleClockOut}
                                        disabled={isSubmitting}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                                            padding: 'var(--space-2) var(--space-4)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--gray-300)',
                                            fontWeight: 600,
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            background: 'transparent',
                                            color: 'var(--gray-700)',
                                            transition: 'all 0.2s',
                                            opacity: isSubmitting ? 0.7 : 1
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSubmitting) e.currentTarget.style.background = 'var(--gray-100)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSubmitting) e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <LogOut size={18} />
                                        {isSubmitting ? 'Processing...' : 'Clock Out'}
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </CardBody>
            </Card>

            {/* Clock Out Warning Modal */}
            {showClockOutWarning && (
                <div className="modal-backdrop" onClick={() => setShowClockOutWarning(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '90%' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1.5rem 1.5rem' }}>
                            {/* Icon */}
                            <div style={{
                                width: '56px', height: '56px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '1rem', boxShadow: '0 2px 8px rgba(255,152,0,0.15)'
                            }}>
                                <ClipboardList size={26} style={{ color: 'var(--orange-500)' }} />
                            </div>

                            {/* Title */}
                            <h3 style={{
                                margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700,
                                color: 'var(--gray-900)'
                            }}>
                                Progress Form Belum Diisi
                            </h3>

                            {/* Message */}
                            <p style={{
                                margin: '0 0 1.5rem', fontSize: '0.9rem', color: 'var(--gray-500)',
                                lineHeight: 1.5, maxWidth: '300px'
                            }}>
                                Kamu belum submit progress hari ini. Silakan isi dulu sebelum clock out.
                            </p>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setShowClockOutWarning(false)}
                                    style={{ flex: 1, padding: '0.6rem', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: '0.9rem' }}
                                >
                                    Nanti
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => {
                                        setShowClockOutWarning(false);
                                        navigate('/progress');
                                    }}
                                    style={{
                                        flex: 2, padding: '0.6rem', borderRadius: 'var(--radius-md)',
                                        background: 'var(--primary-500)', color: 'white', border: 'none',
                                        fontWeight: 600, fontSize: '0.9rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
                                    }}
                                >
                                    <ClipboardList size={16} />
                                    Isi Progress Form
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* To-Do Modal */}
            {showTodoModal && (
                <div className="modal-backdrop" onClick={() => !isSubmitting && setShowTodoModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <ClipboardList size={20} style={{ color: 'var(--primary-500)' }} />
                                <h3 className="modal-title" style={{ fontSize: 'var(--text-lg)' }}>What will you do today?</h3>
                            </div>
                            <button
                                className="btn btn-icon"
                                onClick={() => !isSubmitting && setShowTodoModal(false)}
                                disabled={isSubmitting}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body" style={{ overflow: 'visible' }}>
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-700)', marginBottom: 'var(--space-2)' }}>
                                    <Users size={16} /> Customers
                                </label>
                                <MultiSelectDropdown
                                    selectedItems={selectedClients}
                                    onChange={handleClientsChange}
                                    options={clientList}
                                    placeholder="Select customer(s)"
                                    allowCustom={true}
                                    customItems={customClients}
                                    onDelete={handleDeleteClient}
                                />
                            </div>

                            {entries.length > 0 && (
                                <div style={{ background: 'var(--gray-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                                    {entries.map(entry => (
                                        <div key={entry.id} style={{ marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--gray-200)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--gray-700)' }}>{entry.client}</span>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button type="button" onClick={() => duplicateEntry(entry.id)} title="Duplicate" style={{
                                                        background: 'none', border: '1px solid var(--gray-300)', borderRadius: '4px',
                                                        padding: '3px', cursor: 'pointer', color: 'var(--blue-500)', display: 'flex'
                                                    }}><Copy size={12} /></button>
                                                    <button type="button" onClick={() => removeEntry(entry.id)} style={{
                                                        background: 'none', border: 'none', padding: '3px', cursor: 'pointer',
                                                        color: 'var(--gray-400)', display: 'flex'
                                                    }}><X size={12} /></button>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                                                <div style={{ minWidth: 0, position: 'relative' }}>
                                                    <SearchableDropdown
                                                        value={entry.title}
                                                        onChange={(val) => handleEntryChange(entry.id, 'title', val)}
                                                        options={getTitlesForClient(entry.client)}
                                                        placeholder="Select Title..."
                                                        allowCustom={true}
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Notes"
                                                    value={entry.notes}
                                                    onChange={(e) => handleEntryChange(entry.id, 'notes', e.target.value)}
                                                    style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)', width: '100%', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-700)', marginBottom: 'var(--space-2)' }}>
                                    <StickyNote size={16} /> Additional Notes
                                </label>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    placeholder="Any other tasks..."
                                    value={additionalNotes}
                                    onChange={(e) => setAdditionalNotes(e.target.value)}
                                    style={{ resize: 'vertical', minHeight: '80px', width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowTodoModal(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn"
                                onClick={handleClockIn}
                                disabled={(entries.length === 0 && !additionalNotes.trim()) || isSubmitting}
                                style={{
                                    background: isLate() ? 'var(--orange-500)' : 'var(--primary-500)',
                                    color: 'white',
                                    border: 'none',
                                    opacity: ((entries.length === 0 && !additionalNotes.trim()) || isSubmitting) ? 0.6 : 1
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={16} />
                                        Clock In
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AttendanceCard;
