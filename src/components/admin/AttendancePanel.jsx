import { useState, useEffect } from 'react'
import { Users, Inbox } from 'lucide-react'

const ALL_EMPLOYEES = [
    { name: 'Zayn', role: 'Video Editor' },
    { name: 'Ari', role: 'Video Editor' },
    { name: 'Hendi', role: 'Video Editor' },
    { name: 'Rosdiana', role: 'Illustrator' },
    { name: 'Dayah', role: 'Illustrator' },
    { name: 'Manda', role: 'Illustrator' },
    { name: 'Luky', role: 'Illustrator' },
    { name: 'Mike', role: 'Illustrator' },
    { name: 'Dian', role: 'Illustrator' },
    { name: 'Beka', role: 'Illustrator' },
    { name: 'Derrick', role: 'Illustrator' },
    { name: 'Vanda', role: 'Illustrator' },
    { name: 'Bagas', role: 'Illustrator' },
]

/**
 * Normalize raw time strings from Google Sheets.
 * Handles: "Sat Dec 30 1899 07:15:00 GMT+0642 ..." → "7:15 AM"
 * Also passes through already-formatted strings like "10:30 PM".
 */
function formatTime(raw) {
    if (!raw) return ''
    const str = String(raw).trim()
    if (!str) return ''

    // Already looks like a formatted time (e.g. "10:30 PM")
    if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(str)) return str

    // Try parsing as a Date (handles the 1899 Google Sheets time format)
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
        let h = d.getHours()
        const m = d.getMinutes().toString().padStart(2, '0')
        const ampm = h >= 12 ? 'PM' : 'AM'
        h = h % 12 || 12
        return `${h}:${m} ${ampm}`
    }

    // Fallback: return as-is
    return str
}

function getStatusBadge(clockIn, clockOut) {
    if (clockIn && !clockOut) return { label: 'Working', className: 'working' }
    if (clockIn && clockOut) return { label: 'Clocked Out', className: 'clocked-out' }
    return { label: 'Not Clocked In', className: 'not-in' }
}

function AttendancePanel({ attendance, loading, selectedDate, onDateChange }) {
    const [roleFilter, setRoleFilter] = useState('all')

    // Merge employee roster with attendance data
    const mergedRows = ALL_EMPLOYEES.map(emp => {
        const record = attendance.find(a => a.name.toLowerCase() === emp.name.toLowerCase())
        return {
            name: emp.name,
            role: emp.role,
            clockIn: record?.clockIn || '',
            clockOut: record?.clockOut || '',
            duration: record?.duration || '',
            scenes: record?.scenes || 0,
            status: record?.status || '',
            todo: record?.todo || '',
        }
    })

    const filtered = roleFilter === 'all'
        ? mergedRows
        : mergedRows.filter(r => r.role === roleFilter)

    return (
        <div className="admin-panel">
            <div className="admin-panel-header">
                <h2><Users size={18} /> Attendance</h2>
                <div className="admin-filters">
                    <input
                        type="date"
                        className="admin-filter-input"
                        value={selectedDate}
                        onChange={e => onDateChange(e.target.value)}
                        style={{ minWidth: 150 }}
                    />
                    <select
                        className="admin-filter-select"
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="Video Editor">Video Editor</option>
                        <option value="Illustrator">Illustrator</option>
                    </select>
                </div>
            </div>

            <div className="admin-table-wrap">
                {loading ? (
                    <div style={{ padding: 'var(--space-4)' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="admin-skeleton-row">
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '15%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '12%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '14%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '8%' }} />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="admin-empty">
                        <Inbox size={40} />
                        <p>No attendance records found</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Clock In</th>
                                <th>Clock Out</th>
                                <th>Duration</th>
                                <th>Scenes</th>
                                <th>To-Do</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(row => {
                                const badge = getStatusBadge(row.clockIn, row.clockOut)
                                return (
                                    <tr key={row.name}>
                                        <td style={{ fontWeight: 600 }}>{row.name}</td>
                                        <td>
                                            <span className={`admin-role-pill ${row.role === 'Video Editor' ? 've' : 'ill'}`}>
                                                {row.role === 'Video Editor' ? 'VE' : 'ILL'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`admin-badge ${badge.className}`}>
                                                <span className="admin-badge-dot" />
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td>{formatTime(row.clockIn) || '—'}</td>
                                        <td>{formatTime(row.clockOut) || '—'}</td>
                                        <td>{row.duration || '—'}</td>
                                        <td style={{ fontWeight: 600 }}>{row.scenes || '—'}</td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {row.todo || '—'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default AttendancePanel
