import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import { ChevronDown, Globe } from 'lucide-react';

const LANGUAGES = [
    { code: 'uz', label: "O'zbek",  short: 'UZ' },
    { code: 'ru', label: 'Русский', short: 'RU' },
    { code: 'en', label: 'English', short: 'EN' },
];

const LanguageToggle = ({ compact = false }) => {
    const { lang, changeLanguage } = useContext(ThemeLanguageContext);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (code) => {
        changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 rounded-xl transition-all duration-200 shadow-sm
                    ${compact 
                        ? 'h-9 px-2.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5' 
                        : 'px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-transparent dark:border-white/5'
                    }
                    ${isOpen ? 'ring-2 ring-blue-500/50 border-blue-500/30' : ''}`}
            >
                <Globe size={compact ? 14 : 16} className="text-blue-500" />
                <span className={`font-bold transition-all ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    {compact ? currentLang.short : currentLang.label}
                </span>
                <ChevronDown 
                    size={14} 
                    className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {isOpen && (
                <div className={`absolute z-[100] mt-2 rounded-xl border border-white/10 bg-[#1e222d] shadow-2xl overflow-hidden py-1 min-w-[120px] animate-in fade-in zoom-in-95 duration-200
                    ${compact ? 'right-0' : 'left-0'}`}>
                    {LANGUAGES.map((l) => (
                        <button
                            key={l.code}
                            onClick={() => handleSelect(l.code)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors
                                ${lang === l.code 
                                    ? 'bg-blue-600/10 text-blue-400' 
                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                        >
                            <span>{l.label}</span>
                            {lang === l.code && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageToggle;
