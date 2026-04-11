import { useState } from 'react'
import { CalendarRange, Check, X, Inbox, MessageSquare } from 'lucide-react'

function LeaveManager({ leaves, loading, statusFilter, onStatusFilterChange, onAction, actionLoading }) {
    const [expandedId, setExpandedId] = useState(null)
    const [message, setMessage] = useState('')

    const handleAction = (id, status) => {
        onAction(id, status, message)
        setExpandedId(null)
        setMessage('')
    }

    return (
        <div className="admin-panel">
            <div className="admin-panel-header">
                <h2><CalendarRange size={18} /> Leave Requests</h2>
                <div className="admin-filters">
                    <select
                        className="admin-filter-select"
                        value={statusFilter}
                        onChange={e => onStatusFilterChange(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="admin-table-wrap">
                {loading ? (
                    <div style={{ padding: 'var(--space-4)' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="admin-skeleton-row">
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '14%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '12%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '12%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '8%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '16%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '12%' }} />
                            </div>
                        ))}
                    </div>
                ) : leaves.length === 0 ? (
                    <div className="admin-empty">
                        <Inbox size={40} />
                        <p>No leave requests found</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Role</th>
                                <th>Period</th>
                                <th>Duration</th>
                                <th>Reason</th>
                                <th>Notes</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.map(leave => {
                                const statusClass = leave.status.toLowerCase()
                                const isPending = statusClass === 'pending'
                                const isExpanded = expandedId === leave.id

                                return (
                                    <tr key={leave.id}>
                                        <td style={{ fontWeight: 600 }}>{leave.nama}</td>
                                        <td>
                                            <span className={`admin-role-pill ${leave.role?.toLowerCase().includes('illustr') ? 'ill' : 've'}`}>
                                                {leave.role?.toLowerCase().includes('illustr') ? 'ILL' : 'VE'}
                                            </span>
                                        </td>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: 'var(--text-xs)' }}>
                                            {leave.start} → {leave.end}
                                        </td>
                                        <td>{leave.duration} day{leave.duration > 1 ? 's' : ''}</td>
                                        <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {leave.alasan || '—'}
                                        </td>
                                        <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {leave.notes || '—'}
                                        </td>
                                        <td>
                                            <span className={`admin-badge ${statusClass}`}>
                                                {leave.status}
                                            </span>
                                            {leave.message && (
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <MessageSquare size={10} />
                                                    {leave.message}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {isPending ? (
                                                <div>
                                                    <div className="admin-leave-actions">
                                                        <button
                                                            className="admin-action-btn approve"
                                                            disabled={actionLoading}
                                                            onClick={() => {
                                                                if (isExpanded) {
                                                                    handleAction(leave.id, 'Approved')
                                                                } else {
                                                                    setExpandedId(leave.id)
                                                                    setMessage('')
                                                                }
                                                            }}
                                                        >
                                                            <Check size={12} />
                                                            {isExpanded ? 'Confirm' : 'Approve'}
                                                        </button>
                                                        <button
                                                            className="admin-action-btn reject"
                                                            disabled={actionLoading}
                                                            onClick={() => {
                                                                if (isExpanded) {
                                                                    handleAction(leave.id, 'Rejected')
                                                                } else {
                                                                    setExpandedId(leave.id)
                                                                    setMessage('')
                                                                }
                                                            }}
                                                        >
                                                            <X size={12} />
                                                            {isExpanded ? 'Confirm' : 'Reject'}
                                                        </button>
                                                    </div>
                                                    {isExpanded && (
                                                        <div className="admin-message-input">
                                                            <input
                                                                type="text"
                                                                placeholder="Optional message..."
                                                                value={message}
                                                                onChange={e => setMessage(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <button
                                                                className="admin-action-btn reject"
                                                                style={{ padding: '4px 8px' }}
                                                                onClick={() => { setExpandedId(null); setMessage('') }}
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--gray-400)', fontSize: 'var(--text-xs)' }}>—</span>
                                            )}
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

export default LeaveManager
