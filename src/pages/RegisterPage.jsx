import React, { useState } from 'react';
import API from '../api';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.post('/api/users/register', { name, email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            window.location.reload(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] font-sans">
            <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 w-full max-w-md border border-white">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/20">
                        <span className="text-white text-2xl font-black">Z</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Identity</h2>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Join the communication network</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Full Identity Name</label>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500/30 outline-none transition-all shadow-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Network Email</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500/30 outline-none transition-all shadow-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Security Key</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500/30 outline-none transition-all shadow-sm"
                            required
                        />
                    </div>
                    {error && (
                        <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl text-xs font-bold border border-rose-100">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                    >
                        Register Node
                    </button>
                </form>

                <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs font-bold text-slate-400">
                        Already Registered? <Link to="/login" className="text-blue-600 hover:underline">Sign In Protocol</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
