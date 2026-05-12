import React, { useRef, useEffect, useState, useCallback, useContext } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Maximize2, Minimize2 } from 'lucide-react';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';

// Generate a consistent gradient for each username
const getAvatarGradient = (name = '') => {
    const gradients = [
        'from-blue-600 to-blue-800',
        'from-violet-600 to-purple-800',
        'from-emerald-600 to-teal-800',
        'from-amber-500 to-orange-700',
        'from-rose-500 to-pink-700',
        'from-cyan-500 to-blue-700',
        'from-indigo-500 to-violet-700',
        'from-fuchsia-500 to-pink-700',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
};

const Video = ({ stream, userName, role, hasTurn, isStage, isLocal, userVideoStatus = true, isSpeaking = false }) => {
    const ref = useRef();
    const { theme } = useContext(ThemeLanguageContext);
    const isDark = theme === 'dark';
    const tileBg = isDark ? 'bg-[#0e1016]' : 'bg-[#1c2030]';
    const borderDefault = isDark ? 'border-white/8 hover:border-white/18' : 'border-gray-500/35 hover:border-gray-400/50';
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [videoEnabled, setVideoEnabled] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);

    const isHost = role === 'host';
    const isCoHost = role === 'cohost';
    const isGuest = role === 'guest';

    const syncTrackState = useCallback(() => {
        if (!stream) { setVideoEnabled(false); setAudioEnabled(false); return; }
        const vt = stream.getVideoTracks();
        const at = stream.getAudioTracks();
        setVideoEnabled(vt.length > 0 && vt.some(t => t.readyState === 'live' && t.enabled && !t.muted));
        setAudioEnabled(at.length > 0 && at.some(t => t.readyState === 'live' && t.enabled && !t.muted));
    }, [stream]);

    useEffect(() => {
        if (!stream) { setVideoEnabled(false); setAudioEnabled(false); return; }
        if (ref.current) ref.current.srcObject = stream;
        syncTrackState();

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

    const avatarGradient = getAvatarGradient(userName);
    const initials = (userName || '?')
        .split(' ')
        .filter(w => w && /^[a-zA-Z\u0400-\u04FF\u0100-\u024F]/.test(w))
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?';

    const AvatarFallback = () => (
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${tileBg} z-10 select-none`}>
            {/* Subtle background glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${avatarGradient} opacity-[0.04]`} />

            {/* Avatar circle */}
            <div className={`relative bg-gradient-to-br ${avatarGradient} rounded-2xl flex items-center justify-center shadow-2xl
                ${isStage ? 'w-24 h-24 sm:w-28 sm:h-28 rounded-3xl' : 'w-12 h-12 sm:w-16 sm:h-16 rounded-2xl'}`}
                style={{ boxShadow: `0 8px 32px rgba(0,0,0,0.4)` }}
            >
                <span className={`font-black text-white tracking-tight ${isStage ? 'text-3xl sm:text-4xl' : 'text-lg sm:text-xl'}`}>{initials}</span>
                {hasTurn && (
                    <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full border-2 ${isDark ? 'border-[#0e1016]' : 'border-[#1c2030]'} animate-pulse shadow-lg shadow-emerald-500/40`} />
                )}
            </div>

            {/* Name + role */}
            <div className="mt-4 flex flex-col items-center gap-1.5 px-4 max-w-[85%]">
                <p className={`text-white font-semibold truncate text-center w-full ${isStage ? 'text-base' : 'text-xs'}`}>
                    {userName}
                </p>
                <div className="flex items-center gap-1.5">
                    {(isHost || isCoHost || isGuest) && (
                        <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider
                            ${isHost ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : isCoHost ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/8 text-gray-400 border border-white/10'}`}>
                            {isHost ? 'Host' : isCoHost ? 'Co-Host' : 'Guest'}
                        </span>
                    )}
                    {!audioEnabled && (
                        <span className="flex items-center gap-1 bg-red-500/15 px-2 py-0.5 rounded-md border border-red-500/20">
                            <MicOff size={9} className="text-red-400" />
                            <span className="text-[9px] font-bold text-red-400">Muted</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className={`relative w-full h-full overflow-hidden group transition-all duration-300 ${tileBg}
            ${!isStage ? `rounded-2xl border ${
                isSpeaking ? 'border-emerald-400/60 shadow-[0_0_14px_rgba(52,211,153,0.18)]'
                : hasTurn ? 'border-emerald-500/50 shadow-[0_0_16px_rgba(16,185,129,0.12)]'
                : audioEnabled && !isLocal ? 'border-blue-500/30'
                : isHost ? 'border-blue-500/25'
                : isCoHost ? 'border-emerald-500/25'
                : borderDefault
            }` : isSpeaking ? 'ring-2 ring-inset ring-emerald-400/50' : ''}
        `}>
            {stream ? (
                <>
                    <video
                        playsInline autoPlay muted={isLocal} ref={ref}
                        className={`w-full h-full transition-all duration-500 ${showVideo
                            ? (isStage ? 'object-contain block' : 'object-cover block')
                            : 'hidden'
                        }`}
                        style={isLocal ? { transform: 'scaleX(-1)' } : undefined}
                    />
                    {!showVideo && <AvatarFallback />}
                </>
            ) : (
                <div className={`w-full h-full flex flex-col items-center justify-center ${tileBg} gap-3`}>
                    <div className={`bg-gradient-to-br ${avatarGradient} rounded-2xl flex items-center justify-center opacity-20
                        ${isStage ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-10 h-10 sm:w-12 sm:h-12'}`}>
                        <span className={`font-black text-white ${isStage ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'}`}>{initials}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="w-5 h-5 border-2 border-blue-500/25 border-t-blue-500/70 rounded-full animate-spin" />
                        <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-widest">Connecting...</span>
                    </div>
                </div>
            )}

            {/* Hover gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Top-right: audio/video status indicators */}
            {stream && showVideo && (
                <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                    {!audioEnabled && (
                        <div className="p-1 rounded-lg bg-red-500/80 backdrop-blur-sm border border-red-400/30">
                            <MicOff size={10} className="text-white" />
                        </div>
                    )}
                </div>
            )}

            {/* Bottom info bar */}
            {stream && (
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between bg-gradient-to-t from-black/75 to-transparent z-20">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {/* Audio dot */}
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            audioEnabled ? 'bg-emerald-400' : 'bg-red-400'
                        } ${audioEnabled && !isLocal ? 'animate-pulse' : ''}`} />
                        <span className="text-[10px] font-semibold text-white/90 truncate max-w-[60px] sm:max-w-none">{userName}</span>
                        {isHost && <span className="hidden sm:inline text-[8px] font-bold text-blue-400 uppercase tracking-wider shrink-0">HOST</span>}
                        {isCoHost && <span className="hidden sm:inline text-[8px] font-bold text-emerald-400 uppercase tracking-wider shrink-0">CO-HOST</span>}
                        {hasTurn && <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider shrink-0">• Speaking</span>}
                    </div>
                    {showVideo && (
                        <button
                            onClick={toggleFullScreen}
                            className="p-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/10 text-white/60 hover:text-white transition-all shrink-0 opacity-0 group-hover:opacity-100"
                        >
                            {isFullScreen ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default Video;
