import { useState, useRef, useEffect } from 'react'
import { Shield, Lock, X } from 'lucide-react'

const PIN_LENGTH = 6

function AdminAuthGate({ onSuccess }) {
    const [digits, setDigits] = useState(Array(PIN_LENGTH).fill(''))
    const [error, setError] = useState('')
    const [shake, setShake] = useState(false)
    const inputRefs = useRef([])

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus()
    }, [])

    const handleChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return

        const newDigits = [...digits]
        newDigits[index] = value
        setDigits(newDigits)
        setError('')

        // Auto-focus next input
        if (value && index < PIN_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto-submit when all digits filled
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
            setError('Incorrect PIN')
            setShake(true)
            setTimeout(() => {
                setShake(false)
                setDigits(Array(PIN_LENGTH).fill(''))
                inputRefs.current[0]?.focus()
            }, 600)
        }
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f3f4f6',
            padding: 'var(--space-4)',
        }}>
            <div style={{
                background: 'white',
                borderRadius: 'var(--radius-2xl)',
                padding: 'var(--space-10) var(--space-8)',
                maxWidth: 400,
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            }}>
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
                    margin: '0 0 var(--space-8)',
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
                    PIN auto-submits when complete
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
