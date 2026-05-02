import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const Dashboard = () => {
    const [roomID, setRoomID] = useState('');
    const [meetingTitle, setMeetingTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    const fetchHistory = async () => {
        try {
            const { data } = await API.get('/api/meetings');
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch history');
        }
    };

    useEffect(() => {
        if (userInfo?.token) fetchHistory();
    }, [userInfo]);

    const handleDeleteMeeting = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this meeting?')) {
            try {
                await API.delete(`/api/meetings/${id}`);
                fetchHistory();
            } catch (error) {
                alert('Failed to delete');
            }
        }
    };

    const handleShareMeeting = (e, code) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        alert('ID copied!');
    };

    const handleCreateRoom = async () => {
        setLoading(true);
        try {
            const { data } = await API.post('/api/meetings', { title: meetingTitle || `${userInfo.name}'s Meeting` });
            navigate(`/room/${data.meetingCode}`);
        } catch (error) {
            alert('Failed to create');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (roomID.trim()) navigate(`/room/${roomID}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        window.location.reload();
    };

    return (
        <div className="flex h-screen bg-[#f1f5f9] text-slate-800 font-sans overflow-hidden">
            {/* Unified Sidebar */}
            <aside className="w-72 bg-[#1e293b] text-white flex flex-col shrink-0 shadow-xl">
                <div className="p-8 border-b border-slate-700/50">
                    <h1 className="text-xl font-black flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                            <span className="text-white text-lg font-black">Z</span>
                        </div>
                        HUB
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto py-8">
                    <nav className="px-4 space-y-1">
                        <div className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20">
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                            <span className="text-sm font-bold">Dashboard</span>
                        </div>
                        {userInfo?.role === 'admin' && (
                            <button onClick={() => navigate('/admin')} className="w-full flex items-center px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                                <span className="text-sm font-bold">Admin Console</span>
                            </button>
                        )}
                    </nav>

                    {userInfo?.role !== 'participant' && history.length > 0 && (
                        <div className="mt-10 px-4">
                            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Recent History</p>
                            <div className="space-y-1">
                                {history.map((m) => (
                                    <div key={m._id} onClick={() => navigate(`/room/${m.meetingCode}`)} className="group p-4 rounded-xl hover:bg-slate-800 cursor-pointer transition-all border border-transparent hover:border-slate-700">
                                        <div className="flex justify-between items-start">
                                            <p className="text-xs font-black text-slate-300 group-hover:text-white truncate uppercase tracking-wide">{m.title}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <p className="text-[9px] text-slate-500 font-bold">{new Date(m.createdAt).toLocaleDateString()}</p>
                                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => handleShareMeeting(e, m.meetingCode)} className="p-1 hover:text-blue-400"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg></button>
                                                <button onClick={(e) => handleDeleteMeeting(e, m._id)} className="p-1 hover:text-rose-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-700/50">
                    <div className="flex items-center p-3 mb-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center mr-3 border border-slate-600 text-xs font-black">{userInfo?.name[0]}</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white truncate uppercase tracking-wider">{userInfo?.name}</p>
                            <p className="text-[9px] text-slate-500 truncate font-bold">{userInfo?.role}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-rose-500/20">Sign Out</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-12">
                <header className="mb-12">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Greetings, {userInfo?.name}!</h2>
                    <p className="text-slate-500 font-medium italic">Operational status: Ready for communication</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {userInfo?.role === 'host' && (
                        <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-white hover:translate-y-[-4px] transition-all">
                            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-600/20">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">New Meeting</h3>
                            <p className="text-sm text-slate-400 font-medium mb-8">Initiate a secure communication channel.</p>
                            <div className="space-y-4">
                                <input type="text" placeholder="Instance Name (Optional)" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500/30 outline-none transition-all" />
                                <button onClick={handleCreateRoom} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                                    {loading ? 'Processing...' : 'Execute Creation'}
                                </button>
                            </div>
                        </div>
                    )}

                    {userInfo?.role !== 'admin' && (
                        <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-white hover:translate-y-[-4px] transition-all">
                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-8 border border-slate-200">
                                <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"></path></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Join Room</h3>
                            <p className="text-sm text-slate-400 font-medium mb-8">Enter a network code to connect.</p>
                            <form onSubmit={handleJoinRoom} className="space-y-4">
                                <input type="text" placeholder="Network Code" value={roomID} onChange={(e) => setRoomID(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-500/30 outline-none transition-all" />
                                <button type="submit" disabled={!roomID} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50">
                                    Establish Link
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-white opacity-60">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-8 border border-slate-200">
                            <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2"></path></svg>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Schedule</h3>
                        <p className="text-sm text-slate-400 font-medium mb-8">Program future communication nodes.</p>
                        <button disabled className="w-full bg-slate-100 text-slate-400 font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest cursor-not-allowed">
                            Standby Mode
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
