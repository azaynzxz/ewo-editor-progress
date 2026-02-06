import { useState } from 'react'
import ProgressForm from './components/ProgressForm'
import Toast from './components/Toast'

// CONFIGURATION - UPDATE THIS WITH YOUR APPS SCRIPT WEB APP URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwyVSu5z5B_jKx8qjFLkS9pDjMbc2SHf8IY53JY5zG4s934-QWgjNLMRx3-zRYNVJ-F/exec'

function App() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [toast, setToast] = useState(null)

    const handleSubmit = async (formData) => {
        setIsSubmitting(true)
        setToast(null)

        try {
            // Convert screenshot file to base64 if present
            let screenshotData = null
            if (formData.screenshot) {
                screenshotData = await fileToBase64(formData.screenshot)
            }

            // Prepare payload for Apps Script
            const formatDate = (date) => {
                const d = new Date(date)
                return d.toISOString().split('T')[0] // YYYY-MM-DD format
            }

            const payload = {
                tanggal: formatDate(formData.tanggal),
                editor: formData.editor || '',
                judul: formData.judul || '',
                klien: formData.klien || '',
                jumlah_scene: formData.jumlah_scene || '',
                comment: formData.comment || '',
                screenshot: screenshotData
            }

            // Send to Apps Script (using text/plain to avoid CORS preflight)
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                redirect: 'follow',
            })

            const result = await response.json()

            if (result.success) {
                setToast({
                    type: 'success',
                    message: 'Progress submitted successfully!'
                })
                return true // Signal success to form for reset
            } else {
                throw new Error(result.data?.message || 'Submission failed')
            }
        } catch (error) {
            console.error('Submission error:', error)
            setToast({
                type: 'error',
                message: error.message || 'Failed to submit. Please try again.'
            })
            return false
        } finally {
            setIsSubmitting(false)
        }
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

    return (
        <div className="app">
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

            <div className="container">
                <header className="header">
                    <img src="/logo.jpg" alt="EWO Logo" className="header-logo" />
                    <h1>Progress Editor Form</h1>
                    <p>Submit your daily progress report</p>
                </header>

                <ProgressForm
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </div>
        </div>
    )
}

export default App
