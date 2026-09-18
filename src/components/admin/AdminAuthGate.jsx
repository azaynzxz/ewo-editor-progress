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
            setError('Incorrect PIN. Please try again.')
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
                position: 'fixed', inset: 0, zIndex: 99999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(circle at 50% 20%, rgba(30, 41, 59, 0.95), #060911)',
                backdropFilter: 'blur(16px)',
                padding: 'var(--space-4)',
            }}>
                <div style={{
                    background: 'rgba(17, 24, 39, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                    padding: '36px 28px', maxWidth: 380, width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
                        <img
                            src="/logo.jpg"
                            alt="EWO Logo"
                            style={{ height: '36px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#f8fafc' }}>
                            EWO HUB
                        </span>
                    </div>
                    <Loader2 size={36} color="var(--primary-400, #60a5fa)" className="spin" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', margin: '0 0 6px' }}>
                        Memeriksa Status Akun...
                    </h3>
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                        Memverifikasi otorisasi di Employee Database
                    </p>
                </div>
            </div>
        )
    }

    // 2. INACTIVE EMPLOYEE: Full-screen lockdown with EWO Logo & one-click session purge
    if (userAccessState === 'inactive') {
        const currentName = employeeInfo?.name || localStorage.getItem('userName') || 'Employee'
        const currentEmail = employeeInfo?.email || localStorage.getItem('userEmail') || ''
        const currentRole = employeeInfo?.role || localStorage.getItem('userRoleRaw') || 'Staff'

        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at 50% 15%, rgba(239, 68, 68, 0.18) 0%, transparent 65%), radial-gradient(circle at 85% 85%, rgba(220, 38, 38, 0.08) 0%, transparent 50%), linear-gradient(180deg, #07090e 0%, #0d121f 100%)',
                backdropFilter: 'blur(20px)',
                padding: 'clamp(16px, 4vw, 32px)',
                overflowY: 'auto',
                boxSizing: 'border-box',
            }}>
                <div style={{
                    background: 'rgba(15, 23, 42, 0.88)',
                    backdropFilter: 'blur(28px) saturate(190%)',
                    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                    border: '1.5px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '28px',
                    padding: 'clamp(28px, 6vw, 44px) clamp(20px, 5vw, 36px)',
                    maxWidth: '520px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.85), 0 0 50px -10px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                    margin: 'auto',
                    boxSizing: 'border-box',
                    position: 'relative',
                }}>
                    {/* Header with EWO Logo & Subtitle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        <img
                            src="/logo.jpg"
                            alt="EWO Hub Logo"
                            style={{
                                height: '40px',
                                borderRadius: '10px',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                                border: '1px solid rgba(255, 255, 255, 0.15)'
                            }}
                        />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 800,
                                letterSpacing: '1px',
                                color: '#f8fafc',
                                textTransform: 'uppercase'
                            }}>
                                EWO HUB
                            </div>
                            <div style={{
                                fontSize: '10.5px',
                                color: '#94a3b8',
                                letterSpacing: '0.5px',
                                fontWeight: 500
                            }}>
                                ADMIN GATEWAY
                            </div>
                        </div>
                    </div>

                    {/* Concentric Pulsing Shield Icon */}
                    <div style={{
                        position: 'relative',
                        width: 80,
                        height: 80,
                        margin: '0 auto 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <div style={{
                            position: 'absolute',
                            inset: -8,
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)',
                            animation: 'securityPulse 2.4s ease-in-out infinite'
                        }} />
                        <div style={{
                            width: 76,
                            height: 76,
                            borderRadius: '24px',
                            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.3), rgba(153, 27, 27, 0.15))',
                            border: '1.5px solid rgba(248, 113, 113, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 30px rgba(239, 68, 68, 0.35)'
                        }}>
                            <ShieldAlert size={40} color="#f87171" />
                        </div>
                    </div>

                    {/* Status Pill Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#fca5a5',
                        padding: '6px 14px',
                        borderRadius: '30px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.8px',
                        textTransform: 'uppercase',
                        marginBottom: '16px',
                    }}>
                        <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#ef4444', display: 'inline-block',
                            boxShadow: '0 0 8px #ef4444'
                        }} />
                        Account Inactive
                    </div>

                    {/* Heading */}
                    <h2 style={{
                        fontSize: 'clamp(20px, 4vw, 24px)',
                        fontWeight: 800,
                        color: '#ffffff',
                        margin: '0 0 10px',
                        letterSpacing: '-0.5px',
                        lineHeight: 1.3,
                    }}>
                        Access Restricted
                    </h2>

                    <p style={{
                        fontSize: '13.5px',
                        color: '#cbd5e1',
                        lineHeight: 1.6,
                        margin: '0 0 20px',
                    }}>
                        This account is currently deactivated. Access to internal projects, schedules, and administrative tools has been paused.
                    </p>

                    {/* Inset User Identity Card */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        margin: '0 0 20px',
                        textAlign: 'left',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                            <div style={{
                                width: 42,
                                height: 42,
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.15))',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#fca5a5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '16px',
                                flexShrink: 0
                            }}>
                                {currentName[0]?.toUpperCase() || 'U'}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{
                                    color: '#ffffff',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {currentName}
                                </div>
                                <div style={{
                                    color: '#94a3b8',
                                    fontSize: '12px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {currentEmail || currentRole}
                                </div>
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.45)',
                            color: '#fca5a5',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            flexShrink: 0
                        }}>
                            INACTIVE
                        </div>
                    </div>

                    {/* Explanatory Notice Callout */}
                    <div style={{
                        background: 'rgba(220, 38, 38, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        marginBottom: '26px',
                        fontSize: '12.5px',
                        color: '#fca5a5',
                        textAlign: 'left',
                        lineHeight: 1.5,
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                    }}>
                        <AlertTriangle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                            <span>Please reach out to your team administrator or HR if you need this account reactivated.</span>
                        </div>
                    </div>

                    {/* Sign Out Button */}
                    <button
                        onClick={handlePurgeLogout}
                        style={{
                            width: '100%',
                            padding: '14px 20px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '14.5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            boxShadow: '0 8px 24px -4px rgba(220, 38, 38, 0.45)',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)'
                            e.currentTarget.style.boxShadow = '0 12px 30px -4px rgba(220, 38, 38, 0.6)'
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(220, 38, 38, 0.45)'
                        }}
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>

                <style>{`
                    @keyframes securityPulse {
                        0%, 100% { transform: scale(1); opacity: 0.4; }
                        50% { transform: scale(1.15); opacity: 0.8; }
                    }
                `}</style>
            </div>
        )
    }

    // 3. UNAUTHORIZED ROLE: Active employee but without admin role
    if (userAccessState === 'unauthorized') {
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(circle at 50% 20%, rgba(30, 41, 59, 0.9), #060911)',
                backdropFilter: 'blur(16px)',
                padding: 'var(--space-4)',
            }}>
                <div style={{
                    background: 'rgba(15, 23, 42, 0.88)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '24px',
                    padding: '40px 32px', maxWidth: 440, width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px -10px rgba(245, 158, 11, 0.15)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                        <img
                            src="/logo.jpg"
                            alt="EWO Logo"
                            style={{ height: '36px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)' }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px', color: '#f8fafc' }}>
                            EWO HUB
                        </span>
                    </div>
                    <div style={{
                        width: 64, height: 64, borderRadius: '20px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1.5px solid rgba(245, 158, 11, 0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 18px',
                    }}>
                        <Shield size={32} color="#fbbf24" />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 8px' }}>
                        Admin Access Required
                    </h2>
                    <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 24px' }}>
                        This section is restricted to team leads and administrators.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            width: '100%', padding: '12px',
                            background: 'var(--primary-600, #2563eb)', color: 'white',
                            border: 'none', borderRadius: '12px',
                            fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
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
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 50% 20%, rgba(30, 41, 59, 0.9), #060911)',
            backdropFilter: 'blur(16px)',
            padding: 'var(--space-4)',
        }}>
            <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '40px 32px',
                maxWidth: 420,
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
                    title="Back to Dashboard"
                >
                    <ArrowLeft size={16} /> Dashboard
                </button>

                {/* EWO Logo in PIN View */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                    marginTop: '4px'
                }}>
                    <img
                        src="/logo.jpg"
                        alt="EWO Logo"
                        style={{ height: '36px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '1px', color: 'var(--gray-800)' }}>
                        EWO HUB
                    </span>
                </div>

                <div style={{
                    width: 56, height: 56, borderRadius: 'var(--radius-xl)',
                    background: 'linear-gradient(135deg, var(--gray-800), var(--gray-900))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                }}>
                    <Shield size={26} color="white" />
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
                    Enter your 6-digit PIN
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
                    Auto-submits when complete
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

