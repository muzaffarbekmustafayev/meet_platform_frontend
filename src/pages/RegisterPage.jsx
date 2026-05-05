import React, { useState, useContext } from 'react';
import API from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import MeetraLogo from '../MeetraLogo/MeetraLogo';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t } = useContext(ThemeLanguageContext);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.post('/api/users/register', { name, email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            
            if (data.role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/';
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B1120] font-sans relative overflow-hidden transition-colors duration-500 p-4">
            <div className="relative z-10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl p-6 sm:p-12 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] w-full max-w-md border border-white/50 dark:border-gray-700/50 transition-all duration-300">
                <div className="text-center mb-8 sm:mb-10">
                    <div className="flex justify-center mb-4">
                        <MeetraLogo className="w-16 h-16 sm:w-20 sm:h-20" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('create_identity')}</h2>
                    <p className="text-slate-500 dark:text-gray-400 text-sm font-bold uppercase tracking-widest mt-3">{t('join_network')}</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1 group-focus-within:text-indigo-500 transition-colors">{t('full_identity_name')}</label>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 shadow-sm"
                            required
                        />
                    </div>
                    <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1 group-focus-within:text-indigo-500 transition-colors">{t('network_email')}</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 shadow-sm"
                            required
                        />
                    </div>
                    <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1 group-focus-within:text-indigo-500 transition-colors">{t('security_key')}</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all duration-200 shadow-sm"
                            required
                        />
                    </div>
                    {error && (
                        <div className="bg-rose-50/80 dark:bg-rose-900/20 backdrop-blur-sm text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl text-xs font-bold border border-rose-100 dark:border-rose-900/30 animate-shake">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.98]"
                    >
                        {t('register_node')}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-gray-700/50 text-center">
                    <p className="text-xs font-bold text-slate-500 dark:text-gray-400">
                        {t('already_registered')} <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors ml-1">{t('sign_in_protocol')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
