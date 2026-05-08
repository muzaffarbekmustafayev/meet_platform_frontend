import React from 'react';
import {
    Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, MonitorOff,
    Circle, StopCircle, Hand, Settings, MessageSquare,
    Users, PhoneOff, MoreHorizontal
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

    // Right-side panel button
    const PanelBtn = ({ icon, label, active, badge = 0, onClick, title }) => (
        <button
            onClick={onClick}
            title={title}
            className={`relative flex flex-col items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-95 group min-w-[48px]
                ${active ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
        >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150
                ${active ? 'bg-blue-500/15 group-hover:bg-blue-500/20' : 'bg-white/8 group-hover:bg-white/14'}`}>
                {icon}
                {badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-[8px] font-black rounded-full flex items-center justify-center text-white">
                        {badge > 9 ? '9+' : badge}
                    </span>
                )}
            </div>
            <span className={`text-[9px] font-semibold tracking-wide select-none ${active ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}>
                {label}
            </span>
        </button>
    );

    // Media toggle button (mic/cam) — Zoom style red when off
    const MediaBtn = ({ muted, onToggle, onHoldStart, onHoldEnd, micMode }) => (
        <div className="flex flex-col items-center gap-1">
            <button
                onClick={onToggle}
                onMouseDown={onHoldStart}
                onMouseUp={onHoldEnd}
                onMouseLeave={onHoldEnd}
                onTouchStart={onHoldStart}
                onTouchEnd={onHoldEnd}
                title={micMode ? (muted ? 'Unmute' : 'Mute') : (muted ? 'Start Video' : 'Stop Video')}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95
                    ${muted
                        ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25'
                        : 'bg-white/10 hover:bg-white/16'}`}
            >
                {micMode
                    ? (muted ? <MicOff size={19} className="text-white" /> : <Mic size={19} className="text-white" />)
                    : (muted ? <VideoOff size={19} className="text-white" /> : <VideoIcon size={19} className="text-white" />)
                }
            </button>
            <span className={`text-[9px] font-semibold tracking-wide select-none ${muted ? 'text-red-400' : 'text-gray-500'}`}>
                {micMode ? (muted ? 'Unmute' : 'Mute') : (muted ? 'Start' : 'Stop')}
            </span>
        </div>
    );

    // Generic control button
    const CtrlBtn = ({ icon, label, onClick, active = false, title, className: cls = '' }) => (
        <div className={`hidden sm:flex flex-col items-center gap-1 ${cls}`}>
            <button
                onClick={onClick}
                title={title}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 group
                    ${active ? 'bg-blue-500/15 hover:bg-blue-500/20' : 'bg-white/10 hover:bg-white/16'}`}
            >
                {React.cloneElement(icon, { className: `transition-colors ${active ? 'text-blue-400' : 'text-gray-300 group-hover:text-white'}` })}
            </button>
            <span className={`text-[9px] font-semibold tracking-wide select-none ${active ? 'text-blue-400' : 'text-gray-500'}`}>{label}</span>
        </div>
    );

    const totalBadge = unreadMessages + waitingBadge;

    return (
        <div className="relative room-bottom-bar z-50 bg-[#17191f] border-t border-white/6 flex items-center justify-between px-2 sm:px-5 md:px-8 py-2.5 md:py-3 min-h-[64px] transition-colors">

            {/* Left: Meeting ID */}
            <div className="hidden md:flex items-center min-w-[150px]">
                <div
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 cursor-pointer transition-all group"
                    onClick={() => { navigator.clipboard.writeText(roomID); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    title="Copy Meeting ID"
                >
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-600">Meeting ID</span>
                        <span className={`text-[11px] font-mono font-bold tracking-wider transition-colors ${copied ? 'text-emerald-400' : 'text-gray-400 group-hover:text-white'}`}>
                            {copied ? 'Copied!' : roomID}
                        </span>
                    </div>
                </div>
            </div>

            {/* Center: Media + action controls */}
            <div className="flex items-center justify-center gap-1 sm:gap-2 flex-1 md:flex-none">
                {myRole !== 'guest' && (
                    <>
                        <MediaBtn muted={isMuted} onToggle={toggleMute} onHoldStart={onHoldToTalkStart} onHoldEnd={onHoldToTalkEnd} micMode />
                        <MediaBtn muted={isVideoOff} onToggle={toggleVideo} micMode={false} />

                        <div className="hidden sm:block w-px h-10 bg-white/8 mx-1" />

                        {/* Screen share */}
                        <div className="relative hidden sm:flex flex-col items-center gap-1">
                            <button
                                onClick={() => isSharingScreen ? stopScreenShare() : setShowShareMenu(!showShareMenu)}
                                title={isSharingScreen ? "Stop Sharing" : "Share Screen"}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95
                                    ${isSharingScreen ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25' : 'bg-white/10 hover:bg-white/16 group'}`}
                            >
                                {isSharingScreen
                                    ? <MonitorOff size={18} className="text-white" />
                                    : <MonitorUp size={18} className="text-gray-300 group-hover:text-white transition-colors" />}
                            </button>
                            <span className={`text-[9px] font-semibold tracking-wide select-none ${isSharingScreen ? 'text-blue-400' : 'text-gray-500'}`}>
                                {isSharingScreen ? "Stop" : "Share"}
                            </span>
                            {showShareMenu && !isSharingScreen && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-52 bg-[#1e2028] border border-white/10 rounded-2xl p-2 shadow-2xl z-50">
                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-2 pt-1 pb-2">Share content</p>
                                    {[
                                        { label: 'Screen only', Icon: MonitorUp, type: 'screen' },
                                        { label: 'Audio only', Icon: Mic, type: 'audio' },
                                        { label: 'Screen + Audio', Icon: MonitorUp, type: 'both' },
                                    ].map(({ label, Icon, type }) => (
                                        <button key={type} onClick={() => { toggleScreenShare(type); setShowShareMenu(false); }}
                                            className="w-full text-left px-3 py-2.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/8 rounded-xl flex items-center gap-3 transition-colors">
                                            <Icon size={13} className="text-blue-400 shrink-0" />{label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Record */}
                        {canRecord && (
                            <CtrlBtn
                                icon={isRecording ? <StopCircle size={18} className="animate-pulse" /> : <Circle size={18} />}
                                label={isRecording ? 'Stop' : 'Record'}
                                onClick={isRecording ? stopRecording : startRecording}
                                active={isRecording}
                                title={isRecording ? "Stop Recording" : "Record"}
                            />
                        )}

                        {/* Raise Hand */}
                        <CtrlBtn
                            icon={<Hand size={18} />}
                            label="Raise"
                            onClick={raiseHand}
                            title="Raise Hand"
                        />
                    </>
                )}
            </div>

            {/* Right: Panel toggles + Leave */}
            <div className="flex items-center gap-0.5 sm:gap-1 justify-end min-w-[140px] md:min-w-[150px]">
                <PanelBtn icon={<Settings size={16} />} label="Settings" active={showSettings} onClick={() => setShowSettings(!showSettings)} title="Settings" />
                <PanelBtn icon={<MessageSquare size={16} />} label="Chat" active={showChat} badge={unreadMessages} onClick={() => { setShowChat(!showChat); setShowParticipants(false); }} title="Chat" />
                <PanelBtn
                    icon={<Users size={16} />}
                    label={roomUsers.length > 0 ? `People (${roomUsers.length})` : 'People'}
                    active={showParticipants}
                    badge={waitingBadge}
                    onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                    title="Participants"
                />

                {/* Mobile more */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="relative sm:hidden flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-gray-400 transition-all"
                >
                    <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center">
                        <MoreHorizontal size={16} />
                    </div>
                    {totalBadge > 0 && <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-blue-500 text-[8px] font-black rounded-full flex items-center justify-center text-white">{totalBadge}</span>}
                    <span className="text-[9px] font-semibold text-gray-500">More</span>
                </button>

                <div className="hidden sm:block w-px h-8 bg-white/8 mx-1.5" />

                {/* Leave */}
                <button
                    onClick={leaveRoom}
                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-sm transition-all duration-150 shadow-lg shadow-red-900/30"
                >
                    <PhoneOff size={15} />
                    <span className="hidden md:inline">Leave</span>
                </button>
            </div>

            {/* Mobile expanded menu */}
            {mobileMenuOpen && (
                <div className="absolute bottom-full right-2 mb-3 w-60 rounded-2xl border border-white/10 bg-[#1e2028] shadow-2xl p-2 sm:hidden z-50">
                    <button onClick={() => { setShowSettings(!showSettings); setMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/8 transition-colors">
                        <Settings size={15} className="text-gray-400" /> Settings
                    </button>
                    <button onClick={() => { raiseHand(); setMobileMenuOpen(false); }}
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/8 transition-colors">
                        <Hand size={15} className="text-amber-400" /> Raise Hand
                    </button>
                    {myRole !== 'guest' && (
                        <>
                            <button onClick={() => { isSharingScreen ? stopScreenShare() : setShowShareMenu(!showShareMenu); setMobileMenuOpen(false); }}
                                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/8 transition-colors">
                                {isSharingScreen ? <MonitorOff size={15} className="text-blue-400" /> : <MonitorUp size={15} className="text-blue-400" />}
                                {isSharingScreen ? "Stop Sharing" : "Share Screen"}
                            </button>
                            {canRecord && (
                                <button onClick={() => { isRecording ? stopRecording() : startRecording(); setMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/8 transition-colors">
                                    {isRecording ? <StopCircle size={15} className="text-red-400" /> : <Circle size={15} className="text-gray-400" />}
                                    {isRecording ? "Stop Recording" : "Record"}
                                </button>
                            )}
                        </>
                    )}
                    <div className="my-1.5 border-t border-white/6" />
                    <button onClick={leaveRoom}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-3 py-3 text-sm font-bold text-white transition-colors">
                        <PhoneOff size={15} /> Leave Meeting
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoomBottomControls;
