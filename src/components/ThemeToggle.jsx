import React, { useContext } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';

const ThemeToggle = ({ compact = false }) => {
    const { theme, toggleTheme } = useContext(ThemeLanguageContext);
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`relative flex items-center shrink-0 rounded-full border transition-colors duration-300
                ${isDark
                    ? 'bg-[#1e2430] border-white/10 hover:border-white/20'
                    : 'bg-gray-100 border-gray-200 hover:border-gray-300'}
                ${compact ? 'w-12 h-6' : 'w-14 h-7'}`}
            aria-label="Toggle theme"
        >
            {/* Track icons */}
            <span className={`absolute left-1.5 transition-opacity duration-200 ${isDark ? 'opacity-40' : 'opacity-100'}`}>
                <Sun size={compact ? 10 : 12} className="text-amber-500" />
            </span>
            <span className={`absolute right-1.5 transition-opacity duration-200 ${isDark ? 'opacity-100' : 'opacity-30'}`}>
                <Moon size={compact ? 10 : 12} className="text-blue-400" />
            </span>

            {/* Sliding knob */}
            <span
                className={`absolute top-0.5 flex items-center justify-center rounded-full shadow-md transition-all duration-300 ease-in-out
                    ${isDark ? 'bg-[#2d3748] border border-white/10' : 'bg-white border border-gray-200'}
                    ${compact ? 'w-5 h-5' : 'w-6 h-6'}
                    ${isDark
                        ? compact ? 'translate-x-6' : 'translate-x-7'
                        : 'translate-x-0.5'}`}
            >
                {isDark
                    ? <Moon size={compact ? 9 : 11} className="text-blue-300" />
                    : <Sun size={compact ? 9 : 11} className="text-amber-500" />
                }
            </span>
        </button>
    );
};

export default ThemeToggle;
