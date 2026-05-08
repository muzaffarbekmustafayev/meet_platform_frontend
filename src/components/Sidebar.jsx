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
    isCollapsed = false,
    setIsCollapsed,
    extraContent 
}) => {
    const navigate = useNavigate();
    const { t } = useContext(ThemeLanguageContext);
    const initials = userInfo?.name
        ? userInfo.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
        : '?';

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
            <aside className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 transition-[transform,width] duration-300 ease-in-out md:relative md:translate-x-0 ${isCollapsed ? 'md:w-16' : 'md:w-60'} w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className={`h-16 flex items-center border-b border-gray-200 dark:border-gray-700 ${isCollapsed ? 'px-3 justify-center md:justify-between' : 'px-6 justify-between'}`}>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center min-w-0">
                        <div className={`w-8 h-8 bg-blue-600 rounded flex items-center justify-center ${isCollapsed ? '' : 'mr-3'}`}>
                            <span className="text-white text-lg font-bold">{titleInitial || title[0]}</span>
                        </div>
                        {!isCollapsed && <span className="truncate">{title}</span>}
                    </h1>
                    {setIsCollapsed && (
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <svg className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                    )}
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
                                    title={isCollapsed ? item.label : undefined}
                                    className={`w-full flex items-center text-sm font-medium rounded-xl transition-colors border-l-2 ${isCollapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5'} ${isActive ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    {item.icon}
                                    {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                                </button>
                            );
                        })}
                    </nav>

                    {extraContent && (
                        <div className={`mt-8 px-3 ${isCollapsed ? 'hidden md:hidden' : ''}`}>
                            {extraContent}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    {userInfo && (
                        <div className={`mb-4 ${isCollapsed ? 'flex justify-center' : 'flex items-center'}`}>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-400 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-lg shadow-blue-500/20 shrink-0">
                                {initials}
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0 ml-3">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userInfo.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userInfo.email || userInfo.role}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        title={isCollapsed ? t('sign_out') : undefined}
                        className={`border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${isCollapsed ? 'w-full flex items-center justify-center px-2 py-2.5' : 'w-full py-2.5 px-4'}`}
                    >
                        {isCollapsed ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        ) : (
                            t('sign_out')
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
