import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';

const TopHeader = ({ title, subtitle, isSidebarOpen, setIsSidebarOpen, actionButton, onNavAction }) => {
    const { lang } = useContext(ThemeLanguageContext);
    const [hostDropdownOpen, setHostDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

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
        { id: 'join', label: lang === 'uz' ? "Qo'shilish" : lang === 'ru' ? 'Войти' : 'Join' },
    ];

    return (
        <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-3 xs:px-4 md:px-8 h-16 flex items-center justify-between sticky top-0 z-30 transition-all shadow-sm">

            {/* Left: mobile menu + page title */}
            <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden p-2 shrink-0 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <span className="text-sm xs:text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 tracking-tight truncate">
                    {title}
                </span>
            </div>

            {/* Right: nav links + controls */}
            <div className="flex items-center gap-1.5 xs:gap-2 md:gap-3 shrink-0">

                {/* Nav links — only large screens */}
                <div className="hidden lg:flex items-center gap-1 mr-1">
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

                {/* Host dropdown — tablet+ */}
                <div className="relative hidden sm:block" ref={dropdownRef}>
                    <button
                        onClick={() => setHostDropdownOpen(v => !v)}
                        className="flex items-center gap-1.5 px-3 xs:px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all hover:shadow-lg"
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
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden xs:block" />

                {/* Language + Theme — compact on mobile, full on xs+ */}
                <div className="flex items-center gap-1.5 xs:gap-2">
                    <LanguageToggle compact={false} />
                    <ThemeToggle compact={false} />
                </div>

                {/* Mobile: Host icon button (only visible < sm) */}
                <button
                    onClick={() => onNavAction && onNavAction('host_video')}
                    className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-500/20"
                    title={lang === 'uz' ? 'Xost' : lang === 'ru' ? 'Провести' : 'Host'}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                </button>

                {actionButton && <div className="ml-1">{actionButton}</div>}
            </div>
        </header>
    );
};

export default TopHeader;
