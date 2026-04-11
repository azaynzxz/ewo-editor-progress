import { useState, useEffect, useCallback } from 'react'
import { Shield, RefreshCw, BarChart3, Users, FileText, CalendarRange, CalendarDays } from 'lucide-react'
import OverviewStats from '../components/admin/OverviewStats'
import AttendancePanel from '../components/admin/AttendancePanel'
import ProgressLog from '../components/admin/ProgressLog'
import LeaveManager from '../components/admin/LeaveManager'
import SchedulePanel from '../components/admin/SchedulePanel'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZpWsJEOFlOQkDA55JyjV1q6CkpO37VNbFi7bxrJsB2LeheFwSrDQHbm_oR5D1hl0TKQ/exec'

const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'attendance', label: 'Attendance', icon: Users },
    { id: 'progress', label: 'Progress', icon: FileText },
    { id: 'schedule', label: 'Schedule', icon: CalendarDays },
    { id: 'leaves', label: 'Leaves', icon: CalendarRange },
]

function todayStr() {
    return new Date().toISOString().split('T')[0]
}

function AdminPage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [refreshing, setRefreshing] = useState(false)

    // Data states
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

    const [schedule, setSchedule] = useState([])
    const [scheduleLoading, setScheduleLoading] = useState(false)

    // Fetch helpers
    const fetchOverview = useCallback(async () => {
        setOverviewLoading(true)
        try {
            const res = await fetch(`${APPS_SCRIPT_URL}?action=getAdminOverview`)
            const json = await res.json()
            if (json.success) setOverviewData(json.data)
        } catch (err) {
            console.error('Failed to fetch overview:', err)
        }
        setOverviewLoading(false)
    }, [])

    const fetchAttendance = useCallback(async (date) => {
        setAttendanceLoading(true)
        try {
            const res = await fetch(`${APPS_SCRIPT_URL}?action=getAdminAttendance&date=${encodeURIComponent(date)}`)
            const json = await res.json()
            if (json.success) setAttendance(json.data.attendance || [])
        } catch (err) {
            console.error('Failed to fetch attendance:', err)
        }
        setAttendanceLoading(false)
    }, [])

    const fetchProgress = useCallback(async (filters) => {
        setProgressLoading(true)
        try {
            const params = new URLSearchParams({ action: 'getAdminProgress' })
            if (filters.startDate) params.set('startDate', filters.startDate)
            if (filters.endDate) params.set('endDate', filters.endDate)
            if (filters.editor) params.set('editor', filters.editor)
            if (filters.client) params.set('client', filters.client)
            const res = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`)
            const json = await res.json()
            if (json.success) setProgress(json.data.progress || [])
        } catch (err) {
            console.error('Failed to fetch progress:', err)
        }
        setProgressLoading(false)
    }, [])

    const fetchLeaves = useCallback(async (status) => {
        setLeavesLoading(true)
        try {
            const params = new URLSearchParams({ action: 'getAdminLeaves' })
            if (status) params.set('status', status)
            const res = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`)
            const json = await res.json()
            if (json.success) setLeaves(json.data.leaves || [])
        } catch (err) {
            console.error('Failed to fetch leaves:', err)
        }
        setLeavesLoading(false)
    }, [])

    const fetchSchedule = useCallback(async () => {
        setScheduleLoading(true)
        try {
            const res = await fetch(`${APPS_SCRIPT_URL}?action=getAdminSchedule`)
            const json = await res.json()
            if (json.success) setSchedule(json.data.schedule || [])
        } catch (err) {
            console.error('Failed to fetch schedule:', err)
        }
        setScheduleLoading(false)
    }, [])

    // Fetch all data ONCE on mount — subsequent tab switches use cached data
    const [initialLoaded, setInitialLoaded] = useState(false)

    const fetchAll = useCallback(async () => {
        setRefreshing(true)
        await Promise.all([
            fetchOverview(),
            fetchAttendance(attendanceDate),
            fetchProgress(progressFilters),
            fetchLeaves(leaveStatusFilter),
            fetchSchedule(),
        ])
        setInitialLoaded(true)
        setTimeout(() => setRefreshing(false), 300)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { fetchAll() }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Re-fetch only when filters change (server-side filtering)
    useEffect(() => { if (initialLoaded) fetchAttendance(attendanceDate) }, [attendanceDate]) // eslint-disable-line
    useEffect(() => { if (initialLoaded) fetchProgress(progressFilters) }, [progressFilters]) // eslint-disable-line
    useEffect(() => { if (initialLoaded) fetchLeaves(leaveStatusFilter) }, [leaveStatusFilter]) // eslint-disable-line

    // Refresh = re-fetch everything
    const handleRefresh = async () => {
        await fetchAll()
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
                            className={`admin-refresh-btn ${refreshing ? 'spinning' : ''}`}
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            <RefreshCw size={16} />
                            {refreshing ? 'Refreshing…' : 'Refresh'}
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
            {activeTab === 'schedule' && (
                <SchedulePanel
                    schedule={schedule}
                    loading={scheduleLoading}
                />
            )}
        </div>
    )
}

export default AdminPage
