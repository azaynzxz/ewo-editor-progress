import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Upload, Send, X, Users, Hash, Tag } from 'lucide-react'
import { PageHeader } from '../components/layout'
import SearchableDropdown from '../components/SearchableDropdown'
import MultiSelectDropdown from '../components/MultiSelectDropdown'
import UpcomingDeadlines from '../components/UpcomingDeadlines'
import Toast from '../components/Toast'

// CONFIGURATION - UPDATE THIS WITH YOUR APPS SCRIPT WEB APP URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZpWsJEOFlOQkDA55JyjV1q6CkpO37VNbFi7bxrJsB2LeheFwSrDQHbm_oR5D1hl0TKQ/exec'

const DEFAULT_CLIENTS = [
    'Alex',
    'Allan',
    'Amanda',
    'Angelo',
    'Bashar',
    'Bryan',
    'Jordan',
    'Jorge',
    'Julia',
    'Kristin',
    'Michael',
    'Ryan',
    'Simon',
    'Wing',
    'Yannick',
    'Zheng',
    'Internal'
]

const DEFAULT_EDITORS = ['Zayn', 'Dadan', 'Faqih']
const DEFAULT_ILLUSTRATORS = ['Vanda', 'Rosdiana', 'Dayah']

function ProgressFormPage() {
    const userRole = localStorage.getItem('userRole') || 'video_editor'
    const isIllustrator = userRole === 'illustrator'
    const defaultList = isIllustrator ? DEFAULT_ILLUSTRATORS : DEFAULT_EDITORS
    const roleLabel = isIllustrator ? 'Illustrator' : 'Editor'
    const customStorageKey = isIllustrator ? 'customIllustrators' : 'customEditors'

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [toast, setToast] = useState(null)

    // Get custom editors from localStorage (filter out corrupted non-string entries)
    const [customEditors, setCustomEditors] = useState(() => {
        const saved = localStorage.getItem(customStorageKey)
        if (!saved) return []
        const parsed = JSON.parse(saved)
        const cleaned = Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : []
        if (cleaned.length !== parsed.length) localStorage.setItem(customStorageKey, JSON.stringify(cleaned))
        return cleaned
    })

    // Get custom clients from localStorage (filter out corrupted non-string entries)
    const [customClients, setCustomClients] = useState(() => {
        const saved = localStorage.getItem('customClients')
        if (!saved) return []
        const parsed = JSON.parse(saved)
        const cleaned = Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : []
        if (cleaned.length !== parsed.length) localStorage.setItem('customClients', JSON.stringify(cleaned))
        return cleaned
    })

    const editorList = [...defaultList, ...customEditors]
    const clientList = [...DEFAULT_CLIENTS, ...customClients]

    // Multi-client state: array of selected client names
    const [selectedClients, setSelectedClients] = useState([])
    // Per-client data: { clientName: { scenes: '', title: '' } }
    const [clientData, setClientData] = useState({})

    const [formData, setFormData] = useState({
        tanggal: new Date(),
        editor: '',
        comment: ''
    })

    // Multi-screenshot state: array of { file, preview, label }
    const [screenshots, setScreenshots] = useState([])
    const [sceneToast, setSceneToast] = useState(null)
    const [activeClientForTitle, setActiveClientForTitle] = useState(null)

    // Cache upcoming deadlines for autocomplete
    const [upcomingTitles, setUpcomingTitles] = useState([])
    useEffect(() => {
        try {
            const cached = localStorage.getItem('ewo_upcoming_deadlines')
            if (cached) {
                setUpcomingTitles(JSON.parse(cached))
            }
        } catch { }
    }, [])

    const getTitlesForClient = (clientName) => {
        if (!upcomingTitles.length) return []
        const titles = upcomingTitles
            .filter(p => !p.client || p.client.toLowerCase() === clientName.toLowerCase())
            .map(p => p.title)
        return [...new Set(titles)]
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleEditorChange = (value) => {
        handleChange('editor', value)
        if (value && !editorList.includes(value)) {
            const newCustomEditors = [...customEditors, value]
            setCustomEditors(newCustomEditors)
            localStorage.setItem(customStorageKey, JSON.stringify(newCustomEditors))
        }
    }

    const handleClientsChange = (newSelectedClients) => {
        setSelectedClients(newSelectedClients)

        // Add new clients to custom list if they don't exist
        newSelectedClients.forEach(client => {
            if (!clientList.includes(client)) {
                const newCustomClients = [...customClients, client]
                setCustomClients(newCustomClients)
                localStorage.setItem('customClients', JSON.stringify(newCustomClients))
            }
        })

        // Initialize clientData for newly added clients
        setClientData(prev => {
            const updated = { ...prev }
            newSelectedClients.forEach(client => {
                if (!updated[client]) {
                    updated[client] = { scenes: '', title: '' }
                }
            })
            // Clean up removed clients
            Object.keys(updated).forEach(key => {
                if (!newSelectedClients.includes(key)) {
                    delete updated[key]
                }
            })
            return updated
        })
    }

    const handleDeleteClient = (name) => {
        const newCustomClients = customClients.filter(c => c !== name)
        setCustomClients(newCustomClients)
        localStorage.setItem('customClients', JSON.stringify(newCustomClients))
        // Also remove from selected if it was selected
        if (selectedClients.includes(name)) {
            handleClientsChange(selectedClients.filter(c => c !== name))
        }
    }

    const handleDeleteEditor = (name) => {
        const newCustomEditors = customEditors.filter(e => e !== name)
        setCustomEditors(newCustomEditors)
        localStorage.setItem(customStorageKey, JSON.stringify(newCustomEditors))
        if (formData.editor === name) handleChange('editor', '')
    }

    const handleClientDataChange = (clientName, field, value) => {
        setClientData(prev => ({
            ...prev,
            [clientName]: {
                ...prev[clientName],
                [field]: value
            }
        }))

        // Show scene toast for fun messages
        if (field === 'scenes') {
            const totalScenes = getTotalScenes({ ...clientData, [clientName]: { ...clientData[clientName], [field]: value } })
            const message = getSceneMessage(totalScenes)
            if (message) {
                setSceneToast(message)
                setTimeout(() => setSceneToast(null), 2500)
            }
        }
    }

    const removeClient = (clientName) => {
        setSelectedClients(prev => prev.filter(c => c !== clientName))
        setClientData(prev => {
            const updated = { ...prev }
            delete updated[clientName]
            return updated
        })
    }

    const getSceneMessage = (count) => {
        const num = parseInt(count, 10)
        if (isNaN(num) || num <= 0) return null
        if (num >= 1 && num <= 10) return '😅 Njir dikit amat'
        if (num >= 11 && num <= 20) return '👍 Oke mayan lah'
        if (num >= 21 && num <= 35) return '🎉 Well done cik!'
        if (num >= 36 && num <= 50) return '🔥 GC banget si!'
        if (num >= 51 && num <= 80) return '💪 Ga sakit tah punggung?'
        if (num >= 81 && num <= 100) return '☕ Udh ngopi berapa gelas?'
        if (num >= 101) return '🚀 BUJUG! Deadliners!'
        return null
    }

    // Safe math expression evaluator (supports +, -, *, /)
    const evaluateExpression = (expr) => {
        if (!expr || typeof expr !== 'string') return 0
        const sanitized = expr.replace(/[^0-9+\-*/. ]/g, '').trim()
        if (!sanitized) return 0
        try {
            const result = Function('"use strict"; return (' + sanitized + ')')()
            return isNaN(result) || !isFinite(result) ? 0 : Math.round(result)
        } catch {
            return 0
        }
    }

    // Calculate total scenes across all clients
    const getTotalScenes = (data = clientData) => {
        return Object.values(data).reduce((sum, d) => {
            return sum + evaluateExpression(d.scenes)
        }, 0)
    }

    // Encode client string: "Alex (25), Ryan (25)"
    const encodeClientString = () => {
        return selectedClients
            .map(client => {
                const scenes = evaluateExpression(clientData[client]?.scenes) || 0
                return `${client} (${scenes})`
            })
            .join(', ')
    }

    // Encode title string: "Title 1, Title 2"
    const encodeTitleString = () => {
        return selectedClients
            .map(client => clientData[client]?.title || '')
            .filter(title => title.trim() !== '')
            .join(', ')
    }

    const addScreenshots = (files) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
        imageFiles.forEach(file => {
            const reader = new FileReader()
            reader.onloadend = () => {
                setScreenshots(prev => [...prev, { file, preview: reader.result, label: '' }])
            }
            reader.readAsDataURL(file)
        })
    }

    const handlePaste = (e) => {
        const items = e.clipboardData?.items
        if (items) {
            const files = []
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    files.push(items[i].getAsFile())
                }
            }
            if (files.length > 0) addScreenshots(files)
        }
    }

    const handleFileInput = (e) => {
        if (e.target.files?.length) {
            addScreenshots(e.target.files)
            e.target.value = '' // reset so same file can be re-selected
        }
    }

    const updateScreenshotLabel = (index, label) => {
        setScreenshots(prev => prev.map((s, i) => i === index ? { ...s, label } : s))
    }

    const removeScreenshot = (index) => {
        setScreenshots(prev => prev.filter((_, i) => i !== index))
    }

    const resetForm = () => {
        setFormData({
            tanggal: new Date(),
            editor: '',
            comment: ''
        })
        setSelectedClients([])
        setClientData({})
        setScreenshots([])
    }

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                const base64String = reader.result.split(',')[1]
                resolve({
                    base64: base64String,
                    filename: file.name,
                    mimeType: file.type
                })
            }
            reader.onerror = (error) => reject(error)
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setToast(null)

        const userRole = localStorage.getItem('userRole') || 'video_editor'
        localStorage.setItem('lastUsedEditor', formData.editor) // Save to grab for Attendance name

        try {
            // Convert all screenshots to base64 with labels
            let screenshotsData = []
            if (screenshots.length > 0) {
                screenshotsData = await Promise.all(
                    screenshots.map(async (s) => {
                        const data = await fileToBase64(s.file)
                        return {
                            base64: data.base64,
                            label: s.label.trim() || 'screenshot',
                            mimeType: data.mimeType
                        }
                    })
                )
            }

            const formatDate = (date) => {
                const d = new Date(date)
                return d.toISOString().split('T')[0]
            }

            // Encode frontend data into comma-separated strings
            const encodedKlien = encodeClientString()
            const encodedJudul = encodeTitleString()
            const totalScenes = getTotalScenes()

            const payload = {
                action: 'submitProgress',
                role: userRole,
                tanggal: formatDate(formData.tanggal),
                editor: formData.editor || '',
                judul: encodedJudul,
                klien: encodedKlien,
                jumlah_scene: totalScenes.toString(),
                comment: formData.comment || '',
                screenshots: screenshotsData
            }

            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                redirect: 'follow',
            })

            const result = await response.json()

            if (result.success) {
                const todayStr = new Date().toISOString().split('T')[0]
                localStorage.setItem('lastProgressDate', todayStr)

                // AUTO CLOCK-OUT: If the user is currently clocked in locally, clock them out!
                const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const attendanceDataStr = localStorage.getItem(`attendance_${dateStr}`)
                let autoClockOutSuccess = false

                if (attendanceDataStr) {
                    try {
                        const attendanceData = JSON.parse(attendanceDataStr)
                        if (attendanceData.isClockedIn && attendanceData.attendanceId) {
                            const now = new Date()
                            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

                            let computedDuration = '0.00'
                            if (attendanceData.clockInTime) {
                                const inTimeObj = new Date(attendanceData.clockInTime)
                                if (!isNaN(inTimeObj.getTime())) {
                                    const diff = (now.getTime() - inTimeObj.getTime()) / (1000 * 60 * 60)
                                    if (!isNaN(diff) && diff >= 0) computedDuration = diff.toFixed(2)
                                }
                            }

                            // Dispatch clock out to AppScript
                            await fetch(APPS_SCRIPT_URL, {
                                method: 'POST',
                                body: JSON.stringify({
                                    action: 'clockOut',
                                    attendanceId: attendanceData.attendanceId,
                                    role: userRole,
                                    time: timeStr,
                                    durationHrs: computedDuration
                                }),
                                redirect: 'follow'
                            })

                            // Mark as clocked out locally so they don't have to go back to the dashboard
                            localStorage.setItem(`attendance_${dateStr}`, JSON.stringify({
                                isClockedIn: false,
                                clockInTime: attendanceData.clockInTime,
                                clockOutTime: now
                            }))

                            autoClockOutSuccess = true
                        }
                    } catch (e) {
                        console.error('Auto clock-out error:', e)
                    }
                }

                if (autoClockOutSuccess) {
                    setToast({ type: 'success', message: 'Progress submitted & Automatically Clocked Out!' })
                } else {
                    setToast({ type: 'success', message: 'Progress submitted successfully!' })
                }

                setTimeout(resetForm, 1000)
            } else {
                throw new Error(result.data?.message || 'Submission failed')
            }
        } catch (error) {
            console.error('Submission error:', error)
            setToast({ type: 'error', message: error.message || 'Failed to submit. Please try again.' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const totalScenes = getTotalScenes()

    return (
        <>
            {/* Toast Notification */}
            {toast && (
                <div className="toast-container">
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                </div>
            )}

            <PageHeader
                title="Progress Form"
                description="Submit your daily editing progress"
            />

            <div className="progress-page-layout">
                <div className="progress-form-container">
                    <div className="card">
                        <form className="form" onSubmit={handleSubmit} onPaste={handlePaste}>
                            <div className="form-grid">
                                {/* Date Picker */}
                                <div className="form-group">
                                    <label htmlFor="tanggal">
                                        <Calendar size={16} />
                                        Date
                                    </label>
                                    <DatePicker
                                        id="tanggal"
                                        selected={formData.tanggal}
                                        onChange={(date) => handleChange('tanggal', date)}
                                        dateFormat="yyyy-MM-dd"
                                        className="input"
                                        required
                                    />
                                </div>

                                {/* Editor/Illustrator Name */}
                                <div className="form-group">
                                    <label htmlFor="editor">{roleLabel} Name</label>
                                    <SearchableDropdown
                                        value={formData.editor}
                                        onChange={handleEditorChange}
                                        options={editorList}
                                        placeholder={`Select or add ${roleLabel.toLowerCase()}`}
                                        allowCustom={true}
                                        customItems={customEditors}
                                        onDelete={handleDeleteEditor}
                                    />
                                </div>

                                {/* Client Multi-Select Dropdown */}
                                <div className="form-group full-width">
                                    <label htmlFor="klien">
                                        <Users size={16} />
                                        Client(s)
                                    </label>
                                    <MultiSelectDropdown
                                        selectedItems={selectedClients}
                                        onChange={handleClientsChange}
                                        options={clientList}
                                        placeholder="Select one or more clients"
                                        allowCustom={true}
                                        customItems={customClients}
                                        onDelete={handleDeleteClient}
                                    />
                                </div>

                                {/* Per-Client Inputs */}
                                {selectedClients.length > 0 && (
                                    <div className="form-group full-width">
                                        <div className="client-entries">
                                            <div className="client-entries-header">
                                                <span className="client-entries-title">
                                                    <Hash size={14} />
                                                    Scenes & Titles per Client
                                                </span>
                                                {totalScenes > 0 && (
                                                    <span className="total-scenes-badge">
                                                        Total: {totalScenes}
                                                    </span>
                                                )}
                                            </div>
                                            {selectedClients.map((client) => (
                                                <div key={client} className="client-row">
                                                    <span className="client-name-tag">{client}</span>
                                                    <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                                                        <SearchableDropdown
                                                            value={clientData[client]?.title || ''}
                                                            onChange={(val) => handleClientDataChange(client, 'title', val)}
                                                            options={getTitlesForClient(client)}
                                                            placeholder="Select Title..."
                                                            allowCustom={true}
                                                        />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="input client-input client-scenes-input"
                                                        value={clientData[client]?.scenes || ''}
                                                        onChange={(e) => handleClientDataChange(client, 'scenes', e.target.value)}
                                                        placeholder="0"
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="client-row-remove"
                                                        onClick={() => removeClient(client)}
                                                        aria-label={`Remove ${client}`}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        {sceneToast && <div className="scene-toast">{sceneToast}</div>}
                                    </div>
                                )}

                                {/* Comment */}
                                <div className="form-group full-width">
                                    <label htmlFor="comment">Comment</label>
                                    <textarea
                                        id="comment"
                                        className="input textarea"
                                        value={formData.comment}
                                        onChange={(e) => handleChange('comment', e.target.value)}
                                        placeholder="Add notes or comments"
                                        rows="2"
                                    />
                                </div>

                                {/* Screenshots Upload */}
                                <div className="form-group full-width">
                                    <label htmlFor="screenshot">
                                        <Upload size={16} />
                                        Screenshots
                                    </label>

                                    {/* Preview Grid */}
                                    {screenshots.length > 0 && (
                                        <div className="screenshots-grid">
                                            {screenshots.map((s, index) => (
                                                <div key={index} className="screenshot-card">
                                                    <div className="screenshot-preview">
                                                        <img src={s.preview} alt={`Screenshot ${index + 1}`} />
                                                        <button
                                                            type="button"
                                                            className="remove-btn"
                                                            onClick={() => removeScreenshot(index)}
                                                            aria-label="Remove screenshot"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="screenshot-label-row">
                                                        <Tag size={12} />
                                                        <input
                                                            type="text"
                                                            className="input screenshot-label-input"
                                                            placeholder="Label this screenshot *"
                                                            value={s.label}
                                                            onChange={(e) => updateScreenshotLabel(index, e.target.value)}
                                                            required
                                                            style={!s.label.trim() ? { borderBottom: '2px solid var(--error)', borderRadius: 0 } : {}}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload Area (always visible) */}
                                    <div className="upload-area">
                                        <input
                                            id="screenshot"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileInput}
                                            style={{ display: 'none' }}
                                        />
                                        <label htmlFor="screenshot" className="upload-label">
                                            <Upload size={28} />
                                            <p>{screenshots.length > 0 ? 'Add more screenshots' : 'Click to upload or paste (Ctrl+V)'}</p>
                                            <span>PNG, JPG, GIF — Multiple files supported</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={isSubmitting || !formData.editor || selectedClients.length === 0 || screenshots.some(s => !s.label.trim()) || selectedClients.some(c => !clientData[c]?.scenes?.trim())}
                                title={screenshots.some(s => !s.label.trim()) ? 'Berikan label pada Screenshoot' : (selectedClients.some(c => !clientData[c]?.scenes?.trim()) ? 'Jumlah scene harus diisi untuk semua klien' : '')}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="spinner" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Submit Progress
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <UpcomingDeadlines />
            </div>
        </>
    )
}

export default ProgressFormPage
