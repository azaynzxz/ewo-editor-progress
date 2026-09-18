import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ShieldAlert, Lock, X, LogOut, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'

const PIN_LENGTH = 6
const APPS_SCRIPT_URL = '/api/exec'
const ALLOWED_ADMIN_ROLES = ['Sr. Video Editor', 'CEO', 'Finance', 'Sr. Illustrator']

function AdminAuthGate({ onSuccess }) {
    const navigate = useNavigate()
    const [digits, setDigits] = useState(Array(PIN_LENGTH).fill(''))
    const [error, setError] = useState('')
    const [shake, setShake] = useState(false)
    const [checkingStatus, setCheckingStatus] = useState(true)
    const [userAccessState, setUserAccessState] = useState(null) // 'active' | 'inactive' | 'unauthorized' | 'not_found'
    const [employeeInfo, setEmployeeInfo] = useState(null)
    const inputRefs = useRef([])

    useEffect(() => {
        verifyEmployeeStatus()
    }, [])

    const verifyEmployeeStatus = async () => {
        const userName = localStorage.getItem('userName') || ''
        const userEmail = localStorage.getItem('userEmail') || ''
        const userRoleRaw = localStorage.getItem('userRoleRaw') || ''
        const localStatus = localStorage.getItem('userStatus') || ''

        // If not logged in at all, redirect to login
        if (!userName && !userEmail) {
            navigate('/login')
            return
        }

        // Fast client check: if locally flagged inactive, block right away
        if (localStatus.toLowerCase() === 'inactive') {
            setUserAccessState('inactive')
            setCheckingStatus(false)
            return
        }

        try {
            setCheckingStatus(true)
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'getEmployees' })
            })

            const result = await response.json()
            if (result.success && Array.isArray(result.data)) {
                // Find matching employee in database
                const match = result.data.find(emp =>
                    (emp.email && userEmail && emp.email.toLowerCase() === userEmail.toLowerCase()) ||
                    (emp.name && userName && emp.name.toLowerCase() === userName.toLowerCase())
                )

                if (match) {
                    setEmployeeInfo(match)
                    const statusLower = (match.status || '').toLowerCase()

                    if (statusLower !== 'active') {
                        // Mark as inactive immediately & persist status
                        localStorage.setItem('userStatus', 'Inactive')
                        setUserAccessState('inactive')
                        setCheckingStatus(false)
                        return
                    }

                    // Check if role is authorized for admin
                    const roleToCheck = match.role || userRoleRaw
                    if (!ALLOWED_ADMIN_ROLES.includes(roleToCheck)) {
                        setUserAccessState('unauthorized')
                        setCheckingStatus(false)
                        return
                    }

                    // Active and authorized!
                    localStorage.setItem('userStatus', 'Active')
                    setUserAccessState('active')
                } else {
                    // Fallback to role check if not found in directory
                    if (!ALLOWED_ADMIN_ROLES.includes(userRoleRaw)) {
                        setUserAccessState('unauthorized')
                    } else {
                        setUserAccessState('active')
                    }
                }
            } else {
                // Network/backend error fallback
                if (localStatus.toLowerCase() === 'inactive') {
                    setUserAccessState('inactive')
                } else if (!ALLOWED_ADMIN_ROLES.includes(userRoleRaw)) {
                    setUserAccessState('unauthorized')
                } else {
                    setUserAccessState('active')
                }
            }
        } catch (err) {
            console.error('Error verifying employee status in AdminAuthGate:', err)
            // Fallback to local role & status
            if (localStatus.toLowerCase() === 'inactive') {
                setUserAccessState('inactive')
            } else if (!ALLOWED_ADMIN_ROLES.includes(userRoleRaw)) {
                setUserAccessState('unauthorized')
            } else {
                setUserAccessState('active')
            }
        } finally {
            setCheckingStatus(false)
            // Auto focus input if active
            setTimeout(() => inputRefs.current[0]?.focus(), 100)
        }
    }

    const handlePurgeLogout = () => {
        ['userRole', 'userRoleRaw', 'userType', 'userName', 'userEmail', 'userStatus', 'loginTimestamp', 'lastUsedEditor'].forEach(key => localStorage.removeItem(key))
        sessionStorage.removeItem('adminAuth')
        window.location.href = '/login?status=inactive'
    }

    const handleChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return

        const newDigits = [...digits]
        newDigits[index] = value
        setDigits(newDigits)
        setError('')

        if (value && index < PIN_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus()
        }

        if (value && index === PIN_LENGTH - 1) {
            const pin = newDigits.join('')
            if (pin.length === PIN_LENGTH) {
                verifyPin(pin)
            }
        }
    }

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH)
        if (pasted) {
            const newDigits = Array(PIN_LENGTH).fill('')
            pasted.split('').forEach((d, i) => { newDigits[i] = d })
            setDigits(newDigits)
            if (pasted.length === PIN_LENGTH) {
                setTimeout(() => verifyPin(pasted), 100)
            } else {
                inputRefs.current[pasted.length]?.focus()
            }
        }
    }

    const verifyPin = (pin) => {
        const correctPin = import.meta.env.VITE_ADMIN_PIN || '000000'
        if (pin === correctPin) {
            sessionStorage.setItem('adminAuth', 'true')
            onSuccess()
        } else {
            setError('PIN Salah! Silakan coba lagi.')
            setShake(true)
            setTimeout(() => {
                setShake(false)
                setDigits(Array(PIN_LENGTH).fill(''))
                inputRefs.current[0]?.focus()
            }, 600)
        }
    }

    // 1. Loading verification state
    if (checkingStatus) {
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
                padding: 'var(--space-4)',
            }}>
                <div style={{
                    background: 'white', borderRadius: 'var(--radius-2xl)',
                    padding: 'var(--space-8)', maxWidth: 380, width: '100%',
                    textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                }}>
                    <Loader2 size={36} color="var(--primary-600)" className="spin" style={{ margin: '0 auto var(--space-4)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gray-800)', margin: '0 0 6px' }}>
                        Memeriksa Status Akun...
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: 0 }}>
                        Memverifikasi otorisasi di Employee Database
                    </p>
                </div>
            </div>
        )
    }

    // 2. INACTIVE EMPLOYEE: Full lockdown & prominent security warning
    if (userAccessState === 'inactive') {
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)',
                padding: 'var(--space-4)',
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '40px 32px',
                    maxWidth: 460,
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.35)',
                    border: '1.5px solid #fecaca',
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '20px',
                        background: '#fef2f2',
                        border: '2px solid #fee2e2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}>
                        <ShieldAlert size={36} color="#dc2626" />
                    </div>

                    <h2 style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: '#991b1b',
                        margin: '0 0 8px',
                        letterSpacing: '-0.3px',
                    }}>
                        Akses Ditolak: Akun Nonaktif
                    </h2>

                    <div style={{
                        display: 'inline-block',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '16px',
                    }}>
                        Status: Inactive
                    </div>

                    <p style={{
                        fontSize: '14px',
                        color: '#4b5563',
                        lineHeight: 1.6,
                        margin: '0 0 24px',
                    }}>
                        Akun Anda {employeeInfo?.name ? <strong>({employeeInfo.name})</strong> : ''} tercatat berstatus <strong>NONAKTIF</strong> di database karyawan. 
                        Untuk melindungi keamanan data dan kerahasiaan perusahaan, seluruh akses ke sistem ini diblokir.
                    </p>

                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fca5a5',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: '28px',
                        fontSize: '12.5px',
                        color: '#991b1b',
                        textAlign: 'left',
                        lineHeight: 1.5,
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                    }}>
                        <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                        <span>Silakan hubungi tim HR atau Administrator jika Anda merasa ada kesalahan.</span>
                    </div>

                    <button
                        onClick={handlePurgeLogout}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 600,
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'background 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#b91c1c'}
                        onMouseOut={e => e.currentTarget.style.background = '#dc2626'}
                    >
                        <LogOut size={16} /> Keluar & Bersihkan Sesi
                    </button>
                </div>
            </div>
        )
    }

    // 3. UNAUTHORIZED ROLE: Active employee but without admin role
    if (userAccessState === 'unauthorized') {
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
                padding: 'var(--space-4)',
            }}>
                <div style={{
                    background: 'white', borderRadius: '24px',
                    padding: '40px 32px', maxWidth: 420, width: '100%',
                    textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
                }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '20px',
                        background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 18px',
                    }}>
                        <Shield size={32} color="#d97706" />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gray-900)', margin: '0 0 8px' }}>
                        Akses Khusus Admin
                    </h2>
                    <p style={{ fontSize: '13.5px', color: 'var(--gray-600)', lineHeight: 1.5, margin: '0 0 24px' }}>
                        Halaman ini hanya dapat diakses oleh peran kepemimpinan atau administrator (Sr. Video Editor, Sr. Illustrator, Finance, CEO).
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            width: '100%', padding: '12px',
                            background: 'var(--primary-600)', color: 'white',
                            border: 'none', borderRadius: '10px',
                            fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        <ArrowLeft size={16} /> Kembali ke Dashboard
                    </button>
                </div>
            </div>
        )
    }

    // 4. ACTIVE ADMIN: 6-Digit PIN Entry Modal
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            padding: 'var(--space-4)',
        }}>
            <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '40px 32px',
                maxWidth: 420,
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                position: 'relative',
            }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        position: 'absolute', top: 20, left: 20,
                        background: 'transparent', border: 'none',
                        color: 'var(--gray-400)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: '12.5px', fontWeight: 500, padding: 4,
                    }}
                    title="Kembali ke Dashboard"
                >
                    <ArrowLeft size={16} /> Dashboard
                </button>

                <div style={{
                    width: 64, height: 64, borderRadius: 'var(--radius-xl)',
                    background: 'linear-gradient(135deg, var(--gray-800), var(--gray-900))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto var(--space-5)',
                }}>
                    <Shield size={28} color="white" />
                </div>

                <h2 style={{
                    fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)',
                    fontWeight: 700, margin: '0 0 var(--space-2)', color: 'var(--gray-900)',
                }}>
                    Admin Access
                </h2>
                <p style={{
                    fontSize: 'var(--text-sm)', color: 'var(--gray-500)',
                    margin: '0 0 var(--space-6)',
                }}>
                    <Lock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Masukkan 6-digit PIN Keamanan Admin
                </p>

                <div
                    style={{
                        display: 'flex', gap: 'var(--space-2)',
                        justifyContent: 'center', marginBottom: 'var(--space-6)',
                        animation: shake ? 'admin-shake 0.5s ease' : 'none',
                    }}
                >
                    {digits.map((digit, i) => (
                        <input
                            key={i}
                            ref={el => inputRefs.current[i] = el}
                            type="password"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            onPaste={i === 0 ? handlePaste : undefined}
                            autoComplete="off"
                            style={{
                                width: 48, height: 56,
                                textAlign: 'center',
                                fontSize: 'var(--text-2xl)',
                                fontWeight: 700,
                                border: `2px solid ${error ? 'var(--error)' : digit ? 'var(--primary-400)' : 'var(--gray-200)'}`,
                                borderRadius: 'var(--radius-lg)',
                                outline: 'none',
                                transition: 'all var(--transition-base)',
                                background: digit ? 'var(--primary-50)' : 'var(--gray-50)',
                                color: 'var(--gray-900)',
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--primary-500)'}
                            onBlur={e => e.target.style.borderColor = digit ? 'var(--primary-400)' : 'var(--gray-200)'}
                        />
                    ))}
                </div>

                {error && (
                    <p style={{
                        color: 'var(--error)', fontSize: 'var(--text-sm)',
                        fontWeight: 600, margin: '0 0 var(--space-4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                        <X size={14} /> {error}
                    </p>
                )}

                <p style={{
                    fontSize: 'var(--text-xs)', color: 'var(--gray-400)', margin: 0,
                }}>
                    PIN diverifikasi otomatis saat 6 digit terisi
                </p>
            </div>

            <style>{`
                @keyframes admin-shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-8px); }
                    40% { transform: translateX(8px); }
                    60% { transform: translateX(-5px); }
                    80% { transform: translateX(5px); }
                }
            `}</style>
        </div>
    )
}

export default AdminAuthGate

