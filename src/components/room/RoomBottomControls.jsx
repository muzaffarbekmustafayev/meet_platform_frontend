import React, { useContext, useEffect, useRef, useState } from 'react';
import {
    Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, MonitorOff,
    Circle, StopCircle, Hand, Settings, MessageSquare,
    Users, PhoneOff, MoreHorizontal,
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
    const { t } = useContext(ThemeLanguageContext);

    // ── Mic press: distinguish click (toggle) from long-hold (push-to-talk) ──
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
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        if (heldRef.current) {
            heldRef.current = false;
            onHoldToTalkEnd?.();
        }
    };

    const onMicClick = (e) => {
        // If a long-press just fired, ignore the synthetic click that follows
        if (heldRef.current) { e.preventDefault?.(); return; }
        toggleMute();
    };

    // ── Screen-share click guard: prevent rapid double-trigger while picker is opening ──
    const sharePendingRef = useRef(false);

    const handleShareClick = () => {
        if (sharePendingRef.current) return;
        sharePendingRef.current = true;
        try {
            if (isSharingScreen) stopScreenShare();
            else toggleScreenShare();
        } finally {
            // Re-enable shortly — picker dialog blocks the JS thread anyway
            setTimeout(() => { sharePendingRef.current = false; }, 400);
        }
    };

    // ── Leave: simple confirm for participants, two-option dialog for host ──
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

    // ── Right-side panel button ──
    const PanelBtn = ({ icon, label, active, badge = 0, onClick, title }) => (
        <button
            onClick={onClick}
            title={title}
            aria-label={title}
            aria-pressed={!!active}
            className={`relative flex flex-col items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl transition-colors duration-150 active:scale-95 group min-w-[48px]
                ${active ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
            <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-150
                ${active ? 'bg-blue-500/15 group-hover:bg-blue-500/20' : 'bg-white/8 group-hover:bg-white/14'}`}>
                {icon}
                {badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-[9px] font-black rounded-full flex items-center justify-center text-white shadow">
                        {badge > 9 ? '9+' : badge}
                    </span>
                )}
            </div>
            <span className={`text-[9px] font-semibold tracking-wide select-none ${active ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                {label}
            </span>
        </button>
    );

    // ── Generic icon button ──
    const CtrlBtn = ({ icon, label, onClick, active = false, disabled = false, title, className: cls = '' }) => (
        <div className={`hidden sm:flex flex-col items-center gap-1 ${cls}`}>
            <button
                onClick={onClick}
                disabled={disabled}
                title={title}
                aria-label={title}
                aria-pressed={active}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-150 active:scale-95 group disabled:opacity-40 disabled:cursor-not-allowed
                    ${active ? 'bg-blue-500/15 hover:bg-blue-500/20' : 'bg-white/10 hover:bg-white/16'}`}
            >
                {React.cloneElement(icon, { className: `transition-colors ${active ? 'text-blue-400' : 'text-gray-300 group-hover:text-white'}` })}
            </button>
            <span className={`text-[9px] font-semibold tracking-wide select-none ${active ? 'text-blue-400' : 'text-gray-500'}`}>{label}</span>
        </div>
    );

    const totalBadge = unreadMessages + waitingBadge;
    const isGuest = myRole === 'guest';

    return (
        <div className="relative room-bottom-bar z-50 bg-[#17191f] border-t border-white/6 flex items-center justify-between px-2 sm:px-5 md:px-8 py-2.5 md:py-3 min-h-[64px]">

            {/* Left: Meeting ID */}
            <div className="hidden md:flex items-center min-w-[150px]">
                <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(roomID); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    title={t('ctl_meeting_id')}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 transition-colors group"
                >
                    <div className="flex flex-col items-start">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-600">{t('ctl_meeting_id')}</span>
                        <span className={`text-[11px] font-mono font-bold tracking-wider transition-colors ${copied ? 'text-emerald-400' : 'text-gray-400 group-hover:text-white'}`}>
                            {copied ? t('ctl_copied') : roomID}
                        </span>
                    </div>
                </button>
            </div>

            {/* Center: Media + action controls */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 flex-1 md:flex-none">
                {!isGuest && (
                    <>
                        {/* Mic — click to toggle, hold to talk */}
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={onMicClick}
                                onMouseDown={onMicPressStart}
                                onMouseUp={onMicPressEnd}
                                onMouseLeave={onMicPressEnd}
                                onTouchStart={onMicPressStart}
                                onTouchEnd={onMicPressEnd}
                                onTouchCancel={onMicPressEnd}
                                onContextMenu={(e) => e.preventDefault()}
                                title={isMuted ? t('ctl_unmute_hold') : t('ctl_mute')}
                                aria-label={isMuted ? t('ctl_unmute') : t('ctl_mute')}
                                aria-pressed={!isMuted}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-150 active:scale-95 select-none
                                    ${isMuted ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25' : 'bg-white/10 hover:bg-white/16'}`}
                            >
                                {isMuted ? <MicOff size={19} className="text-white" /> : <Mic size={19} className="text-white" />}
                            </button>
                            <span className={`text-[9px] font-semibold tracking-wide select-none ${isMuted ? 'text-red-400' : 'text-gray-500'}`}>
                                {isMuted ? t('ctl_unmute') : t('ctl_mute')}
                            </span>
                        </div>

                        {/* Camera */}
                        <div className="flex flex-col items-center gap-1">
                            <button
                                onClick={toggleVideo}
                                title={isVideoOff ? t('ctl_start_video') : t('ctl_stop_video')}
                                aria-label={isVideoOff ? t('ctl_start_video') : t('ctl_stop_video')}
                                aria-pressed={!isVideoOff}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-150 active:scale-95
                                    ${isVideoOff ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25' : 'bg-white/10 hover:bg-white/16'}`}
                            >
                                {isVideoOff ? <VideoOff size={19} className="text-white" /> : <VideoIcon size={19} className="text-white" />}
                            </button>
                            <span className={`text-[9px] font-semibold tracking-wide select-none ${isVideoOff ? 'text-red-400' : 'text-gray-500'}`}>
                                {isVideoOff ? t('ctl_start_video') : t('ctl_stop_video')}
                            </span>
                        </div>

                        <div className="hidden sm:block w-px h-10 bg-white/8 mx-1" />

                        {/* Screen share — single click, browser picker handles source + audio toggle */}
                        <div className="hidden sm:flex flex-col items-center gap-1">
                            <button
                                onClick={handleShareClick}
                                title={isSharingScreen ? t('ctl_stop_sharing') : t('ctl_share_screen')}
                                aria-label={isSharingScreen ? t('ctl_stop_sharing') : t('ctl_share_screen')}
                                aria-pressed={isSharingScreen}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-150 active:scale-95
                                    ${isSharingScreen ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25' : 'bg-white/10 hover:bg-white/16 group'}`}
                            >
                                {isSharingScreen
                                    ? <MonitorOff size={18} className="text-white" />
                                    : <MonitorUp size={18} className="text-gray-300 group-hover:text-white transition-colors" />}
                            </button>
                            <span className={`text-[9px] font-semibold tracking-wide select-none ${isSharingScreen ? 'text-blue-400' : 'text-gray-500'}`}>
                                {isSharingScreen ? t('ctl_stop_share') : t('ctl_share')}
                            </span>
                        </div>

                        {/* Record */}
                        {canRecord && (
                            <CtrlBtn
                                icon={isRecording ? <StopCircle size={18} className="animate-pulse" /> : <Circle size={18} />}
                                label={isRecording ? t('ctl_stop_record') : t('ctl_record')}
                                onClick={isRecording ? stopRecording : startRecording}
                                active={isRecording}
                                title={isRecording ? t('ctl_stop_recording') : t('ctl_start_recording')}
                            />
                        )}

                        {/* Raise Hand */}
                        <CtrlBtn
                            icon={<Hand size={18} />}
                            label={t('ctl_raise')}
                            onClick={raiseHand}
                            title={t('ctl_raise_hand')}
                        />
                    </>
                )}

                {/* Guests get a hand button only — they can't broadcast media */}
                {isGuest && (
                    <CtrlBtn
                        icon={<Hand size={18} />}
                        label={t('ctl_raise')}
                        onClick={raiseHand}
                        title={t('ctl_raise_hand')}
                    />
                )}
            </div>

            {/* Right: Panel toggles + Leave */}
            <div className="flex items-center gap-0.5 sm:gap-1 justify-end min-w-[140px] md:min-w-[150px]">
                <PanelBtn icon={<Settings size={16} />} label={t('ctl_settings')} active={showSettings} onClick={() => setShowSettings(!showSettings)} title={t('ctl_settings')} />
                <PanelBtn icon={<MessageSquare size={16} />} label={t('ctl_chat')} active={showChat} badge={unreadMessages} onClick={() => { setShowChat(!showChat); setShowParticipants(false); }} title={t('ctl_chat')} />
                <PanelBtn
                    icon={<Users size={16} />}
                    label={roomUsers.length > 0 ? `${t('ctl_people')} (${roomUsers.length})` : t('ctl_people')}
                    active={showParticipants}
                    badge={waitingBadge}
                    onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                    title={t('ctl_people')}
                />

                {/* Mobile more */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="More options"
                    aria-expanded={mobileMenuOpen}
                    className="relative sm:hidden flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-gray-400"
                >
                    <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
                        <MoreHorizontal size={16} />
                    </div>
                    {totalBadge > 0 && <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-blue-500 text-[9px] font-black rounded-full flex items-center justify-center text-white">{totalBadge > 9 ? '9+' : totalBadge}</span>}
                    <span className="text-[9px] font-semibold text-gray-500">{t('ctl_more')}</span>
                </button>

                <div className="hidden sm:block w-px h-8 bg-white/8 mx-1.5" />

                {/* Leave — host gets a popover with Leave / End for all */}
                <div className="hidden sm:block relative" ref={leaveWrapRef}>
                    <button
                        onClick={handleLeaveClick}
                        aria-label="Leave meeting"
                        aria-haspopup={isHost ? 'menu' : undefined}
                        aria-expanded={isHost ? leaveMenuOpen : undefined}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-sm transition-colors duration-150 shadow-lg shadow-red-900/30"
                    >
                        <PhoneOff size={15} />
                        <span className="hidden md:inline">{t('ctl_leave')}</span>
                    </button>
                    {isHost && leaveMenuOpen && (
                        <div role="menu" className="absolute bottom-full right-0 mb-2 w-56 bg-[#1e2028] border border-white/10 rounded-2xl p-2 shadow-2xl z-50">
                            <button
                                role="menuitem"
                                onClick={() => { setLeaveMenuOpen(false); endMeetingForAll?.(); }}
                                className="w-full text-left px-3 py-2.5 text-xs font-semibold text-red-400 hover:text-white hover:bg-red-600/30 rounded-xl transition-colors"
                            >
                                {t('leave_end_all')}
                                <span className="block text-[10px] font-medium text-gray-500 mt-0.5">{t('leave_end_all_sub')}</span>
                            </button>
                            <button
                                role="menuitem"
                                onClick={() => { setLeaveMenuOpen(false); leaveRoom(); }}
                                className="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/8 rounded-xl transition-colors mt-1"
                            >
                                {t('leave_only_me')}
                                <span className="block text-[10px] font-medium text-gray-500 mt-0.5">{t('leave_only_me_sub')}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile expanded menu */}
            {mobileMenuOpen && (
                <div role="menu" className="absolute bottom-full right-2 mb-3 w-60 rounded-2xl border border-white/10 bg-[#1e2028] shadow-2xl p-2 sm:hidden z-50">
                    <button onClick={() => { setShowSettings(!showSettings); setMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/8 transition-colors">
                        <Settings size={15} className="text-gray-400" /> {t('ctl_settings')}
                    </button>
                    <button onClick={() => { raiseHand(); setMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/8 transition-colors">
                        <Hand size={15} className="text-amber-400" /> {t('ctl_raise_hand')}
                    </button>
                    {!isGuest && (
                        <>
                            <button onClick={() => { setMobileMenuOpen(false); handleShareClick(); }}
                                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/8 transition-colors">
                                {isSharingScreen ? <MonitorOff size={15} className="text-blue-400" /> : <MonitorUp size={15} className="text-blue-400" />}
                                {isSharingScreen ? t('ctl_stop_sharing') : t('ctl_share_screen')}
                            </button>
                            {canRecord && (
                                <button onClick={() => { isRecording ? stopRecording() : startRecording(); setMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/8 transition-colors">
                                    {isRecording ? <StopCircle size={15} className="text-red-400" /> : <Circle size={15} className="text-gray-400" />}
                                    {isRecording ? t('ctl_stop_recording') : t('ctl_start_recording')}
                                </button>
                            )}
                        </>
                    )}
                    <div className="my-1.5 border-t border-white/6" />
                    <button onClick={() => { setMobileMenuOpen(false); handleLeaveClick(); }}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-3 py-3 text-sm font-bold text-white transition-colors">
                        <PhoneOff size={15} /> {t('ctl_leave')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoomBottomControls;
