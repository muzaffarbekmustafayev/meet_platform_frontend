import React, { useState, useContext, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';


const LANGUAGES = [
    { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
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
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-1.5 rounded-xl border transition-all duration-200 font-medium
                    bg-gray-100 dark:bg-white/8 border-gray-200 dark:border-white/10
                    text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/12
                    hover:text-gray-900 dark:hover:text-white
                    ${compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
                title="Tilni o'zgartirish"
            >
                <Globe size={compact ? 13 : 15} className="shrink-0" />
                <span>{current.flag}</span>
                {!compact && <span>{current.label}</span>}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl z-[200] overflow-hidden">
                    <div className="px-3 pt-2.5 pb-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Til tanlash</p>
                    </div>
                    {LANGUAGES.map((l) => (
                        <button
                            key={l.code}
                            onClick={() => { changeLanguage(l.code); setOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors
                                ${lang === l.code
                                    ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white font-medium'
                                }`}
                        >
                            <span className="text-lg leading-none">{l.flag}</span>
                            <span>{l.label}</span>
                            {lang === l.code && (
                                <span className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageToggle;
