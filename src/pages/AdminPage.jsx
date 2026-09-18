import { useState, useEffect, useCallback } from 'react'
import { Shield, RefreshCw, BarChart3, Users, FileText, CalendarRange, FolderKanban, LogOut, Lock } from 'lucide-react'
import OverviewStats from '../components/admin/OverviewStats'
import AttendancePanel from '../components/admin/AttendancePanel'
import ProgressLog from '../components/admin/ProgressLog'
import LeaveManager from '../components/admin/LeaveManager'
import ProjectManager from '../components/admin/ProjectManager'
import EmployeeManager from '../components/admin/EmployeeManager'
import AdminAuthGate from '../components/admin/AdminAuthGate'
import DailyReportModal from '../components/DailyReportModal'
import { fetchAllSheetsProjects } from '../utils/projectFetcher'

const APPS_SCRIPT_URL = '/api/exec'

const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'attendance', label: 'Attendance', icon: Users },
    { id: 'progress', label: 'Progress', icon: FileText },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'leaves', label: 'Leaves', icon: CalendarRange },
    { id: 'employees', label: 'Employees', icon: Shield },
]

function todayStr() {
    return new Date().toISOString().split('T')[0]
}

function AdminPage() {
    const [isAuthed] = useState(() => {
        const rawRole = localStorage.getItem('userRoleRaw') || '';
        const allowedAdmins = ['Sr. Video Editor', 'CEO', 'Finance', 'Sr. Illustrator'];
        return allowedAdmins.includes(rawRole);
    })
    const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => {
        return sessionStorage.getItem('adminAuth') === 'true';
    })
    const [activeTab, setActiveTab] = useState('overview')
    const [refreshing, setRefreshing] = useState(false)

    // Data states — all hooks MUST be above any early return
    const [overviewData, setOverviewData] = useState(null)
    const [overviewLoading, setOverviewLoading] = useState(true)

    const [attendance, setAttendance] = useState([])
    const [attendanceLoading, setAttendanceLoading] = useState(false)
    const [attendanceDate, setAttendanceDate] = useState(todayStr())

    const [progress, setProgress] = useState([])
    const [progressLoading, setProgressLoading] = useState(false)
    const [progressFilters, setProgressFilters] = useState({ startDate: '', endDate: '', editor: '', client: '' })

    const [leaves, setLeaves] = useState([])
    const [leavesLoading, setLeavesLoading] = useState(false)
    const [leaveStatusFilter, setLeaveStatusFilter] = useState('')
    const [leaveActionLoading, setLeaveActionLoading] = useState(false)

    const [projects, setProjects] = useState([])
    const [projectsLoading, setProjectsLoading] = useState(false)
    const [projectMonth, setProjectMonth] = useState('')
    const [availableSheets, setAvailableSheets] = useState([])
    const [syncState, setSyncState] = useState({ status: 'idle' })

    const [initialLoaded, setInitialLoaded] = useState(false)
    const [showReportModal, setShowReportModal] = useState(false)
    const [reportProjects, setReportProjects] = useState([])
    const [loadingReportProjects, setLoadingReportProjects] = useState(false)

    const [loadedTabs, setLoadedTabs] = useState({ overview: false, attendance: false, progress: false, leaves: false, projects: false })

    // Fetch helpers
    const fetchOverview = useCallback(async (forceRefresh = false) => {
        setOverviewLoading(true)
        try {
            const res = await fetch(`${APPS_SCRIPT_URL}?action=getAdminOverview${forceRefresh ? '&_refresh=true' : ''}`)
            const json = await res.json()
            if (json.success) {
                setOverviewData(json.data)
                try { localStorage.setItem('admin_overview_cache', JSON.stringify(json.data)) } catch {}
            }
        } catch (err) {
            console.error('Failed to fetch overview:', err)
        }
        setOverviewLoading(false)
    }, [])

    const fetchAttendance = useCallback(async (date, forceRefresh = false) => {
        setAttendanceLoading(true)
        try {
            const res = await fetch(`${APPS_SCRIPT_URL}?action=getAdminAttendance&date=${encodeURIComponent(date)}${forceRefresh ? '&_refresh=true' : ''}`)
            const json = await res.json()
            if (json.success) setAttendance(json.data.attendance || [])
        } catch (err) {
            console.error('Failed to fetch attendance:', err)
        }
        setAttendanceLoading(false)
    }, [])

    const fetchProgress = useCallback(async (filters, forceRefresh = false) => {
        setProgressLoading(true)
        try {
            const params = new URLSearchParams({ action: 'getAdminProgress' })
            if (filters.startDate) params.set('startDate', filters.startDate)
            if (filters.endDate) params.set('endDate', filters.endDate)
            if (filters.editor) params.set('editor', filters.editor)
            if (filters.client) params.set('client', filters.client)
            if (forceRefresh) params.set('_refresh', 'true')
            const res = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`)
            const json = await res.json()
            if (json.success) setProgress(json.data.progress || [])
        } catch (err) {
            console.error('Failed to fetch progress:', err)
        }
        setProgressLoading(false)
    }, [])

    const fetchLeaves = useCallback(async (status, forceRefresh = false) => {
        setLeavesLoading(true)
        try {
            const params = new URLSearchParams({ action: 'getAdminLeaves' })
            if (status) params.set('status', status)
            if (forceRefresh) params.set('_refresh', 'true')
            const res = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`)
            const json = await res.json()
            if (json.success) setLeaves(json.data.leaves || [])
        } catch (err) {
            console.error('Failed to fetch leaves:', err)
        }
        setLeavesLoading(false)
    }, [])

    const fetchProjects = useCallback(async (month, forceRefresh = false) => {
        setProjectsLoading(true)
        try {
            const params = new URLSearchParams({ action: 'getAdminProjects' })
            if (month) params.set('month', month)
            if (forceRefresh) params.set('_refresh', 'true')
            const res = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`)
            const json = await res.json()
            if (json.success) {
                setProjects(json.data.projects || [])
                if (json.data.sheetName) setProjectMonth(json.data.sheetName)
                if (json.data.availableSheets) setAvailableSheets(json.data.availableSheets)
            }
        } catch (err) {
            console.error('Failed to fetch projects:', err)
        }
        setProjectsLoading(false)
    }, [])

    // Fast initial load: only Overview stats and today's attendance for the landing view
    useEffect(() => {
        if (isAuthed && isAdminUnlocked) {
            fetchOverview(false)
            fetchAttendance(attendanceDate, false)
            setLoadedTabs(prev => ({ ...prev, overview: true, attendance: true }))
            setInitialLoaded(true)
        }
    }, [isAuthed, isAdminUnlocked]) // eslint-disable-line react-hooks/exhaustive-deps

    // Lazy load tab data on tab switch
    useEffect(() => {
        if (!isAuthed || !isAdminUnlocked || !initialLoaded) return
        if (activeTab === 'attendance' && !loadedTabs.attendance) {
            fetchAttendance(attendanceDate, false)
            setLoadedTabs(prev => ({ ...prev, attendance: true }))
        } else if (activeTab === 'progress' && !loadedTabs.progress) {
            fetchProgress(progressFilters, false)
            setLoadedTabs(prev => ({ ...prev, progress: true }))
        } else if (activeTab === 'leaves' && !loadedTabs.leaves) {
            fetchLeaves(leaveStatusFilter, false)
            setLoadedTabs(prev => ({ ...prev, leaves: true }))
        } else if (activeTab === 'projects' && !loadedTabs.projects) {
            fetchProjects(projectMonth, false)
            setLoadedTabs(prev => ({ ...prev, projects: true }))
        }
    }, [activeTab, isAuthed, initialLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

    // Re-fetch when specific tab filters change
    useEffect(() => { if (initialLoaded && loadedTabs.attendance) fetchAttendance(attendanceDate) }, [attendanceDate]) // eslint-disable-line
    useEffect(() => { if (initialLoaded && loadedTabs.progress) fetchProgress(progressFilters) }, [progressFilters]) // eslint-disable-line
    useEffect(() => { if (initialLoaded && loadedTabs.leaves) fetchLeaves(leaveStatusFilter) }, [leaveStatusFilter]) // eslint-disable-line

    // PIN & Inactive Employee gate via AdminAuthGate
    if (!isAdminUnlocked) {
        return <AdminAuthGate onSuccess={() => setIsAdminUnlocked(true)} />
    }

    // Strict role-based auth gate fallback
    if (!isAuthed) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column' }}>
                <Shield size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                <h2 style={{ color: '#111827', marginBottom: '8px' }}>Access Denied</h2>
                <p style={{ color: '#6b7280' }}>You do not have permission to view the admin panel.</p>
            </div>
        )
    }

    const handleLogout = () => {
        localStorage.clear()
        window.location.href = '/login'
    }

    const getPreviousMonthSheet = (currentSheet, available) => {
        if (!currentSheet || !available || available.length === 0) return null
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        const match = currentSheet.match(/^([A-Za-z]+)\s+(\d{4})/)
        if (!match) return null
        const monthName = match[1]
        const year = parseInt(match[2], 10)

        const mIdx = months.indexOf(monthName)
        if (mIdx === -1) return null

        const prevMIdx = mIdx === 0 ? 11 : mIdx - 1
        const prevYear = mIdx === 0 ? year - 1 : year
        const prevLabel = `${months[prevMIdx]} ${prevYear}`

        if (available.includes(prevLabel)) {
            return prevLabel
        }
        return null
    }

    const handleOpenReportModal = async () => {
        setLoadingReportProjects(true)
        let cachedProjects = []
        try {
            const cached = localStorage.getItem('ewo_all_projects_cache')
            if (cached) cachedProjects = JSON.parse(cached)
        } catch { }

        if (cachedProjects.length === 0) {
            const result = await fetchAllSheetsProjects()
            cachedProjects = result.projects || []
        }
        setReportProjects(cachedProjects)
        setLoadingReportProjects(false)
        setShowReportModal(true)
    }

    // Targeted refresh based on active tab with fresh bypass
    const handleRefresh = async () => {
        setRefreshing(true)
        const promises = [fetchOverview(true), fetchAttendance(attendanceDate, true)]
        if (activeTab === 'progress') promises.push(fetchProgress(progressFilters, true))
        else if (activeTab === 'leaves') promises.push(fetchLeaves(leaveStatusFilter, true))
        else if (activeTab === 'projects') promises.push(fetchProjects(projectMonth, true))
        await Promise.all(promises)
        setTimeout(() => setRefreshing(false), 300)
    }

    // ===== PROJECT CRUD (optimistic) =====
    const showSync = (status, message, retryFn) => {
        setSyncState({ status, message, retry: retryFn })
        if (status === 'saved') setTimeout(() => setSyncState({ status: 'idle' }), 3000)
    }

    const handleAddProject = async (data) => {
        // Optimistic: add temp row
        const tempRow = { ...data, rowIndex: 'temp-' + Date.now(), no: '…', progress: '', projectStatus: '', paymentStatus: '' }
        setProjects(prev => [...prev, tempRow])
        showSync('saving')
        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'createProject', month: projectMonth, ...data })
            })
            const json = await res.json()
            if (json.success) {
                showSync('saved')
                fetchProjects(projectMonth) // re-fetch to get real row index
            } else {
                setProjects(prev => prev.filter(p => p.rowIndex !== tempRow.rowIndex))
                showSync('error', json.data?.message || 'Create failed', () => handleAddProject(data))
            }
        } catch (err) {
            setProjects(prev => prev.filter(p => p.rowIndex !== tempRow.rowIndex))
            showSync('error', 'Network error', () => handleAddProject(data))
        }
    }

    const handleUpdateProject = async (rowIndex, fields) => {
        // Optimistic: update local state
        const prev = projects.map(p => p.rowIndex === rowIndex ? { ...p, ...fields } : p)
        const oldProjects = [...projects]
        setProjects(prev)
        showSync('saving')
        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'updateProject', month: projectMonth, rowIndex, fields })
            })
            const json = await res.json()
            if (json.success) {
                showSync('saved')
            } else {
                setProjects(oldProjects)
                showSync('error', json.data?.message || 'Update failed', () => handleUpdateProject(rowIndex, fields))
            }
        } catch (err) {
            setProjects(oldProjects)
            showSync('error', 'Network error', () => handleUpdateProject(rowIndex, fields))
        }
    }

    const handleDeleteProject = async (rowIndex) => {
        const oldProjects = [...projects]
        setProjects(prev => prev.filter(p => p.rowIndex !== rowIndex))
        showSync('saving')
        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'deleteProject', month: projectMonth, rowIndex })
            })
            const json = await res.json()
            if (json.success) {
                showSync('saved')
            } else {
                setProjects(oldProjects)
                showSync('error', json.data?.message || 'Delete failed', () => handleDeleteProject(rowIndex))
            }
        } catch (err) {
            setProjects(oldProjects)
            showSync('error', 'Network error', () => handleDeleteProject(rowIndex))
        }
    }

    // Leave status action
    const handleLeaveAction = async (id, status, message) => {
        setLeaveActionLoading(true)
        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'updateLeaveStatus', id, status, message })
            })
            const json = await res.json()
            if (json.success) {
                // Refresh leaves
                await fetchLeaves(leaveStatusFilter)
                // Also refresh overview to update pending count
                fetchOverview()
            }
        } catch (err) {
            console.error('Failed to update leave status:', err)
        }
        setLeaveActionLoading(false)
    }

    return (
        <div className="admin-page">
            {/* Header */}
            <div className="admin-header">
                <div className="admin-header-content">
                    <div>
                        <h1><Shield size={28} /> Admin Panel</h1>
                        <p>Monitor team activity, attendance, progress, and leave requests</p>
                    </div>
                    <div className="admin-header-actions">
                        <button
                            className="admin-refresh-btn"
                            onClick={handleOpenReportModal}
                            disabled={loadingReportProjects}
                            style={{ background: '#2563eb', color: 'white', borderColor: '#2563eb' }}
                        >
                            {loadingReportProjects ? 'Loading…' : 'Daily Report'}
                        </button>
                        <button
                            className={`admin-refresh-btn ${refreshing ? 'spinning' : ''}`}
                            onClick={handleRefresh}
                            disabled={refreshing}
                            style={{ padding: '8px', borderRadius: '50%' }}
                            title="Refresh All"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            className="admin-refresh-btn"
                            onClick={() => {
                                sessionStorage.removeItem('adminAuth');
                                setIsAdminUnlocked(false);
                            }}
                            style={{ padding: '8px', borderRadius: '50%' }}
                            title="Kunci Akses Admin (Lock)"
                        >
                            <Lock size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="admin-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                        {tab.id === 'leaves' && overviewData?.pendingLeaves > 0 && (
                            <span className="tab-badge">{overviewData.pendingLeaves}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <>
                    <OverviewStats data={overviewData} loading={overviewLoading} />
                    <div style={{ marginTop: 'var(--space-6)' }}>
                        <AttendancePanel
                            attendance={attendance}
                            loading={attendanceLoading || overviewLoading}
                            selectedDate={attendanceDate}
                            onDateChange={d => { setAttendanceDate(d); fetchAttendance(d) }}
                        />
                    </div>
                </>
            )}
            {activeTab === 'attendance' && (
                <AttendancePanel
                    attendance={attendance}
                    loading={attendanceLoading}
                    selectedDate={attendanceDate}
                    onDateChange={setAttendanceDate}
                />
            )}
            {activeTab === 'progress' && (
                <ProgressLog
                    progress={progress}
                    loading={progressLoading}
                    filters={progressFilters}
                    onFiltersChange={setProgressFilters}
                />
            )}
            {activeTab === 'leaves' && (
                <LeaveManager
                    leaves={leaves}
                    loading={leavesLoading}
                    statusFilter={leaveStatusFilter}
                    onStatusFilterChange={setLeaveStatusFilter}
                    onAction={handleLeaveAction}
                    actionLoading={leaveActionLoading}
                />
            )}
            {activeTab === 'projects' && (
                <ProjectManager
                    projects={projects}
                    loading={projectsLoading}
                    availableSheets={availableSheets}
                    currentSheet={projectMonth}
                    onMonthChange={m => { setProjectMonth(m); fetchProjects(m) }}
                    onAdd={handleAddProject}
                    onUpdate={handleUpdateProject}
                    onDelete={handleDeleteProject}
                    syncState={syncState}
                />
            )}
            {activeTab === 'employees' && (
                <EmployeeManager />
            )}

            {/* Daily Report Modal */}
            <DailyReportModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                initialProjects={reportProjects}
                isAdminMode={true}
            />
        </div>
    )
}

export default AdminPage
