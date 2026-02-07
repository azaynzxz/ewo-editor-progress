import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {
    FileText,
    CheckCircle,
    Circle,
    ExternalLink,
    Download,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    X
} from 'lucide-react'
import { PageHeader } from '../components/layout'
import { Card, CardHeader, CardBody, Button, Badge } from '../components/ui'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

// SOP PDF path - stored in public folder
const SOP_PDF_PATH = '/SOP EDITOR V2 (1).pdf'

const CHECKLIST_ITEMS = [
    {
        id: 1,
        category: 'Software',
        title: 'Install Adobe After Effects 2021+',
        description: 'Download and install from Adobe Creative Cloud'
    },
    {
        id: 2,
        category: 'Software',
        title: 'Install Adobe Premiere Pro 2021+',
        description: 'Download and install from Adobe Creative Cloud'
    },
    {
        id: 3,
        category: 'Software',
        title: 'Install Adobe Photoshop CS5+',
        description: 'For editing PSD assets from illustrators'
    },
    {
        id: 4,
        category: 'Setup',
        title: 'Read SOP Document',
        description: 'Review the Standard Operating Procedure document completely'
    },
    {
        id: 5,
        category: 'Setup',
        title: 'Set up project folder structure',
        description: 'Create the standard folder hierarchy for projects'
    },
    {
        id: 6,
        category: 'Setup',
        title: 'Configure auto-save settings',
        description: 'Set After Effects/Premiere Pro to auto-save every 5 minutes'
    },
    {
        id: 7,
        category: 'Training',
        title: 'Learn Animation Presets',
        description: 'Review animation presets at s.id/AN-STD-EWO'
    },
    {
        id: 8,
        category: 'Training',
        title: 'Complete export settings guide',
        description: 'Review the Wiki article on export settings'
    },
    {
        id: 9,
        category: 'Training',
        title: 'Practice with project template',
        description: 'Create a test project using the standard template'
    },
    {
        id: 10,
        category: 'Access',
        title: 'Request Google Drive access',
        description: 'Ask admin for access to Animation Projects folder'
    },
    {
        id: 11,
        category: 'Access',
        title: 'Set up Progress Form bookmark',
        description: 'Add ewo-editor-progress.pages.dev to your browser bookmarks'
    },
    {
        id: 12,
        category: 'Daily',
        title: 'Understand Daily Progress Tracking',
        description: 'Fill progress form daily between 20:00 - 07:00'
    }
]

function PDFViewer({ isOpen, onClose }) {
    const [numPages, setNumPages] = useState(null)
    const [scale, setScale] = useState(1.0)
    const [loading, setLoading] = useState(true)

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages)
        setLoading(false)
    }

    const zoomIn = () => {
        setScale(prev => Math.min(prev + 0.25, 2.5))
    }

    const zoomOut = () => {
        setScale(prev => Math.max(prev - 0.25, 0.5))
    }

    if (!isOpen) return null

    // Generate array of page numbers
    const pageNumbers = numPages ? Array.from({ length: numPages }, (_, i) => i + 1) : []

    return (
        <div className="pdf-viewer-overlay">
            <div className="pdf-viewer-container">
                <div className="pdf-viewer-header">
                    <h3>SOP DIVISI VIDEO EDITOR</h3>
                    <div className="pdf-viewer-controls">
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<ZoomOut size={18} />}
                            onClick={zoomOut}
                            disabled={scale <= 0.5}
                        />
                        <span className="pdf-zoom-level">{Math.round(scale * 100)}%</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<ZoomIn size={18} />}
                            onClick={zoomIn}
                            disabled={scale >= 2.5}
                        />
                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.3)', margin: '0 var(--space-2)' }} />
                        <span className="pdf-page-info">
                            {numPages ? `${numPages} pages` : 'Loading...'}
                        </span>
                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.3)', margin: '0 var(--space-2)' }} />
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<Download size={18} />}
                            onClick={() => window.open(SOP_PDF_PATH, '_blank')}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<X size={18} />}
                            onClick={onClose}
                        />
                    </div>
                </div>
                <div className="pdf-viewer-content">
                    {loading && (
                        <div className="pdf-loading">
                            <div className="loading-spinner" />
                            <p>Loading PDF...</p>
                        </div>
                    )}
                    <Document
                        file={SOP_PDF_PATH}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading=""
                    >
                        {pageNumbers.map(pageNum => (
                            <div key={pageNum} className="pdf-page-wrapper">
                                <Page
                                    pageNumber={pageNum}
                                    scale={scale}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                />
                                <div className="pdf-page-number">Page {pageNum}</div>
                            </div>
                        ))}
                    </Document>
                </div>
            </div>
        </div>
    )
}

function Onboarding() {
    const [completedItems, setCompletedItems] = useState(() => {
        const saved = localStorage.getItem('onboardingProgress')
        return saved ? JSON.parse(saved) : []
    })
    const [pdfViewerOpen, setPdfViewerOpen] = useState(false)

    useEffect(() => {
        localStorage.setItem('onboardingProgress', JSON.stringify(completedItems))
    }, [completedItems])

    const toggleItem = (id) => {
        setCompletedItems(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        )
    }

    const progress = Math.round((completedItems.length / CHECKLIST_ITEMS.length) * 100)

    const groupedItems = CHECKLIST_ITEMS.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = []
        }
        acc[item.category].push(item)
        return acc
    }, {})

    return (
        <>
            <PageHeader
                title="Onboarding"
                description="Welcome to the team! Complete these steps to get started"
            />

            {/* Progress Card */}
            <Card style={{ marginBottom: 'var(--space-6)' }}>
                <CardBody>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                        <div>
                            <h3 style={{
                                fontSize: 'var(--text-lg)',
                                fontWeight: 600,
                                margin: 0,
                                color: 'var(--gray-900)'
                            }}>
                                Your Progress
                            </h3>
                            <p style={{
                                fontSize: 'var(--text-sm)',
                                color: 'var(--gray-500)',
                                margin: 'var(--space-1) 0 0'
                            }}>
                                {completedItems.length} of {CHECKLIST_ITEMS.length} tasks completed
                            </p>
                        </div>
                        <div style={{
                            fontSize: 'var(--text-2xl)',
                            fontWeight: 700,
                            color: progress === 100 ? 'var(--success)' : 'var(--gray-900)'
                        }}>
                            {progress}%
                        </div>
                    </div>
                    <div className="progress-bar">
                        <div
                            className={`progress-fill ${progress === 100 ? 'success' : ''}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </CardBody>
            </Card>

            {/* SOP Document */}
            <Card style={{ marginBottom: 'var(--space-6)' }}>
                <CardHeader
                    icon={<FileText size={20} />}
                    iconColor="blue"
                    title="SOP Document"
                    subtitle="Standard Operating Procedure - Divisi Video Editor"
                    action={
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <Button
                                variant="primary"
                                size="sm"
                                icon={<FileText size={16} />}
                                onClick={() => setPdfViewerOpen(true)}
                            >
                                View PDF
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<Download size={16} />}
                                onClick={() => window.open(SOP_PDF_PATH, '_blank')}
                            >
                                Download
                            </Button>
                        </div>
                    }
                />
                <CardBody>
                    <p style={{
                        fontSize: 'var(--text-base)',
                        color: 'var(--gray-600)',
                        margin: 0,
                        lineHeight: 1.6
                    }}>
                        The SOP document contains all the essential procedures and guidelines for our editing workflow,
                        including pre-production, production, and post-production phases. This covers Animation projects,
                        Motion Graphics, and Video Ads production. Make sure to read this document thoroughly before
                        starting your first project.
                    </p>
                    <div style={{
                        marginTop: 'var(--space-4)',
                        padding: 'var(--space-3)',
                        background: 'var(--blue-50)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--blue-200)'
                    }}>
                        <p style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--blue-700)',
                            margin: 0,
                            fontWeight: 500
                        }}>
                            📋 Key Topics: Brief Analysis • Asset Collection • Folder Organization •
                            Project Dimensions • Animation Process • Video Ads Editing •
                            Render Settings • Quality Control
                        </p>
                    </div>
                </CardBody>
            </Card>

            {/* Checklist */}
            <h2 style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                marginBottom: 'var(--space-4)',
                color: 'var(--gray-900)'
            }}>
                Onboarding Checklist
            </h2>

            {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} style={{ marginBottom: 'var(--space-5)' }}>
                    <h3 style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        color: 'var(--gray-500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 'var(--space-3)'
                    }}>
                        {category}
                    </h3>

                    <Card>
                        {items.map((item, index) => {
                            const isCompleted = completedItems.includes(item.id)
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => toggleItem(item.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 'var(--space-3)',
                                        padding: 'var(--space-4)',
                                        borderBottom: index < items.length - 1 ? '1px solid var(--gray-100)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'background var(--transition-fast)',
                                        background: isCompleted ? 'var(--gray-50)' : 'white'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = isCompleted ? 'var(--gray-50)' : 'white'}
                                >
                                    {isCompleted ? (
                                        <CheckCircle size={22} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                                    ) : (
                                        <Circle size={22} style={{ color: 'var(--gray-300)', flexShrink: 0, marginTop: 2 }} />
                                    )}
                                    <div>
                                        <h4 style={{
                                            fontSize: 'var(--text-base)',
                                            fontWeight: 500,
                                            margin: 0,
                                            color: isCompleted ? 'var(--gray-500)' : 'var(--gray-900)',
                                            textDecoration: isCompleted ? 'line-through' : 'none'
                                        }}>
                                            {item.title}
                                        </h4>
                                        <p style={{
                                            fontSize: 'var(--text-sm)',
                                            color: 'var(--gray-500)',
                                            margin: 'var(--space-1) 0 0'
                                        }}>
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </Card>
                </div>
            ))}

            {/* PDF Viewer Modal */}
            <PDFViewer
                isOpen={pdfViewerOpen}
                onClose={() => setPdfViewerOpen(false)}
            />
        </>
    )
}

export default Onboarding
