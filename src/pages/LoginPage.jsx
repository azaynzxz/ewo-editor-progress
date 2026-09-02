import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Lock, User, Loader2 } from 'lucide-react';

const APPS_SCRIPT_URL = '/api/exec';
const MAX_ATTEMPTS = 3;

function LoginPage() {
    const navigate = useNavigate();

    // Parallax setup
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-300, 300], [5, -5]);
    const rotateY = useTransform(x, [-300, 300], [-5, 5]);

    const handleMouseMove = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left - rect.width / 2);
        y.set(event.clientY - rect.top - rect.height / 2);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check for lockout
    const attempts = parseInt(localStorage.getItem('loginAttempts') || '0', 10);
    const isLocked = attempts >= MAX_ATTEMPTS;

    const handleLogin = async (e) => {
        e.preventDefault();

        if (isLocked) {
            setError("Account temporarily blocked due to too many failed attempts.");
            return;
        }

        if (!identifier.trim() || !password.trim()) {
            setError("Please enter both username/email and password.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'login',
                    identifier: identifier,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success && data.data?.user) {
                const user = data.data.user;
                // Save user info
                localStorage.setItem('userName', user.name);
                localStorage.setItem('userEmail', user.email);

                // Map the human readable role to the internal slug logic
                let roleSlug = 'video_editor';
                const roleString = (user.role || '').toLowerCase();
                if (roleString.includes('illustrator')) roleSlug = 'illustrator';
                else if (roleString.includes('ads') || roleString.includes('design')) roleSlug = 'ads_design';

                localStorage.setItem('userRole', roleSlug);
                localStorage.setItem('userRoleRaw', user.role);
                localStorage.setItem('userType', user.type);
                localStorage.setItem('loginTimestamp', Date.now().toString());

                // Reset failed attempts
                localStorage.removeItem('loginAttempts');

                navigate('/');
            } else {
                const newAttempts = attempts + 1;
                localStorage.setItem('loginAttempts', newAttempts.toString());
                setError(data.data?.message || 'Invalid credentials');
            }
        } catch (err) {
            console.error(err);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
        }
    };

    return (
        <div className="login-wrapper" style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(-45deg, #eef2ff, #fae8ff, #e0e7ff, #fce7f3)',
            backgroundSize: '400% 400%',
            animation: 'gradientBG 10s ease infinite',
            padding: 'var(--space-4)'
        }}>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                style={{
                    display: 'flex',
                    maxWidth: '900px',
                    width: '100%',
                    minHeight: '520px',
                    background: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                    overflow: 'hidden' // So the left pane stays in bounds
                }}
            >
                {/* ━━━━━━ LEFT PANE (Illustration) ━━━━━━ */}
                <motion.div
                    className="login-left-pane"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        flex: '1 1 50%',
                        background: '#ffffff',
                        display: 'flex',
                        borderRight: '1px solid #f1f5f9',
                        overflow: 'hidden',
                        perspective: 1000
                    }}>
                    <motion.img
                        draggable={false}
                        src="/login-illustration.png"
                        alt="Creative Team working"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            rotateX,
                            rotateY,
                            scale: 1.05,
                            userSelect: 'none',
                            WebkitUserDrag: 'none'
                        }}
                    />
                </motion.div>

                {/* ━━━━━━ RIGHT PANE (Form) ━━━━━━ */}
                <div className="login-right-pane" style={{
                    flex: '1 1 50%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 60px'
                }}>

                    <div style={{ width: '100%', textAlign: 'left' }}>
                        <img
                            src="/logo.jpg"
                            alt="EWO Hub Logo"
                            style={{ height: '40px', marginBottom: '32px', borderRadius: '8px' }}
                        />

                        <h1 style={{
                            fontSize: '28px',
                            color: 'var(--gray-900)',
                            fontWeight: 700,
                            letterSpacing: '-0.5px',
                            marginBottom: '12px'
                        }}>
                            Welcome Back
                        </h1>
                        <p style={{ color: 'var(--gray-500)', fontSize: '15px', marginBottom: '40px' }}>
                            Access your daily tasks, progress reports, and team resources securely.
                        </p>

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '8px' }}>
                                    Username or Email
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                                    <input
                                        type="text"
                                        placeholder="Enter your name or email"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        disabled={loading || isLocked}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px 12px 40px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            color: '#1e293b',
                                            background: '#ffffff',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.2s',
                                            outline: 'none',
                                            WebkitUserSelect: 'text',
                                            userSelect: 'text'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '8px' }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading || isLocked}
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px 12px 40px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            color: '#1e293b',
                                            background: '#ffffff',
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.2s',
                                            outline: 'none',
                                            WebkitUserSelect: 'text',
                                            userSelect: 'text'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{
                                            color: '#b91c1c', // darker red text
                                            background: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            textAlign: 'left'
                                        }}
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button
                                whileHover={!loading && !isLocked ? { backgroundColor: 'var(--primary-700)', translateY: -1 } : {}}
                                whileTap={!loading && !isLocked ? { scale: 0.98 } : {}}
                                type="submit"
                                disabled={loading || isLocked}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    padding: '12px',
                                    marginTop: '8px',
                                    background: isLocked ? 'var(--gray-300)' : 'var(--primary-600)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    cursor: (loading || isLocked) ? 'not-allowed' : 'pointer',
                                    opacity: (loading || isLocked) ? 0.7 : 1,
                                    transition: 'background 0.2s, transform 0.2s'
                                }}
                            >
                                {loading ? (
                                    <><Loader2 size={18} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} /> Authenticating...</>
                                ) : isLocked ? 'Account Blocked' : 'Sign In'}
                            </motion.button>
                        </form>
                    </div>

                </div>
            </motion.div>

            {/* Global spinner style */}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                @keyframes gradientBG {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @media (max-width: 768px) {
                    .login-left-pane { display: none !important; }
                    .login-right-pane { padding: 32px 24px !important; }
                }
            `}</style>
        </div>
    );
}

export default LoginPage;
