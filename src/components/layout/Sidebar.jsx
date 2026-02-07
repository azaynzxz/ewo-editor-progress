import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    FileEdit,
    BookOpen,
    FolderOpen,
    UserPlus,
    ExternalLink
} from 'lucide-react'

const NAV_ITEMS = [
    {
        section: 'Main',
        items: [
            { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/progress', icon: FileEdit, label: 'Progress Form' },
        ]
    },
    {
        section: 'Resources',
        items: [
            { path: '/wiki', icon: BookOpen, label: 'Wiki' },
            { path: '/resources', icon: FolderOpen, label: 'Resources' },
            { path: '/onboarding', icon: UserPlus, label: 'Onboarding' },
        ]
    }
]

const QUICK_LINKS = [
    { label: 'Schedule Sheet', url: 'https://docs.google.com/spreadsheets/d/1ZV3DZ_0OrV-84eoYEqaYOJ1zdVXPuWCkfEMy1MDbHas/edit?gid=2092016313#gid=2092016313' },
    { label: 'Animation Projects', url: 'https://drive.google.com/drive/folders/19BoWkrIwu7MbAN0s35B5Q_9cqE-LffYy' }
]

function Sidebar({ isOpen, onClose }) {
    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 199,
                        display: 'none'
                    }}
                />
            )}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/logo.jpg" alt="EWO Logo" className="sidebar-logo" />
                    <div>
                        <h1 className="sidebar-title">EWO Hub</h1>
                        <p className="sidebar-subtitle">Editor Resources</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((section) => (
                        <div key={section.section} className="nav-section">
                            <h2 className="nav-section-title">{section.section}</h2>
                            <ul className="nav-list">
                                {section.items.map((item) => (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `nav-link ${isActive ? 'active' : ''}`
                                            }
                                            onClick={onClose}
                                            end={item.path === '/'}
                                        >
                                            <item.icon size={20} className="nav-link-icon" />
                                            {item.label}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Quick Links Section */}
                    <div className="nav-section">
                        <h2 className="nav-section-title">Quick Links</h2>
                        <ul className="nav-list">
                            {QUICK_LINKS.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="nav-link"
                                    >
                                        <ExternalLink size={20} className="nav-link-icon" />
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>
            </aside>
        </>
    )
}

export default Sidebar
