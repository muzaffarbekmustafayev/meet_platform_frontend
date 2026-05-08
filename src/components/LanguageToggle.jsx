import React, { useContext } from 'react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';

const LANGUAGES = [
    { code: 'uz', label: "O'zbek",  short: 'UZ' },
    { code: 'ru', label: 'Русский', short: 'RU' },
    { code: 'en', label: 'English', short: 'EN' },
];

const LanguageToggle = ({ compact = false }) => {
    const { lang, changeLanguage } = useContext(ThemeLanguageContext);

    if (compact) {
        return (
            <div className="flex items-center gap-1" role="group" aria-label="Language">
                {LANGUAGES.map((l) => {
                    const isActive = lang === l.code;
                    return (
                        <button
                            key={l.code}
                            onClick={() => changeLanguage(l.code)}
                            title={l.label}
                            aria-pressed={isActive}
                            className={`flex items-center justify-center w-8 h-7 rounded-md text-[11px] font-bold tracking-wide transition-colors duration-150
                                ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'}`}
                        >
                            {l.short}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div
            className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-white/5 transition-colors duration-200"
            role="group"
            aria-label="Language"
        >
            {LANGUAGES.map((l) => {
                const isActive = lang === l.code;
                return (
                    <button
                        key={l.code}
                        onClick={() => changeLanguage(l.code)}
                        title={l.label}
                        aria-pressed={isActive}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-colors duration-150 select-none
                            ${isActive
                                ? 'bg-white dark:bg-[#2d3748] text-gray-900 dark:text-gray-100 shadow-sm'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        {l.short}
                    </button>
                );
            })}
        </div>
    );
};

export default LanguageToggle;
