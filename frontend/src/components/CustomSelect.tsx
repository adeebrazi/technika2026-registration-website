import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  category?: string;
}

interface CustomSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  options: readonly string[] | string[] | SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  name = '',
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  searchable = false,
  required = false,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  // Normalize options to { value, label, category? } format
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Find currently selected label
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q) ||
      (opt.category && opt.category.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery, searchable]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset search query and highlighted index when dropdown closes (do not autofocus input on open)
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Scroll active item into view when opened
  useEffect(() => {
    if (isOpen && value && optionsListRef.current) {
      const activeEl = optionsListRef.current.querySelector('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, value]);

  const handleSelect = (val: string) => {
    onChange({ target: { name, value: val } });
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      } else if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        e.preventDefault();
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container relative w-full min-w-0 ${className}`}
      style={{ userSelect: 'none', boxSizing: 'border-box', width: '100%', maxWidth: '100%' }}
    >
      {/* Hidden input to support native HTML5 form validation */}
      <input
        type="text"
        tabIndex={-1}
        name={name}
        id={id}
        required={required}
        value={value}
        onChange={() => {}}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          height: 0,
          width: 0,
          bottom: 0,
          left: '50%',
        }}
        aria-hidden="true"
      />

      {/* Main Select Trigger Box (Neo-Brutalist High-Contrast Styling) */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="custom-select-trigger w-full min-w-0 flex items-center justify-between cursor-pointer transition-all duration-100"
        style={{
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%',
          backgroundColor: '#FFFFFF',
          border: '3px solid #000000',
          padding: '10px 12px',
          boxShadow: isOpen ? '2px 2px 0px #000000' : '3px 3px 0px #000000',
          transform: isOpen ? 'translate(2px, 2px)' : 'none',
          color: '#000000',
          fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)",
          fontSize: '0.88rem',
          fontWeight: 700,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span
          className="truncate pr-2 min-w-0 flex-1"
          style={{
            color: selectedOption ? '#000000' : '#64748b',
            fontWeight: selectedOption ? 800 : 600,
            letterSpacing: '0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center border-2 border-black bg-[#FFE600] transition-transform duration-150 shrink-0"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              boxShadow: '1px 1px 0px #000000',
            }}
          >
            <ChevronDown size={13} className="text-black font-black" />
          </div>
        </div>
      </div>

      {/* Dropdown Menu Popup (Pure DOM Neo-Brutalist Layer) */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1.5 w-full z-50 bg-white"
          style={{
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: '100%',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px 0px #000000',
            maxHeight: '340px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search Header for Searchable Dropdowns */}
          {searchable && (
            <div
              className="p-2.5 bg-[#f1f5f9] flex flex-col gap-2"
              onClick={(e) => e.stopPropagation()}
              style={{ borderBottom: '3px solid #000000' }}
            >
              <div
                className="flex items-center gap-2 bg-white px-3 py-2 border-2 border-black cursor-text"
                onClick={() => searchInputRef.current?.focus()}
              >
                <Search size={16} className="text-black shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to filter..."
                  className="w-full text-xs sm:text-sm font-bold outline-none bg-transparent py-0.5 text-black placeholder-gray-500"
                  style={{ fontFamily: 'inherit' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 hover:bg-black hover:text-white rounded transition-colors text-black cursor-pointer"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[0.7rem] font-black uppercase text-gray-700 px-1">
                <span>Total: {filteredOptions.length}</span>
                {searchQuery && (
                  <span className="text-blue-700">Filtering by "{searchQuery}"</span>
                )}
              </div>
            </div>
          )}

          {/* Options List with Custom Neo-Brutalist Scrollbar */}
          <div
            ref={optionsListRef}
            className="overflow-y-auto"
            style={{
              maxHeight: searchable ? '280px' : '340px',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                className="p-5 text-center text-xs font-black text-gray-600 uppercase tracking-wider bg-white"
              >
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className="px-4 py-3 sm:py-2.5 min-h-[48px] sm:min-h-[42px] text-xs sm:text-[0.88rem] font-bold cursor-pointer transition-colors flex items-center justify-between border-b-2 border-black last:border-b-0 touch-manipulation active:bg-[#FFE600]"
                    style={{
                      backgroundColor: isSelected
                        ? '#FFE600'
                        : isHighlighted
                        ? '#fffbeb'
                        : '#FFFFFF',
                      color: '#000000',
                      lineHeight: '1.35',
                    }}
                  >
                    <div className="flex flex-col gap-0.5 pr-2 truncate">
                      <span className="truncate">{opt.label}</span>
                      {opt.category && (
                        <span className="text-[0.68rem] font-black text-gray-500 uppercase tracking-wider">
                          {opt.category}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 shrink-0 bg-black text-[#FFE600] px-2 py-0.5 text-[0.7rem] font-black border border-black">
                        <Check size={12} className="stroke-[3]" />
                        <span>SELECTED</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
