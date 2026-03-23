import { useState, useEffect } from 'react';
import { Card, CardBody } from './ui';
import { Clock, LogIn, LogOut, CheckCircle2, X, ClipboardList } from 'lucide-react';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZpWsJEOFlOQkDA55JyjV1q6CkpO37VNbFi7bxrJsB2LeheFwSrDQHbm_oR5D1hl0TKQ/exec';

function AttendanceCard() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isClockedIn, setIsClockedIn] = useState(false);
    const [clockInTime, setClockInTime] = useState(null);
    const [attendanceId, setAttendanceId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [showTodoModal, setShowTodoModal] = useState(false);
    const [todoText, setTodoText] = useState('');

    const [userName, setUserName] = useState(localStorage.getItem('lastUsedEditor') || '');
    const [isEditingName, setIsEditingName] = useState(!localStorage.getItem('lastUsedEditor'));

    const userRole = localStorage.getItem('userRole') || 'video_editor';

    // Load initial state from local storage so UI persists across page reloads
    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const savedAttendance = localStorage.getItem(`attendance_${todayStr}`);
        if (savedAttendance) {
            const data = JSON.parse(savedAttendance);
            setIsClockedIn(data.isClockedIn);
            setClockInTime(data.clockInTime);
            setAttendanceId(data.attendanceId);
        }

        // Live clock
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (dateObj) => {
        return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const handleSaveName = () => {
        if (userName.trim()) {
            localStorage.setItem('lastUsedEditor', userName.trim());
            setIsEditingName(false);
        }
    };

    const openTodoModal = () => {
        setTodoText('');
        setShowTodoModal(true);
    };

    const handleClockIn = async () => {
        setShowTodoModal(false);
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
                    todo: todoText.trim(),
                    rawTimestamp: now.toISOString()
                })
            });

            const result = await response.json();

            if (result.success) {
                setIsClockedIn(true);
                setClockInTime(now);
                setAttendanceId(newAttendanceId);
                localStorage.setItem(`attendance_${dateStr}`, JSON.stringify({
                    isClockedIn: true,
                    clockInTime: now,
                    attendanceId: newAttendanceId
                }));
                setStatusMessage('Clocked in successfully!');
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
                })
            });

            const result = await response.json();

            if (result.success) {
                setIsClockedIn(false);
                // We keep clockInTime state to show "Today you worked from X to Y" if desired
                localStorage.setItem(`attendance_${dateStr}`, JSON.stringify({
                    isClockedIn: false,
                    clockInTime: clockInTime,
                    clockOutTime: now
                }));
                setStatusMessage('Clocked out successfully! Great job today.');
                setTimeout(() => setStatusMessage(''), 5000);
            } else {
                setStatusMessage('Error: ' + result.data.message);
                // Fix for desynced states: if the server says they didn't clock in, reset the local frontend state
                if (result.data && result.data.message && result.data.message.includes("No Clock In record found")) {
                    localStorage.removeItem(`attendance_${dateStr}`);
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
                            <input
                                type="text"
                                placeholder="Your Name"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                style={{ padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)', outline: 'none', fontSize: 'var(--text-sm)' }}
                            />
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>

                        {/* Time & Schedule Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
                            <div>
                                <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '1px' }}>
                                    {formatTime(currentTime)}
                                </div>
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', marginTop: 'var(--space-1)' }}>
                                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>

                            <div style={{ paddingLeft: 'var(--space-6)', borderLeft: '1px solid var(--gray-300)' }}>
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-800)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                                    Hi, {userName}!
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary-500)', cursor: 'pointer', fontSize: 'var(--text-xs)', padding: 0 }}
                                    >
                                        (Edit Name)
                                    </button>
                                </div>
                                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                    <Clock size={14} /> Schedule: 09:00 AM - 06:00 PM
                                </div>
                                {clockInTime && (
                                    <div style={{ fontSize: 'var(--text-md)', color: 'var(--primary-600)', marginTop: 'var(--space-1)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                        <CheckCircle2 size={16} />
                                        Clocked in at {formatTime(new Date(clockInTime))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            {statusMessage && (
                                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)', marginRight: 'var(--space-2)' }}>
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
                </CardBody>
            </Card>

            {/* To-Do Modal */}
            {showTodoModal && (
                <div className="modal-backdrop" onClick={() => setShowTodoModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <ClipboardList size={20} style={{ color: 'var(--primary-500)' }} />
                                <h3 className="modal-title" style={{ fontSize: 'var(--text-lg)' }}>What's your plan today?</h3>
                            </div>
                            <button
                                className="btn btn-icon"
                                onClick={() => setShowTodoModal(false)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                                Briefly describe what you plan to work on today.
                            </p>
                            <textarea
                                className="input-field"
                                rows={3}
                                placeholder="e.g. Edit video for client X, finish illustration draft..."
                                value={todoText}
                                onChange={(e) => setTodoText(e.target.value)}
                                autoFocus
                                style={{ resize: 'vertical', minHeight: '80px' }}
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowTodoModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn"
                                onClick={handleClockIn}
                                style={{
                                    background: isLate() ? 'var(--orange-500)' : 'var(--primary-500)',
                                    color: 'white',
                                    border: 'none'
                                }}
                            >
                                <LogIn size={16} />
                                Clock In
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AttendanceCard;
