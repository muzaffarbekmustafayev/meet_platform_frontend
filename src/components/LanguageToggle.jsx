import React, { useState, useContext, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';

const LANGUAGES = [
    { code: 'uz', label: "O'zbek", short: "UZ", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', short: "RU", flag: '🇷🇺' },
    { code: 'en', label: 'English', short: "EN", flag: '🇬🇧' },
];

const LanguageToggle = ({ compact = false }) => {
    const { lang, changeLanguage } = useContext(ThemeLanguageContext);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className={`flex items-center gap-1.5 rounded-xl border transition-all duration-200 font-medium select-none
                    bg-gray-100 dark:bg-white/[0.06] border-gray-200 dark:border-white/10
                    text-gray-700 dark:text-gray-300
                    hover:bg-gray-200 dark:hover:bg-white/10
                    hover:text-gray-900 dark:hover:text-white
                    ${open ? 'bg-gray-200 dark:bg-white/10 ring-2 ring-blue-500/20' : ''}
                    ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
                title="Tilni o'zgartirish"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="text-base leading-none">{current.flag}</span>
                {!compact && (
                    <>
                        <span className="font-semibold">{current.short}</span>
                        <ChevronDown
                            size={13}
                            className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                        />
                    </>
                )}
            </button>

            {/* Dropdown */}
            <div
                className={`absolute right-0 top-full mt-2 w-44 bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden
                    transition-all duration-200 origin-top-right
                    ${open ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'}`}
                role="listbox"
            >
                <div className="px-3 pt-2.5 pb-1.5 border-b border-gray-100 dark:border-white/5">
                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Til tanlash</p>
                </div>
                <div className="py-1">
                    {LANGUAGES.map((l) => {
                        const isActive = lang === l.code;
                        return (
                            <button
                                key={l.code}
                                role="option"
                                aria-selected={isActive}
                                onClick={() => { changeLanguage(l.code); setOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors
                                    ${isActive
                                        ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white font-medium'
                                    }`}
                            >
                                <span className="text-xl leading-none">{l.flag}</span>
                                <span className="flex-1 text-left">{l.label}</span>
                                {isActive && (
                                    <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default LanguageToggle;
