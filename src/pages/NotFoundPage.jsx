import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

function NotFoundPage() {
    const navigate = useNavigate()

    return (
        <div style={{
            position: 'fixed', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: '#fff',
            fontFamily: 'var(--font-heading, Inter, sans-serif)',
            zIndex: 9999,
        }}>
            <h1 style={{
                fontSize: '8rem', fontWeight: 800,
                margin: 0, lineHeight: 1,
                color: '#e5e7eb',
                letterSpacing: '-0.04em',
            }}>404</h1>
            <p style={{
                fontSize: '1.125rem', color: '#6b7280',
                margin: '8px 0 32px', fontWeight: 500,
            }}>Page not found</p>
            <button
                onClick={() => navigate('/')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 24px',
                    background: '#111827', color: '#fff',
                    border: 'none', borderRadius: 8,
                    fontSize: '0.875rem', fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.target.style.opacity = '0.85'}
                onMouseLeave={e => e.target.style.opacity = '1'}
            >
                <Home size={16} /> Go Home
            </button>
        </div>
    )
}

export default NotFoundPage
