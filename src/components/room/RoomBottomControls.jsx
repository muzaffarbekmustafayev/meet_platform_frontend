import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, MonitorOff,
    Circle, StopCircle, Hand, Settings, MessageSquare,
    Users, PhoneOff, MoreHorizontal, Copy, Check,
} from 'lucide-react';
import { ThemeLanguageContext } from '../../context/ThemeLanguageContext';

const HOLD_TO_TALK_MS = 250;

const RoomBottomControls = ({
    roomID, copied, setCopied,
    myRole,
    isMuted, toggleMute,
    isVideoOff, toggleVideo,
    isSharingScreen, stopScreenShare, toggleScreenShare,
    showShareMenu, setShowShareMenu,
    canRecord, isRecording, startRecording, stopRecording,
    raiseHand,
    showSettings, setShowSettings,
    showChat, setShowChat,
    showParticipants, setShowParticipants,
    unreadMessages,
    waitingBadge = 0,
    roomUsers,
    leaveRoom,
    endMeetingForAll,
    isHost,
    onHoldToTalkStart,
    onHoldToTalkEnd,
    mobileMenuOpen,
    setMobileMenuOpen,
}) => {
    const { t, theme } = useContext(ThemeLanguageContext);
    const isDark = theme === 'dark';

    // ── Mic hold-to-talk ──
    const holdTimerRef = useRef(null);
    const heldRef = useRef(false);

    const onMicPressStart = () => {
        heldRef.current = false;
        holdTimerRef.current = setTimeout(() => {
            heldRef.current = true;
            onHoldToTalkStart?.();
        }, HOLD_TO_TALK_MS);
    };

    const onMicPressEnd = () => {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
        if (heldRef.current) {
            heldRef.current = false;
            onHoldToTalkEnd?.();
        }
    };

    const onMicClick = (e) => {
        if (heldRef.current) { e.preventDefault?.(); return; }
        toggleMute();
    };

    // ── Screen-share debounce ──
    const sharePendingRef = useRef(false);
    const handleShareClick = () => {
        if (sharePendingRef.current) return;
        sharePendingRef.current = true;
        try {
            if (isSharingScreen) stopScreenShare();
            else toggleScreenShare();
        } finally {
            setTimeout(() => { sharePendingRef.current = false; }, 400);
        }
    };

    // ── Leave dropdown ──
    const [leaveMenuOpen, setLeaveMenuOpen] = useState(false);
    const leaveWrapRef = useRef(null);

    useEffect(() => {
        if (!leaveMenuOpen) return;
        const onDoc = (e) => {
            if (leaveWrapRef.current && !leaveWrapRef.current.contains(e.target)) setLeaveMenuOpen(false);
        };
        const onEsc = (e) => { if (e.key === 'Escape') setLeaveMenuOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onEsc);
        };
    }, [leaveMenuOpen]);

    const handleLeaveClick = () => {
        if (isHost) { setLeaveMenuOpen(v => !v); return; }
        if (window.confirm(t('leave_confirm'))) leaveRoom();
    };

    const isGuest = myRole === 'guest';

    // ── Unified button component ──
    const Btn = ({
        icon,
        label,
        onClick,
        onStart,
        onEnd,
        active = false,
        danger = false,      // off-state is red (mic/cam off)
        red = false,         // always red (leave)
        badge = 0,
        disabled = false,
        hide = false,        // completely hidden on current breakpoint
        pulse = false,
        title: titleProp,
    }) => {
        if (hide) return null;

        const bgClass = red
            ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/30'
            : danger
                ? 'bg-red-500/90 hover:bg-red-500 shadow-md shadow-red-900/20'
                : active
                    ? 'bg-blue-600/25 hover:bg-blue-600/35 ring-1 ring-blue-500/40'
                    : isDark ? 'bg-white/10 hover:bg-white/16' : 'bg-gray-100 hover:bg-gray-200';

        const iconColor = red || danger ? 'text-white' : active ? 'text-blue-500' : isDark ? 'text-gray-300' : 'text-gray-600';
        const labelColor = red
            ? 'text-red-400'
            : danger
                ? 'text-red-400'
                : active
                    ? 'text-blue-500'
                    : isDark ? 'text-gray-500' : 'text-gray-500';

        return (
            <div className="flex flex-col items-center gap-1">
                <button
                    onClick={onClick}
                    onMouseDown={onStart}
                    onMouseUp={onEnd}
                    onMouseLeave={onEnd}
                    onTouchStart={onStart}
                    onTouchEnd={onEnd}
                    disabled={disabled}
                    title={titleProp}
                    aria-label={titleProp}
                    aria-pressed={active}
                    className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center
                        transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                        ${bgClass}`}
                >
                    <span className={`${iconColor} transition-colors`}>{icon}</span>
                    {pulse && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75" />
                    )}
                    {badge > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-red-500 text-[9px] font-black rounded-full flex items-center justify-center text-white leading-none shadow">
                            {badge > 9 ? '9+' : badge}
                        </span>
                    )}
                </button>
                {label && (
                    <span className={`text-[9px] font-semibold whitespace-nowrap select-none leading-none ${labelColor}`}>
                        {label}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className={`relative z-50 shrink-0 ${isDark ? 'bg-[#13151c] border-t border-white/[0.06]' : 'bg-white border-t border-gray-200'}`}>
            {/* ── Desktop / Tablet bar ── */}
            <div className="hidden sm:flex items-center justify-between px-4 lg:px-6 py-3">

                {/* Left: Meeting ID (lg only) */}
                <div className="w-[160px] lg:w-[200px] flex items-center">
                    <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(roomID); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all group ${isDark ? 'bg-white/5 hover:bg-white/8 border border-white/8' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'}`}
                    >
                        {copied
                            ? <Check size={13} className="text-emerald-400 shrink-0" />
                            : <Copy size={13} className="text-gray-500 group-hover:text-gray-300 shrink-0 transition-colors" />
                        }
                        <div className="flex flex-col items-start min-w-0">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-gray-600">{t('ctl_meeting_id') || 'Meeting ID'}</span>
                            <span className={`text-[11px] font-mono font-bold tracking-wider truncate transition-colors max-w-[100px] ${copied ? 'text-emerald-400' : isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>
                                {copied ? (t('ctl_copied') || 'Copied!') : roomID}
                            </span>
                        </div>
                    </button>
                </div>

                {/* Center: Media controls */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {!isGuest && (
                        <>
                            <Btn
                                icon={isMuted ? <MicOff size={19} /> : <Mic size={19} />}
                                label={isMuted ? (t('ctl_unmute') || 'Unmute') : (t('ctl_mute') || 'Mute')}
                                onClick={onMicClick}
                                onStart={onMicPressStart}
                                onEnd={onMicPressEnd}
                                danger={isMuted}
                                active={!isMuted}
                                titleProp={isMuted ? (t('ctl_unmute_hold') || 'Hold to talk') : (t('ctl_mute') || 'Mute')}
                            />
                            <Btn
                                icon={isVideoOff ? <VideoOff size={19} /> : <VideoIcon size={19} />}
                                label={isVideoOff ? (t('ctl_start_video') || 'Start Video') : (t('ctl_stop_video') || 'Stop Video')}
                                onClick={toggleVideo}
                                danger={isVideoOff}
                                active={!isVideoOff}
                                titleProp={isVideoOff ? (t('ctl_start_video') || 'Start Video') : (t('ctl_stop_video') || 'Stop Video')}
                            />

                            <div className={`w-px h-8 mx-1 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

                            <Btn
                                icon={isSharingScreen ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
                                label={isSharingScreen ? (t('ctl_stop_share') || 'Stop Share') : (t('ctl_share') || 'Share')}
                                onClick={handleShareClick}
                                active={isSharingScreen}
                            />
                            {canRecord && (
                                <Btn
                                    icon={isRecording ? <StopCircle size={18} /> : <Circle size={18} />}
                                    label={isRecording ? (t('ctl_stop_record') || 'Stop') : (t('ctl_record') || 'Record')}
                                    onClick={isRecording ? stopRecording : startRecording}
                                    active={isRecording}
                                    pulse={isRecording}
                                />
                            )}
                            <Btn
                                icon={<Hand size={18} />}
                                label={t('ctl_raise') || 'Raise Hand'}
                                onClick={raiseHand}
                            />
                        </>
                    )}
                    {isGuest && (
                        <Btn
                            icon={<Hand size={18} />}
                            label={t('ctl_raise') || 'Raise Hand'}
                            onClick={raiseHand}
                        />
                    )}
                </div>

                {/* Right: Panel + Leave */}
                <div className="w-[160px] lg:w-[200px] flex items-center justify-end gap-1.5">
                    <Btn
                        icon={<Settings size={16} />}
                        label={t('ctl_settings') || 'Settings'}
                        active={showSettings}
                        onClick={() => setShowSettings(!showSettings)}
                    />
                    <Btn
                        icon={<MessageSquare size={16} />}
                        label={t('ctl_chat') || 'Chat'}
                        active={showChat}
                        badge={unreadMessages}
                        onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                    />
                    <Btn
                        icon={<Users size={16} />}
                        label={roomUsers.length > 0 ? `${t('ctl_people') || 'People'} (${roomUsers.length})` : (t('ctl_people') || 'People')}
                        active={showParticipants}
                        badge={waitingBadge}
                        onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                    />

                    <div className="w-px h-8 bg-white/10 mx-1" />

                    <div className="relative" ref={leaveWrapRef}>
                        <button
                            onClick={handleLeaveClick}
                            className="flex items-center gap-2 px-3 lg:px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-red-900/30"
                        >
                            <PhoneOff size={16} />
                            <span className="hidden lg:inline">{t('ctl_leave') || 'Leave'}</span>
                        </button>
                        {isHost && leaveMenuOpen && (
                            <div className={`absolute bottom-full right-0 mb-3 w-64 rounded-2xl p-2 shadow-2xl z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200 ${isDark ? 'bg-[#1e2028] border border-white/10' : 'bg-white border border-gray-200'}`}>
                                <button
                                    onClick={() => { setLeaveMenuOpen(false); endMeetingForAll?.(); }}
                                    className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                >
                                    {t('leave_end_all') || 'End meeting for all'}
                                    <span className="block text-[10px] font-medium text-gray-400 mt-0.5">
                                        {t('leave_end_all_sub') || 'Removes everyone from the meeting'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => { setLeaveMenuOpen(false); leaveRoom(); }}
                                    className={`w-full text-left px-4 py-3 text-xs font-semibold rounded-xl transition-colors mt-1 ${isDark ? 'text-gray-200 hover:text-white hover:bg-white/8' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {t('leave_only_me') || 'Leave meeting'}
                                    <span className="block text-[10px] font-medium text-gray-500 mt-0.5">
                                        {t('leave_only_me_sub') || 'Others will remain in the meeting'}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Mobile bar ── */}
            <div className="sm:hidden flex items-center justify-around px-2 py-3">
                {!isGuest ? (
                    <>
                        {/* Mic */}
                        <Btn
                            icon={isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                            label={isMuted ? (t('ctl_unmute') || 'Unmute') : (t('ctl_mute') || 'Mute')}
                            onClick={onMicClick}
                            onStart={onMicPressStart}
                            onEnd={onMicPressEnd}
                            danger={isMuted}
                            active={!isMuted}
                        />
                        {/* Camera */}
                        <Btn
                            icon={isVideoOff ? <VideoOff size={18} /> : <VideoIcon size={18} />}
                            label={isVideoOff ? (t('ctl_start_video') || 'Camera') : (t('ctl_stop_video') || 'Camera')}
                            onClick={toggleVideo}
                            danger={isVideoOff}
                            active={!isVideoOff}
                        />
                        {/* Chat */}
                        <Btn
                            icon={<MessageSquare size={18} />}
                            label={t('ctl_chat') || 'Chat'}
                            active={showChat}
                            badge={unreadMessages}
                            onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                        />
                        {/* People */}
                        <Btn
                            icon={<Users size={18} />}
                            label={roomUsers.length > 0 ? `(${roomUsers.length})` : (t('ctl_people') || 'People')}
                            active={showParticipants}
                            badge={waitingBadge}
                            onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                        />
                        {/* More */}
                        <Btn
                            icon={<MoreHorizontal size={18} />}
                            label={t('ctl_more') || 'More'}
                            active={mobileMenuOpen}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        />
                    </>
                ) : (
                    <>
                        {/* Guest: only chat + people + raise hand + leave */}
                        <Btn
                            icon={<MessageSquare size={18} />}
                            label={t('ctl_chat') || 'Chat'}
                            active={showChat}
                            badge={unreadMessages}
                            onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                        />
                        <Btn
                            icon={<Users size={18} />}
                            label={roomUsers.length > 0 ? `(${roomUsers.length})` : (t('ctl_people') || 'People')}
                            active={showParticipants}
                            badge={waitingBadge}
                            onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                        />
                        <Btn
                            icon={<Hand size={18} />}
                            label={t('ctl_raise') || 'Hand'}
                            onClick={raiseHand}
                        />
                    </>
                )}

                {/* Leave — always visible on mobile */}
                <div className="relative" ref={!isGuest ? undefined : leaveWrapRef}>
                    <button
                        onClick={handleLeaveClick}
                        className="flex flex-col items-center gap-1"
                    >
                        <div className="w-11 h-11 rounded-2xl bg-red-600 hover:bg-red-500 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-red-900/30">
                            <PhoneOff size={18} className="text-white" />
                        </div>
                        <span className="text-[9px] font-semibold text-red-400">
                            {t('ctl_leave') || 'Leave'}
                        </span>
                    </button>
                    {isHost && leaveMenuOpen && (
                        <div className={`absolute bottom-full right-0 mb-3 w-64 rounded-2xl p-2 shadow-2xl z-[60] animate-in fade-in slide-in-from-bottom-2 duration-200 ${isDark ? 'bg-[#1e2028] border border-white/10' : 'bg-white border border-gray-200'}`}>
                            <button
                                onClick={() => { setLeaveMenuOpen(false); endMeetingForAll?.(); }}
                                className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                                {t('leave_end_all') || 'End meeting for all'}
                                <span className="block text-[10px] font-medium text-gray-400 mt-0.5">
                                    {t('leave_end_all_sub') || 'Removes everyone from the meeting'}
                                </span>
                            </button>
                            <button
                                onClick={() => { setLeaveMenuOpen(false); leaveRoom(); }}
                                className={`w-full text-left px-4 py-3 text-xs font-semibold rounded-xl transition-colors mt-1 ${isDark ? 'text-gray-200 hover:text-white hover:bg-white/8' : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                {t('leave_only_me') || 'Leave meeting'}
                                <span className="block text-[10px] font-medium text-gray-500 mt-0.5">
                                    {t('leave_only_me_sub') || 'Others will remain in the meeting'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Mobile "More" dropdown ── */}
            {mobileMenuOpen && (
                <div
                    role="menu"
                    className={`absolute bottom-full right-2 mb-2 w-64 rounded-2xl shadow-2xl p-2 sm:hidden z-50 animate-in slide-in-from-bottom-2 fade-in duration-200 ${isDark ? 'border border-white/10 bg-[#1e2028]' : 'border border-gray-200 bg-white'}`}
                >
                    <button
                        onClick={() => { raiseHand(); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isDark ? 'text-gray-200 hover:bg-white/8' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Hand size={15} className="text-amber-400 shrink-0" />
                        {t('ctl_raise_hand') || 'Raise Hand'}
                    </button>
                    <button
                        onClick={() => { setMobileMenuOpen(false); handleShareClick(); }}
                        className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isSharingScreen ? 'text-blue-400 bg-blue-500/10' : isDark ? 'text-gray-200 hover:bg-white/8' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                        {isSharingScreen
                            ? <MonitorOff size={15} className="text-blue-400 shrink-0" />
                            : <MonitorUp size={15} className="text-blue-400 shrink-0" />
                        }
                        {isSharingScreen ? (t('ctl_stop_sharing') || 'Stop Sharing') : (t('ctl_share_screen') || 'Share Screen')}
                    </button>
                    {canRecord && (
                        <button
                            onClick={() => { isRecording ? stopRecording() : startRecording(); setMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isRecording ? 'text-red-400 bg-red-500/10' : isDark ? 'text-gray-200 hover:bg-white/8' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                            {isRecording
                                ? <StopCircle size={15} className="text-red-400 shrink-0" />
                                : <Circle size={15} className="text-gray-400 shrink-0" />
                            }
                            {isRecording ? (t('ctl_stop_recording') || 'Stop Recording') : (t('ctl_start_recording') || 'Start Recording')}
                        </button>
                    )}
                    <button
                        onClick={() => { setShowSettings(!showSettings); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${showSettings ? 'bg-blue-500/15 text-blue-400' : 'text-gray-200 hover:bg-white/8'}`}
                    >
                        <Settings size={15} className={showSettings ? 'text-blue-400 shrink-0' : 'text-gray-400 shrink-0'} />
                        {t('ctl_settings') || 'Settings'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoomBottomControls;
