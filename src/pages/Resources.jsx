import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    FolderOpen,
    Link as LinkIcon,
    Bookmark,
    ExternalLink,
    Palette,
    Music,
    FileType,
    Film,
    Plus,
    Check,
    Download,
    Video,
    Chrome,
    Wrench,
    FileCode
} from 'lucide-react'
import { PageHeader } from '../components/layout'
import { Card, CardBody, SearchInput, Button, Badge, EmptyState, Modal, IconButton } from '../components/ui'

const CATEGORIES = [
    { id: 'all', label: 'All', icon: FolderOpen },
    { id: 'assets', label: 'Assets', icon: Film },
    { id: 'tools', label: 'Tools & Plugins', icon: Wrench },
    { id: 'links', label: 'Quick Links', icon: LinkIcon },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark }
]

export const RESOURCES = [
    {
        id: 'animation-root-folder',
        name: 'Animation Root Folder',
        category: 'assets',
        type: 'Google Drive',
        description: 'Main folder for animation projects and assets',
        url: 'https://drive.google.com/drive/folders/13zsPXKORIA6SSglH5Va-AdF1GytSzmB1?usp=sharing',
        icon: FolderOpen,
        color: 'blue',
        tags: ['animation', 'assets', 'drive']
    },
    {
        id: 'expression-panel',
        name: 'Expression Panel',
        category: 'tools',
        type: 'AE Script',
        description: 'AE expression panel — now with lipsync auto-sync, audio copy, and number counter animations',
        url: 'https://github.com/azaynzxz/after-effects-expression-panel',
        icon: Film,
        color: 'purple',
        tags: ['after effects', 'script', 'expressions', 'plugin', 'animation', 'lipsync', 'counter']
    },
    {
        id: 'frequently-used-plugin',
        name: 'Frequently used Plugin',
        category: 'assets',
        type: 'Google Drive',
        description: 'Collection of frequently used After Effects plugins',
        url: 'https://drive.google.com/drive/folders/13FS-au5sJEcvKjgtOn0h2IuNKFCcmB-Y?usp=drive_link',
        icon: FolderOpen,
        color: 'blue',
        tags: ['plugin', 'ae', 'assets']
    },
    {
        id: 'sound-effect',
        name: 'Sound Effect',
        category: 'assets',
        type: 'Google Drive',
        description: 'Collection of premium sound effects for EWO projects',
        url: 'https://drive.google.com/drive/folders/13zsPXKORIA6SSglH5Va-AdF1GytSzmB1?usp=sharing',
        icon: Music,
        color: 'teal',
        tags: ['audio', 'sfx', 'assets']
    },
    {
        id: 'google-fonts',
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
        id: 'amanda',
        name: 'Mascot Amanda',
        category: 'assets',
        type: 'Google Drive',
        description: 'Mascot and Asset Libraries with Tutorial for Amanda',
        url: '#',
        icon: FileType,
        color: 'pink',
        tags: ['mascot', 'amanda', 'assets', 'tutorial'],
        hasModal: true,
        links: [
            { title: 'MASCOT AMANDA', url: 'https://drive.google.com/file/d/1vmbp4lbhpIZ-TWpYJjzYSj0I7ko8XUFc/view?usp=drive_link' },
            { title: 'TUTORIAL', url: 'https://drive.google.com/file/d/1kufgxRL3iFDqzCOWDhTlHTbjQoHAyIp3/view?usp=drive_link' }
        ]
    },
    {
        id: 'jorge',
        name: 'Mascot Jorge',
        category: 'assets',
        type: 'Google Drive',
        description: 'Asset Libraries and Tutorial for Jorge',
        url: '#',
        icon: FileType,
        color: 'orange',
        tags: ['mascot', 'jorge', 'assets', 'tutorial'],
        hasModal: true,
        links: [
            { title: 'Tutorial Mascot Jorge', url: 'https://drive.google.com/open?id=1XHiBBFSnOtTYaQZbmoYZ6xVtaOrzgqeS&usp=drive_fs' },
            { title: 'Asset Libraries Jorge', url: 'https://drive.google.com/open?id=18ZeX8nDztsJPl_RxbymVEyyy2sp_T1zE&usp=drive_fs' }
        ]
    },
    {
        id: 'ioana',
        name: 'Libraries Ioana',
        category: 'assets',
        type: 'Google Drive',
        description: 'Asset Libraries for Ioana',
        url: 'https://drive.google.com/file/d/1YJOtRnqAXjhuOuUe-U8-w2SuiRwNJ9RD/view?usp=drive_link',
        icon: FileType,
        color: 'purple',
        tags: ['assets', 'libraries', 'ioana']
    },
    {
        id: 'csv-srt-generator',
        name: 'CSV / SRT Generator',
        category: 'tools',
        type: 'Google Colab',
        description: 'Generate SRT subtitles (non-Word Level) from CSV — ready to import into OPAL',
        url: 'https://colab.research.google.com/drive/12b2KXuxV6NzG5gyoEwaLwfvn1y0p2Jg1#scrollTo=6f7c898f',
        icon: FileCode,
        color: 'orange',
        tags: ['csv', 'srt', 'subtitle', 'opal', 'colab', 'generator']
    },
    {
        id: 'opal-music-search',
        name: 'OPAL Music Search',
        category: 'tools',
        type: 'OPAL App',
        description: 'Search and browse music for projects using OPAL',
        url: 'https://opal.google/app/1QLzpPXgGlyRlLr8FzVWAlIHaiq-klNfU',
        icon: Music,
        color: 'teal',
        tags: ['music', 'opal', 'search', 'audio', 'bgm']
    },
    {
        id: 'audio-downloader-extension',
        name: 'Audio Downloader (Envato)',
        category: 'tools',
        type: 'Chrome Extension',
        description: 'Premiere Pro plugin to search & download music from Envato — requires Chrome/Brave extension',
        url: 'https://github.com/azaynzxz/Audio-Downloader-Chrome-Extension',
        icon: Download,
        color: 'green',
        tags: ['premiere pro', 'envato', 'music', 'chrome extension', 'audio', 'download']
    },
    {
        id: 'psd-ae-tools',
        name: 'PSD Downscale & AE Downgrade',
        category: 'tools',
        type: 'Google Drive',
        description: 'Tools to downscale large PSD files and downgrade After Effects project versions',
        url: 'https://drive.google.com/drive/folders/1idgwPTLGIRKHggz5nYEJoU70JgwpoQJU?usp=drive_link',
        icon: Wrench,
        color: 'blue',
        tags: ['psd', 'after effects', 'downscale', 'downgrade', 'tools']
    },
    {
        id: 'youtube-downloader',
        name: 'YouTube Video Downloader',
        category: 'tools',
        type: 'Google Colab',
        description: 'Download videos from YouTube using Google Colab',
        url: 'https://colab.research.google.com/drive/1g0Fhrk-v2kHKoR0Q5h-6vY6kR_Gusgm2#scrollTo=norXgOlrshGx',
        icon: Video,
        color: 'red',
        tags: ['youtube', 'download', 'video', 'colab']
    }
]

function Resources() {
    const { slug } = useParams()
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [copied, setCopied] = useState(null)

    const selectedResource = RESOURCES.find(r => r.id === slug) || null

    const handleCopyLink = (e, id) => {
        e.preventDefault()
        e.stopPropagation()
        const url = `${window.location.origin}/resources/${id}`
        navigator.clipboard.writeText(url)
        setCopied(id)
        setTimeout(() => setCopied(null), 2000)
    }

    const filteredResources = RESOURCES.filter(resource => {
        const matchesSearch =
            resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesCategory = activeCategory === 'all' || resource.category === activeCategory

        return matchesSearch && matchesCategory
    })

    const renderModalContent = () => {
        if (!selectedResource) return null;

        if (selectedResource.hasModal && selectedResource.links) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <p style={{ color: 'var(--gray-600)', margin: 0, marginBottom: 'var(--space-2)' }}>
                        {selectedResource.description}
                    </p>
                    {selectedResource.links.map((link, idx) => (
                        <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                        >
                            <Button 
                                variant="outline" 
                                style={{ width: '100%', justifyContent: 'space-between', padding: 'var(--space-3)' }}
                            >
                                <span style={{ fontWeight: 500 }}>{link.title}</span>
                                <ExternalLink size={18} />
                            </Button>
                        </a>
                    ))}
                </div>
            )
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center', padding: 'var(--space-4) 0' }}>
                <div className={`card-header-icon ${selectedResource.color}`} style={{ width: 64, height: 64, borderRadius: '50%' }}>
                    <selectedResource.icon size={32} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 var(--space-2) 0' }}>{selectedResource.name}</h3>
                    <p style={{ color: 'var(--gray-600)', margin: 0 }}>{selectedResource.description}</p>
                </div>
                <a
                    href={selectedResource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', width: '100%' }}
                >
                    <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }}>
                        Open Resource <ExternalLink size={16} style={{ marginLeft: 'var(--space-2)' }} />
                    </Button>
                </a>
            </div>
        )
    }

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
            <div className="resources-filters">
                <div className="resources-search">
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
                    {filteredResources.map((resource) => {
                        const cardContent = (
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <IconButton 
                                                onClick={(e) => handleCopyLink(e, resource.id)}
                                                aria-label="Copy link"
                                            >
                                                {copied === resource.id ? <Check size={16} style={{ color: 'var(--success)' }} /> : <LinkIcon size={16} style={{ color: 'var(--gray-400)' }} />}
                                            </IconButton>
                                            <ExternalLink size={16} style={{ color: 'var(--gray-400)' }} />
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        )

                        if (resource.hasModal) {
                            return (
                                <div key={resource.id} style={{ cursor: 'pointer', textDecoration: 'none' }} onClick={() => navigate(`/resources/${resource.id}`)}>
                                    {cardContent}
                                </div>
                            )
                        }

                        return (
                            <a
                                key={resource.id}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none' }}
                            >
                                {cardContent}
                            </a>
                        )
                    })}
                </div>
            ) : (
                <EmptyState
                    icon={<FolderOpen size={32} />}
                    title="No resources found"
                    message="Try adjusting your search or filters"
                />
            )}

            {/* Resource Modal */}
            <Modal
                isOpen={!!selectedResource}
                onClose={() => navigate('/resources')}
                title={selectedResource?.name}
            >
                {renderModalContent()}
            </Modal>
        </>
    )
}

export default Resources
