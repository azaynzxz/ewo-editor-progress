import { forwardRef } from 'react'

const Card = forwardRef(({
    children,
    className = '',
    onClick,
    hoverable = false,
    ...props
}, ref) => {
    const classes = [
        'card',
        onClick || hoverable ? 'card-clickable' : '',
        className
    ].filter(Boolean).join(' ')

    return (
        <div ref={ref} className={classes} onClick={onClick} {...props}>
            {children}
        </div>
    )
})

Card.displayName = 'Card'

const CardHeader = ({ icon, iconColor = 'blue', title, subtitle, action, className = '' }) => (
    <div className={`card-header ${className}`}>
        {icon && (
            <div className={`card-header-icon ${iconColor}`}>
                {icon}
            </div>
        )}
        <div style={{ flex: 1 }}>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {action}
    </div>
)

const CardBody = ({ children, className = '' }) => (
    <div className={`card-body ${className}`}>
        {children}
    </div>
)

const CardFooter = ({ children, className = '' }) => (
    <div className={`card-footer ${className}`}>
        {children}
    </div>
)

export { Card, CardHeader, CardBody, CardFooter }
export default Card
