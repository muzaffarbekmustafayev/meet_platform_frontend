import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../api';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, Video, Shield, Zap } from 'lucide-react';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Meetra';

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const txt = {
    uz: {
        loginTitle: 'Xush kelibsiz',
        loginSub: 'Hisobingizga kiring va davom eting',
        registerTitle: 'Hisob yarating',
        registerSub: 'Bir necha soniyada boshlang',
        heroTitle: 'Uchrashuvlar — sodda',
        heroSub: 'HD video, ekran ulashish va xavfsiz xonalar.',
        toLogin: 'Hisobingiz bormi? Kirish',
        toRegister: 'Yangi foydalanuvchimisiz? Yarating',
        email: 'Email manzil',
        password: 'Parol',
        name: 'Ism',
        username: 'Foydalanuvchi nomi',
        remember: 'Eslab qol',
        forgot: 'Parolni unutdingizmi?',
        signIn: 'Kirish',
        signUp: 'Ro\'yxatdan o\'tish',
        or: 'yoki',
        google: 'Google',
        guest: 'Mehmon sifatida',
        terms: 'Shartlarga roziman',
        back: 'Bosh sahifa',
        f1: 'HD video',
        f2: 'Xavfsiz',
        f3: 'Tezkor',
        guestTitle: 'Mehmon sifatida kirish',
        guestName: 'Ismingiz',
        guestEmail: 'Email (ixtiyoriy)',
        cancel: 'Bekor',
        continue: 'Davom etish',
        forgotTitle: 'Parolni tiklash',
        forgotSub: 'Email kiriting, sizga havola yuboramiz.',
        sending: 'Yuborilmoqda...',
        sendLink: 'Havola yuborish',
        sentOk: 'Tekshiring — havola emailda.',
    },
    ru: {
        loginTitle: 'С возвращением',
        loginSub: 'Войдите в свой аккаунт',
        registerTitle: 'Создайте аккаунт',
        registerSub: 'Начните за пару секунд',
        heroTitle: 'Встречи — это просто',
        heroSub: 'HD видео, экран и безопасные комнаты.',
        toLogin: 'Уже есть аккаунт? Войти',
        toRegister: 'Новый пользователь? Создать',
        email: 'Email',
        password: 'Пароль',
        name: 'Имя',
        username: 'Имя пользователя',
        remember: 'Запомнить',
        forgot: 'Забыли пароль?',
        signIn: 'Войти',
        signUp: 'Зарегистрироваться',
        or: 'или',
        google: 'Google',
        guest: 'Как гость',
        terms: 'Принимаю условия',
        back: 'На главную',
        f1: 'HD видео',
        f2: 'Безопасно',
        f3: 'Быстро',
        guestTitle: 'Войти как гость',
        guestName: 'Ваше имя',
        guestEmail: 'Email (необязательно)',
        cancel: 'Отмена',
        continue: 'Продолжить',
        forgotTitle: 'Сброс пароля',
        forgotSub: 'Введите email — пришлём ссылку.',
        sending: 'Отправка...',
        sendLink: 'Отправить ссылку',
        sentOk: 'Проверьте почту.',
    },
    en: {
        loginTitle: 'Welcome back',
        loginSub: 'Sign in to continue',
        registerTitle: 'Create account',
        registerSub: 'Get started in seconds',
        heroTitle: 'Meetings made simple',
        heroSub: 'HD video, screen sharing and secure rooms.',
        toLogin: 'Have an account? Sign in',
        toRegister: 'New here? Create one',
        email: 'Email address',
        password: 'Password',
        name: 'Full name',
        username: 'Username',
        remember: 'Remember me',
        forgot: 'Forgot password?',
        signIn: 'Sign in',
        signUp: 'Create account',
        or: 'or',
        google: 'Google',
        guest: 'Continue as guest',
        terms: 'I agree to the terms',
        back: 'Home',
        f1: 'HD video',
        f2: 'Secure',
        f3: 'Fast',
        guestTitle: 'Continue as guest',
        guestName: 'Your name',
        guestEmail: 'Email (optional)',
        cancel: 'Cancel',
        continue: 'Continue',
        forgotTitle: 'Reset password',
        forgotSub: 'Enter your email — we\'ll send a link.',
        sending: 'Sending...',
        sendLink: 'Send link',
        sentOk: 'Check your inbox for the link.',
    },
};

const GuestNameModal = ({ onConfirm, onCancel, l }) => {
    const [n, setN] = useState('');
    const [e, setE] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#161b22] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{l.guestTitle}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Tezkor kirish, ro'yxatdan o'tmasdan.</p>
                <div className="space-y-3 mb-5">
                    <input autoFocus type="text" placeholder={l.guestName} value={n} onChange={ev => setN(ev.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0d1117] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    <input type="email" placeholder={l.guestEmail} value={e} onChange={ev => setE(ev.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0d1117] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">{l.cancel}</button>
                    <button onClick={() => n.trim() && onConfirm(n.trim(), e.trim())} disabled={!n.trim()}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors">{l.continue}</button>
                </div>
            </div>
        </div>
    );
};

const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { lang } = useContext(ThemeLanguageContext);
    const { login } = useAuth();
    const toast = useToast();
    const l = txt[lang] || txt.en;

    const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotStatus, setForgotStatus] = useState('');

    const [guestOpen, setGuestOpen] = useState(false);

    useEffect(() => {
        setIsLogin(location.pathname !== '/register');
        setError('');
    }, [location.pathname]);

    const toggle = () => navigate(isLogin ? '/register' : '/login');

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                const { data } = await API.post('/api/users/login', { email, password });
                login(data);
                navigate(data.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
            } else {
                const { data } = await API.post('/api/users/register', { name, username, email, password });
                login(data);
                navigate('/dashboard', { replace: true });
            }
        } catch (err) {
            const msg = err.response?.data?.details?.[0]?.message
                || err.response?.data?.message
                || (isLogin ? 'Login failed' : 'Registration failed');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const guestJoin = async (gName, gEmail) => {
        setGuestOpen(false);
        try {
            const { data } = await API.post('/api/users/guest-login', {
                name: gName,
                email: gEmail || `guest+${crypto.randomUUID()}@guest.local`,
            });
            login(data);
            navigate('/', { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Guest login failed');
        }
    };

    const forgotSubmit = async (e) => {
        e.preventDefault();
        setForgotStatus('sending');
        try {
            await API.post('/api/users/forgot-password', { email: forgotEmail });
            setForgotStatus('success');
        } catch (err) {
            setForgotStatus(err.response?.data?.message || 'Failed');
        }
    };

    const handleGoogleLogin = async (token) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await API.post('/api/users/google-auth', { token });
            login(data);
            navigate(data.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || 'Google login failed';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Load Google Identity Services script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'demo-client-id.apps.googleusercontent.com',
                    callback: (response) => {
                        if (response.credential) {
                            handleGoogleLogin(response.credential);
                        }
                    }
                });
                // Render Google Sign-In button
                const buttonElement = document.getElementById('google-signin-button');
                if (buttonElement) {
                    window.google.accounts.id.renderButton(buttonElement, {
                        type: 'standard',
                        size: 'large',
                        theme: document.documentElement.classList.contains('dark') ? 'outline' : 'filled_blue',
                        width: '100%',
                        locale: lang === 'uz' ? 'en' : lang // Google doesn't support Uzbek
                    });
                }
            }
        };
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [lang]);

    const inputCls = "w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-[#0d1117] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm";

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-[#0b0e14]">

            {/* ── Left: Hero (desktop only) ─────────────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/3 -left-24 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-blue-300/15 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    <Link to="/" className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors group w-fit">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-semibold">{l.back}</span>
                    </Link>

                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm mb-6">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                            <span className="text-xs font-bold tracking-widest uppercase text-blue-100">{APP_NAME}</span>
                        </div>
                        <h1 className="text-5xl font-extrabold tracking-tight leading-tight mb-4">{l.heroTitle}</h1>
                        <p className="text-lg text-blue-100/80 leading-relaxed max-w-md mb-10">{l.heroSub}</p>

                        <div className="flex gap-3">
                            {[
                                { icon: <Video size={16} />, label: l.f1 },
                                { icon: <Shield size={16} />, label: l.f2 },
                                { icon: <Zap size={16} />, label: l.f3 },
                            ].map((f, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg">
                                    <span className="text-blue-200">{f.icon}</span>
                                    <span className="text-xs font-semibold text-white">{f.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-xs text-blue-200/60 font-medium">© {new Date().getFullYear()} {APP_NAME}</div>
                </div>
            </div>

            {/* ── Right: Form ──────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col justify-center px-5 sm:px-8 lg:px-16 py-10 relative">

                {/* Mobile back button */}
                <Link to="/" className="lg:hidden absolute top-5 left-5 inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors">
                    <ArrowLeft size={16} />
                    <span className="text-xs font-semibold">{l.back}</span>
                </Link>

                <div className="w-full max-w-sm mx-auto">

                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                            <span className="text-white font-black text-sm">{APP_NAME[0]}</span>
                        </div>
                        <span className="font-extrabold text-gray-900 dark:text-white tracking-tight">{APP_NAME}</span>
                    </div>

                    {/* Title */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
                            {isLogin ? l.loginTitle : l.registerTitle}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isLogin ? l.loginSub : l.registerSub}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-3.5">

                        {!isLogin && (
                            <>
                                <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder={l.name} value={name} onChange={e => setName(e.target.value)} className={inputCls} required />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">@</span>
                                    <input type="text" placeholder={l.username} value={username} onChange={e => setUsername(e.target.value)} className={inputCls} required />
                                </div>
                            </>
                        )}

                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="email" placeholder={l.email} value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required />
                        </div>

                        <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type={showPassword ? 'text' : 'password'} placeholder={l.password} value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-11`} required />
                            <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-500 transition-colors">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {isLogin ? (
                            <div className="flex items-center justify-between text-xs">
                                <label className="flex items-center gap-2 text-gray-500 dark:text-gray-400 cursor-pointer">
                                    <input type="checkbox" className="w-3.5 h-3.5 rounded accent-blue-600" />
                                    <span className="font-medium">{l.remember}</span>
                                </label>
                                <button type="button" onClick={() => setForgotOpen(true)} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">{l.forgot}</button>
                            </div>
                        ) : (
                            <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                                <input type="checkbox" className="w-3.5 h-3.5 rounded accent-blue-600" required />
                                <span className="font-medium">{l.terms}</span>
                            </label>
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-xs font-medium">{error}</div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                            {loading ? '...' : (isLogin ? l.signIn : l.signUp)}
                        </button>

                        {/* Divider */}
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-white/8" /></div>
                            <div className="relative flex justify-center"><span className="px-3 bg-gray-50 dark:bg-[#0b0e14] text-[10px] font-bold uppercase tracking-widest text-gray-400">{l.or}</span></div>
                        </div>

                        {/* Social */}
                        <div className="grid grid-cols-2 gap-3">
                            <div id="google-signin-button" className="rounded-xl overflow-hidden flex items-center justify-center bg-white dark:bg-[#161b22]" style={{ minHeight: '44px' }} />
                            <button type="button" onClick={() => setGuestOpen(true)}
                                className="py-3 bg-white dark:bg-[#161b22] hover:bg-gray-100 dark:hover:bg-[#1c222d] rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors">
                                {l.guest}
                            </button>
                        </div>
                    </form>

                    {/* Toggle */}
                    <p className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
                        <button type="button" onClick={toggle} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                            {isLogin ? l.toRegister : l.toLogin}
                        </button>
                    </p>
                </div>
            </div>

            {guestOpen && <GuestNameModal onConfirm={guestJoin} onCancel={() => setGuestOpen(false)} l={l} />}

            {forgotOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#161b22] w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{l.forgotTitle}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">{l.forgotSub}</p>
                        {forgotStatus === 'success' ? (
                            <>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-sm font-medium text-center">{l.sentOk}</div>
                                <button onClick={() => { setForgotOpen(false); setForgotStatus(''); }} className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">{l.cancel}</button>
                            </>
                        ) : (
                            <form onSubmit={forgotSubmit} className="space-y-3">
                                <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="email" placeholder={l.email} value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className={inputCls} required />
                                </div>
                                {forgotStatus && forgotStatus !== 'sending' && <div className="text-red-500 text-xs font-medium">{forgotStatus}</div>}
                                <div className="flex gap-3 pt-1">
                                    <button type="button" onClick={() => { setForgotOpen(false); setForgotStatus(''); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">{l.cancel}</button>
                                    <button type="submit" disabled={forgotStatus === 'sending'} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors">
                                        {forgotStatus === 'sending' ? l.sending : l.sendLink}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;
