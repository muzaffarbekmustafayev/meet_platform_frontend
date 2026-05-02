import React, { useRef, useEffect, useState } from 'react';

const Video = ({ stream, userName, role, hasTurn, isStage }) => {
    const ref = useRef();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const isHost = role === 'host';
    const isCoHost = role === 'cohost';

    useEffect(() => {
        if (ref.current && stream) {
            ref.current.srcObject = stream;
            
            const handleTrackChange = () => {
                if (ref.current) {
                    ref.current.srcObject = null;
                    ref.current.srcObject = stream;
                }
            };
            
            stream.addEventListener('addtrack', handleTrackChange);
            stream.addEventListener('removetrack', handleTrackChange);
            
            return () => {
                stream.removeEventListener('addtrack', handleTrackChange);
                stream.removeEventListener('removetrack', handleTrackChange);
            };
        }
    }, [stream, userName, role]);

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

    return (
        <div className={`relative w-full h-full bg-[#000] overflow-hidden group transition-all duration-500 ${!isStage ? 'rounded-[2rem] border' : ''} ${isHost ? 'border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : hasTurn ? 'border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-white/5 hover:border-white/20'}`}>
            {stream ? (
                <video playsInline autoPlay ref={ref} className={`w-full h-full transition-transform duration-700 ${isStage ? 'object-contain' : 'object-cover group-hover:scale-105'}`} />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#0b0d11]">
                    <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">Connecting</span>
                </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 pointer-events-auto">
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${hasTurn ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : isHost ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : isCoHost ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-gray-500'}`}></div>
                    <span className="text-[9px] font-black uppercase tracking-tight text-white/90">{userName}</span>
                    {isHost && <span className="ml-2 text-[8px] text-blue-400 font-black">HOST</span>}
                    {isCoHost && <span className="ml-2 text-[8px] text-emerald-400 font-black tracking-widest">CO-HOST</span>}
                </div>

                <button onClick={toggleFullScreen} className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/10 text-white/70 hover:text-white transition-all pointer-events-auto active:scale-90">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path></svg>
                </button>
            </div>
        </div>
    );
};

export default Video;
