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
    const PanelBtn = ({ icon, label, shortLabel, active, badge = 0, onClick, title, mobileHidden = false }) => (
        <button
            onClick={onClick}
            title={title}
            aria-label={title}
            aria-pressed={!!active}
            className={`relative flex flex-col items-center gap-1 px-1.5 sm:px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-95 group min-w-[54px]
                ${mobileHidden ? 'hidden xs:flex' : 'flex'}
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
            <span className={`text-[9px] font-semibold tracking-tight whitespace-nowrap select-none ${active ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                <span className={shortLabel ? "hidden xs:inline" : ""}>{label}</span>
                {shortLabel && <span className="xs:hidden">{shortLabel}</span>}
            </span>
        </button>
    );

    // ── Generic icon button ──
    const CtrlBtn = ({ icon, label, onClick, active = false, disabled = false, title, mobileHidden = false, className: cls = '', isDanger = false, onStart, onEnd }) => (
        <div className={`${mobileHidden ? 'hidden sm:flex' : 'flex'} flex-col items-center gap-1 ${cls} min-w-[54px]`}>
            <button
                onClick={onClick}
                onMouseDown={onStart}
                onMouseUp={onEnd}
                onMouseLeave={onEnd}
                onTouchStart={onStart}
                onTouchEnd={onEnd}
                disabled={disabled}
                title={title}
                aria-label={title}
                aria-pressed={active}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 group disabled:opacity-40 disabled:cursor-not-allowed
                    ${isDanger ? (active ? 'bg-white/10 hover:bg-white/16' : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25') 
                               : (active ? 'bg-blue-500/15 hover:bg-blue-500/20' : 'bg-white/10 hover:bg-white/16')}`}
            >
                {React.cloneElement(icon, { className: `transition-colors ${isDanger ? 'text-white' : (active ? 'text-blue-400' : 'text-gray-300 group-hover:text-white')}` })}
            </button>
            <span className={`text-[9px] font-semibold tracking-tight whitespace-nowrap select-none ${isDanger ? (!active ? 'text-red-400' : 'text-gray-500') : (active ? 'text-blue-400' : 'text-gray-500')}`}>
                {label}
            </span>
        </div>
    );

    const totalBadge = unreadMessages + waitingBadge;
    const isGuest = myRole === 'guest';

    return (
        <div className="relative room-bottom-bar z-50 bg-[#17191f] border-t border-white/6 flex items-center justify-between px-2 sm:px-6 py-2 md:py-3 min-h-[64px]">

            {/* Left: Meeting ID */}
            <div className="hidden lg:flex items-center w-[180px]">
                <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(roomID); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
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

            {/* Center: Media controls - Fixed Gaps and Removed flex-1 to prevent overlap */}
            <div className="flex items-center justify-center gap-2 sm:gap-4 mx-auto">
                {!isGuest && (
                    <>
                        <CtrlBtn 
                            icon={isMuted ? <MicOff size={19} /> : <Mic size={19} />}
                            label={isMuted ? t('ctl_unmute') : t('ctl_mute')}
                            onClick={onMicClick}
                            onStart={onMicPressStart}
                            onEnd={onMicPressEnd}
                            isDanger={isMuted}
                            active={!isMuted}
                            title={isMuted ? t('ctl_unmute_hold') : t('ctl_mute')}
                        />

                        <CtrlBtn 
                            icon={isVideoOff ? <VideoOff size={19} /> : <VideoIcon size={19} />}
                            label={isVideoOff ? t('ctl_start_video') : t('ctl_stop_video')}
                            onClick={toggleVideo}
                            isDanger={isVideoOff}
                            active={!isVideoOff}
                            title={isVideoOff ? t('ctl_start_video') : t('ctl_stop_video')}
                        />

                        <div className="hidden sm:block w-px h-8 bg-white/10 mx-1" />

                        <CtrlBtn
                            icon={isSharingScreen ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
                            label={isSharingScreen ? t('ctl_stop_share') : t('ctl_share')}
                            onClick={handleShareClick}
                            active={isSharingScreen}
                            mobileHidden={true}
                        />

                        {canRecord && (
                            <CtrlBtn
                                icon={isRecording ? <StopCircle size={18} className="animate-pulse" /> : <Circle size={18} />}
                                label={isRecording ? t('ctl_stop_record') : t('ctl_record')}
                                onClick={isRecording ? stopRecording : startRecording}
                                active={isRecording}
                                mobileHidden={true}
                            />
                        )}

                        <CtrlBtn
                            icon={<Hand size={18} />}
                            label={t('ctl_raise')}
                            onClick={raiseHand}
                            mobileHidden={true}
                        />
                    </>
                )}

                {/* Guests: raise hand — mobile'da More menuda */}
                {isGuest && (
                    <CtrlBtn
                        icon={<Hand size={18} />}
                        label={t('ctl_raise')}
                        onClick={raiseHand}
                        mobileHidden={true}
                    />
                )}
            </div>

            {/* Right: Panel toggles + Leave */}
            <div className="flex items-center gap-1 justify-end w-[140px] sm:w-auto">
                <PanelBtn icon={<Settings size={16} />} label={t('ctl_settings')} active={showSettings} onClick={() => setShowSettings(!showSettings)} mobileHidden={true} />
                <PanelBtn icon={<MessageSquare size={16} />} label={t('ctl_chat')} shortLabel={t('ctl_chat_short') || 'Chat'} active={showChat} badge={unreadMessages} onClick={() => { setShowChat(!showChat); setShowParticipants(false); }} />
                <PanelBtn
                    icon={<Users size={16} />}
                    label={roomUsers.length > 0 ? `${t('ctl_people')} (${roomUsers.length})` : t('ctl_people')}
                    shortLabel={roomUsers.length > 0 ? `(${roomUsers.length})` : t('ctl_people_short') || 'People'}
                    active={showParticipants}
                    badge={waitingBadge}
                    onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                />

                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="relative sm:hidden flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-gray-400 min-w-[48px]"
                >
                    <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
                        <MoreHorizontal size={16} />
                    </div>
                    <span className="text-[9px] font-semibold text-gray-500">{t('ctl_more')}</span>
                </button>

                <div className="hidden sm:block w-px h-8 bg-white/10 mx-2" />

                <div className="relative" ref={leaveWrapRef}>
                    <button
                        onClick={handleLeaveClick}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-red-900/30"
                    >
                        <PhoneOff size={15} />
                        <span className="hidden md:inline">{t('ctl_leave')}</span>
                    </button>
                    {isHost && leaveMenuOpen && (
                        <div className="absolute bottom-full right-0 mb-3 w-60 bg-[#1e2028] border border-white/10 rounded-2xl p-2 shadow-2xl z-[60]">
                            <button onClick={() => { setLeaveMenuOpen(false); endMeetingForAll?.(); }}
                                className="w-full text-left px-3 py-3 text-xs font-semibold text-red-400 hover:text-white hover:bg-red-600/30 rounded-xl transition-colors">
                                {t('leave_end_all')}
                                <span className="block text-[10px] font-medium text-gray-500 mt-0.5">{t('leave_end_all_sub')}</span>
                            </button>
                            <button onClick={() => { setLeaveMenuOpen(false); leaveRoom(); }}
                                className="w-full text-left px-3 py-3 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/8 rounded-xl transition-colors mt-1">
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
            {/* Mobile expanded menu — Optimized for narrow screens */}
            {mobileMenuOpen && (
                <div role="menu" className="absolute bottom-full right-2 mb-3 w-60 rounded-2xl border border-white/10 bg-[#1e2028] shadow-2xl p-2 sm:hidden z-50 animate-in slide-in-from-bottom-2 duration-200">
                    <button onClick={() => { setShowChat(!showChat); setShowParticipants(false); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${showChat ? 'bg-blue-500/20 text-blue-400' : 'text-gray-200 hover:bg-white/8'}`}>
                        <div className="flex items-center gap-3">
                            <MessageSquare size={15} className={showChat ? 'text-blue-400' : 'text-gray-400'} /> {t('ctl_chat')}
                        </div>
                        {unreadMessages > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-[10px] font-black rounded-full flex items-center justify-center text-white shadow-sm">
                                {unreadMessages > 9 ? '9+' : unreadMessages}
                            </span>
                        )}
                    </button>
                    <button onClick={() => { setShowSettings(!showSettings); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${showSettings ? 'bg-blue-500/20 text-blue-400' : 'text-gray-200 hover:bg-white/8'}`}>
                        <Settings size={15} className={showSettings ? 'text-blue-400' : 'text-gray-400'} /> {t('ctl_settings')}
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
