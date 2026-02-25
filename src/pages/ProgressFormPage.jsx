import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Upload, Send, X, Users, Hash } from 'lucide-react'
import { PageHeader } from '../components/layout'
import SearchableDropdown from '../components/SearchableDropdown'
import MultiSelectDropdown from '../components/MultiSelectDropdown'
import UpcomingDeadlines from '../components/UpcomingDeadlines'
import Toast from '../components/Toast'

// CONFIGURATION - UPDATE THIS WITH YOUR APPS SCRIPT WEB APP URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyVSu5z5B_jKx8qjFLkS9pDjMbc2SHf8IY53JY5zG4s934-QWgjNLMRx3-zRYNVJ-F/exec'

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

function ProgressFormPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [toast, setToast] = useState(null)

    // Get custom editors from localStorage (filter out corrupted non-string entries)
    const [customEditors, setCustomEditors] = useState(() => {
        const saved = localStorage.getItem('customEditors')
        if (!saved) return []
        const parsed = JSON.parse(saved)
        const cleaned = Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : []
        if (cleaned.length !== parsed.length) localStorage.setItem('customEditors', JSON.stringify(cleaned))
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

    const editorList = [...DEFAULT_EDITORS, ...customEditors]
    const clientList = [...DEFAULT_CLIENTS, ...customClients]

    // Multi-client state: array of selected client names
    const [selectedClients, setSelectedClients] = useState([])
    // Per-client data: { clientName: { scenes: '', title: '' } }
    const [clientData, setClientData] = useState({})

    const [formData, setFormData] = useState({
        tanggal: new Date(),
        editor: '',
        comment: '',
        screenshot: null
    })

    const [screenshotPreview, setScreenshotPreview] = useState(null)
    const [sceneToast, setSceneToast] = useState(null)
    const [activeClientForTitle, setActiveClientForTitle] = useState(null)

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleEditorChange = (value) => {
        handleChange('editor', value)
        if (value && !editorList.includes(value)) {
            const newCustomEditors = [...customEditors, value]
            setCustomEditors(newCustomEditors)
            localStorage.setItem('customEditors', JSON.stringify(newCustomEditors))
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
        localStorage.setItem('customEditors', JSON.stringify(newCustomEditors))
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

    // Calculate total scenes across all clients
    const getTotalScenes = (data = clientData) => {
        return Object.values(data).reduce((sum, d) => {
            const num = parseInt(d.scenes, 10)
            return sum + (isNaN(num) ? 0 : num)
        }, 0)
    }

    // Encode client string: "Alex (25), Ryan (25)"
    const encodeClientString = () => {
        return selectedClients
            .map(client => {
                const scenes = clientData[client]?.scenes || '0'
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

    const handleScreenshotChange = (file) => {
        if (file && file.type.startsWith('image/')) {
            setFormData(prev => ({ ...prev, screenshot: file }))
            const reader = new FileReader()
            reader.onloadend = () => setScreenshotPreview(reader.result)
            reader.readAsDataURL(file)
        }
    }

    const handlePaste = (e) => {
        const items = e.clipboardData?.items
        if (items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile()
                    handleScreenshotChange(file)
                    break
                }
            }
        }
    }

    const handleFileInput = (e) => {
        const file = e.target.files?.[0]
        if (file) handleScreenshotChange(file)
    }

    const removeScreenshot = () => {
        setFormData(prev => ({ ...prev, screenshot: null }))
        setScreenshotPreview(null)
    }

    const resetForm = () => {
        setFormData({
            tanggal: new Date(),
            editor: '',
            comment: '',
            screenshot: null
        })
        setSelectedClients([])
        setClientData({})
        setScreenshotPreview(null)
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

        try {
            let screenshotData = null
            if (formData.screenshot) {
                screenshotData = await fileToBase64(formData.screenshot)
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
                tanggal: formatDate(formData.tanggal),
                editor: formData.editor || '',
                judul: encodedJudul,
                klien: encodedKlien,
                jumlah_scene: totalScenes.toString(),
                comment: formData.comment || '',
                screenshot: screenshotData
            }

            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                redirect: 'follow',
            })

            const result = await response.json()

            if (result.success) {
                setToast({ type: 'success', message: 'Progress submitted successfully!' })
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

                                {/* Editor Name */}
                                <div className="form-group">
                                    <label htmlFor="editor">Editor Name</label>
                                    <SearchableDropdown
                                        value={formData.editor}
                                        onChange={handleEditorChange}
                                        options={editorList}
                                        placeholder="Select or add editor"
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
                                                    <input
                                                        type="text"
                                                        className="input client-input"
                                                        value={clientData[client]?.title || ''}
                                                        onChange={(e) => handleClientDataChange(client, 'title', e.target.value)}
                                                        onFocus={() => setActiveClientForTitle(client)}
                                                        placeholder="Title"
                                                    />
                                                    <input
                                                        type="number"
                                                        className="input client-input client-scenes-input"
                                                        value={clientData[client]?.scenes || ''}
                                                        onChange={(e) => handleClientDataChange(client, 'scenes', e.target.value)}
                                                        placeholder="0"
                                                        min="0"
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

                                {/* Screenshot Upload */}
                                <div className="form-group full-width">
                                    <label htmlFor="screenshot">
                                        <Upload size={16} />
                                        Screenshot
                                    </label>

                                    {!screenshotPreview ? (
                                        <div className="upload-area">
                                            <input
                                                id="screenshot"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileInput}
                                                style={{ display: 'none' }}
                                            />
                                            <label htmlFor="screenshot" className="upload-label">
                                                <Upload size={28} />
                                                <p>Click to upload or paste (Ctrl+V)</p>
                                                <span>PNG, JPG, GIF</span>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="screenshot-preview">
                                            <img src={screenshotPreview} alt="Screenshot preview" />
                                            <button
                                                type="button"
                                                className="remove-btn"
                                                onClick={removeScreenshot}
                                                aria-label="Remove screenshot"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={isSubmitting || !formData.editor || selectedClients.length === 0}
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
