import { useState } from 'react'
import {
    FolderOpen,
    Link as LinkIcon,
    Bookmark,
    ExternalLink,
    Palette,
    Music,
    FileType,
    Film,
    Plus
} from 'lucide-react'
import { PageHeader } from '../components/layout'
import { Card, CardBody, SearchInput, Button, Badge, EmptyState } from '../components/ui'

const CATEGORIES = [
    { id: 'all', label: 'All', icon: FolderOpen },
    { id: 'assets', label: 'Assets', icon: Film },
    { id: 'links', label: 'Quick Links', icon: LinkIcon },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark }
]

const RESOURCES = [
    {
        id: 1,
        name: 'Expression Panel',
        category: 'assets',
        type: 'AE Script',
        description: 'After Effects expression panel script/plugin for faster workflow',
        url: 'https://github.com/azaynzxz/after-effects-expression-panel',
        icon: Film,
        color: 'purple',
        tags: ['after effects', 'script', 'expressions', 'plugin', 'animation']
    },
    {
        id: 2,
        name: 'Cinematic LUTs Pack',
        category: 'assets',
        type: 'LUT',
        description: '15 cinematic color grading LUTs',
        url: '#',
        icon: Palette,
        color: 'orange',
        tags: ['color', 'grading', 'cinematic']
    },
    {
        id: 3,
        name: 'Client Drive - Alex',
        category: 'links',
        type: 'Google Drive',
        description: 'Project files and assets for Alex',
        url: 'https://drive.google.com',
        icon: FolderOpen,
        color: 'blue',
        tags: ['client', 'drive']
    },
    {
        id: 4,
        name: 'Free Sound Effects',
        category: 'bookmarks',
        type: 'Website',
        description: 'Freesound.org - Free sound effects library',
        url: 'https://freesound.org',
        icon: Music,
        color: 'teal',
        tags: ['audio', 'sfx', 'free']
    },
    {
        id: 5,
        name: 'Google Fonts',
        category: 'bookmarks',
        type: 'Website',
        description: 'Free fonts for all projects',
        url: 'https://fonts.google.com',
        icon: FileType,
        color: 'blue',
        tags: ['fonts', 'typography', 'free']
    },
    {
        id: 6,
        name: 'Client Drive - Simon',
        category: 'links',
        type: 'Google Drive',
        description: 'Project files and assets for Simon',
        url: 'https://drive.google.com',
        icon: FolderOpen,
        color: 'blue',
        tags: ['client', 'drive']
    }
]

function Resources() {
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')

    const filteredResources = RESOURCES.filter(resource => {
        const matchesSearch =
            resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesCategory = activeCategory === 'all' || resource.category === activeCategory

        return matchesSearch && matchesCategory
    })

    return (
        <>
            <PageHeader
                title="Resources"
                description="Assets, templates, quick links, and useful tools"
                action={
                    <Button variant="primary" icon={<Plus size={18} />}>
                        Add Resource
                    </Button>
                }
            />

            {/* Filters */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-5)',
                alignItems: 'center'
            }}>
                <div style={{ flex: '1', maxWidth: '300px' }}>
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search resources..."
                    />
                </div>

                <div className="tabs" style={{ border: 'none', padding: 0 }}>
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            className={`tab ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                        >
                            <cat.icon size={16} />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resources Grid */}
            {filteredResources.length > 0 ? (
                <div className="grid grid-auto">
                    {filteredResources.map((resource) => (
                        <a
                            key={resource.id}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                        >
                            <Card hoverable>
                                <CardBody>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                                        <div className={`card-header-icon ${resource.color}`}>
                                            <resource.icon size={20} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                                                <Badge color="gray">{resource.type}</Badge>
                                            </div>
                                            <h3 style={{
                                                fontSize: 'var(--text-base)',
                                                fontWeight: 600,
                                                margin: 'var(--space-2) 0 var(--space-1)',
                                                color: 'var(--gray-900)'
                                            }}>
                                                {resource.name}
                                            </h3>
                                            <p style={{
                                                fontSize: 'var(--text-sm)',
                                                color: 'var(--gray-500)',
                                                margin: 0
                                            }}>
                                                {resource.description}
                                            </p>
                                        </div>
                                        <ExternalLink size={16} style={{ color: 'var(--gray-400)' }} />
                                    </div>
                                </CardBody>
                            </Card>
                        </a>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<FolderOpen size={32} />}
                    title="No resources found"
                    message="Try adjusting your search or filters"
                />
            )}
        </>
    )
}

export default Resources
