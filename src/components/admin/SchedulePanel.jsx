import { useState, useMemo } from 'react'
import { Gantt, ViewMode } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import { CalendarDays, Inbox, ExternalLink, List, BarChart3 } from 'lucide-react'

const STATUS_COLORS = {
    'done': { bar: '#10b981', progress: '#059669' },
    'in progress': { bar: '#3b82f6', progress: '#2563eb' },
    'not started': { bar: '#9ca3af', progress: '#6b7280' },
    'on hold': { bar: '#f59e0b', progress: '#d97706' },
    'review': { bar: '#8b5cf6', progress: '#7c3aed' },
    'cancelled': { bar: '#ef4444', progress: '#dc2626' },
}

function getStatusColor(status) {
    const key = (status || '').toLowerCase()
    return STATUS_COLORS[key] || STATUS_COLORS['not started']
}

function SchedulePanel({ schedule, loading }) {
    const [viewMode, setViewMode] = useState(ViewMode.Week)
    const [displayMode, setDisplayMode] = useState('gantt') // 'gantt' or 'table'
    const [statusFilter, setStatusFilter] = useState('')

    // Filter
    const filtered = useMemo(() => {
        if (!statusFilter) return schedule
        return schedule.filter(s => s.status.toLowerCase() === statusFilter.toLowerCase())
    }, [schedule, statusFilter])

    // Convert to gantt-task-react format
    const ganttTasks = useMemo(() => {
        return filtered
            .filter(item => item.start && item.end)
            .map(item => {
                const colors = getStatusColor(item.status)
                const start = new Date(item.start)
                let end = new Date(item.end)
                // gantt-task-react requires end > start
                if (end <= start) end = new Date(start.getTime() + 86400000)

                return {
                    id: item.id,
                    name: item.milestone || 'Untitled',
                    start: start,
                    end: end,
                    progress: item.progress || 0,
                    type: 'task',
                    styles: {
                        backgroundColor: colors.bar,
                        backgroundSelectedColor: colors.progress,
                        progressColor: colors.progress,
                        progressSelectedColor: colors.progress,
                    },
                }
            })
    }, [filtered])

    // Unique statuses for filter
    const statuses = useMemo(() => {
        const s = new Set(schedule.map(item => item.status).filter(Boolean))
        return Array.from(s)
    }, [schedule])

    if (loading) {
        return (
            <div className="admin-panel">
                <div className="admin-panel-header">
                    <h2><CalendarDays size={18} /> Schedule</h2>
                </div>
                <div style={{ padding: 'var(--space-4)' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="admin-skeleton-row">
                            <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                            <div className="admin-skeleton admin-skeleton-cell" style={{ width: '25%' }} />
                            <div className="admin-skeleton admin-skeleton-cell" style={{ width: '12%' }} />
                            <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                            <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                            <div className="admin-skeleton admin-skeleton-cell" style={{ width: '15%' }} />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="admin-panel">
            <div className="admin-panel-header">
                <h2><CalendarDays size={18} /> Schedule Timeline</h2>
                <div className="admin-filters">
                    <select
                        className="admin-filter-select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {/* View mode toggle */}
                    <div style={{ display: 'flex', gap: 2, background: 'var(--gray-100)', borderRadius: 'var(--radius-md)', padding: 2 }}>
                        <button
                            onClick={() => setDisplayMode('gantt')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', border: 'none', borderRadius: 'var(--radius-sm)',
                                background: displayMode === 'gantt' ? 'white' : 'transparent',
                                boxShadow: displayMode === 'gantt' ? 'var(--shadow-sm)' : 'none',
                                color: displayMode === 'gantt' ? 'var(--primary-600)' : 'var(--gray-500)',
                                cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600,
                            }}
                        >
                            <BarChart3 size={12} /> Gantt
                        </button>
                        <button
                            onClick={() => setDisplayMode('table')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', border: 'none', borderRadius: 'var(--radius-sm)',
                                background: displayMode === 'table' ? 'white' : 'transparent',
                                boxShadow: displayMode === 'table' ? 'var(--shadow-sm)' : 'none',
                                color: displayMode === 'table' ? 'var(--primary-600)' : 'var(--gray-500)',
                                cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 600,
                            }}
                        >
                            <List size={12} /> Table
                        </button>
                    </div>

                    {displayMode === 'gantt' && (
                        <select
                            className="admin-filter-select"
                            value={viewMode}
                            onChange={e => setViewMode(e.target.value)}
                        >
                            <option value={ViewMode.Day}>Day</option>
                            <option value={ViewMode.Week}>Week</option>
                            <option value={ViewMode.Month}>Month</option>
                        </select>
                    )}
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="admin-empty">
                    <Inbox size={40} />
                    <p>No schedule items found</p>
                </div>
            ) : displayMode === 'gantt' ? (
                /* Gantt Chart View */
                <div style={{ padding: '0 var(--space-2) var(--space-4)', overflow: 'auto' }}>
                    {ganttTasks.length > 0 ? (
                        <Gantt
                            tasks={ganttTasks}
                            viewMode={viewMode}
                            listCellWidth=""
                            columnWidth={viewMode === ViewMode.Month ? 200 : viewMode === ViewMode.Week ? 100 : 50}
                            barCornerRadius={4}
                            barFill={65}
                            fontSize="12"
                            headerHeight={50}
                            rowHeight={38}
                            todayColor="rgba(59, 130, 246, 0.08)"
                        />
                    ) : (
                        <div className="admin-empty">
                            <Inbox size={40} />
                            <p>No items with valid dates for Gantt view</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Table View */
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Milestone</th>
                                <th>Client</th>
                                <th>Assigned</th>
                                <th>Illustrator</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Days</th>
                                <th>Progress</th>
                                <th>Links</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(item => {
                                const colors = getStatusColor(item.status)
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                                padding: '2px 10px', borderRadius: 'var(--radius-full)',
                                                fontSize: 'var(--text-xs)', fontWeight: 600,
                                                background: colors.bar + '18', color: colors.bar,
                                            }}>
                                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.bar }} />
                                                {item.status || '—'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.milestone || '—'}
                                        </td>
                                        <td>{item.client || '—'}</td>
                                        <td>{item.assignedTo || '—'}</td>
                                        <td>{item.illustrator || '—'}</td>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: 'var(--text-xs)' }}>{item.start || '—'}</td>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: 'var(--text-xs)' }}>{item.end || '—'}</td>
                                        <td style={{ textAlign: 'center' }}>{item.days || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{
                                                    flex: 1, height: 6, borderRadius: 3,
                                                    background: 'var(--gray-100)', minWidth: 50,
                                                    overflow: 'hidden',
                                                }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: 3,
                                                        background: colors.bar,
                                                        width: `${item.progress}%`,
                                                        transition: 'width 0.3s ease',
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', minWidth: 30 }}>
                                                    {item.progress}%
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {item.link && (
                                                    <a href={item.link} target="_blank" rel="noopener noreferrer"
                                                        style={{ color: 'var(--primary-500)', display: 'flex' }}
                                                        title="Project Link">
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                                {item.linkBrief && (
                                                    <a href={item.linkBrief} target="_blank" rel="noopener noreferrer"
                                                        style={{ color: 'var(--purple-500)', display: 'flex' }}
                                                        title="Brief Link">
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default SchedulePanel
