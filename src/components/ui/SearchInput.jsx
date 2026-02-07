import { Search } from 'lucide-react'

const SearchInput = ({
    value,
    onChange,
    placeholder = 'Search...',
    className = ''
}) => {
    return (
        <div className={`search-wrapper ${className}`}>
            <Search size={18} className="search-icon" />
            <input
                type="text"
                className="input-field"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    )
}

export default SearchInput
