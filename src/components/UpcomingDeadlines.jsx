import { useState, useEffect } from 'react'
import { List, RefreshCw, Copy, Check } from 'lucide-react'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyVSu5z5B_jKx8qjFLkS9pDjMbc2SHf8IY53JY5zG4s934-QWgjNLMRx3-zRYNVJ-F/exec'

const CACHE_KEY = 'ewo_upcoming_deadlines'

function UpcomingDeadlines({ compact = false }) {
    const [projects, setProjects] = useState(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY)
            return cached ? JSON.parse(cached) : []
        } catch { return [] }
    })
    const [isLoading, setIsLoading] = useState(false)
    const [copiedIdx, setCopiedIdx] = useState(null)

    const sortByDeadline = (list) =>
        [...list].sort((a, b) => {
            if (!a.deadline) return 1
            if (!b.deadline) return -1
            return new Date(a.deadline) - new Date(b.deadline)
        })

    const fetchProjects = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(APPS_SCRIPT_URL)
            const result = await response.json()
            if (result.success && result.data) {
                const sorted = sortByDeadline(result.data.projects || [])
                setProjects(sorted)
                localStorage.setItem(CACHE_KEY, JSON.stringify(sorted))
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

    // Only auto-fetch if no cached data exists
    useEffect(() => {
        if (projects.length === 0) {
            fetchProjects()
        }
    }, [])

    return (
        <div className={`upcoming-panel ${compact ? 'upcoming-panel-compact' : ''}`}>
            <div className="card">
                <div className="upcoming-panel-header">
                    <h3 className="upcoming-panel-title">
                        <List size={16} />
                        Upcoming Deadlines
                    </h3>
                    <button
                        type="button"
                        className="refresh-btn"
                        onClick={fetchProjects}
                        disabled={isLoading}
                        aria-label="Refresh"
                    >
                        <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
                    </button>
                </div>
                {isLoading && projects.length === 0 ? (
                    <div className="upcoming-empty">Loading...</div>
                ) : projects.length > 0 ? (
                    <div className="upcoming-table">
                        <div className="upcoming-header">
                            <span className="upcoming-col-title">Title</span>
                            <span className="upcoming-col-client">Client</span>
                            <span className="upcoming-col-deadline">Deadline</span>
                            <span className="upcoming-col-action"></span>
                        </div>
                        {projects.map((project, idx) => (
                            <div
                                key={idx}
                                className={`upcoming-row ${copiedIdx === idx ? 'copied' : ''}`}
                                style={copiedIdx !== idx ? getUrgencyStyle(project.deadline) : undefined}
                                onClick={() => copyTitle(project.title, idx)}
                                title="Click to copy title"
                            >
                                <span className="upcoming-col-title">{project.title}</span>
                                <span className="upcoming-col-client">{project.client}</span>
                                <span className="upcoming-col-deadline">{project.deadline}</span>
                                <span className="upcoming-col-action">
                                    {copiedIdx === idx ? <Check size={13} /> : <Copy size={13} />}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="upcoming-empty">No upcoming deadlines</div>
                )}
            </div>
        </div>
    )
}

export default UpcomingDeadlines
