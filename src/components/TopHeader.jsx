import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';

const TopHeader = ({ title, subtitle, isSidebarOpen, setIsSidebarOpen, actionButton, onNavAction }) => {
    const { theme, toggleTheme, lang, changeLanguage } = useContext(ThemeLanguageContext);
    const [hostDropdownOpen, setHostDropdownOpen] = useState(false);
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setHostDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const navLinks = [
        { id: 'schedule', label: lang === 'uz' ? 'Rejalashtirish' : lang === 'ru' ? 'Запланировать' : 'Schedule' },
        { id: 'join', label: lang === 'uz' ? 'Qo\'shilish' : lang === 'ru' ? 'Войти' : 'Join' },
    ];

    return (
        <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-30 transition-all shadow-sm">
            {/* Left: mobile menu + page title */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 tracking-tight">{title}</span>
            </div>

            {/* Right: nav links + controls */}
            <div className="flex items-center gap-1.5 md:gap-3">
                {/* Nav links */}
                <div className="hidden lg:flex items-center gap-1 mr-2">
                    {navLinks.map(link => (
                        <button
                            key={link.id}
                            onClick={() => onNavAction && onNavAction(link.id)}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                        >
                            {link.label}
                        </button>
                    ))}
                </div>

                {/* Host dropdown */}
                <div className="relative hidden md:block" ref={dropdownRef}>
                    <button
                        onClick={() => setHostDropdownOpen(v => !v)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all hover:shadow-lg"
                    >
                        {lang === 'uz' ? 'Xost' : lang === 'ru' ? 'Провести' : 'Host'}
                        <svg className={`w-4 h-4 transition-transform duration-300 ${hostDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {hostDropdownOpen && (
                        <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg shadow-gray-200/60 dark:shadow-black/30 py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                            {[
                                { id: 'host_video', label: lang === 'uz' ? 'Video uchrashuv' : lang === 'ru' ? 'Видеовстреча' : 'Video Meeting' },
                                { id: 'host_audio', label: lang === 'uz' ? 'Faqat ovoz' : lang === 'ru' ? 'Только аудио' : 'Audio Only' },
                                { id: 'host_screen', label: lang === 'uz' ? 'Ekran ulashish' : lang === 'ru' ? 'Показ экрана' : 'Share Screen' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { onNavAction && onNavAction(item.id); setHostDropdownOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

                {/* Language Switcher */}
                <div className="relative">
                    <button 
                        onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                        onBlur={() => setTimeout(() => setLangDropdownOpen(false), 200)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all bg-white/50 dark:bg-gray-900/50 shadow-sm"
                    >
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="uppercase tracking-wide">{lang}</span>
                    </button>
                    {langDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            {['uz', 'ru', 'en'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => changeLanguage(l)}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${lang === l ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                                >
                                    {l === 'uz' ? 'O\'zbekcha' : l === 'ru' ? 'Русский' : 'English'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-blue-400 bg-gray-50 hover:bg-amber-50 dark:bg-gray-800/50 dark:hover:bg-blue-900/30 rounded-lg transition-all border border-gray-200 dark:border-gray-700/80 shadow-sm"
                    title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                >
                    {theme === 'dark' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>

                {actionButton && <div>{actionButton}</div>}
            </div>
        </header>
    );
};

export default TopHeader;
