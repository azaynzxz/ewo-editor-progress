import { useNavigate } from 'react-router-dom';
import { Palette, Video } from 'lucide-react';
import { motion } from 'framer-motion';

function RoleSelection() {
    const navigate = useNavigate();

    const handleSelectRole = (role) => {
        localStorage.setItem('userRole', role);
        navigate('/');
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: 'easeOut',
                when: 'beforeChildren',
                staggerChildren: 0.15
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-secondary)',
            padding: 'var(--space-4)'
        }}>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                style={{
                    maxWidth: '600px',
                    width: '100%',
                    background: 'var(--bg-primary)',
                    padding: 'var(--space-8)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-lg)',
                    textAlign: 'center'
                }}
            >
                <motion.img
                    variants={itemVariants}
                    src="/logo.jpg"
                    alt="EWO Logo"
                    style={{ height: '64px', marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}
                />

                <motion.h1 variants={itemVariants} style={{ fontSize: 'var(--text-2xl)', color: 'var(--gray-900)', marginBottom: 'var(--space-2)' }}>
                    Welcome to EWO Hub
                </motion.h1>
                <motion.p variants={itemVariants} style={{ color: 'var(--gray-600)', marginBottom: 'var(--space-8)' }}>
                    Please select your team to continue.
                </motion.p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 'var(--space-4)'
                }}>
                    <motion.button
                        variants={itemVariants}
                        whileHover={{
                            y: -4,
                            borderColor: 'var(--primary-500)',
                            boxShadow: 'var(--shadow-md)',
                            scale: 1.02
                        }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleSelectRole('illustrator')}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-6)',
                            background: 'var(--white)',
                            border: '2px solid var(--primary-200)',
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            transition: 'background 0.2s', // Removed transform/boxShadow transition since framer handles it
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'var(--primary-50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary-600)'
                        }}>
                            <Palette size={32} />
                        </div>
                        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--gray-900)' }}>
                            Illustrator
                        </span>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                            Drawing & Assets
                        </span>
                    </motion.button>

                    <motion.button
                        variants={itemVariants}
                        whileHover={{
                            y: -4,
                            borderColor: 'var(--primary-500)',
                            boxShadow: 'var(--shadow-md)',
                            scale: 1.02
                        }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleSelectRole('video_editor')}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-6)',
                            background: 'var(--white)',
                            border: '2px solid var(--primary-200)',
                            borderRadius: 'var(--radius-lg)',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'var(--primary-50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary-600)'
                        }}>
                            <Video size={32} />
                        </div>
                        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--gray-900)' }}>
                            Video Editor
                        </span>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                            Animation & Composite
                        </span>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}

export default RoleSelection;
