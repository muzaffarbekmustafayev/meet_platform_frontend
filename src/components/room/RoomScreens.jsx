import React from 'react';
import { Clock, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WaitingRoom = () => (
    <div className="h-screen bg-gray-50 dark:bg-[#0e1018] flex flex-col items-center justify-center p-6 transition-colors">
        <div className="bg-white dark:bg-[#1a1d26] border border-gray-200 dark:border-white/8 rounded-3xl p-10 text-center max-w-md w-full shadow-xl">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-600/15 border border-blue-200 dark:border-blue-500/25 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Clock size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Kutish xonasi</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                Host sizni qabul qilishini kuting. Mikrofon va kamera tayyor.
            </p>
            <div className="flex justify-center gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
        </div>
    </div>
);

export const AccessDenied = () => {
    const navigate = useNavigate();
    return (
        <div className="h-screen bg-gray-50 dark:bg-[#0e1018] flex flex-col items-center justify-center p-6 transition-colors">
            <div className="bg-white dark:bg-[#1a1d26] border border-gray-200 dark:border-white/8 rounded-3xl p-10 text-center max-w-md w-full shadow-xl">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-600/15 border border-red-200 dark:border-red-500/25 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Lock size={28} className="text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Kirish rad etildi</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                    Host sizni ushbu uchrashuvga qabul qilmadi.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
                >
                    Bosh sahifaga
                </button>
            </div>
        </div>
    );
};
