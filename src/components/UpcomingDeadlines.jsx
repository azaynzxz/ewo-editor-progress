import { useState, useEffect, useMemo } from 'react'
import { List, RefreshCw, Copy, Check, ExternalLink, Users, Maximize2, Minimize2, BarChart3 } from 'lucide-react'
import { Gantt, ViewMode } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import { fetchAllSheetsProjects } from '../utils/projectFetcher'

const APPS_SCRIPT_URL = '/api/exec'
const CACHE_KEY = 'ewo_upcoming_deadlines'

const ROW_COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#0ea5e9', // sky
    '#14b8a6', // teal
    '#f43f5e', // rose
]

const CustomTaskListHeader = ({ headerHeight, fontFamily, fontSize }) => {
    return (
        <div style={{ height: headerHeight, fontFamily, fontSize, display: 'flex', alignItems: 'center', paddingLeft: '16px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#4b5563', background: '#f9fafb', borderRight: '1px solid #e5e7eb' }}>
            Project Name
        </div>
    );
};

const CustomTaskListTable = ({ rowHeight, rowWidth, tasks, fontFamily, fontSize }) => {
    return (
        <div style={{ borderRight: '1px solid #e5e7eb' }}>
            {tasks.map(t => {
                if (t.id === 'today-bounds-fix') return null;
                return (
                    <div key={t.id} style={{ height: rowHeight, width: rowWidth, fontFamily, fontSize: '13px', display: 'flex', alignItems: 'center', paddingLeft: '16px', paddingRight: '8px', borderBottom: '1px solid #e5e7eb', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.projectName}>
                        {t.projectName}
                    </div>
                );
            })}
        </div>
    );
};

const CustomTooltip = ({ task, fontSize, fontFamily }) => {
    return (
        <div style={{ backgroundColor: 'white', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', minWidth: '180px' }}>
            <b style={{ fontSize: '14px', fontFamily, color: '#111827' }}>{task.projectName}</b>
            <div style={{ fontSize: '12px', fontFamily, color: '#6b7280', marginTop: '4px' }}>
                {task.start.toLocaleDateString()} - {task.end.toLocaleDateString()}
            </div>
        </div>
    )
};

function UpcomingDeadlines({ compact = false }) {
    const [projects, setProjects] = useState(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY)
            return cached ? JSON.parse(cached) : []
        } catch { return [] }
    })
    const [isLoading, setIsLoading] = useState(false)
    const [copiedIdx, setCopiedIdx] = useState(null)
    const [view, setView] = useState('list') // 'list' | 'gantt'
    const [ganttFullscreen, setGanttFullscreen] = useState(false)

    const sortByDeadline = (list) =>
        [...list].sort((a, b) => {
            if (!a.deadline) return 1
            if (!b.deadline) return -1
            return new Date(a.deadline) - new Date(b.deadline)
        })

    const fetchProjects = async (forceRefresh = false) => {
        setIsLoading(true)
        try {
            const isForced = forceRefresh === true;
            const result = await fetchAllSheetsProjects(isForced)
            if (result.success || result.projects?.length > 0) {
                // Filter to only projects from the current month's sheet
                const today = new Date()
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                const currentSheetName = `${months[today.getMonth()]} ${today.getFullYear()}`

                const EXCLUDED_STATUS = ['done', 'on hold', 'under review']
                const mapped = result.projects
                    .filter(p => p.sourceSheet === currentSheetName)
                    .filter(p => p.dlEditor && !EXCLUDED_STATUS.includes((p.projectStatus || '').toLowerCase()))
                    .map(p => ({
                        title: p.projectName,
                        client: p.clients,
                        deadline: p.dlEditor,
                        dlIllustrator: p.dlIllustrator,
                        illustrator: p.illustrator,
                        editor: p.editor,
                        briefLinks: p.briefLinks,
                        briefLinksLabel: p.briefLinksLabel,
                        projectStatus: p.projectStatus,
                        risk: p.risk,
                    }))
                const sorted = sortByDeadline(mapped)
                setProjects(sorted)
                localStorage.setItem(CACHE_KEY, JSON.stringify(sorted))
                window.dispatchEvent(new Event('ewo_deadlines_refreshed'))
            }
        } catch (error) {
            console.error('Failed to fetch upcoming projects:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const copyTitle = async (title, idx) => {
        try {
            await navigator.clipboard.writeText(title)
            setCopiedIdx(idx)
            setTimeout(() => setCopiedIdx(null), 1500)
        } catch (err) {
            console.error('Copy failed:', err)
        }
    }

    const getUrgencyStyle = (deadlineStr) => {
        if (!deadlineStr) return {}
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const deadline = new Date(deadlineStr)
        const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
        const maxDays = 14
        const clamped = Math.max(0, Math.min(daysLeft, maxDays))
        const urgency = 1 - (clamped / maxDays)
        const alpha = (urgency * 0.15).toFixed(3)
        return { backgroundColor: `rgba(239, 68, 68, ${alpha})` }
    }

    const ganttTasks = useMemo(() => {
        let tasks = projects
            .filter(p => p.dlIllustrator && p.deadline)
            .map((p, i) => {
                const start = new Date(p.dlIllustrator)
                start.setHours(0, 0, 0, 0)
                let end = new Date(p.deadline)
                end.setHours(23, 59, 59, 999)
                
                if (end <= start) {
                    end = new Date(start.getTime())
                    end.setHours(23, 59, 59, 999)
                }
                const isDone = (p.projectStatus || '').toLowerCase() === 'done'
                const color = isDone ? '#10b981' : (p.risk || '').includes('High') ? '#ef4444' : ROW_COLORS[i % ROW_COLORS.length]
                return {
                    id: `dl-${i}`, 
                    name: '',
                    projectName: p.title || 'Untitled',
                    start, end,
                    progress: isDone ? 100 : 50,
                    type: 'task',
                    styles: { backgroundColor: color, backgroundSelectedColor: color, progressColor: color + 'cc', progressSelectedColor: color + 'cc' },
                }
            })
            
        if (tasks.length > 0) {
            const now = new Date()
            now.setHours(0,0,0,0)
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
    }, [projects])

    useEffect(() => {
        if (projects.length === 0) fetchProjects()
    }, [])

    return (
        <div className={`upcoming-panel ${compact ? 'upcoming-panel-compact' : ''}`}>
            <div className="card">
                <div className="upcoming-panel-header">
                    <h3 className="upcoming-panel-title"><List size={16} /> Upcoming Deadlines</h3>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {/* View toggle */}
                        <div className="ud-view-toggle">
                            <button onClick={() => setView('list')} className={`ud-view-btn ${view === 'list' ? 'active' : ''}`} title="List view">
                                <List size={12} />
                            </button>
                            <button onClick={() => setView('gantt')} className={`ud-view-btn ${view === 'gantt' ? 'active' : ''}`} title="Gantt view">
                                <BarChart3 size={12} />
                            </button>
                        </div>
                        {view === 'gantt' && (
                            <button onClick={() => setGanttFullscreen(true)} className="ud-fs-btn" title="Fullscreen">
                                <Maximize2 size={12} />
                            </button>
                        )}
                        <button type="button" className="refresh-btn" onClick={() => fetchProjects(true)} disabled={isLoading} aria-label="Refresh">
                            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
                        </button>
                    </div>
                </div>

                {isLoading && projects.length === 0 ? (
                    <div className="upcoming-empty">Loading...</div>
                ) : projects.length > 0 ? (
                    view === 'gantt' ? (
                        <div style={{ overflow: 'auto', padding: '0 var(--space-2) var(--space-3)' }}>
                            {ganttTasks.length > 0 ? (
                                <Gantt
                                    tasks={ganttTasks} viewMode={ViewMode.Day} listCellWidth="240px"
                                    TaskListHeader={CustomTaskListHeader}
                                    TaskListTable={CustomTaskListTable}
                                    TooltipContent={CustomTooltip}
                                    columnWidth={80} barCornerRadius={6} barFill={70}
                                    fontSize="11" headerHeight={40} rowHeight={32}
                                    todayColor="rgba(59, 130, 246, 0.2)"
                                />
                            ) : (
                                <div className="upcoming-empty">No valid date ranges for Gantt</div>
                            )}
                        </div>
                    ) : (
                        <div className={`upcoming-table ${compact ? 'upcoming-table-compact' : ''}`}>
                            <div className={`upcoming-header ${compact ? 'upcoming-header-compact' : ''}`}>
                                <span className="upcoming-col-title">Title</span>
                                <span className="upcoming-col-client">Client</span>
                                {!compact && <span className="upcoming-col-assign">Assigned</span>}
                                {!compact && <span className="upcoming-col-brief">Brief</span>}
                                <span className="upcoming-col-deadline">Deadline</span>
                                <span className="upcoming-col-action"></span>
                            </div>
                            {projects.map((project, idx) => (
                                <div
                                    key={idx}
                                    className={`upcoming-row ${compact ? 'upcoming-row-compact' : ''} ${copiedIdx === idx ? 'copied' : ''}`}
                                    style={copiedIdx !== idx ? getUrgencyStyle(project.deadline) : undefined}
                                    onClick={() => copyTitle(project.title, idx)}
                                    title="Click to copy title"
                                >
                                    <span className="upcoming-col-title">{project.title}</span>
                                    <span className="upcoming-col-client">{project.client}</span>
                                    {!compact && (
                                        <span className="upcoming-col-assign">
                                            {project.illustrator && <span className="ud-tag ud-tag-ill" title="Illustrator">{project.illustrator}</span>}
                                            {project.editor && <span className="ud-tag ud-tag-ed" title="Editor">{project.editor}</span>}
                                            {!project.illustrator && !project.editor && '—'}
                                        </span>
                                    )}
                                    {!compact && (
                                        <span className="upcoming-col-brief" onClick={e => e.stopPropagation()}>
                                            {project.briefLinks ? (
                                                <a href={project.briefLinks} target="_blank" rel="noopener noreferrer" className="ud-brief-chip">
                                                    <ExternalLink size={10} />
                                                </a>
                                            ) : '—'}
                                        </span>
                                    )}
                                    <span className="upcoming-col-deadline">{project.deadline}</span>
                                    <span className="upcoming-col-action">
                                        {copiedIdx === idx ? <Check size={13} /> : <Copy size={13} />}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <div className="upcoming-empty">No upcoming deadlines</div>
                )}
            </div>

            {/* Fullscreen gantt modal */}
            {ganttFullscreen && (
                <div className="ud-fullscreen-overlay">
                    <div className="ud-fullscreen-header">
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                            <BarChart3 size={18} /> Deadline Gantt Chart
                        </h3>
                        <button onClick={() => setGanttFullscreen(false)} className="ud-fs-close-btn">
                            <Minimize2 size={14} /> Close
                        </button>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-4)' }}>
                        {ganttTasks.length > 0 ? (
                            <Gantt
                                tasks={ganttTasks} viewMode={ViewMode.Day} listCellWidth="240px"
                                TaskListHeader={CustomTaskListHeader}
                                TaskListTable={CustomTaskListTable}
                                TooltipContent={CustomTooltip}
                                columnWidth={100} barCornerRadius={6} barFill={70}
                                fontSize="12" headerHeight={50} rowHeight={38}
                                todayColor="rgba(59, 130, 246, 0.2)"
                            />
                        ) : (
                            <div className="upcoming-empty">No valid date ranges for Gantt</div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .ud-view-toggle {
                    display: flex; gap: 1px; background: var(--gray-200);
                    border-radius: var(--radius-sm); overflow: hidden;
                }
                .ud-view-btn {
                    display: flex; align-items: center; padding: 4px 8px;
                    border: none; background: var(--gray-50); color: var(--gray-500);
                    cursor: pointer; font-size: var(--text-xs); transition: all 0.15s;
                }
                .ud-view-btn.active { background: white; color: var(--primary-600); }
                .ud-fs-btn {
                    display: flex; align-items: center; padding: 4px;
                    border: 1px solid var(--gray-200); border-radius: var(--radius-sm);
                    background: white; color: var(--gray-500); cursor: pointer;
                }
                .ud-fs-btn:hover { color: var(--primary-600); }
                .upcoming-col-assign { display: flex; gap: 4px; flex-wrap: wrap; min-width: 0; white-space: nowrap; }
                .upcoming-col-brief { display: flex; align-items: center; justify-content: center; white-space: nowrap; }
                .upcoming-col-deadline { white-space: nowrap; }
                .upcoming-col-client { white-space: nowrap; }
                .ud-tag {
                    display: inline-block; padding: 1px 6px; border-radius: var(--radius-full);
                    font-size: 10px; font-weight: 600; white-space: nowrap;
                    overflow: hidden; text-overflow: ellipsis; max-width: 70px;
                }
                .ud-tag-ill { background: #fef3c7; color: #92400e; }
                .ud-tag-ed { background: #dbeafe; color: #1e40af; }
                .ud-brief-chip {
                    display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px;
                    border-radius: var(--radius-full); background: var(--primary-50);
                    color: var(--primary-600); font-size: 10px; text-decoration: none;
                    border: 1px solid var(--primary-100); transition: all 0.15s;
                }
                .ud-brief-chip:hover { background: var(--primary-100); }
                .ud-fullscreen-overlay {
                    position: fixed; inset: 0; z-index: 9999;
                    background: white; display: flex; flex-direction: column;
                    animation: ud-fadeIn 0.2s ease;
                }
                .ud-fullscreen-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: var(--space-3) var(--space-4);
                    border-bottom: 1px solid var(--gray-200);
                }
                .ud-fs-close-btn {
                    display: flex; align-items: center; gap: 6px;
                    padding: 6px 14px; background: white; color: var(--gray-600);
                    border: 1px solid var(--gray-200); border-radius: var(--radius-md);
                    font-size: var(--text-sm); font-weight: 600; cursor: pointer;
                }
                .ud-fs-close-btn:hover { background: var(--gray-50); }
                @keyframes ud-fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    )
}

export default UpcomingDeadlines
