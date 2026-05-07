import React from 'react';
import { X, Rocket, Clock, Sparkles } from 'lucide-react';

const ComingSoonModal = ({ onClose, featureName }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-white/10 rounded-[2.5rem] w-full max-w-md p-8 sm:p-10 shadow-2xl relative overflow-hidden transform animate-in zoom-in-95 duration-300">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors z-10 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                    <X size={20} />
                </button>

                <div className="text-center relative z-10">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-100 dark:border-blue-800/50">
                        <Rocket className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-bounce" />
                    </div>

                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                        Tez orada!
                    </h2>
                    
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest mb-4">
                        <Sparkles size={12} />
                        {featureName || 'Yangi imkoniyat'}
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8">
                        Ushbu bo'lim hozirda ishlab chiqilmoqda va tez orada sizga taqdim etiladi. Biz platformani yanada yaxshilash ustida ishlayapmiz!
                    </p>

                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 mb-8">
                        <Clock size={14} />
                        <span>Kutilayotgan vaqt: Tez orada</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-sm tracking-[0.2em] uppercase transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                    >
                        Tushunarli
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComingSoonModal;
