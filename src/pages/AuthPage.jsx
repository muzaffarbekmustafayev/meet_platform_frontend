import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../api';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Meetra';

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

// Stagger animation CSS injected once
const staggerStyles = `
@keyframes authFadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes authErrorSlide {
  from { opacity: 0; transform: translateY(-8px) scaleY(0.95); }
  to { opacity: 1; transform: translateY(0) scaleY(1); }
}
.auth-stagger > * {
  opacity: 0;
  animation: authFadeUp 0.5s ease forwards;
}
.auth-stagger > *:nth-child(1) { animation-delay: 0.05s; }
.auth-stagger > *:nth-child(2) { animation-delay: 0.10s; }
.auth-stagger > *:nth-child(3) { animation-delay: 0.15s; }
.auth-stagger > *:nth-child(4) { animation-delay: 0.20s; }
.auth-stagger > *:nth-child(5) { animation-delay: 0.25s; }
.auth-stagger > *:nth-child(6) { animation-delay: 0.30s; }
.auth-stagger > *:nth-child(7) { animation-delay: 0.35s; }
.auth-stagger > *:nth-child(8) { animation-delay: 0.40s; }
.auth-stagger > *:nth-child(9) { animation-delay: 0.45s; }
.auth-stagger > *:nth-child(10) { animation-delay: 0.50s; }
.auth-error-animate {
  animation: authErrorSlide 0.35s ease forwards;
}
`;

// Simple inline guest name prompt modal
const GuestNameModal = ({ onConfirm, onCancel }) => {
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Guest Mode</h3>
                <div className="space-y-3 mb-6">
                    <input
                        autoFocus
                        type="text"
                        placeholder="Your name"
                        value={guestName}
                        onChange={e => setGuestName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-inner shadow-gray-100 dark:shadow-gray-900 transition-all"
                    />
                    <input
                        type="email"
                        placeholder="Email (optional)"
                        value={guestEmail}
                        onChange={e => setGuestEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-inner shadow-gray-100 dark:shadow-gray-900 transition-all"
                    />
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">Cancel</button>
                    <button
                        onClick={() => guestName.trim() && onConfirm(guestName.trim(), guestEmail.trim())}
                        disabled={!guestName.trim()}
                        className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useContext(ThemeLanguageContext);
    const { login } = useAuth();
    const toast = useToast();

    const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotStatus, setForgotStatus] = useState('');

    const [showGuestModal, setShowGuestModal] = useState(false);

    // Key to force remount stagger animation on toggle
    const [formKey, setFormKey] = useState(0);

    useEffect(() => {
        setIsLogin(location.pathname !== '/register');
        setFormKey(k => k + 1);
    }, [location.pathname]);

    const toggleMode = () => {
        setError('');
        navigate(isLogin ? '/register' : '/login');
    };

    const handleSubmit = async (e) => {
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

    const handleGuestJoin = async (guestName, guestEmail) => {
        setShowGuestModal(false);
        try {
            const { data } = await API.post('/api/users/guest-login', {
                name: guestName,
                email: guestEmail || `guest+${crypto.randomUUID()}@guest.local`
            });
            login(data);
            navigate('/', { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Guest login failed');
        }
    };

    const handleGoogleLogin = () => {
        toast.info('Google Authentication requires OAuth configuration.');
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotStatus('sending');
        try {
            await API.post('/api/users/forgot-password', { email: forgotEmail });
            setForgotStatus('success');
        } catch (err) {
            setForgotStatus(err.response?.data?.message || 'Failed to send reset link');
        }
    };

    const inputCls = "w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500 shadow-inner shadow-gray-100/50 dark:shadow-gray-900/50 transition-all duration-200";

    return (
        <>
            <style>{staggerStyles}</style>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1120] p-4 sm:p-8 font-sans transition-colors duration-500 overflow-hidden relative">
                {/* Background blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-purple-500/5 rounded-full blur-[80px]" />
                </div>

                <div className="w-full max-w-[1000px] min-h-[500px] md:min-h-[660px] bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-black/30 overflow-hidden flex flex-col md:flex-row relative z-10 border border-gray-100 dark:border-gray-800/50">
                    <div className="w-full flex flex-col md:flex-row relative min-h-inherit">

                        {/* Sliding gradient overlay panel */}
                        <div
                            className={`hidden md:flex absolute md:top-0 h-full w-full md:w-1/2 text-white p-6 md:p-12 flex-col justify-between z-30 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
                                ${isLogin ? 'md:left-1/2 md:rounded-r-[2.5rem]' : 'md:left-0 md:rounded-l-[2.5rem]'}`}
                            style={{
                                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 40%, #6366f1 100%)',
                            }}
                        >
                            {/* Mesh-like decorative shapes */}
                            <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
                                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-400/15 rounded-full blur-xl" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-300/10 rounded-full blur-lg" />
                            </div>

                            <div className="flex items-center space-x-2 relative z-10">
                                <Link to="/" className="flex items-center text-blue-100 hover:text-white transition-colors group">
                                    <ArrowLeft size={18} className="mr-2 transform group-hover:-translate-x-1 transition-transform" />
                                    <span className="font-semibold text-xs tracking-[0.2em] uppercase">{t(isLogin ? 'home' : 'back')}</span>
                                </Link>
                            </div>
                            <div className="flex-grow flex flex-col justify-center items-start text-left py-12 relative z-10">
                                <div className="text-sm font-bold tracking-[0.3em] uppercase text-blue-200 mb-4">{APP_NAME}</div>
                                <h2 className="text-5xl font-black mb-6 tracking-tight leading-tight">{t(isLogin ? 'hello_friend' : 'welcome_back_title')}</h2>
                                <p className="text-blue-100/90 mb-10 text-lg max-w-sm leading-relaxed">
                                    {t(isLogin ? 'login_desc' : 'register_desc')}
                                </p>
                                <button
                                    onClick={toggleMode}
                                    className="px-12 py-4 rounded-2xl border-2 border-white/30 text-white font-black hover:bg-white hover:text-blue-600 hover:border-white hover:shadow-lg hover:shadow-white/20 transition-all duration-300 active:scale-[0.98] tracking-widest text-xs uppercase backdrop-blur-sm"
                                >
                                    {t(isLogin ? 'sign_up' : 'sign_in')}
                                </button>
                            </div>
                        </div>

                        {/* Forms container */}
                        <div className="flex-1 flex relative h-full">
                            {/* Login */}
                            <div className={`w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] h-full absolute md:static
                                ${isLogin ? 'opacity-100 translate-x-0 scale-100 z-20' : 'opacity-0 md:-translate-x-10 translate-x-10 scale-95 z-10 pointer-events-none'}`}>
                                <div className="w-full max-w-sm mx-auto">
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white text-center mb-2 tracking-tight">{t('login_title')}</h2>
                                    <p className="text-gray-400 text-center mb-10 text-sm font-medium">{t('enter_details')}</p>
                                    <form onSubmit={handleSubmit} className="space-y-5 auth-stagger" key={`login-${formKey}`}>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"><Mail size={18} /></div>
                                            <input type="email" placeholder={t('network_email')} value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required />
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"><Lock size={18} /></div>
                                            <input type={showPassword ? 'text' : 'password'} placeholder={t('security_key')} value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-12`} required />
                                            <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors" aria-label="Toggle password">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                                            <label className="flex items-center cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                                <input type="checkbox" className="mr-2 w-4 h-4 rounded-md accent-blue-600" />
                                                {t('remember_me')}
                                            </label>
                                            <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-blue-600 dark:text-blue-400 hover:underline">{t('forgot_password')}</button>
                                        </div>
                                        {error && isLogin && (
                                            <div className="auth-error-animate bg-red-50 dark:bg-red-900/20 text-red-500 p-4 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-900/30">{error}</div>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full text-white py-4 rounded-2xl font-black text-sm tracking-[0.2em] uppercase transition-all duration-300 shadow-xl shadow-blue-600/20 active:scale-[0.98] mt-4 disabled:opacity-60"
                                            style={{ background: 'linear-gradient(to bottom, #2563eb, #1d4ed8)' }}
                                        >
                                            {loading ? '...' : t('sign_in')}
                                        </button>

                                        {/* Mobile toggle - more prominent */}
                                        <div className="md:hidden text-center mt-6">
                                            <div className="text-gray-400 text-xs mb-2">{t('login_desc')}</div>
                                            <button
                                                type="button"
                                                onClick={toggleMode}
                                                className="inline-flex items-center justify-center px-8 py-3 rounded-2xl text-blue-600 dark:text-blue-400 font-bold uppercase text-xs tracking-widest border-2 border-blue-600/20 dark:border-blue-400/20 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-[0.98]"
                                            >
                                                {t('sign_up')}
                                            </button>
                                        </div>

                                        <div className="relative py-4">
                                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-800" /></div>
                                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400"><span className="px-4 bg-white dark:bg-gray-900">{t('social')}</span></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={handleGoogleLogin}
                                                className="flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 active:scale-[0.98] text-sm font-bold text-gray-600 dark:text-gray-300"
                                            >
                                                <GoogleIcon /> Google
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowGuestModal(true)}
                                                className="py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200 active:scale-[0.98] text-sm font-bold text-gray-600 dark:text-gray-300"
                                            >
                                                {t('guest_mode')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Register */}
                            <div className={`w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] h-full absolute md:static right-0
                                ${!isLogin ? 'opacity-100 translate-x-0 scale-100 z-20' : 'opacity-0 md:translate-x-10 -translate-x-10 scale-95 z-10 pointer-events-none'}`}>
                                <div className="w-full max-w-sm mx-auto">
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white text-center mb-2 tracking-tight">{t('register_title')}</h2>
                                    <p className="text-gray-400 text-center mb-8 text-sm font-medium">{t('create_free_account')}</p>
                                    <form onSubmit={handleSubmit} className="space-y-4 auth-stagger" key={`register-${formKey}`}>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"><User size={18} /></div>
                                            <input type="text" placeholder={t('full_identity_name')} value={name} onChange={e => setName(e.target.value)} className={inputCls} required={!isLogin} />
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"><span className="font-bold text-sm">@</span></div>
                                            <input type="text" placeholder={t('username')} value={username} onChange={e => setUsername(e.target.value)} className={inputCls} required={!isLogin} />
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"><Mail size={18} /></div>
                                            <input type="email" placeholder={t('network_email')} value={email} onChange={e => setEmail(e.target.value)} className={inputCls} required={!isLogin} />
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors"><Lock size={18} /></div>
                                            <input type={showPassword ? 'text' : 'password'} placeholder={t('security_key')} value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-12`} required={!isLogin} />
                                            <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors" aria-label="Toggle password">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <label className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                                            <input type="checkbox" className="mr-2 w-4 h-4 rounded-md accent-blue-600" required={!isLogin} />
                                            {t('accept_terms')}
                                        </label>
                                        {error && !isLogin && (
                                            <div className="auth-error-animate bg-red-50 dark:bg-red-900/20 text-red-500 p-4 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-900/30">{error}</div>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full text-white py-4 rounded-2xl font-black text-sm tracking-[0.2em] uppercase transition-all duration-300 shadow-xl shadow-blue-600/20 active:scale-[0.98] mt-4 disabled:opacity-60"
                                            style={{ background: 'linear-gradient(to bottom, #2563eb, #1d4ed8)' }}
                                        >
                                            {loading ? '...' : t('sign_up')}
                                        </button>

                                        {/* Mobile toggle - more prominent */}
                                        <div className="md:hidden text-center mt-6">
                                            <div className="text-gray-400 text-xs mb-2">{t('register_desc')}</div>
                                            <button
                                                type="button"
                                                onClick={toggleMode}
                                                className="inline-flex items-center justify-center px-8 py-3 rounded-2xl text-blue-600 dark:text-blue-400 font-bold uppercase text-xs tracking-widest border-2 border-blue-600/20 dark:border-blue-400/20 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-[0.98]"
                                            >
                                                {t('sign_in')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Guest Modal */}
                {showGuestModal && (
                    <GuestNameModal
                        onConfirm={handleGuestJoin}
                        onCancel={() => setShowGuestModal(false)}
                    />
                )}

                {/* Forgot Password Modal */}
                {isForgotModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h3>
                                <button onClick={() => { setIsForgotModalOpen(false); setForgotStatus(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" aria-label="Close">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Enter your email and we'll send you a reset link.</p>
                            {forgotStatus === 'success' ? (
                                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-xl text-center font-medium">Check your email for a reset link!</div>
                            ) : (
                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Mail size={20} /></div>
                                        <input type="email" placeholder="Email Address" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 shadow-inner shadow-gray-100/50 dark:shadow-gray-900/50 transition-all" required />
                                    </div>
                                    {forgotStatus && forgotStatus !== 'sending' && <div className="auth-error-animate text-red-500 text-sm">{forgotStatus}</div>}
                                    <button
                                        type="submit"
                                        disabled={forgotStatus === 'sending'}
                                        className="w-full text-white py-3 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-60"
                                        style={{ background: 'linear-gradient(to bottom, #2563eb, #1d4ed8)' }}
                                    >
                                        {forgotStatus === 'sending' ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AuthPage;
