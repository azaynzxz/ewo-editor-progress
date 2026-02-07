import { Link } from 'react-router-dom'
import {
    FileEdit,
    BookOpen,
    FolderOpen,
    UserPlus,
    ArrowRight,
    TrendingUp,
    Users,
    Layers
} from 'lucide-react'
import { PageHeader } from '../components/layout'
import { Card, CardHeader, CardBody } from '../components/ui'

const QUICK_ACCESS = [
    {
        title: 'Progress Form',
        description: 'Submit your daily editing progress',
        icon: FileEdit,
        color: 'blue',
        path: '/progress'
    },
    {
        title: 'Wiki',
        description: 'Export settings, project templates & guides',
        icon: BookOpen,
        color: 'purple',
        path: '/wiki'
    },
    {
        title: 'Resources',
        description: 'Assets, templates, and useful links',
        icon: FolderOpen,
        color: 'orange',
        path: '/resources'
    },
    {
        title: 'Onboarding',
        description: 'New team member guide & SOP',
        icon: UserPlus,
        color: 'teal',
        path: '/onboarding'
    }
]

const STATS = [
    { label: 'Wiki Articles', value: '2', icon: BookOpen },
    { label: 'Resources', value: '0', icon: Layers },
    { label: 'Team Members', value: '3', icon: Users }
]

function Dashboard() {
    return (
        <>
            <PageHeader
                title="Dashboard"
                description="Welcome to EWO Editor Hub — your central resource center"
            />

            {/* Stats */}
            <div className="grid grid-3" style={{ marginBottom: 'var(--space-6)' }}>
                {STATS.map((stat) => (
                    <Card key={stat.label}>
                        <CardBody>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <div className="card-header-icon gray">
                                    <stat.icon size={20} />
                                </div>
                                <div>
                                    <p style={{
                                        fontSize: 'var(--text-2xl)',
                                        fontWeight: 700,
                                        margin: 0,
                                        color: 'var(--gray-900)'
                                    }}>
                                        {stat.value}
                                    </p>
                                    <p style={{
                                        fontSize: 'var(--text-sm)',
                                        color: 'var(--gray-500)',
                                        margin: 0
                                    }}>
                                        {stat.label}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {/* Quick Access */}
            <h2 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                marginBottom: 'var(--space-4)',
                color: 'var(--gray-900)'
            }}>
                Quick Access
            </h2>
            <div className="grid grid-2">
                {QUICK_ACCESS.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        style={{ textDecoration: 'none' }}
                    >
                        <Card hoverable>
                            <CardBody>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                                    <div className={`card-header-icon ${item.color}`}>
                                        <item.icon size={24} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{
                                            fontSize: 'var(--text-lg)',
                                            fontWeight: 600,
                                            margin: '0 0 var(--space-1)',
                                            color: 'var(--gray-900)'
                                        }}>
                                            {item.title}
                                        </h3>
                                        <p style={{
                                            fontSize: 'var(--text-base)',
                                            color: 'var(--gray-500)',
                                            margin: 0
                                        }}>
                                            {item.description}
                                        </p>
                                    </div>
                                    <ArrowRight size={20} style={{ color: 'var(--gray-400)' }} />
                                </div>
                            </CardBody>
                        </Card>
                    </Link>
                ))}
            </div>
        </>
    )
}

export default Dashboard
