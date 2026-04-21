import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Gantt, ViewMode } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import {
    FolderKanban, Plus, Trash2, X, Inbox,
    BarChart3, List, Check, Loader2, AlertCircle, ExternalLink, Maximize2, Minimize2
} from 'lucide-react'
import MultiSelectDropdown from '../MultiSelectDropdown'
import SearchableDropdown from '../SearchableDropdown'
import { DEFAULT_EDITORS, DEFAULT_ILLUSTRATORS, CLIENT_LIST } from '../ProgressForm'

const RISK_OPTIONS = ['High Risk', 'Med Risk']
const PROGRESS_OPTIONS = ['Pending Editor', 'Editor Progress']
const STATUS_OPTIONS = ['Done', 'On Hold', 'Under Review', 'Revision Needed']
const PAYMENT_OPTIONS = ['Paid', 'Unpaid']

const STATUS_COLORS = {
    'done': '#10b981',
    'on hold': '#f59e0b',
    'under review': '#8b5cf6',
    'revision needed': '#ef4444',
}

function getStatusColor(status) {
    return STATUS_COLORS[(status || '').toLowerCase()] || '#9ca3af'
}

// ========== EDITABLE CELL ==========
function EditableCell({ value, onSave, style }) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(value)
    const inputRef = useRef(null)

    useEffect(() => { setDraft(value) }, [value])
    useEffect(() => { if (editing && inputRef.current) inputRef.current.focus() }, [editing])

    const commit = () => {
        setEditing(false)
        if (draft !== value) onSave(draft)
    }

    if (!editing) {
        return (
            <span
                onClick={() => setEditing(true)}
                style={{ cursor: 'pointer', ...style }}
                title="Click to edit"
            >
                {value || '—'}
            </span>
        )
    }

    return (
        <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
            className="admin-editable-input"
        />
    )
}

// ========== SYNC STATUS BAR ==========
function SyncStatusBar({ syncState }) {
    if (syncState.status === 'idle') return null
    const config = {
        saving: { icon: <Loader2 size={14} className="spin-icon" />, text: 'Saving changes…', bg: '#3b82f6' },
        saved: { icon: <Check size={14} />, text: 'All changes saved', bg: '#10b981' },
        error: { icon: <AlertCircle size={14} />, text: syncState.message || 'Failed to save', bg: '#ef4444' },
    }
    const c = config[syncState.status]
    if (!c) return null

    return (
        <div style={{
            position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 'var(--radius-full)',
            background: c.bg, color: 'white', fontSize: 'var(--text-sm)',
            fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            zIndex: 10000, animation: 'pm-slideUp 0.3s ease',
        }}>
            {c.icon}
            {c.text}
            {syncState.status === 'error' && syncState.retry && (
                <button onClick={syncState.retry} className="pm-retry-btn">Retry</button>
            )}
        </div>
    )
}

// ========== ADD PROJECT FORM ==========
function AddProjectForm({ onSubmit, onCancel }) {
    const [form, setForm] = useState({
        projectName: '', illustrator: [], editor: [], briefLinks: '',
        clients: '', dlIllustrator: '', dlEditor: '', projectNotes: '', risk: '',
    })

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.projectName.trim()) return
        onSubmit({
            ...form,
            illustrator: form.illustrator.join(', '),
            editor: form.editor.join(', '),
        })
        setForm({
            projectName: '', illustrator: [], editor: [], briefLinks: '',
            clients: '', dlIllustrator: '', dlEditor: '', projectNotes: '', risk: '',
        })
    }

    return (
        <form onSubmit={handleSubmit} className="pm-add-form">
            <div className="pm-form-grid">
                <div className="pm-field">
                    <label>Project Name *</label>
                    <input type="text" value={form.projectName} onChange={e => set('projectName', e.target.value)} placeholder="Enter project name" required />
                </div>
                <div className="pm-field">
                    <label>Illustrator</label>
                    <MultiSelectDropdown selectedItems={form.illustrator} onChange={val => set('illustrator', val)} options={DEFAULT_ILLUSTRATORS} placeholder="Select illustrators" />
                </div>
                <div className="pm-field">
                    <label>Editor</label>
                    <MultiSelectDropdown selectedItems={form.editor} onChange={val => set('editor', val)} options={DEFAULT_EDITORS} placeholder="Select editors" />
                </div>
                <div className="pm-field">
                    <label>Brief Links</label>
                    <input type="text" value={form.briefLinks} onChange={e => set('briefLinks', e.target.value)} placeholder="Link to brief" />
                </div>
                <div className="pm-field">
                    <label>Client</label>
                    <SearchableDropdown value={form.clients} onChange={val => set('clients', val)} options={CLIENT_LIST} placeholder="Select client" />
                </div>
                <div className="pm-field">
                    <label>DL Illustrator</label>
                    <input type="date" value={form.dlIllustrator} onChange={e => set('dlIllustrator', e.target.value)} />
                </div>
                <div className="pm-field">
                    <label>DL Editor</label>
                    <input type="date" value={form.dlEditor} onChange={e => set('dlEditor', e.target.value)} />
                </div>
                <div className="pm-field">
                    <label>Risk</label>
                    <SearchableDropdown value={form.risk} onChange={val => set('risk', val)} options={RISK_OPTIONS} placeholder="Select risk level" />
                </div>
                <div className="pm-field" style={{ gridColumn: '1 / -1' }}>
                    <label>Project Notes</label>
                    <textarea value={form.projectNotes} onChange={e => set('projectNotes', e.target.value)} placeholder="Notes..." rows={2} />
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                <button type="button" className="pm-btn-secondary" onClick={onCancel}>Cancel</button>
                <button type="submit" className="pm-btn-action" disabled={!form.projectName.trim()}>
                    <Plus size={14} /> Add Project
                </button>
            </div>
        </form>
    )
}

// ========== FULLSCREEN GANTT MODAL ==========
function GanttFullscreen({ tasks, viewMode, onClose }) {
    const [vm, setVm] = useState(viewMode)
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    return (
        <div className="pm-fullscreen-overlay">
            <div className="pm-fullscreen-header">
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                    <BarChart3 size={18} /> Projects Gantt Chart
                </h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select className="admin-filter-select" value={vm} onChange={e => setVm(e.target.value)}>
                        <option value={ViewMode.Day}>Day</option>
                        <option value={ViewMode.Week}>Week</option>
                        <option value={ViewMode.Month}>Month</option>
                    </select>
                    <button onClick={onClose} className="pm-btn-secondary" style={{ padding: '6px 12px' }}>
                        <Minimize2 size={14} /> Close
                    </button>
                </div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '0 var(--space-4) var(--space-4)' }}>
                {tasks.length > 0 ? (
                    <Gantt
                        tasks={tasks} viewMode={vm} listCellWidth=""
                        columnWidth={vm === ViewMode.Month ? 200 : vm === ViewMode.Week ? 100 : 50}
                        barCornerRadius={4} barFill={65} fontSize="12"
                        headerHeight={50} rowHeight={38}
                        todayColor="rgba(59, 130, 246, 0.08)"
                    />
                ) : (
                    <div className="admin-empty"><Inbox size={40} /><p>No valid Gantt data</p></div>
                )}
            </div>
        </div>
    )
}

// ========== MAIN COMPONENT ==========
function ProjectManager({ projects, loading, availableSheets, currentSheet, onMonthChange, onAdd, onUpdate, onDelete, syncState }) {
    const [displayMode, setDisplayMode] = useState('table')
    const [viewMode, setViewMode] = useState(ViewMode.Week)
    const [showAddForm, setShowAddForm] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [statusFilter, setStatusFilter] = useState('')
    const [ganttFullscreen, setGanttFullscreen] = useState(false)

    const filtered = useMemo(() => {
        if (!statusFilter) return projects
        return projects.filter(p => (p.projectStatus || '').toLowerCase() === statusFilter.toLowerCase())
    }, [projects, statusFilter])

    const ganttTasks = useMemo(() => {
        return filtered
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
                    progress: p.projectStatus?.toLowerCase() === 'done' ? 100 : 50,
                    type: 'task',
                    styles: {
                        backgroundColor: color, backgroundSelectedColor: color,
                        progressColor: color + 'cc', progressSelectedColor: color + 'cc',
                    },
                }
            })
    }, [filtered])

    const statuses = useMemo(() => {
        const s = new Set(projects.map(p => p.projectStatus).filter(Boolean))
        return Array.from(s)
    }, [projects])

    const handleInlineUpdate = useCallback((rowIndex, field, value) => {
        onUpdate(rowIndex, { [field]: value })
    }, [onUpdate])

    const handleDelete = useCallback((rowIndex) => {
        setDeleteConfirm(null)
        onDelete(rowIndex)
    }, [onDelete])

    if (loading) {
        return (
            <div className="admin-panel">
                <div className="admin-panel-header"><h2><FolderKanban size={18} /> Projects</h2></div>
                <div style={{ padding: 'var(--space-4)' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="admin-skeleton-row">
                            <div className="admin-skeleton admin-skeleton-cell" style={{ width: '5%' }} />
                            <div className="admin-skeleton admin-skeleton-cell" style={{ width: '20%' }} />
                            <div className="admin-skeleton admin-skeleton-cell" style={{ width: '12%' }} />
                            <div className="admin-skeleton admin-skeleton-cell" style={{ width: '12%' }} />
                            <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                            <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="admin-panel">
            <div className="admin-panel-header">
                <h2><FolderKanban size={18} /> Projects</h2>
                <div className="admin-filters">
                    {availableSheets && availableSheets.length > 0 && (
                        <select className="admin-filter-select" value={currentSheet} onChange={e => onMonthChange(e.target.value)}>
                            {availableSheets.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}
                    <select className="admin-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="pm-view-toggle">
                        <button onClick={() => setDisplayMode('table')} className={`pm-view-btn ${displayMode === 'table' ? 'active' : ''}`}>
                            <List size={12} /> Table
                        </button>
                        <button onClick={() => setDisplayMode('gantt')} className={`pm-view-btn ${displayMode === 'gantt' ? 'active' : ''}`}>
                            <BarChart3 size={12} /> Gantt
                        </button>
                    </div>
                    {displayMode === 'gantt' && (
                        <>
                            <select className="admin-filter-select" value={viewMode} onChange={e => setViewMode(e.target.value)}>
                                <option value={ViewMode.Day}>Day</option>
                                <option value={ViewMode.Week}>Week</option>
                                <option value={ViewMode.Month}>Month</option>
                            </select>
                            <button onClick={() => setGanttFullscreen(true)} className="pm-btn-secondary" style={{ padding: '4px 10px', fontSize: 'var(--text-xs)' }}>
                                <Maximize2 size={12} /> Fullscreen
                            </button>
                        </>
                    )}
                    <button className="pm-btn-action" onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '6px 14px', fontSize: 'var(--text-xs)' }}>
                        {showAddForm ? <><X size={13} /> Close</> : <><Plus size={13} /> Add Project</>}
                    </button>
                </div>
            </div>

            {showAddForm && (
                <AddProjectForm
                    onSubmit={(data) => { onAdd(data); setShowAddForm(false) }}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            {filtered.length === 0 ? (
                <div className="admin-empty"><Inbox size={40} /><p>No projects found</p></div>
            ) : displayMode === 'gantt' ? (
                <div style={{ padding: '0 var(--space-2) var(--space-4)', overflow: 'auto' }}>
                    {ganttTasks.length > 0 ? (
                        <Gantt
                            tasks={ganttTasks} viewMode={viewMode} listCellWidth=""
                            columnWidth={viewMode === ViewMode.Month ? 200 : viewMode === ViewMode.Week ? 100 : 50}
                            barCornerRadius={4} barFill={65} fontSize="12"
                            headerHeight={50} rowHeight={38}
                            todayColor="rgba(59, 130, 246, 0.08)"
                        />
                    ) : (
                        <div className="admin-empty"><Inbox size={40} /><p>No projects with valid dates for Gantt view</p></div>
                    )}
                </div>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}>#</th>
                                <th>Project Name</th>
                                <th>Illustrator</th>
                                <th>Editor</th>
                                <th>Client</th>
                                <th>Brief</th>
                                <th>DL Ill</th>
                                <th>DL Ed</th>
                                <th>Risk</th>
                                <th>Progress</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th style={{ width: 50 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => {
                                const statusColor = getStatusColor(p.projectStatus)
                                return (
                                    <tr key={p.rowIndex}>
                                        <td style={{ color: 'var(--gray-400)', fontSize: 'var(--text-xs)' }}>{p.no}</td>
                                        <td style={{ fontWeight: 600, maxWidth: 180 }}>
                                            <EditableCell
                                                value={p.projectName}
                                                onSave={val => handleInlineUpdate(p.rowIndex, 'projectName', val)}
                                            />
                                        </td>
                                        <td style={{ fontSize: 'var(--text-xs)' }}>
                                            <EditableCell
                                                value={p.illustrator}
                                                onSave={val => handleInlineUpdate(p.rowIndex, 'illustrator', val)}
                                            />
                                        </td>
                                        <td style={{ fontSize: 'var(--text-xs)' }}>
                                            <EditableCell
                                                value={p.editor}
                                                onSave={val => handleInlineUpdate(p.rowIndex, 'editor', val)}
                                            />
                                        </td>
                                        <td style={{ fontSize: 'var(--text-xs)' }}>
                                            <EditableCell
                                                value={p.clients}
                                                onSave={val => handleInlineUpdate(p.rowIndex, 'clients', val)}
                                            />
                                        </td>
                                        <td>
                                            {p.briefLinks ? (
                                                <a href={p.briefLinks} target="_blank" rel="noopener noreferrer" className="pm-brief-chip">
                                                    <ExternalLink size={11} />
                                                    {p.briefLinksLabel || 'Open'}
                                                </a>
                                            ) : (
                                                <span style={{ color: 'var(--gray-400)', fontSize: 'var(--text-xs)' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>{p.dlIllustrator || '—'}</td>
                                        <td style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>{p.dlEditor || '—'}</td>
                                        <td>
                                            <select value={p.risk} onChange={e => handleInlineUpdate(p.rowIndex, 'risk', e.target.value)} className="admin-inline-select"
                                                style={{ color: p.risk?.includes('High') ? '#ef4444' : p.risk?.includes('Med') ? '#f59e0b' : 'var(--gray-500)' }}>
                                                <option value="">—</option>
                                                {RISK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <select value={p.progress} onChange={e => handleInlineUpdate(p.rowIndex, 'progress', e.target.value)} className="admin-inline-select">
                                                <option value="">—</option>
                                                {PROGRESS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <select value={p.projectStatus} onChange={e => handleInlineUpdate(p.rowIndex, 'projectStatus', e.target.value)} className="admin-inline-select" style={{ color: statusColor, fontWeight: 600 }}>
                                                <option value="">—</option>
                                                {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <select value={p.paymentStatus} onChange={e => handleInlineUpdate(p.rowIndex, 'paymentStatus', e.target.value)} className="admin-inline-select"
                                                style={{ color: p.paymentStatus === 'Paid' ? '#10b981' : p.paymentStatus === 'Unpaid' ? '#ef4444' : 'var(--gray-500)' }}>
                                                <option value="">—</option>
                                                {PAYMENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            {deleteConfirm === p.rowIndex ? (
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button onClick={() => handleDelete(p.rowIndex)} className="pm-del-yes">Yes</button>
                                                    <button onClick={() => setDeleteConfirm(null)} className="pm-del-no">No</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setDeleteConfirm(p.rowIndex)} className="pm-del-btn" title="Delete project">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {ganttFullscreen && <GanttFullscreen tasks={ganttTasks} viewMode={viewMode} onClose={() => setGanttFullscreen(false)} />}

            <SyncStatusBar syncState={syncState} />

            <style>{`
                .pm-btn-action {
                    display: flex; align-items: center; gap: 6px; padding: 8px 16px;
                    background: var(--primary-500); color: white; border: none;
                    border-radius: var(--radius-md); font-size: var(--text-sm);
                    font-weight: 600; cursor: pointer; transition: all 0.2s;
                }
                .pm-btn-action:hover { background: var(--primary-600); }
                .pm-btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
                .pm-btn-secondary {
                    display: flex; align-items: center; gap: 6px;
                    padding: 8px 16px; background: white; color: var(--gray-600);
                    border: 1px solid var(--gray-200); border-radius: var(--radius-md);
                    font-size: var(--text-sm); font-weight: 600; cursor: pointer;
                }
                .pm-btn-secondary:hover { background: var(--gray-50); }
                .pm-view-toggle {
                    display: flex; gap: 2px; background: var(--gray-100);
                    border-radius: var(--radius-md); padding: 2px;
                }
                .pm-view-btn {
                    display: flex; align-items: center; gap: 4px;
                    padding: 4px 10px; border: none; border-radius: var(--radius-sm);
                    background: transparent; color: var(--gray-500);
                    cursor: pointer; font-size: var(--text-xs); font-weight: 600;
                    transition: all 0.15s;
                }
                .pm-view-btn.active {
                    background: white; color: var(--primary-600);
                    box-shadow: var(--shadow-sm);
                }
                .pm-add-form {
                    padding: var(--space-4); border-bottom: 1px solid var(--gray-200);
                    background: var(--gray-50); animation: pm-slideDown 0.2s ease;
                }
                .pm-form-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: var(--space-3);
                }
                .pm-field label {
                    display: block; font-size: var(--text-xs); font-weight: 600;
                    color: var(--gray-600); margin-bottom: 4px;
                }
                .pm-field input, .pm-field textarea {
                    width: 100%; padding: 8px 12px; border: 1px solid var(--gray-200);
                    border-radius: var(--radius-md); font-size: var(--text-sm); background: white;
                    box-sizing: border-box;
                }
                .pm-field input:focus, .pm-field textarea:focus {
                    outline: none; border-color: var(--primary-400);
                    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
                }
                .admin-editable-input {
                    width: 100%; padding: 2px 6px; border: 1px solid var(--primary-400);
                    border-radius: var(--radius-sm); font-size: var(--text-xs);
                    background: white; box-shadow: 0 0 0 2px rgba(59,130,246,0.1);
                    outline: none; box-sizing: border-box;
                }
                .admin-inline-select {
                    background: transparent; border: 1px solid transparent;
                    border-radius: var(--radius-sm); padding: 2px 4px;
                    font-size: var(--text-xs); cursor: pointer; min-width: 80px;
                    transition: all 0.15s ease;
                }
                .admin-inline-select:hover { border-color: var(--gray-300); background: var(--gray-50); }
                .admin-inline-select:focus { outline: none; border-color: var(--primary-400); background: white; }
                .pm-brief-chip {
                    display: inline-flex; align-items: center; gap: 4px;
                    padding: 2px 8px; border-radius: var(--radius-full);
                    background: var(--primary-50); color: var(--primary-600);
                    font-size: 11px; font-weight: 600; text-decoration: none;
                    border: 1px solid var(--primary-100);
                    max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    transition: all 0.15s;
                }
                .pm-brief-chip:hover { background: var(--primary-100); }
                .pm-del-btn { background: none; border: none; color: var(--gray-400); cursor: pointer; padding: 4px; }
                .pm-del-btn:hover { color: var(--red-500); }
                .pm-del-yes { background: #ef4444; color: white; border: none; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; }
                .pm-del-no { background: var(--gray-200); border: none; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; }
                .pm-retry-btn {
                    margin-left: 8px; padding: 2px 10px; border-radius: var(--radius-full);
                    border: 1px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.2);
                    color: white; cursor: pointer; font-size: var(--text-xs); font-weight: 600;
                }
                .pm-fullscreen-overlay {
                    position: fixed; inset: 0; z-index: 9999;
                    background: white; display: flex; flex-direction: column;
                    animation: pm-fadeIn 0.2s ease;
                }
                .pm-fullscreen-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: var(--space-3) var(--space-4);
                    border-bottom: 1px solid var(--gray-200);
                }
                @keyframes pm-slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pm-slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pm-fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .spin-icon { animation: pm-spin 1s linear infinite; }
                @keyframes pm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    )
}

export default ProjectManager
