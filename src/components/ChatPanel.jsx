import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, Send, X, Pencil, Trash2, CheckCheck, MessageSquare, FileText } from 'lucide-react';

// ── Avatar color from username hash ────────────────────────────────────────────
const AVATAR_COLORS = [
    { bg: 'bg-blue-500',   text: 'text-white' },
    { bg: 'bg-violet-500', text: 'text-white' },
    { bg: 'bg-emerald-500',text: 'text-white' },
    { bg: 'bg-amber-500',  text: 'text-white' },
    { bg: 'bg-rose-500',   text: 'text-white' },
    { bg: 'bg-cyan-500',   text: 'text-white' },
    { bg: 'bg-indigo-500', text: 'text-white' },
    { bg: 'bg-fuchsia-500',text: 'text-white' },
];

const getAvatarColor = (name = '') => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getInitials = (name = '') =>
    name
        .split(' ')
        .filter(w => w && /^[a-zA-Z\u0400-\u04FF\u0100-\u024F]/.test(w))
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?';

// ── Date Badge ─────────────────────────────────────────────────────────────────
const DateBadge = ({ label }) => (
    <div className="flex items-center gap-3 my-4 px-2">
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/6" />
        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest select-none px-1">
            {label}
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-white/6" />
    </div>
);

// ── Sender Avatar ──────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 'sm' }) => {
    const color = getAvatarColor(name);
    const initials = getInitials(name);
    const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs';
    return (
        <div className={`${sz} ${color.bg} ${color.text} rounded-full flex items-center justify-center font-bold shrink-0 select-none`}>
            {initials}
        </div>
    );
};

// ── Message Bubble ─────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isOwn, prevMsg, onEdit, onDelete, canAct }) => {
    const [hovered, setHovered] = useState(false);

    // Show avatar only when sender changes (group messages)
    const senderChanged = !prevMsg || prevMsg.userName !== msg.userName || prevMsg.type === 'date';

    return (
        <div
            className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group
                ${senderChanged ? 'mt-3' : 'mt-0.5'}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Sender name — only on first message in group */}
            {!isOwn && senderChanged && (
                <div className="flex items-center gap-2 mb-1.5 ml-9">
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 select-none">
                        {msg.userName}
                    </span>
                </div>
            )}

            <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[78%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar (left for others, right for own — only on last in group) */}
                {!isOwn ? (
                    <div className="w-7 shrink-0">
                        {senderChanged && <Avatar name={msg.userName} size="sm" />}
                    </div>
                ) : (
                    <div className="w-7 shrink-0" />
                )}

                {/* Actions (own messages) */}
                {isOwn && canAct && !msg.file && (
                    <div className={`flex items-center gap-0.5 self-center transition-all duration-150
                        ${hovered ? 'opacity-100 translate-x-0' : 'opacity-0 pointer-events-none translate-x-2'}`}>
                        <button
                            onClick={() => onEdit(msg._id, msg.text)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            title="Tahrirlash"
                        >
                            <Pencil size={12} />
                        </button>
                        <button
                            onClick={() => onDelete(msg._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="O'chirish"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                )}

                {/* Bubble */}
                <div className={`relative px-3.5 py-2.5 text-sm leading-relaxed transition-all
                    ${isOwn
                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-blue-500/20'
                        : 'bg-white dark:bg-[#1e2230] text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-white/8 rounded-2xl rounded-tl-sm shadow-sm'
                    }`}
                >
                    {/* File message */}
                    {msg.file ? (
                        <div className="flex items-center gap-3 py-0.5 min-w-[160px]">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                                ${isOwn ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-500/15'}`}>
                                <FileText size={16} className={isOwn ? 'text-white' : 'text-blue-500 dark:text-blue-400'} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[11px] font-semibold truncate mb-1
                                    ${isOwn ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
                                    {msg.file.name}
                                </p>
                                <a
                                    href={msg.file.data}
                                    download={msg.file.name}
                                    className={`text-[10px] font-medium underline underline-offset-2 transition-colors
                                        ${isOwn ? 'text-blue-200 hover:text-white' : 'text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'}`}
                                >
                                    Yuklab olish
                                </a>
                            </div>
                        </div>
                    ) : (
                        <span className="break-words whitespace-pre-wrap">{msg.text}</span>
                    )}

                    {/* Time + read status */}
                    <div className={`flex items-center gap-1 mt-1.5 justify-end select-none
                        ${isOwn ? 'text-blue-200/70' : 'text-gray-400 dark:text-gray-500'}`}>
                        <span className="text-[9px] font-medium">{msg.time}</span>
                        {isOwn && <CheckCheck size={11} />}
                    </div>
                </div>

                {/* Actions (others' messages — future: react) */}
            </div>
        </div>
    );
};

// ── ChatPanel ─────────────────────────────────────────────────────────────────
const ChatPanel = ({
    messages, newMessage, setNewMessage, sendMessage,
    editingMessageId, setEditingMessageId, handleFileUpload,
    deleteChatMessage, startEditingMessage, onClose,
    roomUsers, currentUserName, canChat, meetingTitle,
}) => {
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const bodyRef = useRef(null);
    const [atBottom, setAtBottom] = useState(true);

    // Group with date labels
    const groupedMessages = messages.reduce((acc, msg, idx) => {
        if (idx === 0) acc.push({ type: 'date', label: 'Bugun' });
        acc.push({ type: 'msg', ...msg });
        return acc;
    }, []);

    // Auto-scroll only when at bottom
    useEffect(() => {
        if (atBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, atBottom]);

    const handleScroll = (e) => {
        const el = e.currentTarget;
        setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setNewMessage('');
        inputRef.current?.focus();
    };

    const onlineCount = roomUsers?.length ?? 0;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0e1016] select-text transition-colors duration-200">

            {/* ── Header ── */}
            <div className="shrink-0 bg-white dark:bg-[#13161e] border-b border-gray-100 dark:border-white/6 px-3 py-3 sm:px-4 sm:py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/12 border border-blue-100 dark:border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <MessageSquare size={15} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-semibold text-sm leading-tight truncate">
                        Uchrashuv chati
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <p className="text-gray-400 dark:text-gray-500 text-[10px] font-medium">
                            {onlineCount} ishtirokchi online
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors shrink-0"
                    title="Yopish"
                >
                    <X size={16} />
                </button>
            </div>

            {/* ── Messages body ── */}
            <div
                ref={bodyRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 py-2 flex flex-col custom-scrollbar"
            >
                {groupedMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/8 flex items-center justify-center mb-4">
                            <MessageSquare size={24} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold">Hali xabar yo'q</p>
                        <p className="text-gray-400 dark:text-gray-600 text-xs mt-1.5 leading-relaxed max-w-[180px]">
                            Jamoangiz bilan muloqotni boshlang!
                        </p>
                    </div>
                ) : (
                    groupedMessages.map((item, idx) => {
                        if (item.type === 'date') return <DateBadge key={`date-${idx}`} label={item.label} />;
                        // find the previous message (skip date separators)
                        const prevItem = groupedMessages.slice(0, idx).reverse().find(i => i.type === 'msg');
                        return (
                            <MessageBubble
                                key={item._id || idx}
                                msg={item}
                                prevMsg={prevItem}
                                isOwn={item.userName === currentUserName}
                                canAct={item.userName === currentUserName}
                                onEdit={startEditingMessage}
                                onDelete={deleteChatMessage}
                            />
                        );
                    })
                )}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* ── Edit banner ── */}
            {editingMessageId && (
                <div className="mx-3 mb-1 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl flex items-center gap-2 shrink-0">
                    <div className="w-0.5 h-6 bg-amber-500 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                            Xabar tahrirlash
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{newMessage}</p>
                    </div>
                    <button
                        onClick={handleCancelEdit}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                    >
                        <X size={13} />
                    </button>
                </div>
            )}

            {/* ── Input footer ── */}
            <div className="shrink-0 bg-white dark:bg-[#13161e] border-t border-gray-100 dark:border-white/6 px-3 py-2 sm:px-4 sm:py-2.5">
                {canChat ? (
                    <form onSubmit={sendMessage} className="flex items-center gap-1.5">
                        {/* File attach */}
                        <label
                            className="p-2 rounded-xl text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors cursor-pointer shrink-0"
                            title="Fayl biriktirish"
                        >
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                            <Paperclip size={17} />
                        </label>

                        {/* Text input */}
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={editingMessageId ? 'Xabarni tahrirlang...' : 'Xabar yozing...'}
                                className={`w-full bg-gray-100 dark:bg-white/6 text-gray-900 dark:text-gray-100
                                    placeholder-gray-400 dark:placeholder-gray-600
                                    rounded-xl px-4 py-2.5 text-sm border transition-all duration-150
                                    focus:outline-none focus:ring-2
                                    ${editingMessageId
                                        ? 'border-amber-300 dark:border-amber-500/40 focus:ring-amber-400/25 focus:border-amber-400 dark:focus:border-amber-500/60'
                                        : 'border-gray-200 dark:border-white/6 focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500/40'
                                    }`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) { sendMessage(e); }
                                }}
                            />
                        </div>

                        {/* Send button */}
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            title="Yuborish (Enter)"
                            className={`p-2.5 rounded-xl shrink-0 transition-all duration-150 active:scale-95
                                ${newMessage.trim()
                                    ? editingMessageId
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                }`}
                        >
                            <Send size={16} className={newMessage.trim() ? '' : 'opacity-60'} />
                        </button>
                    </form>
                ) : (
                    <div className="flex items-center justify-center gap-2 py-2">
                        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-white/8 flex items-center justify-center">
                            <X size={8} className="text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                            Mehmonlar faqat o'qishi mumkin
                        </p>
                    </div>
                )}

                {/* Hint */}
                {canChat && !editingMessageId && (
                    <p className="text-center text-[10px] text-gray-300 dark:text-gray-700 mt-1.5 select-none">
                        Enter — yuborish
                    </p>
                )}
            </div>
        </div>
    );
};

export default ChatPanel;
