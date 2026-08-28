import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { katakanaToHiragana, normalizeSearchText } from '../../utils/string';
import { Input } from './Input';

interface AutocompleteProps {
  id?: string;
  label?: string;
  value: string;
  suggestions: string[];
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  id,
  label,
  value,
  suggestions,
  onChange,
  placeholder,
  disabled,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [isShowingAll, setIsShowingAll] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync state with value prop when parent value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsShowingAll(false);
        // Reset display to current bound value if input doesn't match suggestions
        if (!suggestions.includes(inputValue)) {
          setInputValue(value);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputValue, value, suggestions]);

  // Filter suggestions dynamically
  const getFilteredSuggestions = () => {
    if (isShowingAll || !inputValue) return suggestions;

    // Clean brackets/suffixes like " (でんき)" before normalisation
    const cleanInput = inputValue.replace(/\s*\([^)]+\)$/, '').trim();
    const searchNormalized = normalizeSearchText(cleanInput);
    const searchHiragana = katakanaToHiragana(searchNormalized);

    return suggestions.filter((item) => {
      const itemNormalized = normalizeSearchText(item);
      const itemHiragana = katakanaToHiragana(itemNormalized);
      return (
        itemNormalized.includes(searchNormalized) ||
        itemHiragana.includes(searchHiragana)
      );
    });
  };

  const filtered = getFilteredSuggestions();

  const handleSelect = (val: string) => {
    setInputValue(val);
    onChange(val);
    setIsOpen(false);
    setIsShowingAll(false);
  };

  const toggleDropdown = () => {
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      setIsShowingAll(false);
    } else {
      setIsOpen(true);
      setIsShowingAll(true);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-500 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative w-full flex items-center">
        <Input
          id={id}
          value={inputValue}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setIsShowingAll(false);
            // If cleared, trigger change immediately
            if (e.target.value === '') {
              onChange('');
            }
          }}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              setIsShowingAll(true);
            }
          }}
          className={`${className} pr-8`}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer bg-transparent border-0 p-0 flex items-center"
          style={{ zIndex: 5 }}
        >
          <span className="i-lucide-chevron-down text-base" />
        </button>
      </div>
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg">
          <ul className="py-1 list-none p-0 m-0">
            {filtered.map((item, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 cursor-pointer bg-transparent border-0 outline-none transition font-sans"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
