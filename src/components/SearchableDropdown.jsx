import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, Plus } from 'lucide-react'

function SearchableDropdown({ value, onChange, options, placeholder = 'Select...', label, allowCustom = false }) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const dropdownRef = useRef(null)
    const searchInputRef = useRef(null)

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Check if search term is a new custom value
    const isNewValue = allowCustom && searchTerm.trim() && !options.some(
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
                                    className={`option-item ${value === option ? 'selected' : ''}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    {option}
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

export default SearchableDropdown
