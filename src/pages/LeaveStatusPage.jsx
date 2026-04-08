import { useState, useEffect } from 'react'
import { ClipboardList, Clock, CheckCircle2, XCircle, AlertCircle, Calendar, RefreshCw, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader } from '../components/layout'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZpWsJEOFlOQkDA55JyjV1q6CkpO37VNbFi7bxrJsB2LeheFwSrDQHbm_oR5D1hl0TKQ/exec'

function LeaveStatusPage() {
    const userName = localStorage.getItem('lastUsedEditor') || localStorage.getItem('userName') || ''
    const [requests, setRequests] = useState(() => {
        const stored = localStorage.getItem('leaveStatusCache_' + userName)
        if (stored) {
            try { return JSON.parse(stored) } catch (e) { return [] }
        }
        return []
    })
    const [isLoading, setIsLoading] = useState(requests.length === 0)
    const [error, setError] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState(null)

    const fetchStatus = async (forceRefresh = false) => {
        if (!userName) {
            setError("Nama tidak ditemukan. Silakan isi form progress setidaknya sekali untuk menyimpan nama Anda.")
            setIsLoading(false)
            return
        }

        if (forceRefresh || requests.length === 0) {
            setIsLoading(true)
        }
        setError(null)

        try {
            const url = `${APPS_SCRIPT_URL}?action=getLeaveStatus&name=${encodeURIComponent(userName)}`
            const response = await fetch(url)
            const result = await response.json()

            if (result.success) {
                const freshData = result.data?.requests || []
                setRequests(freshData)
                localStorage.setItem('leaveStatusCache_' + userName, JSON.stringify(freshData))
            } else {
                throw new Error(result.data?.message || 'Gagal memuat status pengajuan')
            }
        } catch (err) {
            if (forceRefresh || requests.length === 0) {
                setError(err.message || 'Terjadi kesalahan jaringan saat memuat data')
            }
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus(false)
    }, [userName])

    const executeDelete = async (id) => {
        setDeletingId(id)
        setDeleteConfirmId(null)
        try {
            const payload = { action: 'deleteLeave', id: id }
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                redirect: 'follow'
            })
            const result = await response.json()

            if (result.success) {
                const updatedRequests = requests.filter(req => req.id !== id)
                setRequests(updatedRequests)
                localStorage.setItem('leaveStatusCache_' + userName, JSON.stringify(updatedRequests))
            } else {
                throw new Error(result.data?.message || 'Gagal menghapus pengajuan')
            }
        } catch (err) {
            setError(err.message || 'Error menghapus data')
        } finally {
            setDeletingId(null)
        }
    }

    const getStatusConfig = (status) => {
        const s = status?.toString().toLowerCase().trim()
        if (s === 'approved' || s === 'disetujui' || s === 'ya') {
            return { color: '#059669', bg: '#d1fae5', icon: CheckCircle2, label: 'Disetujui' }
        }
        if (s === 'rejected' || s === 'ditolak' || s === 'tidak') {
            return { color: '#dc2626', bg: '#fee2e2', icon: XCircle, label: 'Ditolak' }
        }
        return { color: '#d97706', bg: '#fef3c7', icon: Clock, label: status || 'Pending' }
    }

    return (
        <>
            <PageHeader
                title="Status Cuti"
                description="Lihat status persetujuan dari seluruh pengajuan cuti Anda"
            />

            <div style={{ padding: 'var(--space-6)', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px' }}>
                    <button
                        onClick={() => fetchStatus(true)}
                        disabled={isLoading}
                        className="submit-btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', width: 'auto', marginTop: '0' }}
                    >
                        <RefreshCw size={16} className={isLoading ? 'rotate' : ''} />
                        Refresh
                    </button>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 40px', color: '#64748b' }}>
                        <div className="spinner" style={{ borderTopColor: 'var(--primary, #4f46e5)', width: '36px', height: '36px', margin: '0 auto 16px' }} />
                        <p style={{ fontWeight: '500' }}>Memuat status persetujuan...</p>
                    </div>
                ) : error ? (
                    <div style={{ padding: '16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #fecaca' }}>
                        <AlertCircle size={20} />
                        <span style={{ fontWeight: '500' }}>{error}</span>
                    </div>
                ) : requests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 40px', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        <ClipboardList size={48} color="#94a3b8" style={{ margin: '0 auto 16px', opacity: '0.5' }} />
                        <h3 style={{ margin: '0 0 8px', color: '#334155', fontSize: '1.1rem' }}>Belum ada pengajuan cuti</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto' }}>Setiap pengajuan cuti yang Anda buat akan muncul di sini secara otomatis beserta status persetujuannya.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '16px' }}>
                        {requests.map((req, idx) => {
                            const config = getStatusConfig(req.status)
                            const StatusIcon = config.icon
                            return (
                                <div key={idx} style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', backgroundColor: config.bg === '#d1fae5' ? '#059669' : config.bg === '#fee2e2' ? '#dc2626' : '#d97706' }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', fontWeight: '500' }}>
                                                ID: {req.id} <span style={{ opacity: 0.5, margin: '0 4px' }}>|</span> {req.tanggal}
                                            </div>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>{req.alasan}</h3>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <div style={{ padding: '4px 12px', borderRadius: '9999px', background: config.bg, color: config.color, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <StatusIcon size={14} />
                                                {config.label}
                                            </div>
                                            <button
                                                onClick={() => setDeleteConfirmId(req.id)}
                                                disabled={deletingId === req.id}
                                                title="Batalkan / Hapus Pengajuan"
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'transparent',
                                                    border: '1px solid #fecaca', color: '#ef4444',
                                                    borderRadius: '50%', width: '28px', height: '28px',
                                                    cursor: deletingId === req.id ? 'wait' : 'pointer',
                                                    transition: 'all 0.2s', padding: 0,
                                                    opacity: deletingId === req.id ? 0.5 : 1
                                                }}
                                            >
                                                {deletingId === req.id ? <div className="spinner" style={{ width: '12px', height: '12px', borderTopColor: '#ef4444', margin: 0 }} /> : <Trash2 size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                        <div style={{ flex: '1 1 30%' }}>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '4px', letterSpacing: '0.5px' }}>Dari</div>
                                            <div style={{ color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                                                <Calendar size={12} color="#94a3b8" />
                                                {req.start}
                                            </div>
                                        </div>
                                        <div style={{ flex: '1 1 30%' }}>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '4px', letterSpacing: '0.5px' }}>Sampai</div>
                                            <div style={{ color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                                                <Calendar size={12} color="#94a3b8" />
                                                {req.end}
                                            </div>
                                        </div>
                                        <div style={{ flex: '1 1 20%' }}>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '4px', letterSpacing: '0.5px' }}>Durasi</div>
                                            <div style={{ color: '#334155', fontWeight: '600', fontSize: '0.85rem' }}>{req.duration} Hari</div>
                                        </div>

                                        {req.notes && (
                                            <div style={{ width: '100%', marginTop: '0', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '4px', letterSpacing: '0.5px' }}>Catatan Anda</div>
                                                <div style={{ color: '#475569', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: '1.4' }}>"{req.notes}"</div>
                                            </div>
                                        )}

                                        {req.message && (
                                            <div style={{ width: '100%', marginTop: '0', padding: '12px', background: req.status.toLowerCase().includes('reject') || req.status.toLowerCase().includes('tolak') ? '#fef2f2' : req.status.toLowerCase().includes('approve') || req.status.toLowerCase().includes('setuju') ? '#f0fdf4' : '#f8fafc', border: `1px solid ${req.status.toLowerCase().includes('reject') || req.status.toLowerCase().includes('tolak') ? '#fecaca' : req.status.toLowerCase().includes('approve') || req.status.toLowerCase().includes('setuju') ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '6px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', textTransform: 'uppercase', color: req.status.toLowerCase().includes('reject') || req.status.toLowerCase().includes('tolak') ? '#b91c1c' : req.status.toLowerCase().includes('approve') || req.status.toLowerCase().includes('setuju') ? '#15803d' : '#475569', fontWeight: '800', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                                    <ClipboardList size={12} />
                                                    Pesan dari Officer
                                                </div>
                                                <div style={{ color: req.status.toLowerCase().includes('reject') || req.status.toLowerCase().includes('tolak') ? '#991b1b' : req.status.toLowerCase().includes('approve') || req.status.toLowerCase().includes('setuju') ? '#166534' : '#334155', fontSize: '0.85rem', fontWeight: '500', lineHeight: '1.4' }}>"{req.message}"</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Custom Modern Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(2px)', padding: '20px' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                        >
                            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                <AlertCircle size={28} color="#dc2626" />
                            </div>
                            <h3 style={{ margin: '0 0 12px', fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>Hapus Pengajuan Cuti?</h3>
                            <p style={{ margin: '0 0 28px', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                Apakah Anda yakin ingin membatalkan dan menghapus pengajuan cuti ini secara permanen? <strong>Tindakan ini tidak dapat dibatalkan.</strong>
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    style={{ padding: '10px 18px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => executeDelete(deleteConfirmId)}
                                    style={{ padding: '10px 18px', background: '#dc2626', border: '1px solid #b91c1c', color: '#ffffff', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default LeaveStatusPage
