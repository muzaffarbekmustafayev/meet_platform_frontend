import React, { useRef, useEffect, useState, useCallback } from 'react';

const Video = ({ stream, userName, role, hasTurn, isStage, isLocal, userVideoStatus = true }) => {
    const ref = useRef();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [videoEnabled, setVideoEnabled] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);

    const isHost = role === 'host';
    const isCoHost = role === 'cohost';
    const isGuest = role === 'guest';

    // Sync internal state from tracks
    const syncTrackState = useCallback(() => {
        if (!stream) { setVideoEnabled(false); setAudioEnabled(false); return; }
        const vt = stream.getVideoTracks();
        const at = stream.getAudioTracks();
        setVideoEnabled(vt.length > 0 && vt.some(t => t.readyState === 'live' && t.enabled && !t.muted));
        setAudioEnabled(at.length > 0 && at.some(t => t.readyState === 'live' && t.enabled && !t.muted));
    }, [stream]);

    useEffect(() => {
        if (!stream) { setVideoEnabled(false); setAudioEnabled(false); return; }

        // Set video element source
        if (ref.current) ref.current.srcObject = stream;

        syncTrackState();

        // Listen for track-level mute/unmute events
        const allTracks = stream.getTracks();
        const handlers = allTracks.map(track => {
            const onMute = () => syncTrackState();
            const onUnmute = () => syncTrackState();
            const onEnded = () => syncTrackState();
            track.addEventListener('mute', onMute);
            track.addEventListener('unmute', onUnmute);
            track.addEventListener('ended', onEnded);
            return { track, onMute, onUnmute, onEnded };
        });

        // Listen for stream track additions/removals
        const onAddTrack = () => {
            syncTrackState();
            if (ref.current) ref.current.srcObject = null;
            if (ref.current) ref.current.srcObject = stream;
        };
        const onRemoveTrack = () => syncTrackState();
        stream.addEventListener('addtrack', onAddTrack);
        stream.addEventListener('removetrack', onRemoveTrack);

        return () => {
            handlers.forEach(({ track, onMute, onUnmute, onEnded }) => {
                track.removeEventListener('mute', onMute);
                track.removeEventListener('unmute', onUnmute);
                track.removeEventListener('ended', onEnded);
            });
            stream.removeEventListener('addtrack', onAddTrack);
            stream.removeEventListener('removetrack', onRemoveTrack);
        };
    }, [stream, syncTrackState]);

    // When userVideoStatus prop changes from parent, force re-sync
    useEffect(() => { syncTrackState(); }, [userVideoStatus, syncTrackState]);

    const showVideo = videoEnabled && userVideoStatus !== false;

    const toggleFullScreen = () => {
        if (!ref.current) return;
        if (!document.fullscreenElement) {
            ref.current.requestFullscreen().catch(err => console.error(err));
            setIsFullScreen(true);
        } else {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    };

    const roleColor = isHost
        ? { bg: 'from-blue-600 to-blue-900', border: 'border-blue-500/40', text: 'text-blue-400', badge: 'bg-blue-500/20 border-blue-500/60 text-blue-300', dot: 'bg-blue-500' }
        : isCoHost
        ? { bg: 'from-emerald-600 to-emerald-900', border: 'border-emerald-500/40', text: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300', dot: 'bg-emerald-500' }
        : isGuest
        ? { bg: 'from-gray-600 to-gray-900', border: 'border-gray-500/40', text: 'text-gray-400', badge: 'bg-gray-500/20 border-gray-500/60 text-gray-300', dot: 'bg-gray-500' }
        : { bg: 'from-indigo-600 to-purple-900', border: 'border-indigo-500/30', text: 'text-indigo-400', badge: 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300', dot: 'bg-indigo-400' };

    const initials = (userName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const AvatarFallback = () => (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0c12] to-[#12151f] z-10 select-none">
            {/* Ambient glow */}
            <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${roleColor.bg} pointer-events-none`} />

            {/* Role accent line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-60 ${roleColor.text}`} />

            {/* Avatar circle */}
            <div className={`relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br ${roleColor.bg} flex items-center justify-center shadow-2xl border-2 ${roleColor.border} mb-3`}>
                <span className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tighter">{initials}</span>
                {hasTurn && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0c12] animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                )}
            </div>

            {/* Name */}
            <p className="text-white font-bold text-sm md:text-base tracking-wide truncate max-w-[90%] text-center">{userName}</p>

            {/* Role badge */}
            {role && role !== 'participant' && (
                <span className={`mt-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.15em] border ${roleColor.badge}`}>
                    {isHost ? 'Host' : isCoHost ? 'Co-Host' : 'Guest'}
                </span>
            )}

            {/* Mic indicator in avatar */}
            {!isLocal && !audioEnabled && (
                <div className="mt-2 flex items-center space-x-1 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30">
                    <svg className="w-2.5 h-2.5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 1.56"/><line x1="12" x2="12" y1="19" y2="22"/>
                    </svg>
                    <span className="text-[8px] font-black text-red-400 uppercase tracking-wider">Muted</span>
                </div>
            )}
        </div>
    );

    return (
        <div className={`relative w-full h-full bg-[#0a0c12] overflow-hidden group transition-all duration-300
            ${!isStage ? `rounded-[1.5rem] border ${hasTurn ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : isHost ? 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.08)]' : 'border-white/5 hover:border-white/15'}` : ''
        }`}>

            {stream ? (
                <>
                    <video
                        playsInline
                        autoPlay
                        muted={isLocal}
                        ref={ref}
                        className={`w-full h-full transition-all duration-500 ${showVideo
                            ? (isStage ? 'object-contain block' : 'object-cover block group-hover:scale-[1.02]')
                            : 'hidden'
                        }`}
                    />
                    {!showVideo && <AvatarFallback />}
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0c12] to-[#12151f]">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.25em]">Connecting</span>
                </div>
            )}

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Status indicators — top right, always visible */}
            {stream && (
                <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-20">
                    {/* Camera status */}
                    <div className={`p-1 rounded-lg border backdrop-blur-md transition-all ${showVideo ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                        {showVideo ? (
                            <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                        ) : (
                            <svg className="w-2.5 h-2.5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z M6 18L18 6"/>
                            </svg>
                        )}
                    </div>
                    {/* Mic status */}
                    <div className={`p-1 rounded-lg border backdrop-blur-md transition-all ${audioEnabled ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                        {audioEnabled ? (
                            <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
                            </svg>
                        ) : (
                            <svg className="w-2.5 h-2.5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 1.56"/><line x1="12" x2="12" y1="19" y2="22"/>
                            </svg>
                        )}
                    </div>
                </div>
            )}

            {/* Bottom info bar — always visible (not just hover) */}
            {stream && (
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent z-20">
                    <div className="flex items-center space-x-1.5 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasTurn ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]' : roleColor.dot}`} />
                        <span className="text-[10px] font-bold text-white/90 truncate">{userName}</span>
                        {isHost && <span className="text-[8px] font-black text-blue-400 uppercase tracking-wider shrink-0">HOST</span>}
                        {isCoHost && <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider shrink-0">CO-HOST</span>}
                    </div>
                    {showVideo && (
                        <button
                            onClick={toggleFullScreen}
                            className="p-1 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg border border-white/10 text-white/60 hover:text-white transition-all active:scale-90 shrink-0"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" strokeWidth="2"/>
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Video;
