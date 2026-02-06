import { useEffect } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, 4000) // Auto-close after 4 seconds

        return () => clearTimeout(timer)
    }, [onClose])

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-icon">
                {type === 'success' ? (
                    <CheckCircle size={20} />
                ) : (
                    <AlertCircle size={20} />
                )}
            </div>
            <div className="toast-content">
                <p className="toast-message">{message}</p>
            </div>
            <button
                className="toast-close"
                onClick={onClose}
                aria-label="Close notification"
            >
                <X size={16} />
            </button>
        </div>
    )
}

export default Toast
