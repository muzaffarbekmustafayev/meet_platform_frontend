import React from 'react';
import { X } from 'lucide-react';

const RoomSettingsModal = ({
    onClose,
    videoDevices, selectedVideoDevice, switchCamera,
    audioDevices, selectedAudioDevice, switchAudio,
}) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-8 shadow-2xl relative">
            <button
                onClick={onClose}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
                <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Qurilma sozlamalari</h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-8">Kamera va mikrofonni sozlang</p>

            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Kamera
                    </label>
                    <select
                        value={selectedVideoDevice}
                        onChange={(e) => switchCamera(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                    >
                        {videoDevices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Kamera ${device.deviceId.slice(0, 5)}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Mikrofon
                    </label>
                    <select
                        value={selectedAudioDevice}
                        onChange={(e) => switchAudio(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                    >
                        {audioDevices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Mikrofon ${device.deviceId.slice(0, 5)}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <button
                onClick={onClose}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
                Saqlash
            </button>
        </div>
    </div>
);

export default RoomSettingsModal;
