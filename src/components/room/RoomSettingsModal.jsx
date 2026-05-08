import React from 'react';
import { X, Camera, Mic } from 'lucide-react';
import Select from '../Select';

const RoomSettingsModal = ({
    onClose,
    videoDevices, selectedVideoDevice, switchCamera,
    audioDevices, selectedAudioDevice, switchAudio,
}) => {
    const videoOptions = videoDevices.map(d => ({
        value: d.deviceId,
        label: d.label || `Kamera ${d.deviceId.slice(0, 5)}`,
        icon: <Camera size={14} />,
    }));
    const audioOptions = audioDevices.map(d => ({
        value: d.deviceId,
        label: d.label || `Mikrofon ${d.deviceId.slice(0, 5)}`,
        icon: <Mic size={14} />,
    }));

    return (
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
                    <Select
                        label="Kamera"
                        value={selectedVideoDevice}
                        onChange={switchCamera}
                        options={videoOptions}
                        placeholder="Kamera tanlang..."
                    />
                    <Select
                        label="Mikrofon"
                        value={selectedAudioDevice}
                        onChange={switchAudio}
                        options={audioOptions}
                        placeholder="Mikrofon tanlang..."
                    />
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
};

export default RoomSettingsModal;
