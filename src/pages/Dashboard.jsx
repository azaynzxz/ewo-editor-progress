import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    FileEdit,
    BookOpen,
    FolderOpen,
    UserPlus,
    ArrowRight,
    Users,
    Layers,
    Sparkles,
    Rocket,
    Clock,
    Zap
} from 'lucide-react'
import { Card, CardBody, Modal, Button } from '../components/ui'
import { WIKI_ARTICLES } from './Wiki'
import { RESOURCES } from './Resources'
import { DEFAULT_EDITORS } from '../components/ProgressForm'
import UpcomingDeadlines from '../components/UpcomingDeadlines'

const QUICK_ACCESS = [
    {
        title: 'Progress Form',
        description: 'Submit daily editing progress',
        icon: FileEdit,
        bgClass: 'stat-icon-blue',
        path: '/progress'
    },
    {
        title: 'Wiki',
        description: 'Export settings & guides',
        icon: BookOpen,
        bgClass: 'stat-icon-purple',
        path: '/wiki'
    },
    {
        title: 'Resources',
        description: 'Assets & useful links',
        icon: FolderOpen,
        bgClass: 'stat-icon-orange',
        path: '/resources'
    },
    {
        title: 'Onboarding',
        description: 'New member guide & SOP',
        icon: UserPlus,
        bgClass: 'stat-icon-teal',
        path: '/onboarding'
    }
]

function Dashboard() {
    const navigate = useNavigate()
    const [greeting, setGreeting] = useState('Welcome back')

    useEffect(() => {
        const hours = new Date().getHours()
        if (hours < 12) setGreeting('Good Morning')
        else if (hours < 18) setGreeting('Good Afternoon')
        else setGreeting('Good Evening')
    }, [])

    // Auto-computed stats
    const STATS = [
        { label: 'Wiki Articles', value: WIKI_ARTICLES.length, icon: BookOpen, color: 'stat-icon-purple' },
        { label: 'Resources', value: RESOURCES.length, icon: Layers, color: 'stat-icon-orange' },
        { label: 'Team Members', value: DEFAULT_EDITORS.length, icon: Users, color: 'stat-icon-blue' }
    ]

    // Welcome modal state
    const [showWelcome, setShowWelcome] = useState(() => {
        return !localStorage.getItem('ewo_welcomed')
    })

    const handleCloseWelcome = () => {
        localStorage.setItem('ewo_welcomed', 'true')
        setShowWelcome(false)
    }

    const handleStartOnboarding = () => {
        localStorage.setItem('ewo_welcomed', 'true')
        setShowWelcome(false)
        navigate('/onboarding')
    }

    return (
        <>
            {/* Hero Section */}
            <div className="dashboard-hero">
                <div className="dashboard-hero-content">
                    <h1 className="hero-greeting">{greeting}, Editor!</h1>
                    <p className="hero-subtitle">
                        Ready to create some magic today? accessing your tools and resources has never been easier.
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-3" style={{ marginBottom: 'var(--space-8)' }}>
                {STATS.map((stat) => (
                    <Card key={stat.label} className="stat-card">
                        <CardBody>
                            <div className="stat-card-body">
                                <div className={`stat-icon-wrapper ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <div className="stat-value">{stat.value}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Quick Access + Upcoming Deadlines */}
            <div className="section-title">
                <Zap size={20} className="text-primary-500" />
                Quick Access
            </div>

            <div className="dashboard-quick-section">
                <div className="grid grid-2 dashboard-quick-cards">
                    {QUICK_ACCESS.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{ textDecoration: 'none' }}
                        >
                            <Card hoverable className="quick-access-card">
                                <CardBody>
                                    <div className="quick-access-header">
                                        <div className={`quick-access-icon ${item.bgClass}`}>
                                            <item.icon size={20} />
                                        </div>
                                        <ArrowRight size={20} style={{ color: 'var(--gray-300)' }} />
                                    </div>
                                    <h3 className="quick-access-title">{item.title}</h3>
                                    <p className="quick-access-desc">{item.description}</p>
                                </CardBody>
                            </Card>
                        </Link>
                    ))}
                </div>
                <UpcomingDeadlines />
            </div>

            {/* Existing Modal logic */}
            <Modal
                isOpen={showWelcome}
                onClose={handleCloseWelcome}
                title="Welcome to EWO Editor Hub!"
                size="md"
                footer={
                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={handleCloseWelcome}>
                            Explore Dashboard
                        </Button>
                        <Button
                            variant="primary"
                            icon={<Rocket size={18} />}
                            onClick={handleStartOnboarding}
                        >
                            Start Onboarding
                        </Button>
                    </div>
                }
            >
                <div style={{ lineHeight: 1.7 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        marginBottom: 'var(--space-4)',
                        padding: 'var(--space-3)',
                        background: 'var(--primary-50)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--primary-200)'
                    }}>
                        <Sparkles size={20} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
                        <p style={{
                            margin: 0,
                            fontSize: 'var(--text-sm)',
                            color: 'var(--primary-700)',
                            fontWeight: 500
                        }}>
                            This is your first time here! Let us show you around.
                        </p>
                    </div>

                    <p style={{
                        fontSize: 'var(--text-base)',
                        color: 'var(--gray-700)',
                        margin: '0 0 var(--space-3)'
                    }}>
                        EWO Editor Hub matches the premium quality of your edits. Everything in one place:
                    </p>

                    <ul style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--gray-600)',
                        margin: 0,
                        paddingLeft: 'var(--space-5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-2)'
                    }}>
                        <li><strong>Progress Form</strong> — Streamlined daily reporting</li>
                        <li><strong>Wiki</strong> — Your editing knowledge base</li>
                        <li><strong>Resources</strong> — Assets at your fingertips</li>
                    </ul>
                </div>
            </Modal>
        </>
    )
}

export default Dashboard
