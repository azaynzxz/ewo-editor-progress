import { Layers, UserCheck, CalendarClock, Target } from 'lucide-react'

const STAT_CONFIG = [
    { key: 'totalScenesToday', label: 'Scenes Today', icon: Layers, className: 'scenes' },
    { key: 'clockedInCount', label: 'Clocked In', icon: UserCheck, className: 'clocked-in' },
    { key: 'pendingLeaves', label: 'Pending Leaves', icon: CalendarClock, className: 'leaves' },
    { key: 'activeDeadlines', label: 'Active Deadlines', icon: Target, className: 'deadlines' },
]

function OverviewStats({ data, loading }) {
    if (loading) {
        return (
            <div className="admin-stats-strip">
                {STAT_CONFIG.map(s => (
                    <div key={s.key} className={`admin-stat-card ${s.className}`}>
                        <div className={`admin-stat-icon ${s.className}`}>
                            <s.icon size={22} />
                        </div>
                        <div className="admin-stat-info">
                            <h3><span className="admin-skeleton" style={{ width: 48, height: 24, display: 'inline-block' }} /></h3>
                            <p>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="admin-stats-strip">
            {STAT_CONFIG.map(s => (
                <div key={s.key} className={`admin-stat-card ${s.className}`}>
                    <div className={`admin-stat-icon ${s.className}`}>
                        <s.icon size={22} />
                    </div>
                    <div className="admin-stat-info">
                        <h3>{data?.[s.key] ?? 0}</h3>
                        <p>{s.label}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default OverviewStats
