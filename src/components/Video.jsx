import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Mic, MicOff, Video as VideoIcon, VideoOff, Maximize2, Minimize2 } from 'lucide-react';

const Video = ({ stream, userName, role, hasTurn, isStage, isLocal, userVideoStatus = true }) => {
    const ref = useRef();
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

    const roleColor = isHost
        ? { border: 'border-blue-500/40', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/50', dot: 'bg-blue-400', avatarBg: 'bg-blue-700' }
        : isCoHost
        ? { border: 'border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50', dot: 'bg-emerald-400', avatarBg: 'bg-emerald-700' }
        : isGuest
        ? { border: 'border-gray-500/30', badge: 'bg-gray-500/20 text-gray-300 border-gray-500/40', dot: 'bg-gray-500', avatarBg: 'bg-gray-700' }
        : { border: 'border-white/10', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', dot: 'bg-indigo-400', avatarBg: 'bg-indigo-700' };

    const initials = (userName || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const AvatarFallback = () => (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111318] z-10 select-none">
            <div className={`relative w-14 h-14 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-2xl ${roleColor.avatarBg} flex items-center justify-center shadow-xl mb-3 border ${roleColor.border}`}>
                <span className="text-lg md:text-xl lg:text-2xl font-bold text-white">{initials}</span>
                {hasTurn && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#111318] animate-pulse" />
                )}
            </div>
            <p className="text-white font-semibold text-xs md:text-sm tracking-wide truncate max-w-[90%] text-center">{userName}</p>
            {role && role !== 'participant' && (
                <span className={`mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${roleColor.badge}`}>
                    {isHost ? 'Host' : isCoHost ? 'Co-Host' : 'Guest'}
                </span>
            )}
            {!isLocal && !audioEnabled && (
                <div className="mt-2 flex items-center gap-1 bg-red-500/15 px-2 py-0.5 rounded-full border border-red-500/25">
                    <MicOff size={10} className="text-red-400" />
                    <span className="text-[9px] font-semibold text-red-400">Muted</span>
                </div>
            )}
        </div>
    );

    return (
        <div className={`relative w-full h-full bg-[#111318] overflow-hidden group transition-all duration-300
            ${!isStage ? `rounded-2xl border ${hasTurn ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.12)]' : isHost ? 'border-blue-500/25' : 'border-white/8 hover:border-white/18'}` : ''}
        `}>
            {stream ? (
                <>
                    <video
                        playsInline autoPlay muted={isLocal} ref={ref}
                        className={`w-full h-full transition-all duration-500 ${showVideo
                            ? (isStage ? 'object-contain block' : 'object-cover block')
                            : 'hidden'
                        }`}
                    />
                    {!showVideo && <AvatarFallback />}
                </>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#111318]">
                    <div className="w-7 h-7 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
                    <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-wider">Ulanmoqda...</span>
                </div>
            )}

            {/* Hover gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Top-right status badges */}
            {stream && (
                <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                    <div className={`p-1 rounded-lg border backdrop-blur-sm transition-all ${showVideo ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-black/40 border-white/10'}`}>
                        {showVideo
                            ? <VideoIcon size={10} className="text-emerald-400" />
                            : <VideoOff size={10} className="text-gray-500" />
                        }
                    </div>
                    <div className={`p-1 rounded-lg border backdrop-blur-sm transition-all ${audioEnabled ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-black/40 border-white/10'}`}>
                        {audioEnabled
                            ? <Mic size={10} className="text-emerald-400" />
                            : <MicOff size={10} className="text-gray-500" />
                        }
                    </div>
                </div>
            )}

            {/* Bottom info */}
            {stream && (
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent z-20">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasTurn ? 'bg-emerald-400 animate-pulse' : roleColor.dot}`} />
                        <span className="text-[10px] font-semibold text-white/90 truncate">{userName}</span>
                        {isHost && <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wider shrink-0">HOST</span>}
                        {isCoHost && <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider shrink-0">CO-HOST</span>}
                    </div>
                    {showVideo && (
                        <button
                            onClick={toggleFullScreen}
                            className="p-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/10 text-white/60 hover:text-white transition-all shrink-0"
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
