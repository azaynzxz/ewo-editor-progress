import { useState, useEffect, useMemo } from 'react'
import HolidayDatePicker from '../components/HolidayDatePicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, CalendarRange, Send, FileText, Info, AlertCircle, User, Clock, Hash } from 'lucide-react'
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
    const [holidays, setHolidays] = useState({})

    const userName = localStorage.getItem('lastUsedEditor') || localStorage.getItem('userName') || ''
    const userRole = localStorage.getItem('userRole') || 'video_editor'

    const [formData, setFormData] = useState({
        startDate: new Date(),
        endDate: new Date(),
        alasan: '',
        notes: ''
    })

    const handleDateChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Fetch National Holidays
    useEffect(() => {
        const fetchHolidays = async () => {
            const year = new Date().getFullYear()
            try {
                // Fetch this year and next year to safely cover December-January overlaps
                const [res1, res2] = await Promise.all([
                    fetch(`https://libur.deno.dev/api?year=${year}`),
                    fetch(`https://libur.deno.dev/api?year=${year + 1}`)
                ])
                const d1 = await res1.json()
                const d2 = await res2.json()

                const holMap = {}
                    ;[...d1, ...d2].forEach(h => {
                        if (h.date) holMap[h.date] = h.name
                    })
                setHolidays(holMap)
            } catch (e) {
                console.error("Failed to fetch holidays", e)
            }
        }
        fetchHolidays()
    }, [])

    // Timezone safe YYYY-MM-DD
    const toLocalYYYYMMDD = (d) => {
        const offset = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
        return offset.toISOString().split('T')[0]
    }

    // Auto-calculate logic (Ignore Sundays & National Holidays)
    const { durationDays, returnDateStr, ignoredDaysNames } = useMemo(() => {
        if (!formData.startDate || !formData.endDate) return { durationDays: 0, returnDateStr: '', ignoredDaysNames: [] }

        const start = new Date(formData.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(formData.endDate)
        end.setHours(0, 0, 0, 0)

        if (end < start) {
            return { durationDays: 0, returnDateStr: '-', ignoredDaysNames: [] }
        }

        let current = new Date(start)
        let totalCount = 0
        let ignoredLog = []

        while (current <= end) {
            const dayOfWeek = current.getDay() // 0 = Sunday
            const dateStr = toLocalYYYYMMDD(current)

            if (dayOfWeek === 0) {
                // Ignore purely because it is Sunday (Weekend)
                if (!ignoredLog.includes('Minggu (Hari Libur)')) ignoredLog.push('Minggu (Hari Libur)')
            } else if (holidays[dateStr]) {
                // Ignore because it's a National Holiday
                const holName = holidays[dateStr]
                if (!ignoredLog.includes(holName)) ignoredLog.push(holName)
            } else {
                totalCount++
            }

            current.setDate(current.getDate() + 1)
        }

        // Determine Return Date
        let returnD = new Date(end)
        returnD.setDate(returnD.getDate() + 1) // strictly day after end date

        while (true) {
            const rDateStr = toLocalYYYYMMDD(returnD)
            if (returnD.getDay() === 0 || holidays[rDateStr]) {
                // If return date is Sunday or Holiday, push exactly 1 more day recursively
                returnD.setDate(returnD.getDate() + 1)
            } else {
                break
            }
        }

        // Format strings properly for Bahasa Indonesia
        const daysId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
        const monthsId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']

        const finalReturnStr = `${daysId[returnD.getDay()]}, ${returnD.getDate()} ${monthsId[returnD.getMonth()]} ${returnD.getFullYear()}`

        return {
            durationDays: totalCount,
            returnDateStr: finalReturnStr,
            ignoredDaysNames: ignoredLog
        }
    }, [formData.startDate, formData.endDate, holidays])

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

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="progress-form-container" style={{ maxWidth: '900px', width: '100%' }}>
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

                                {/* Unified Horizontal Date & Metrics Row */}
                                <div className="form-group full-width" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', marginBottom: '16px' }}>

                                    {/* Start Date Box */}
                                    <div style={{ flex: '1 1 180px' }}>
                                        <label htmlFor="startDate" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500', color: '#475569' }}>
                                            <Calendar size={16} color="var(--primary, #4f46e5)" />
                                            Tanggal Mulai
                                        </label>
                                        <HolidayDatePicker
                                            holidays={holidays}
                                            selected={formData.startDate ? new Date(formData.startDate) : null}
                                            onChange={(date) => handleDateChange('startDate', date)}
                                            placeholderText="Pilih Tanggal Mulai"
                                            className="input"
                                        />
                                    </div>

                                    {/* End Date Box */}
                                    <div style={{ flex: '1 1 180px' }}>
                                        <label htmlFor="endDate" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '500', color: '#475569' }}>
                                            <CalendarRange size={16} color="var(--primary, #4f46e5)" />
                                            Tanggal Berakhir
                                        </label>
                                        <HolidayDatePicker
                                            holidays={holidays}
                                            selected={formData.endDate ? new Date(formData.endDate) : null}
                                            onChange={(date) => handleDateChange('endDate', date)}
                                            placeholderText="Pilih Tanggal Berakhir"
                                            className="input"
                                        />
                                    </div>

                                    {/* Metrics UI Box */}
                                    <div style={{ flex: '2 1 360px', display: 'flex', alignItems: 'center', gap: '24px', padding: '0 20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                        <div style={{ padding: '8px 0' }}>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Potong Cuti</div>
                                            <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary, #4f46e5)', lineHeight: '1' }}>{durationDays} Hari</div>
                                        </div>
                                        <div style={{ flex: 1, padding: '8px 0 8px 24px', borderLeft: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Kembali Bekerja</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', lineHeight: '1' }}>
                                                <Calendar size={14} color="#059669" />
                                                <span style={{ whiteSpace: 'nowrap' }}>{returnDateStr}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {ignoredDaysNames.length > 0 && (
                                    <div className="form-group full-width" style={{ marginTop: '-8px', marginBottom: '16px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#b45309', display: 'flex', gap: '6px' }}>
                                            <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                                            <span style={{ fontStyle: 'italic' }}>
                                                <strong>Tidak dihitung cuti: </strong>{ignoredDaysNames.join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                )}

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
