import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Custom Select component — replaces native <select>
 *
 * Props:
 *   value        — current value
 *   onChange     — (value) => void
 *   options      — [{ value, label, icon?, disabled? }]
 *   placeholder  — string shown when value is empty/null
 *   disabled     — bool
 *   label        — optional label string
 *   className    — extra classes for the trigger button
 *   dropdownClass — extra classes for the dropdown container
 *   size         — 'sm' | 'md' (default 'md')
 */
const Select = ({
    value,
    onChange,
    options = [],
    placeholder = 'Tanlang...',
    disabled = false,
    label,
    className = '',
    dropdownClass = '',
    size = 'md',
}) => {
    const [open, setOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const ref = useRef(null);
    const listRef = useRef(null);
    const uid = useId();

    const selected = options.find(o => o.value === value);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Scroll focused item into view
    useEffect(() => {
        if (open && focusedIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[role="option"]');
            items[focusedIndex]?.scrollIntoView({ block: 'nearest' });
        }
    }, [focusedIndex, open]);

    // Reset focus when opening
    useEffect(() => {
        if (open) {
            const idx = options.findIndex(o => o.value === value);
            setFocusedIndex(idx >= 0 ? idx : 0);
        }
    }, [open]);

    const handleKeyDown = (e) => {
        if (disabled) return;
        const enabledOptions = options.filter(o => !o.disabled);

        if (!open) {
            if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
                e.preventDefault();
                setOpen(true);
            }
            return;
        }

        if (e.key === 'Escape') { setOpen(false); return; }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(i => {
                let next = i + 1;
                while (next < options.length && options[next]?.disabled) next++;
                return next < options.length ? next : i;
            });
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(i => {
                let prev = i - 1;
                while (prev >= 0 && options[prev]?.disabled) prev--;
                return prev >= 0 ? prev : i;
            });
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const opt = options[focusedIndex];
            if (opt && !opt.disabled) {
                onChange(opt.value);
                setOpen(false);
            }
        }
    };

    const sizeClasses = size === 'sm'
        ? 'px-3 py-1.5 text-xs min-h-[32px]'
        : 'px-3.5 py-2.5 text-sm min-h-[40px]';

    return (
        <div ref={ref} className={`relative w-full ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {label && (
                <label
                    htmlFor={uid}
                    className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide"
                >
                    {label}
                </label>
            )}

            {/* Trigger */}
            <button
                id={uid}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(o => !o)}
                onKeyDown={handleKeyDown}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={`w-full flex items-center justify-between gap-2 rounded-xl border transition-all duration-150 font-medium text-left
                    bg-white dark:bg-[#1e2430]
                    border-gray-200 dark:border-white/10
                    text-gray-800 dark:text-gray-100
                    hover:border-blue-400 dark:hover:border-blue-500/60
                    focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
                    ${open ? 'border-blue-500 dark:border-blue-500/70 ring-2 ring-blue-500/20' : ''}
                    ${sizeClasses} ${className}`}
            >
                <span className="flex items-center gap-2 min-w-0 flex-1">
                    {selected?.icon && <span className="shrink-0 text-gray-500 dark:text-gray-400">{selected.icon}</span>}
                    <span className={`truncate ${selected ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                        {selected ? selected.label : placeholder}
                    </span>
                </span>
                <ChevronDown
                    size={14}
                    className={`shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown */}
            <div
                className={`absolute left-0 right-0 top-full z-[300] mt-1.5
                    bg-white dark:bg-[#1e2430]
                    border border-gray-200 dark:border-white/10
                    rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40
                    overflow-hidden transition-all duration-200 origin-top
                    ${open ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}
                    ${dropdownClass}`}
                role="listbox"
                ref={listRef}
            >
                <div className="py-1.5 max-h-56 overflow-y-auto">
                    {options.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center">
                            Hech narsa topilmadi
                        </div>
                    )}
                    {options.map((opt, idx) => {
                        const isSelected = opt.value === value;
                        const isFocused = focusedIndex === idx;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                disabled={opt.disabled}
                                onClick={() => { if (!opt.disabled) { onChange(opt.value); setOpen(false); } }}
                                onMouseEnter={() => !opt.disabled && setFocusedIndex(idx)}
                                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors text-left
                                    ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                                    ${isSelected
                                        ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                                        : isFocused
                                            ? 'bg-gray-50 dark:bg-white/[0.06] text-gray-900 dark:text-white font-medium'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 font-medium'
                                    }`}
                            >
                                {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                                <span className="flex-1 truncate">{opt.label}</span>
                                {isSelected && (
                                    <Check size={14} className="shrink-0 text-blue-500" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Select;
