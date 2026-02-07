function PageHeader({
    title,
    description,
    action,
    className = ''
}) {
    return (
        <header className={`page-header ${className}`}>
            <div className="page-header-row">
                <div>
                    <h1 className="page-title">{title}</h1>
                    {description && (
                        <p className="page-description">{description}</p>
                    )}
                </div>
                {action}
            </div>
        </header>
    )
}

export default PageHeader
