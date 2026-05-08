import React from 'react';
import {
    Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, MonitorOff,
    Circle, StopCircle, Hand, Settings, MessageSquare,
    Users, Copy, Check, LogOut, Monitor, Volume2, PhoneOff, MoreHorizontal
} from 'lucide-react';

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
    onHoldToTalkStart,
    onHoldToTalkEnd,
    mobileMenuOpen,
    setMobileMenuOpen,
}) => {
    const ctrlBase = 'flex flex-col items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px]';
    const iconBtn = (active) => `${ctrlBase} ${active
        ? 'bg-red-50 dark:bg-red-500/15 text-red-500 dark:text-red-400'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white'}`;

    const mobileToolCount = unreadMessages + waitingBadge;

    return (
        <div className="relative h-auto min-h-[4.5rem] md:h-20 bg-white dark:bg-[#1a1d26] border-t border-gray-200 dark:border-white/8 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-8 py-2 md:py-0 z-50 gap-y-2 transition-colors">

            {/* Left: Meeting ID */}
            <div
                className="hidden md:flex items-center gap-3 cursor-pointer group px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                onClick={() => { navigator.clipboard.writeText(roomID); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            >
                <div className="w-8 h-8 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg flex items-center justify-center shrink-0">
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-gray-400" />}
                </div>
                <div>
                    <span className="block text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold">Meeting ID</span>
                    <span className={`text-sm font-mono font-bold tracking-wider transition-colors ${copied ? 'text-emerald-500' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                        {copied ? 'Nusxalandi!' : roomID}
                    </span>
                </div>
            </div>

            {/* Center Controls */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 flex-1 md:flex-none mx-auto">
                {myRole !== 'guest' && (
                    <>
                        <button
                            onClick={toggleMute}
                            onMouseDown={onHoldToTalkStart}
                            onMouseUp={onHoldToTalkEnd}
                            onMouseLeave={onHoldToTalkEnd}
                            onTouchStart={onHoldToTalkStart}
                            onTouchEnd={onHoldToTalkEnd}
                            className={iconBtn(isMuted)}
                            title="Click to toggle, hold to talk"
                        >
                            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                            <span className="text-[9px] font-semibold">{isMuted ? 'Unmute' : 'Mute'}</span>
                        </button>

                        <button onClick={toggleVideo} className={iconBtn(isVideoOff)}>
                            {isVideoOff ? <VideoOff size={18} /> : <VideoIcon size={18} />}
                            <span className="text-[9px] font-semibold">Video</span>
                        </button>

                        <div className="w-px h-8 bg-gray-200 dark:bg-white/10 hidden md:block" />

                        <div className="relative hidden md:block">
                            <button
                                onClick={() => isSharingScreen ? stopScreenShare() : setShowShareMenu(!showShareMenu)}
                                className={`${ctrlBase} ${isSharingScreen
                                    ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                {isSharingScreen ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
                                <span className="text-[9px] font-semibold">{isSharingScreen ? "To'xtat" : 'Ekran'}</span>
                            </button>
                            {showShareMenu && !isSharingScreen && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-white/10 rounded-2xl p-2 shadow-xl z-50">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-2 pt-1 pb-2">Nima ulashish</p>
                                    {[
                                        { label: 'Faqat ekran', Icon: Monitor, type: 'screen' },
                                        { label: 'Faqat audio', Icon: Volume2, type: 'audio' },
                                        { label: 'Ekran + Audio', Icon: MonitorUp, type: 'both' },
                                    ].map(({ label, Icon, type }) => (
                                        <button
                                            key={type}
                                            onClick={() => { toggleScreenShare(type); setShowShareMenu(false); }}
                                            className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl flex items-center gap-2.5"
                                        >
                                            <Icon size={13} className="text-blue-500 shrink-0" />{label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {canRecord && (
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`${ctrlBase} hidden md:flex ${isRecording
                                    ? 'bg-red-50 dark:bg-red-600/20 text-red-500 dark:text-red-400'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                <div className="relative">
                                    {isRecording ? <StopCircle size={18} className="animate-pulse" /> : <Circle size={18} />}
                                    {isRecording && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                                </div>
                                <span className={`text-[9px] font-semibold ${isRecording ? 'text-red-500 dark:text-red-400' : ''}`}>
                                    {isRecording ? 'Stop' : 'Yozish'}
                                </span>
                            </button>
                        )}

                        <button
                            onClick={raiseHand}
                            className={`${ctrlBase} hidden md:flex text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white`}
                        >
                            <Hand size={18} />
                            <span className="text-[9px] font-semibold">Qo'l</span>
                        </button>
                    </>
                )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[44px] hidden md:flex ${showSettings
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8'}`}
                >
                    <Settings size={18} />
                    <span className="text-[9px] font-semibold">Sozlama</span>
                </button>

                <button
                    onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                    className={`relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[44px] ${showChat
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8'}`}
                    >
                        <MessageSquare size={18} />
                        {unreadMessages > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-[8px] font-bold rounded-full flex items-center justify-center text-white">
                                {unreadMessages}
                        </span>
                    )}
                    <span className="text-[9px] font-semibold">Chat</span>
                </button>

                <button
                    onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                    className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[44px] ${showParticipants
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8'}`}
                >
                    <Users size={18} />
                    {waitingBadge > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-[8px] font-bold rounded-full flex items-center justify-center text-white animate-pulse">
                            {waitingBadge}
                        </span>
                    )}
                    <span className="text-[9px] font-semibold">Odamlar {roomUsers.length > 0 && `(${roomUsers.length})`}</span>
                </button>

                <div className="w-px h-8 bg-gray-200 dark:bg-white/10 hidden md:block mx-1" />

                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className={`relative md:hidden flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[44px] ${mobileMenuOpen
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8'}`}
                >
                    <MoreHorizontal size={18} />
                    {mobileToolCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 text-[8px] font-bold rounded-full flex items-center justify-center text-white">
                            {mobileToolCount}
                        </span>
                    )}
                    <span className="text-[9px] font-semibold">More</span>
                </button>

                <button
                    onClick={leaveRoom}
                    className="hidden md:flex flex-col items-center gap-1 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-colors shadow-md shadow-red-500/20"
                >
                    <PhoneOff size={18} />
                    <span className="text-[9px] font-semibold">End</span>
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="absolute bottom-full right-3 mb-3 w-56 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1e222d] shadow-2xl p-2 md:hidden">
                    <button onClick={() => { setShowSettings(!showSettings); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5">
                        <Settings size={16} /> Sozlama
                    </button>
                    <button onClick={() => { raiseHand(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5">
                        <Hand size={16} /> Qo'l ko'tarish
                    </button>
                    {myRole !== 'guest' && (
                        <>
                            <button onClick={() => { isSharingScreen ? stopScreenShare() : setShowShareMenu(!showShareMenu); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5">
                                {isSharingScreen ? <MonitorOff size={16} /> : <MonitorUp size={16} />} {isSharingScreen ? 'Ulashishni to‘xtatish' : 'Ekran ulashish'}
                            </button>
                            {canRecord && (
                                <button onClick={() => { isRecording ? stopRecording() : startRecording(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5">
                                    {isRecording ? <StopCircle size={16} /> : <Circle size={16} />} {isRecording ? 'Yozishni to‘xtatish' : 'Yozib olish'}
                                </button>
                            )}
                        </>
                    )}
                    <button onClick={leaveRoom} className="mt-1 w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-3 text-sm font-semibold text-white hover:bg-red-700">
                        <PhoneOff size={16} /> Chiqish
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoomBottomControls;
