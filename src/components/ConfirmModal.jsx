import React from 'react';

const ConfirmModal = ({ open, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', danger = false }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
                <p className="text-gray-800 dark:text-gray-100 font-medium text-base leading-relaxed mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const useConfirm = () => {
    const [state, setState] = React.useState({ open: false, message: '', resolve: null });

    const confirm = React.useCallback((message) => {
        return new Promise((resolve) => {
            setState({ open: true, message, resolve });
        });
    }, []);

    const handleConfirm = () => {
        state.resolve?.(true);
        setState(s => ({ ...s, open: false }));
    };

    const handleCancel = () => {
        state.resolve?.(false);
        setState(s => ({ ...s, open: false }));
    };

    const modal = (
        <ConfirmModal
            open={state.open}
            message={state.message}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            danger
        />
    );

    return { confirm, modal };
};

export default ConfirmModal;
