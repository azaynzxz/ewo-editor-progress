const Badge = ({
    children,
    color = 'gray',
    icon,
    className = ''
}) => {
    return (
        <span className={`badge badge-${color} ${className}`}>
            {icon}
            {children}
        </span>
    )
}

export default Badge
