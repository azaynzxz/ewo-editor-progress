import { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, Trash2, Download, X, PlusCircle, Check, RefreshCw } from 'lucide-react'
import { fetchAllSheetsProjects } from '../utils/projectFetcher'

// Color maps matching requested designs
const PLAN_COLORS = {
    'SUBMIT': { bg: '#dcfce7', text: '#15803d', border: '#b9f6ca' },
    'CICIL': { bg: '#fef3c7', text: '#b45309', border: '#ffe082' },
    'REV': { bg: '#fee2e2', text: '#b91c1c', border: '#ff8a80' }
}

const EDITOR_COLORS = {
    'zayn': { bg: '#b91c1c', text: '#ffffff' },
    'yoki': { bg: '#7c3aed', text: '#ffffff' },
    'zurvi': { bg: '#15803d', text: '#ffffff' },
    'hendi': { bg: '#e0f2fe', text: '#0369a1' }
}

function getEditorColor(name) {
    const norm = name.toLowerCase().trim()
    if (EDITOR_COLORS[norm]) return EDITOR_COLORS[norm]
    
    // Generate stable color based on string hash
    let hash = 0
    for (let i = 0; i < norm.length; i++) {
        hash = norm.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = [
        { bg: '#2563eb', text: '#ffffff' },
        { bg: '#db2777', text: '#ffffff' },
        { bg: '#d97706', text: '#ffffff' },
        { bg: '#0d9488', text: '#ffffff' },
        { bg: '#4f46e5', text: '#ffffff' },
        { bg: '#059669', text: '#ffffff' }
    ]
    return colors[Math.abs(hash) % colors.length]
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

function matchesUser(field, userName) {
    if (!field || !userName) return false
    const normalizedField = field.toLowerCase().trim()
    const normalizedUser = userName.toLowerCase().trim()
    return normalizedField.split(',').some(part => part.trim() === normalizedUser)
}

function DailyReportModal({ isOpen, onClose, initialProjects = [], isAdminMode = false }) {
    const [reportRows, setReportRows] = useState([])
    const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0])
    const [customEditors, setCustomEditors] = useState([])
    const [newEditorInput, setNewEditorInput] = useState('')
    const [activeRowEditorDropdown, setActiveRowEditorDropdown] = useState(null)
    const dropdownRef = useRef(null)

    const userRole = localStorage.getItem('userRole') || 'video_editor'

    // Theme Color Palettes based on active role
    // Illustrator: Green, Editor: Sky Blue, Ads: Orange
    const getRoleColors = () => {
        if (userRole === 'illustrator') {
            return {
                accent: '#059669', // Emerald/Green
                headerBg: '#065f46',
                lightBg: '#ecfdf5'
            }
        }
        if (userRole === 'ads_design') {
            return {
                accent: '#f97316', // Orange
                headerBg: '#c2410c',
                lightBg: '#fff7ed'
            }
        }
        // Default video_editor: Sky Blue
        return {
            accent: '#0ea5e9', // Sky Blue
            headerBg: '#0369a1',
            lightBg: '#f0f9ff'
        }
    }

    const getRoleReportTitle = () => {
        if (userRole === 'illustrator') return 'ILLUSTRATOR DAILY PROGRESS REPORT'
        if (userRole === 'ads_design') return 'ADS & DESIGN DAILY PROGRESS REPORT'
        return 'VIDEO EDITOR DAILY PROGRESS REPORT'
    }

    const rCol = getRoleColors()

    const [isRefreshingData, setIsRefreshingData] = useState(false)

    const handleRefreshModalData = async () => {
        setIsRefreshingData(true)
        const result = await fetchAllSheetsProjects()
        if (result.success || result.projects?.length > 0) {
            const currentReportMonth = getMonthYearFromDateStr(reportDate)
            
            // Filter by logged-in user if not admin
            let projectsList = result.projects || []
            const loggedInUser = localStorage.getItem('lastUsedEditor') || localStorage.getItem('userName') || ''
            if (loggedInUser && !isAdminMode) {
                projectsList = projectsList.filter(p => {
                    if (userRole === 'illustrator') {
                        return matchesUser(p.illustrator, loggedInUser)
                    } else {
                        return matchesUser(p.editor, loggedInUser)
                    }
                })
            }

            const mapped = projectsList.map((p, idx) => {
                const defaultPlan = []
                const status = (p.projectStatus || '').toLowerCase()
                if (status === 'done') defaultPlan.push('SUBMIT')
                else defaultPlan.push('CICIL')

                let people = ''
                if (userRole === 'illustrator') {
                    people = p.illustrator || ''
                } else {
                    people = p.editor || ''
                }

                const illMonth = getMonthYearFromDateString(p.dlIllustrator)
                const edMonth = getMonthYearFromDateString(p.dlEditor)
                const projectMonths = []
                if (illMonth) projectMonths.push(illMonth.label)
                if (edMonth) projectMonths.push(edMonth.label)

                const isCurrentMonth = projectMonths.includes(currentReportMonth)

                return {
                    id: p.rowIndex ? `${p.sourceSheet || 'unknown'}-${p.rowIndex}` : `proj-${idx}`,
                    plan: defaultPlan,
                    client: p.clients || '',
                    title: p.projectName || '',
                    notes: p.projectNotes || '',
                    editor: people ? people.split(',').map(e => e.trim()).filter(Boolean) : [],
                    selected: isCurrentMonth,
                    projectMonths
                }
            })
            setReportRows(mapped)
        }
        setIsRefreshingData(false)
    }

    const getRoleHeaderLabel = () => {
        if (userRole === 'illustrator') return 'ILLUSTRATOR'
        if (userRole === 'ads_design') return 'DESIGNER'
        return 'EDITOR'
    }

    const getRoleSingleLabel = () => {
        if (userRole === 'illustrator') return 'Illustrator'
        if (userRole === 'ads_design') return 'Designer'
        return 'Editor'
    }

    // Load custom editors list from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('ewo_custom_editors')
        if (stored) {
            try {
                setCustomEditors(JSON.parse(stored))
            } catch {
                setCustomEditors(['Zayn', 'Yoki', 'Zurvi', 'Hendi'])
            }
        } else {
            const defaults = ['Zayn', 'Yoki', 'Zurvi', 'Hendi']
            setCustomEditors(defaults)
            localStorage.setItem('ewo_custom_editors', JSON.stringify(defaults))
        }
    }, [])

    // Initialize rows from fetched initialProjects
    useEffect(() => {
        if (isOpen && initialProjects.length > 0) {
            const currentReportMonth = getMonthYearFromDateStr(reportDate)
            
            // Filter by logged-in user if not admin
            let projectsList = initialProjects
            const loggedInUser = localStorage.getItem('lastUsedEditor') || localStorage.getItem('userName') || ''
            if (loggedInUser && !isAdminMode) {
                projectsList = projectsList.filter(p => {
                    if (userRole === 'illustrator') {
                        return matchesUser(p.illustrator, loggedInUser)
                    } else {
                        return matchesUser(p.editor, loggedInUser)
                    }
                })
            }

            const mapped = projectsList.map((p, idx) => {
                // Determine initial plan array. Default to empty or ['CICIL'] based on details
                const defaultPlan = []
                const status = (p.projectStatus || '').toLowerCase()
                if (status === 'done') defaultPlan.push('SUBMIT')
                else defaultPlan.push('CICIL')

                // Editors/Illustrators strictly parsed based on role (no fallback)
                let people = ''
                if (userRole === 'illustrator') {
                    people = p.illustrator || ''
                } else {
                    people = p.editor || ''
                }

                const illMonth = getMonthYearFromDateString(p.dlIllustrator)
                const edMonth = getMonthYearFromDateString(p.dlEditor)
                const projectMonths = []
                if (illMonth) projectMonths.push(illMonth.label)
                if (edMonth) projectMonths.push(edMonth.label)

                // Only auto-select if the project has a deadline in the current report month!
                const isCurrentMonth = projectMonths.includes(currentReportMonth)

                return {
                    id: p.rowIndex ? `${p.sourceSheet || 'unknown'}-${p.rowIndex}` : `proj-${idx}`,
                    plan: defaultPlan,
                    client: p.clients || '',
                    title: p.projectName || '',
                    notes: p.projectNotes || '',
                    editor: people ? people.split(',').map(e => e.trim()).filter(Boolean) : [],
                    selected: isCurrentMonth,
                    projectMonths
                }
            })
            setReportRows(mapped)
        } else if (isOpen && initialProjects.length === 0) {
            // Start with one blank row if no projects loaded
            setReportRows([createNewRow()])
        }
    }, [isOpen, initialProjects, userRole, isAdminMode])

    const [projectMonthFilter, setProjectMonthFilter] = useState('all')

    function getMonthYearFromDateStr(dateStr) {
        if (!dateStr) return ''
        const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (match) {
            const year = match[1]
            const monthNum = parseInt(match[2], 10)
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ]
            return `${months[monthNum - 1]} ${year}`
        }
        const dObj = new Date(dateStr)
        if (!isNaN(dObj.getTime())) {
            return `${dObj.toLocaleString('en-US', { month: 'long' })} ${dObj.getFullYear()}`
        }
        return ''
    }

    // Sync projectMonthFilter when reportDate changes
    useEffect(() => {
        const m = getMonthYearFromDateStr(reportDate)
        if (m) setProjectMonthFilter(m)
    }, [reportDate])

    const sortedFilterMonths = useMemo(() => {
        const months = new Set()
        reportRows.forEach(row => {
            if (row.projectMonths) {
                row.projectMonths.forEach(m => months.add(m))
            }
        })
        const list = Array.from(months)
        
        const getSortVal = (mStr) => {
            const monthsOrder = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
            const match = mStr.toLowerCase().match(/^([a-z]+)\s+(\d{4})/)
            if (!match) return 0
            const idx = monthsOrder.indexOf(match[1])
            const year = parseInt(match[2], 10)
            return year * 12 + idx
        }
        
        return list.sort((a, b) => getSortVal(a) - getSortVal(b))
    }, [reportRows])

    const displayedRows = useMemo(() => {
        return reportRows.filter(row => {
            if (row.id.startsWith('custom-')) return true
            if (projectMonthFilter === 'all') return true
            return row.projectMonths && row.projectMonths.includes(projectMonthFilter)
        })
    }, [reportRows, projectMonthFilter])

    // Close row editor dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveRowEditorDropdown(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (!isOpen) return null

    const createNewRow = () => ({
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        plan: ['CICIL'],
        client: '',
        title: '',
        notes: '',
        editor: [],
        selected: true
    })

    const handleAddRow = () => {
        setReportRows(prev => [...prev, createNewRow()])
    }

    const handleDeleteRow = (id) => {
        setReportRows(prev => prev.filter(r => r.id !== id))
    }

    const handleUpdateRow = (id, fields) => {
        setReportRows(prev => prev.map(r => r.id === id ? { ...r, ...fields } : r))
    }

    const handleTogglePlan = (id, planTag) => {
        const row = reportRows.find(r => r.id === id)
        if (!row) return
        const hasTag = row.plan.includes(planTag)
        const updatedPlan = hasTag 
            ? row.plan.filter(t => t !== planTag)
            : [...row.plan, planTag]
        handleUpdateRow(id, { plan: updatedPlan })
    }

    const handleAddCustomEditorGlobal = () => {
        const trimmed = newEditorInput.trim()
        if (!trimmed) return
        if (customEditors.some(e => e.toLowerCase() === trimmed.toLowerCase())) {
            setNewEditorInput('')
            return
        }
        const updated = [...customEditors, trimmed]
        setCustomEditors(updated)
        localStorage.setItem('ewo_custom_editors', JSON.stringify(updated))
        setNewEditorInput('')
    }

    const handleRemoveCustomEditorGlobal = (editorName) => {
        const updated = customEditors.filter(e => e !== editorName)
        setCustomEditors(updated)
        localStorage.setItem('ewo_custom_editors', JSON.stringify(updated))
    }

    const handleToggleEditorInRow = (rowId, editorName) => {
        const row = reportRows.find(r => r.id === rowId)
        if (!row) return
        const isAssigned = row.editor.includes(editorName)
        const updatedEditors = isAssigned
            ? row.editor.filter(e => e !== editorName)
            : [...row.editor, editorName]
        handleUpdateRow(rowId, { editor: updatedEditors })
    }

    // Dynamic high-res Canvas generation
    const handleDownloadJpg = async () => {
        const activeRows = reportRows.filter(r => r.selected)
        if (activeRows.length === 0) {
            alert('Silakan pilih minimal satu project untuk di-export.')
            return
        }

        // Setup dimensions
        const width = 1200
        const headerHeight = 200
        const rowHeight = 70
        const footerHeight = 80
        const tableHeaderHeight = 55
        const height = headerHeight + tableHeaderHeight + (activeRows.length * rowHeight) + footerHeight

        // Create canvas
        const canvas = document.createElement('canvas')
        const scale = 3 // 3x resolution for high sharpness
        canvas.width = width * scale
        canvas.height = height * scale
        const ctx = canvas.getContext('2d')
        ctx.scale(scale, scale)

        // Enable high-quality text anti-aliasing
        ctx.textBaseline = 'middle'

        // 1. Draw Clean White Background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)

        // Get role based color palettes
        const rCol = getRoleColors()

        // 2. Draw Premium Top Accent Stripe (Role-based)
        ctx.fillStyle = rCol.accent
        ctx.fillRect(0, 0, width, 12)

        // 3. Load & Draw Logo (left-aligned)
        let logoImg = null
        try {
            logoImg = await new Promise((resolve) => {
                const img = new Image()
                img.crossOrigin = 'anonymous'
                img.src = '/logo.jpg'
                img.onload = () => resolve(img)
                img.onerror = () => resolve(null)
            })
        } catch (e) {
            console.error('Logo loading failed:', e)
        }

        if (logoImg) {
            // Draw logo at x=50, y=40, scaled to width=120, height=120
            ctx.drawImage(logoImg, 50, 40, 120, 120)
        }

        // 4. Header Titles (aligned next to logo, x=190)
        const headerTextX = logoImg ? 190 : 50
        
        ctx.fillStyle = '#1e293b'
        ctx.font = 'bold 24px "Inter", "Segoe UI", Roboto, sans-serif'
        ctx.fillText('EWO ANIMATION', headerTextX, 65)

        ctx.fillStyle = rCol.accent
        ctx.font = '900 32px "Inter", "Segoe UI", Roboto, sans-serif'
        ctx.fillText(getRoleReportTitle(), headerTextX, 110)

        // Date of report
        const formattedDate = new Date(reportDate).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        })
        ctx.fillStyle = '#64748b'
        ctx.font = '500 18px "Inter", "Segoe UI", Roboto, sans-serif'
        ctx.fillText(formattedDate, headerTextX, 150)

        // 5. Draw Table Headers (starts at y=200)
        const tableY = headerHeight
        ctx.fillStyle = rCol.headerBg // Role-based header background
        ctx.fillRect(50, tableY, width - 100, tableHeaderHeight)

        // Header Labels
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px "Inter", "Segoe UI", Roboto, sans-serif'
        
        ctx.fillText('PLAN', 70, tableY + tableHeaderHeight / 2)
        ctx.fillText('CLIENT', 250, tableY + tableHeaderHeight / 2)
        ctx.fillText('TITLE', 400, tableY + tableHeaderHeight / 2)
        ctx.fillText('NOTES', 740, tableY + tableHeaderHeight / 2)
        ctx.fillText(getRoleHeaderLabel(), 960, tableY + tableHeaderHeight / 2)

        // Helper to draw rounded rectangles
        const drawRoundRect = (x, y, w, h, r, fill, stroke) => {
            ctx.beginPath()
            ctx.moveTo(x + r, y)
            ctx.arcTo(x + w, y, x + w, y + h, r)
            ctx.arcTo(x + w, y + h, x, y + h, r)
            ctx.arcTo(x, y + h, x, y, r)
            ctx.arcTo(x, y, x + w, y, r)
            ctx.closePath()
            if (fill) {
                ctx.fillStyle = fill
                ctx.fill()
            }
            if (stroke) {
                ctx.strokeStyle = stroke
                ctx.stroke()
            }
        }

        // Helper to truncate text to fit column width
        const truncateText = (text, maxWidth) => {
            if (ctx.measureText(text).width <= maxWidth) return text
            let temp = text
            while (temp.length > 0 && ctx.measureText(temp + '...').width > maxWidth) {
                temp = temp.slice(0, -1)
            }
            return temp + '...'
        }

        // 6. Draw Table Rows
        let currentY = tableY + tableHeaderHeight
        activeRows.forEach((row, rIdx) => {
            // Alternating row background
            ctx.fillStyle = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'
            ctx.fillRect(50, currentY, width - 100, rowHeight)

            // Subtle row border line
            ctx.strokeStyle = '#e2e8f0'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(50, currentY + rowHeight)
            ctx.lineTo(width - 50, currentY + rowHeight)
            ctx.stroke()

            // Column 1: Plan Pills (SUBMIT, CICIL, REV)
            let tagX = 70
            const tagY = currentY + (rowHeight - 32) / 2
            
            row.plan.forEach((planTag) => {
                const colors = PLAN_COLORS[planTag] || { bg: '#e2e8f0', text: '#4b5563', border: '#cbd5e1' }
                ctx.font = 'bold 12px "Inter", "Segoe UI", Roboto, sans-serif'
                const tagWidth = ctx.measureText(planTag).width + 24
                
                // Draw pill background
                drawRoundRect(tagX, tagY, tagWidth, 32, 16, colors.bg, null)
                
                // Draw text
                ctx.fillStyle = colors.text
                ctx.textAlign = 'center'
                ctx.fillText(planTag, tagX + tagWidth / 2, tagY + 16)
                ctx.textAlign = 'left' // reset

                tagX += tagWidth + 8
            })

            // Column 2: Client
            ctx.fillStyle = '#475569'
            ctx.font = '500 16px "Inter", "Segoe UI", Roboto, sans-serif'
            ctx.fillText(truncateText(row.client || '—', 140), 250, currentY + rowHeight / 2)

            // Column 3: Title
            ctx.fillStyle = '#0f172a'
            ctx.font = 'bold 16px "Inter", "Segoe UI", Roboto, sans-serif'
            ctx.fillText(truncateText(row.title || '—', 310), 400, currentY + rowHeight / 2)

            // Column 4: Notes
            ctx.fillStyle = '#4b5563'
            ctx.font = 'italic 15px "Inter", "Segoe UI", Roboto, sans-serif'
            ctx.fillText(truncateText(row.notes || '—', 190), 740, currentY + rowHeight / 2)

            // Column 5: Editor Badges (drawn side-by-side)
            let editorX = 960
            const editorY = currentY + (rowHeight - 30) / 2
            
            if (row.editor && row.editor.length > 0) {
                row.editor.forEach((ed) => {
                    const col = getEditorColor(ed)
                    ctx.font = 'bold 12px "Inter", "Segoe UI", Roboto, sans-serif'
                    const edWidth = ctx.measureText(ed).width + 20
                    
                    // Draw badge
                    drawRoundRect(editorX, editorY, edWidth, 30, 15, col.bg, null)
                    
                    // Draw text
                    ctx.fillStyle = col.text
                    ctx.textAlign = 'center'
                    ctx.fillText(ed, editorX + edWidth / 2, editorY + 15)
                    ctx.textAlign = 'left' // reset

                    editorX += edWidth + 6
                })
            } else {
                ctx.fillStyle = '#94a3b8'
                ctx.font = 'italic 16px "Inter", "Segoe UI", Roboto, sans-serif'
                ctx.fillText('—', 960, currentY + rowHeight / 2)
            }

            currentY += rowHeight
        })

        // Draw side borders for table outline
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 1
        ctx.strokeRect(50, tableY, width - 100, tableHeaderHeight + (activeRows.length * rowHeight))

        // 7. Footer
        const footerY = height - footerHeight
        ctx.fillStyle = '#f8fafc'
        ctx.fillRect(50, footerY, width - 100, footerHeight - 10)
        
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(50, footerY)
        ctx.lineTo(width - 50, footerY)
        ctx.stroke()

        ctx.fillStyle = '#94a3b8'
        ctx.font = '500 13px "Inter", "Segoe UI", Roboto, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('EWO Animation Progress Report • Generated via EWO Hub', width / 2, footerY + 35)

        // Trigger Download
        try {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
            const link = document.createElement('a')
            link.download = `daily_report_${reportDate}.jpg`
            link.href = dataUrl
            link.click()
        } catch (e) {
            console.error('Trigger download failed:', e)
            alert('Gagal mengunduh gambar karena masalah keamanan browser.')
        }
    }

    return (
        <div className="drm-overlay">
            <div className="drm-card">
                {/* Header */}
                <div className="drm-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Generate Daily Progress JPG</h2>
                        <button 
                            onClick={handleRefreshModalData} 
                            disabled={isRefreshingData}
                            className="drm-refresh-btn"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                border: '1px solid var(--primary-200)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--primary-50)',
                                color: 'var(--primary-700)',
                                cursor: 'pointer',
                                fontSize: 11,
                                fontWeight: 600,
                                transition: 'all 0.2s',
                            }}
                            title="Refresh project data from sheets"
                        >
                            <RefreshCw size={12} className={isRefreshingData ? 'spin' : ''} />
                            {isRefreshingData ? 'Refreshing...' : 'Refresh Sheet Data'}
                        </button>
                    </div>
                    <button onClick={onClose} className="drm-close-btn" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="drm-content">
                    {/* Setup block */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 6 }}>
                                Tanggal Laporan
                            </label>
                            <input
                                type="date"
                                className="input"
                                value={reportDate}
                                onChange={e => setReportDate(e.target.value)}
                                style={{ width: '100%', fontSize: 13 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 6 }}>
                                Saring Bulan Project
                            </label>
                            <select
                                className="input"
                                value={projectMonthFilter}
                                onChange={e => setProjectMonthFilter(e.target.value)}
                                style={{ width: '100%', fontSize: 13, height: '36px' }}
                            >
                                <option value="all">Semua Bulan</option>
                                {sortedFilterMonths.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 6 }}>
                                Tambah List {getRoleSingleLabel()} Terdaftar (Persisten)
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder={`Contoh: Zayn`}
                                    value={newEditorInput}
                                    onChange={e => setNewEditorInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddCustomEditorGlobal()}
                                    style={{ flex: 1, fontSize: 13 }}
                                />
                                <button onClick={handleAddCustomEditorGlobal} className="drm-add-ed-btn" title={`Tambah ${getRoleSingleLabel()}`}>
                                    <PlusCircle size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Editor list chips */}
                    <div style={{ marginBottom: 20 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', display: 'block', marginBottom: 6 }}>
                            Daftar {getRoleSingleLabel()} Tersimpan (Klik untuk menghapus):
                        </span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {customEditors.map(ed => {
                                const col = getEditorColor(ed)
                                return (
                                    <span 
                                        key={ed} 
                                        onClick={() => handleRemoveCustomEditorGlobal(ed)}
                                        className="drm-ed-chip"
                                        style={{ backgroundColor: col.bg, color: col.text }}
                                    >
                                        {ed} <X size={10} style={{ marginLeft: 4 }} />
                                    </span>
                                )
                            })}
                        </div>
                    </div>

                    {/* Rows Table */}
                    <div className="drm-table-container">
                        <table className="drm-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40, textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={displayedRows.length > 0 && displayedRows.every(r => r.selected)}
                                            onChange={e => {
                                                const displayedIds = new Set(displayedRows.map(r => r.id))
                                                setReportRows(prev => prev.map(r => displayedIds.has(r.id) ? { ...r, selected: e.target.checked } : r))
                                            }}
                                        />
                                    </th>
                                    <th style={{ width: 180 }}>Plan Tags</th>
                                    <th style={{ width: 120 }}>Client</th>
                                    <th>Title</th>
                                    <th style={{ width: 180 }}>Notes</th>
                                    <th style={{ width: 180 }}>{getRoleSingleLabel()}(s)</th>
                                    <th style={{ width: 50, textAlign: 'center' }}>Hapus</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedRows.map((row, rIdx) => (
                                    <tr key={row.id}>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={row.selected}
                                                onChange={e => handleUpdateRow(row.id, { selected: e.target.checked })}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {['SUBMIT', 'CICIL', 'REV'].map((tag) => {
                                                    const isActive = row.plan.includes(tag)
                                                    const colors = PLAN_COLORS[tag]
                                                    return (
                                                        <button
                                                            key={tag}
                                                            onClick={() => handleTogglePlan(row.id, tag)}
                                                            className={`drm-plan-tag-btn ${isActive ? 'active' : ''}`}
                                                            style={{
                                                                borderColor: colors.border,
                                                                color: isActive ? colors.text : 'var(--gray-400)',
                                                                background: isActive ? colors.bg : 'transparent'
                                                            }}
                                                        >
                                                            {tag}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="drm-inline-input"
                                                placeholder="Klien..."
                                                value={row.client}
                                                onChange={e => handleUpdateRow(row.id, { client: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="drm-inline-input"
                                                placeholder="Judul Project..."
                                                value={row.title}
                                                style={{ fontWeight: 600 }}
                                                onChange={e => handleUpdateRow(row.id, { title: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="drm-inline-input"
                                                placeholder="Catatan..."
                                                value={row.notes || ''}
                                                onChange={e => handleUpdateRow(row.id, { notes: e.target.value })}
                                            />
                                        </td>
                                        <td style={{ position: 'relative' }}>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                                                {row.editor.map(ed => (
                                                    <span 
                                                        key={ed} 
                                                        onClick={() => handleToggleEditorInRow(row.id, ed)}
                                                        className="drm-row-ed-chip"
                                                    >
                                                        {ed}
                                                    </span>
                                                ))}
                                                <button 
                                                    onClick={() => setActiveRowEditorDropdown(activeRowEditorDropdown === row.id ? null : row.id)}
                                                    className="drm-add-row-ed-btn"
                                                >
                                                    + Edit
                                                </button>
                                            </div>

                                            {/* Editors select dropdown popup */}
                                            {activeRowEditorDropdown === row.id && (
                                                <div className="drm-ed-dropdown" ref={dropdownRef}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', display: 'block', padding: '4px 8px 6px' }}>
                                                        Pilih {getRoleSingleLabel()}:
                                                    </span>
                                                    {customEditors.length === 0 ? (
                                                        <div style={{ padding: '6px 8px', fontSize: 12, color: 'var(--gray-400)', fontStyle: 'italic' }}>
                                                            Tambahkan {getRoleSingleLabel().toLowerCase()} di atas terlebih dahulu.
                                                        </div>
                                                    ) : (
                                                        <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                                                            {customEditors.map(edName => {
                                                                const isChecked = row.editor.includes(edName)
                                                                return (
                                                                    <div 
                                                                        key={edName} 
                                                                        onClick={() => handleToggleEditorInRow(row.id, edName)}
                                                                        className={`drm-ed-item ${isChecked ? 'active' : ''}`}
                                                                    >
                                                                        <span>{edName}</span>
                                                                        {isChecked && <Check size={12} style={{ color: rCol.accent }} />}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleDeleteRow(row.id)}
                                                className="drm-row-del-btn"
                                                title="Hapus baris"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="drm-footer">
                    <button 
                        onClick={handleAddRow} 
                        className="drm-secondary-btn"
                        style={{ color: rCol.accent, borderColor: rCol.accent }}
                    >
                        <Plus size={14} /> Tambah Baris
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={onClose} className="drm-cancel-btn">
                            Batal
                        </button>
                        <button 
                            onClick={handleDownloadJpg} 
                            className="drm-primary-btn"
                            style={{ backgroundColor: rCol.accent }}
                        >
                            <Download size={14} /> Download JPG
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .drm-overlay {
                    position: fixed; inset: 0; z-index: 9999;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center;
                    padding: var(--space-4);
                }
                .drm-card {
                    background: white; border-radius: var(--radius-xl);
                    width: 100%; max-width: 1000px; max-height: 90vh;
                    display: flex; flex-direction: column;
                    box-shadow: var(--shadow-2xl);
                    animation: drm-zoomIn 0.2s ease-out;
                    border: 1px solid var(--gray-100);
                    overflow: hidden;
                }
                @keyframes drm-zoomIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .drm-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: var(--space-4) var(--space-5);
                    border-bottom: 1px solid var(--gray-100);
                }
                .drm-close-btn {
                    border: none; background: transparent; color: var(--gray-400);
                    cursor: pointer; padding: 4px; border-radius: var(--radius-sm);
                    transition: all 0.15s;
                }
                .drm-close-btn:hover { color: var(--gray-900); background: var(--gray-100); }
                .drm-content {
                    flex: 1; overflow-y: auto; padding: var(--space-5);
                }
                .drm-add-ed-btn {
                    display: flex; align-items: center; justify-content: center;
                    padding: 8px 12px; background: var(--primary-500); color: white;
                    border: none; border-radius: var(--radius-md); cursor: pointer;
                    transition: all 0.2s;
                }
                .drm-add-ed-btn:hover { background: var(--primary-600); }
                .drm-ed-chip {
                    display: inline-flex; align-items: center;
                    padding: 3px 10px; border-radius: var(--radius-full);
                    font-size: 11px; font-weight: 700; cursor: pointer;
                    transition: all 0.15s;
                    box-shadow: var(--shadow-sm);
                }
                .drm-ed-chip:hover { opacity: 0.8; transform: translateY(-1px); }
                .drm-table-container {
                    border: 1px solid var(--gray-200);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                }
                .drm-table {
                    width: 100%; border-collapse: collapse; font-size: var(--text-sm);
                }
                .drm-table th {
                    text-align: left; padding: 8px 12px; font-weight: 600;
                    color: var(--gray-500); background: var(--gray-50);
                    border-bottom: 2px solid var(--gray-200);
                    font-size: 12px;
                }
                .drm-table td {
                    padding: 8px 12px; border-bottom: 1px solid var(--gray-100);
                    vertical-align: middle;
                }
                .drm-inline-input {
                    width: 100%; border: 1px dashed transparent;
                    padding: 6px 8px; border-radius: var(--radius-sm);
                    font-size: 13px; font-family: inherit;
                    transition: all 0.15s;
                }
                .drm-inline-input:hover { border-color: var(--gray-300); background: var(--gray-50); }
                .drm-inline-input:focus { border-color: var(--primary-500); background: white; outline: none; border-style: solid; }
                .drm-plan-tag-btn {
                    padding: 3px 8px; font-size: 11px; font-weight: 700;
                    border: 1px solid; border-radius: var(--radius-md);
                    cursor: pointer; transition: all 0.15s;
                    background: transparent;
                }
                .drm-row-ed-chip {
                    display: inline-block; padding: 1px 6px; border-radius: var(--radius-md);
                    background: var(--gray-100); color: var(--gray-700);
                    font-size: 11px; font-weight: 600; cursor: pointer;
                }
                .drm-row-ed-chip:hover { background: #fee2e2; color: #b91c1c; }
                .drm-add-row-ed-btn {
                    padding: 2px 6px; border: 1px dashed var(--gray-300);
                    background: transparent; color: var(--gray-500);
                    border-radius: var(--radius-md); font-size: 11px; font-weight: 600;
                    cursor: pointer;
                }
                .drm-add-row-ed-btn:hover { border-color: var(--primary-500); color: var(--primary-500); }
                .drm-row-del-btn {
                    border: none; background: transparent; color: var(--gray-400);
                    cursor: pointer; padding: 4px; border-radius: var(--radius-sm);
                }
                .drm-row-del-btn:hover { color: #ef4444; background: #fee2e2; }
                .drm-ed-dropdown {
                    position: absolute; left: 12px; top: calc(100% + 4px); z-index: 10;
                    background: white; border: 1px solid var(--gray-200);
                    border-radius: var(--radius-md); box-shadow: var(--shadow-lg);
                    width: 180px; padding: 4px 0;
                }
                .drm-ed-item {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 6px 12px; cursor: pointer; font-size: 12px;
                    transition: all 0.15s;
                }
                .drm-ed-item:hover { background: var(--gray-50); }
                .drm-ed-item.active { font-weight: 600; color: var(--primary-600); }
                .drm-footer {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: var(--space-4) var(--space-5);
                    border-top: 1px solid var(--gray-100); background: var(--gray-50);
                }
                .drm-primary-btn {
                    display: flex; align-items: center; gap: 6px;
                    padding: 8px 16px; background: var(--primary-500); color: white;
                    border: none; border-radius: var(--radius-md); font-weight: 600;
                    font-size: var(--text-sm); cursor: pointer; transition: all 0.2s;
                }
                .drm-primary-btn:hover { background: var(--primary-600); }
                .drm-secondary-btn {
                    display: flex; align-items: center; gap: 6px;
                    padding: 8px 14px; background: white; color: var(--gray-700);
                    border: 1px solid var(--gray-200); border-radius: var(--radius-md);
                    font-weight: 600; font-size: var(--text-sm); cursor: pointer;
                    transition: all 0.2s;
                }
                .drm-secondary-btn:hover { background: var(--gray-50); }
                .drm-cancel-btn {
                    padding: 8px 16px; background: white; color: var(--gray-600);
                    border: 1px solid var(--gray-200); border-radius: var(--radius-md);
                    font-weight: 600; font-size: var(--text-sm); cursor: pointer;
                }
                .drm-cancel-btn:hover { background: var(--gray-50); }
            `}</style>
        </div>
    )
}

export default DailyReportModal
