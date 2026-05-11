import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../api';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import Select from '../components/Select';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../components/ConfirmModal';
import ComingSoonModal from '../components/ComingSoonModal';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Meetra';

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
    const [roomType, setRoomType] = useState('public');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(null); // { code, title }
    const today = new Date().toISOString().split('T')[0];
    const navigate = useNavigate();
    const toast = useToast();

    const inp = 'w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-700 transition-all';

    const generatePin = () => {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        setPassword(String(arr[0] % 1000000).padStart(6, '0'));
    };

    const copyPassword = () => {
        navigator.clipboard.writeText(password).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const isPasswordValid = roomType === 'private' ? password.length >= 6 : true;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (roomType === 'private' && password.length < 6) {
            toast.error(lang === 'uz' ? 'Kamida 6 xonali parol kiriting' : lang === 'ru' ? 'Введите пароль минимум 6 цифр' : 'Enter at least 6-digit password');
            return;
        }
        setLoading(true);
        try {
            const { data } = await API.post('/api/meetings', {
                title: topic || undefined,
                roomType,
                password: roomType === 'private' ? password : undefined,
            });
            setDone({ code: data.meetingCode, title: data.title });
        } catch (err) {
            toast.error(err.response?.data?.message || t('action_failed'));
        } finally {
            setLoading(false);
        }
    };

    const reset = () => { setTopic(''); setDate(''); setTime(''); setDuration('30'); setRoomType('public'); setPassword(''); setDone(null); };

    // ── Success screen ──────────────────────────────────────────────────────────
    if (done) return (
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:py-10">
            <div className="w-full max-w-lg mx-auto">
                <div className="bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-2xl p-8 text-center shadow-sm">
                    <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {lang === 'uz' ? 'Rejalashtirildi!' : lang === 'ru' ? 'Запланировано!' : 'Scheduled!'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{done.title}</p>

                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{done.code}</span>
                        <button onClick={() => { navigator.clipboard.writeText(done.code); toast.success(t('pw_copied')); }}
                            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                            {lang === 'uz' ? 'Nusxa' : lang === 'ru' ? 'Копировать' : 'Copy'}
                        </button>
                    </div>

                    {roomType === 'private' && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
                            <div className="text-left">
                                <p className="text-xs text-purple-500 font-semibold mb-0.5">{lang === 'uz' ? 'Xona paroli' : lang === 'ru' ? 'Пароль комнаты' : 'Room password'}</p>
                                <p className="text-lg font-mono font-bold text-purple-700 dark:text-purple-300 tracking-widest">{password}</p>
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(password); toast.success(t('pw_copied')); }}
                                className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                                {lang === 'uz' ? 'Nusxa' : lang === 'ru' ? 'Копировать' : 'Copy'}
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button onClick={reset} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                            {lang === 'uz' ? 'Yangi' : lang === 'ru' ? 'Новое' : 'New'}
                        </button>
                        <button onClick={() => navigate(`/room/${done.code}`)}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">
                            {lang === 'uz' ? 'Boshlash' : lang === 'ru' ? 'Начать' : 'Start Now'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:py-10">
            <div className="w-full max-w-2xl mx-auto">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t('schedule')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('plan_future')}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/60">

                        {/* Topic */}
                        <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-4 items-start px-4 sm:px-6 py-4">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:pt-2">
                                {lang === 'uz' ? 'Mavzu' : lang === 'ru' ? 'Тема' : 'Topic'}
                            </label>
                            <input type="text" placeholder={lang === 'uz' ? 'Mening uchrashuvm' : lang === 'ru' ? 'Моя встреча' : 'My Meeting'}
                                value={topic} onChange={e => setTopic(e.target.value)} className={inp} />
                        </div>

                        {/* When */}
                        <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-4 items-start px-4 sm:px-6 py-4">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:pt-2">
                                {lang === 'uz' ? 'Qachon' : lang === 'ru' ? 'Когда' : 'When'}
                            </label>
                            <div className="flex flex-col xs:flex-row gap-2 w-full">
                                <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} className={`${inp} flex-1 min-w-0`} />
                                <input type="time" value={time} onChange={e => setTime(e.target.value)} className={`${inp} xs:w-28 shrink-0`} />
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-4 items-start px-4 sm:px-6 py-4">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:pt-2">
                                {lang === 'uz' ? 'Davomiyligi' : lang === 'ru' ? 'Длительность' : 'Duration'}
                            </label>
                            <div className="w-full">
                                <Select
                                    value={duration}
                                    onChange={setDuration}
                                    options={['15','30','45','60','90','120'].map(d => ({
                                        value: d,
                                        label: `${d} ${lang === 'uz' ? 'daqiqa' : lang === 'ru' ? 'мин' : 'min'}`
                                    }))}
                                />
                                {parseInt(duration) > 40 && (
                                    <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/60 rounded-md">
                                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                            ⚠ {lang === 'uz' ? "Bepul rejada 40 daqiqadan ortiq bo'lmaydi." : lang === 'ru' ? 'Бесплатный план ограничен 40 минутами.' : 'Free plan is limited to 40 minutes.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Room Type */}
                        <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-4 items-start px-4 sm:px-6 py-4">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400 sm:pt-2">
                                {lang === 'uz' ? 'Xona turi' : lang === 'ru' ? 'Тип комнаты' : 'Room type'}
                            </label>
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <button type="button" onClick={() => { setRoomType('public'); setPassword(''); }}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${roomType === 'public' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-300'}`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    {lang === 'uz' ? 'Ommaviy' : lang === 'ru' ? 'Публичный' : 'Public'}
                                </button>
                                <button type="button" onClick={() => setRoomType('private')}
                                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${roomType === 'private' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-600 dark:text-purple-400' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-purple-300'}`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    {lang === 'uz' ? 'Shaxsiy' : lang === 'ru' ? 'Приватный' : 'Private'}
                                </button>
                            </div>
                        </div>

                        {/* Password — only private */}
                        {roomType === 'private' && (
                            <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-4 items-start px-4 sm:px-6 py-4 bg-purple-50/30 dark:bg-purple-900/10">
                                <label className="text-sm font-medium text-purple-600 dark:text-purple-400 sm:pt-2">
                                    {lang === 'uz' ? 'Parol *' : lang === 'ru' ? 'Пароль *' : 'Password *'}
                                </label>
                                <div className="w-full space-y-2">
                                    {/* Input row */}
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder={lang === 'uz' ? '6 xonali raqam' : lang === 'ru' ? '6-значный код' : '6-digit code'}
                                                value={password}
                                                onChange={e => setPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                inputMode="numeric"
                                                maxLength={6}
                                                className={`${inp} pr-10 font-mono tracking-widest ${password.length > 0 && password.length < 6 ? 'border-red-400 focus:border-red-400' : password.length === 6 ? 'border-green-400 focus:border-green-400' : ''}`}
                                            />
                                            <button type="button" onClick={() => setShowPassword(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                {showPassword
                                                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                }
                                            </button>
                                        </div>
                                        {/* Copy */}
                                        <button type="button" onClick={copyPassword} disabled={!password}
                                            className="px-3 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 text-gray-600 dark:text-gray-300 rounded-lg transition-colors">
                                            {copied
                                                ? <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                            }
                                        </button>
                                        {/* Generate */}
                                        <button type="button" onClick={generatePin}
                                            className="px-3 py-2.5 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg transition-colors text-xs font-bold">
                                            {lang === 'uz' ? 'Yaratish' : lang === 'ru' ? 'Создать' : 'Generate'}
                                        </button>
                                    </div>
                                    {/* Status */}
                                    {password.length > 0 && (
                                        <p className={`text-xs font-medium ${password.length < 6 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                            {password.length < 6
                                                ? `${password.length}/6 — ${lang === 'uz' ? 'kamida 6 ta raqam' : lang === 'ru' ? 'минимум 6 цифр' : 'at least 6 digits'}`
                                                : `✓ ${lang === 'uz' ? 'Parol tayyor' : lang === 'ru' ? 'Пароль готов' : 'Password ready'}`
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 flex justify-end gap-3">
                        <button type="button" onClick={reset}
                            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            {lang === 'uz' ? 'Bekor qilish' : lang === 'ru' ? 'Отмена' : 'Cancel'}
                        </button>
                        <button type="submit" disabled={loading || !isPasswordValid}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all shadow-sm flex items-center gap-2">
                            {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
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
                Welcome to <span className="text-blue-600">{APP_NAME}</span> Platform
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

const HomeView = ({ t, lang, userInfo, onNav, history = [] }) => {
    const [meetingTitle, setMeetingTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [time, setTime] = useState(new Date());
    const [roomType, setRoomType] = useState('public');
    const [roomPassword, setRoomPassword] = useState('');
    const [showPassword, setShowPassword] = useState(true);
    const [passwordCopied, setPasswordCopied] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const [createdRoom, setCreatedRoom] = useState(null); // { code, title, roomType, password }
    const [comingSoon, setComingSoon] = useState({ show: false, name: '' });
    const navigate = useNavigate();
    const toast = useToast();
    const isGuest = userInfo?.role === 'guest';

    // Live clock
    React.useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // Generate cryptographically random 6-digit numeric PIN
    const generatePassword = () => {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        const pin = String(arr[0] % 1000000).padStart(6, '0');
        setRoomPassword(pin);
    };

    // Stats helpers
    const now = new Date();
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
    const startOfDay  = new Date(now); startOfDay.setHours(0,0,0,0);
    const thisWeekCount  = history.filter(m => new Date(m.createdAt) >= startOfWeek).length;
    const todayCount     = history.filter(m => new Date(m.createdAt) >= startOfDay).length;

    // Greeting
    const hour = now.getHours();
    const greeting = lang === 'uz'
        ? (hour < 12 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : 'Xayrli kech')
        : lang === 'ru'
            ? (hour < 12 ? 'Доброе утро' : hour < 17 ? 'Добрый день' : 'Добрый вечер')
            : (hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');

    // Get password strength
    const getPasswordStrength = () => {
        if (!roomPassword) return { level: 0, text: '', color: 'gray', valid: false };
        if (roomPassword.length < 6) return { level: 0, text: t('pw_min_6_chars'), color: 'red', valid: false };

        // Pure numeric PIN (6 digits) — always valid
        if (/^\d+$/.test(roomPassword) && roomPassword.length === 6) {
            return { level: 3, text: t('pw_good'), color: 'blue', valid: true };
        }

        let strength = 0;
        if (roomPassword.length >= 6) strength++;
        if (roomPassword.length >= 10) strength++;
        if (/[a-z]/.test(roomPassword) && /[A-Z]/.test(roomPassword)) strength++;
        if (/\d/.test(roomPassword)) strength++;
        if (/[!@#$%^&*]/.test(roomPassword)) strength++;

        if (strength <= 1) return { level: 1, text: t('pw_weak'), color: 'red', valid: false };
        if (strength <= 2) return { level: 2, text: t('pw_fair'), color: 'yellow', valid: true };
        if (strength <= 3) return { level: 3, text: t('pw_good'), color: 'blue', valid: true };
        return { level: 4, text: t('pw_strong'), color: 'green', valid: true };
    };

    const passwordStrength = getPasswordStrength();

    const handleCreateRoom = async () => {
        if (roomType === 'private' && !passwordStrength.valid) {
            toast.error(t('pw_too_weak'));
            return;
        }
        setLoading(true);
        try {
            const { data } = await API.post('/api/meetings', {
                title: meetingTitle || undefined,
                roomType,
                password: roomType === 'private' ? roomPassword : undefined
            });

            if (roomType === 'private') {
                // Show success screen so user can copy code + password before joining
                setCreatedRoom({ code: data.meetingCode, title: data.title, roomType, password: roomPassword });
                setShowNewMeeting(false);
            } else if (isGuest) {
                toast.success(t('guest_meeting_created'), 5000);
                setTimeout(() => navigate(`/room/${data.meetingCode}`), 1500);
            } else {
                navigate(`/room/${data.meetingCode}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create');
        } finally {
            setLoading(false);
        }
    };

    const hh = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = time.toLocaleDateString(
        lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-US',
        { weekday: 'long', month: 'long', day: 'numeric' }
    );

    const actions = [
        {
            id: 'new',
            label: lang === 'uz' ? 'Yangi uchrashuv' : lang === 'ru' ? 'Новая встреча' : 'New Meeting',
            color: 'bg-orange-500',
            shadow: 'shadow-orange-500/30',
            show: userInfo?.role !== 'admin',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
        },
        {
            id: 'join',
            label: lang === 'uz' ? 'Qo\'shilish' : lang === 'ru' ? 'Войти' : 'Join',
            color: 'bg-blue-600',
            shadow: 'shadow-blue-600/30',
            show: userInfo?.role !== 'admin',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />,
        },
        {
            id: 'schedule',
            label: lang === 'uz' ? 'Rejalashtirish' : lang === 'ru' ? 'Запланировать' : 'Schedule',
            color: 'bg-emerald-500',
            shadow: 'shadow-emerald-500/30',
            show: true,
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
        },
        {
            id: 'share',
            label: lang === 'uz' ? 'Ekran ulashish' : lang === 'ru' ? 'Показ экрана' : 'Share Screen',
            color: 'bg-violet-600',
            shadow: 'shadow-violet-600/30',
            show: userInfo?.role !== 'admin',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
        },
    ].filter(a => a.show);

    const [showNewMeeting, setShowNewMeeting] = useState(false);

    const resetNewMeeting = () => {
        setShowNewMeeting(false);
        setRoomPassword('');
        setMeetingTitle('');
        setRoomType('public');
        setCreatedRoom(null);
        setPasswordCopied(false);
        setCodeCopied(false);
    };

    const handleActionClick = (id) => {
        if (id === 'new') { setCreatedRoom(null); setShowNewMeeting(v => !v); return; }
        if (id === 'join') { onNav('join'); return; }
        if (id === 'schedule') { onNav('schedule'); return; }
        if (id === 'share') { onNav('join'); return; }
    };

    const recentThree = history.slice(0, 5);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-[#0b0e14]">

            {/* ── Hero Banner ─────────────────────────────────────────────── */}
            <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 dark:from-[#0e1829] dark:via-[#0c1524] dark:to-[#0f1220] overflow-hidden">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute top-10 left-1/2 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl -translate-x-1/2" />
                    <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-300/8 rounded-full blur-2xl" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                        {/* Left: greeting */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-60" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-200" />
                                </span>
                                <span className="text-blue-200 text-xs font-semibold uppercase tracking-widest">{dateStr}</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                                {greeting},&nbsp;
                                <span className="text-blue-200">{userInfo.name.split(' ')[0]}!</span>
                            </h1>
                            <p className="text-blue-200/60 text-sm mt-1.5 font-medium">
                                {todayCount > 0
                                    ? (lang === 'uz' ? `Bugun ${todayCount} ta uchrashuv` : lang === 'ru' ? `Сегодня ${todayCount} встреч` : `${todayCount} meeting${todayCount !== 1 ? 's' : ''} today`)
                                    : (lang === 'uz' ? 'Bugun hali uchrashuv yo\'q' : lang === 'ru' ? 'Сегодня встреч нет' : 'No meetings today yet')}
                            </p>
                        </div>

                        {/* Right: clock */}
                        <div className="select-none shrink-0 text-right">
                            <p className="text-5xl sm:text-6xl font-black text-white tabular-nums tracking-tighter leading-none font-outfit">{hh}</p>
                        </div>
                    </div>

                    {/* Stats strip */}
                    <div className="flex items-center gap-3 sm:gap-4 mt-6 pb-6 overflow-x-auto">
                        {[
                            { label: lang === 'uz' ? 'Jami' : lang === 'ru' ? 'Всего' : 'Total', value: history.length },
                            { label: lang === 'uz' ? 'Bu hafta' : lang === 'ru' ? 'На неделе' : 'This week', value: thisWeekCount },
                            { label: lang === 'uz' ? 'Bugun' : lang === 'ru' ? 'Сегодня' : 'Today', value: todayCount },
                        ].map(s => (
                            <div key={s.label} className="shrink-0 flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
                                <p className="text-xl font-black text-white tabular-nums">{s.value}</p>
                                <p className="text-xs text-blue-200/70 font-semibold leading-tight">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Action buttons ───────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {actions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => handleActionClick(action.id)}
                            className="group flex flex-col items-center gap-3 p-5 sm:p-6 bg-white dark:bg-[#161b22] rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1c222d] hover:shadow-lg dark:hover:shadow-black/40 transition-colors duration-200"
                        >
                            <div className={`w-14 h-14 ${action.color} shadow-lg ${action.shadow} rounded-2xl flex items-center justify-center`}>
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {action.icon}
                                </svg>
                            </div>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 text-center leading-tight">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── New Meeting panel ────────────────────────────────────────── */}
            {showNewMeeting && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                    <div className="bg-white dark:bg-[#161b22] rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-black/40">
                        <div className="space-y-6">
                            {/* Meeting Title */}
                            <div>
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
                                    className="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl px-6 py-5 text-lg font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
                                />
                            </div>

                            {/* Room Type Selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => { setRoomType('public'); setRoomPassword(''); }}
                                    className={`p-4 rounded-2xl font-bold text-sm transition-all border-2 ${roomType === 'public' 
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400' 
                                        : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        {lang === 'uz' ? 'Ommaviy' : lang === 'ru' ? 'Публичный' : 'Public'}
                                    </div>
                                </button>
                                <button
                                    onClick={() => { setRoomType('private'); if (!roomPassword) generatePassword(); }}
                                    className={`p-4 rounded-2xl font-bold text-sm transition-all border-2 ${roomType === 'private'
                                        ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-600 dark:text-purple-400' 
                                        : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        {lang === 'uz' ? 'Shaxsiy' : lang === 'ru' ? 'Приватный' : 'Private'}
                                    </div>
                                </button>
                            </div>

                            {/* Password Field (only for private rooms) */}
                            {roomType === 'private' && (
                                <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                                    <div className="flex items-center gap-2 mb-3 ml-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">
                                            {lang === 'uz' ? 'Xonaning paroli' : lang === 'ru' ? 'Пароль комнаты' : 'Room Password'} *
                                        </p>
                                    </div>
                                    
                                    {/* Password Input with Toggle & Copy */}
                                    <div className="relative group">
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder={lang === 'uz' ? '6 xonali raqam' : lang === 'ru' ? '6-значный код' : '6-digit code'}
                                                value={roomPassword}
                                                onChange={e => setRoomPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                inputMode="numeric"
                                                maxLength={6}
                                                className="flex-1 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl px-6 py-4 text-base font-mono tracking-widest text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-inner"
                                            />
                                            
                                            {/* Show/Hide Toggle */}
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="px-3 py-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-xl transition-all"
                                                title={showPassword ? 'Hide' : 'Show'}
                                            >
                                                {showPassword ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                )}
                                            </button>
                                            
                                            {/* Copy Button */}
                                            {roomPassword && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(roomPassword);
                                                        setPasswordCopied(true);
                                                        setTimeout(() => setPasswordCopied(false), 2000);
                                                    }}
                                                    className="px-3 py-3 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 rounded-xl transition-all"
                                                    title={lang === 'uz' ? 'Nusxalash' : 'Copy'}
                                                >
                                                    {passwordCopied ? (
                                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                    ) : (
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Password Strength Indicator */}
                                    {roomPassword && (
                                        <div className="space-y-2">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4].map(level => (
                                                    <div
                                                        key={level}
                                                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                                                            level <= passwordStrength.level
                                                                ? passwordStrength.color === 'red'
                                                                    ? 'bg-red-500'
                                                                    : passwordStrength.color === 'yellow'
                                                                    ? 'bg-yellow-500'
                                                                    : passwordStrength.color === 'blue'
                                                                    ? 'bg-blue-500'
                                                                    : 'bg-green-500'
                                                                : 'bg-gray-200 dark:bg-gray-700'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className={`text-xs font-semibold uppercase tracking-wider ${
                                                passwordStrength.color === 'red'
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : passwordStrength.color === 'yellow'
                                                    ? 'text-yellow-600 dark:text-yellow-400'
                                                    : passwordStrength.color === 'blue'
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : 'text-green-600 dark:text-green-400'
                                            }`}>
                                                {lang === 'uz' ? 'Kuchliligi: ' : lang === 'ru' ? 'Надежность: ' : 'Strength: '} {passwordStrength.text}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {/* Generate & Clear Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={generatePassword}
                                            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-400 font-bold text-sm rounded-xl hover:from-purple-500/20 hover:to-indigo-500/20 transition-all active:scale-95"
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                {lang === 'uz' ? 'Yaratish' : lang === 'ru' ? 'Создать' : 'Generate'}
                                            </div>
                                        </button>
                                        {roomPassword && (
                                            <button
                                                type="button"
                                                onClick={() => setRoomPassword('')}
                                                className="px-4 py-3 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold text-sm rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
                                            >
                                                {lang === 'uz' ? 'Tozalash' : lang === 'ru' ? 'Очистить' : 'Clear'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4">
                                <button onClick={resetNewMeeting}
                                    className="px-8 py-4 text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-2xl transition-all flex-1 active:scale-95">
                                    {lang === 'uz' ? 'Bekor' : lang === 'ru' ? 'Отмена' : 'Cancel'}
                                </button>
                                <button onClick={handleCreateRoom} disabled={loading || (roomType === 'private' && (!roomPassword.trim() || !passwordStrength.valid))}
                                    className="px-10 py-4 gradient-blue text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex-1 active:scale-95">
                                    {loading ? t('starting') : t('start_meeting')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Private Room Created Success Modal ───────────────────────── */}
            {createdRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-[#161b22] rounded-3xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 px-6 py-6 text-center">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                                </svg>
                            </div>
                            <h2 className="text-lg font-black text-white">
                                {lang === 'uz' ? 'Shaxsiy xona yaratildi!' : lang === 'ru' ? 'Приватная комната создана!' : 'Private Room Created!'}
                            </h2>
                            <p className="text-purple-200 text-xs mt-1">
                                {lang === 'uz' ? 'Kodni va parolni saqlang' : lang === 'ru' ? 'Сохраните код и пароль' : 'Save the code and password'}
                            </p>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-3">
                            {/* Meeting Code */}
                            <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                        {lang === 'uz' ? 'Xona kodi' : lang === 'ru' ? 'Код комнаты' : 'Room Code'}
                                    </p>
                                    <p className="text-lg font-black text-gray-900 dark:text-white font-mono tracking-widest">{createdRoom.code}</p>
                                </div>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(createdRoom.code); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
                                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${codeCopied ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                    {codeCopied
                                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                    }
                                </button>
                            </div>

                            {/* Password */}
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-0.5">
                                        {lang === 'uz' ? 'Xona paroli' : lang === 'ru' ? 'Пароль комнаты' : 'Room Password'}
                                    </p>
                                    <p className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono tracking-[0.3em]">
                                        {createdRoom.password.slice(0,3)} {createdRoom.password.slice(3)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(createdRoom.password); setPasswordCopied(true); setTimeout(() => setPasswordCopied(false), 2000); }}
                                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${passwordCopied ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'}`}
                                >
                                    {passwordCopied
                                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                    }
                                </button>
                            </div>

                            {/* Copy both */}
                            <button
                                onClick={() => {
                                    const text = lang === 'uz'
                                        ? `Xona kodi: ${createdRoom.code}\nParol: ${createdRoom.password}`
                                        : lang === 'ru'
                                        ? `Код комнаты: ${createdRoom.code}\nПароль: ${createdRoom.password}`
                                        : `Room code: ${createdRoom.code}\nPassword: ${createdRoom.password}`;
                                    navigator.clipboard.writeText(text);
                                    toast.success(lang === 'uz' ? 'Nusxalandi!' : lang === 'ru' ? 'Скопировано!' : 'Copied!');
                                }}
                                className="w-full py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                            >
                                {lang === 'uz' ? '📋 Ikkalasini nusxalash' : lang === 'ru' ? '📋 Скопировать оба' : '📋 Copy both'}
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button onClick={resetNewMeeting}
                                className="flex-1 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-colors">
                                {lang === 'uz' ? 'Yopish' : lang === 'ru' ? 'Закрыть' : 'Close'}
                            </button>
                            <button onClick={() => { resetNewMeeting(); navigate(`/room/${createdRoom.code}`); }}
                                className="flex-1 py-3 text-sm font-black text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-2xl shadow-lg shadow-purple-500/30 transition-all active:scale-95">
                                {lang === 'uz' ? 'Boshlash →' : lang === 'ru' ? 'Начать →' : 'Start →'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {comingSoon.show && (
                <ComingSoonModal
                    onClose={() => setComingSoon({ show: false, name: '' })}
                    featureName={comingSoon.name}
                />
            )}

            {/* ── Bottom content grid ──────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

                {/* Recent Meetings — 2/3 */}
                <div className="lg:col-span-2 bg-white dark:bg-[#161b22] rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-1 h-5 bg-blue-500 rounded-full" />
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                {lang === 'uz' ? 'So\'nggi uchrashuvlar' : lang === 'ru' ? 'Последние встречи' : 'Recent Meetings'}
                            </h2>
                        </div>
                        <button onClick={() => onNav('history')} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                            {lang === 'uz' ? 'Barchasi →' : lang === 'ru' ? 'Все →' : 'View all →'}
                        </button>
                    </div>

                    {recentThree.length > 0 ? (
                        <div className="divide-y divide-gray-50 dark:divide-white/5">
                            {recentThree.map(m => {
                                const d = new Date(m.createdAt);
                                const isToday = d >= startOfDay;
                                const timeStr = isToday
                                    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : d.toLocaleDateString(lang === 'uz' ? 'uz-UZ' : lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' });
                                return (
                                    <div key={m._id} onClick={() => navigate(`/room/${m.meetingCode}`)}
                                        className="group flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/4 cursor-pointer transition-colors">
                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{m.title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 font-mono">{m.meetingCode}</p>
                                        </div>
                                        <span className="shrink-0 text-xs text-gray-400 font-medium">{timeStr}</span>
                                        <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/8 flex items-center justify-center mb-4">
                                <svg className="w-7 h-7 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">
                                {lang === 'uz' ? 'Hali uchrashuvlar yo\'q' : lang === 'ru' ? 'Встреч пока нет' : 'No meetings yet'}
                            </p>
                            <button onClick={() => setShowNewMeeting(true)} className="mt-4 px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                {lang === 'uz' ? '+ Yangi uchrashuv' : lang === 'ru' ? '+ Новая встреча' : '+ New Meeting'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right sidebar — 1/3 */}
                <div className="flex flex-col gap-4">
                    {/* Pro Upgrade card */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-lg">
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                            </div>
                            <h3 className="text-lg font-black mb-1 tracking-tight">{APP_NAME} </h3>
                            <p className="text-white/70 text-sm mb-5 leading-relaxed">
                                {lang === 'uz' ? 'Cheksiz vaqt va yuqori sifat.' : lang === 'ru' ? 'Неограниченное время и высокое качество.' : 'Unlimited meetings & HD video.'}
                            </p>
                            <button className="w-full py-2.5 bg-white text-violet-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-95">
                                {lang === 'uz' ? 'Batafsil' : lang === 'ru' ? 'Подробнее' : 'Learn More'}
                            </button>
                        </div>
                    </div>

                    {/* Quick tips */}
                    <div className="bg-white dark:bg-[#161b22] rounded-2xl p-5">
                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                            {lang === 'uz' ? 'Tezkor harakatlar' : lang === 'ru' ? 'Быстрые действия' : 'Quick Actions'}
                        </h3>
                        <div className="space-y-1.5">
                            {[
                                { label: lang === 'uz' ? 'Profilni ko\'rish' : lang === 'ru' ? 'Мой профиль' : 'View profile', nav: 'profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                                { label: lang === 'uz' ? 'Uchrashuvlar tarixi' : lang === 'ru' ? 'История встреч' : 'Meeting history', nav: 'history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                                { label: lang === 'uz' ? 'Rejalashtirish' : lang === 'ru' ? 'Запланировать' : 'Schedule meeting', nav: 'schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                            ].map(item => (
                                <button key={item.nav} onClick={() => onNav(item.nav)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left group">
                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
                                    {item.label}
                                </button>
                            ))}
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

    const roleColors = {
        admin: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        user:  'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        guest: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
    };
    const roleColor = roleColors[profile?.role] || roleColors.guest;
    const avatarInitial = profile?.name?.[0]?.toUpperCase() || '?';

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
        <div className="flex-1 overflow-y-auto px-4 py-8 md:py-10 bg-gray-50 dark:bg-gray-950 relative">
            {/* Edit Profile Slide-over */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden border-l border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {lang === 'uz' ? 'Profilni tahrirlash' : lang === 'ru' ? 'Редактировать профиль' : 'Edit Profile'}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {lang === 'uz' ? 'Ma\'lumotlarni yangilang' : lang === 'ru' ? 'Обновите ваши данные' : 'Update your information'}
                                </p>
                            </div>
                            <button onClick={() => setIsEditing(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                            {/* Avatar preview */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                                    {(editForm.name || profile?.name || '?')[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{editForm.name || profile?.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{profile?.email}</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                    {lang === 'uz' ? 'Ism' : lang === 'ru' ? 'Имя' : 'Name'}
                                </label>
                                <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Bio</label>
                                <textarea value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} rows="3"
                                    placeholder={lang === 'uz' ? 'O\'zingiz haqingizda yozing...' : lang === 'ru' ? 'Напишите о себе...' : 'Write something about yourself...'}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {lang === 'uz' ? 'Ijtimoiy havolalar' : lang === 'ru' ? 'Социальные ссылки' : 'Social Links'} ({editForm.links.length}/5)
                                    </label>
                                    <button type="button" onClick={addLink} disabled={editForm.links.length >= 5}
                                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-40 flex items-center gap-1 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                                        {lang === 'uz' ? 'Qo\'shish' : lang === 'ru' ? 'Добавить' : 'Add'}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {editForm.links.map((link, idx) => (
                                        <div key={idx} className="flex gap-2 items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <div className="flex-1 flex gap-2">
                                                <input type="text" placeholder="GitHub" value={link.title} onChange={(e) => updateLink(idx, 'title', e.target.value)}
                                                    className="w-24 shrink-0 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all" />
                                                <input type="url" placeholder="https://..." value={link.url} onChange={(e) => updateLink(idx, 'url', e.target.value)}
                                                    className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all" />
                                            </div>
                                            <button type="button" onClick={() => removeLink(idx)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                                            </button>
                                        </div>
                                    ))}
                                    {editForm.links.length === 0 && (
                                        <p className="text-xs text-gray-400 dark:text-gray-600 italic py-2 text-center">
                                            {lang === 'uz' ? 'Hali havola qo\'shilmagan' : lang === 'ru' ? 'Ссылки не добавлены' : 'No links added yet'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </form>
                        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-gray-900">
                            <button type="button" onClick={() => setIsEditing(false)}
                                className="flex-1 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                {lang === 'uz' ? 'Bekor' : lang === 'ru' ? 'Отмена' : 'Cancel'}
                            </button>
                            <button onClick={handleSaveProfile} disabled={saving}
                                className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 transition-colors shadow-md shadow-blue-500/20">
                                {saving ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                        {lang === 'uz' ? 'Saqlanmoqda...' : lang === 'ru' ? 'Сохранение...' : 'Saving...'}
                                    </span>
                                ) : (lang === 'uz' ? 'Saqlash' : lang === 'ru' ? 'Сохранить' : 'Save Changes')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
                
                {/* 1. Left Sidebar (User details) */}
                <div className="w-full md:w-72 lg:w-64 shrink-0 flex flex-col gap-4">
                    {/* Avatar Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 text-center">
                        <div className="relative inline-block mb-4">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-blue-500/20 ring-4 ring-white dark:ring-gray-800">
                                {avatarInitial}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-base shadow-sm cursor-pointer hover:scale-110 transition-transform" title="Status">
                                🎯
                            </div>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-0.5">{profile?.name}</h1>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${roleColor}`}>
                            {profile?.role || 'User'}
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 leading-relaxed text-left">
                            {profile?.bio || (lang === 'uz' ? 'Zamonaviy video aloqa tizimi ishqibozi.' : lang === 'ru' ? 'Энтузиаст современных систем видеосвязи.' : 'Enthusiast of modern video communication systems.')}
                        </p>
                        <button onClick={openEdit} className="mt-4 w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors flex items-center justify-center gap-2">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            {lang === 'uz' ? 'Profilni tahrirlash' : lang === 'ru' ? 'Редактировать' : 'Edit profile'}
                        </button>
                    </div>

                    {/* Stats row */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{totalMeetings}</p>
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5 leading-tight">
                            {lang === 'uz' ? 'Uchrashuvlar' : lang === 'ru' ? 'Встреч' : 'Meetings'}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                            {lang === 'uz' ? 'Ma\'lumotlar' : lang === 'ru' ? 'Информация' : 'Info'}
                        </p>

                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li className="flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                <a href={`mailto:${profile?.email}`} className="hover:text-blue-600 hover:underline truncate text-xs">{profile?.email}</a>
                            </li>
                            {profile?.links?.map((link, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline truncate text-xs">{link.title}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* 2. Right Main Area */}
                <div className="flex-1 min-w-0 flex flex-col gap-6">
                    
                    {/* Pinned Meetings */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                {lang === 'uz' ? 'Qadalgan xonalar' : lang === 'ru' ? 'Закреплённые' : 'Pinned Rooms'}
                            </h2>
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

        </div>
    );
};

const HistoryView = ({ t, lang, userInfo, history, onDelete, onUpdate }) => {
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();
    const isGuest = userInfo?.role === 'guest';

    const handleCreateMeeting = async () => {
        setCreating(true);
        try {
            const { data } = await API.post('/api/meetings', { roomType: 'public' });

            // If guest created meeting, show registration prompt
            if (isGuest) {
                toast.success(t('guest_meeting_created'), 5000);
                setTimeout(() => navigate(`/room/${data.meetingCode}`), 1500);
            } else {
                navigate(`/room/${data.meetingCode}`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create');
        } finally {
            setCreating(false);
        }
    };

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

    const filteredHistory = history.filter((meeting) => {
        const matchesSearch = [meeting.title, meeting.meetingCode].some((value) =>
            String(value || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        const createdDate = new Date(meeting.createdAt).toISOString().slice(0, 10);
        return matchesSearch && (!dateFilter || createdDate === dateFilter);
    });

    return (
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:py-10 bg-gray-50 dark:bg-gray-900/50">
            <div className="w-full max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {lang === 'uz' ? 'Uchrashuvlarim' : lang === 'ru' ? 'Мои встречи' : 'My Meetings'}
                    </h2>
                    <button
                        onClick={handleCreateMeeting}
                        disabled={creating}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 disabled:opacity-60 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                        {creating
                            ? (lang === 'uz' ? 'Yaratilmoqda...' : lang === 'ru' ? 'Создание...' : 'Creating...')
                            : (lang === 'uz' ? 'Yangi uchrashuv' : lang === 'ru' ? 'Новая встреча' : 'New Meeting')}
                    </button>
                </div>
                <div className="mb-6 grid gap-3 md:grid-cols-[1fr_220px]">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={lang === 'uz' ? 'Meeting nomi yoki code qidiring' : 'Search by meeting title or code'}
                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                    />
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                    />
                </div>
                {filteredHistory.length > 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-gray-700/50">
                        {filteredHistory.map(m => (
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
                                        <button onClick={(e) => { e.stopPropagation(); onUpdate(m._id, m.title, { isPinned: !m.isPinned }); }} className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${m.isPinned ? 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300' : 'text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}`} title="Pin">
                                            {m.isPinned ? 'Unpin' : 'Pin'}
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); navigate(`/room/${m.meetingCode}`); }} className="px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors" title="Rejoin">
                                            Rejoin
                                        </button>
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
                        <p className="text-base font-medium text-gray-500 dark:text-gray-400 mb-5">
                            {lang === 'uz' ? 'Hali uchrashuvlar mavjud emas' : lang === 'ru' ? 'Нет встреч' : 'No meetings found'}
                        </p>
                        <button onClick={handleCreateMeeting} disabled={creating}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 disabled:opacity-60 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            {lang === 'uz' ? 'Yangi uchrashuv' : lang === 'ru' ? 'Новая встреча' : 'New Meeting'}
                        </button>
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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = React.useRef(null);

    useEffect(() => {
        if (!profileMenuOpen) return;
        const onDocClick = (e) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setProfileMenuOpen(false);
            }
        };
        const onEsc = (e) => { if (e.key === 'Escape') setProfileMenuOpen(false); };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onEsc);
        };
    }, [profileMenuOpen]);
    const navigate = useNavigate();
    const { user: userInfo } = useAuth();
    const { t, lang, theme, toggleTheme, changeLanguage } = useContext(ThemeLanguageContext);
    const toast = useToast();
    const { confirm, modal: confirmModal } = useConfirm();
    const { logout } = useAuth();
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
        const ok = await confirm(t('confirm_delete_meeting'));
        if (!ok) return;
        try {
            await API.delete(`/api/meetings/${id}`);
            setHistory(h => h.filter(m => m._id !== id));
            toast.success(t('meeting_deleted'));
        } catch {
            toast.error(t('action_failed'));
        }
    };

    const handleUpdateMeeting = async (id, newTitle, extra = {}) => {
        try {
            await API.put(`/api/meetings/${id}`, { title: newTitle, ...extra });
            setHistory(h => h.map(m => m._id === id ? { ...m, title: newTitle, ...extra } : m));
        } catch {
            toast.error(t('action_failed'));
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

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
            {view === 'history' && <HistoryView t={t} lang={lang} userInfo={userInfo} history={history} onDelete={handleDeleteMeeting} onUpdate={handleUpdateMeeting} />}
        </>
    );

    // ── Nav links for authenticated users ────────────────────────────────────
    const navLinks = userInfo ? [
        { id: 'home', label: t('dashboard') },
        { id: 'history', label: lang === 'uz' ? 'Uchrashuvlarim' : lang === 'ru' ? 'Мои встречи' : 'My Meetings' },
        { id: 'schedule', label: t('schedule') },
    ] : [];

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#0d1117] text-gray-800 dark:text-gray-200 font-sans overflow-hidden transition-colors">

            {/* ── Navbar ───────────────────────────────────────────────────── */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60 h-14 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 shrink-0">

                {/* Left: Logo + Nav */}
                <div className="flex items-center gap-2 lg:gap-6">
                    {/* Logo */}
                    <button onClick={() => setView('home')} className="flex items-center gap-2.5 shrink-0 group">
                        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:shadow-blue-600/40 transition-shadow">
                            <span className="text-white text-xs font-black">{APP_NAME[0]}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white hidden sm:block tracking-tight">{APP_NAME}</span>
                    </button>

                    {/* Separator */}
                    <div className="w-px h-5 bg-gray-200 dark:bg-gray-700/60 hidden md:block" />

                    {/* Desktop Nav links */}
                    <nav className="hidden md:flex items-center gap-0.5">
                        {navLinks.map(link => (
                            <button key={link.id} onClick={() => setView(link.id)}
                                className={`px-3.5 py-1.5 text-[13px] font-semibold rounded-lg transition-all duration-200 ${
                                    view === link.id
                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60'
                                }`}>
                                {link.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Right: Quick action + controls + profile */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Quick Join button */}
                    {userInfo && (
                        <button onClick={() => setView('join')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${view === 'join' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/60 dark:border-blue-800/50'}`}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                            <span className="hidden sm:inline">{t('join_meeting')}</span>
                        </button>
                    )}

                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700/60 hidden sm:block" />

                    {/* Theme + Language */}
                    <div className="hidden sm:flex items-center gap-1.5">
                        <LanguageToggle compact />
                        <ThemeToggle compact />
                    </div>

                    {/* Profile dropdown */}
                    {userInfo ? (
                        <div className="relative ml-0.5" ref={profileMenuRef}>
                            <button
                                onClick={() => setProfileMenuOpen(v => !v)}
                                aria-haspopup="menu"
                                aria-expanded={profileMenuOpen}
                                className={`flex items-center gap-2 px-1.5 py-1 rounded-xl transition-colors ${profileMenuOpen ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">
                                    {userInfo?.name?.[0]?.toUpperCase()}
                                </div>
                                <svg className={`w-3 h-3 text-gray-400 hidden sm:block transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {profileMenuOpen && (
                                <div role="menu" className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userInfo?.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userInfo?.email}</p>
                                    </div>
                                    <button onClick={() => { setProfileMenuOpen(false); setView('profile'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        {lang === 'uz' ? 'Profil' : lang === 'ru' ? 'Профиль' : 'Profile'}
                                    </button>
                                    {isAdmin && (
                                        <button onClick={() => { setProfileMenuOpen(false); navigate('/admin'); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
                                            Admin Panel
                                        </button>
                                    )}
                                    <div className="sm:hidden flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                                        <LanguageToggle compact />
                                        <ThemeToggle compact />
                                    </div>
                                    <div className="border-t border-gray-100 dark:border-gray-800">
                                        <button onClick={() => { setProfileMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                            {t('sign_out')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 ml-1">
                            <Link to="/login" className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                {lang === 'uz' ? 'Kirish' : lang === 'ru' ? 'Войти' : 'Log in'}
                            </Link>
                            <Link to="/register" className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm">
                                {lang === 'uz' ? "Ro'yxatdan o'tish" : lang === 'ru' ? 'Регистрация' : 'Register'}
                            </Link>
                        </div>
                    )}

                    {/* Mobile hamburger */}
                    {userInfo && (
                        <button onClick={() => setMobileMenuOpen(v => !v)} className="md:hidden p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Menu">
                            {mobileMenuOpen
                                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            }
                        </button>
                    )}
                </div>
            </header>

            {/* ── Mobile nav dropdown ──────────────────────────────────────── */}
            {mobileMenuOpen && userInfo && (
                <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 py-2 z-30 shrink-0 shadow-lg">
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
                    <button onClick={() => { setView('join'); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg mb-0.5 transition-colors ${view === 'join' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                        {t('join_meeting')}
                    </button>
                </div>
            )}

            {/* ── Main content ────────────────────────────────────────────── */}
            <main className="flex-1 overflow-y-auto flex flex-col min-h-0">
                {mainContent}
            </main>
            {confirmModal}
        </div>
    );
};

export default Dashboard;
