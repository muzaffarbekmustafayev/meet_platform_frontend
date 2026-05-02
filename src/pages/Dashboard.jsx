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
        if (window.confirm('Are you sure you want to delete this meeting from your history?')) {
            try {
                await API.delete(`/api/meetings/${id}`);
                fetchHistory();
            } catch (error) {
                alert('Failed to delete meeting');
            }
        }
    };

    const handleShareMeeting = (e, code) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        alert('Meeting ID copied to clipboard!');
    };

    const handleCreateRoom = async () => {
        setLoading(true);
        try {
            const { data } = await API.post('/api/meetings', { title: meetingTitle || `${userInfo.name}'s Meeting` });
            navigate(`/room/${data.meetingCode}`);
            setMeetingTitle('');
        } catch (error) {
            alert('Failed to create meeting');
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
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden text-slate-800 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-[#1e293b] flex flex-col hidden lg:flex border-r border-slate-200">
                <div className="p-6 border-b border-slate-700/50">
                    <h1 className="text-xl font-bold text-white flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white mr-3">
                            <span className="font-bold">Z</span>
                        </div>
                        Zoom Clone
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto py-6">
                    <div className="px-6 mb-4">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Main Navigation</h3>
                    </div>
                    
                    <nav className="space-y-1 px-3">
                        <div className="flex items-center px-3 py-2 bg-blue-600/10 text-blue-400 rounded-md border-l-2 border-blue-500">
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                            <span className="text-sm font-semibold">Dashboard</span>
                        </div>
                    </nav>

                    <div className="px-6 mt-10 mb-4">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recent Meetings</h3>
                    </div>
                    
                    <div className="space-y-1 px-3">
                        {history.length > 0 ? (
                            history.map((m) => (
                                <div 
                                    key={m._id} 
                                    onClick={() => navigate(`/room/${m.meetingCode}`)}
                                    className="p-3 rounded-md hover:bg-slate-800 cursor-pointer transition text-slate-400 hover:text-white group"
                                >
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-medium truncate flex-1 pr-2">{m.title}</p>
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                                            <button 
                                                onClick={(e) => handleShareMeeting(e, m.meetingCode)}
                                                className="p-1 hover:text-blue-400"
                                                title="Copy ID"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeleteMeeting(e, m._id)}
                                                className="p-1 hover:text-red-400"
                                                title="Delete"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[10px] opacity-50 mt-1">{new Date(m.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] text-slate-600 px-3 italic">No recent meetings</p>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700/50 bg-[#1e293b]">
                    <div className="flex items-center p-2 mb-3">
                        <img src={userInfo?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo?.name}`} alt="avatar" className="w-8 h-8 rounded bg-slate-700 mr-3 border border-slate-600" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{userInfo?.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{userInfo?.email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full text-xs text-slate-400 hover:text-red-400 font-bold uppercase tracking-wider py-2 bg-slate-800 hover:bg-red-500/10 rounded transition-colors border border-slate-700"
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-y-auto">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 lg:hidden">
                    <h1 className="text-lg font-bold text-slate-800">Zoom Clone</h1>
                    <button onClick={handleLogout} className="text-sm text-red-500 font-medium">Out</button>
                </header>

                <div className="flex-1 p-8 md:p-12">
                    <div className="max-w-5xl">
                        <div className="mb-12">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, {userInfo?.name}!</h2>
                            <p className="text-slate-500">Select an action to get started with your meeting.</p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* New Meeting Card */}
                            <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
                                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">New Meeting</h3>
                                <p className="text-sm text-slate-500 mb-6">Give your meeting a name and start instantly.</p>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Meeting Title (Optional)"
                                        value={meetingTitle}
                                        onChange={(e) => setMeetingTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-sm font-medium"
                                    />
                                    <button
                                        onClick={handleCreateRoom}
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors disabled:bg-blue-400"
                                    >
                                        {loading ? 'Processing...' : 'Create Meeting'}
                                    </button>
                                </div>
                            </div>

                            {/* Join Meeting Card */}
                            <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-6">
                                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"></path></svg>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Join Room</h3>
                                <p className="text-sm text-slate-500 mb-6">Enter a meeting code provided by your host to join.</p>
                                <form onSubmit={handleJoinRoom} className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Meeting Code"
                                        value={roomID}
                                        onChange={(e) => setRoomID(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-sm font-medium"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!roomID}
                                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded transition-colors disabled:opacity-50"
                                    >
                                        Join Now
                                    </button>
                                </form>
                            </div>

                            {/* Schedule Card (Placeholder) */}
                            <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm opacity-60">
                                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-6">
                                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2"></path></svg>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Schedule</h3>
                                <p className="text-sm text-slate-500 mb-6">Plan your meetings in advance and notify participants.</p>
                                <button disabled className="w-full bg-slate-100 text-slate-400 font-bold py-3 rounded cursor-not-allowed">
                                    Coming Soon
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-auto p-8 border-t border-slate-200 text-slate-400 text-[11px] font-medium tracking-wide">
                    Zoom Clone • Enterprise Dashboard System © 2026
                </footer>
            </main>
        </div>
    );
};
export default Dashboard;
