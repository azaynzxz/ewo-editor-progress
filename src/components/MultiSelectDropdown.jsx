import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, Plus, Trash2 } from 'lucide-react'

function MultiSelectDropdown({ selectedItems = [], onChange, options, placeholder = 'Select...', allowCustom = false, customItems = [], onDelete }) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const dropdownRef = useRef(null)
    const searchInputRef = useRef(null)

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
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
                setSearchTerm('')
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [isOpen])

    const handleSelect = (option) => {
        if (selectedItems.includes(option)) {
            // Remove if already selected
            onChange(selectedItems.filter(item => item !== option))
        } else {
            // Add to selection
            onChange([...selectedItems, option])
        }
        setSearchTerm('')
    }

    const handleAddCustom = () => {
        if (searchTerm.trim()) {
            const newItem = searchTerm.trim()
            if (!selectedItems.includes(newItem)) {
                onChange([...selectedItems, newItem])
            }
            setIsOpen(false)
            setSearchTerm('')
        }
    }

    const handleRemoveItem = (item, e) => {
        e.stopPropagation()
        onChange(selectedItems.filter(i => i !== item))
    }

    const handleClearAll = (e) => {
        e.stopPropagation()
        onChange([])
        setSearchTerm('')
    }

    return (
        <div className="searchable-dropdown multi-select-dropdown" ref={dropdownRef}>
            <div
                className={`dropdown-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="multi-select-display">
                    {selectedItems.length > 0 ? (
                        <div className="selected-tags">
                            {selectedItems.map(item => (
                                <span key={item} className="selected-tag">
                                    {item}
                                    <button
                                        type="button"
                                        className="tag-remove"
                                        onClick={(e) => handleRemoveItem(item, e)}
                                        aria-label={`Remove ${item}`}
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="placeholder">{placeholder}</span>
                    )}
                </div>
                <div className="dropdown-icons">
                    {selectedItems.length > 0 && (
                        <button
                            type="button"
                            className="clear-btn"
                            onClick={handleClearAll}
                            aria-label="Clear all selections"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={16} className={`chevron ${isOpen ? 'rotate' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="dropdown-menu">
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
                                    className={`option-item ${selectedItems.includes(option) ? 'selected' : ''}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    <div className="option-check">
                                        <div className={`checkbox ${selectedItems.includes(option) ? 'checked' : ''}`}>
                                            {selectedItems.includes(option) && (
                                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <span>{option}</span>
                                    </div>
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
                </div>
            )}
        </div>
    )
}

export default MultiSelectDropdown
