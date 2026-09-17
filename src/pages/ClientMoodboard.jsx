import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Palette,
    FolderOpen,
    ExternalLink,
    Search,
    Copy,
    Check,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    ShieldAlert,
    Sparkles,
    Film,
    FileText,
    Clock,
    Flame,
    EyeOff,
    CheckCircle2,
    Layers,
    SlidersHorizontal,
    Youtube,
    UserCheck
} from 'lucide-react'
import {
    COMPANY_INFO,
    GENERAL_RULES,
    CLIENT_STATUS,
    CLIENTS_DATA
} from '../data/clientMoodboardData'

export default function ClientMoodboard() {
    const [selectedTab, setSelectedTab] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [isRulesOpen, setIsRulesOpen] = useState(true)
    const [copiedPromptId, setCopiedPromptId] = useState(null)
    const [lightbox, setLightbox] = useState({ isOpen: false, clientIndex: 0, imageIndex: 0, zoom: 1 })

    // Active clients
    const activeClients = useMemo(() => {
        return CLIENTS_DATA.filter(c => c.status === CLIENT_STATUS.ACTIVE)
    }, [])

    // Upcoming clients
    const upcomingClients = useMemo(() => {
        return CLIENTS_DATA.filter(c => c.status === CLIENT_STATUS.COMING_SOON)
    }, [])

    // Filtering logic
    const filteredActiveClients = useMemo(() => {
        let result = activeClients

        if (selectedTab !== 'all' && selectedTab !== 'upcoming') {
            result = result.filter(c => c.id === selectedTab)
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            result = result.filter(c => {
                const matchName = c.name.toLowerCase().includes(query)
                const matchBadge = c.badge?.toLowerCase().includes(query)
                const matchNotes = c.specs?.specialNotes?.toLowerCase().includes(query)
                const matchCharStyle = c.specs?.characterStyle?.toLowerCase().includes(query)
                const matchBgStyle = c.specs?.backgroundStyle?.toLowerCase().includes(query)
                const matchPrompt = c.specs?.bgPrompt?.toLowerCase().includes(query)
                const matchImages = c.images?.some(img =>
                    img.label.toLowerCase().includes(query) ||
                    img.description?.toLowerCase().includes(query)
                )
                return matchName || matchBadge || matchNotes || matchCharStyle || matchBgStyle || matchPrompt || matchImages
            })
        }

        return result
    }, [activeClients, selectedTab, searchQuery])

    const filteredUpcomingClients = useMemo(() => {
        if (selectedTab !== 'all' && selectedTab !== 'upcoming') {
            return []
        }
        if (!searchQuery.trim()) return upcomingClients

        const query = searchQuery.toLowerCase().trim()
        return upcomingClients.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.notes?.toLowerCase().includes(query)
        )
    }, [upcomingClients, selectedTab, searchQuery])

    // Copy Prompt handler
    const handleCopyPrompt = (clientId, promptText) => {
        if (!promptText) return
        navigator.clipboard.writeText(promptText)
        setCopiedPromptId(clientId)
        setTimeout(() => setCopiedPromptId(null), 2500)
    }

    // Lightbox Controls
    const openLightbox = (clientId, imageIndex) => {
        const clientIdx = activeClients.findIndex(c => c.id === clientId)
        if (clientIdx !== -1) {
            setLightbox({
                isOpen: true,
                clientIndex: clientIdx,
                imageIndex,
                zoom: 1
            })
        }
    }

    const closeLightbox = useCallback(() => {
        setLightbox(prev => ({ ...prev, isOpen: false, zoom: 1 }))
    }, [])

    const currentClient = activeClients[lightbox.clientIndex]
    const currentImage = currentClient?.images?.[lightbox.imageIndex]

    const handlePrevImage = useCallback(() => {
        if (!currentClient) return
        setLightbox(prev => ({
            ...prev,
            imageIndex: prev.imageIndex === 0 ? currentClient.images.length - 1 : prev.imageIndex - 1,
            zoom: 1
        }))
    }, [currentClient])

    const handleNextImage = useCallback(() => {
        if (!currentClient) return
        setLightbox(prev => ({
            ...prev,
            imageIndex: prev.imageIndex === currentClient.images.length - 1 ? 0 : prev.imageIndex + 1,
            zoom: 1
        }))
    }, [currentClient])

    const handleZoomIn = () => {
        setLightbox(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.25, 2.5) }))
    }

    const handleZoomOut = () => {
        setLightbox(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.25, 0.75) }))
    }

    const handleResetZoom = () => {
        setLightbox(prev => ({ ...prev, zoom: 1 }))
    }

    // Keyboard navigation for Lightbox
    useEffect(() => {
        if (!lightbox.isOpen) return
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeLightbox()
            if (e.key === 'ArrowLeft') handlePrevImage()
            if (e.key === 'ArrowRight') handleNextImage()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [lightbox.isOpen, closeLightbox, handlePrevImage, handleNextImage])

    return (
        <div className="moodboard-container">
            {/* Hero Section */}
            <motion.div
                className="mb-hero"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="mb-hero-content">
                    <div className="mb-hero-top">
                        <div className="mb-company-tag">
                            <Palette size={14} />
                            {COMPANY_INFO.companyName}
                        </div>
                        <div className="mb-hero-actions">
                            <div className="mb-pic-badge">
                                <UserCheck size={14} />
                                Penanggung Jawab: <strong>{COMPANY_INFO.pic}</strong>
                            </div>
                            <a
                                href={COMPANY_INFO.sopUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mb-sop-btn"
                            >
                                <FolderOpen size={16} />
                                SOP Ilustrator Google Drive
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h1 className="mb-hero-title">{COMPANY_INFO.title}</h1>
                        <p className="mb-hero-desc">{COMPANY_INFO.subtitle}</p>
                    </div>
                </div>
            </motion.div>

            {/* SOP Golden Rules Accordion */}
            <motion.div
                className="mb-rules-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
            >
                <div
                    className="mb-rules-header"
                    onClick={() => setIsRulesOpen(!isRulesOpen)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setIsRulesOpen(!isRulesOpen)}
                >
                    <div className="mb-rules-header-left">
                        <span className="mb-rules-badge">Panduan Wajib</span>
                        <h3 className="mb-rules-title">6 Aturan Dasar Pengerjaan Ilustrator</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray-500)' }}>
                        <span style={{ fontSize: 'var(--text-xs)' }}>{isRulesOpen ? 'Sembunyikan' : 'Buka Panduan'}</span>
                        {isRulesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </div>

                <AnimatePresence initial={false}>
                    {isRulesOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div className="mb-rules-grid">
                                {GENERAL_RULES.map((rule, idx) => (
                                    <div key={rule.id} className="mb-rule-item">
                                        <CheckCircle2 size={18} className="mb-rule-icon" />
                                        <div className="mb-rule-text">
                                            <h4>{idx + 1}. {rule.title}</h4>
                                            <p>{rule.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Toolbar: Tabs & Search */}
            <div className="mb-toolbar">
                <div className="mb-tabs">
                    <button
                        className={`mb-tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('all')}
                    >
                        <Layers size={16} />
                        Semua Klien
                        <span className="mb-tab-count">{activeClients.length}</span>
                    </button>
                    {activeClients.map(client => (
                        <button
                            key={client.id}
                            className={`mb-tab-btn ${selectedTab === client.id ? 'active' : ''}`}
                            onClick={() => setSelectedTab(client.id)}
                        >
                            {client.name}
                        </button>
                    ))}
                    <button
                        className={`mb-tab-btn ${selectedTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('upcoming')}
                    >
                        <SlidersHorizontal size={14} />
                        Klien Lainnya
                        <span className="mb-tab-count">{upcomingClients.length}</span>
                    </button>
                </div>

                <div className="mb-search-box">
                    <div style={{ position: 'relative' }}>
                        <Search
                            size={16}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--gray-400)'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Cari klien, style, prompt, kata kunci..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 36px',
                                fontSize: 'var(--text-sm)',
                                borderRadius: 'var(--radius-full)',
                                border: '1px solid var(--gray-300)',
                                outline: 'none',
                                transition: 'border-color var(--transition-fast)',
                                background: '#ffffff'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--gray-300)'}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--gray-400)'
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Active Clients List */}
            {filteredActiveClients.map(client => (
                <motion.article
                    key={client.id}
                    id={`client-${client.id}`}
                    className="mb-client-card"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Header */}
                    <div className="mb-client-header">
                        <div className="mb-client-title-group">
                            <h2 className="mb-client-name">{client.name}</h2>
                            <span className="mb-client-badge">{client.badge}</span>
                            {client.channel && (
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)' }}>
                                    • {client.channel}
                                </span>
                            )}
                        </div>
                        <a
                            href={client.folderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mb-drive-link"
                        >
                            <FolderOpen size={16} />
                            Buka Google Drive Klien
                            <ExternalLink size={14} />
                        </a>
                    </div>

                    <div className="mb-client-body">
                        {/* Specifications Grid */}
                        <div className="mb-specs-grid">
                            <div className="mb-spec-pill">
                                <span className="mb-spec-label">Style Karakter</span>
                                <span className="mb-spec-value">{client.specs.characterStyle}</span>
                            </div>

                            <div className="mb-spec-pill">
                                <span className="mb-spec-label">Style Background</span>
                                <span className="mb-spec-value">{client.specs.backgroundStyle}</span>
                            </div>

                            <div className="mb-spec-pill">
                                <span className="mb-spec-label">Narator Karakter</span>
                                <span className="mb-spec-value">{client.specs.narratorRequirement}</span>
                            </div>

                            <div className="mb-spec-pill">
                                <span className="mb-spec-label">Rentang Durasi</span>
                                <span className="mb-spec-value">{client.specs.projectDuration}</span>
                            </div>

                            <div className="mb-spec-pill">
                                <span className="mb-spec-label">Waktu Pengerjaan</span>
                                <span className="mb-spec-value success">
                                    <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
                                    {client.specs.turnaroundTime}
                                </span>
                            </div>

                            <div className="mb-spec-pill">
                                <span className="mb-spec-label">Thumbnail Klien</span>
                                <span className="mb-spec-value">
                                    {client.specs.hasThumbnail ? 'Ada Thumbnail' : 'Tidak Ada'}
                                </span>
                            </div>

                            <div className="mb-spec-pill">
                                <span className="mb-spec-label">Gore / Kekerasan</span>
                                <span className="mb-spec-value warning">
                                    <Flame size={13} style={{ display: 'inline', marginRight: '4px' }} />
                                    {client.specs.violenceGore}
                                </span>
                            </div>

                            <div className="mb-spec-pill">
                                <span className="mb-spec-label">Sensitivitas Seksual</span>
                                <span className="mb-spec-value danger">
                                    <EyeOff size={13} style={{ display: 'inline', marginRight: '4px' }} />
                                    {client.specs.sexualContent}
                                </span>
                            </div>
                        </div>

                        {/* Special Notes */}
                        {client.specs.specialNotes && (
                            <div className="mb-notes-box">
                                <ShieldAlert size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <strong style={{ display: 'block', fontSize: 'var(--text-xs)', color: '#b45309', marginBottom: '2px', textTransform: 'uppercase' }}>
                                        Catatan Khusus Pengerjaan
                                    </strong>
                                    <p>{client.specs.specialNotes}</p>
                                </div>
                            </div>
                        )}

                        {/* AI Background Prompt Card (if available, e.g. Angelo) */}
                        {client.specs.bgPrompt && (
                            <div className="mb-prompt-box">
                                <div className="mb-prompt-header">
                                    <div className="mb-prompt-title">
                                        <Sparkles size={16} />
                                        Prompt Rekomendasi Background (Gemini AI)
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {client.specs.sheetUrl && (
                                            <a
                                                href={client.specs.sheetUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mb-copy-btn"
                                                style={{ textDecoration: 'none' }}
                                            >
                                                <FileText size={13} />
                                                Sheet Scene Generation
                                                <ExternalLink size={12} />
                                            </a>
                                        )}
                                        <button
                                            className={`mb-copy-btn ${copiedPromptId === client.id ? 'copied' : ''}`}
                                            onClick={() => handleCopyPrompt(client.id, client.specs.bgPrompt)}
                                        >
                                            {copiedPromptId === client.id ? (
                                                <>
                                                    <Check size={14} />
                                                    Tersalin!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={14} />
                                                    Salin Prompt
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-prompt-code">
                                    {client.specs.bgPrompt}
                                </div>
                            </div>
                        )}

                        {/* Reference Images Gallery with Anti-Stretch Framework */}
                        <div>
                            <h3 className="mb-gallery-title">
                                <Film size={18} />
                                Galeri Referensi & Style Visual
                            </h3>

                            <div className="mb-gallery-grid">
                                {client.images?.map((img, imgIdx) => {
                                    const isUltrawide = img.aspectRatio > 2.2
                                    return (
                                        <div
                                            key={img.id}
                                            className={`mb-gallery-card ${isUltrawide ? 'mb-gallery-item ultrawide' : ''}`}
                                        >
                                            {/* Anti-Stretch Container */}
                                            <div
                                                className="mb-img-frame"
                                                onClick={() => openLightbox(client.id, imgIdx)}
                                                title="Klik untuk memperbesar gambar"
                                            >
                                                {/* Blurred Background replica */}
                                                <img
                                                    src={img.src}
                                                    alt=""
                                                    className="mb-img-backdrop"
                                                    aria-hidden="true"
                                                />

                                                {/* Main non-stretched image (object-fit: contain) */}
                                                <img
                                                    src={img.src}
                                                    alt={img.label}
                                                    className="mb-img-element"
                                                    loading="lazy"
                                                />

                                                {/* Hover Overlay */}
                                                <div className="mb-img-hover-overlay">
                                                    <ZoomIn size={20} />
                                                    Perbesar Gambar
                                                </div>

                                                {/* Badges */}
                                                <span className="mb-card-badge-top">
                                                    {img.tag || img.category}
                                                </span>

                                                <span className="mb-card-badge-ratio">
                                                    {img.aspectRatio}:1
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div className="mb-gallery-info">
                                                <h4 className="mb-gallery-label">{img.label}</h4>
                                                <p className="mb-gallery-desc">{img.description}</p>
                                                <div className="mb-gallery-meta">
                                                    <span>Resolusi Asli: {img.resolution}</span>
                                                    <span style={{ textTransform: 'capitalize' }}>Kategori: {img.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Samples & External Reference Links */}
                        <div className="mb-samples-row">
                            {client.sampleDriveUrl && (
                                <a
                                    href={client.sampleDriveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mb-sample-btn primary"
                                >
                                    <Film size={16} />
                                    Tonton Sampel Video di Google Drive
                                    <ExternalLink size={14} />
                                </a>
                            )}

                            {client.specs.competitorRef && (
                                <a
                                    href={client.specs.competitorRef.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mb-sample-btn youtube"
                                >
                                    <Youtube size={16} />
                                    Referensi Kompetitor: {client.specs.competitorRef.title}
                                    <ExternalLink size={14} />
                                </a>
                            )}

                            <a
                                href={client.folderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mb-sample-btn outline"
                            >
                                <FolderOpen size={16} />
                                Folder Asset Lengkap
                            </a>
                        </div>
                    </div>
                </motion.article>
            ))}

            {/* Empty state if search returned no active clients */}
            {filteredActiveClients.length === 0 && (
                <div style={{
                    padding: 'var(--space-12)',
                    textAlign: 'center',
                    background: '#ffffff',
                    borderRadius: 'var(--radius-2xl)',
                    border: '1px solid var(--gray-200)',
                    marginBottom: 'var(--space-8)'
                }}>
                    <Search size={40} style={{ color: 'var(--gray-300)', marginBottom: 'var(--space-3)' }} />
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--gray-800)', margin: '0 0 8px 0' }}>
                        Tidak ada klien yang cocok dengan pencarian
                    </h3>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', margin: 0 }}>
                        Coba gunakan kata kunci lain seperti nama klien, "stickman", "prompt", atau klik "Semua Klien".
                    </p>
                </div>
            )}

            {/* Upcoming / In Development Clients Section */}
            {filteredUpcomingClients.length > 0 && (
                <section className="mb-upcoming-section">
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)', margin: '0 0 4px 0' }}>
                            Daftar Klien Dalam Proses Pengembangan
                        </h3>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', margin: 0 }}>
                            Klien-klien berikut terdaftar dalam dokumen arahan dan moodboard akan segera diperbarui secara bertahap.
                        </p>
                    </div>

                    <div className="mb-upcoming-grid">
                        {filteredUpcomingClients.map(upClient => (
                            <div key={upClient.id} className="mb-upcoming-card">
                                <div className="mb-upcoming-header">
                                    <h4 className="mb-upcoming-name">{upClient.name}</h4>
                                    <span className="mb-upcoming-badge">Dalam Proses</span>
                                </div>
                                <p className="mb-upcoming-desc">{upClient.notes}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Fullscreen Interactive Lightbox Modal */}
            <AnimatePresence>
                {lightbox.isOpen && currentImage && (
                    <motion.div
                        className="mb-lightbox-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={closeLightbox}
                    >
                        {/* Header */}
                        <div className="mb-lightbox-header" onClick={(e) => e.stopPropagation()}>
                            <div className="mb-lightbox-title-group">
                                <h4 className="mb-lightbox-title">
                                    {currentClient.name} • {currentImage.label}
                                </h4>
                                <span className="mb-lightbox-badge">
                                    {currentImage.resolution} ({currentImage.aspectRatio}:1)
                                </span>
                            </div>

                            <div className="mb-lightbox-controls">
                                <button
                                    className="mb-lightbox-btn"
                                    onClick={handleZoomOut}
                                    title="Perkecil Zoom (-)"
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <span style={{ fontSize: 'var(--text-xs)', minWidth: '42px', textAlign: 'center' }}>
                                    {Math.round(lightbox.zoom * 100)}%
                                </span>
                                <button
                                    className="mb-lightbox-btn"
                                    onClick={handleZoomIn}
                                    title="Perbesar Zoom (+)"
                                >
                                    <ZoomIn size={18} />
                                </button>
                                <button
                                    className="mb-lightbox-btn"
                                    onClick={handleResetZoom}
                                    title="Reset Zoom (100%)"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button
                                    className="mb-lightbox-btn"
                                    onClick={closeLightbox}
                                    title="Tutup Modal (Esc)"
                                    style={{ marginLeft: '8px', background: 'rgba(239, 68, 68, 0.2)' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Stage */}
                        <div className="mb-lightbox-stage" onClick={(e) => e.stopPropagation()}>
                            {/* Navigation Prev Button */}
                            {currentClient.images.length > 1 && (
                                <button
                                    className="mb-lightbox-nav-btn prev"
                                    onClick={handlePrevImage}
                                    title="Gambar Sebelumnya (Panah Kiri)"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                            )}

                            {/* Main Lightbox Image with Smooth Zoom */}
                            <motion.img
                                key={currentImage.src}
                                src={currentImage.src}
                                alt={currentImage.label}
                                className="mb-lightbox-img"
                                style={{ transform: `scale(${lightbox.zoom})` }}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: lightbox.zoom }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            />

                            {/* Navigation Next Button */}
                            {currentClient.images.length > 1 && (
                                <button
                                    className="mb-lightbox-nav-btn next"
                                    onClick={handleNextImage}
                                    title="Gambar Berikutnya (Panah Kanan)"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mb-lightbox-footer" onClick={(e) => e.stopPropagation()}>
                            <span>{currentImage.description}</span>
                            <span>
                                Gambar {lightbox.imageIndex + 1} dari {currentClient.images.length} • Tekan <strong>Esc</strong> untuk menutup, atau <strong>← →</strong> untuk berganti gambar
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
