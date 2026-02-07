import { Button } from './Button'

const EmptyState = ({
    icon,
    title,
    message,
    action,
    actionLabel,
    onAction,
    className = ''
}) => {
    return (
        <div className={`empty-state ${className}`}>
            {icon && (
                <div className="empty-state-icon">
                    {icon}
                </div>
            )}
            {title && <h3 className="empty-state-title">{title}</h3>}
            {message && <p className="empty-state-message">{message}</p>}
            {action || (actionLabel && onAction && (
                <Button variant="primary" onClick={onAction}>
                    {actionLabel}
                </Button>
            ))}
        </div>
    )
}

export default EmptyState
