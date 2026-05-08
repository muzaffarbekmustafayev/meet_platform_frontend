import React, { useContext } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';

const ThemeToggle = ({ compact = false }) => {
    const { theme, toggleTheme } = useContext(ThemeLanguageContext);
    const isDark = theme === 'dark';

    if (compact) {
        return (
            <button
                onClick={toggleTheme}
                title={isDark ? 'Light modega o\'tish' : 'Dark modega o\'tish'}
                aria-label="Toggle theme"
                className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200
                    ${isDark
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-blue-300'
                        : 'bg-gray-100 border-gray-200 hover:bg-gray-200 hover:border-gray-300 text-amber-500'}`}
            >
                {isDark ? <Moon size={14} /> : <Sun size={14} />}
            </button>
        );
    }

    return (
        <div
            className={`flex items-center p-1 rounded-xl border transition-all duration-200
                ${isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gray-100 border-gray-200'}`}
            role="group"
            aria-label="Tema tanlash"
        >
            {/* Light button */}
            <button
                onClick={() => !isDark ? null : toggleTheme()}
                title="Light mode"
                aria-pressed={!isDark}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                    ${!isDark
                        ? 'bg-white text-amber-600 shadow-sm border border-gray-200'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'}`}
            >
                <Sun size={13} />
                <span>Light</span>
            </button>

            {/* Dark button */}
            <button
                onClick={() => isDark ? null : toggleTheme()}
                title="Dark mode"
                aria-pressed={isDark}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                    ${isDark
                        ? 'bg-[#2d3748] text-blue-300 shadow-sm border border-white/10'
                        : 'text-gray-400 hover:text-gray-600'}`}
            >
                <Moon size={13} />
                <span>Dark</span>
            </button>
        </div>
    );
};

export default ThemeToggle;
