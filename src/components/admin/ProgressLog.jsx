import { useState, useMemo } from 'react'
import { FileText, Search, Inbox, ChevronUp, ChevronDown } from 'lucide-react'

const EDITORS = ['Zayn', 'Ari', 'Hendi', 'Rosdiana', 'Dayah', 'Manda', 'Luky', 'Mike', 'Dian', 'Beka', 'Derrick', 'Vanda', 'Bagas']
const CLIENTS = ['Alex', 'Allan', 'Amanda', 'Angelo', 'Bashar', 'Bryan', 'Jordan', 'Jorge', 'Julia', 'Kristin', 'Michael', 'Ryan', 'Simon', 'Wing', 'Yannick', 'Zheng']
const PAGE_SIZE = 15

function getRoleBadge(role) {
    if (!role) return { label: '—', className: 've' }
    const r = role.toLowerCase().trim()
    if (r.includes('editor') || r === 've') return { label: 'VE', className: 've' }
    if (r.includes('illustr') || r === 'ill') return { label: 'ILL', className: 'ill' }
    return { label: role, className: 've' }
}

function ProgressLog({ progress, loading, filters, onFiltersChange }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [sortField, setSortField] = useState('date')
    const [sortDir, setSortDir] = useState('desc')
    const [page, setPage] = useState(1)
    const [hideDuplicates, setHideDuplicates] = useState(false)

    // Tag duplicates based on identical date, editor, title, client, and scenes
    const taggedList = useMemo(() => {
        const seen = new Set()
        return progress.map(r => {
            const key = `${r.date}|${(r.editor || '').toLowerCase().trim()}|${(r.title || '').toLowerCase().trim()}|${(r.client || '').toLowerCase().trim()}|${r.scenes}`
            const isDuplicate = seen.has(key)
            seen.add(key)
            return { ...r, isDuplicate }
        })
    }, [progress])

    // Local search, duplicate filter, and sort
    const processed = useMemo(() => {
        let list = [...taggedList]

        if (hideDuplicates) {
            list = list.filter(r => !r.isDuplicate)
        }

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            list = list.filter(r =>
                r.title.toLowerCase().includes(q) ||
                r.editor.toLowerCase().includes(q) ||
                r.client.toLowerCase().includes(q) ||
                r.comment.toLowerCase().includes(q)
            )
        }

        // Sort
        list.sort((a, b) => {
            let va = a[sortField] ?? ''
            let vb = b[sortField] ?? ''
            if (sortField === 'scenes') {
                va = Number(va) || 0
                vb = Number(vb) || 0
            } else {
                va = String(va).toLowerCase()
                vb = String(vb).toLowerCase()
            }
            if (va < vb) return sortDir === 'asc' ? -1 : 1
            if (va > vb) return sortDir === 'asc' ? 1 : -1
            return 0
        })

        return list
    }, [taggedList, hideDuplicates, searchQuery, sortField, sortDir])

    const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE))
    const paginated = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDir('desc')
        }
        setPage(1)
    }

    const SortIcon = ({ field }) => {
        if (sortField !== field) return null
        return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
    }

    return (
        <div className="admin-panel">
            <div className="admin-panel-header">
                <h2><FileText size={18} /> Progress Log</h2>
                <div className="admin-filters">
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                        <input
                            type="text"
                            className="admin-filter-input"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
                            style={{ paddingLeft: 30 }}
                        />
                    </div>
                    <input
                        type="date"
                        className="admin-filter-input"
                        value={filters.startDate}
                        onChange={e => onFiltersChange({ ...filters, startDate: e.target.value })}
                        style={{ minWidth: 130 }}
                        title="Start date"
                    />
                    <input
                        type="date"
                        className="admin-filter-input"
                        value={filters.endDate}
                        onChange={e => onFiltersChange({ ...filters, endDate: e.target.value })}
                        style={{ minWidth: 130 }}
                        title="End date"
                    />
                    <select
                        className="admin-filter-select"
                        value={filters.editor}
                        onChange={e => onFiltersChange({ ...filters, editor: e.target.value })}
                    >
                        <option value="">All Employees</option>
                        {EDITORS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <select
                        className="admin-filter-select"
                        value={filters.client}
                        onChange={e => onFiltersChange({ ...filters, client: e.target.value })}
                    >
                        <option value="">All Clients</option>
                        {CLIENTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--gray-600)', cursor: 'pointer', userSelect: 'none', background: 'var(--gray-50)', padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                        <input
                            type="checkbox"
                            checked={hideDuplicates}
                            onChange={e => setHideDuplicates(e.target.checked)}
                            style={{ cursor: 'pointer' }}
                        />
                        Hide Duplicates
                    </label>
                </div>
            </div>

            <div className="admin-table-wrap">
                {loading ? (
                    <div style={{ padding: 'var(--space-4)' }}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="admin-skeleton-row">
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '12%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '8%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '25%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '10%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '6%' }} />
                                <div className="admin-skeleton admin-skeleton-cell" style={{ width: '20%' }} />
                            </div>
                        ))}
                    </div>
                ) : paginated.length === 0 ? (
                    <div className="admin-empty">
                        <Inbox size={40} />
                        <p>No progress entries found</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th className="sortable" onClick={() => handleSort('date')}>Date <SortIcon field="date" /></th>
                                <th className="sortable" onClick={() => handleSort('editor')}>Editor <SortIcon field="editor" /></th>
                                <th>Role</th>
                                <th className="sortable" onClick={() => handleSort('title')}>Project <SortIcon field="title" /></th>
                                <th className="sortable" onClick={() => handleSort('client')}>Client <SortIcon field="client" /></th>
                                <th className="sortable" onClick={() => handleSort('scenes')}>Scenes <SortIcon field="scenes" /></th>
                                <th>Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((row, idx) => {
                                const roleBadge = getRoleBadge(row.role)
                                return (
                                    <tr key={`${row.no}-${idx}`} style={row.isDuplicate ? { opacity: 0.75, background: 'rgba(254, 243, 199, 0.2)' } : {}}>
                                        <td style={{ whiteSpace: 'nowrap' }}>{row.date}</td>
                                        <td style={{ fontWeight: 600 }}>{row.editor}</td>
                                        <td>
                                            <span className={`admin-role-pill ${roleBadge.className}`}>
                                                {roleBadge.label}
                                            </span>
                                        </td>
                                        <td>
                                            <span>{row.title}</span>
                                            {row.isDuplicate && (
                                                <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 600 }}>
                                                    Duplicate
                                                </span>
                                            )}
                                        </td>
                                        <td>{row.client}</td>
                                        <td style={{ fontWeight: 600, textAlign: 'center' }}>{row.scenes}</td>
                                        <td style={{ maxWidth: 220, whiteSpace: 'normal', wordBreak: 'break-word', verticalAlign: 'top' }}>
                                            {row.comment || '—'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {!loading && processed.length > PAGE_SIZE && (
                <div className="admin-pagination">
                    <span>{processed.length} entries · Page {page} of {totalPages}</span>
                    <div className="admin-pagination-btns">
                        <button className="admin-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                            const p = i + 1
                            return (
                                <button key={p} className={`admin-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                            )
                        })}
                        {totalPages > 5 && <span style={{ padding: '0 4px' }}>…</span>}
                        <button className="admin-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProgressLog
