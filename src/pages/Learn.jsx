import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    PlayCircle,
    Lock,
    CheckCircle2,
    Unlock,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    BookOpen
} from 'lucide-react'
import { PageHeader } from '../components/layout'
import { Card, CardBody, Badge, Button } from '../components/ui'
import courseData from '../data/lessons.json'

// ──────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────

function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
    )
    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
        const handler = (e) => setIsMobile(e.matches)
        mq.addEventListener('change', handler)
        setIsMobile(mq.matches)
        return () => mq.removeEventListener('change', handler)
    }, [breakpoint])
    return isMobile
}

const STATUS_CONFIG = {
    unlocked:  { label: 'Unlocked',  color: 'blue',  icon: <Unlock size={10} /> },
    completed: { label: 'Completed', color: 'success', icon: <CheckCircle2 size={10} /> },
    locked:    { label: 'Locked',    color: 'gray',  icon: <Lock size={10} /> },
}

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.locked
    return <Badge color={cfg.color} icon={cfg.icon}>{cfg.label}</Badge>
}

function useCourseData() {
    const { courseSlug, lessonSlug } = useParams()
    const navigate = useNavigate()
    const userRole = localStorage.getItem('userRole') || 'video_editor'

    const availableCourses = useMemo(() =>
        Object.values(courseData.courses).filter(c =>
            !c.roles || c.roles.length === 0 || c.roles.includes(userRole)
        ), [userRole])

    const course = useMemo(() => {
        if (courseSlug) {
            const found = availableCourses.find(c => c.slug === courseSlug)
            if (found) return found
        }
        return availableCourses[0] || null
    }, [courseSlug, availableCourses])

    const lessons = course?.lessons || []

    const initialIndex = useMemo(() => {
        if (!lessonSlug) return 0
        const idx = lessons.findIndex(l => l.slug === lessonSlug)
        return idx >= 0 ? idx : 0
    }, [lessonSlug, lessons])

    const [selectedIndex, setSelectedIndex] = useState(initialIndex)
    const activeLesson = lessons[selectedIndex] || null

    const completedCount = lessons.filter(l => l.status === 'completed').length
    const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0

    const selectLesson = (index) => {
        const lesson = lessons[index]
        if (!lesson || lesson.status === 'locked') return
        setSelectedIndex(index)
        if (course) navigate(`/learn/${course.slug}/${lesson.slug}`, { replace: true })
    }

    return { course, lessons, selectedIndex, activeLesson, completedCount, progressPct, selectLesson }
}

// ──────────────────────────────────────────────
// MOBILE: Card-based stacking layout
// Same pattern as Wiki — uses Card, CardBody, Badge
// ──────────────────────────────────────────────

function LearnMobile({ course, lessons, selectedIndex, activeLesson, completedCount, progressPct, selectLesson }) {
    const [showLessons, setShowLessons] = useState(false)

    const handlePrev = () => { if (selectedIndex > 0) selectLesson(selectedIndex - 1) }
    const handleNext = () => {
        const next = lessons[selectedIndex + 1]
        if (next && next.status !== 'locked') selectLesson(selectedIndex + 1)
    }

    return (
        <>
            <PageHeader
                title={course.title}
                description={`${completedCount} of ${lessons.length} lessons completed`}
            />

            {/* Progress bar card */}
            <Card style={{ marginBottom: 'var(--space-4)' }}>
                <CardBody>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-700)' }}>
                            Progress
                        </span>
                        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-700)' }}>
                            {progressPct}%
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                </CardBody>
            </Card>

            {/* Active lesson video card */}
            {activeLesson && (
                <Card style={{ marginBottom: 'var(--space-4)' }}>
                    {/* Video */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        paddingTop: '56.25%',
                        background: 'var(--gray-900)',
                    }}>
                        {activeLesson.youtube_video_id === 'PLACEHOLDER_ID' ? (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'var(--space-3)',
                                background: 'var(--gray-800)',
                            }}>
                                <div style={{
                                    width: 48, height: 48,
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.08)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <PlayCircle size={24} color="var(--gray-500)" />
                                </div>
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--gray-500)', margin: 0 }}>
                                    Video coming in Phase 2
                                </p>
                            </div>
                        ) : (
                            <iframe
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                                src={`https://www.youtube.com/embed/${activeLesson.youtube_video_id}?rel=0&modestbranding=1`}
                                title={activeLesson.title}
                                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        )}
                    </div>

                    {/* Lesson info */}
                    <CardBody>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                            <StatusBadge status={activeLesson.status} />
                            <Badge color="gray">Lesson {activeLesson.order} of {lessons.length}</Badge>
                        </div>
                        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--gray-900)', margin: '0 0 var(--space-2)' }}>
                            {activeLesson.title}
                        </h2>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-600)', lineHeight: 1.6, margin: 0 }}>
                            {activeLesson.description}
                        </p>
                    </CardBody>

                    {/* Nav */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: 'var(--space-3) var(--space-5)',
                        borderTop: '1px solid var(--gray-100)',
                        background: 'var(--gray-50)',
                    }}>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<ChevronLeft size={14} />}
                            onClick={handlePrev}
                            disabled={selectedIndex === 0}
                        >
                            Prev
                        </Button>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                            <strong style={{ color: 'var(--gray-700)' }}>{selectedIndex + 1}</strong> / {lessons.length}
                        </span>
                        <Button
                            variant="primary"
                            size="sm"
                            iconRight={<ChevronRight size={14} />}
                            onClick={handleNext}
                            disabled={selectedIndex === lessons.length - 1 || lessons[selectedIndex + 1]?.status === 'locked'}
                        >
                            Next
                        </Button>
                    </div>
                </Card>
            )}

            {/* Lesson list toggle */}
            <Card>
                <div
                    onClick={() => setShowLessons(prev => !prev)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: 'var(--space-3) var(--space-5)',
                        cursor: 'pointer',
                        userSelect: 'none',
                    }}
                >
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--gray-700)' }}>
                        All Lessons ({lessons.length})
                    </span>
                    <ChevronDown
                        size={18}
                        style={{
                            color: 'var(--gray-400)',
                            transform: showLessons ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s ease',
                        }}
                    />
                </div>

                {showLessons && (
                    <div style={{ borderTop: '1px solid var(--gray-100)' }}>
                        {lessons.map((lesson, index) => {
                            const isActive = index === selectedIndex
                            const isLocked = lesson.status === 'locked'
                            return (
                                <div
                                    key={lesson.id}
                                    onClick={() => !isLocked && selectLesson(index)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-3)',
                                        padding: 'var(--space-3) var(--space-5)',
                                        borderBottom: '1px solid var(--gray-50)',
                                        background: isActive ? 'var(--gray-900)' : 'transparent',
                                        cursor: isLocked ? 'not-allowed' : 'pointer',
                                        opacity: isLocked ? 0.5 : 1,
                                        transition: 'background 0.15s ease',
                                    }}
                                >
                                    <span style={{
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: isActive ? 'rgba(255,255,255,0.2)' : lesson.status === 'completed' ? 'var(--success-bg)' : 'var(--gray-100)',
                                        color: isActive ? 'white' : lesson.status === 'completed' ? 'var(--success)' : 'var(--gray-600)',
                                        fontSize: 'var(--text-xs)', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        {lesson.order}
                                    </span>
                                    <span style={{
                                        flex: 1,
                                        fontSize: 'var(--text-sm)',
                                        fontWeight: 500,
                                        color: isActive ? 'white' : 'var(--gray-700)',
                                    }}>
                                        {lesson.title}
                                    </span>
                                    {!isActive && <StatusBadge status={lesson.status} />}
                                </div>
                            )
                        })}
                    </div>
                )}
            </Card>
        </>
    )
}

// ──────────────────────────────────────────────
// DESKTOP: Two-panel layout (existing)
// ──────────────────────────────────────────────

function LearnDesktop({ course, lessons, selectedIndex, activeLesson, completedCount, progressPct, selectLesson }) {
    const handlePrev = () => { if (selectedIndex > 0) selectLesson(selectedIndex - 1) }
    const handleNext = () => {
        const next = lessons[selectedIndex + 1]
        if (next && next.status !== 'locked') selectLesson(selectedIndex + 1)
    }

    return (
        <>
            <div className="learn-header">
                <div className="learn-header-left">
                    <h1 className="learn-course-title">{course.title}</h1>
                    <p className="learn-course-subtitle">
                        {completedCount} of {lessons.length} lessons completed
                    </p>
                </div>
                <div className="learn-header-right">
                    <span className="learn-progress-label">{progressPct}%</span>
                    <div className="learn-progress-track" title={`${progressPct}% complete`}>
                        <div className="learn-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                </div>
            </div>

            <div className="learn-body">
                {/* Timeline */}
                <aside className="learn-timeline">
                    <div className="learn-timeline-header">
                        <p className="learn-timeline-heading">Course Lessons</p>
                    </div>
                    <div className="learn-timeline-list">
                        {lessons.map((lesson, index) => (
                            <button
                                key={lesson.id}
                                id={`lesson-item-${lesson.id}`}
                                className={[
                                    'learn-lesson-item',
                                    index === selectedIndex ? 'active' : '',
                                    lesson.status === 'completed' ? 'completed' : '',
                                    lesson.status === 'locked' ? 'locked' : '',
                                ].filter(Boolean).join(' ')}
                                onClick={() => selectLesson(index)}
                                disabled={lesson.status === 'locked'}
                                title={lesson.status === 'locked' ? 'Locked' : lesson.title}
                            >
                                <span className="learn-lesson-num">{lesson.order}</span>
                                <div className="learn-lesson-info">
                                    <p className="learn-lesson-title">{lesson.title}</p>
                                    <StatusBadge status={lesson.status} />
                                </div>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Viewer */}
                <main className="learn-viewer">
                    <div className="learn-viewer-inner">
                        <div className="learn-video-wrapper">
                            {activeLesson.youtube_video_id === 'PLACEHOLDER_ID' ? (
                                <div className="learn-video-placeholder">
                                    <div className="learn-video-placeholder-icon">
                                        <PlayCircle size={32} />
                                    </div>
                                    <p className="learn-video-placeholder-text">
                                        Video placeholder — real content coming in Phase 2
                                    </p>
                                </div>
                            ) : (
                                <iframe
                                    src={`https://www.youtube.com/embed/${activeLesson.youtube_video_id}?rel=0&modestbranding=1`}
                                    title={activeLesson.title}
                                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            )}
                        </div>

                        <div className="learn-lesson-details">
                            <div className="learn-lesson-details-header">
                                <h2 className="learn-lesson-details-title">{activeLesson.title}</h2>
                                <div className="learn-lesson-details-meta">
                                    <StatusBadge status={activeLesson.status} />
                                    <Badge color="gray" icon={<BookOpen size={12} />}>
                                        Lesson {activeLesson.order} of {lessons.length}
                                    </Badge>
                                </div>
                            </div>
                            <div className="learn-lesson-details-body">
                                <p className="learn-lesson-description">{activeLesson.description}</p>
                            </div>
                        </div>

                        <div className="learn-nav-footer">
                            <button className="btn btn-secondary" onClick={handlePrev} disabled={selectedIndex === 0}>
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <div className="learn-nav-info">
                                <strong>{selectedIndex + 1}</strong> / {lessons.length}
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={handleNext}
                                disabled={selectedIndex === lessons.length - 1 || lessons[selectedIndex + 1]?.status === 'locked'}
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}

// ──────────────────────────────────────────────
// Router Component
// ──────────────────────────────────────────────

export default function Learn() {
    const isMobile = useIsMobile()
    const data = useCourseData()

    const content = (!data.course || !data.activeLesson)
        ? (
            <div className="empty-state">
                <div className="empty-state-icon"><BookOpen size={32} /></div>
                <h3 className="empty-state-title">No courses available</h3>
                <p className="empty-state-message">No courses are available for your role yet.</p>
            </div>
        )
        : isMobile ? <LearnMobile {...data} /> : <LearnDesktop {...data} />

    return (
        <div style={{ position: 'relative', minHeight: '60vh' }}>
            {/* Blurred background content */}
            <div style={{
                filter: 'blur(6px)',
                pointerEvents: 'none',
                userSelect: 'none',
                opacity: 0.5,
            }}>
                {content}
            </div>

            {/* Coming Soon overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-4)',
                zIndex: 10,
            }}>
                <div style={{
                    width: 64, height: 64,
                    borderRadius: '50%',
                    background: 'var(--gray-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Lock size={28} color="var(--gray-400)" />
                </div>
                <h2 style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 700,
                    color: 'var(--gray-900)',
                    margin: 0,
                }}>
                    Coming Soon
                </h2>
                <p style={{
                    fontSize: 'var(--text-base)',
                    color: 'var(--gray-500)',
                    margin: 0,
                    textAlign: 'center',
                    maxWidth: 360,
                    lineHeight: 1.6,
                }}>
                    The Learn section is currently under development. Check back soon!
                </p>
            </div>
        </div>
    )
}
