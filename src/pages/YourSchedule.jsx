import { useState, useEffect, useMemo, useCallback } from 'react'
import { Gantt, ViewMode } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import {
    CalendarDays, RefreshCw, List, BarChart3, Inbox,
    ExternalLink, Maximize2, Minimize2, User, Check, FolderOpen,
    AlertCircle
} from 'lucide-react'
import { CustomTaskListHeader, CustomTaskListTable, CustomTooltip, getTaskColor } from '../utils/ganttUtils'

const APPS_SCRIPT_URL = '/api/exec'
const CACHE_KEY = 'ewo_my_schedule'



function matchesUser(field, userName) {
    if (!field || !userName) return false
    const normalizedField = field.toLowerCase().trim()
    const normalizedUser = userName.toLowerCase().trim()
    // Field can be comma-separated (e.g. "Zayn, Ari")
    return normalizedField.split(',').some(part => part.trim() === normalizedUser)
}

function getMonthYearFromDateString(dateStr) {
    if (!dateStr) return null
    let date = dateStr
    if (dateStr instanceof Date) {
        const y = dateStr.getFullYear()
        const m = String(dateStr.getMonth() + 1).padStart(2, '0')
        const d = String(dateStr.getDate()).padStart(2, '0')
        date = `${y}-${m}-${d}`
    }
    const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
        const year = match[1]
        const monthNum = parseInt(match[2], 10)
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        const monthName = months[monthNum - 1]
        if (monthName) {
            return {
                monthName,
                year,
                label: `${monthName} ${year}`,
                sortKey: `${year}-${String(monthNum).padStart(2, '0')}`
            }
        }
    }
    const dObj = new Date(dateStr)
    if (!isNaN(dObj.getTime())) {
        const monthName = dObj.toLocaleString('en-US', { month: 'long' })
        const year = dObj.getFullYear()
        const monthNum = dObj.getMonth() + 1
        return {
            monthName,
            year,
            label: `${monthName} ${year}`,
            sortKey: `${year}-${String(monthNum).padStart(2, '0')}`
        }
    }
    return null
}

import { fetchAllSheetsProjects } from '../utils/projectFetcher'

function YourSchedule({ isWidget = false }) {
    const [userName, setUserName] = useState(
        () => localStorage.getItem('lastUsedEditor') || localStorage.getItem('userName') || ''
    )
    const [nameInput, setNameInput] = useState('')
    const [projects, setProjects] = useState(() => {
        try {
            const cached = localStorage.getItem('ewo_all_projects_cache')
            return cached ? JSON.parse(cached) : []
        } catch { return [] }
    })
    const [availableSheets, setAvailableSheets] = useState(() => {
        try {
            const cached = localStorage.getItem('ewo_available_sheets')
            return cached ? JSON.parse(cached) : []
        } catch { return [] }
    })
    const [isLoading, setIsLoading] = useState(false)
    const [view, setView] = useState('table')
    const [selectedMonth, setSelectedMonth] = useState('all')
    const [statusFilter, setStatusFilter] = useState('active')
    const [hasInitializedMonth, setHasInitializedMonth] = useState(false)
    const [viewMode, setViewMode] = useState(ViewMode.Day)
    const [ganttFullscreen, setGanttFullscreen] = useState(false)
    const [lastFetched, setLastFetched] = useState(() => {
        try { return localStorage.getItem('ewo_my_schedule_ts') || '' } catch { return '' }
    })

    const fetchProjects = useCallback(async (forceRefresh = false) => {
        setIsLoading(true)
        try {
            // Note: The UI's onClick passes an Event object, so check if it's explicitly true
            const isForced = forceRefresh === true;
            const result = await fetchAllSheetsProjects(isForced)
            if (result.success || result.projects?.length > 0) {
                const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                localStorage.setItem('ewo_my_schedule_ts', now)
                setLastFetched(now)
                setProjects(result.projects)
                if (result.availableSheets) {
                    setAvailableSheets(result.availableSheets)
                }
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

    // Compute unique months from availableSheets or fall back to projects if empty
    const availableMonths = useMemo(() => {
        const getSortVal = (mStr) => {
            const monthsOrder = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
            const match = mStr.toLowerCase().match(/^([a-z]+)\s+(\d{4})/)
            if (!match) return 0
            const idx = monthsOrder.indexOf(match[1])
            const year = parseInt(match[2], 10)
            return year * 12 + idx
        }

        if (availableSheets.length > 0) {
            return availableSheets
                .filter(sheet => sheet !== 'Membuka Mata Batin Internal')
                .map(sheet => ({
                    label: sheet,
                    sortKey: getSortVal(sheet)
                })).sort((a, b) => a.sortKey - b.sortKey)
        }

        // Fallback to computing from projects if cache is not yet populated
        const monthsMap = new Map()
        myProjects.forEach(p => {
            ;['dlIllustrator', 'dlEditor'].forEach(key => {
                const val = p[key]
                const parsed = getMonthYearFromDateString(val)
                if (parsed) {
                    monthsMap.set(parsed.label, parsed.label)
                }
            })
        })
        return Array.from(monthsMap.values()).map(label => ({
            label,
            sortKey: getSortVal(label)
        })).sort((a, b) => a.sortKey - b.sortKey)
    }, [availableSheets, myProjects])

    // Auto-select current month if available on initial data load
    useEffect(() => {
        if (availableMonths.length > 0 && !hasInitializedMonth) {
            const today = new Date()
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            const currentLabel = `${months[today.getMonth()]} ${today.getFullYear()}`
            const hasCurrent = availableMonths.some(m => m.label === currentLabel)
            if (hasCurrent) {
                setSelectedMonth(currentLabel)
            }
            setHasInitializedMonth(true)
        }
    }, [availableMonths, hasInitializedMonth])

    const filteredProjects = useMemo(() => {
        let list = myProjects

        if (statusFilter === 'active') {
            const EXCLUDED = ['done', 'on hold', 'under review', 'canceled', 'finished', 'postponed', 'ready to illus tag']
            const MMB_ACTIVE_PROGRESS = ['on progress', 'need revision', 'ready to edit']
            
            list = list.filter(p => {
                const s1 = (p.projectStatus || '').toLowerCase()
                const s2 = (p.progress || '').toLowerCase()
                
                if (p.clients === 'Internal MMB') {
                    return MMB_ACTIVE_PROGRESS.includes(s2)
                }
                
                return !EXCLUDED.includes(s1) && !EXCLUDED.includes(s2)
            })
        } else if (statusFilter === 'done') {
            const EXCLUDED = ['done', 'canceled', 'finished', 'postponed', 'ready to illus tag']
            list = list.filter(p => {
                const s1 = (p.projectStatus || '').toLowerCase()
                const s2 = (p.progress || '').toLowerCase()
                return EXCLUDED.includes(s1) || EXCLUDED.includes(s2)
            })
        }

        if (selectedMonth !== 'all') {
            list = list.filter(p => {
                // Bypass filter for Internal projects or projects missing deadlines so they don't disappear
                if (p.clients === 'Internal MMB' || (!p.dlIllustrator && !p.dlEditor)) return true
                return ['dlIllustrator', 'dlEditor'].some(key => {
                    const val = p[key]
                    const parsed = getMonthYearFromDateString(val)
                    return parsed && parsed.label === selectedMonth
                })
            })
        }
        return list
    }, [myProjects, selectedMonth, statusFilter])

    const ganttTasks = useMemo(() => {
        let tasks = filteredProjects
            .filter(p => p.dlIllustrator && p.dlEditor)
            .map((p, index) => {
                const start = new Date(p.dlIllustrator)
                start.setHours(0, 0, 0, 0)
                let end = new Date(p.dlEditor)
                end.setHours(23, 59, 59, 999)

                if (end <= start) {
                    end = new Date(start.getTime())
                    end.setHours(23, 59, 59, 999)
                }
                const color = getTaskColor(p.projectStatus, p.risk, p.projectName, index)
                return {
                    id: String(p.rowIndex),
                    name: '',
                    projectName: p.projectName || `Project #${p.no}`,
                    start, end,
                    progress: (p.projectStatus || '').toLowerCase() === 'done' ? 100 : 50,
                    type: 'task',
                    styles: {
                        backgroundColor: color, backgroundSelectedColor: color,
                        progressColor: color + 'cc', progressSelectedColor: color + 'cc',
                    },
                }
            })

        if (tasks.length > 0) {
            const now = new Date()
            now.setHours(0, 0, 0, 0)
            tasks.push({
                id: 'today-bounds-fix',
                name: '',
                start: now,
                end: now,
                type: 'task',
                progress: 0,
                isDisabled: true,
                styles: {
                    backgroundColor: 'transparent', backgroundSelectedColor: 'transparent',
                    progressColor: 'transparent', progressSelectedColor: 'transparent'
                }
            })
        }
        return tasks
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

    const handleSetName = () => {
        const trimmed = nameInput.trim()
        if (!trimmed) return
        localStorage.setItem('lastUsedEditor', trimmed)
        setUserName(trimmed)
        setNameInput('')
    }

    if (!userName) {
        if (isWidget) {
            return (
                <div className="card schedule-widget-wrapper" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--gray-100)' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--gray-900)' }}>
                            <CalendarDays size={18} style={{ color: 'var(--primary-500)' }} /> Your Schedule
                        </h3>
                    </div>
                    <div className="ys-empty" style={{ flex: 1, padding: 'var(--space-4)', textAlign: 'center' }}>
                        <User size={32} style={{ color: 'var(--primary-300)', marginBottom: '8px' }} />
                        <p style={{ margin: '0 0 8px', fontSize: 'var(--text-sm)' }}>Siapa namamu?</p>
                        <a href="/schedule" style={{ fontSize: 'var(--text-xs)', color: 'white', background: 'var(--primary-500)', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600 }}>Set Nama</a>
                    </div>
                </div>
            )
        }

        return (
            <div className="ys-page">
                <div className="card" style={{ maxWidth: 400, margin: '0 auto', padding: 'var(--space-6)', textAlign: 'center' }}>
                    <User size={40} style={{ color: 'var(--primary-300)', marginBottom: 'var(--space-3)' }} />
                    <h3 style={{ margin: '0 0 var(--space-2)', fontWeight: 700 }}>Siapa namamu?</h3>
                    <p style={{ color: 'var(--gray-500)', margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)' }}>
                        Masukkan namamu (sesuai yang ada di database) untuk melihat jadwalmu.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <input
                            type="text"
                            className="input"
                            placeholder="Contoh: Zurvi"
                            value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSetName()}
                            autoFocus
                            style={{ flex: 1 }}
                        />
                        <button
                            onClick={handleSetName}
                            disabled={!nameInput.trim()}
                            style={{
                                padding: '0 var(--space-4)', background: 'var(--primary-500)', color: 'white',
                                border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600,
                                fontSize: 'var(--text-sm)', cursor: 'pointer', whiteSpace: 'nowrap',
                                opacity: nameInput.trim() ? 1 : 0.5,
                            }}
                        >
                            Lihat Jadwal
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (isWidget) {
        const today = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const currentMonthLabel = `${months[today.getMonth()]} ${today.getFullYear()}`;

        const EXCLUDED_STATUS = ['done', 'on hold', 'under review', 'canceled', 'finished', 'postponed', 'ready to illus tag'];
        const MMB_ACTIVE_PROGRESS = ['on progress', 'need revision', 'ready to edit'];

        const sortedProjects = [...myProjects].filter(p => {
            const status = (p.projectStatus || '').toLowerCase();
            const progress = (p.progress || '').toLowerCase();
            const isInternal = p.clients === 'Internal MMB';

            if (isInternal) {
                if (!MMB_ACTIVE_PROGRESS.includes(progress)) return false;
            } else {
                if (EXCLUDED_STATUS.includes(status) || EXCLUDED_STATUS.includes(progress)) return false;
            }

            const isCurrentMonth = ['dlIllustrator', 'dlEditor'].some(key => {
                const val = p[key];
                const parsed = getMonthYearFromDateString(val);
                return parsed && parsed.label === currentMonthLabel;
            });

            return isCurrentMonth || isInternal;
        }).sort((a, b) => {
            const aIsMMB = a.clients === 'Internal MMB';
            const bIsMMB = b.clients === 'Internal MMB';
            if (aIsMMB && !bIsMMB) return 1;
            if (!aIsMMB && bIsMMB) return -1;

            const dateA = new Date(a.dlEditor || a.dlIllustrator || '2099-01-01');
            const dateB = new Date(b.dlEditor || b.dlIllustrator || '2099-01-01');
            return dateA - dateB;
        }).slice(0, 4);

        return (
            <div className="card schedule-widget-wrapper" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--gray-900)' }}>
                        <CalendarDays size={18} style={{ color: 'var(--primary-500)' }} /> Your Schedule
                    </h3>
                    <a href="/schedule" style={{ fontSize: 'var(--text-xs)', color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        View All <ExternalLink size={12} />
                    </a>
                </div>
                <div style={{ padding: 'var(--space-3)', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {isLoading && myProjects.length === 0 ? (
                        <div className="ys-empty" style={{ padding: 'var(--space-4)' }}>
                            <RefreshCw size={24} className="spin" style={{ color: 'var(--gray-300)' }} />
                        </div>
                    ) : myProjects.length === 0 ? (
                        <div className="ys-empty" style={{ padding: 'var(--space-4)' }}>
                            <Inbox size={24} style={{ color: 'var(--gray-300)' }} />
                            <p style={{ margin: 0, fontSize: '0.8rem' }}>No projects assigned</p>
                        </div>
                    ) : sortedProjects.length === 0 ? (
                        <div className="ys-empty" style={{ padding: 'var(--space-4)' }}>
                            <Check size={24} style={{ color: '#10b981' }} />
                            <p style={{ margin: 0, fontSize: '0.8rem' }}>All caught up!</p>
                        </div>
                    ) : (
                        sortedProjects.map((p, idx) => {
                            const dlDateStr = p.dlEditor || p.dlIllustrator;
                            let formattedDate = '—';
                            let isOverdue = false;

                            if (dlDateStr) {
                                const d = new Date(dlDateStr);
                                if (!isNaN(d.getTime())) {
                                    const monthsId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                                    formattedDate = `${d.getDate()} ${monthsId[d.getMonth()]} ${d.getFullYear()}`;

                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    isOverdue = d < today;
                                } else {
                                    formattedDate = dlDateStr;
                                }
                            }

                            return (
                                <div key={p.rowIndex} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-200)', borderLeft: p.clients === 'Internal MMB' ? '4px solid #9333ea' : '4px solid #16a34a', transition: 'all 0.2s' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-900)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {p.projectName}
                                        </div>
                                        {p.briefLinks && (
                                            <a href={p.briefLinks} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, padding: '4px', background: 'white', color: 'var(--primary-600)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--gray-200)', textDecoration: 'none' }} title="Open Google Drive">
                                                <FolderOpen size={14} />
                                            </a>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '6px' }}>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: isOverdue ? '#fef2f2' : 'white', color: isOverdue ? '#ef4444' : 'var(--gray-600)', border: `1px solid ${isOverdue ? '#fecaca' : 'var(--gray-200)'}`, whiteSpace: 'nowrap' }}>
                                                {formattedDate}
                                            </span>
                                            {isOverdue && (
                                                <span title="Overdue" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <AlertCircle size={16} color="#ef4444" strokeWidth={2.5} />
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                            {p.risk && (
                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: p.risk.includes('High') ? '#ef4444' : '#f59e0b', whiteSpace: 'nowrap' }}>
                                                    {p.risk}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        )
    }

    const projectGroups = [
        { title: 'Client Projects', data: filteredProjects.filter(p => p.clients !== 'Internal MMB') },
        { title: 'Internal Projects', data: filteredProjects.filter(p => p.clients === 'Internal MMB') }
    ].filter(g => g.data.length > 0)

    return (
        <div className="ys-page">
            {/* Header */}
            <div className="admin-header" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="admin-header-content">
                    <div>
                        <h1><CalendarDays size={24} /> Your Schedule</h1>
                        <p style={{ marginTop: 'var(--space-2)' }}>
                            Projects assigned to <strong style={{ color: '#93c5fd' }}>{userName}</strong>
                            {myRole && <span style={{ marginLeft: 8, background: 'rgba(255,255,255,0.1)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{myRole}</span>}
                            {lastFetched && <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.5)' }}>Updated {lastFetched}</span>}
                        </p>
                    </div>
                    <div className="admin-header-actions" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <button onClick={() => setView('table')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: view === 'table' ? 'white' : 'transparent', color: view === 'table' ? 'var(--gray-900)' : 'white' }}>
                                <List size={14} /> Table
                            </button>
                            <button onClick={() => setView('gantt')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: 'none', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: view === 'gantt' ? 'white' : 'transparent', color: view === 'gantt' ? 'var(--gray-900)' : 'white' }}>
                                <BarChart3 size={14} /> Gantt
                            </button>
                        </div>

                        {view === 'gantt' && (
                            <>
                                <select className="admin-filter-select" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} value={viewMode} onChange={e => setViewMode(e.target.value)}>
                                    <option value={ViewMode.Day} style={{ color: 'black' }}>Day</option>
                                    <option value={ViewMode.Week} style={{ color: 'black' }}>Week</option>
                                    <option value={ViewMode.Month} style={{ color: 'black' }}>Month</option>
                                </select>
                                <button onClick={() => setGanttFullscreen(true)} className="admin-refresh-btn" title="Fullscreen" style={{ padding: '8px', borderRadius: '50%' }}>
                                    <Maximize2 size={16} />
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => fetchProjects(true)}
                            disabled={isLoading}
                            className={`admin-refresh-btn ${isLoading ? 'spinning' : ''}`}
                            style={{ padding: '8px', borderRadius: '50%' }}
                            title="Refresh Schedule"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
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

            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: '-8px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-600)' }}>Month:</span>
                    <select
                        className="ys-select"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        style={{ minWidth: 140 }}
                    >
                        <option value="all">All Months</option>
                        {availableMonths.map(m => (
                            <option key={m.label} value={m.label}>
                                {m.label}
                            </option>
                        ))}
                    </select>

                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-600)', marginLeft: 8 }}>Status:</span>
                    <select
                        className="ys-select"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ minWidth: 120 }}
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active Only</option>
                        <option value="done">Done / Canceled</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            <div>
                {isLoading && myProjects.length === 0 ? (
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div className="ys-empty">
                            <RefreshCw size={32} className="spin" style={{ color: 'var(--gray-300)' }} />
                            <p>Loading your projects…</p>
                        </div>
                    </div>
                ) : myProjects.length === 0 ? (
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div className="ys-empty">
                            <Inbox size={40} style={{ color: 'var(--gray-300)' }} />
                            <p>No projects assigned to you</p>
                        </div>
                    </div>
                ) : view === 'gantt' ? (
                    <div className="card" style={{ overflow: 'hidden' }}>
                        <div style={{ overflow: 'auto', padding: 'var(--space-3)' }}>
                            {ganttTasks.length > 0 ? (
                                <Gantt
                                    tasks={ganttTasks} viewMode={viewMode} listCellWidth="240px"
                                    TaskListHeader={CustomTaskListHeader}
                                    TaskListTable={CustomTaskListTable}
                                    TooltipContent={CustomTooltip}
                                    columnWidth={viewMode === ViewMode.Month ? 200 : viewMode === ViewMode.Week ? 100 : 50}
                                    barCornerRadius={6} barFill={70} fontSize="12"
                                    headerHeight={50} rowHeight={38}
                                    todayColor="rgba(59, 130, 246, 0.2)"
                                />
                            ) : (
                                <div className="ys-empty">
                                    <Inbox size={40} style={{ color: 'var(--gray-300)' }} />
                                    <p>No projects with valid dates for Gantt view</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Desktop View */}
                        <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                            {projectGroups.map(group => (
                                <div key={group.title} className="card" style={{ overflow: 'hidden' }}>
                                    <div style={{ padding: 'var(--space-4)', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', fontWeight: 600, color: 'var(--gray-800)', fontSize: '0.95rem' }}>
                                        {group.title}
                                    </div>
                                    <div className="admin-table-wrap">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: 80 }}>#</th>
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
                                                {group.data.map((p, index) => {
                                                    const isIll = matchesUser(p.illustrator, userName)
                                                    const isEd = matchesUser(p.editor, userName)
                                                    const roleLabel = isIll && isEd ? 'Both' : isIll ? 'Illustrator' : 'Editor'
                                                    const statusColor = getTaskColor(p.projectStatus, p.risk, p.projectName, index) || '#9ca3af'
                                                    return (
                                                        <tr key={p.rowIndex}>
                                                            <td style={{ color: 'var(--gray-400)', fontSize: 'var(--text-xs)' }}>{p.no}</td>
                                                            <td style={{ fontWeight: 600, whiteSpace: 'nowrap', minWidth: 180 }}>{p.projectName}</td>
                                                            <td style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>{p.clients || '—'}</td>
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
                                    </div>
                                </div>
                            ))}
                            {filteredProjects.length === 0 && (
                                <div className="card ys-empty" style={{ padding: 'var(--space-8)', overflow: 'hidden' }}>
                                    <Inbox size={40} style={{ color: 'var(--gray-300)' }} />
                                    <p>No projects match the current filter</p>
                                </div>
                            )}
                        </div>

                        {/* Mobile View */}
                            <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                                {projectGroups.map(group => (
                                    <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--gray-800)', fontSize: '1.05rem', padding: '0 var(--space-2)', borderBottom: '1px solid var(--gray-200)', paddingBottom: '8px' }}>
                                            {group.title}
                                        </div>
                                        {group.data.map((p, index) => {
                                            const isIll = matchesUser(p.illustrator, userName)
                                            const isEd = matchesUser(p.editor, userName)
                                            const roleLabel = isIll && isEd ? 'Both' : isIll ? 'Illustrator' : 'Editor'
                                            const statusColor = getTaskColor(p.projectStatus, p.risk, p.projectName, index) || '#9ca3af'

                                            return (
                                                <div key={p.rowIndex} style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                        <div>
                                                            <div style={{ color: 'var(--gray-500)', fontSize: '0.7rem', fontWeight: 700, marginBottom: '4px' }}>#{p.no} {p.clients ? `• ${p.clients}` : ''}</div>
                                                            <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.95rem', lineHeight: 1.3, marginBottom: '4px' }}>{p.projectName}</div>
                                                            {p.projectNotes && (
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontStyle: 'italic' }}>"{p.projectNotes}"</div>
                                                            )}
                                                        </div>
                                                        <span className={`ys-role-badge ${isIll ? 'ys-role-ill' : 'ys-role-ed'}`} style={{ flexShrink: 0, marginLeft: '8px' }}>
                                                            {roleLabel}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                        <div style={{ flex: '1 1 auto', minWidth: '80px' }}>
                                                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>DL Illustrator</div>
                                                            <div style={{ color: '#334155', fontWeight: '600', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{p.dlIllustrator || '—'}</div>
                                                        </div>
                                                        <div style={{ flex: '1 1 auto', minWidth: '80px' }}>
                                                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>DL Editor</div>
                                                            <div style={{ color: '#334155', fontWeight: '600', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{p.dlEditor || '—'}</div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                            {p.projectStatus ? (
                                                                <span className="ys-status-badge" style={{ color: statusColor, borderColor: statusColor + '33', background: statusColor + '11', padding: '3px 10px', fontSize: '0.7rem' }}>
                                                                    {p.projectStatus}
                                                                </span>
                                                            ) : <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No status</span>}

                                                            {p.risk && (
                                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: p.risk.includes('High') ? '#ef4444' : '#f59e0b', background: p.risk.includes('High') ? '#fef2f2' : '#fffbeb', padding: '3px 8px', borderRadius: '4px', border: `1px solid ${p.risk.includes('High') ? '#fecaca' : '#fde68a'}` }}>
                                                                    {p.risk}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {p.briefLinks ? (
                                                            <a href={p.briefLinks} target="_blank" rel="noopener noreferrer" className="ys-brief-chip" style={{ background: 'white', border: '1px solid #cbd5e1' }}>
                                                                <ExternalLink size={12} />
                                                                {p.briefLinksLabel || 'Brief'}
                                                            </a>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}

                                {filteredProjects.length === 0 && (
                                    <div className="card ys-empty" style={{ padding: 'var(--space-8)' }}>
                                        <Inbox size={40} style={{ color: 'var(--gray-300)' }} />
                                        <p>No projects match the current filter</p>
                                    </div>
                                )}
                            </div>
                        </>
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
                                tasks={ganttTasks} viewMode={viewMode} listCellWidth="240px"
                                TaskListHeader={CustomTaskListHeader}
                                TaskListTable={CustomTaskListTable}
                                TooltipContent={CustomTooltip}
                                columnWidth={viewMode === ViewMode.Month ? 200 : viewMode === ViewMode.Week ? 100 : 50}
                                barCornerRadius={6} barFill={70} fontSize="12"
                                headerHeight={50} rowHeight={38}
                                todayColor="rgba(59, 130, 246, 0.2)"
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
