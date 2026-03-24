import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X, Plus, Trash2 } from 'lucide-react'

function SearchableDropdown({ value, onChange, options, placeholder = 'Select...', label, allowCustom = false, customItems = [], onDelete }) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const dropdownRef = useRef(null)
    const searchInputRef = useRef(null)
    const menuRef = useRef(null)

    // Calculate position for popover portal to avoid clipping without causing re-renders
    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const updatePosition = () => {
                if (!dropdownRef.current || !menuRef.current) return;
                const rect = dropdownRef.current.getBoundingClientRect()
                menuRef.current.style.position = 'fixed'
                menuRef.current.style.top = `${rect.bottom + 4}px`
                menuRef.current.style.left = `${rect.left}px`
                menuRef.current.style.width = `${rect.width}px`
                menuRef.current.style.zIndex = 99999
                menuRef.current.style.visibility = 'visible'
            }

            requestAnimationFrame(updatePosition)

            const handleScroll = (e) => {
                // Ignore scroll events originating from inside the dropdown menu itself
                if (menuRef.current && menuRef.current.contains(e.target)) return;
                updatePosition();
            }

            window.addEventListener('resize', updatePosition)
            window.addEventListener('scroll', handleScroll, true)
            return () => {
                window.removeEventListener('resize', updatePosition)
                window.removeEventListener('scroll', handleScroll, true)
            }
        }
    }, [isOpen])

    // Filter out any non-string options
    const safeOptions = options.filter(opt => typeof opt === 'string')

    // Filter options based on search term
    const filteredOptions = safeOptions.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Check if search term is a new custom value
    const isNewValue = allowCustom && searchTerm.trim() && !safeOptions.some(
        opt => opt.toLowerCase() === searchTerm.toLowerCase()
    )

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !event.target.closest('.dropdown-menu')) {
                setIsOpen(false)
                setSearchTerm('')
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus({ preventScroll: true })
        }
    }, [isOpen])

    const handleSelect = (option) => {
        onChange(option)
        setIsOpen(false)
        setSearchTerm('')
    }

    const handleAddCustom = () => {
        if (searchTerm.trim()) {
            onChange(searchTerm.trim())
            setIsOpen(false)
            setSearchTerm('')
        }
    }

    const handleClear = (e) => {
        e.stopPropagation()
        onChange('')
        setSearchTerm('')
    }

    return (
        <div className="searchable-dropdown" ref={dropdownRef}>
            <div
                className={`dropdown-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={value ? 'selected' : 'placeholder'}>
                    {value || placeholder}
                </span>
                <div className="dropdown-icons">
                    {value && (
                        <button
                            type="button"
                            className="clear-btn"
                            onClick={handleClear}
                            aria-label="Clear selection"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={16} className={`chevron ${isOpen ? 'rotate' : ''}`} />
                </div>
            </div>

            {isOpen && createPortal(
                <div className="dropdown-menu" ref={menuRef} style={{ position: 'fixed', visibility: 'hidden' }}>
                    <div className="search-box">
                        <Search size={14} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder={allowCustom ? "Search or add new..." : "Search..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && isNewValue) {
                                    handleAddCustom()
                                }
                            }}
                        />
                    </div>
                    <div className="options-list">
                        {/* Add new option */}
                        {isNewValue && (
                            <div
                                className="option-item add-new"
                                onClick={handleAddCustom}
                            >
                                <Plus size={14} />
                                <span>Add "{searchTerm.trim()}"</span>
                            </div>
                        )}

                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option}
                                    className={`option-item ${value === option ? 'selected' : ''}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    <span>{option}</span>
                                    {customItems.includes(option) && onDelete && (
                                        <button
                                            type="button"
                                            className="option-delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete(option)
                                            }}
                                            aria-label={`Delete ${option}`}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            !isNewValue && <div className="no-results">No results found</div>
                        )}
                    </div>
                </div>, document.body
            )}
        </div>
    )
}

export default SearchableDropdown
