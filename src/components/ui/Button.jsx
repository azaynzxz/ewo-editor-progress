import { forwardRef } from 'react'

const Button = forwardRef(({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconRight,
    loading = false,
    disabled = false,
    className = '',
    ...props
}, ref) => {
    const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
    const variantClass = `btn-${variant}`

    const classes = [
        'btn',
        variantClass,
        sizeClass,
        className
    ].filter(Boolean).join(' ')

    return (
        <button
            ref={ref}
            className={classes}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <div className="spinner" />
            ) : icon}
            {children}
            {!loading && iconRight}
        </button>
    )
})

Button.displayName = 'Button'

// Icon-only button
const IconButton = forwardRef(({
    children,
    size = 'md',
    className = '',
    ...props
}, ref) => {
    const sizeClass = size === 'sm' ? 'sm' : ''

    return (
        <button
            ref={ref}
            className={`btn-icon ${sizeClass} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
})

IconButton.displayName = 'IconButton'

export { Button, IconButton }
export default Button
