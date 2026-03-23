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
    { label: 'Animation Projects', url: 'https://drive.google.com/drive/folders/19BoWkrIwu7MbAN0s35B5Q_9cqE-LffYy' },
    { label: 'Word Level Subtitle Generator', url: 'https://colab.research.google.com/drive/12b2KXuxV6NzG5gyoEwaLwfvn1y0p2Jg1#scrollTo=hDm__dyMryUG' },
    { label: 'Audio Replacer', url: 'https://colab.research.google.com/drive/1TGf-cJ2K78IWmA9G-4VWMXCIWAFxHCjm#scrollTo=RIrOyTGiPRPy' },
    { label: '4K Converter', url: 'https://colab.research.google.com/drive/1z7svRvMnOKYsRkf1-Q_9CfchcDnJCEOH' }
]

function Sidebar({ isOpen, onClose }) {
    const userRole = localStorage.getItem('userRole') || 'video_editor'

    const filteredNavItems = NAV_ITEMS.filter(section => {
        if (userRole === 'illustrator' && section.section === 'Resources') {
            return false
        }
        return true
    })

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
                        zIndex: 199
                    }}
                />
            )}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <div className="sidebar-header">
                    <img src="/logo.jpg" alt="EWO Logo" className="sidebar-logo" />
                    <div>
                        <h1 className="sidebar-title">EWO Editor Hub</h1>
                        <p className="sidebar-subtitle">
                            {userRole === 'illustrator' ? 'Illustrator Resources' : 'Editor Resources'}
                        </p>
                    </div>
                </div>

                <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto' }}>
                    {filteredNavItems.map((section) => (
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

                {/* Switch Role Footer */}
                <div className="sidebar-footer" style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--gray-200)' }}>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', margin: '0 0 var(--space-2)' }}>
                        Logged in as: <strong style={{ textTransform: 'capitalize' }}>{userRole.replace('_', ' ')}</strong>
                    </p>
                    <button
                        onClick={() => {
                            localStorage.removeItem('userRole');
                            window.location.href = '/role-selection';
                        }}
                        style={{
                            width: '100%',
                            padding: 'var(--space-2)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--gray-300)',
                            background: 'transparent',
                            color: 'var(--gray-700)',
                            cursor: 'pointer',
                            fontSize: 'var(--text-sm)',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        Switch Role
                    </button>
                </div>
            </aside>
        </>
    )
}

export default Sidebar
