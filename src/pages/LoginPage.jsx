import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('http://localhost:5000/api/users/login', { email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            window.location.reload(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    const handleGuestJoin = () => {
        const guestName = prompt('Enter your name for the meeting:');
        if (guestName) {
            const guestInfo = { name: guestName, role: 'guest', _id: 'guest-' + Math.random() };
            localStorage.setItem('userInfo', JSON.stringify(guestInfo));
            window.location.reload();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-blue-600 mb-8 text-3xl">Zoom Clone</h2>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-200"
                    >
                        Sign In
                    </button>
                </form>
                <div className="mt-6 flex flex-col space-y-4">
                    <button
                        onClick={handleGuestJoin}
                        className="w-full bg-gray-200 text-gray-700 py-2 rounded-md font-semibold hover:bg-gray-300 transition duration-200"
                    >
                        Join as Guest
                    </button>
                    <p className="text-center text-sm text-gray-600">
                        New User? <Link to="/register" className="text-blue-600 hover:underline">Register here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
