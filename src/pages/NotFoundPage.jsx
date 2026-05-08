import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';

const NotFoundPage = () => {
    const navigate = useNavigate();
    const { t } = useContext(ThemeLanguageContext);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                {/* 404 Title */}
                <div className="mb-8">
                    <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 leading-none">
                        404
                    </h1>
                </div>

                {/* Text */}
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    {t('page_not_found')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-base leading-relaxed">
                    {t('notfound_desc')}
                </p>

                {/* Illustration */}
                <div className="mb-10 flex justify-center">
                    <svg
                        className="w-32 h-32 text-gray-300 dark:text-gray-700"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                {/* Button */}
                <button
                    onClick={() => navigate('/', { replace: true })}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                    <Home size={18} />
                    {t('notfound_btn')}
                </button>

                {/* Decorative elements */}
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-gray-400 dark:text-gray-600">
                        {t('meeting_id_link')}:
                    </p>
                    <p className="text-sm font-mono text-gray-500 dark:text-gray-500 mt-1">
                        404.html
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
