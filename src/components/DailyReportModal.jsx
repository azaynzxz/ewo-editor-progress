import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Plus, Trash2, Download, X, PlusCircle, Check, RefreshCw, Edit3 } from 'lucide-react'
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
    const [expandedRowId, setExpandedRowId] = useState(null)
    const [viewMode, setViewMode] = useState('table')
    const [activePlanDropdown, setActivePlanDropdown] = useState(null)
    const [showNotesInputForRow, setShowNotesInputForRow] = useState({})
    const [showPercentageColumn, setShowPercentageColumn] = useState(true)
    const dropdownRef = useRef(null)
    const canvasRef = useRef(null)
    const [logoImage, setLogoImage] = useState(null)

    // Preload logo for synchronous canvas rendering
    useEffect(() => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = '/logo.jpg'
        img.onload = () => setLogoImage(img)
        img.onerror = () => console.error('Failed to load logo')
    }, [])

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
                    } else if (userRole === 'ads_design') {
                        return matchesUser(p.editor, loggedInUser) || matchesUser(p.illustrator, loggedInUser)
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
                } else if (userRole === 'ads_design') {
                    people = p.editor || p.illustrator || ''
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
                    progress: p.progress || '0%',
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
                    } else if (userRole === 'ads_design') {
                        return matchesUser(p.editor, loggedInUser) || matchesUser(p.illustrator, loggedInUser)
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
                } else if (userRole === 'ads_design') {
                    people = p.editor || p.illustrator || ''
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
                    progress: p.progress || '0%',
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

    // Close dropdowns on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (!event.target.closest('.drm-ed-dropdown-container') && !event.target.closest('.drm-add-row-ed-btn')) {
                setActiveRowEditorDropdown(null)
            }
            if (!event.target.closest('.drm-plan-dropdown-container')) {
                setActivePlanDropdown(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const createNewRow = () => ({
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        plan: ['CICIL'],
        client: '',
        title: '',
        progress: '0%',
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

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const activeRows = reportRows.filter(r => r.selected)
        const width = 1200
        const headerHeight = 200
        const rowHeight = 70
        const footerHeight = 80
        const tableHeaderHeight = 55
        const height = activeRows.length === 0
            ? 350
            : headerHeight + tableHeaderHeight + (activeRows.length * rowHeight) + footerHeight

        // Generate canvas at 2x resolution for preview sharpness & high quality download
        const scale = 2
        canvas.width = width * scale
        canvas.height = height * scale

        const ctx = canvas.getContext('2d')
        ctx.scale(scale, scale)
        ctx.textBaseline = 'middle'

        // 1. Draw Clean White Background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)

        const rCol = getRoleColors()

        // 2. Draw Premium Top Accent Stripe (Role-based)
        ctx.fillStyle = rCol.accent
        ctx.fillRect(0, 0, width, 12)

        // 3. Draw Logo
        if (logoImage) {
            ctx.drawImage(logoImage, 50, 40, 120, 120)
        }

        // 4. Header Titles
        const headerTextX = logoImage ? 190 : 50

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

        if (activeRows.length === 0) {
            // Draw empty state
            ctx.fillStyle = '#f8fafc'
            ctx.fillRect(50, headerHeight, width - 100, 100)
            ctx.strokeStyle = '#cbd5e1'
            ctx.lineWidth = 1
            ctx.strokeRect(50, headerHeight, width - 100, 100)

            ctx.fillStyle = '#94a3b8'
            ctx.font = 'italic 16px "Inter", sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('Pilih minimal satu project di panel kiri untuk melihat preview progress report.', width / 2, headerHeight + 50)
            ctx.textAlign = 'left' // reset
            return
        }

        // 5. Draw Table Headers
        const tableY = headerHeight
        ctx.fillStyle = rCol.headerBg
        ctx.fillRect(50, tableY, width - 100, tableHeaderHeight)

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px "Inter", "Segoe UI", Roboto, sans-serif'

        ctx.fillText('PLAN', 70, tableY + tableHeaderHeight / 2)
        ctx.fillText('CLIENT', 230, tableY + tableHeaderHeight / 2)
        ctx.fillText('TITLE', 370, tableY + tableHeaderHeight / 2)
        if (showPercentageColumn) {
            ctx.fillText('PERCENTAGE', 630, tableY + tableHeaderHeight / 2)
        }
        ctx.fillText('NOTES', showPercentageColumn ? 760 : 740, tableY + tableHeaderHeight / 2)
        ctx.fillText(getRoleHeaderLabel(), 960, tableY + tableHeaderHeight / 2)

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
            ctx.fillStyle = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'
            ctx.fillRect(50, currentY, width - 100, rowHeight)

            ctx.strokeStyle = '#e2e8f0'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(50, currentY + rowHeight)
            ctx.lineTo(width - 50, currentY + rowHeight)
            ctx.stroke()

            // Plan tags
            let tagX = 70
            const tagY = currentY + (rowHeight - 32) / 2

            row.plan.forEach((planTag) => {
                const colors = PLAN_COLORS[planTag] || { bg: '#e2e8f0', text: '#4b5563', border: '#cbd5e1' }
                ctx.font = 'bold 12px "Inter", "Segoe UI", Roboto, sans-serif'
                const tagWidth = ctx.measureText(planTag).width + 24

                drawRoundRect(tagX, tagY, tagWidth, 32, 16, colors.bg, null)
                ctx.fillStyle = colors.text
                ctx.textAlign = 'center'
                ctx.fillText(planTag, tagX + tagWidth / 2, tagY + 16)
                ctx.textAlign = 'left'

                tagX += tagWidth + 8
            })

            // Client
            ctx.fillStyle = '#475569'
            ctx.font = '500 16px "Inter", "Segoe UI", Roboto, sans-serif'
            ctx.fillText(truncateText(row.client || '—', 120), 230, currentY + rowHeight / 2)

            // Title
            ctx.fillStyle = '#0f172a'
            ctx.font = 'bold 16px "Inter", "Segoe UI", Roboto, sans-serif'
            ctx.fillText(truncateText(row.title || '—', showPercentageColumn ? 240 : 340), 370, currentY + rowHeight / 2)

            // Percentage
            if (showPercentageColumn) {
                ctx.fillStyle = '#0284c7'
                ctx.font = 'bold 16px "Inter", "Segoe UI", Roboto, sans-serif'
                ctx.fillText(truncateText(row.progress || '0%', 110), 630, currentY + rowHeight / 2)
            }

            // Notes
            ctx.fillStyle = '#4b5563'
            ctx.font = 'italic 15px "Inter", "Segoe UI", Roboto, sans-serif'
            ctx.fillText(truncateText(row.notes || '—', showPercentageColumn ? 180 : 200), showPercentageColumn ? 760 : 740, currentY + rowHeight / 2)

            // Editors
            let editorX = 960
            const editorY = currentY + (rowHeight - 30) / 2

            if (row.editor && row.editor.length > 0) {
                row.editor.forEach((ed) => {
                    const col = getEditorColor(ed)
                    ctx.font = 'bold 12px "Inter", "Segoe UI", Roboto, sans-serif'
                    const edWidth = ctx.measureText(ed).width + 20

                    drawRoundRect(editorX, editorY, edWidth, 30, 15, col.bg, null)
                    ctx.fillStyle = col.text
                    ctx.textAlign = 'center'
                    ctx.fillText(ed, editorX + edWidth / 2, editorY + 15)
                    ctx.textAlign = 'left'

                    editorX += edWidth + 6
                })
            } else {
                ctx.fillStyle = '#94a3b8'
                ctx.font = 'italic 16px "Inter", "Segoe UI", Roboto, sans-serif'
                ctx.fillText('—', 960, currentY + rowHeight / 2)
            }

            currentY += rowHeight
        })

        // Draw side borders
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
        ctx.textAlign = 'left'
    }, [reportRows, reportDate, logoImage, showPercentageColumn])

    // Draw canvas automatically when state changes
    useEffect(() => {
        if (isOpen) {
            drawCanvas()
        }
    }, [isOpen, drawCanvas])

    const handleDownloadJpg = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const activeRows = reportRows.filter(r => r.selected)
        if (activeRows.length === 0) {
            alert('Silakan pilih minimal satu project untuk di-export.')
            return
        }

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

    if (!isOpen) return null

    return (
        <div className="drm-overlay">
            <div className={`drm-card ${viewMode === 'table' ? 'view-table' : 'view-list'}`}>
                {/* Header */}
                <div className="drm-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Daily Report</h2>
                        <button
                            onClick={handleRefreshModalData}
                            disabled={isRefreshingData}
                            className="drm-refresh-btn"
                            title="Refresh project data from sheets"
                        >
                            <RefreshCw size={12} className={isRefreshingData ? 'spin' : ''} />
                            {isRefreshingData ? 'Refreshing...' : 'Refresh Sheet Data'}
                        </button>

                        {/* Segmented Mode Selector */}
                        <div className="drm-view-toggle">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`drm-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                            >
                                Table Mode
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`drm-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            >
                                List Mode
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="drm-close-btn" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Content - Redesigned split-screen layout */}
                <div className="drm-content">
                    <div className="drm-split-layout">
                        {/* Left Column: Controls & Card List */}
                        <div className="drm-controls-pane">
                            <div className="drm-setup-grid">
                                <div>
                                    <label className="drm-label">Tanggal Laporan</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={reportDate}
                                        onChange={e => setReportDate(e.target.value)}
                                        style={{ width: '100%', fontSize: 13 }}
                                    />
                                </div>
                                <div>
                                    <label className="drm-label">Saring Bulan Project</label>
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
                            </div>

                            {/* Toggle columns options */}
                            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <input
                                    type="checkbox"
                                    id="drm-toggle-percentage"
                                    checked={showPercentageColumn}
                                    onChange={e => setShowPercentageColumn(e.target.checked)}
                                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                                />
                                <label htmlFor="drm-toggle-percentage" style={{ fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                                    Tampilkan Kolom Persentase di JPG
                                </label>
                            </div>

                            {/* Editor global settings */}
                            <div style={{ marginBottom: 20 }}>
                                <label className="drm-label">Tambah List {getRoleSingleLabel()} Terdaftar (Persisten)</label>
                                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
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

                            {viewMode === 'table' ? (
                                displayedRows.length === 0 ? (
                                    <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--gray-400)', fontStyle: 'italic', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                        Tidak ada data project untuk filter bulan ini.
                                    </div>
                                ) : (
                                    <div className="drm-table-container">
                                        <table className="drm-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '4%', textAlign: 'center', overflow: 'visible' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={displayedRows.length > 0 && displayedRows.every(r => r.selected)}
                                                            onChange={e => {
                                                                const displayedIds = new Set(displayedRows.map(r => r.id))
                                                                setReportRows(prev => prev.map(r => displayedIds.has(r.id) ? { ...r, selected: e.target.checked } : r))
                                                            }}
                                                        />
                                                    </th>
                                                    <th style={{ width: '14%' }}>Plan Tags</th>
                                                    <th style={{ width: '12%' }}>Client</th>
                                                    <th style={{ width: '25%' }}>Title</th>
                                                    <th style={{ width: '12%' }}>Percentage</th>
                                                    <th style={{ width: '17%' }}>Notes</th>
                                                    <th style={{ width: '16%' }}>{getRoleSingleLabel()}(s)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {displayedRows.map((row) => (
                                                    <tr key={row.id}>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={row.selected}
                                                                onChange={e => handleUpdateRow(row.id, { selected: e.target.checked })}
                                                            />
                                                        </td>
                                                        <td className="drm-plan-dropdown-container" style={{ position: 'relative' }}>
                                                            <button
                                                                onClick={() => setActivePlanDropdown(activePlanDropdown === row.id ? null : row.id)}
                                                                className="drm-plan-dropdown-trigger"
                                                            >
                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                                    {row.plan.length === 0 ? 'Pilih Plan...' : row.plan.join(', ')}
                                                                </span>
                                                                <span style={{ fontSize: '8px', marginLeft: 4, color: 'var(--gray-400)' }}>▼</span>
                                                            </button>

                                                            {activePlanDropdown === row.id && (
                                                                <div className="drm-ed-dropdown" style={{ width: 140 }}>
                                                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', display: 'block', padding: '4px 8px 6px' }}>
                                                                        Pilih Plan:
                                                                    </span>
                                                                    <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                                                                        {['SUBMIT', 'CICIL', 'REV'].map(tag => {
                                                                            const isSelected = row.plan.includes(tag)
                                                                            return (
                                                                                <div
                                                                                    key={tag}
                                                                                    onClick={() => handleTogglePlan(row.id, tag)}
                                                                                    className={`drm-ed-item ${isSelected ? 'active' : ''}`}
                                                                                >
                                                                                    <span style={{ color: PLAN_COLORS[tag].text, fontWeight: 700 }}>{tag}</span>
                                                                                    {isSelected && <Check size={12} style={{ color: rCol.accent }} />}
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
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
                                                                placeholder="0%..."
                                                                value={row.progress || ''}
                                                                onChange={e => handleUpdateRow(row.id, { progress: e.target.value })}
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
                                                        <td className="drm-ed-dropdown-container" style={{ position: 'relative' }}>
                                                            <button
                                                                onClick={() => setActiveRowEditorDropdown(activeRowEditorDropdown === row.id ? null : row.id)}
                                                                className="drm-plan-dropdown-trigger"
                                                            >
                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                                    {row.editor.length === 0 ? `Pilih ${getRoleSingleLabel()}...` : row.editor.join(', ')}
                                                                </span>
                                                                <span style={{ fontSize: '8px', marginLeft: 4, color: 'var(--gray-400)' }}>▼</span>
                                                            </button>

                                                            {activeRowEditorDropdown === row.id && (
                                                                <div className="drm-ed-dropdown" ref={dropdownRef} style={{ right: 0, left: 'auto', zIndex: 1000 }}>
                                                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', display: 'block', padding: '4px 8px 6px' }}>
                                                                        Pilih {getRoleSingleLabel()}:
                                                                    </span>
                                                                    {customEditors.length === 0 ? (
                                                                        <div style={{ padding: '6px 8px', fontSize: 12, color: 'var(--gray-400)', fontStyle: 'italic' }}>
                                                                            Tambahkan {getRoleSingleLabel().toLowerCase()} di atas.
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
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            ) : (
                                <>
                                    {/* Section header for the list */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)' }}>
                                            Daftar Projects ({displayedRows.length})
                                        </span>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600, color: 'var(--gray-500)' }}>
                                            <input
                                                type="checkbox"
                                                checked={displayedRows.length > 0 && displayedRows.every(r => r.selected)}
                                                onChange={e => {
                                                    const displayedIds = new Set(displayedRows.map(r => r.id))
                                                    setReportRows(prev => prev.map(r => displayedIds.has(r.id) ? { ...r, selected: e.target.checked } : r))
                                                }}
                                            />
                                            Pilih Semua
                                        </label>
                                    </div>

                                    {/* Cards list container */}
                                    <div className="drm-cards-list">
                                        {displayedRows.length === 0 ? (
                                            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--gray-400)', fontStyle: 'italic', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
                                                Tidak ada data project untuk filter bulan ini.
                                            </div>
                                        ) : (
                                            displayedRows.map((row, rIdx) => {
                                                const isExpanded = expandedRowId === row.id
                                                return (
                                                    <div key={row.id} className={`drm-compact-row ${row.selected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}>
                                                        <div className="drm-row-main">
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={row.selected}
                                                                    onChange={e => handleUpdateRow(row.id, { selected: e.target.checked })}
                                                                    style={{ cursor: 'pointer' }}
                                                                />

                                                                {/* Plan badges */}
                                                                <div className="drm-row-badges">
                                                                    {row.plan.map(tag => (
                                                                        <span
                                                                            key={tag}
                                                                            className="drm-tag-badge"
                                                                            style={{
                                                                                background: PLAN_COLORS[tag].bg,
                                                                                color: PLAN_COLORS[tag].text,
                                                                                border: `1px solid ${PLAN_COLORS[tag].border}`
                                                                            }}
                                                                        >
                                                                            {tag.slice(0, 3)}
                                                                        </span>
                                                                    ))}
                                                                </div>

                                                                {/* Title Info */}
                                                                <div className="drm-row-title-info" style={{ minWidth: 0 }}>
                                                                    <span className="drm-row-title">{row.title || '(Tanpa Judul)'}</span>
                                                                    <span className="drm-row-client">{row.client ? `(${row.client})` : ''}</span>
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <button
                                                                    onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                                                                    className={`drm-row-action-btn ${isExpanded ? 'active' : ''}`}
                                                                    title="Edit project details"
                                                                >
                                                                    <Edit3 size={13} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteRow(row.id)}
                                                                    className="drm-row-action-btn delete"
                                                                    title="Hapus baris"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Expanded editing details */}
                                                        {isExpanded && (
                                                            <div className="drm-row-details">
                                                                {/* Plan tags */}
                                                                <div className="drm-detail-section">
                                                                    <span className="drm-field-label">Plan Tags</span>
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
                                                                </div>

                                                                {/* Inputs */}
                                                                <div className="drm-detail-section">
                                                                    <div className="drm-field-group">
                                                                        <span className="drm-field-label">Klien</span>
                                                                        <input
                                                                            type="text"
                                                                            className="drm-inline-input"
                                                                            placeholder="Client name"
                                                                            value={row.client}
                                                                            onChange={e => handleUpdateRow(row.id, { client: e.target.value })}
                                                                        />
                                                                    </div>
                                                                    <div className="drm-field-group" style={{ marginTop: 6 }}>
                                                                        <span className="drm-field-label">Judul Project</span>
                                                                        <input
                                                                            type="text"
                                                                            className="drm-inline-input"
                                                                            placeholder="Project title"
                                                                            style={{ fontWeight: 600 }}
                                                                            value={row.title}
                                                                            onChange={e => handleUpdateRow(row.id, { title: e.target.value })}
                                                                        />
                                                                    </div>
                                                                    <div className="drm-field-group" style={{ marginTop: 6 }}>
                                                                        <span className="drm-field-label">Percentage</span>
                                                                        <input
                                                                            type="text"
                                                                            className="drm-inline-input"
                                                                            placeholder="0%..."
                                                                            value={row.progress || ''}
                                                                            onChange={e => handleUpdateRow(row.id, { progress: e.target.value })}
                                                                        />
                                                                    </div>
                                                                    <div className="drm-field-group" style={{ marginTop: 6 }}>
                                                                        <span className="drm-field-label">Catatan</span>
                                                                        <input
                                                                            type="text"
                                                                            className="drm-inline-input"
                                                                            placeholder="Notes/Comment"
                                                                            value={row.notes || ''}
                                                                            onChange={e => handleUpdateRow(row.id, { notes: e.target.value })}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Editors selection list */}
                                                                <div className="drm-detail-section" style={{ position: 'relative' }}>
                                                                    <span className="drm-field-label" style={{ display: 'block', marginBottom: 4 }}>
                                                                        {getRoleSingleLabel()} Terkait
                                                                    </span>
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

                                                                    {activeRowEditorDropdown === row.id && (
                                                                        <div className="drm-ed-dropdown" ref={dropdownRef}>
                                                                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', display: 'block', padding: '4px 8px 6px' }}>
                                                                                Pilih {getRoleSingleLabel()}:
                                                                            </span>
                                                                            {customEditors.length === 0 ? (
                                                                                <div style={{ padding: '6px 8px', fontSize: 12, color: 'var(--gray-400)', fontStyle: 'italic' }}>
                                                                                    Tambahkan {getRoleSingleLabel().toLowerCase()} di atas.
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
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Right Column: Real-time Image Preview */}
                        <div className="drm-preview-pane">
                            <div className="drm-preview-header">
                                <span className="drm-preview-title">Realtime Preview Report</span>
                            </div>
                            <div className="drm-preview-canvas-container">
                                <canvas ref={canvasRef} className="drm-preview-canvas" />
                            </div>
                        </div>
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
                    width: 100%; max-height: 90vh;
                    display: flex; flex-direction: column;
                    box-shadow: var(--shadow-2xl);
                    animation: drm-zoomIn 0.2s ease-out;
                    border: 1px solid var(--gray-100);
                    overflow: hidden;
                    transition: max-width 0.2s ease-in-out;
                }
                .drm-card.view-table {
                    max-width: 90vw;
                }
                .drm-card.view-list {
                    max-width: 1500px;
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
                    flex: 1; overflow: hidden; padding: 0;
                }
                
                .drm-split-layout {
                    display: grid;
                    height: 100%;
                    max-height: calc(90vh - 140px);
                    transition: grid-template-columns 0.2s ease-in-out;
                }
                .drm-card.view-table .drm-split-layout {
                    grid-template-columns: 1fr 800px;
                }
                .drm-card.view-list .drm-split-layout {
                    grid-template-columns: 460px 1fr;
                }
                @media (max-width: 900px) {
                    .drm-split-layout {
                        grid-template-columns: 1fr !important;
                        overflow-y: auto;
                    }
                }
                
                .drm-controls-pane {
                    padding: var(--space-5);
                    overflow-y: auto;
                    overflow-x: auto;
                    border-right: 1px solid var(--gray-100);
                    max-height: calc(90vh - 140px);
                }
                
                /* Segmented View Selector */
                .drm-view-toggle {
                    display: flex;
                    background: var(--gray-100);
                    border-radius: var(--radius-md);
                    padding: 2px;
                    border: 1px solid var(--gray-200);
                }
                
                .drm-toggle-btn {
                    padding: 4px 10px;
                    font-size: 11px;
                    font-weight: 600;
                    border: none;
                    background: transparent;
                    color: var(--gray-500);
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    transition: all 0.15s;
                }
                
                .drm-toggle-btn.active {
                    background: white;
                    color: var(--gray-900);
                    box-shadow: var(--shadow-sm);
                }
                
                /* Table Styles */
                .drm-table-container {
                    width: 100%;
                    overflow: visible;
                    border: 1px solid var(--gray-200);
                    border-radius: var(--radius-md);
                    background: white;
                    margin-bottom: var(--space-6);
                }
                
                .drm-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                    font-size: 13px;
                    table-layout: fixed;
                }
                
                .drm-table th {
                    background: var(--gray-50);
                    color: var(--gray-600);
                    font-weight: 700;
                    padding: 6px 8px;
                    border-bottom: 1px solid var(--gray-200);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-size: 12px;
                }
                
                .drm-table td {
                    padding: 4px 6px;
                    border-bottom: 1px solid var(--gray-100);
                    vertical-align: middle;
                    overflow: visible;
                }
                
                .drm-table tr:hover {
                    background: var(--gray-50);
                }

                .drm-plan-dropdown-trigger {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 4px 6px;
                    border-radius: var(--radius-sm);
                    border: 1px solid transparent;
                    background: transparent;
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--gray-700);
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.15s;
                }
                .drm-plan-dropdown-trigger:hover {
                    border-color: var(--gray-300);
                    background: white;
                }

                .drm-plan-dropdown-menu {
                    position: absolute;
                    top: calc(100% + 4px);
                    left: 12px;
                    z-index: 200;
                    background: white;
                    border: 1px solid var(--gray-200);
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-lg);
                    padding: 6px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    width: 120px;
                }

                .drm-plan-dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 6px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 700;
                    transition: background 0.15s;
                }
                .drm-plan-dropdown-item:hover {
                    background: var(--gray-50);
                }
                .drm-plan-dropdown-item input {
                    margin: 0;
                    cursor: pointer;
                }

                .drm-add-notes-btn {
                    padding: 3px 6px;
                    border: 1px dashed var(--gray-200);
                    background: transparent;
                    color: var(--gray-400);
                    border-radius: var(--radius-sm);
                    font-size: 11px;
                    font-weight: 500;
                    cursor: pointer;
                    width: 100%;
                    text-align: center;
                    transition: all 0.1s;
                }
                .drm-add-notes-btn:hover {
                    border-color: var(--primary-400);
                    color: var(--primary-500);
                }
                
                .drm-preview-pane {
                    background: #f8fafc;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    max-height: calc(90vh - 140px);
                    border-left: 1px solid var(--gray-100);
                }
                
                .drm-preview-header {
                    padding: var(--space-4) var(--space-5);
                    border-bottom: 1px solid var(--gray-200);
                    background: white;
                    display: flex;
                    align-items: center;
                }
                
                .drm-preview-title {
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--gray-500);
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }
                
                .drm-preview-canvas-container {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    padding: var(--space-6);
                }
                
                .drm-preview-canvas {
                    max-width: 100%;
                    height: auto;
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-lg), 0 0 0 1px rgba(0,0,0,0.05);
                    background: white;
                }
                
                .drm-setup-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--space-4);
                    margin-bottom: var(--space-5);
                }
                
                .drm-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--gray-500);
                    margin-bottom: 6px;
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
                
                .drm-cards-list {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-4);
                    padding-bottom: var(--space-6);
                }
                
                .drm-compact-row {
                    background: white;
                    border: 1px solid var(--gray-200);
                    border-radius: var(--radius-md);
                    display: flex;
                    flex-direction: column;
                    transition: all 0.15s;
                    box-shadow: var(--shadow-sm);
                    overflow: hidden;
                }
                .drm-compact-row:hover {
                    border-color: var(--gray-300);
                }
                .drm-compact-row.selected {
                    border-color: var(--primary-200);
                    background: var(--primary-50) / 0.05;
                }
                .drm-compact-row.expanded {
                    border-color: var(--primary-400);
                    box-shadow: var(--shadow-md);
                }
                
                .drm-row-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    min-height: 40px;
                }
                
                .drm-row-badges {
                    display: flex;
                    gap: 3px;
                }
                
                .drm-tag-badge {
                    font-size: 9px;
                    font-weight: 700;
                    padding: 2px 5px;
                    border-radius: 4px;
                    line-height: 1;
                }
                
                .drm-row-title-info {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                }
                
                .drm-row-title {
                    font-weight: 600;
                    color: var(--gray-800);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 170px;
                }
                
                .drm-row-client {
                    color: var(--gray-400);
                    font-size: 11px;
                }
                
                .drm-row-action-btn {
                    border: none;
                    background: transparent;
                    color: var(--gray-400);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: var(--radius-sm);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s;
                }
                .drm-row-action-btn:hover {
                    color: var(--primary-600);
                    background: var(--primary-50);
                }
                .drm-row-action-btn.active {
                    color: var(--primary-700);
                    background: var(--primary-100);
                }
                .drm-row-action-btn.delete:hover {
                    color: #ef4444;
                    background: #fee2e2;
                }
                
                .drm-row-details {
                    padding: 12px;
                    border-top: 1px dashed var(--gray-200);
                    background: #fafafb;
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-3);
                }
                
                .drm-detail-section {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                
                .drm-card-plan {
                    display: flex;
                    gap: 6px;
                }
                
                .drm-plan-tag-btn {
                    padding: 4px 10px; font-size: 11px; font-weight: 700;
                    border: 1px solid; border-radius: var(--radius-md);
                    cursor: pointer; transition: all 0.15s;
                    background: transparent;
                }
                
                .drm-card-fields {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .drm-field-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .drm-field-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--gray-400);
                    width: 80px;
                    flex-shrink: 0;
                }
                
                .drm-inline-input {
                    width: 100%; box-sizing: border-box;
                    border: 1px solid transparent;
                    padding: 4px 6px; border-radius: var(--radius-sm);
                    font-size: 12px; font-family: inherit;
                    transition: all 0.1s; background: transparent;
                }
                .drm-inline-input:hover { border-color: var(--gray-200); background: var(--gray-50); }
                .drm-inline-input:focus { border-color: var(--primary-500); background: white; outline: none; box-shadow: 0 0 0 1px var(--primary-100); }
                
                .drm-row-ed-chip {
                    display: inline-block; padding: 1px 4px; border-radius: var(--radius-sm);
                    background: var(--gray-100); color: var(--gray-700);
                    font-size: 10px; font-weight: 600; cursor: pointer; line-height: 1.2;
                }
                .drm-row-ed-chip:hover { background: #fee2e2; color: #b91c1c; }
                
                .drm-add-row-ed-btn {
                    padding: 1px 4px; border: 1px dashed var(--gray-300);
                    background: transparent; color: var(--gray-500);
                    border-radius: var(--radius-sm); font-size: 10px; font-weight: 600;
                    cursor: pointer; line-height: 1.2;
                }
                .drm-add-row-ed-btn:hover { border-color: var(--primary-500); color: var(--primary-500); background: var(--primary-50); }
                
                .drm-row-del-btn {
                    border: none; background: transparent; color: var(--gray-400);
                    cursor: pointer; padding: 4px; border-radius: var(--radius-sm);
                }
                .drm-row-del-btn:hover { color: #ef4444; background: #fee2e2; }
                
                .drm-ed-dropdown {
                    position: absolute; left: 0; bottom: calc(100% + 4px); z-index: 10;
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
                    z-index: 5;
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
                
                .drm-refresh-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    border: 1px solid var(--primary-200);
                    border-radius: var(--radius-md);
                    background: var(--primary-50);
                    color: var(--primary-700);
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .drm-refresh-btn:hover {
                    background: var(--primary-100);
                }
                
                .spin {
                    animation: drm-spin 1s linear infinite;
                }
                @keyframes drm-spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

export default DailyReportModal
