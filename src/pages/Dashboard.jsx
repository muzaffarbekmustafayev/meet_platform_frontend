import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../api';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import MeetraLogo from '../MeetraLogo/MeetraLogo';

// Inline lang+theme controls for non-admin navbar
const NavbarControls = ({ lang, changeLanguage, theme, toggleTheme }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 transition-all bg-white/50 dark:bg-gray-900/50 shadow-sm"
                >
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="uppercase tracking-wide">{lang}</span>
                </button>
                {isOpen && (
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
            <button onClick={toggleTheme} className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-blue-400 bg-gray-50 hover:bg-amber-50 dark:bg-gray-800/50 dark:hover:bg-blue-900/30 rounded-lg transition-all border border-gray-200 dark:border-gray-700/80 shadow-sm" title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                {theme === 'dark'
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                }
            </button>
        </div>
    );
};

// ─── Join View ────────────────────────────────────────────────────────────────
const JoinView = ({ t }) => {
    const [roomID, setRoomID] = useState('');
    const navigate = useNavigate();
    const handleJoin = (e) => {
        e.preventDefault();
        if (roomID.trim()) navigate(`/room/${roomID.trim()}`);
    };
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
            <div className="w-full max-w-md bg-white dark:bg-gray-800/90 backdrop-blur-md border border-gray-100 dark:border-gray-700/60 rounded-[2rem] p-8 sm:p-10 shadow-2xl shadow-gray-200/50 dark:shadow-black/20 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <div className="mb-8 relative z-10">
                    <div className="w-14 h-14 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gray-50 dark:bg-gray-800/80 shadow-inner">
                        <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{t('join_meeting')}</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('enter_code')}</p>
                </div>
                <form onSubmit={handleJoin} className="space-y-5 relative z-10">
                    <div className="text-left">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">{t('meeting_id_link')}</label>
                        <input autoFocus type="text" placeholder="123-456-789" value={roomID} onChange={e => setRoomID(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-4 text-base font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                    </div>
                    <button type="submit" disabled={!roomID.trim()}
                        className={`w-full py-4 rounded-xl font-bold text-base transition-all ${roomID.trim() ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 dark:bg-gray-800/80 text-gray-400 cursor-not-allowed border border-transparent'}`}>
                        {t('join_now')}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ─── Schedule View ────────────────────────────────────────────────────────────
const ScheduleView = ({ t, lang }) => {
    const [topic, setTopic] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState('30');
    const [done, setDone] = useState(false);
    const today = new Date().toISOString().split('T')[0];
    const inp = 'w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all';

    const handleSubmit = (e) => { e.preventDefault(); setDone(true); setTimeout(() => setDone(false), 3000); };

    return (
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:py-10">
            <div className="w-full max-w-2xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t('schedule')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('plan_future')}</p>
                </div>
                {done && (
                    <div className="mb-5 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400 font-medium">
                        ✓ {lang === 'uz' ? 'Rejalashtirildi!' : lang === 'ru' ? 'Запланировано!' : 'Scheduled!'}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/60">
                        {/* Topic */}
                        <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-4 items-start px-4 sm:px-6 py-4">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:pt-2">{lang === 'uz' ? 'Mavzu' : lang === 'ru' ? 'Тема' : 'Topic'}</label>
                            <input type="text" placeholder={lang === 'uz' ? 'Mening uchrashuvm' : 'My Meeting'} value={topic} onChange={e => setTopic(e.target.value)} className={inp} />
                        </div>
                        {/* When */}
                        <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-4 items-start px-4 sm:px-6 py-4">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:pt-2">{lang === 'uz' ? 'Qachon' : lang === 'ru' ? 'Когда' : 'When'}</label>
                            <div className="flex flex-col xs:flex-row gap-2 w-full">
                                <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} className={`${inp} flex-1 min-w-0`} />
                                <input type="time" value={time} onChange={e => setTime(e.target.value)} className={`${inp} xs:w-28 shrink-0`} />
                            </div>
                        </div>
                        {/* Duration */}
                        <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-4 items-start px-4 sm:px-6 py-4">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:pt-2">{lang === 'uz' ? 'Davomiyligi' : lang === 'ru' ? 'Длительность' : 'Duration'}</label>
                            <div className="w-full">
                                <select value={duration} onChange={e => setDuration(e.target.value)} className={`${inp} appearance-none cursor-pointer`}>
                                    {['15','30','45','60','90','120'].map(d => <option key={d} value={d}>{d} {lang === 'uz' ? 'daqiqa' : lang === 'ru' ? 'мин' : 'min'}</option>)}
                                </select>
                                {parseInt(duration) > 40 && (
                                    <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/60 rounded-md">
                                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                            ⚠ {lang === 'uz' ? "Bepul rejada 40 daqiqadan ortiq bo'lmaydi." : lang === 'ru' ? 'Бесплатный план ограничен 40 минутами.' : 'Free plan is limited to 40 minutes.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 flex justify-end gap-3">
                        <button type="button" onClick={() => { setTopic(''); setDate(''); setTime(''); setDuration('30'); }}
                            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            {lang === 'uz' ? 'Bekor qilish' : lang === 'ru' ? 'Отмена' : 'Cancel'}
                        </button>
                        <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm">
                            {lang === 'uz' ? 'Rejalashtirish' : lang === 'ru' ? 'Запланировать' : 'Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Landing View (Unauthenticated Dashboard) ─────────────────────────────────
const LandingView = ({ t, lang }) => (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
                Welcome to <span className="text-blue-600">Meetra</span> Platform
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mb-10 leading-relaxed">
                {lang === 'uz' ? 'Zamonaviy, tezkor va xavfsiz video uchrashuvlar tizimi. Barcha loyiha a\'zolari va mehmonlar bilan uzluksiz aloqada bo\'ling.' : 
                 lang === 'ru' ? 'Современная, быстрая и безопасная система видеоконференций. Оставайтесь на связи со всеми участниками проекта и гостями.' : 
                 'Modern, fast, and secure video conferencing system. Stay connected with all project members and guests seamlessly.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 active:scale-95">
                    {lang === 'uz' ? 'Tizimga kirish' : lang === 'ru' ? 'Войти' : 'Log in'}
                </Link>
                <Link to="/register" className="px-8 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold transition-all active:scale-95">
                    {lang === 'uz' ? 'Ro\'yxatdan o\'tish' : lang === 'ru' ? 'Регистрация' : 'Sign Up'}
                </Link>
            </div>
            
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
                <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700/50">
                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">High Quality Video</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Experience crystal clear video calls with adaptive streaming technology.</p>
                </div>
                <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700/50">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Secure & Private</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Your meetings are protected with end-to-end encryption by default.</p>
                </div>
                <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700/50">
                    <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/50 rounded-2xl flex items-center justify-center mb-6 text-orange-600 dark:text-orange-400">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Team Collaboration</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Easily share screens and collaborate with your entire team in real-time.</p>
                </div>
            </div>
        </div>
    </div>
);

// ─── Home View (Meetra) ───────────────────────────────────────────────────────
const HomeView = ({ t, lang, userInfo, onNav, history = [] }) => {
    const [meetingTitle, setMeetingTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [time, setTime] = useState(new Date());
    const navigate = useNavigate();

    // Live clock
    React.useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const handleCreateRoom = async () => {
        setLoading(true);
        try {
            const { data } = await API.post('/api/meetings', { title: meetingTitle || `${userInfo.name}'s Meeting` });
            navigate(`/room/${data.meetingCode}`);
        } catch { alert('Failed to create'); }
        finally { setLoading(false); }
    };

    const hh = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = time.toLocaleDateString(
        lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-US',
        { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }
    );

    // Beautiful Action buttons config
    const actions = [
        {
            id: 'new',
            label: lang === 'uz' ? 'Yangi uchrashuv' : lang === 'ru' ? 'Новая встреча' : 'New Meeting',
            bg: 'gradient-orange',
            iconBg: 'bg-white/25',
            iconColor: 'text-white',
            show: userInfo?.role !== 'admin',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
            onClick: null,
        },
        {
            id: 'join',
            label: lang === 'uz' ? 'Qo\'shilish' : lang === 'ru' ? 'Войти' : 'Join',
            bg: 'gradient-blue',
            iconBg: 'bg-white/25',
            iconColor: 'text-white',
            show: userInfo?.role !== 'admin',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />,
            onClick: () => onNav('join'),
        },
        {
            id: 'schedule',
            label: lang === 'uz' ? 'Rejalashtirish' : lang === 'ru' ? 'Запланировать' : 'Schedule',
            bg: 'gradient-green',
            iconBg: 'bg-white/25',
            iconColor: 'text-white',
            show: true,
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
            onClick: () => onNav('schedule'),
        },
        {
            id: 'share',
            label: lang === 'uz' ? 'Ekran ulashish' : lang === 'ru' ? 'Показ экрана' : 'Share Screen',
            bg: 'gradient-purple',
            iconBg: 'bg-white/25',
            iconColor: 'text-white',
            show: userInfo?.role !== 'admin',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
            onClick: () => onNav('join'),
        },
    ].filter(a => a.show);

    const [showNewMeeting, setShowNewMeeting] = useState(false);

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-gray-950/20 custom-scrollbar">
            {/* Top Hero Section */}
            <div className="relative bg-white dark:bg-[#0d1117] border-b border-gray-100 dark:border-gray-800/60 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
                        <div className="text-center md:text-left flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                System Live
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">
                                {lang === 'uz' ? `Xush kelibsiz, ${userInfo.name}!` : lang === 'ru' ? `Добро пожаловать, ${userInfo.name}!` : `Welcome back, ${userInfo.name}!`}
                            </h1>
                            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md">
                                {lang === 'uz' ? 'Bugungi uchrashuvlarga tayyormisiz? Ish unumdorligini oshiramiz.' : lang === 'ru' ? 'Готовы к встречам? Давайте сделаем этот день продуктивным.' : 'Ready for your meetings today? Let\'s make it productive.'}
                            </p>
                        </div>
                        
                        <div className="shrink-0 text-center md:text-right select-none glass dark:bg-gray-800/40 px-10 py-7 rounded-[2.5rem] border border-white dark:border-white/10 shadow-xl shadow-gray-200/40 dark:shadow-black/40">
                            <p className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums mb-1 font-outfit">{hh}</p>
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{dateStr}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Action Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-16">
                    {actions.map(action => (
                        <button
                            key={action.id}
                            onClick={action.id === 'new' ? () => setShowNewMeeting(v => !v) : action.onClick}
                            className={`${action.bg} rounded-[2rem] p-7 flex flex-col items-start gap-5 shadow-2xl transition-all duration-300 premium-card group relative overflow-hidden`}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/30 transition-colors" />
                            <div className={`w-16 h-16 ${action.iconBg} rounded-[1.25rem] flex items-center justify-center transition-transform relative z-10 shadow-lg backdrop-blur-sm border border-white/20`}>
                                <svg className={`w-8 h-8 ${action.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {action.icon}
                                </svg>
                            </div>
                            <span className="text-white font-extrabold text-lg sm:text-xl tracking-tight relative z-10">{action.label}</span>
                        </button>
                    ))}
                </div>

                {/* New Meeting Input Container */}
                {showNewMeeting && (
                    <div className="mb-16 glass dark:bg-gray-800/80 border border-white/50 dark:border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-gray-200/50 dark:shadow-black/40 flex flex-col sm:flex-row gap-6 items-end animate-in slide-in-from-top-6 duration-500 ease-out">
                        <div className="flex-1 w-full">
                            <div className="flex items-center gap-2 mb-3 ml-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">
                                    {lang === 'uz' ? 'Yangi uchrashuv nomi' : lang === 'ru' ? 'Название новой встречи' : 'New Meeting Title'}
                                </p>
                            </div>
                            <input
                                autoFocus
                                type="text"
                                placeholder={t('meeting_topic')}
                                value={meetingTitle}
                                onChange={e => setMeetingTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateRoom()}
                                className="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl px-6 py-5 text-lg font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                            />
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <button onClick={() => setShowNewMeeting(false)}
                                className="px-8 py-5 text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-2xl transition-all flex-1 sm:flex-none active:scale-95">
                                {lang === 'uz' ? 'Bekor' : lang === 'ru' ? 'Отмена' : 'Cancel'}
                            </button>
                            <button onClick={handleCreateRoom} disabled={loading}
                                className="px-10 py-5 gradient-blue text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-blue-500/30 disabled:opacity-50 flex-1 sm:flex-none active:scale-95">
                                {loading ? t('starting') : t('start_meeting')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Dashboard Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left: Recent Activity */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800/40 rounded-[2.5rem] border border-gray-100 dark:border-gray-800/60 shadow-sm p-8 sm:p-10 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-blue-500 rounded-full" />
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                    {lang === 'uz' ? 'So\'nggi uchrashuvlar' : lang === 'ru' ? 'Последние встречи' : 'Recent Meetings'}
                                </h2>
                            </div>
                            <button onClick={() => onNav('history')} className="px-5 py-2 rounded-full bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-800">
                                {lang === 'uz' ? 'Barchasi' : lang === 'ru' ? 'Все' : 'View All'}
                            </button>
                        </div>
                        
                        {history.length > 0 ? (
                            <div className="space-y-4">
                                {history.slice(0, 3).map(m => (
                                    <div key={m._id} onClick={() => navigate(`/room/${m.meetingCode}`)} className="group p-6 rounded-3xl bg-gray-50/50 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/20 dark:hover:shadow-black/20">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-transform">
                                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">{m.title}</h3>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{new Date(m.createdAt).toLocaleDateString()} <span className="mx-2 opacity-30">•</span> ID: {m.meetingCode}</p>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 shadow-md flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 px-4 rounded-3xl bg-gray-50/50 dark:bg-gray-900/40 border-2 border-dashed border-gray-200 dark:border-gray-800">
                                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <p className="text-base font-bold text-gray-500 dark:text-gray-400">
                                    {lang === 'uz' ? 'Hali uchrashuvlar mavjud emas.' : lang === 'ru' ? 'Нет недавних встреч.' : 'No recent meetings yet.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right: Personal Info snippet or tip */}
                    <div className="lg:col-span-1 gradient-purple rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-[-10%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none transition-transform duration-700" />
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md shadow-lg border border-white/20">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                            </div>
                            <h3 className="text-3xl font-black mb-4 tracking-tight leading-tight">Meetra Pro</h3>
                            <p className="text-white/80 text-lg font-medium mb-10 leading-relaxed">
                                {lang === 'uz' ? 'Cheksiz vaqt va yuqori sifat uchun Pro tarifiga o\'ting.' : lang === 'ru' ? 'Перейдите на Pro для неограниченного времени и высокого качества.' : 'Upgrade to Pro for unlimited time and high quality video.'}
                            </p>
                            <button className="mt-auto w-full py-5 bg-white text-purple-600 rounded-2xl font-black text-base hover:bg-gray-50 transition-all shadow-xl active:scale-95">
                                {lang === 'uz' ? 'Batafsil' : lang === 'ru' ? 'Подробнее' : 'Learn More'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};






// ─── Profile View ─────────────────────────────────────────────────────────────
const ProfileView = ({ t, lang, userInfo: authInfo }) => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(authInfo);
    const [pinnedMeetings, setPinnedMeetings] = useState([]);
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [followModal, setFollowModal] = useState(null); // 'following' | 'followers' | null
    
    // Search Users State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Edit Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', bio: '', links: [] });
    const [saving, setSaving] = useState(false);

    const openEdit = () => {
        setEditForm({
            name: profile?.name || '',
            bio: profile?.bio || '',
            links: profile?.links || []
        });
        setIsEditing(true);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await API.put('/api/users/profile', editForm);
            setProfile(data);
            setIsEditing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };
    
    const addLink = () => {
        if (editForm.links.length < 5) {
            setEditForm({ ...editForm, links: [...editForm.links, { title: '', url: '' }] });
        }
    };
    
    const updateLink = (index, field, value) => {
        const newLinks = [...editForm.links];
        newLinks[index][field] = value;
        setEditForm({ ...editForm, links: newLinks });
    };
    
    const removeLink = (index) => {
        const newLinks = [...editForm.links];
        newLinks.splice(index, 1);
        setEditForm({ ...editForm, links: newLinks });
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const [profRes, pinRes, actRes] = await Promise.all([
                    API.get('/api/users/profile'),
                    API.get('/api/meetings/pinned'),
                    API.get('/api/meetings/activity')
                ]);
                setProfile(profRes.data);
                setPinnedMeetings(pinRes.data);
                setActivity(actRes.data);
            } catch (err) {
                console.error("Failed to load profile data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfileData();
    }, []);

    const handleSearch = async (e) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (q.trim().length > 1) {
            setIsSearching(true);
            try {
                const { data } = await API.get(`/api/users/search?q=${q}`);
                setSearchResults(data);
            } catch (err) { console.error(err); }
            finally { setIsSearching(false); }
        } else {
            setSearchResults([]);
        }
    };

    const handleFollow = async (userId) => {
        try {
            await API.post(`/api/users/follow/${userId}`);
            // Refresh search results or profile to show following status
            const { data } = await API.get(`/api/users/search?q=${searchQuery}`);
            setSearchResults(data);
            // Also refresh profile if needed
            const profRes = await API.get('/api/users/profile');
            setProfile(profRes.data);
        } catch (err) { console.error(err); }
    };

    const roleColors = {
        admin: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        user:  'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        guest: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    };
    const roleColor = roleColors[profile?.role] || roleColors.guest;
    const avatarInitial = profile?.name?.[0]?.toUpperCase() || '?';
    const username = profile?.email ? profile.email.split('@')[0].toLowerCase() : 'user';

    const heatmapWeeks = activity?.heatmap || Array.from({ length: 52 }, () => Array.from({ length: 7 }, () => 0));
    const totalMeetings = activity?.totalMeetings || 0;
    const timeline = activity?.timeline || [];

    const getHeatmapColor = (level) => {
        if (level === 0) return 'bg-gray-100 dark:bg-gray-800';
        if (level === 1) return 'bg-blue-200 dark:bg-blue-900/50';
        if (level === 2) return 'bg-blue-400 dark:bg-blue-700/60';
        if (level === 3) return 'bg-blue-600 dark:bg-blue-600';
        return 'bg-blue-800 dark:bg-blue-500';
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-900 gap-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-8 md:py-10 bg-white dark:bg-gray-900 relative">
            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Profile</h2>
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                                <textarea value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} rows="3" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                            
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Social Links (Max 5)</label>
                                    <button type="button" onClick={addLink} disabled={editForm.links.length >= 5} className="text-xs text-blue-600 dark:text-blue-400 font-medium disabled:opacity-50">
                                        + Add Link
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {editForm.links.map((link, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input type="text" placeholder="Title (e.g. GitHub)" value={link.title} onChange={(e) => updateLink(idx, 'title', e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                                            <input type="url" placeholder="URL" value={link.url} onChange={(e) => updateLink(idx, 'url', e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
                                            <button type="button" onClick={() => removeLink(idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                            </button>
                                        </div>
                                    ))}
                                    {editForm.links.length === 0 && <p className="text-xs text-gray-500">No links added.</p>}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md">Cancel</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50">
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
                
                {/* 1. Left Sidebar (User details) */}
                <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col">
                    <div className="relative mb-4 shrink-0">
                        <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto md:mx-0 rounded-full border border-gray-200 dark:border-gray-700 bg-blue-600 flex items-center justify-center text-7xl font-bold text-white shadow-sm overflow-hidden z-10 relative">
                            {avatarInitial}
                        </div>
                        <div className="absolute bottom-4 right-1/2 translate-x-16 md:translate-x-20 w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-xl shadow-sm z-20" title="Set status">
                            🎯
                        </div>
                    </div>
                    
                    <div className="text-center md:text-left mb-4">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{profile?.name}</h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400 font-light mb-4">@{username}</p>
                        
                        <p className="text-sm text-gray-800 dark:text-gray-300 mb-5 leading-relaxed">
                            {profile?.bio || (lang === 'uz' ? 'Zamonaviy video aloqa tizimi ishqibozi. Loyihalarni osonlashtirishga ishtiyoqmand.' : lang === 'ru' ? 'Энтузиаст современных систем видеосвязи. Страстно желаю упрощать проекты.' : 'Enthusiast of modern video communication systems. Passionate about streamlining projects.')}
                        </p>
                        
                        <button onClick={openEdit} className="w-full py-1.5 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors shadow-sm mb-5">
                            {lang === 'uz' ? 'Profilni tahrirlash' : lang === 'ru' ? 'Редактировать профиль' : 'Edit profile'}
                        </button>

                        <div className="flex items-center justify-center md:justify-start gap-1 text-sm text-gray-600 dark:text-gray-400 mb-6">
                            <button onClick={() => setFollowModal('following')} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                <span className="font-semibold text-gray-900 dark:text-white">{profile?.following?.length || 0}</span>
                                <span>{lang === 'uz' ? 'Kuzatilayotgan' : lang === 'ru' ? 'Подписки' : 'Following'}</span>
                            </button>
                            <span className="mx-1">•</span>
                            <button onClick={() => setFollowModal('followers')} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                <span className="font-semibold text-gray-900 dark:text-white">{profile?.followers?.length || 0}</span>
                                <span>{lang === 'uz' ? 'Kuzatuvchilar' : lang === 'ru' ? 'Подписчики' : 'Followers'}</span>
                            </button>
                        </div>

                        {/* User Search Section */}
                        <div className="mb-8">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={lang === 'uz' ? 'User qidirish...' : lang === 'ru' ? 'Поиск пользователей...' : 'Search users...'}
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                                <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-2 shadow-xl relative z-20">
                                    {searchResults.map(user => (
                                        <div key={user._id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-lg transition-colors border border-transparent">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {user.name[0].toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                                    <p className="text-[10px] text-gray-500 truncate">@{user.username}</p>
                                                </div>
                                            </div>
                                            {profile?.following?.some(f => (f._id || f) === user._id) ? (
                                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                                                    {lang === 'uz' ? 'Kuzatilmoqda' : 'Following'}
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleFollow(user._id)}
                                                    className="text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md transition-colors"
                                                >
                                                    {lang === 'uz' ? 'Kuzatish' : 'Follow'}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                <a href={`mailto:${profile?.email}`} className="hover:text-blue-600 hover:underline truncate">{profile?.email}</a>
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                <a href="#" className="hover:text-blue-600 hover:underline truncate">zoom.clone/{username}</a>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${roleColor}`}>
                                    {profile?.role || 'Guest'}
                                </span>
                            </li>
                            {profile?.links?.map((link, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline truncate" title={link.title}>{link.title}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* 2. Right Main Area */}
                <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col gap-8">
                    
                    {/* Pinned Meetings */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                {lang === 'uz' ? 'Qadalgan xonalar' : lang === 'ru' ? 'Закрепленные комнаты' : 'Pinned Rooms'}
                            </h2>
                            <button className="text-sm text-blue-600 hover:underline">Customize your pins</button>
                        </div>
                        {pinnedMeetings.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pinnedMeetings.map((room, i) => (
                                    <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md dark:hover:border-gray-600 bg-white dark:bg-gray-800 transition-all flex flex-col h-32 justify-between group">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 onClick={() => navigate(`/room/${room.meetingCode}`)} className="text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:underline cursor-pointer flex items-center gap-2 truncate">
                                                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                                    {room.title}
                                                </h3>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${!room.password ? 'border-gray-200 text-gray-500 dark:border-gray-600 dark:text-gray-400' : 'border-amber-200 text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800/50'}`}>
                                                    {!room.password ? 'Public' : 'Private'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                Created on {new Date(room.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => navigate(`/room/${room.meetingCode}`)} className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-md transition-colors">
                                                Start Meeting
                                            </button>
                                            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/room/${room.meetingCode}`); }} className="text-xs font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors">
                                                Copy Link
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-500">No pinned rooms yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Activity Heatmap */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                            {lang === 'uz' ? `So'nggi yildagi ${totalMeetings} ta uchrashuv` : `${totalMeetings} meetings in the last year`}
                        </h2>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 md:p-6 bg-white dark:bg-gray-800">
                            <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar">
                                {heatmapWeeks.map((week, wIdx) => (
                                    <div key={wIdx} className="flex flex-col gap-1 shrink-0">
                                        {week.map((level, dIdx) => (
                                            <div key={dIdx} className={`w-[10px] h-[10px] rounded-[2px] ${getHeatmapColor(level)}`} title={`${level} meetings`} />
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <a href="#" className="hover:text-blue-600">{lang === 'uz' ? "Qanday hisoblashimizni bilib oling" : lang === 'ru' ? 'Как мы считаем встречи' : 'Learn how we count meetings'}</a>
                                <div className="flex items-center gap-1">
                                    <span>{lang === 'uz' ? 'Kamroq' : lang === 'ru' ? 'Меньше' : 'Less'}</span>
                                    {[0, 1, 2, 3, 4].map(l => <div key={l} className={`w-[10px] h-[10px] rounded-[2px] ${getHeatmapColor(l)}`} />)}
                                    <span>{lang === 'uz' ? 'Ko\'proq' : lang === 'ru' ? 'Больше' : 'More'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="flex gap-8">
                        <div className="flex-1">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                                {lang === 'uz' ? 'Faollik xronologiyasi' : 'Activity timeline'}
                            </h2>
                            
                            <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3 pb-8">
                                {timeline.length > 0 ? timeline.map((block, i) => (
                                    <div key={i} className="mb-6 relative">
                                        <div className="absolute -left-[5.5px] top-1 w-2.5 h-2.5 bg-white dark:bg-gray-900 rounded-full" />
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-4 bg-white dark:bg-gray-900 inline-block pr-2 relative -top-1">
                                            {block.month}
                                        </h3>
                                        <div className="pl-6 pt-4 space-y-4">
                                            {block.events.map((ev, j) => (
                                                <div key={j} className="flex items-start gap-3">
                                                    <div className={`mt-0.5 p-1.5 rounded-full ${ev.type === 'meeting' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'}`}>
                                                        {ev.type === 'meeting' ? (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-600 dark:text-gray-300">{ev.text}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{ev.date}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="pl-6 text-sm text-gray-500">No recent activity.</div>
                                )}
                            </div>
                        </div>

                        {/* Year filter side */}
                        <div className="hidden sm:block w-24">
                            <div className="sticky top-20 flex flex-col gap-1">
                                <button className="text-sm text-left px-3 py-1.5 rounded-md font-semibold text-white bg-blue-600">{new Date().getFullYear()}</button>
                                <button className="text-sm text-left px-3 py-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">{new Date().getFullYear()-1}</button>
                                <button className="text-sm text-left px-3 py-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">{new Date().getFullYear()-2}</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Following / Followers Modal */}
            {followModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setFollowModal(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                <button onClick={() => setFollowModal('following')}
                                    className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
                                        followModal === 'following'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}>
                                    {lang === 'uz' ? 'Kuzatilayotgan' : lang === 'ru' ? 'Подписки' : 'Following'} ({profile?.following?.length || 0})
                                </button>
                                <button onClick={() => setFollowModal('followers')}
                                    className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
                                        followModal === 'followers'
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}>
                                    {lang === 'uz' ? 'Kuzatuvchilar' : lang === 'ru' ? 'Подписчики' : 'Followers'} ({profile?.followers?.length || 0})
                                </button>
                            </div>
                            <button onClick={() => setFollowModal(null)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        {/* User List */}
                        <div className="overflow-y-auto flex-1 divide-y divide-gray-50 dark:divide-gray-700/50">
                            {(followModal === 'following' ? (profile?.following || []) : (profile?.followers || [])).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                    <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                    <p className="text-sm font-medium">
                                        {lang === 'uz' ? 'Hali hech kim yo\'q' : lang === 'ru' ? 'Пока никого нет' : 'Nobody here yet'}
                                    </p>
                                </div>
                            ) : (
                                (followModal === 'following' ? (profile?.following || []) : (profile?.followers || [])).map(user => (
                                    <div key={user._id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                            {user.avatar && !user.avatar.includes('anonymous') ? (
                                                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                user.name?.[0]?.toUpperCase() || '?'
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const HistoryView = ({ t, lang, history, onDelete, onUpdate }) => {
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const navigate = useNavigate();

    const handleEditClick = (e, m) => {
        e.stopPropagation();
        setEditingId(m._id);
        setEditTitle(m.title);
    };

    const handleSave = (e, id) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            onUpdate(id, editTitle.trim());
        }
        setEditingId(null);
    };

    return (
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:py-10 bg-gray-50 dark:bg-gray-900/50">
            <div className="w-full max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    {lang === 'uz' ? 'Uchrashuvlarim' : lang === 'ru' ? 'Мои встречи' : 'My Meetings'}
                </h2>
                {history.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-gray-700/50">
                        {history.map(m => (
                            <div key={m._id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer" onClick={() => editingId !== m._id && navigate(`/room/${m.meetingCode}`)}>
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                    </div>
                                    <div className="flex-1">
                                        {editingId === m._id ? (
                                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    value={editTitle} 
                                                    onChange={e => setEditTitle(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleSave(e, m._id)}
                                                    className="bg-white dark:bg-gray-900 border border-blue-500 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                                <button onClick={(e) => handleSave(e, m._id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">Saqlash</button>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingId(null); }} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Bekor</button>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-base group-hover:text-blue-600 transition-colors">{m.title}</h3>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{new Date(m.createdAt).toLocaleString()} • ID: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{m.meetingCode}</span></p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                {editingId !== m._id && (
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                                        <button onClick={(e) => handleEditClick(e, m)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Tahrirlash">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                        </button>
                                        <button onClick={(e) => onDelete(e, m._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="O'chirish">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white dark:bg-gray-800/80 backdrop-blur-md rounded-[2rem] border border-gray-100 dark:border-gray-700/50 shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <p className="text-base font-medium text-gray-500 dark:text-gray-400">
                            {lang === 'uz' ? 'Hali uchrashuvlar mavjud emas' : lang === 'ru' ? 'Нет встреч' : 'No meetings found'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};



// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
    const location = useLocation();
    const [history, setHistory] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const { t, lang, theme, toggleTheme, changeLanguage } = useContext(ThemeLanguageContext);
    const isAdmin = userInfo?.role === 'admin';

    let view = 'home';
    if (location.pathname.includes('/dashboard/join')) view = 'join';
    else if (location.pathname.includes('/dashboard/schedule')) view = 'schedule';
    else if (location.pathname.includes('/dashboard/profile')) view = 'profile';
    else if (location.pathname.includes('/dashboard/history')) view = 'history';
    
    const setView = (v) => {
        if (v === 'home') navigate('/dashboard');
        else navigate(`/dashboard/${v}`);
    };

    useEffect(() => {
        if (userInfo?.token) {
            API.get('/api/meetings').then(({ data }) => setHistory(data)).catch(() => {});
        }
    }, []);

    const handleDeleteMeeting = async (e, id) => {
        e.stopPropagation();
        if (window.confirm(lang === 'uz' ? 'Ushbu uchrashuvni o\'chirmoqchimisiz?' : 'Delete this meeting?')) {
            try { await API.delete(`/api/meetings/${id}`); setHistory(h => h.filter(m => m._id !== id)); }
            catch { alert('Failed'); }
        }
    };

    const handleUpdateMeeting = async (id, newTitle) => {
        try { 
            await API.put(`/api/meetings/${id}`, { title: newTitle }); 
            setHistory(h => h.map(m => m._id === id ? { ...m, title: newTitle } : m)); 
        }
        catch { alert('Failed to update meeting'); }
    };

    const handleLogout = () => { localStorage.removeItem('userInfo'); window.location.reload(); };

    // Admin sidebar nav items
    const adminNavItems = [
        { id: 'home', label: t('dashboard'), isActive: view === 'home', onClick: () => setView('home'), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
        { id: 'profile', label: t('profile'), isActive: view === 'profile', onClick: () => setView('profile'), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        { id: 'admin', label: t('admin_console'), path: '/admin', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> },
    ];

    const recentContent = isAdmin && history.length > 0 && (
        <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('recent_meetings')}</p>
            <div className="space-y-0.5">
                {history.slice(0, 5).map(m => (
                    <div key={m._id} onClick={() => navigate(`/room/${m.meetingCode}`)} className="group px-2 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer flex justify-between items-center transition-colors">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 truncate">{m.title}</p>
                            <p className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button onClick={e => handleDeleteMeeting(e, m._id)} className="ml-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ))}
            </div>
        </>
    );

    const mainContent = (
        <>
            {view === 'home' && (userInfo ? <HomeView t={t} lang={lang} userInfo={userInfo} onNav={setView} history={history} /> : <LandingView t={t} lang={lang} />)}
            {view === 'join' && <JoinView t={t} />}
            {view === 'schedule' && <ScheduleView t={t} lang={lang} />}
            {view === 'profile' && <ProfileView t={t} lang={lang} userInfo={userInfo} />}
            {view === 'history' && <HistoryView t={t} lang={lang} history={history} onDelete={handleDeleteMeeting} onUpdate={handleUpdateMeeting} />}
        </>
    );

    // ── ADMIN: sidebar layout ──────────────────────────────────────────────────
    if (isAdmin) {
        return (
            <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans overflow-hidden transition-colors">
                <Sidebar
                    title="Meetra" titleInitial="M"
                    navigationItems={adminNavItems}
                    userInfo={userInfo} handleLogout={handleLogout}
                    isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
                    extraContent={recentContent}
                />
                <main className="flex-1 overflow-y-auto flex flex-col min-h-0">
                    <TopHeader
                        title={view === 'home' ? t('dashboard') : view === 'join' ? t('join_meeting') : view === 'schedule' ? t('schedule') : t('profile')}
                        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
                        onNavAction={(id) => { if (['join','schedule','profile'].includes(id)) setView(id); }}
                    />
                    {mainContent}
                </main>
            </div>
        );
    }

    // ── NON-ADMIN: full-width navbar layout ───────────────────────────────────
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navLinks = userInfo ? [
        { id: 'home', label: t('dashboard') },
        { id: 'history', label: lang === 'uz' ? 'Uchrashuvlarim' : lang === 'ru' ? 'Мои встречи' : 'My Meetings' },
        { id: 'join', label: t('join_meeting') },
        { id: 'schedule', label: t('schedule') },
    ] : [];

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans overflow-hidden transition-colors">
            {/* Navbar */}
            <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 h-16 flex items-center justify-between px-4 sm:px-6 md:px-10 sticky top-0 z-30 shrink-0 transition-all shadow-sm">
                {/* Left: Logo */}
                <div className="flex items-center gap-3">
                    <MeetraLogo className="w-9 h-9" />
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400 tracking-tight hidden sm:block">Meetra</span>
                </div>

                {/* Center: Nav links — desktop only */}
                <nav className="hidden md:flex items-center gap-2 lg:gap-4">
                    {navLinks.map(link => (
                        <button key={link.id} onClick={() => setView(link.id)}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                                view === link.id
                                    ? 'text-white bg-blue-600 shadow-md shadow-blue-500/30'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}>
                            {link.label}
                        </button>
                    ))}
                </nav>

                {/* Right: controls */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <NavbarControls lang={lang} changeLanguage={changeLanguage} theme={theme} toggleTheme={toggleTheme} />
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />
                    
                    {userInfo ? (
                        <>
                            <div
                                onClick={() => setView('profile')}
                                className="w-8 h-8 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-all shrink-0"
                                title="Profile"
                            >
                                {userInfo?.name?.[0]?.toUpperCase()}
                            </div>
                            <button onClick={handleLogout} className="hidden sm:block text-xs font-semibold text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors ml-1 uppercase tracking-wider">
                                {t('sign_out')}
                            </button>
                        </>
                    ) : (
                        <div className="hidden sm:flex items-center gap-2 ml-2">
                            <Link to="/login" className="px-4 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                {lang === 'uz' ? 'Kirish' : lang === 'ru' ? 'Войти' : 'Log in'}
                            </Link>
                            <Link to="/register" className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm">
                                {lang === 'uz' ? 'Ro\'yxatdan o\'tish' : lang === 'ru' ? 'Регистрация' : 'Register'}
                            </Link>
                        </div>
                    )}

                    {/* Hamburger — mobile only */}
                    <button
                        onClick={() => setMobileMenuOpen(v => !v)}
                        className="md:hidden p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Menu"
                    >
                        {mobileMenuOpen
                            ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        }
                    </button>
                </div>
            </header>

            {/* Mobile dropdown menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-2 z-20 shrink-0 shadow-sm">
                    {navLinks.map(link => (
                        <button key={link.id}
                            onClick={() => { setView(link.id); setMobileMenuOpen(false); }}
                            className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg mb-0.5 transition-colors ${
                                view === link.id
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}>
                            {link.label}
                        </button>
                    ))}
                    <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-2 pb-1">
                        {userInfo ? (
                            <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors">
                                {t('sign_out')}
                            </button>
                        ) : (
                            <div className="flex flex-col gap-2 px-1">
                                <Link to="/login" className="w-full text-center px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    {lang === 'uz' ? 'Kirish' : lang === 'ru' ? 'Войти' : 'Log in'}
                                </Link>
                                <Link to="/register" className="w-full text-center px-3 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg">
                                    {lang === 'uz' ? 'Ro\'yxatdan o\'tish' : lang === 'ru' ? 'Регистрация' : 'Register'}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-y-auto flex flex-col min-h-0">
                {mainContent}
            </main>
        </div>
    );
};

export default Dashboard;
