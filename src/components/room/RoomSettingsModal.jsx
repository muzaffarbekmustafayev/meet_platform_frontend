import React, { useRef, useEffect, useState, useContext } from 'react';
import { X, Camera, Mic, Volume2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import Select from '../Select';
import { ThemeLanguageContext } from '../../context/ThemeLanguageContext';

const RoomSettingsModal = ({
    onClose,
    videoDevices, selectedVideoDevice, switchCamera,
    audioDevices, selectedAudioDevice, switchAudio,
}) => {
    const { t } = useContext(ThemeLanguageContext);
    const previewRef = useRef(null);
    const streamRef = useRef(null);
    const [previewError, setPreviewError] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(true);
    const [micLevel, setMicLevel] = useState(0);
    const micAnimRef = useRef(null);
    const analyserRef = useRef(null);
    const micStreamRef = useRef(null);

    const videoOptions = videoDevices.map(d => ({
        value: d.deviceId,
        label: d.label || `Kamera ${d.deviceId.slice(0, 8)}`,
        icon: <Camera size={14} />,
    }));
    const audioOptions = audioDevices.map(d => ({
        value: d.deviceId,
        label: d.label || `Mikrofon ${d.deviceId.slice(0, 8)}`,
        icon: <Mic size={14} />,
    }));

    // Start camera preview
    const startPreview = async (deviceId) => {
        setPreviewLoading(true);
        setPreviewError(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        try {
            const constraints = {
                video: deviceId ? { deviceId: { exact: deviceId } } : true,
                audio: false,
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            if (previewRef.current) {
                previewRef.current.srcObject = stream;
            }
        } catch {
            setPreviewError(true);
        } finally {
            setPreviewLoading(false);
        }
    };

    // Mic level visualizer
    const startMicMonitor = async (deviceId) => {
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(t => t.stop());
        }
        cancelAnimationFrame(micAnimRef.current);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: deviceId ? { deviceId: { exact: deviceId } } : true,
                video: false,
            });
            micStreamRef.current = stream;
            const ctx = new AudioContext();
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            analyserRef.current = analyser;

            const tick = () => {
                const data = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(data);
                const avg = data.reduce((a, b) => a + b, 0) / data.length;
                setMicLevel(Math.min(100, (avg / 128) * 100));
                micAnimRef.current = requestAnimationFrame(tick);
            };
            tick();
        } catch {
            setMicLevel(0);
        }
    };

    useEffect(() => {
        startPreview(selectedVideoDevice);
        startMicMonitor(selectedAudioDevice);
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop());
            micStreamRef.current?.getTracks().forEach(t => t.stop());
            cancelAnimationFrame(micAnimRef.current);
        };
    }, []);

    const handleCameraChange = (val) => {
        switchCamera(val);
        startPreview(val);
    };

    const handleMicChange = (val) => {
        switchAudio(val);
        startMicMonitor(val);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/8">
                    <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Qurilma sozlamalari</h2>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Kamera va mikrofonni sozlang</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Camera section */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                                <Camera size={13} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Kamera</span>
                            {videoDevices.length === 0 && (
                                <span className="ml-auto flex items-center gap-1 text-[10px] text-amber-500">
                                    <AlertCircle size={11} /> Topilmadi
                                </span>
                            )}
                            {videoDevices.length > 0 && !previewError && (
                                <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-500">
                                    <CheckCircle2 size={11} /> Faol
                                </span>
                            )}
                        </div>

                        {/* Camera preview */}
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900 dark:bg-black mb-3">
                            {previewLoading && !previewError && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                                </div>
                            )}
                            {previewError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <Camera size={24} className="text-gray-600" />
                                    <p className="text-xs text-gray-500">Kamera mavjud emas</p>
                                    <button
                                        onClick={() => startPreview(selectedVideoDevice)}
                                        className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        <RefreshCw size={11} /> Qayta urinish
                                    </button>
                                </div>
                            )}
                            <video
                                ref={previewRef}
                                autoPlay
                                muted
                                playsInline
                                className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${previewLoading || previewError ? 'opacity-0' : 'opacity-100'}`}
                                onLoadedMetadata={() => setPreviewLoading(false)}
                            />
                            {/* Camera label overlay */}
                            {!previewError && !previewLoading && (
                                <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                                    <span className="px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-medium backdrop-blur-sm truncate max-w-[80%]">
                                        {videoOptions.find(o => o.value === selectedVideoDevice)?.label || 'Kamera'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <Select
                            value={selectedVideoDevice}
                            onChange={handleCameraChange}
                            options={videoOptions}
                            placeholder="Kamera tanlang..."
                            disabled={videoDevices.length === 0}
                        />
                    </div>

                    {/* Mic section */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                                <Mic size={13} className="text-violet-600 dark:text-violet-400" />
                            </div>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Mikrofon</span>
                            {audioDevices.length === 0 && (
                                <span className="ml-auto flex items-center gap-1 text-[10px] text-amber-500">
                                    <AlertCircle size={11} /> Topilmadi
                                </span>
                            )}
                        </div>

                        <Select
                            value={selectedAudioDevice}
                            onChange={handleMicChange}
                            options={audioOptions}
                            placeholder="Mikrofon tanlang..."
                            disabled={audioDevices.length === 0}
                        />

                        {/* Mic level meter */}
                        <div className="mt-3 flex items-center gap-3">
                            <Volume2 size={13} className="text-gray-400 dark:text-gray-500 shrink-0" />
                            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-white/8 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-75"
                                    style={{
                                        width: `${micLevel}%`,
                                        background: micLevel > 70
                                            ? 'linear-gradient(to right, #22c55e, #f59e0b)'
                                            : 'linear-gradient(to right, #22c55e, #4ade80)',
                                    }}
                                />
                            </div>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 w-7 text-right shrink-0">
                                {Math.round(micLevel)}%
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 ml-5">
                            Mikrofonga gapiring — darajani kuzating
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Saqlash
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoomSettingsModal;
