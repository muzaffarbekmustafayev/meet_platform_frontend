import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../components/ConfirmModal';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import Select from '../components/Select';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Meetra';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icon = {
    dashboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    users:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    meetings:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />,
    chart:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    logout:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
    back:      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10 19l-7-7m0 0l7-7m-7 7h18" />,
    menu:      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />,
    close:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />,
    sun:       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />,
    moon:      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />,
    refresh:   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
    plus:      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />,
    edit:      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    block:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />,
    trash:     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
    msg:       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
    shield:    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
};

const Ico = ({ d, size = 18, className = '' }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" className={className}>{d}</svg>
);

// ─── Charts (pure SVG, no lib) ────────────────────────────────────────────────
const SparkLine = ({ data = [], keyName, color }) => {
    const vals = data.map(d => d[keyName]);
    const max = Math.max(...vals, 1);
    const w = 100 / Math.max(data.length - 1, 1);
    const pts = vals.map((v, i) => `${i * w},${40 - (v / max) * 38}`).join(' ');
    const area = `0,40 ${pts} ${(data.length - 1) * w},40`;
    return (
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-10">
            <defs>
                <linearGradient id={`sp-${keyName}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={area} fill={`url(#sp-${keyName})`} />
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
    );
};

const BarChart = ({ data = [], height = 160 }) => {
    const maxVal = Math.max(...data.flatMap(d => [d.users, d.meetings]), 1);
    const bw = 100 / data.length;
    const gap = bw * 0.18;
    const labelStep = Math.ceil(data.length / 6);
    return (
        <div>
            <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
                {data.map((d, i) => {
                    const uh = (d.users / maxVal) * (height - 4);
                    const mh = (d.meetings / maxVal) * (height - 4);
                    const x = i * bw + gap;
                    const hw = (bw - gap * 2) / 2;
                    return (
                        <g key={i}>
                            <rect x={x} y={height - uh} width={hw} height={uh} fill="#3b82f6" opacity="0.85" rx="0.8" />
                            <rect x={x + hw + 0.4} y={height - mh} width={hw} height={mh} fill="#8b5cf6" opacity="0.85" rx="0.8" />
                        </g>
                    );
                })}
            </svg>
            <div className="flex justify-between mt-1 px-0.5">
                {data.map((d, i) => i % labelStep === 0 && (
                    <span key={i} className="text-[9px] text-gray-400 dark:text-gray-600">{d.date?.slice(5)}</span>
                ))}
            </div>
        </div>
    );
};

const DonutChart = ({ segments = [], size = 84 }) => {
    const total = segments.reduce((s, g) => s + g.value, 0) || 1;
    const r = 15.9, c = 2 * Math.PI * r;
    let off = 0;
    return (
        <svg width={size} height={size} viewBox="0 0 36 36">
            <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-gray-700" />
            {segments.map((seg, i) => {
                const pct = seg.value / total;
                const dash = pct * c, gap = c - dash;
                const el = <circle key={i} cx="18" cy="18" r={r} fill="none" stroke={seg.color}
                    strokeWidth="4" strokeDasharray={`${dash} ${gap}`}
                    strokeDashoffset={-(off * c)} transform="rotate(-90 18 18)" />;
                off += pct;
                return el;
            })}
            <circle cx="18" cy="18" r="10" fill="currentColor" className="text-white dark:text-gray-900" />
        </svg>
    );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent, icon, spark, sparkKey }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className={`text-3xl font-bold ${accent}`}>{value ?? 0}</p>
                {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent.replace('text-', 'bg-').replace('-600', '-50').replace('-500', '-50').replace('dark:text-', '').split(' ')[0]}`}>
                <Ico d={icon} size={20} className={accent.split(' ')[0]} />
            </div>
        </div>
        {spark && <SparkLine data={spark} keyName={sparkKey} color={accent.includes('blue') ? '#3b82f6' : accent.includes('purple') ? '#8b5cf6' : accent.includes('emerald') ? '#10b981' : '#f59e0b'} />}
    </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const AdminPage = () => {
    const [stats, setStats]           = useState(null);
    const [users, setUsers]           = useState([]);
    const [meetings, setMeetings]     = useState([]);
    const [loading, setLoading]       = useState(true);
    const [activeTab, setActiveTab]   = useState('overview');
    const [chartDays, setChartDays]   = useState(30);
    const [sidebarOpen, setSidebar]   = useState(false);
    const [showModal, setShowModal]   = useState(false);
    const [editMode, setEditMode]     = useState(false);
    const [currentUser, setCurrentUser] = useState({ name: '', email: '', password: '', role: 'user' });
    const [userSearch, setUserSearch] = useState('');
    const [userRole, setUserRole]     = useState('all');
    const [userStatus, setUserStatus] = useState('all');
    const [mtgStatus, setMtgStatus]   = useState('all');
    const [mtgType, setMtgType]       = useState('all');

    const navigate  = useNavigate();
    const { t, theme, toggleTheme, lang, changeLanguage } = useContext(ThemeLanguageContext);
    const { user: me, logout } = useAuth();
    const toast     = useToast();
    const { confirm, modal: confirmModal } = useConfirm();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [s, u, m] = await Promise.all([
                API.get(`/api/admin/stats?days=${chartDays}`),
                API.get('/api/admin/users'),
                API.get('/api/admin/meetings'),
            ]);
            setStats(s.data);
            setUsers(u.data || []);
            setMeetings(m.data || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [chartDays]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

    const toggleBlock = async (id) => {
        try {
            await API.put(`/api/admin/users/${id}/block`);
            toast.success(t('action_failed')); // Shunga toggle qilindi
            fetchData();
        } catch (err) {
            console.error('Block user error:', err);
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    const handleDeleteUser = async (id, userName) => {
        const ok = await confirm(`${t('confirm_delete_meeting')} "${userName}"?`);
        if (!ok) return;
        try {
            await API.delete(`/api/admin/users/${id}`);
            toast.success(t('action_failed')); // O'chirildi
            fetchData();
        } catch (err) {
            console.error('Delete user error:', err);
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    const handleDeleteMeeting = async (id) => {
        const ok = await confirm(t('confirm_delete_meeting'));
        if (!ok) return;
        try {
            await API.delete(`/api/admin/meetings/${id}`);
            toast.success(t('meeting_deleted'));
            fetchData();
        } catch (err) {
            console.error('Delete meeting error:', err);
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await API.put(`/api/admin/users/${currentUser._id}`, currentUser);
                toast.success(t('save_btn'));
            } else {
                await API.post('/api/admin/users', currentUser);
                toast.success(t('create_btn'));
            }
            setShowModal(false);
            setCurrentUser({ name: '', email: '', password: '', role: 'user' });
            fetchData();
        } catch (err) {
            console.error('Save user error:', err);
            toast.error(err.response?.data?.message || t('action_failed'));
        }
    };

    const openEdit = (u) => { setCurrentUser({ ...u, password: '' }); setEditMode(true); setShowModal(true); };
    const openAdd  = () => { setCurrentUser({ name: '', email: '', password: '', role: 'user' }); setEditMode(false); setShowModal(true); };

    const filteredUsers = users.filter(u => {
        const q = userSearch.toLowerCase();
        return (!q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
            && (userRole   === 'all' || u.role === userRole)
            && (userStatus === 'all' || (userStatus === 'blocked' ? u.isBlocked : !u.isBlocked));
    });

    const filteredMtgs = meetings.filter(m =>
        (mtgStatus === 'all' || m.status   === mtgStatus) &&
        (mtgType   === 'all' || m.roomType === mtgType)
    );

    const chart = stats?.chartData || [];

    const navItems = [
        { id: 'overview', label: t('overview'),  d: Icon.dashboard },
        { id: 'users',    label: t('users'),     d: Icon.users },
        { id: 'meetings', label: t('meetings'),  d: Icon.meetings },
    ];

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-950 font-sans overflow-hidden">

            {/* ── Sidebar ── */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebar(false)} />}
            <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-200 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 dark:border-gray-800">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                        <Ico d={Icon.shield} size={16} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{APP_NAME}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Admin Panel</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-3 pb-2 pt-1">{t('admin_nav_section')}</p>
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebar(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                            <Ico d={item.d} size={17} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* User block */}
                <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {me?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{me?.name || 'Admin'}</p>
                            <p className="text-xs text-gray-400 capitalize">{me?.role || 'admin'}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors">
                        <Ico d={Icon.logout} size={15} />
                        {t('sign_out')}
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Top Bar */}
                <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebar(true)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <Ico d={Icon.menu} size={20} />
                        </button>
                        {/* Breadcrumb */}
                        <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-gray-400 dark:text-gray-500">Admin</span>
                            <span className="text-gray-300 dark:text-gray-700">/</span>
                            <span className="font-semibold text-gray-800 dark:text-white capitalize">{activeTab}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageToggle compact={false} />
                        <ThemeToggle />
                        {/* Refresh */}
                        <button onClick={fetchData} disabled={loading} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40">
                            <Ico d={Icon.refresh} size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        {/* Add user (users tab) */}
                        {activeTab === 'users' && (
                            <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
                                <Ico d={Icon.plus} size={15} className="text-white" />
                                {t('add_user')}
                            </button>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">

                    {loading && !stats ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    ) : (

                    <>
                    {/* ══ OVERVIEW ══ */}
                    {activeTab === 'overview' && (
                        <div className="space-y-5">
                            {/* Top 4 stat cards */}
                            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                                <StatCard label={t('total_users')} value={stats?.totalUsers} sub={`+${stats?.newUsersToday ?? 0} ${t('today_suffix')}`}
                                    accent="text-blue-600 dark:text-blue-400" icon={Icon.users} spark={chart} sparkKey="users" />
                                <StatCard label={t('active_meetings')} value={stats?.activeMeetings} sub={`+${stats?.newMeetingsToday ?? 0} ${t('today_suffix')}`}
                                    accent="text-purple-600 dark:text-purple-400" icon={Icon.meetings} spark={chart} sparkKey="meetings" />
                                <StatCard label={t('total_meetings')} value={stats?.totalMeetings}
                                    sub={`${stats?.publicMeetings ?? 0} ${t('public_label').toLowerCase()} · ${stats?.privateMeetings ?? 0} ${t('private_label').toLowerCase()}`}
                                    accent="text-emerald-600 dark:text-emerald-400" icon={Icon.chart} />
                                <StatCard label={t('total_messages')} value={stats?.totalMessages}
                                    accent="text-amber-600 dark:text-amber-400" icon={Icon.msg} />
                            </div>

                            {/* Chart + side panels */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                                {/* Bar chart — 2/3 width */}
                                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">{t('activity_chart')}</h3>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('chart_subtitle')}</p>
                                        </div>
                                        <div className="flex gap-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            {[7, 14, 30].map(d => (
                                                <button key={d} onClick={() => setChartDays(d)}
                                                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${chartDays === d ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                                    {d}d
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Legend */}
                                    <div className="flex gap-5 mb-4">
                                        <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="w-3 h-3 rounded-sm bg-blue-500" /> {t('users')}
                                        </span>
                                        <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="w-3 h-3 rounded-sm bg-purple-500" /> {t('meetings')}
                                        </span>
                                    </div>
                                    <BarChart data={chart} height={160} />
                                </div>

                                {/* Right column */}
                                <div className="space-y-4">
                                    {/* User roles */}
                                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                                        <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4">{t('user_roles')}</h3>
                                        <div className="flex items-center gap-5">
                                            <DonutChart size={84} segments={[
                                                { value: stats?.users  ?? 0, color: '#3b82f6' },
                                                { value: stats?.admins ?? 0, color: '#8b5cf6' },
                                                { value: stats?.guests ?? 0, color: '#f59e0b' },
                                            ]} />
                                            <div className="space-y-2 flex-1">
                                                {[
                                                    { label: t('users'),   val: stats?.users,  color: 'bg-blue-500' },
                                                    { label: t('admins'),  val: stats?.admins, color: 'bg-purple-500' },
                                                    { label: t('guests'),  val: stats?.guests, color: 'bg-amber-400' },
                                                ].map(r => (
                                                    <div key={r.label} className="flex items-center gap-2">
                                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.color}`} />
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">{r.label}</span>
                                                        <span className="text-xs font-bold text-gray-800 dark:text-white">{r.val ?? 0}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Meeting types */}
                                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                                        <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-4">{t('meeting_types')}</h3>
                                        <div className="flex items-center gap-5">
                                            <DonutChart size={84} segments={[
                                                { value: stats?.publicMeetings  ?? 0, color: '#10b981' },
                                                { value: stats?.privateMeetings ?? 0, color: '#f43f5e' },
                                            ]} />
                                            <div className="space-y-2 flex-1">
                                                {[
                                                    { label: t('public_label'),  val: stats?.publicMeetings,  color: 'bg-emerald-500' },
                                                    { label: t('private_label'), val: stats?.privateMeetings, color: 'bg-rose-500' },
                                                ].map(r => (
                                                    <div key={r.label} className="flex items-center gap-2">
                                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.color}`} />
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-1">{r.label}</span>
                                                        <span className="text-xs font-bold text-gray-800 dark:text-white">{r.val ?? 0}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: t('admins'),        val: stats?.admins,      color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                                    { label: t('guests'),        val: stats?.guests,      color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
                                    { label: t('blocked'),       val: stats?.blockedUsers, color: 'text-rose-600 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-900/20' },
                                    { label: t('today_activity'), val: (stats?.newUsersToday ?? 0) + (stats?.newMeetingsToday ?? 0), color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20', sub: `${stats?.newUsersToday ?? 0}u · ${stats?.newMeetingsToday ?? 0}m` },
                                ].map(c => (
                                    <div key={c.label} className={`rounded-xl border border-gray-200 dark:border-gray-800 p-4 ${c.bg}`}>
                                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{c.label}</p>
                                        <p className={`text-2xl font-bold ${c.color}`}>{c.val ?? 0}</p>
                                        {c.sub && <p className="text-[11px] text-gray-400 mt-0.5">{c.sub}</p>}
                                    </div>
                                ))}
                            </div>

                            {/* Trend lines */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { title: t('users_growth'),    val: stats?.totalUsers,    key: 'users',    color: '#3b82f6', accent: 'text-blue-600 dark:text-blue-400' },
                                    { title: t('meetings_growth'), val: stats?.totalMeetings, key: 'meetings', color: '#8b5cf6', accent: 'text-purple-600 dark:text-purple-400' },
                                ].map(c => (
                                    <div key={c.key} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{c.title}</h3>
                                                <p className="text-xs text-gray-400">{t('last_days_prefix')} {chartDays} {t('last_days_suffix')}</p>
                                            </div>
                                            <span className={`text-2xl font-bold ${c.accent}`}>{c.val ?? 0}</span>
                                        </div>
                                        <SparkLine data={chart} keyName={c.key} color={c.color} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ══ USERS ══ */}
                    {activeTab === 'users' && (
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-wrap gap-3 items-center">
                                <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                    placeholder={t('search_user')}
                                    className="flex-1 min-w-[180px] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition" />
                                <div className="w-40">
                                    <Select size="sm" value={userRole} onChange={setUserRole} options={[
                                        { value: 'all',   label: t('all_roles') },
                                        { value: 'user',  label: t('users') },
                                        { value: 'admin', label: t('admins') },
                                        { value: 'guest', label: t('role_guest') },
                                    ]} />
                                </div>
                                <div className="w-40">
                                    <Select size="sm" value={userStatus} onChange={setUserStatus} options={[
                                        { value: 'all',     label: t('all_status') },
                                        { value: 'active',  label: t('active_status') },
                                        { value: 'blocked', label: t('blocked') },
                                    ]} />
                                </div>
                                <span className="text-xs text-gray-400 ml-auto">{filteredUsers.length} {t('n_results')}</span>
                            </div>

                            {/* Table */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                                                {[t('user_col'), t('role'), t('status'), t('date'), t('actions')].map((h, i) => (
                                                    <th key={h} className={`px-5 py-3.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                                {u.name?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                                                                <p className="text-xs text-gray-400">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                                            u.role === 'admin'  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                            u.role === 'guest'  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                                                                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                        }`}>{u.role}</span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${u.isBlocked ? 'bg-red-500' : 'bg-green-500'}`} />
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">{u.isBlocked ? t('blocked') : t('unblocked')}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-5 py-4 text-right space-x-2">
                                                        <button onClick={() => openEdit(u)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors">
                                                            <Ico d={Icon.edit} size={13} /> {t('edit_action')}
                                                        </button>
                                                        <button onClick={() => toggleBlock(u._id)} className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${u.isBlocked ? 'text-green-600 dark:text-green-400 hover:text-green-800' : 'text-red-600 dark:text-red-400 hover:text-red-800'}`}>
                                                            <Ico d={Icon.block} size={13} /> {u.isBlocked ? t('unblock_action') : t('block_action')}
                                                        </button>
                                                        <button onClick={() => handleDeleteUser(u._id, u.name)} className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 transition-colors">
                                                            <Ico d={Icon.trash} size={13} /> {t('delete_action')}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="5" className="px-5 py-12 text-center text-sm text-gray-400">{t('no_users_found')}</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {filteredUsers.length > 0 && (
                                    <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 flex items-center text-xs text-gray-400">
                                        {t('total_n')}: <span className="font-semibold text-gray-600 dark:text-gray-300 ml-1">{filteredUsers.length}</span> {t('users').toLowerCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══ MEETINGS ══ */}
                    {activeTab === 'meetings' && (
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-wrap gap-3 items-center">
                                <div className="w-44">
                                    <Select size="sm" value={mtgStatus} onChange={setMtgStatus} options={[
                                        { value: 'all',       label: t('all_status') },
                                        { value: 'active',    label: t('active_status') },
                                        { value: 'completed', label: t('completed_status') },
                                        { value: 'scheduled', label: t('scheduled_status') },
                                    ]} />
                                </div>
                                <div className="w-36">
                                    <Select size="sm" value={mtgType} onChange={setMtgType} options={[
                                        { value: 'all',     label: t('all_types') },
                                        { value: 'public',  label: t('public_label') },
                                        { value: 'private', label: t('private_label') },
                                    ]} />
                                </div>
                                <span className="text-xs text-gray-400 ml-auto">{filteredMtgs.length} {t('n_results')}</span>
                            </div>

                            {/* Table */}
                            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                                                {[t('meetings'), t('host'), t('type_col'), t('status'), t('date'), t('actions')].map((h, i) => (
                                                    <th key={h} className={`px-5 py-3.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {filteredMtgs.length > 0 ? filteredMtgs.map(m => (
                                                <tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{m.title}</p>
                                                        <p className="text-[11px] font-mono text-blue-500 mt-0.5">{m.meetingCode}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm text-gray-700 dark:text-gray-300">{m.hostId?.name || '—'}</p>
                                                        <p className="text-xs text-gray-400">{m.hostId?.email || ''}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${m.roomType === 'public' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'}`}>
                                                            {m.roomType === 'public' ? t('public_label') : t('private_label')}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'active' ? 'bg-blue-500 animate-pulse' : m.status === 'completed' ? 'bg-gray-400' : 'bg-amber-400'}`} />
                                                            <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{m.status}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
                                                    <td className="px-5 py-4 text-right">
                                                        <button onClick={() => handleDeleteMeeting(m._id)}
                                                            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 transition-colors">
                                                            <Ico d={Icon.trash} size={13} /> {t('delete_action')}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-gray-400">{t('no_meetings_found')}</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {filteredMtgs.length > 0 && (
                                    <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 text-xs text-gray-400">
                                        {t('total_n')}: <span className="font-semibold text-gray-600 dark:text-gray-300 ml-1">{filteredMtgs.length}</span> {t('meetings').toLowerCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    </>
                    )}
                </main>
            </div>

            {/* ── User Modal ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">{editMode ? t('edit_user') : t('add_user')}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <Ico d={Icon.close} size={18} />
                            </button>
                        </div>
                        {/* Form */}
                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            {[
                                { label: t('full_name'),                                           key: 'name',     type: 'text',     required: true,      ph: t('name_placeholder') },
                                { label: 'Email',                                                  key: 'email',    type: 'email',    required: true,      ph: 'email@example.com' },
                                { label: editMode ? t('password_edit_hint') : t('password_label'), key: 'password', type: 'password', required: !editMode, ph: '••••••••' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{f.label}</label>
                                    <input type={f.type} required={f.required} value={currentUser[f.key]} placeholder={f.ph}
                                        onChange={e => setCurrentUser({ ...currentUser, [f.key]: e.target.value })}
                                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition" />
                                </div>
                            ))}
                            <div>
                                <Select
                                    label={t('role')}
                                    value={currentUser.role}
                                    onChange={v => setCurrentUser({ ...currentUser, role: v })}
                                    options={[
                                        { value: 'user', label: 'User' },
                                        { value: 'admin', label: 'Admin' },
                                    ]}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    {t('cancel')}
                                </button>
                                <button type="submit"
                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                                    {editMode ? t('save_btn') : t('create_btn')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {confirmModal}
        </div>
    );
};

export default AdminPage;
