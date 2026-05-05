import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';

const Sidebar = ({ 
    title, 
    titleInitial, 
    navigationItems, 
    activeTab, 
    setActiveTab, 
    userInfo, 
    handleLogout, 
    isSidebarOpen, 
    setIsSidebarOpen,
    extraContent 
}) => {
    const navigate = useNavigate();
    const { t } = useContext(ThemeLanguageContext);

    return (
        <>
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 z-40 md:hidden transition-opacity" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Classic Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                            <span className="text-white text-lg font-bold">{titleInitial || title[0]}</span>
                        </div>
                        {title}
                    </h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="px-3 space-y-1">
                        {navigationItems.map((item, index) => {
                            const isActive = activeTab ? activeTab === item.id : item.isActive;
                            return (
                                <button 
                                    key={index}
                                    onClick={() => {
                                        if (item.onClick) item.onClick();
                                        else if (item.path) navigate(item.path);
                                        else if (setActiveTab) setActiveTab(item.id);
                                    }}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    {item.icon}
                                    <span className="ml-3">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {extraContent && (
                        <div className="mt-8 px-3">
                            {extraContent}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    {userInfo && (
                        <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3 text-sm font-medium text-gray-600 dark:text-gray-300">
                                {userInfo.name ? userInfo.name[0].toUpperCase() : '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userInfo.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userInfo.role}</p>
                            </div>
                        </div>
                    )}
                    <button onClick={handleLogout} className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                        {t('sign_out')}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
