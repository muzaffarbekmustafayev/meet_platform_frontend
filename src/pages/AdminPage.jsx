import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';

const AdminPage = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState({ name: '', email: '', password: '', username: '', role: 'user' });
    const navigate = useNavigate();
    const { t } = useContext(ThemeLanguageContext);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, meetingsRes] = await Promise.all([
                API.get('/api/admin/stats'),
                API.get('/api/admin/users'),
                API.get('/api/admin/meetings')
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data || []);
            setMeetings(meetingsRes.data || []);
        } catch (error) {
            console.error('Failed to fetch admin data', error);
            setUsers([]);
            setMeetings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        window.location.reload();
    };

    const toggleBlock = async (id) => {
        try {
            await API.put(`/api/admin/users/${id}/block`);
            fetchData();
        } catch (error) {
            alert('Action failed');
        }
    };

    const handleDeleteMeeting = async (id) => {
        if (window.confirm("Are you sure you want to delete this meeting?")) {
            try {
                await API.delete(`/api/admin/meetings/${id}`);
                fetchData();
            } catch (error) {
                alert('Action failed');
            }
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await API.put(`/api/admin/users/${currentUser._id}`, currentUser);
            } else {
                await API.post('/api/admin/users', currentUser);
            }
            setShowModal(false);
            setCurrentUser({ name: '', email: '', password: '', role: 'participant' });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Save failed');
        }
    };

    const openEditModal = (user) => {
        setCurrentUser({ ...user, password: '' });
        setEditMode(true);
        setShowModal(true);
    };

    const openAddModal = () => {
        setCurrentUser({ name: '', email: '', password: '', username: '', role: 'user' });
        setEditMode(false);
        setShowModal(true);
    };

    if (loading && !stats) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    );

    const navigationItems = [
        {
            id: 'overview',
            label: t('overview'),
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        },
        {
            id: 'users',
            label: t('users'),
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
        },
        {
            id: 'meetings',
            label: t('meetings'),
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        },
        {
            id: 'back',
            label: t('back_to_app'),
            path: '/',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        }
    ];

    const topHeaderTitle = activeTab === 'overview' ? t('overview') : activeTab === 'users' ? t('users') : t('meetings');
    
    const actionButton = activeTab === 'users' ? (
        <button 
            onClick={openAddModal}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
            + {t('add_user')}
        </button>
    ) : null;

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans overflow-hidden transition-colors">
            <Sidebar 
                title="Admin"
                titleInitial="A"
                navigationItems={navigationItems}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleLogout={handleLogout}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto flex flex-col">
                <TopHeader 
                    title={topHeaderTitle}
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    actionButton={actionButton}
                />

                <div className="max-w-7xl mx-auto w-full p-6 md:p-8">
                    {activeTab === 'overview' ? (
                        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {[
                                { label: t('total_users'), value: stats?.totalUsers, color: 'text-blue-600 dark:text-blue-400' },
                                { label: t('active_meetings'), value: stats?.totalMeetings, color: 'text-indigo-600 dark:text-indigo-400' },
                                { label: t('host_nodes'), value: stats?.hosts, color: 'text-emerald-600 dark:text-emerald-400' },
                                { label: t('participants'), value: stats?.participants, color: 'text-amber-600 dark:text-amber-400' },
                            ].map((s, i) => (
                                <div key={i} className="relative overflow-hidden bg-white dark:bg-gray-800/80 backdrop-blur-md p-5 sm:p-7 border border-gray-100 dark:border-gray-700/50 shadow-lg shadow-gray-200/50 dark:shadow-black/20 rounded-2xl sm:rounded-[1.5rem] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-600">
                                    <div className="relative z-10">
                                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest">{s.label}</p>
                                        <p className={`text-2xl sm:text-4xl font-black ${s.color} drop-shadow-sm tracking-tight`}>{s.value || 0}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'users' ? (
                        <div className="space-y-4">
                            {/* Desktop Table */}
                            <div className="hidden md:block bg-white dark:bg-gray-800/90 backdrop-blur-xl border border-gray-100 dark:border-gray-700/50 shadow-xl shadow-gray-200/50 dark:shadow-black/20 rounded-[1.5rem] overflow-hidden transition-all duration-300">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
                                        <thead className="bg-gray-50/80 dark:bg-gray-900/40">
                                            <tr>
                                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('name_email')}</th>
                                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('role')}</th>
                                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('status')}</th>
                                                <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-100 dark:divide-gray-700/50">
                                            {users.length > 0 ? users.map((u) => (
                                                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium">
                                                                {u.name ? u.name[0].toUpperCase() : '?'}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 capitalize">
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.isBlocked ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'}`}>
                                                            {u.isBlocked ? 'Blocked' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button onClick={() => openEditModal(u)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4">Edit</button>
                                                        <button onClick={() => toggleBlock(u._id)} className={u.isBlocked ? 'text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300' : 'text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300'}>
                                                            {u.isBlocked ? 'Unblock' : 'Block'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                        No users found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden grid grid-cols-1 gap-4">
                                {users.length > 0 ? users.map((u) => (
                                    <div key={u._id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <div className="flex items-center mb-4">
                                            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                                {u.name ? u.name[0].toUpperCase() : '?'}
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{u.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700/50">
                                            <div className="flex gap-2">
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 uppercase tracking-wider">{u.role}</span>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${u.isBlocked ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'} uppercase tracking-wider`}>
                                                    {u.isBlocked ? 'Blocked' : 'Active'}
                                                </span>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => openEditModal(u)} className="text-sm font-bold text-blue-600 dark:text-blue-400">Edit</button>
                                                <button onClick={() => toggleBlock(u._id)} className={`text-sm font-bold ${u.isBlocked ? 'text-green-600' : 'text-red-600'}`}>{u.isBlocked ? 'Unblock' : 'Block'}</button>
                                            </div>
                                        </div>
                                    </div>
                                )) : <div className="text-center py-10 text-gray-500">No users found.</div>}
                            </div>
                        </div>
                    ) : activeTab === 'meetings' ? (
                        <div className="space-y-4">
                            {/* Desktop Table */}
                            <div className="hidden md:block bg-white dark:bg-gray-800/90 backdrop-blur-xl border border-gray-100 dark:border-gray-700/50 shadow-xl shadow-gray-200/50 dark:shadow-black/20 rounded-[1.5rem] overflow-hidden transition-all duration-300">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700/50">
                                        <thead className="bg-gray-50/80 dark:bg-gray-900/40">
                                            <tr>
                                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('meeting_title_id')}</th>
                                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('host')}</th>
                                                <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('date')}</th>
                                                <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-100 dark:divide-gray-700/50">
                                            {meetings.length > 0 ? meetings.map((m) => (
                                                <tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{m.title}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{m.meetingCode}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white">{m.hostId?.name || 'Unknown'}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{m.hostId?.email || ''}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(m.createdAt).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button onClick={() => handleDeleteMeeting(m._id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">Delete</button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                        No meetings found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden grid grid-cols-1 gap-4">
                                {meetings.length > 0 ? meetings.map((m) => (
                                    <div key={m._id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                        <div className="mb-3">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{m.title}</div>
                                            <div className="text-xs text-blue-600 dark:text-blue-400 font-mono tracking-wider">{m.meetingCode}</div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('host')}</div>
                                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{m.hostId?.name || 'Unknown'}</div>
                                                <div className="text-[10px] text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <button onClick={() => handleDeleteMeeting(m._id)} className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-all active:scale-95">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )) : <div className="text-center py-10 text-gray-500">No meetings found.</div>}
                            </div>
                        </div>
                    ) : null}
                </div>
            </main>

            {/* Premium Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
                    <div className="bg-white dark:bg-gray-800/95 w-full max-w-md rounded-[2rem] shadow-2xl shadow-blue-900/20 dark:shadow-black/50 border border-white/50 dark:border-gray-700/50 overflow-hidden transform scale-100 opacity-100 transition-all">
                        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">{editMode ? 'Edit User' : t('add_user')}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-800 rounded-full p-2 shadow-sm border border-gray-100 dark:border-gray-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-6 sm:p-8">
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={currentUser.name}
                                        onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                                        className="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={currentUser.email}
                                        onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                                        className="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Username</label>
                                    <input 
                                        type="text" 
                                        value={currentUser.username}
                                        onChange={(e) => setCurrentUser({...currentUser, username: e.target.value})}
                                        className="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                        placeholder="username (optional)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">{editMode || currentUser.role === 'guest' ? 'Password (Optional)' : 'Password'}</label>
                                    <input 
                                        type="password" 
                                        required={!editMode && currentUser.role !== 'guest'}
                                        value={currentUser.password}
                                        onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})}
                                        className="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                                        placeholder={editMode || currentUser.role === 'guest' ? "Leave blank to keep current" : "••••••••"}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 px-1">Role</label>
                                    <select 
                                        value={currentUser.role}
                                        onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
                                        className="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowModal(false)} className="py-3 px-5 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-all active:scale-[0.98]">
                                    Cancel
                                </button>
                                <button type="submit" className="py-3 px-5 rounded-xl shadow-lg shadow-blue-500/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-all active:scale-[0.98]">
                                    {editMode ? 'Save Changes' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
