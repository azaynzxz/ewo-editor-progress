import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './Button'

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    className = ''
}) => {
    const handleEscape = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose()
        }
    }, [onClose])

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [isOpen, handleEscape])

    if (!isOpen) return null

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const sizeStyle = {
        sm: { maxWidth: '400px' },
        md: { maxWidth: '500px' },
        lg: { maxWidth: '700px' },
        xl: { maxWidth: '900px' }
    }

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div
                className={`modal ${className}`}
                style={sizeStyle[size]}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <IconButton onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </IconButton>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Modal
