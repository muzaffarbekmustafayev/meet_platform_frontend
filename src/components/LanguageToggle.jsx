import React, { useContext } from 'react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';

const LANGUAGES = [
    { code: 'uz', label: "O'zbek", short: "UZ", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', short: "RU", flag: '🇷🇺' },
    { code: 'en', label: 'English', short: "EN", flag: 'en' },
];

const LanguageToggle = ({ compact = false }) => {
    const { lang, changeLanguage } = useContext(ThemeLanguageContext);

    if (compact) {
        return (
            <div className="flex items-center gap-1" role="group" aria-label="Til tanlash">
                {LANGUAGES.map((l) => {
                    const isActive = lang === l.code;
                    return (
                        <button
                            key={l.code}
                            onClick={() => changeLanguage(l.code)}
                            title={l.label}
                            aria-pressed={isActive}
                            className={`flex items-center justify-center w-7 h-6 rounded-md text-sm transition-all duration-200 border
                                ${isActive
                                    ? 'bg-blue-500/20 border-blue-400/60 scale-105'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 opacity-50 hover:opacity-80'}`}
                        >
                            {l.flag}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div
            className="flex items-center p-1 rounded-xl border bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 transition-all duration-200"
            role="group"
            aria-label="Til tanlash"
        >
            {LANGUAGES.map((l) => {
                const isActive = lang === l.code;
                return (
                    <button
                        key={l.code}
                        onClick={() => changeLanguage(l.code)}
                        title={l.label}
                        aria-pressed={isActive}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 select-none
                            ${isActive
                                ? 'bg-white dark:bg-[#2d3748] text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-white/10'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <span className="text-sm leading-none">{l.flag}</span>
                        <span>{l.short}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default LanguageToggle;
