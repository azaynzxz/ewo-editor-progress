import { useState, useEffect, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, CalendarRange, Send, FileText, Info, AlertCircle } from 'lucide-react'
import { PageHeader } from '../components/layout'
import Toast from '../components/Toast'
import SearchableDropdown from '../components/SearchableDropdown'

// CONFIGURATION - UPDATE THIS WITH YOUR APPS SCRIPT WEB APP URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZpWsJEOFlOQkDA55JyjV1q6CkpO37VNbFi7bxrJsB2LeheFwSrDQHbm_oR5D1hl0TKQ/exec'

const ALASAN_OPTIONS = [
    { value: 'Cuti Sakit', label: 'Cuti Sakit' },
    { value: 'Cuti Menikah', label: 'Cuti Menikah' },
    { value: 'Cuti Melahirkan', label: 'Cuti Melahirkan' },
    { value: 'Cuti Keluarga', label: 'Cuti Keluarga', tooltip: 'misalnya orang tua/anak sakit' },
    { value: 'Cuti Liburan/Pribadi', label: 'Cuti Liburan/Pribadi' },
    { value: 'Cuti Kedukaan', label: 'Cuti Kedukaan', tooltip: 'kematian anggota keluarga' },
    { value: 'Cuti Pendidikan/Pelatihan', label: 'Cuti Pendidikan/Pelatihan' },
    { value: 'Cuti Ibadah', label: 'Cuti Ibadah', tooltip: 'misalnya haji/umrah' },
    { value: 'Cuti Darurat', label: 'Cuti Darurat', tooltip: 'misalnya bencana, kecelakaan' },
    { value: 'Cuti Lainnya', label: 'Cuti Lainnya' }
]

function LeaveFormPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [toast, setToast] = useState(null)
    const userName = localStorage.getItem('lastUsedEditor') || localStorage.getItem('userName') || ''
    const userRole = localStorage.getItem('userRole') || 'video_editor'

    const [formData, setFormData] = useState({
        startDate: new Date(),
        endDate: new Date(),
        alasan: '',
        notes: ''
    })

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Auto-calculate duration (Days)
    const durationDays = useMemo(() => {
        if (!formData.startDate || !formData.endDate) return 0
        const start = new Date(formData.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(formData.endDate)
        end.setHours(0, 0, 0, 0)

        const diffTime = end.getTime() - start.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        return diffDays >= 0 ? diffDays + 1 : 0
    }, [formData.startDate, formData.endDate])

    const resetForm = () => {
        setFormData({
            startDate: new Date(),
            endDate: new Date(),
            alasan: '',
            notes: ''
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (durationDays <= 0) {
            setToast({ type: 'error', message: 'Tanggal berakhir harus sama atau setelah tanggal mulai.' })
            return
        }

        if (!userName) {
            setToast({ type: 'error', message: 'Nama tidak ditemukan. Harap pastikan login atau submit Progress Form sebelumnya.' })
            return
        }

        setIsSubmitting(true)
        setToast(null)

        try {
            const formatDate = (date) => {
                const d = new Date(date)
                return d.toISOString().split('T')[0]
            }

            const today = formatDate(new Date())

            const payload = {
                action: 'submitLeave',
                tanggal: today,
                nama: userName,
                role: userRole,
                start: formatDate(formData.startDate),
                end: formatDate(formData.endDate),
                duration: durationDays,
                alasan: formData.alasan,
                notes: formData.notes
            }

            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                redirect: 'follow',
            })

            const result = await response.json()

            if (result.success) {
                setToast({ type: 'success', message: 'Pengajuan cuti berhasil dikirim!' })
                setTimeout(resetForm, 1500)
            } else {
                throw new Error(result.data?.message || 'Gagal mengirim pengajuan')
            }
        } catch (error) {
            console.error('Submission error:', error)
            setToast({ type: 'error', message: error.message || 'Gagal mengirim pengajuan. Silakan coba lagi.' })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
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
                title="Pengajuan Cuti"
                description="Submit your leave request"
            />

            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-6)' }}>
                <div className="progress-form-container" style={{ maxWidth: '800px', width: '100%' }}>
                    <div className="card">
                        {userName ? (
                            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '2px', fontWeight: '500' }}>Mengajukan sebagai:</span>
                                    <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--gray-900)' }}>{userName}</span>
                                </div>
                                <span style={{ padding: '6px 14px', backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600', textTransform: 'capitalize' }}>
                                    {userRole.replace('_', ' ')}
                                </span>
                            </div>
                        ) : (
                            <div style={{ padding: '16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={20} />
                                <span>Nama tidak ditemukan. Harap pastikan login atau submit Progress Form sebelumnya.</span>
                            </div>
                        )}
                        <form className="form" onSubmit={handleSubmit}>
                            <div className="form-grid">

                                {/* Start Date Box */}
                                <div className="form-group">
                                    <label htmlFor="startDate">
                                        <Calendar size={16} />
                                        Tanggal Mulai
                                    </label>
                                    <DatePicker
                                        id="startDate"
                                        selected={formData.startDate}
                                        onChange={(date) => handleChange('startDate', date)}
                                        dateFormat="yyyy-MM-dd"
                                        className="input"
                                        required
                                    />
                                </div>

                                {/* End Date Box */}
                                <div className="form-group">
                                    <label htmlFor="endDate">
                                        <CalendarRange size={16} />
                                        Tanggal Berakhir
                                    </label>
                                    <DatePicker
                                        id="endDate"
                                        selected={formData.endDate}
                                        onChange={(date) => handleChange('endDate', date)}
                                        dateFormat="yyyy-MM-dd"
                                        minDate={formData.startDate}
                                        className="input"
                                        required
                                    />
                                </div>

                                {/* Auto-calculated duration UI display */}
                                <div className="form-group full-width">
                                    <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: '500', color: '#475569' }}>Total Durasi:</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                            {durationDays} Hari
                                        </span>
                                    </div>
                                </div>

                                {/* Alasan Dropdown */}
                                <div className="form-group full-width">
                                    <label>
                                        <Info size={16} />
                                        Alasan
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                        {ALASAN_OPTIONS.map((opt) => {
                                            const isSelected = formData.alasan === opt.value
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    title={opt.tooltip || opt.label}
                                                    onClick={() => handleChange('alasan', opt.value)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '9999px',
                                                        border: `1px solid ${isSelected ? '#7dd3fc' : '#cbd5e1'}`,
                                                        backgroundColor: isSelected ? '#bae6fd' : '#ffffff',
                                                        color: isSelected ? '#0369a1' : '#334155',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '500',
                                                        fontFamily: 'inherit',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    {opt.label}
                                                    {opt.tooltip && (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '16px',
                                                            height: '16px',
                                                            borderRadius: '50%',
                                                            fontSize: '0.65rem',
                                                            backgroundColor: isSelected ? 'rgba(3,105,161,0.1)' : '#e2e8f0',
                                                            color: isSelected ? '#0369a1' : '#64748b'
                                                        }}>?</span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Notes Input */}
                                <div className="form-group full-width">
                                    <label htmlFor="notes">
                                        <FileText size={16} />
                                        Catatan
                                    </label>
                                    <textarea
                                        id="notes"
                                        className="input textarea"
                                        value={formData.notes}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        placeholder="Tambahkan catatan tambahan jika diperlukan..."
                                        rows="3"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={isSubmitting || durationDays <= 0 || !formData.alasan || !userName}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="spinner" />
                                        Mengirim...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Kirim Pengajuan
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

export default LeaveFormPage
