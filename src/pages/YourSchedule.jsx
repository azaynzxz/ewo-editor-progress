import { useState, useEffect, useMemo, useCallback } from 'react'
import { Gantt, ViewMode } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import {
    CalendarDays, RefreshCw, List, BarChart3, Inbox,
    ExternalLink, Maximize2, Minimize2, User
} from 'lucide-react'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZpWsJEOFlOQkDA55JyjV1q6CkpO37VNbFi7bxrJsB2LeheFwSrDQHbm_oR5D1hl0TKQ/exec'
const CACHE_KEY = 'ewo_my_schedule'

const STATUS_COLORS = {
    'done': '#10b981',
    'on hold': '#f59e0b',
    'under review': '#8b5cf6',
    'revision needed': '#ef4444',
}

function getStatusColor(status) {
    return STATUS_COLORS[(status || '').toLowerCase()] || '#9ca3af'
}

function matchesUser(field, userName) {
    if (!field || !userName) return false
    const normalizedField = field.toLowerCase().trim()
    const normalizedUser = userName.toLowerCase().trim()
    // Field can be comma-separated (e.g. "Zayn, Ari")
    return normalizedField.split(',').some(part => part.trim() === normalizedUser)
}

function YourSchedule() {
    const userName = localStorage.getItem('lastUsedEditor') || ''
    const [projects, setProjects] = useState(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY)
            return cached ? JSON.parse(cached) : []
        } catch { return [] }
    })
    const [isLoading, setIsLoading] = useState(false)
    const [view, setView] = useState('table')
    const [filterMode, setFilterMode] = useState('running') // 'running' or 'all'
    const [viewMode, setViewMode] = useState(ViewMode.Day)
    const [ganttFullscreen, setGanttFullscreen] = useState(false)
    const [lastFetched, setLastFetched] = useState(() => {
        try { return localStorage.getItem(CACHE_KEY + '_ts') || '' } catch { return '' }
    })

    const fetchProjects = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`${APPS_SCRIPT_URL}?action=getAdminProjects`)
            const result = await res.json()
            if (result.success && result.data?.projects) {
                const all = result.data.projects
                localStorage.setItem(CACHE_KEY, JSON.stringify(all))
                const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                localStorage.setItem(CACHE_KEY + '_ts', now)
                setLastFetched(now)
                setProjects(all)
            }
        } catch (err) {
            console.error('Failed to fetch schedule:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Filter projects where the user is assigned as illustrator or editor
    const myProjects = useMemo(() => {
        if (!userName) return []
        return projects.filter(p =>
            matchesUser(p.illustrator, userName) || matchesUser(p.editor, userName)
        )
    }, [projects, userName])

    const filteredProjects = useMemo(() => {
        if (filterMode === 'all') return myProjects
        return myProjects.filter(p => {
            const status = (p.projectStatus || '').toLowerCase()
            return status !== 'done' && status !== 'under review'
        })
    }, [myProjects, filterMode])

    const ganttTasks = useMemo(() => {
        return filteredProjects
            .filter(p => p.dlIllustrator && p.dlEditor)
            .map(p => {
                const start = new Date(p.dlIllustrator)
                let end = new Date(p.dlEditor)
                if (end <= start) end = new Date(start.getTime() + 86400000)
                const color = getStatusColor(p.projectStatus)
                return {
                    id: String(p.rowIndex),
                    name: p.projectName || `Project #${p.no}`,
                    start, end,
                    progress: (p.projectStatus || '').toLowerCase() === 'done' ? 100 : 50,
                    type: 'task',
                    styles: {
                        backgroundColor: color, backgroundSelectedColor: color,
                        progressColor: color + 'cc', progressSelectedColor: color + 'cc',
                    },
                }
            })
    }, [filteredProjects])

    // Only auto-fetch if no cached data
    useEffect(() => {
        if (projects.length === 0 && userName) fetchProjects()
    }, [])

    const myRole = useMemo(() => {
        if (!userName || myProjects.length === 0) return null
        const isIll = myProjects.some(p => matchesUser(p.illustrator, userName))
        const isEd = myProjects.some(p => matchesUser(p.editor, userName))
        if (isIll && isEd) return 'Illustrator & Editor'
        if (isIll) return 'Illustrator'
        return 'Editor'
    }, [myProjects, userName])

    if (!userName) {
        return (
            <div className="ys-page">
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <User size={48} style={{ color: 'var(--gray-300)', marginBottom: 'var(--space-3)' }} />
                    <h3 style={{ margin: '0 0 var(--space-2)', fontWeight: 700 }}>No Name Set</h3>
                    <p style={{ color: 'var(--gray-500)', margin: 0, fontSize: 'var(--text-sm)' }}>
                        Please set your name in the <strong>Dashboard</strong> attendance card first.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="ys-page">
            {/* Header */}
            <div className="ys-header">
                <div>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1.25rem' }}>
                        <CalendarDays size={20} /> Your Schedule
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'var(--gray-500)', fontSize: 'var(--text-sm)' }}>
                        Projects assigned to <strong style={{ color: 'var(--primary-600)' }}>{userName}</strong>
                        {myRole && <span className="ys-role-tag">{myRole}</span>}
                        {lastFetched && <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', color: 'var(--gray-400)' }}>Updated {lastFetched}</span>}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div className="ys-view-toggle">
                        <button onClick={() => setView('table')} className={`ys-view-btn ${view === 'table' ? 'active' : ''}`}>
                            <List size={12} /> Table
                        </button>
                        <button onClick={() => setView('gantt')} className={`ys-view-btn ${view === 'gantt' ? 'active' : ''}`}>
                            <BarChart3 size={12} /> Gantt
                        </button>
                    </div>
                    {view === 'gantt' && (
                        <>
                            <select className="ys-select" value={viewMode} onChange={e => setViewMode(e.target.value)}>
                                <option value={ViewMode.Day}>Day</option>
                                <option value={ViewMode.Week}>Week</option>
                                <option value={ViewMode.Month}>Month</option>
                            </select>
                            <button onClick={() => setGanttFullscreen(true)} className="ys-icon-btn" title="Fullscreen">
                                <Maximize2 size={14} />
                            </button>
                        </>
                    )}
                    <button onClick={fetchProjects} disabled={isLoading} className="ys-refresh-btn">
                        <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
                        {isLoading ? 'Fetching…' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Summary cards (Moved to top) */}
            {myProjects.length > 0 && (
                <div className="ys-summary">
                    <div className="ys-summary-card">
                        <span className="ys-summary-num">{myProjects.length}</span>
                        <span className="ys-summary-label">Total Projects</span>
                    </div>
                    <div className="ys-summary-card">
                        <span className="ys-summary-num" style={{ color: '#10b981' }}>
                            {myProjects.filter(p => (p.projectStatus || '').toLowerCase() === 'done').length}
                        </span>
                        <span className="ys-summary-label">Done</span>
                    </div>
                    <div className="ys-summary-card">
                        <span className="ys-summary-num" style={{ color: '#3b82f6' }}>
                            {myProjects.filter(p => (p.projectStatus || '').toLowerCase() !== 'done' && p.projectStatus).length}
                        </span>
                        <span className="ys-summary-label">In Progress</span>
                    </div>
                    <div className="ys-summary-card">
                        <span className="ys-summary-num" style={{ color: '#ef4444' }}>
                            {myProjects.filter(p => (p.risk || '').includes('High')).length}
                        </span>
                        <span className="ys-summary-label">High Risk</span>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '-8px' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-600)' }}>Filter:</span>
                <div className="ys-view-toggle">
                    <button onClick={() => setFilterMode('running')} className={`ys-view-btn ${filterMode === 'running' ? 'active' : ''}`}>
                        Running
                    </button>
                    <button onClick={() => setFilterMode('all')} className={`ys-view-btn ${filterMode === 'all' ? 'active' : ''}`}>
                        All
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="card" style={{ overflow: 'hidden' }}>
                {isLoading && myProjects.length === 0 ? (
                    <div className="ys-empty">
                        <RefreshCw size={32} className="spin" style={{ color: 'var(--gray-300)' }} />
                        <p>Loading your projects…</p>
                    </div>
                ) : myProjects.length === 0 ? (
                    <div className="ys-empty">
                        <Inbox size={40} style={{ color: 'var(--gray-300)' }} />
                        <p>No projects assigned to you this month</p>
                    </div>
                ) : view === 'gantt' ? (
                    <div style={{ overflow: 'auto', padding: 'var(--space-3)' }}>
                        {ganttTasks.length > 0 ? (
                            <Gantt
                                tasks={ganttTasks} viewMode={viewMode} listCellWidth=""
                                columnWidth={viewMode === ViewMode.Month ? 200 : viewMode === ViewMode.Week ? 100 : 50}
                                barCornerRadius={4} barFill={65} fontSize="12"
                                headerHeight={50} rowHeight={38}
                                todayColor="rgba(59, 130, 246, 0.08)"
                            />
                        ) : (
                            <div className="ys-empty">
                                <Inbox size={40} style={{ color: 'var(--gray-300)' }} />
                                <p>No projects with valid dates for Gantt view</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ overflow: 'auto' }}>
                        <table className="ys-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>#</th>
                                    <th>Project</th>
                                    <th>Client</th>
                                    <th>Role</th>
                                    <th>Brief</th>
                                    <th>DL Illustrator</th>
                                    <th>DL Editor</th>
                                    <th>Status</th>
                                    <th>Risk</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.map(p => {
                                    const isIll = matchesUser(p.illustrator, userName)
                                    const isEd = matchesUser(p.editor, userName)
                                    const roleLabel = isIll && isEd ? 'Both' : isIll ? 'Illustrator' : 'Editor'
                                    const statusColor = getStatusColor(p.projectStatus)
                                    return (
                                        <tr key={p.rowIndex}>
                                            <td style={{ color: 'var(--gray-400)', fontSize: 'var(--text-xs)' }}>{p.no}</td>
                                            <td style={{ fontWeight: 600 }}>{p.projectName}</td>
                                            <td style={{ fontSize: 'var(--text-xs)' }}>{p.clients || '—'}</td>
                                            <td>
                                                <span className={`ys-role-badge ${isIll ? 'ys-role-ill' : 'ys-role-ed'}`}>
                                                    {roleLabel}
                                                </span>
                                            </td>
                                            <td>
                                                {p.briefLinks ? (
                                                    <a href={p.briefLinks} target="_blank" rel="noopener noreferrer" className="ys-brief-chip">
                                                        <ExternalLink size={11} />
                                                        {p.briefLinksLabel || 'Open'}
                                                    </a>
                                                ) : '—'}
                                            </td>
                                            <td style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>{p.dlIllustrator || '—'}</td>
                                            <td style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>{p.dlEditor || '—'}</td>
                                            <td>
                                                {p.projectStatus ? (
                                                    <span className="ys-status-badge" style={{ color: statusColor, borderColor: statusColor + '33', background: statusColor + '11' }}>
                                                        {p.projectStatus}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td>
                                                {p.risk ? (
                                                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: p.risk.includes('High') ? '#ef4444' : '#f59e0b' }}>
                                                        {p.risk}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                title={p.projectNotes}>
                                                {p.projectNotes || '—'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        {filteredProjects.length === 0 && (
                            <div className="ys-empty" style={{ padding: 'var(--space-8)' }}>
                                <Inbox size={40} style={{ color: 'var(--gray-300)' }} />
                                <p>No projects match the current filter</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Gantt fullscreen */}
            {ganttFullscreen && (
                <div className="ys-fullscreen-overlay">
                    <div className="ys-fullscreen-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                            <BarChart3 size={18} /> {userName}'s Schedule
                        </h3>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <select className="ys-select" value={viewMode} onChange={e => setViewMode(e.target.value)}>
                                <option value={ViewMode.Day}>Day</option>
                                <option value={ViewMode.Week}>Week</option>
                                <option value={ViewMode.Month}>Month</option>
                            </select>
                            <button onClick={() => setGanttFullscreen(false)} className="ys-close-btn">
                                <Minimize2 size={14} /> Close
                            </button>
                        </div>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-4)' }}>
                        {ganttTasks.length > 0 ? (
                            <Gantt
                                tasks={ganttTasks} viewMode={viewMode} listCellWidth=""
                                columnWidth={viewMode === ViewMode.Month ? 200 : viewMode === ViewMode.Week ? 100 : 50}
                                barCornerRadius={4} barFill={65} fontSize="12"
                                headerHeight={50} rowHeight={38}
                                todayColor="rgba(59, 130, 246, 0.08)"
                            />
                        ) : (
                            <div className="ys-empty"><p>No valid Gantt data</p></div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .ys-page { display: flex; flex-direction: column; gap: var(--space-4); }
                .ys-header {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    flex-wrap: wrap; gap: var(--space-3);
                }
                .ys-role-tag {
                    display: inline-block; padding: 1px 8px; border-radius: var(--radius-full);
                    background: var(--primary-50); color: var(--primary-600);
                    font-size: 11px; font-weight: 600; margin-left: 8px;
                    border: 1px solid var(--primary-100);
                }
                .ys-view-toggle {
                    display: flex; gap: 2px; background: var(--gray-100);
                    border-radius: var(--radius-md); padding: 2px;
                }
                .ys-view-btn {
                    display: flex; align-items: center; gap: 4px;
                    padding: 5px 12px; border: none; border-radius: var(--radius-sm);
                    background: transparent; color: var(--gray-500);
                    cursor: pointer; font-size: var(--text-xs); font-weight: 600;
                    transition: all 0.15s;
                }
                .ys-view-btn.active {
                    background: white; color: var(--primary-600);
                    box-shadow: var(--shadow-sm);
                }
                .ys-select {
                    padding: 5px 10px; border: 1px solid var(--gray-200);
                    border-radius: var(--radius-md); font-size: var(--text-xs);
                    background: white; color: var(--gray-700); cursor: pointer;
                }
                .ys-icon-btn {
                    display: flex; align-items: center; padding: 5px;
                    border: 1px solid var(--gray-200); border-radius: var(--radius-sm);
                    background: white; color: var(--gray-500); cursor: pointer;
                }
                .ys-icon-btn:hover { color: var(--primary-600); }
                .ys-refresh-btn {
                    display: flex; align-items: center; gap: 6px;
                    padding: 6px 14px; background: var(--primary-500); color: white;
                    border: none; border-radius: var(--radius-md);
                    font-size: var(--text-xs); font-weight: 600; cursor: pointer;
                    transition: all 0.2s;
                }
                .ys-refresh-btn:hover { background: var(--primary-600); }
                .ys-refresh-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .ys-empty {
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; padding: var(--space-8); gap: var(--space-2);
                    color: var(--gray-400); font-size: var(--text-sm);
                }
                .ys-table {
                    width: 100%; border-collapse: collapse; font-size: var(--text-sm);
                }
                .ys-table th {
                    text-align: left; padding: 10px 12px; font-size: var(--text-xs);
                    font-weight: 600; color: var(--gray-500); text-transform: uppercase;
                    letter-spacing: 0.05em; border-bottom: 2px solid var(--gray-100);
                    background: var(--gray-50); white-space: nowrap;
                }
                .ys-table td {
                    padding: 10px 12px; border-bottom: 1px solid var(--gray-100);
                    vertical-align: middle;
                }
                .ys-table tbody tr:hover { background: var(--gray-50); }
                .ys-role-badge {
                    display: inline-block; padding: 2px 8px; border-radius: var(--radius-full);
                    font-size: 10px; font-weight: 700; white-space: nowrap;
                }
                .ys-role-ill { background: #fef3c7; color: #92400e; }
                .ys-role-ed { background: #dbeafe; color: #1e40af; }
                .ys-brief-chip {
                    display: inline-flex; align-items: center; gap: 4px;
                    padding: 2px 8px; border-radius: var(--radius-full);
                    background: var(--primary-50); color: var(--primary-600);
                    font-size: 11px; font-weight: 600; text-decoration: none;
                    border: 1px solid var(--primary-100);
                    max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    transition: all 0.15s;
                }
                .ys-brief-chip:hover { background: var(--primary-100); }
                .ys-status-badge {
                    display: inline-block; padding: 2px 8px; border-radius: var(--radius-full);
                    font-size: 11px; font-weight: 600; border: 1px solid;
                }
                .ys-summary {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: var(--space-3);
                }
                .ys-summary-card {
                    display: flex; flex-direction: column; align-items: center;
                    padding: var(--space-3); background: white; border-radius: var(--radius-lg);
                    border: 1px solid var(--gray-100); box-shadow: var(--shadow-sm);
                }
                .ys-summary-num { font-size: 1.5rem; font-weight: 800; color: var(--gray-900); }
                .ys-summary-label { font-size: var(--text-xs); color: var(--gray-500); font-weight: 600; }
                .ys-fullscreen-overlay {
                    position: fixed; inset: 0; z-index: 9999;
                    background: white; display: flex; flex-direction: column;
                    animation: ys-fadeIn 0.2s ease;
                }
                .ys-fullscreen-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: var(--space-3) var(--space-4);
                    border-bottom: 1px solid var(--gray-200);
                }
                .ys-close-btn {
                    display: flex; align-items: center; gap: 6px;
                    padding: 6px 14px; background: white; color: var(--gray-600);
                    border: 1px solid var(--gray-200); border-radius: var(--radius-md);
                    font-size: var(--text-sm); font-weight: 600; cursor: pointer;
                }
                .ys-close-btn:hover { background: var(--gray-50); }
                @keyframes ys-fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    )
}

export default YourSchedule
