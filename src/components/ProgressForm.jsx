import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, Upload, Send, X, CheckCircle, AlertCircle } from 'lucide-react'
import SearchableDropdown from './SearchableDropdown'

const CLIENT_LIST = [
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
    'Zheng'
]

const DEFAULT_EDITORS = ['Zayn', 'Dadan', 'Faqih']

function ProgressForm({ onSubmit, isSubmitting }) {
    // Get custom editors from localStorage
    const [customEditors, setCustomEditors] = useState(() => {
        const saved = localStorage.getItem('customEditors')
        return saved ? JSON.parse(saved) : []
    })

    // Combined editor list
    const editorList = [...DEFAULT_EDITORS, ...customEditors]

    const [formData, setFormData] = useState({
        tanggal: new Date(),
        editor: '',
        judul: '',
        klien: '',
        jumlah_scene: '',
        comment: '',
        screenshot: null
    })

    const [screenshotPreview, setScreenshotPreview] = useState(null)

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Handle adding custom editor
    const handleEditorChange = (value) => {
        handleChange('editor', value)

        // If it's a new name not in the list, save to localStorage
        if (value && !editorList.includes(value)) {
            const newCustomEditors = [...customEditors, value]
            setCustomEditors(newCustomEditors)
            localStorage.setItem('customEditors', JSON.stringify(newCustomEditors))
        }
    }

    // Fun scale messages for scene count
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

    const [sceneToast, setSceneToast] = useState(null)

    const handleSceneChange = (value) => {
        handleChange('jumlah_scene', value)

        const message = getSceneMessage(value)
        if (message) {
            setSceneToast(message)
            setTimeout(() => setSceneToast(null), 2500)
        }
    }

    const handleScreenshotChange = (file) => {
        if (file && file.type.startsWith('image/')) {
            setFormData(prev => ({ ...prev, screenshot: file }))

            // Create preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setScreenshotPreview(reader.result)
            }
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
        if (file) {
            handleScreenshotChange(file)
        }
    }

    const removeScreenshot = () => {
        setFormData(prev => ({ ...prev, screenshot: null }))
        setScreenshotPreview(null)
    }

    const resetForm = () => {
        setFormData({
            tanggal: new Date(),
            editor: '',
            judul: '',
            klien: '',
            jumlah_scene: '',
            comment: '',
            screenshot: null
        })
        setScreenshotPreview(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Format date as YYYY-MM-DD
        const formattedData = {
            ...formData,
            tanggal: formData.tanggal.toISOString().split('T')[0]
        }

        const success = await onSubmit(formattedData)

        // Reset form on successful submission
        if (success) {
            setTimeout(resetForm, 1000)
        }
    }

    return (
        <form className="form" onSubmit={handleSubmit} onPaste={handlePaste}>
            {/* Two Column Grid */}
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
                    />
                </div>

                {/* Client Dropdown */}
                <div className="form-group">
                    <label htmlFor="klien">Client</label>
                    <SearchableDropdown
                        value={formData.klien}
                        onChange={(value) => handleChange('klien', value)}
                        options={CLIENT_LIST}
                        placeholder="Select client"
                        label="Client"
                    />
                </div>

                {/* Scene Count */}
                <div className="form-group">
                    <label htmlFor="jumlah_scene">Number of Scenes</label>
                    <input
                        id="jumlah_scene"
                        type="number"
                        className="input"
                        value={formData.jumlah_scene}
                        onChange={(e) => handleSceneChange(e.target.value)}
                        placeholder="0"
                        min="0"
                        required
                    />
                    {sceneToast && (
                        <div className="scene-toast">{sceneToast}</div>
                    )}
                </div>

                {/* Project Title */}
                <div className="form-group full-width">
                    <label htmlFor="judul">Project Title</label>
                    <input
                        id="judul"
                        type="text"
                        className="input"
                        value={formData.judul}
                        onChange={(e) => handleChange('judul', e.target.value)}
                        placeholder="Project title"
                        required
                    />
                </div>

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
                disabled={isSubmitting}
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
    )
}

export default ProgressForm
