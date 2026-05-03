import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const AdminPage = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState({ name: '', email: '', password: '', role: 'participant' });
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes] = await Promise.all([
                API.get('/api/admin/stats'),
                API.get('/api/admin/users')
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data || []);
        } catch (error) {
            console.error('Failed to fetch admin data', error);
            setUsers([]);
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
        setCurrentUser({ name: '', email: '', password: '', role: 'participant' });
        setEditMode(false);
        setShowModal(true);
    };

    if (loading && !stats) return (
        <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#f1f5f9] text-slate-800 font-sans overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Modern Classic Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1e293b] text-white flex flex-col shrink-0 shadow-2xl md:shadow-xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 md:p-8 border-b border-slate-700/50 flex justify-between items-center">
                    <h1 className="text-xl font-black tracking-tight flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white text-sm">Z</span>
                        </div>
                        ADMIN
                    </h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"></path></svg>
                    </button>
                </div>
                
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        User Directory
                    </button>
                </nav>

                <div className="p-6 border-t border-slate-700/50">
                    <button 
                        onClick={handleLogout}
                        className="w-full py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-rose-500/20"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto relative">
                <header className="bg-white border-b border-slate-200 px-6 md:px-10 py-5 md:py-6 flex flex-col sm:flex-row justify-between sm:items-center sticky top-0 z-10 gap-4">
                    <div className="flex items-start gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 mt-1 -ml-2 bg-slate-50 border border-slate-200 rounded-lg shadow-sm text-slate-600 hover:text-blue-600 shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2"></path></svg>
                        </button>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                                {activeTab === 'overview' ? 'System Analytics' : 'User Management'}
                            </h2>
                            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                {activeTab === 'overview' ? 'Real-time performance metrics' : 'Directory of all registered nodes'}
                            </p>
                        </div>
                    </div>
                    {activeTab === 'users' && (
                        <button 
                            onClick={openAddModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 md:px-6 md:py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 w-full sm:w-auto"
                        >
                            + New Instance
                        </button>
                    )}
                </header>

                <div className="p-6 md:p-10">
                    {activeTab === 'overview' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                            {[
                                { label: 'Total Users', value: stats?.totalUsers, color: 'text-blue-600' },
                                { label: 'Active Meetings', value: stats?.totalMeetings, color: 'text-indigo-600' },
                                { label: 'Host Nodes', value: stats?.hosts, color: 'text-emerald-600' },
                                { label: 'Participants', value: stats?.participants, color: 'text-orange-600' },
                            ].map((s, i) => (
                                <div key={i} className="bg-white p-8 border border-white shadow-xl shadow-slate-200/50 rounded-[2.5rem] transition-all hover:translate-y-[-4px]">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{s.label}</p>
                                    <p className={`text-4xl font-black ${s.color}`}>{s.value || 0}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-100 shadow-xl shadow-slate-200/60 rounded-[2rem] overflow-hidden overflow-x-auto w-full">
                            <div className="min-w-[800px]">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/30">
                                            <th className="px-6 py-6 md:px-8 md:py-8">User Identity</th>
                                            <th className="px-6 py-6 md:px-8 md:py-8">Authorization</th>
                                            <th className="px-8 py-8">Status</th>
                                            <th className="px-8 py-8 text-right">Protocol</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {users.length > 0 ? users.map((u) => (
                                            <tr key={u._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-6 md:px-8 md:py-8">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg mr-4 border border-slate-200 shrink-0">
                                                            {u.name ? u.name[0].toUpperCase() : '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 uppercase tracking-wide">{u.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium mt-1">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 md:px-8 md:py-8">
                                                    <span className="bg-slate-100 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-200 inline-block whitespace-nowrap">
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 md:px-8 md:py-8">
                                                    <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] ${u.isBlocked ? 'bg-rose-100 text-rose-600 shadow-sm shadow-rose-200' : 'bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-200'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${u.isBlocked ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                                        {u.isBlocked ? 'Inhibited' : 'Operational'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 md:px-8 md:py-8 text-right">
                                                    <div className="flex justify-end space-x-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openEditModal(u)} className="p-2.5 md:p-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                        </button>
                                                        <button onClick={() => toggleBlock(u._id)} className={`p-3 rounded-xl transition-all shadow-sm ${u.isBlocked ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`}>
                                                            {u.isBlocked ? (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="4" className="px-8 py-20 text-center text-slate-400 font-bold italic">
                                                    No user instances detected in current directory.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modern Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white">
                        <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{editMode ? 'Modify Instance' : 'Create New Instance'}</h3>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-200 text-slate-400 transition-colors">×</button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Identity Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={currentUser.name}
                                        onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                                        className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500/30 outline-none transition-all shadow-sm"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Network Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={currentUser.email}
                                        onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                                        className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500/30 outline-none transition-all shadow-sm"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{editMode ? 'Security Key (Optional)' : 'Security Key'}</label>
                                <input 
                                    type="password" 
                                    required={!editMode}
                                    value={currentUser.password}
                                    onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})}
                                    className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500/30 outline-none transition-all shadow-sm"
                                    placeholder={editMode ? "Leave blank to keep current" : "••••••••"}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Authorization Level</label>
                                <select 
                                    value={currentUser.role}
                                    onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
                                    className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black text-slate-900 focus:bg-white focus:border-blue-500/30 outline-none transition-all shadow-sm appearance-none"
                                >
                                    <option value="participant">Participant</option>
                                    <option value="host">Host</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="pt-6 flex space-x-4">
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] transition-all text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95">
                                    {editMode ? 'Update Node' : 'Execute Creation'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-5 rounded-[2rem] transition-all text-xs uppercase tracking-widest active:scale-95">
                                    Abort
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
