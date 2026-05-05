import React, { useRef, useState } from 'react';
import { Paperclip, Send, Smile, X, Pencil, Trash2, CheckCheck, MessageSquare } from 'lucide-react';

// ── Date Badge ─────────────────────────────────────────────────────────────────
const DateBadge = ({ label }) => (
    <div className="flex justify-center my-3">
        <span className="bg-gray-100 dark:bg-white/8 rounded-full px-3 py-0.5 text-[10px] text-gray-500 dark:text-gray-400 select-none font-semibold uppercase tracking-wider">
            {label}
        </span>
    </div>
);

// ── Message Bubble ─────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isOwn, onEdit, onDelete, canAct }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group mb-0.5`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Sender name */}
            {!isOwn && (
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mb-1 ml-3 select-none">
                    {msg.userName}
                </span>
            )}

            <div className="relative flex items-end gap-1.5">
                {/* Own bubble actions */}
                {isOwn && canAct && !msg.file && (
                    <div className={`flex items-center gap-0.5 transition-all duration-150 ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <button onClick={() => onEdit(msg._id, msg.text)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            title="Tahrirlash">
                            <Pencil size={13} />
                        </button>
                        <button onClick={() => onDelete(msg._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="O'chirish">
                            <Trash2 size={13} />
                        </button>
                    </div>
                )}

                {/* Bubble */}
                <div className={`
                    relative max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed shadow-sm
                    ${isOwn
                        ? 'bg-blue-600 text-white rounded-t-2xl rounded-l-2xl rounded-br-md'
                        : 'bg-white dark:bg-gray-700/80 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-white/8 rounded-t-2xl rounded-r-2xl rounded-bl-md'
                    }
                `}>
                    {/* File message */}
                    {msg.file ? (
                        <div className="flex items-center gap-3 py-0.5 min-w-[160px]">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOwn ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-500/20'}`}>
                                <svg className={`w-4 h-4 ${isOwn ? 'text-white' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[11px] font-bold truncate mb-0.5 ${isOwn ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{msg.file.name}</p>
                                <a href={msg.file.data} download={msg.file.name}
                                    className={`text-[10px] underline transition-colors ${isOwn ? 'text-blue-200 hover:text-white' : 'text-blue-500 hover:text-blue-700 dark:text-blue-400'}`}>
                                    Yuklab olish
                                </a>
                            </div>
                        </div>
                    ) : (
                        <span className="break-words">{msg.text}</span>
                    )}

                    {/* Timestamp */}
                    <div className={`flex items-center gap-1 mt-1 justify-end ${isOwn ? 'text-blue-200/70' : 'text-gray-400 dark:text-gray-500'}`}>
                        <span className="text-[10px] select-none">{msg.time}</span>
                        {isOwn && <CheckCheck size={11} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── ChatPanel (main export) ────────────────────────────────────────────────────
const ChatPanel = ({
    messages, newMessage, setNewMessage, sendMessage,
    editingMessageId, setEditingMessageId, handleFileUpload,
    deleteChatMessage, startEditingMessage, onClose,
    roomUsers, currentUserName, canChat, meetingTitle,
}) => {
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const groupedMessages = messages.reduce((acc, msg, idx) => {
        if (idx === 0) acc.push({ type: 'date', label: 'Bugun' });
        acc.push({ type: 'msg', ...msg });
        return acc;
    }, []);

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setNewMessage('');
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-[#111318] select-text transition-colors">

            {/* Header */}
            <div className="shrink-0 bg-white dark:bg-[#1a1d26] border-b border-gray-100 dark:border-white/8 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/15 border border-blue-100 dark:border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <MessageSquare size={15} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-semibold text-sm leading-tight truncate">
                        Uchrashuv chati
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5 font-medium">
                        {roomUsers?.length ?? 0} ishtirokchi
                    </p>
                </div>
                <button onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors shrink-0">
                    <X size={16} />
                </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1 custom-scrollbar">
                {groupedMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 flex items-center justify-center mb-4">
                            <MessageSquare size={20} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Hali xabar yo'q</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Birinchi bo'lib yozing!</p>
                    </div>
                ) : (
                    groupedMessages.map((item, idx) =>
                        item.type === 'date' ? (
                            <DateBadge key={`date-${idx}`} label={item.label} />
                        ) : (
                            <MessageBubble
                                key={item._id || idx}
                                msg={item}
                                isOwn={item.userName === currentUserName}
                                canAct={item.userName === currentUserName}
                                onEdit={startEditingMessage}
                                onDelete={deleteChatMessage}
                            />
                        )
                    )
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Edit banner */}
            {editingMessageId && (
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 border-t border-amber-200 dark:border-amber-500/20 flex items-center gap-2 shrink-0">
                    <div className="w-0.5 h-7 bg-amber-500 rounded-full" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Xabar tahrirlash</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{newMessage}</p>
                    </div>
                    <button onClick={handleCancelEdit}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Footer / Input */}
            <div className="shrink-0 bg-white dark:bg-[#1a1d26] border-t border-gray-100 dark:border-white/8 px-3 py-2.5">
                {canChat ? (
                    <form onSubmit={sendMessage} className="flex items-center gap-2">
                        <label
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors cursor-pointer shrink-0"
                            title="Fayl biriktirish">
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                            <Paperclip size={17} />
                        </label>

                        <button type="button"
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors shrink-0 hidden sm:flex"
                            title="Emoji">
                            <Smile size={17} />
                        </button>

                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={editingMessageId ? 'Xabarni tahrirlang...' : 'Xabar yozing...'}
                            className={`
                                flex-1 bg-gray-100 dark:bg-white/8 text-gray-900 dark:text-gray-100 
                                placeholder-gray-400 dark:placeholder-gray-500
                                rounded-xl px-4 py-2 text-sm border
                                focus:outline-none focus:ring-2 transition-all
                                ${editingMessageId
                                    ? 'border-amber-300 dark:border-amber-500/40 focus:ring-amber-500/20 dark:focus:ring-amber-500/20'
                                    : 'border-gray-200 dark:border-white/8 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/50'
                                }
                            `}
                        />

                        <button type="submit" disabled={!newMessage.trim()}
                            className={`
                                p-2.5 rounded-xl shrink-0 transition-all duration-150
                                ${newMessage.trim()
                                    ? editingMessageId
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                                }
                            `}
                            title="Yuborish">
                            <Send size={16} />
                        </button>
                    </form>
                ) : (
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-1 font-medium">
                        Mehmonlar faqat o'qishi mumkin
                    </p>
                )}
            </div>
        </div>
    );
};

export default ChatPanel;
