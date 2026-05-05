import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../api';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useContext(ThemeLanguageContext);
    
    const [isLogin, setIsLogin] = useState(location.pathname === '/login' || location.pathname === '/');
    
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    // Forgot Password State
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotStatus, setForgotStatus] = useState('');

    useEffect(() => {
        setIsLogin(location.pathname === '/login');
    }, [location.pathname]);

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        navigate(isLogin ? '/register' : '/login');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                const { data } = await API.post('/api/users/login', { email, password });
                localStorage.setItem('userInfo', JSON.stringify(data));
                window.location.href = data.role === 'admin' ? '/admin' : '/dashboard';
            } else {
                const { data } = await API.post('/api/users/register', { name, username, email, password });
                localStorage.setItem('userInfo', JSON.stringify(data));
                window.location.href = data.role === 'admin' ? '/admin' : '/dashboard';
            }
        } catch (err) {
            setError(err.response?.data?.message || (isLogin ? 'Login failed' : 'Registration failed'));
        }
    };

    const handleGuestJoin = () => {
        const guestName = window.prompt('Enter your name for the meeting:');
        if (guestName) {
            const guestInfo = { name: guestName, role: 'guest', _id: 'guest-' + Math.random().toString(36).substring(7) };
            localStorage.setItem('userInfo', JSON.stringify(guestInfo));
            window.location.href = '/';
        }
    };

    const handleGoogleLogin = () => {
        // In a real app, this would use react-oauth/google or firebase auth
        // For now, it will redirect to a backend endpoint or show a message
        alert("Google Authentication will be implemented with actual Google Client ID. You need to configure OAuth on Google Cloud Console.");
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

    // Google Icon SVG
    const GoogleIcon = () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1120] p-4 sm:p-8 font-sans transition-colors duration-500 overflow-hidden relative">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[200px] md:w-[300px] h-[200px] md:h-[300px] bg-purple-500/5 rounded-full blur-[80px]" />
            </div>

            <div className="w-full max-w-[1000px] min-h-[500px] md:min-h-[660px] bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-gray-100 dark:border-gray-800/50">
                
                {/* Auth Container with Overlay Logic */}
                <div className="w-full flex flex-col md:flex-row relative min-h-inherit">
                    
                    {/* Sliding Overlay Panel (Blue) - Hidden on mobile */}
                    <div 
                        className={`hidden md:flex absolute md:top-0 h-full w-full md:w-1/2 bg-blue-600 dark:bg-blue-700 text-white p-6 md:p-12 flex-col justify-between z-30 transition-all duration-500 ease-in-out
                            ${isLogin 
                                ? 'md:left-1/2 md:rounded-r-[2.5rem]' 
                                : 'md:left-0 md:rounded-l-[2.5rem]'}
                        `}
                    >
                        <div className="flex items-center space-x-2">
                            <Link to="/" className="flex items-center text-blue-100 hover:text-white transition-colors group">
                                <ArrowLeft size={18} className="mr-2 transform group-hover:-translate-x-1 transition-transform" />
                                <span className="font-semibold tracking-wide uppercase text-xs tracking-[0.2em]">{t(isLogin ? 'home' : 'back')}</span>
                            </Link>
                        </div>
                        
                        <div className="flex-grow flex flex-col justify-center items-start text-left py-12">
                            <h2 className="text-5xl font-black mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {t(isLogin ? 'hello_friend' : 'welcome_back_title')}
                            </h2>
                            <p className="text-blue-100 mb-10 text-lg max-w-sm leading-relaxed opacity-90">
                                {t(isLogin ? 'login_desc' : 'register_desc')}
                            </p>
                            <button 
                                onClick={toggleMode}
                                className="px-12 py-4 rounded-2xl border-2 border-white/30 text-white font-black hover:bg-white hover:text-blue-600 hover:border-white transition-all duration-300 transform active:scale-95 tracking-widest text-xs uppercase"
                            >
                                {t(isLogin ? 'sign_up' : 'sign_in')}
                            </button>
                        </div>
                    </div>

                    {/* Form Panels Container */}
                    <div className="flex-1 flex relative h-full">
                        
                        {/* Login Form Panel */}
                        <div className={`w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center transition-all duration-500 h-full absolute md:static
                            ${isLogin ? 'opacity-100 translate-x-0 z-20' : 'opacity-0 md:-translate-x-20 translate-x-10 z-10 pointer-events-none'}
                        `}>
                            <div className="w-full max-w-sm mx-auto">
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white text-center mb-2 tracking-tight">{t('login_title')}</h2>
                                <p className="text-gray-400 text-center mb-10 text-sm font-medium">{t('enter_details')}</p>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder={t('network_email')}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                            required={isLogin}
                                        />
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder={t('security_key')}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-11 pr-12 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                            required={isLogin}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-500 transition-colors">
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                                        <label className="flex items-center cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                            <input type="checkbox" className="mr-2 w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-gray-200 dark:border-gray-700" />
                                            {t('remember_me')}
                                        </label>
                                        <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-blue-600 dark:text-blue-400 hover:underline">
                                            {t('forgot_password')}
                                        </button>
                                    </div>

                                    {error && isLogin && (
                                        <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-4 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/30 animate-in fade-in zoom-in duration-300">
                                            {error}
                                        </div>
                                    )}

                                    <button type="submit" className="w-full gradient-blue text-white py-4 rounded-2xl font-black text-sm tracking-[0.2em] uppercase transition-all duration-300 shadow-xl shadow-blue-600/20 transform active:scale-95 mt-4">
                                        {t('sign_in')}
                                    </button>

                                    {/* Mobile toggle link */}
                                    <div className="md:hidden text-center mt-6">
                                        <p className="text-sm text-gray-500">
                                            {t('register_desc')}
                                            <button type="button" onClick={toggleMode} className="ml-2 text-blue-600 font-bold hover:underline uppercase text-xs tracking-widest">
                                                {t('sign_up')}
                                            </button>
                                        </p>
                                    </div>

                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-gray-800"></div></div>
                                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400"><span className="px-4 bg-white dark:bg-gray-900">{t('social')}</span></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button type="button" onClick={handleGoogleLogin} className="flex items-center justify-center gap-2 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95 text-xs font-bold text-gray-600 dark:text-gray-300">
                                            <GoogleIcon /> Google
                                        </button>
                                        <button type="button" onClick={handleGuestJoin} className="py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95 text-xs font-bold text-gray-600 dark:text-gray-300">
                                            {t('guest_mode')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Register Form Panel */}
                        <div className={`w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center transition-all duration-500 h-full absolute md:static right-0
                            ${!isLogin ? 'opacity-100 translate-x-0 z-20' : 'opacity-0 md:translate-x-20 -translate-x-10 z-10 pointer-events-none'}
                        `}>
                            <div className="w-full max-w-sm mx-auto">
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white text-center mb-2 tracking-tight">{t('register_title')}</h2>
                                <p className="text-gray-400 text-center mb-8 text-sm font-medium">{t('create_free_account')}</p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <User size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={t('full_identity_name')}
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                            required={!isLogin}
                                        />
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <span className="font-bold text-sm">@</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder={t('username')}
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                            required={!isLogin}
                                        />
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder={t('network_email')}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                            required={!isLogin}
                                        />
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder={t('security_key')}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-11 pr-12 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                                            required={!isLogin}
                                        />
                                    </div>

                                    <label className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                                        <input type="checkbox" className="mr-2 w-4 h-4 rounded-md text-blue-600 focus:ring-blue-500 border-gray-200 dark:border-gray-700" required />
                                        {t('accept_terms')}
                                    </label>

                                    {error && !isLogin && (
                                        <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-4 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/30 animate-in fade-in zoom-in duration-300">
                                            {error}
                                        </div>
                                    )}

                                    <button type="submit" className="w-full gradient-blue text-white py-4 rounded-2xl font-black text-sm tracking-[0.2em] uppercase transition-all duration-300 shadow-xl shadow-blue-600/20 transform active:scale-95 mt-4">
                                        {t('sign_up')}
                                    </button>

                                    {/* Mobile toggle link */}
                                    <div className="md:hidden text-center mt-6">
                                        <p className="text-sm text-gray-500">
                                            {t('login_desc')}
                                            <button type="button" onClick={toggleMode} className="ml-2 text-blue-600 font-bold hover:underline uppercase text-xs tracking-widest">
                                                {t('sign_in')}
                                            </button>
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>




            {/* Forgot Password Modal */}
            {isForgotModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl transform transition-all duration-300 scale-100 opacity-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h3>
                            <button onClick={() => setIsForgotModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                        
                        {forgotStatus === 'success' ? (
                            <div className="bg-green-50 text-green-600 p-4 rounded-xl text-center font-medium">
                                Check your email for a reset link!
                            </div>
                        ) : (
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        required
                                    />
                                </div>
                                {forgotStatus && forgotStatus !== 'sending' && (
                                    <div className="text-red-500 text-sm mt-2">{forgotStatus}</div>
                                )}
                                <button
                                    type="submit"
                                    disabled={forgotStatus === 'sending'}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-bold transition-all duration-300"
                                >
                                    {forgotStatus === 'sending' ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;
