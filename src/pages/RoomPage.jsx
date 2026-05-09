import React, { useEffect, useRef, useState, useMemo, useCallback, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import API from '../api';
import Video from '../components/Video';
import ChatPanel from '../components/ChatPanel';
import RoomBottomControls from '../components/room/RoomBottomControls';
import RoomSettingsModal from '../components/room/RoomSettingsModal';
import { WaitingRoom, AccessDenied } from '../components/room/RoomScreens';
import Select from '../components/Select';
import {
    Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, MonitorOff,
    Circle, StopCircle, Hand, Settings, MessageSquare,
    Users, Copy, Check, ShieldCheck, Clock, X, Lock, LogOut,
    Monitor, Volume2, MoreVertical, ChevronDown, PhoneOff, Wifi, Pin, LayoutGrid, Presentation
} from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import { ThemeLanguageContext } from '../context/ThemeLanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../components/ConfirmModal';


const RoomPage = () => {
    const { id: roomID } = useParams();
    const navigate = useNavigate();
    const { t, lang } = useContext(ThemeLanguageContext);
    const { user: authUser } = useAuth();
    const toast = useToast();
    const { confirm, modal: confirmModal } = useConfirm();

    const userInfo = useMemo(() => {
        if (authUser) return authUser;
        // sessionStorage: tab yopilsa tozalanadi, reload da saqlanadi → bir marta ruhsat ishlaydi
        const key = `guest-id-${roomID}`;
        let guestId = sessionStorage.getItem(key);
        if (!guestId) {
            guestId = `guest-${crypto.randomUUID()}`;
            sessionStorage.setItem(key, guestId);
        }
        return { name: 'Guest', _id: guestId, role: 'guest' };
    }, [authUser, roomID]);

    const [meeting, setMeeting] = useState(null);
    const [peers, setPeers] = useState([]);
    const [stream, setStream] = useState(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isVideoOff, setIsVideoOff] = useState(true);
    const [remoteStreams, setRemoteStreams] = useState({}); // socketId -> stream
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [showParticipants, setShowParticipants] = useState(true);
    const [roomUsers, setRoomUsers] = useState([]);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [copied, setCopied] = useState(false);
    const [handRaisedUsers, setHandRaisedUsers] = useState([]);
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [videoDevices, setVideoDevices] = useState([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [screenShareRequest, setScreenShareRequest] = useState(null);
    const [isWaitingForPermission, setIsWaitingForPermission] = useState(false);
    const [currentTurnUserId, setCurrentTurnUserId] = useState(null);
    const [activeSharingUser, setActiveSharingUser] = useState(null);
    const [audioDevices, setAudioDevices] = useState([]);
    const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [changePwOld, setChangePwOld] = useState('');
    const [changePwNew, setChangePwNew] = useState('');
    const [changePwLoading, setChangePwLoading] = useState(false);
    const [shareRequests, setShareRequests] = useState([]); // For Host/Co-host
    const [isShareApproved, setIsShareApproved] = useState(false); // For Participants
    const [requestPending, setRequestPending] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    // Role system
    const [myRole, setMyRole] = useState(null); // 'host'|'cohost'|'participant'|'guest'
    const [waitingRoomUsers, setWaitingRoomUsers] = useState([]); // For host/cohost
    const waitingRoomUsersRef = useRef([]);
    const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
    const [waitingRoomDenied, setWaitingRoomDenied] = useState(false);
    const [passwordRequired, setPasswordRequired] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordAttempts, setPasswordAttempts] = useState(0);
    const [passwordShowText, setPasswordShowText] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [waitingBadge, setWaitingBadge] = useState(0);
    const [waitingToasts, setWaitingToasts] = useState([]);
    const [meetingElapsed, setMeetingElapsed] = useState('00:00:00');
    const [networkInfo, setNetworkInfo] = useState({ label: 'Stable', ping: 32, tone: 'text-emerald-500' });
    const [viewMode, setViewMode] = useState('speaker');
    const [gridSize, setGridSize] = useState('auto');
    const [pinnedSocketId, setPinnedSocketId] = useState(null);
    const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const screenStreamRef = useRef(null);
    const userVideo = useRef();
    const peersRef = useRef([]);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const audioDestinationRef = useRef(null);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);
    // Ref-based socket to avoid module-level singleton issues
    const socketRef = useRef(null);
    // Ref mirror of isSharingScreen to avoid stale closure in socket event handlers
    const isSharingScreenRef = useRef(false);
    const holdToTalkRef = useRef(false);
    const waitingToastRef = useRef([]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const formatDuration = useCallback((ms) => {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }, []);

    const playNotificationSound = useCallback(() => {
        try {
            const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextCtor) return;
            const ctx = new AudioContextCtor();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 1);
            oscillator.onended = () => ctx.close().catch(() => {});
        } catch (_) {}
    }, []);

    const showBrowserNotification = useCallback((name) => {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
        new Notification('Meetra waiting room', {
            body: `${name || 'Foydalanuvchi'} qo'shilishni so'rayapti`,
            icon: '/vite.svg'
        });
    }, []);

    useEffect(() => {
        scrollToBottom();
        if (showChat) setUnreadMessages(0);
    }, [messages, showChat]);

    useEffect(() => {
        if (!meeting?.startTime) return;
        const startAt = new Date(meeting.startTime).getTime();
        const tick = () => setMeetingElapsed(formatDuration(Date.now() - startAt));
        tick();
        const intervalId = setInterval(tick, 1000);
        return () => clearInterval(intervalId);
    }, [meeting?.startTime, formatDuration]);

    useEffect(() => {
        const updateNetwork = () => {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            const rtt = typeof connection?.rtt === 'number' ? connection.rtt : 32;
            const effectiveType = connection?.effectiveType;
            if (rtt < 80 && effectiveType !== '2g') setNetworkInfo({ label: 'Excellent', ping: rtt, tone: 'text-emerald-500' });
            else if (rtt < 160) setNetworkInfo({ label: 'Good', ping: rtt, tone: 'text-blue-500' });
            else if (rtt < 260) setNetworkInfo({ label: 'Fair', ping: rtt, tone: 'text-amber-500' });
            else setNetworkInfo({ label: 'Weak', ping: rtt, tone: 'text-red-500' });
        };
        updateNetwork();
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        connection?.addEventListener?.('change', updateNetwork);
        return () => connection?.removeEventListener?.('change', updateNetwork);
    }, []);

    useEffect(() => {
        if ((myRole === 'host' || myRole === 'cohost') && typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    }, [myRole]);

    useEffect(() => {
        if (!waitingToasts.length) return;
        const timers = waitingToasts.map((toastItem) => setTimeout(() => {
            setWaitingToasts((prev) => prev.filter((item) => item.socketId !== toastItem.socketId));
        }, 30000));
        return () => timers.forEach(clearTimeout);
    }, [waitingToasts]);

    useEffect(() => {
        // Create socket on mount — avoid module-level singleton
        const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005', {
            auth: { token: userInfo?.token || null }
        });
        socketRef.current = socket;

        // Clear old state before joining new room
        setMessages([]);
        setPeers([]);
        setShareRequests([]);
        setIsShareApproved(false);
        setRequestPending(false);

        const fetchMeeting = async (password = null) => {
            try {
                const config = password ? { 
                    params: { password } 
                } : {};
                const { data } = await API.get(`/api/meetings/${roomID}`, config);
                setMeeting(data);
                setPasswordRequired(false);
            } catch (error) {
                if (error.response?.status === 403 && error.response?.data?.requiresPassword) {
                    setPasswordRequired(true);
                } else if (error.response?.status === 403) {
                    setAccessDenied(true);
                } else {
                    toast.error(t('meeting_not_found'));
                    navigate('/');
                }
            }
        };
        fetchMeeting();

        socket.on('chat-message', (message) => {
            setMessages((prev) => [...prev, message]);
            if (!showChat) setUnreadMessages(prev => prev + 1);
        });

        socket.on('chat-message-edited', ({ _id, newText }) => {
            setMessages(prev => prev.map(m => m._id === _id ? { ...m, text: newText } : m));
        });

        socket.on('chat-message-deleted', ({ _id }) => {
            setMessages(prev => prev.filter(m => m._id !== _id));
        });

        socket.on('previous-messages', (prevMessages) => {
            const formattedMessages = prevMessages.map(m => ({
                _id: m._id,
                userName: m.senderName,
                text: m.text,
                file: m.file,
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            setMessages(formattedMessages);
        });

        socket.on('user-hand-raised', ({ userId, userName }) => {
            setHandRaisedUsers((prev) => [...prev, userId]);
            setToastMessage(`✋ ${userName || 'Someone'} raised their hand`);
            setTimeout(() => setToastMessage(null), 3000);
            setTimeout(() => setHandRaisedUsers((prev) => prev.filter(id => id !== userId)), 10000);
        });

        socket.on('update-user-list', (users) => {
            setRoomUsers(users);
        });

        socket.on('share-request-received', ({ userId, userName, type, requesterSocketId }) => {
            setShareRequests(prev => [...prev, { userId: requesterSocketId || userId, userName, type }]);
        });

        socket.on('share-request-result', ({ approved, type }) => {
            setRequestPending(false);
            if (approved) {
                setIsShareApproved(true);
            } else {
                toast.warning(t('host_denied_share'));
            }
        });

        // FIX: use isSharingScreenRef (not state) to avoid stale closure
        socket.on('force-stop-share', () => {
            if (isSharingScreenRef.current) {
                stopScreenShareFn(screenStreamRef, audioContextRef, audioDestinationRef, peersRef, streamRef, socket, roomID, setActiveSharingUser, setIsSharingScreen, setIsShareApproved, setIsWaitingForPermission, isSharingScreenRef);
                toast.warning(t('host_stopped_share'));
            }
        });

        socket.on('user-disconnected', (userId) => {
            const peerObj = peersRef.current.find(p => p.peerID === userId);
            if (peerObj) peerObj.peer.destroy();
            const peers = peersRef.current.filter(p => p.peerID !== userId);
            peersRef.current = peers;
            setPeers(peers);
        });

        socket.on('kicked', () => { toast.error(t('kicked_msg')); navigate('/'); });
        socket.on('blocked', () => { toast.error(t('blocked_msg')); navigate('/'); });
        socket.on('error-message', (msg) => { toast.error(msg); navigate('/'); });

        socket.on('turn-updated', (data) => setCurrentTurnUserId(data.userId));
        socket.on('screen-sharing-started', (data) => setActiveSharingUser(data));
        socket.on('screen-sharing-stopped', () => setActiveSharingUser(null));

        socket.on('your-role', ({ role }) => {
            setMyRole(role);
            setIsInWaitingRoom(false);
        });

        socket.on('role-updated', ({ role }) => {
            setMyRole(role);
        });

        socket.on('waiting-room', () => {
            setIsInWaitingRoom(true);
        });

        socket.on('waiting-room-denied', () => {
            setIsInWaitingRoom(false);
            setWaitingRoomDenied(true);
        });

        socket.on('waiting-room-update', (list) => {
            const incoming = list || [];
            const prev = waitingRoomUsersRef.current;
            // Yangi odam kelganida notification ko'rsat
            if (incoming.length > prev.length) {
                const newUser = incoming.find(u => !prev.find(p => p.socketId === u.socketId));
                if (newUser) {
                    toast.info(`✋ ${newUser.userName || 'Foydalanuvchi'} kirishni so'ramoqda`);
                    // Browser notification (agar ruxsat berilgan bo'lsa)
                    if (Notification.permission === 'granted') {
                        new Notification('Meetra', { body: `${newUser.userName} kirishni so'ramoqda`, icon: '/vite.svg' });
                    }
                }
            }
            waitingRoomUsersRef.current = incoming;
            setWaitingRoomUsers(incoming);
        });

        socket.on('room-muted-all', () => {
            if (streamRef.current?.getAudioTracks()[0]?.enabled) {
                streamRef.current.getAudioTracks()[0].enabled = false;
                setIsMuted(true);
                socket.emit('update-media-status', { roomId: roomID, micStatus: false });
            }
        });

        socket.on('meeting-ended', () => {
            toast.info(t('meeting_ended_msg'));
            navigate('/');
        });

        socket.on('all-users', (users) => {
            const newPeers = [];
            // To'liq ro'yxat kelganda eskisini tozalab tashlash (dublikat oldini oladi)
            peersRef.current.forEach(p => p.peer && p.peer.destroy());
            peersRef.current = [];
            setRemoteStreams({});
            
            users.forEach((u) => {
                const peer = createPeer(u.socketId, socket.id, streamRef.current, userInfo._id, socket);
                peersRef.current.push({ peerID: u.socketId, userId: u.userId, peer });
                newPeers.push({ peerID: u.socketId, userId: u.userId, peer });
            });
            setPeers(newPeers);
        });

        socket.io.on('reconnect', () => {
            socket.emit('reconnect-room', roomID, userInfo._id, userInfo.name, userInfo.role === 'guest' || userInfo._id?.startsWith('guest-'));
        });

        socket.on('user-joined', (payload) => {
            // Agar u allaqachon ro'yxatda bo'lsa, qayta ulamaymiz (dublikat oldini oladi)
            if (peersRef.current.find(p => p.peerID === payload.callerID)) return;
            
            const peer = addPeer(payload.signal, payload.callerID, streamRef.current, socket);
            const peerObj = { peerID: payload.callerID, userId: payload.callerUserId, peer };
            peersRef.current.push(peerObj);
            setPeers((prev) => [...prev, peerObj]);
        });

        socket.on('receiving-returned-signal', (payload) => {
            const item = peersRef.current.find((p) => p.peerID === payload.id);
            if (item) item.peer.signal(payload.signal);
        });

        const initMedia = async () => {
            const isGuest = userInfo.role === 'guest' || userInfo._id?.startsWith('guest-');

            // Guest: read-only mode — no camera/mic needed
            if (isGuest) {
                const emptyStream = new MediaStream();
                setStream(emptyStream);
                streamRef.current = emptyStream;
                socket.emit('join-room', roomID, userInfo._id, userInfo.name, true, passwordInput);
                return;
            }

            try {
                const currentStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1,
                        sampleRate: 48000,
                        sampleSize: 16,
                        voiceIsolation: true,
                        googEchoCancellation: true,
                        googAutoGainControl: true,
                        googNoiseSuppression: true,
                        googHighpassFilter: true,
                        googTypingNoiseDetection: true,
                    }
                });
                
                // Mute and hide video by default for all users when entering the room
                currentStream.getAudioTracks().forEach(t => t.enabled = false);
                currentStream.getVideoTracks().forEach(t => t.enabled = false);

                setStream(currentStream);
                streamRef.current = currentStream;
                if (userVideo.current) userVideo.current.srcObject = currentStream;

                socket.emit('join-room', roomID, userInfo._id, userInfo.name, false, passwordInput);

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoIn = devices.filter(device => device.kind === 'videoinput');
                const audioIn = devices.filter(device => device.kind === 'audioinput');
                setVideoDevices(videoIn);
                setAudioDevices(audioIn);
                if (videoIn.length > 0 && !selectedVideoDevice) setSelectedVideoDevice(videoIn[0].deviceId);
                if (audioIn.length > 0 && !selectedAudioDevice) setSelectedAudioDevice(audioIn[0].deviceId);
            } catch (err) {
                console.error("Media access denied:", err);
                // Create Dummy silent audio and black video tracks to negotiate SDP media lines properly
                const canvas = document.createElement('canvas');
                canvas.width = 1; canvas.height = 1;
                const dummyVideoTrack = canvas.captureStream().getVideoTracks()[0];
                if (dummyVideoTrack) dummyVideoTrack.enabled = false;

                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioContext();
                const dest = ctx.createMediaStreamDestination();
                const dummyAudioTrack = dest.stream.getAudioTracks()[0];
                if (dummyAudioTrack) dummyAudioTrack.enabled = false;

                const tracks = [];
                if (dummyVideoTrack) tracks.push(dummyVideoTrack);
                if (dummyAudioTrack) tracks.push(dummyAudioTrack);

                const emptyStream = new MediaStream(tracks);
                setStream(emptyStream);
                streamRef.current = emptyStream;
                setIsMuted(true);
                setIsVideoOff(true);
                socket.emit('join-room', roomID, userInfo._id, userInfo.name, isGuest, passwordInput);
            }
        };
        initMedia();

        return () => {
            socket.emit('leave-room');
            socket.disconnect();
            socketRef.current = null;
        };
    }, [roomID, navigate]);

    useEffect(() => {
        if (!isInWaitingRoom && stream && userVideo.current && !isSharingScreen) {
            userVideo.current.srcObject = stream;
        }
    }, [isInWaitingRoom, stream, isSharingScreen]);

    // Keep ref in sync with state so event-handler closures always have fresh value
    useEffect(() => {
        isSharingScreenRef.current = isSharingScreen;
    }, [isSharingScreen]);

    useEffect(() => {
        if (activeSharingUser && activeSharingUser.userId !== userInfo._id) {
            setToastMessage(`${activeSharingUser.userName} is sharing their screen`);
            setTimeout(() => setToastMessage(null), 5000);
        }
    }, [activeSharingUser, userInfo._id]);

    useEffect(() => {
        setWaitingBadge(waitingRoomUsers.length);
    }, [waitingRoomUsers.length]);

    useEffect(() => {
        if (!(myRole === 'host' || myRole === 'cohost')) return;
        const previous = waitingToastRef.current || [];
        const newUsers = waitingRoomUsers.filter((user) => !previous.find((prevUser) => prevUser.socketId === user.socketId));
        waitingToastRef.current = waitingRoomUsers;
        if (newUsers.length === 0) return;
        newUsers.forEach((newUser) => {
            playNotificationSound();
            setWaitingToasts((current) => current.find((item) => item.socketId === newUser.socketId) ? current : [...current, newUser]);
        });
    }, [myRole, playNotificationSound, waitingRoomUsers]);

    // FIX: socket passed as parameter (not module-level variable)
    function createPeer(userToSignal, callerID, stream, callerUserId, socket) {
        const peer = new Peer({ initiator: true, trickle: false, stream });
        peer.on('signal', (signal) => socket.emit('sending-signal', { userToSignal, callerID, signal, callerUserId }));
        peer.on('stream', (remoteStream) => {
            setRemoteStreams(prev => ({ ...prev, [userToSignal]: remoteStream }));
        });
        peer.on('error', (err) => console.error("Peer error:", err));
        return peer;
    }

    function addPeer(incomingSignal, callerID, stream, socket) {
        const peer = new Peer({ initiator: false, trickle: false, stream });
        peer.on('signal', (signal) => socket.emit('returning-signal', { signal, callerID }));
        peer.on('stream', (remoteStream) => {
            setRemoteStreams(prev => ({ ...prev, [callerID]: remoteStream }));
        });
        peer.on('error', (err) => console.error("Peer error:", err));
        peer.signal(incomingSignal);
        return peer;
    }

    const toggleMute = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                const newEnabled = !audioTrack.enabled;
                audioTrack.enabled = newEnabled;
                setIsMuted(!newEnabled);
                socketRef.current?.emit('update-media-status', { roomId: roomID, micStatus: newEnabled });
            } else {
                setIsMuted(true);
            }
        }
    };

    const toggleVideo = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                const newEnabled = !videoTrack.enabled;
                videoTrack.enabled = newEnabled;
                setIsVideoOff(!newEnabled);
                socketRef.current?.emit('update-media-status', { roomId: roomID, videoStatus: newEnabled });
            } else {
                setIsVideoOff(true);
            }
        }
    };

    const switchCamera = async (deviceId) => {
        try {
            const audioBase = {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                channelCount: 1,
                sampleRate: 48000,
                voiceIsolation: true,
            };
            const constraints = {
                video: { deviceId: { exact: deviceId } },
                audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice }, ...audioBase } : audioBase,
            };
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const videoTrack = newStream.getVideoTracks()[0];
            const oldTrack = streamRef.current.getVideoTracks()[0];

            peersRef.current.forEach(({ peer }) => {
                if (oldTrack && videoTrack) peer.replaceTrack(oldTrack, videoTrack, streamRef.current);
            });

            if (oldTrack) oldTrack.stop();
            streamRef.current.removeTrack(oldTrack);
            streamRef.current.addTrack(videoTrack);

            if (userVideo.current) userVideo.current.srcObject = streamRef.current;
            setSelectedVideoDevice(deviceId);
        } catch (err) {
            console.error("Camera switch failed:", err);
        }
    };

    const switchAudio = async (deviceId) => {
        try {
            const constraints = {
                video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
                audio: {
                    deviceId: { exact: deviceId },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                    sampleRate: 48000,
                    voiceIsolation: true,
                    googEchoCancellation: true,
                    googAutoGainControl: true,
                    googNoiseSuppression: true,
                    googHighpassFilter: true,
                    googTypingNoiseDetection: true,
                }
            };
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            const audioTrack = newStream.getAudioTracks()[0];
            const oldTrack = streamRef.current.getAudioTracks()[0];

            peersRef.current.forEach(({ peer }) => {
                if (oldTrack && audioTrack) peer.replaceTrack(oldTrack, audioTrack, streamRef.current);
            });

            if (oldTrack) oldTrack.stop();
            streamRef.current.removeTrack(oldTrack);
            streamRef.current.addTrack(audioTrack);
            setSelectedAudioDevice(deviceId);
        } catch (err) {
            console.error("Audio switch failed:", err);
        }
    };

    const requestShare = (type) => {
        if (canModerate) return;
        setRequestPending(true);
        const socket = socketRef.current;
        if (!socket) return;
        socket.emit('request-to-share', {
            roomId: roomID,
            userId: socket.id,
            userName: userInfo.name,
            type
        });
    };

    const respondToShareRequest = (userId, approved, type) => {
        setShareRequests(prev => prev.filter(req => req.userId !== userId));
        socketRef.current?.emit('share-permission-response', { userId, approved, type });
    };

    const toggleScreenShare = () => {
        if (isSharingScreen) { stopScreenShare(); return; }

        // Browser support
        if (!navigator.mediaDevices?.getDisplayMedia) {
            toast.error(t('share_unsupported'));
            return;
        }
        // Block if someone else is already sharing (host can override by stopping the other share)
        if (activeSharingUser && activeSharingUser.socketId !== socketRef.current?.id) {
            toast.info(t('share_busy').replace('{name}', activeSharingUser.userName));
            return;
        }
        startScreenShare();
    };

    const startScreenShare = () => {
        if (isSharingScreenRef.current) return;
        const socket = socketRef.current;
        if (!socket) return;

        // Let the browser picker handle source + system-audio toggle.
        // We don't request system audio because we never mix it in (echo prevention).
        const constraints = {
            video: { cursor: 'always', frameRate: { ideal: 30, max: 60 } },
            audio: false,
        };

        navigator.mediaDevices.getDisplayMedia(constraints).then(screenStream => {
            const screenVideoTrack = screenStream.getVideoTracks()[0];
            const screenAudioTrack = screenStream.getAudioTracks()[0];
            const micTrack = streamRef.current?.getAudioTracks()[0];
            screenStreamRef.current = screenStream;

            let finalTracks = [];
            if (screenVideoTrack) finalTracks.push(screenVideoTrack);

            // Prefer the AEC-processed mic track verbatim (no Web Audio mixing) so that
            // browser echo cancellation keeps working when multiple people speak in parallel.
            // Screen audio (system audio) is intentionally not mixed into the mic to avoid
            // feedback loops if the user has speakers on.
            if (micTrack) {
                finalTracks.push(micTrack);
            } else if (screenAudioTrack) {
                finalTracks.push(screenAudioTrack);
            }

            const finalStream = new MediaStream(finalTracks);

            peersRef.current.forEach(({ peer }) => {
                const replace = () => {
                    try {
                        const oldVideoTrack = streamRef.current?.getVideoTracks()[0];
                        const oldAudioTrack = streamRef.current?.getAudioTracks()[0];
                        if (screenVideoTrack && oldVideoTrack) {
                            peer.replaceTrack(oldVideoTrack, screenVideoTrack, streamRef.current);
                        }
                        if (finalStream.getAudioTracks()[0] && oldAudioTrack) {
                            peer.replaceTrack(oldAudioTrack, finalStream.getAudioTracks()[0], streamRef.current);
                        }
                    } catch (e) { console.error('replaceTrack error:', e); }
                };
                if (!peer.connected) peer.once('connect', replace);
                else replace();
            });

            screenVideoTrack && (screenVideoTrack.onended = () => stopScreenShare());
            socket.emit('start-screen-share', { roomId: roomID, userId: userInfo._id, userName: userInfo.name });
            setActiveSharingUser({ socketId: socket.id, userId: userInfo._id, userName: userInfo.name });
            if (userVideo.current) userVideo.current.srcObject = finalStream;
            isSharingScreenRef.current = true;
            setIsSharingScreen(true);
        }).catch(err => {
            setIsWaitingForPermission(false);
            setRequestPending(false);
            // User cancelled the picker — silent
            if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') return;
            console.error('Error sharing screen:', err);
            toast.error(t('share_failed'));
        });
    };

    // Extracted as standalone fn so force-stop-share closure can also call it
    const stopScreenShareFn = (sStreamRef, aCtxRef, aDestRef, pRef, stRef, socket, roomId, setActiveSh, setSh, setShareAppr, setWaiting, shRef) => {
        const cameraTrack = stRef.current?.getVideoTracks()[0];
        const micTrack = stRef.current?.getAudioTracks()[0];
        const screenVideoTrack = sStreamRef.current?.getVideoTracks()[0];
        const mixedAudioTrack = aDestRef.current?.stream.getAudioTracks()[0];

        pRef.current.forEach(({ peer }) => {
            try {
                if (peer.connected) {
                    if (screenVideoTrack && cameraTrack) peer.replaceTrack(screenVideoTrack, cameraTrack, stRef.current);
                    if (mixedAudioTrack && micTrack) {
                        peer.replaceTrack(mixedAudioTrack, micTrack, stRef.current);
                    } else if (!mixedAudioTrack && sStreamRef.current?.getAudioTracks()[0] && micTrack) {
                        peer.replaceTrack(sStreamRef.current.getAudioTracks()[0], micTrack, stRef.current);
                    }
                }
            } catch (e) { console.error('restoreTrack error:', e); }
        });

        if (sStreamRef.current) {
            sStreamRef.current.getTracks().forEach(t => t.stop());
            sStreamRef.current = null;
        }
        if (aCtxRef.current) {
            aCtxRef.current.close().catch(() => {});
            aCtxRef.current = null;
            aDestRef.current = null;
        }

        socket?.emit('stop-screen-share', { roomId });
        setActiveSh(null);
        if (userVideo.current) userVideo.current.srcObject = stRef.current;
        if (shRef) shRef.current = false;
        setSh(false);
        setShareAppr(false);
        setWaiting(false);
    };

    const stopScreenShare = () => {
        if (!isSharingScreenRef.current) return;
        stopScreenShareFn(screenStreamRef, audioContextRef, audioDestinationRef, peersRef, streamRef,
            socketRef.current, roomID, setActiveSharingUser, setIsSharingScreen,
            setIsShareApproved, setIsWaitingForPermission, isSharingScreenRef);
    };

    const handlePermissionResponse = (allowed) => {
        if (screenShareRequest) {
            socketRef.current?.emit('screen-share-permission-response', { requesterSocketId: screenShareRequest.socketId, allowed });
            setScreenShareRequest(null);
        }
    };

    const startRecording = async () => {
        if (!canRecord) { toast.warning(t('record_host_only')); return; }
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            recordedChunksRef.current = [];
            const options = { mimeType: 'video/webm;codecs=vp9,opus' };
            
            // Fallback for browsers that don't support vp9/opus well
            const mediaRecorder = new MediaRecorder(displayStream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);

            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Meeting_Record_${roomID}_${new Date().toISOString().slice(0, 10)}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                displayStream.getTracks().forEach(track => track.stop());
                setToastMessage("💾 Recording saved to your device.");
                setTimeout(() => setToastMessage(null), 4000);
            };

            displayStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            setToastMessage("⏺ Recording started locally. Stop it to save.");
            setTimeout(() => setToastMessage(null), 4000);
        } catch (e) {
            console.error("Recording error or user cancelled:", e);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const checkGuestAction = async () => {
        if (myRole === 'guest') {
            const ok = await confirm(t('confirm_guest_login'));
            if (ok) {
                navigate('/login');
            }
            return true;
        }
        return false;
    };

    const handleFileUpload = async (e) => {
        if (await checkGuestAction()) return;
        const file = e.target.files[0];
        if (!file) return;

        const confirmSend = await confirm(`${t('confirm_send_file')} "${file.name}"`);
        if (!confirmSend) {
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            socketRef.current?.emit('file-message', {
                roomId: roomID, userId: userInfo._id, userName: userInfo.name,
                file: { name: file.name, type: file.type, size: file.size, data: event.target.result }
            });
            e.target.value = '';
        };
        reader.readAsDataURL(file);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (await checkGuestAction()) return;
        if (!canChat) { toast.warning(t('chat_disabled')); return; }
        
        if (editingMessageId) {
            if (newMessage.trim()) {
                socketRef.current?.emit('edit-chat-message', { roomId: roomID, messageId: editingMessageId, newText: newMessage, userId: userInfo._id });
            }
            setEditingMessageId(null);
            setNewMessage('');
            return;
        }

        if (newMessage.trim()) {
            socketRef.current?.emit('chat-message', { roomId: roomID, userId: userInfo._id, userName: userInfo.name, message: newMessage });
            setNewMessage('');
        }
    };

    const deleteChatMessage = async (msgId) => {
        const ok = await confirm(t('confirm_delete_msg'));
        if (ok) socketRef.current?.emit('delete-chat-message', { roomId: roomID, messageId: msgId, userId: userInfo._id });
    };
    
    const startEditingMessage = (msgId, text) => {
        setEditingMessageId(msgId);
        setNewMessage(text);
        if (!showChat) setShowChat(true);
    };

    const kickUser = async (socketId) => {
        const ok = await confirm(t('confirm_kick'));
        if (ok) socketRef.current?.emit('kick-user', { roomId: roomID, targetSocketId: socketId });
    };

    const blockUser = async (userId, socketId) => {
        const ok = await confirm(t('confirm_block'));
        if (ok) socketRef.current?.emit('block-user', { roomId: roomID, targetUserId: userId, targetSocketId: socketId });
    };

    const giveTurn = (targetUserId) => {
        if (!canModerate) return;
        // Toggle spotlight off if clicking the currently spotlit user again
        if (currentTurnUserId === targetUserId) {
            socketRef.current?.emit('give-turn', { roomId: roomID, targetUserId: null });
            setToastMessage(`Spotlight olib tashlandi.`);
        } else {
            socketRef.current?.emit('give-turn', { roomId: roomID, targetUserId });
            setToastMessage(`Foydalanuvchi markaziy ekranga chiqarildi.`);
        }
    };
    const raiseHand = () => {
        socketRef.current?.emit('hand-raise', { roomId: roomID, userId: userInfo._id, userName: userInfo.name });
        setToastMessage(`✋ You raised your hand`);
        setTimeout(() => setToastMessage(null), 3000);
        setHandRaisedUsers((prev) => [...prev, userInfo._id]);
        setTimeout(() => setHandRaisedUsers((prev) => prev.filter(id => id !== userInfo._id)), 10000);
    };
    const isHost = myRole === 'host';
    const isCoHost = myRole === 'cohost';
    const canModerate = isHost || isCoHost;
    const canRecord = myRole !== 'guest'; // Enable local recording for all non-guests
    const canChat = myRole !== 'guest';

    const admitUser = (targetSocketId) => {
        socketRef.current?.emit('admit-user', { roomId: roomID, targetSocketId });
        setWaitingToasts((prev) => prev.filter((item) => item.socketId !== targetSocketId));
    };

    const denyUser = (targetSocketId) => {
        socketRef.current?.emit('deny-user', { roomId: roomID, targetSocketId });
        setWaitingToasts((prev) => prev.filter((item) => item.socketId !== targetSocketId));
    };

    const promoteCoHost = async (targetUserId, targetSocketId) => {
        try {
            await API.post(`/api/meetings/${meeting._id}/cohost`, { userId: targetUserId });
            socketRef.current?.emit('promote-cohost', { roomId: roomID, targetUserId, targetSocketId });
        } catch (error) {
            toast.error('Failed to promote user');
        }
    };

    const demoteCoHost = async (targetUserId, targetSocketId) => {
        try {
            await API.delete(`/api/meetings/${meeting._id}/cohost`, { data: { userId: targetUserId } });
            socketRef.current?.emit('demote-cohost', { roomId: roomID, targetUserId, targetSocketId });
        } catch (error) {
            toast.error('Failed to demote user');
        }
    };

    const muteAll = () => { if (canModerate) socketRef.current?.emit('mute-all', { roomId: roomID }); };
    const endMeetingForAll = async () => {
        const ok = await confirm(t('confirm_end_meeting'));
        if (ok) socketRef.current?.emit('end-meeting', { roomId: roomID });
    };
    const leaveRoom = () => {
        socketRef.current?.emit('leave-room');
        socketRef.current?.disconnect();
        navigate('/');
    };

    const handleHoldToTalkStart = () => {
        if (myRole === 'guest' || !isMuted || holdToTalkRef.current) return;
        const audioTrack = streamRef.current?.getAudioTracks?.()[0];
        if (!audioTrack) return;
        holdToTalkRef.current = true;
        audioTrack.enabled = true;
        setIsMuted(false);
        socketRef.current?.emit('update-media-status', { roomId: roomID, micStatus: true });
    };

    const handleHoldToTalkEnd = () => {
        if (!holdToTalkRef.current) return;
        const audioTrack = streamRef.current?.getAudioTracks?.()[0];
        holdToTalkRef.current = false;
        if (!audioTrack) return;
        audioTrack.enabled = false;
        setIsMuted(true);
        socketRef.current?.emit('update-media-status', { roomId: roomID, micStatus: false });
    };

    const getStageUser = () => {
        if (!meeting) return null;
        // If someone is screen sharing, they are always the stage user
        if (activeSharingUser) return activeSharingUser;

        // If someone is spotlit (Given Turn), they become the primary stage user next
        if (currentTurnUserId) {
            const spotlitUser = roomUsers.find(u => String(u.userId) === String(currentTurnUserId));
            if (spotlitUser) {
                return { socketId: spotlitUser.socketId, userId: spotlitUser.userId, userName: spotlitUser.userName, role: spotlitUser.role };
            }
        }

        // Host is always the main stage (for both participants and the host themselves)
        const hostId = meeting.hostId?._id || meeting.hostId;
        const host = roomUsers.find(u => String(u.userId) === String(hostId));
        if (host) {
            return { socketId: host.socketId, userId: host.userId, userName: host.userName, role: 'host', isHost: true };
        }
        // Fallback: co-host as stage if no host found
        const cohost = roomUsers.find(u => u.role === 'cohost');
        if (cohost) {
            return { socketId: cohost.socketId, userId: cohost.userId, userName: cohost.userName, role: 'cohost' };
        }
        return null;
    };

    const pinnedUser = pinnedSocketId ? roomUsers.find((user) => user.socketId === pinnedSocketId) : null;
    const stageUser = pinnedUser ? {
        socketId: pinnedUser.socketId,
        userId: pinnedUser.userId,
        userName: pinnedUser.userName,
        role: pinnedUser.role,
        videoStatus: pinnedUser.videoStatus
    } : getStageUser();
    // Speaker view only makes sense when there are multiple participants
    const effectiveStageUser = (stageUser && roomUsers.length > 1) ? stageUser : null;
    // Deduplicate peers by peerID (prevents double tiles after pin/spotlight changes)
    const uniquePeers = peers.filter((p, i, arr) => arr.findIndex(x => x.peerID === p.peerID) === i);
    const totalParticipantCount = roomUsers.length || uniquePeers.length + 1;
    const autoGridClass = totalParticipantCount === 1
        ? 'grid-cols-1'
        : totalParticipantCount === 2
            ? 'grid-cols-2'
            : totalParticipantCount <= 4
                ? 'grid-cols-2'
                : totalParticipantCount <= 9
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-4';
    const gridClassMap = {
        auto: autoGridClass,
        '1x1': 'grid-cols-1',
        '2x2': 'grid-cols-2',
        '3x3': 'grid-cols-2 sm:grid-cols-3'
    };

    if (isInWaitingRoom) return <WaitingRoom />;
    if (waitingRoomDenied) return <AccessDenied />;
    if (accessDenied) return <AccessDenied />;

    // Password Modal for Private Rooms
    if (passwordRequired) {
        const handlePasswordSubmit = async (e) => {
            e.preventDefault();
            if (!passwordInput.trim()) return;
            setPasswordLoading(true);
            setPasswordError('');
            try {
                const { data } = await API.get(`/api/meetings/${roomID}`, { params: { password: passwordInput } });
                setMeeting(data);
                setPasswordRequired(false);
                setPasswordAttempts(0);
            } catch (error) {
                const newAttempts = passwordAttempts + 1;
                setPasswordAttempts(newAttempts);
                if (error.response?.status === 429) {
                    const retryAfter = error.response?.data?.retryAfter || 300;
                    setPasswordError(lang === 'uz'
                        ? `Juda ko'p urinish. ${Math.ceil(retryAfter / 60)} daqiqadan so'ng qayta urinib ko'ring.`
                        : lang === 'ru'
                            ? `Слишком много попыток. Попробуйте через ${Math.ceil(retryAfter / 60)} мин.`
                            : `Too many attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`);
                } else if (error.response?.status === 403 && error.response?.data?.requiresPassword) {
                    setPasswordError(lang === 'uz' ? 'Parol kiritilishi shart.' : lang === 'ru' ? 'Требуется пароль.' : 'Password required.');
                } else if (error.response?.status === 403) {
                    const remaining = Math.max(0, 5 - newAttempts);
                    setPasswordError(
                        (lang === 'uz' ? `Parol noto'g'ri.` : lang === 'ru' ? 'Неверный пароль.' : 'Incorrect password.')
                        + (remaining > 0 ? ` (${remaining} ${lang === 'uz' ? 'urinish qoldi' : lang === 'ru' ? 'попытки осталось' : 'attempts left'})` : '')
                    );
                } else {
                    toast.error(t('meeting_not_found'));
                    navigate('/');
                }
            } finally {
                setPasswordLoading(false);
            }
        };

        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
                <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-8 text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">
                            {lang === 'uz' ? 'Himoyalangan xona' : lang === 'ru' ? 'Защищённая комната' : 'Private Room'}
                        </h2>
                        <p className="text-purple-200 text-sm mt-1">
                            {lang === 'uz' ? 'Kirish uchun parol talab qilinadi' : lang === 'ru' ? 'Требуется пароль для входа' : 'Password required to join'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                        {/* Password field */}
                        <div className="relative">
                            <input
                                type={passwordShowText ? 'text' : 'password'}
                                placeholder={lang === 'uz' ? '6 xonali raqam' : lang === 'ru' ? '6-значный код' : '6-digit code'}
                                value={passwordInput}
                                onChange={(e) => { setPasswordInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setPasswordError(''); }}
                                autoFocus
                                autoComplete="current-password"
                                inputMode="numeric"
                                maxLength={6}
                                className={`w-full px-4 py-3.5 pr-12 rounded-xl border text-base font-mono tracking-widest bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${passwordError ? 'border-red-400 focus:ring-red-400/30' : 'border-gray-200 dark:border-gray-700 focus:ring-purple-500/30 focus:border-purple-500'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setPasswordShowText(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                            >
                                {passwordShowText
                                    ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                }
                            </button>
                        </div>

                        {/* Error */}
                        {passwordError && (
                            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{passwordError}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={!passwordInput.trim() || passwordLoading}
                            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {passwordLoading
                                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {lang === 'uz' ? 'Tekshirilmoqda...' : lang === 'ru' ? 'Проверка...' : 'Checking...'}</>
                                : <>{lang === 'uz' ? 'Kirish' : lang === 'ru' ? 'Войти' : 'Join Room'}</>
                            }
                        </button>

                        {/* Cancel */}
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="w-full py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                            {lang === 'uz' ? '← Orqaga' : lang === 'ru' ? '← Назад' : '← Go back'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col room-fullheight bg-[#0c0e14] text-white font-sans overflow-hidden">
            {toastMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
                    <div className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 w-[calc(100vw-2rem)] max-w-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
                        <span className="text-sm font-medium">{toastMessage}</span>
                    </div>
                </div>
            )}
            
            {/* Top Bar — Zoom minimal style */}
            <header className="h-12 md:h-14 flex items-center justify-between px-3 md:px-5 bg-[#17191f] border-b border-white/6 z-40 shrink-0">
                {/* Left: Live dot + Room name + Timer */}
                <div className="flex items-center gap-2 md:gap-3 overflow-hidden min-w-0">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">Live</span>
                    </div>
                    <div className="w-px h-4 bg-white/10 shrink-0" />
                    <h1 className="text-sm font-semibold text-white/90 tracking-tight truncate">
                        {meeting?.title || 'Xona tayyorlanmoqda...'}
                    </h1>
                    {/* Timer */}
                    <div className="hidden sm:flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-lg bg-white/5">
                        <Clock size={11} className="text-gray-500" />
                        <span className="text-[11px] font-mono font-semibold text-gray-400 tabular-nums">{meetingElapsed}</span>
                    </div>
                    {/* Participant count */}
                    <div className="hidden md:flex items-center gap-1 shrink-0">
                        <Users size={11} className="text-gray-500" />
                        <span className="text-[11px] font-semibold text-gray-500">{totalParticipantCount}</span>
                    </div>
                    {/* Role badge */}
                    {myRole && (
                        <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border shrink-0
                            ${myRole === 'host' ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                            : myRole === 'cohost' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : myRole === 'guest' ? 'bg-white/5 border-white/10 text-gray-500'
                            : 'bg-white/5 border-white/10 text-gray-400'}`}>
                            {myRole}
                        </span>
                    )}
                </div>

                {/* Right: Network info + View toggle + Language */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                    {/* Security + Network — compact */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            <span className="text-[10px] font-semibold text-emerald-500/80">Encrypted</span>
                        </div>
                        <div className={`flex items-center gap-1 ${networkInfo.tone}`}>
                            <Wifi size={12} />
                            <span className="text-[10px] font-semibold">{networkInfo.ping}ms</span>
                        </div>
                    </div>

                    {/* View mode toggle */}
                    <div className="hidden md:flex items-center gap-0.5 p-1 rounded-xl bg-white/5 border border-white/8">
                        <button onClick={() => setViewMode('speaker')} title="Speaker view"
                            className={`rounded-lg p-1.5 transition-all ${viewMode === 'speaker' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                            <Presentation size={14} />
                        </button>
                        <button onClick={() => setViewMode('grid')} title="Grid view"
                            className={`rounded-lg p-1.5 transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                            <LayoutGrid size={14} />
                        </button>
                    </div>

                    <LanguageToggle compact />
                </div>
            </header>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 flex flex-col p-1.5 sm:p-2.5 relative z-10 min-w-0">
                    {effectiveStageUser && viewMode === 'speaker' ? (
                    /* Zoom-style: stage + right thumbnail strip */
                    <div className="flex-1 flex overflow-hidden animate-in fade-in duration-500 relative gap-2">

                        {/* ─── Main Stage ─── */}
                        <div className="flex-1 min-w-0 min-h-0 relative bg-[#0b0d13] rounded-xl overflow-hidden shadow-2xl border border-white/6 flex items-center justify-center">

                            {/* Stage video */}
                            {effectiveStageUser.socketId === socketRef.current?.id ? (
                                <Video
                                    stream={stream}
                                    userName={userInfo.name}
                                    role={myRole}
                                    isStage={true}
                                    isLocal={true}
                                    userVideoStatus={!isVideoOff}
                                />
                            ) : (
                                (() => {
                                    const stageStream = remoteStreams[effectiveStageUser.socketId];
                                    return stageStream ? (
                                        <Video
                                            key={`${effectiveStageUser.socketId}-${activeSharingUser ? 'sharing' : 'normal'}`}
                                            stream={stageStream}
                                            userName={effectiveStageUser.userName}
                                            role={effectiveStageUser.role || (effectiveStageUser.isHost ? 'host' : 'participant')}
                                            isStage={true}
                                            isLocal={false}
                                            userVideoStatus={effectiveStageUser.videoStatus !== false}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 animate-pulse">
                                            <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-xs font-medium text-gray-500 tracking-wide">Syncing stream…</p>
                                        </div>
                                    );
                                })()
                            )}

                            {/* Screen share top banner */}
                            {activeSharingUser && (
                                <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2.5 bg-gradient-to-b from-black/80 via-black/30 to-transparent">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-blue-600/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-blue-400/30 shadow-lg">
                                            <MonitorUp size={12} className="text-blue-200 shrink-0" />
                                            <span className="text-[11px] font-bold text-white tracking-wide truncate max-w-[160px] sm:max-w-[260px]">
                                                {effectiveStageUser.userName}'s screen
                                            </span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse shrink-0" />
                                        </div>
                                    </div>
                                    {activeSharingUser.socketId === socketRef.current?.id && (
                                        <button
                                            onClick={stopScreenShare}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold transition-all shadow-lg border border-red-400/30"
                                        >
                                            <MonitorOff size={12} />
                                            <span className="hidden sm:inline">Stop Sharing</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Non-share: host badge (subtle) */}
                            {!activeSharingUser && (
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/8 z-20 pointer-events-none">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[10px] font-semibold text-white/80 tracking-wide">
                                        {effectiveStageUser.userName}
                                    </span>
                                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wider">
                                        {effectiveStageUser.role === 'host' ? 'Host' : effectiveStageUser.role === 'cohost' ? 'Co-Host' : ''}
                                    </span>
                                </div>
                            )}

                            {/* ─── Floating Thumbnails (Mobile only, top-right overlay) ─── */}
                            <div className="md:hidden absolute top-12 right-2 flex flex-col gap-1.5 z-20 max-h-[50%] overflow-y-auto scroll-smooth">
                                {effectiveStageUser.socketId !== socketRef.current?.id && (
                                    <div className="w-[86px] aspect-video bg-[#0e1016] rounded-lg overflow-hidden border border-white/15 shadow-xl ring-1 ring-inset ring-white/5">
                                        <Video stream={stream} userName="You" role={myRole} isLocal={true} userVideoStatus={!isVideoOff} />
                                    </div>
                                )}
                                {uniquePeers.filter(p => p.peerID !== effectiveStageUser.socketId).slice(0, 3).map((peerObj, idx) => {
                                    const user = roomUsers.find(u => u.socketId === peerObj.peerID);
                                    return (
                                        <div key={idx} className="relative w-[86px] aspect-video bg-[#0e1016] rounded-lg overflow-hidden border border-white/15 shadow-xl ring-1 ring-inset ring-white/5">
                                            <Video
                                                stream={remoteStreams[peerObj.peerID]}
                                                userName={user?.userName || 'Participant'}
                                                role={user?.role}
                                                isLocal={false}
                                                userVideoStatus={user?.videoStatus !== false}
                                            />
                                            {handRaisedUsers.includes(peerObj.userId) && (
                                                <div className="absolute top-0.5 right-0.5 text-[9px] leading-none">✋</div>
                                            )}
                                        </div>
                                    );
                                })}
                                {uniquePeers.filter(p => p.peerID !== effectiveStageUser.socketId).length > 3 && (
                                    <div className="w-[86px] aspect-video bg-black/60 rounded-lg border border-white/15 flex items-center justify-center shadow-xl">
                                        <span className="text-white text-xs font-bold">
                                            +{uniquePeers.filter(p => p.peerID !== effectiveStageUser.socketId).length - 3}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── Right Thumbnail Strip (Desktop only) ─── */}
                        <div className="hidden md:flex flex-col w-[188px] lg:w-[210px] xl:w-[230px] shrink-0 gap-2 overflow-y-auto scroll-smooth pr-0.5">

                            {/* My tile */}
                            {effectiveStageUser.socketId !== socketRef.current?.id && (
                                <div className="relative shrink-0 aspect-video bg-[#0e1016] rounded-xl overflow-hidden border border-white/8 hover:border-blue-500/40 shadow-md transition-all duration-200 cursor-pointer group">
                                    <Video stream={stream} userName="You" role={myRole} isLocal={true} userVideoStatus={!isVideoOff} />
                                    {handRaisedUsers.includes(userInfo._id) && (
                                        <div className="absolute top-1.5 right-1.5 bg-amber-500/80 backdrop-blur-sm rounded-md p-0.5 animate-in zoom-in text-[10px]">✋</div>
                                    )}
                                    <div className="absolute inset-0 ring-2 ring-inset ring-blue-500/0 group-hover:ring-blue-500/25 rounded-xl transition-all" />
                                </div>
                            )}

                            {/* Other participants */}
                            {uniquePeers.filter(p => p.peerID !== effectiveStageUser.socketId).map((peerObj, index) => {
                                const user = roomUsers.find(u => u.socketId === peerObj.peerID);
                                return (
                                    <div
                                        key={index}
                                        onClick={() => setPinnedSocketId(pinnedSocketId === peerObj.peerID ? null : peerObj.peerID)}
                                        className="relative shrink-0 aspect-video bg-[#0e1016] rounded-xl overflow-hidden border border-white/8 hover:border-blue-500/40 shadow-md transition-all duration-200 cursor-pointer group"
                                    >
                                        <Video
                                            stream={remoteStreams[peerObj.peerID]}
                                            userName={user?.userName || 'Participant'}
                                            role={user?.role}
                                            hasTurn={peerObj.userId === currentTurnUserId}
                                            isLocal={false}
                                            userVideoStatus={user?.videoStatus !== false}
                                        />
                                        {handRaisedUsers.includes(peerObj.userId) && (
                                            <div className="absolute top-1.5 right-1.5 bg-amber-500/80 backdrop-blur-sm rounded-md p-0.5 animate-in zoom-in text-[10px]">✋</div>
                                        )}
                                        {pinnedSocketId === peerObj.peerID && (
                                            <div className="absolute top-1.5 left-1.5 bg-blue-600/80 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                                                <Pin size={9} className="text-white" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 ring-2 ring-inset ring-blue-500/0 group-hover:ring-blue-500/25 rounded-xl transition-all" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden min-h-0">

                            {/* ─── Grid View Header ─── */}
                            <div className="shrink-0 px-3 sm:px-5 pt-3 pb-2 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <LayoutGrid size={14} />
                                        <span className="text-xs font-semibold text-gray-400">Gallery</span>
                                    </div>
                                    <div className="flex items-center justify-center w-5 h-5 rounded-md bg-white/8 border border-white/10">
                                        <span className="text-[9px] font-black text-gray-400 tabular-nums">{totalParticipantCount}</span>
                                    </div>
                                </div>
                                {/* Segmented size control */}
                                <div className="flex items-center p-0.5 rounded-lg bg-white/5 border border-white/8 gap-0.5">
                                    {[
                                        { key: 'auto', label: 'Auto' },
                                        { key: '1x1',  label: '1×1'  },
                                        { key: '2x2',  label: '2×2'  },
                                        { key: '3x3',  label: '3×3'  },
                                    ].map(({ key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => setGridSize(key)}
                                            className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition-all duration-150
                                                ${gridSize === key
                                                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50'
                                                    : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ─── Tile Grid ─── */}
                            <div className={`flex-1 min-h-0 grid gap-2 sm:gap-2.5 auto-rows-fr px-3 sm:px-5 pb-3 sm:pb-5
                                ${gridClassMap[gridSize] || gridClassMap.auto}
                                animate-in fade-in zoom-in-95 duration-400`}
                            >
                                {/* Local user tile */}
                                <div className={`relative min-h-0 rounded-2xl overflow-hidden transition-all duration-300 group
                                    bg-gradient-to-br from-[#0d1018] to-[#0b0d13]
                                    ${isHost
                                        ? 'shadow-[0_0_0_2px_rgba(59,130,246,0.45),0_8px_32px_rgba(0,0,0,0.5)]'
                                        : isCoHost
                                            ? 'shadow-[0_0_0_2px_rgba(16,185,129,0.45),0_8px_32px_rgba(0,0,0,0.5)]'
                                            : isMuted
                                                ? 'shadow-[0_0_0_1px_rgba(239,68,68,0.25),0_8px_32px_rgba(0,0,0,0.5)]'
                                                : 'shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_8px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_0_0_2px_rgba(59,130,246,0.3),0_8px_32px_rgba(0,0,0,0.5)]'
                                    }`}>
                                    <Video
                                        stream={stream}
                                        userName={`${userInfo.name} (You)`}
                                        role={myRole}
                                        isLocal={true}
                                        userVideoStatus={!isVideoOff}
                                    />
                                    {/* Top-left badges */}
                                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
                                        {isHost && (
                                            <span className="flex items-center gap-1 bg-blue-600/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest text-white border border-blue-400/25 shadow">
                                                Host
                                            </span>
                                        )}
                                        {isCoHost && (
                                            <span className="flex items-center gap-1 bg-emerald-600/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest text-white border border-emerald-400/25 shadow">
                                                Co-Host
                                            </span>
                                        )}
                                    </div>
                                    {/* Top-right indicators */}
                                    <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5 z-20">
                                        {isMuted && (
                                            <div className="flex items-center gap-1 bg-red-600/80 backdrop-blur-sm px-1.5 py-1 rounded-lg border border-red-400/25 shadow-lg">
                                                <MicOff size={10} className="text-white" />
                                            </div>
                                        )}
                                        {handRaisedUsers.includes(userInfo._id) && (
                                            <div className="bg-amber-500/85 backdrop-blur-sm rounded-lg px-2 py-1 border border-amber-400/30 shadow-lg animate-in zoom-in">
                                                <span className="text-sm leading-none">✋</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Remote participant tiles */}
                                {uniquePeers.map((peerObj, index) => {
                                    const user = roomUsers.find(u => u.socketId === peerObj.peerID);
                                    const isUserMuted = user?.micStatus === false;
                                    const isUserHost = user?.role === 'host';
                                    const isUserCoHost = user?.role === 'cohost';
                                    const hasTurn = peerObj.userId === currentTurnUserId;
                                    return (
                                        <div
                                            key={peerObj.peerID || index}
                                            className={`relative min-h-0 rounded-2xl overflow-hidden transition-all duration-300 group animate-in fade-in zoom-in-95 duration-400
                                                bg-gradient-to-br from-[#0d1018] to-[#0b0d13]
                                                ${isUserHost
                                                    ? 'shadow-[0_0_0_2px_rgba(59,130,246,0.45),0_8px_32px_rgba(0,0,0,0.5)]'
                                                    : isUserCoHost
                                                        ? 'shadow-[0_0_0_2px_rgba(16,185,129,0.45),0_8px_32px_rgba(0,0,0,0.5)]'
                                                        : hasTurn
                                                            ? 'shadow-[0_0_0_2px_rgba(245,158,11,0.5),0_8px_32px_rgba(0,0,0,0.5)]'
                                                            : isUserMuted
                                                                ? 'shadow-[0_0_0_1px_rgba(239,68,68,0.2),0_8px_32px_rgba(0,0,0,0.5)]'
                                                                : 'shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_8px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_0_0_2px_rgba(59,130,246,0.3),0_8px_32px_rgba(0,0,0,0.5)]'
                                                }`}
                                        >
                                            <Video
                                                stream={remoteStreams[peerObj.peerID]}
                                                userName={user?.userName || 'Participant'}
                                                role={user?.role}
                                                hasTurn={hasTurn}
                                                isLocal={false}
                                                userVideoStatus={user?.videoStatus !== false}
                                            />
                                            {/* Top-left badges */}
                                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
                                                {isUserHost && (
                                                    <span className="bg-blue-600/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest text-white border border-blue-400/25 shadow">
                                                        Host
                                                    </span>
                                                )}
                                                {isUserCoHost && (
                                                    <span className="bg-emerald-600/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest text-white border border-emerald-400/25 shadow">
                                                        Co-Host
                                                    </span>
                                                )}
                                                {hasTurn && (
                                                    <span className="bg-amber-500/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest text-amber-100 border border-amber-400/30 shadow">
                                                        Speaking
                                                    </span>
                                                )}
                                            </div>
                                            {/* Top-right indicators */}
                                            <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5 z-20">
                                                {isUserMuted && (
                                                    <div className="flex items-center gap-1 bg-red-600/80 backdrop-blur-sm px-1.5 py-1 rounded-lg border border-red-400/25 shadow-lg">
                                                        <MicOff size={10} className="text-white" />
                                                    </div>
                                                )}
                                                {handRaisedUsers.includes(peerObj.userId) && (
                                                    <div className="bg-amber-500/85 backdrop-blur-sm rounded-lg px-2 py-1 border border-amber-400/30 shadow-lg animate-in zoom-in">
                                                        <span className="text-sm leading-none">✋</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar (Chat/Members) */}
                {(showChat || showParticipants) && (
                    <aside className={`absolute inset-y-0 right-0 w-full xs:w-[320px] z-50 md:static md:w-[280px] lg:w-[320px] shrink-0 h-full bg-[#0d0f15] border-l border-white/6 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.6)] animate-in slide-in-from-right duration-300`}>
                        {/* Sidebar Header — Zoom style */}
                        {showParticipants && (
                            <div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-white/6">
                                <h2 className="text-sm font-semibold text-white">
                                    {t('ctl_people')} <span className="text-gray-500 font-medium">({roomUsers.length})</span>
                                </h2>
                                <button
                                    onClick={() => setShowParticipants(false)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
                                    title={t('chat_close')}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {showParticipants && (
                            <div className="flex-1 flex flex-col min-h-0 px-4 pt-3">
                                {/* Share Requests (Host/Co-host Only) */}
                                {canModerate && shareRequests.length > 0 && (
                                    <div className="space-y-2 mb-6">
                                        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-2">Share Requests</h3>
                                        {shareRequests.map((req, idx) => (
                                            <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black text-amber-200 truncate">{req.userName}</p>
                                                    <p className="text-[9px] text-amber-500 font-bold uppercase">Wants to share {req.type}</p>
                                                </div>
                                                <div className="flex space-x-1 ml-2">
                                                    <button onClick={() => respondToShareRequest(req.userId, true, req.type)} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" /></svg></button>
                                                    <button onClick={() => respondToShareRequest(req.userId, false, req.type)} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="mb-3 relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder={t('find_participant')} 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-[11px] font-bold text-white focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-gray-600"
                                    />
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-1.5 pb-4 pr-0.5 custom-scrollbar">
                                    {[...roomUsers]
                                        .sort((a, b) => Number(handRaisedUsers.includes(b.userId)) - Number(handRaisedUsers.includes(a.userId)))
                                        .filter(u => u.userName.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((user, idx) => {
                                            const isMe = String(user.userId) === String(userInfo._id);
                                            const isSpotlit = user.userId === currentTurnUserId;
                                            const userInitials = user.userName.split(' ').filter(w => /^[a-zA-Z\u0400-\u04FF]/.test(w)).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
                                            const avatarColors = ['from-blue-500 to-blue-700','from-violet-500 to-purple-700','from-emerald-500 to-teal-700','from-amber-500 to-orange-700','from-rose-500 to-pink-700','from-cyan-500 to-blue-700','from-indigo-500 to-violet-700','from-fuchsia-500 to-pink-700'];
                                            let hash = 0; for (let i = 0; i < user.userName.length; i++) hash = user.userName.charCodeAt(i) + ((hash << 5) - hash);
                                            const avatarGrad = avatarColors[Math.abs(hash) % avatarColors.length];
                                            return (
                                            <div key={idx} className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl border transition-all duration-200 cursor-default
                                                ${isSpotlit ? 'bg-blue-500/10 border-blue-500/25 shadow-[0_0_12px_rgba(59,130,246,0.08)]'
                                                : 'bg-white/4 border-white/5 hover:bg-white/8 hover:border-white/10'}`}>
                                                {/* Avatar */}
                                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-[11px] font-black text-white shadow-md shrink-0 select-none`}>
                                                    {userInitials}
                                                </div>
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="text-[12px] font-semibold text-white/90 truncate">{user.userName}</span>
                                                        {isMe && <span className="shrink-0 text-[9px] text-gray-500 font-medium">{t('you_label')}</span>}
                                                        {handRaisedUsers.includes(user.userId) && <span className="shrink-0 text-[11px]">✋</span>}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        {user.role === 'host' ? <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">{t('role_host')}</span>
                                                        : user.role === 'cohost' ? <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">{t('role_cohost')}</span>
                                                        : user.role === 'guest' ? <span className="text-[9px] font-medium text-gray-500 italic">{t('role_guest')}</span>
                                                        : <span className="text-[9px] font-medium text-gray-500 uppercase tracking-wide">{t('role_participant')}</span>}
                                                    </div>
                                                </div>
                                                {/* Media status + actions */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {user.micStatus
                                                        ? <div className="p-1 rounded-lg bg-emerald-500/10"><Mic size={11} className="text-emerald-400" /></div>
                                                        : <div className="p-1 rounded-lg bg-red-500/10"><MicOff size={11} className="text-red-400" /></div>}
                                                    {user.videoStatus
                                                        ? <div className="p-1 rounded-lg bg-emerald-500/10"><VideoIcon size={11} className="text-emerald-400" /></div>
                                                        : <div className="p-1 rounded-lg bg-gray-500/10"><VideoOff size={11} className="text-gray-500" /></div>}
                                                    {canModerate && !isMe && (
                                                        <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                            <button onClick={() => giveTurn(user.userId)} title={isSpotlit ? 'Remove Spotlight' : 'Spotlight'} className={`p-1.5 rounded-lg transition-all ${isSpotlit ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-gray-500 hover:text-white'}`}>
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z" strokeWidth="2.5" strokeLinejoin="round" /></svg>
                                                            </button>
                                                            {isHost && (
                                                                user.role === 'cohost'
                                                                    ? <button onClick={() => demoteCoHost(user.userId, user.socketId)} title="Demote" className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-blue-400 transition-all"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg></button>
                                                                    : user.role === 'participant' && <button onClick={() => promoteCoHost(user.userId, user.socketId)} title="Promote Co-host" className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-emerald-400 transition-all"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg></button>
                                                            )}
                                                            <button onClick={() => kickUser(user.socketId)} title="Kick" className="p-1.5 hover:bg-amber-500/10 rounded-lg text-gray-500 hover:text-amber-400 transition-all"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                                                            <button onClick={() => blockUser(user.userId, user.socketId)} title="Block" className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" strokeWidth="2" /></svg></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );})}
                                </div>
                                {canModerate && (
                                    <div className="pb-4 pt-3 border-t border-white/5">
                                        <button
                                            onClick={muteAll}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-red-500/15 text-gray-300 hover:text-red-400 text-xs font-bold rounded-xl transition-colors duration-200"
                                        >
                                            <MicOff size={13} />
                                            {t('mute_everyone')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {showChat && (
                            <ChatPanel
                                messages={messages}
                                newMessage={newMessage}
                                setNewMessage={setNewMessage}
                                sendMessage={sendMessage}
                                editingMessageId={editingMessageId}
                                setEditingMessageId={setEditingMessageId}
                                handleFileUpload={handleFileUpload}
                                deleteChatMessage={deleteChatMessage}
                                startEditingMessage={startEditingMessage}
                                onClose={() => setShowChat(false)}
                                roomUsers={roomUsers}
                                currentUserName={userInfo.name}
                                canChat={canChat}
                                meetingTitle={meeting?.title}
                            />
                        )}
                    </aside>
                )}
            </div>
            {/* Bottom Controls */}
            <RoomBottomControls
                roomID={roomID}
                copied={copied}
                setCopied={setCopied}
                myRole={myRole}
                isMuted={isMuted}
                toggleMute={toggleMute}
                isVideoOff={isVideoOff}
                toggleVideo={toggleVideo}
                isSharingScreen={isSharingScreen}
                stopScreenShare={stopScreenShare}
                toggleScreenShare={toggleScreenShare}
                showShareMenu={showShareMenu}
                setShowShareMenu={setShowShareMenu}
                canRecord={canRecord}
                isRecording={isRecording}
                startRecording={startRecording}
                stopRecording={stopRecording}
                raiseHand={raiseHand}
                showSettings={showSettings}
                setShowSettings={setShowSettings}
                showChat={showChat}
                setShowChat={setShowChat}
                showParticipants={showParticipants}
                setShowParticipants={setShowParticipants}
                unreadMessages={unreadMessages}
                waitingBadge={waitingBadge}
                roomUsers={roomUsers}
                leaveRoom={leaveRoom}
                endMeetingForAll={endMeetingForAll}
                isHost={isHost}
                onHoldToTalkStart={handleHoldToTalkStart}
                onHoldToTalkEnd={handleHoldToTalkEnd}
                mobileMenuOpen={mobileToolsOpen}
                setMobileMenuOpen={setMobileToolsOpen}
            />

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg p-8 shadow-2xl relative">
                        <button onClick={() => setShowSettings(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Qurilma sozlamalari</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-8">Kamera va mikrofonni sozlang</p>
                        <div className="space-y-6">
                            <div>
                                <Select
                                    label="Kamera"
                                    value={selectedVideoDevice}
                                    onChange={switchCamera}
                                    options={videoDevices.map(d => ({ value: d.deviceId, label: d.label || `Kamera ${d.deviceId.slice(0, 5)}` }))}
                                    placeholder="Kamera tanlang..."
                                />
                            </div>
                            <div>
                                <Select
                                    label="Mikrofon"
                                    value={selectedAudioDevice}
                                    onChange={switchAudio}
                                    options={audioDevices.map(d => ({ value: d.deviceId, label: d.label || `Mikrofon ${d.deviceId.slice(0, 5)}` }))}
                                    placeholder="Mikrofon tanlang..."
                                />
                            </div>
                        </div>
                        {/* Password change section — host only, private rooms */}
                        {isHost && meeting?.roomType === 'private' && (
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                    <Lock size={14} className="text-purple-500" />
                                    {lang === 'uz' ? 'Xona paroli' : lang === 'ru' ? 'Пароль комнаты' : 'Room Password'}
                                </h3>
                                <div className="space-y-3">
                                    <input
                                        type="password"
                                        placeholder={lang === 'uz' ? 'Joriy parol' : lang === 'ru' ? 'Текущий пароль' : 'Current password'}
                                        value={changePwOld}
                                        onChange={e => setChangePwOld(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                    />
                                    <input
                                        type="password"
                                        placeholder={lang === 'uz' ? 'Yangi parol (kamida 6 ta belgi)' : lang === 'ru' ? 'Новый пароль (мин. 6 символов)' : 'New password (min. 6 chars)'}
                                        value={changePwNew}
                                        onChange={e => setChangePwNew(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                    />
                                    <button
                                        disabled={!changePwOld || !changePwNew || changePwNew.length < 6 || changePwLoading}
                                        onClick={async () => {
                                            setChangePwLoading(true);
                                            try {
                                                await API.put(`/api/meetings/${meeting._id}/password`, {
                                                    oldPassword: changePwOld,
                                                    newPassword: changePwNew
                                                });
                                                toast.success(lang === 'uz' ? 'Parol yangilandi!' : lang === 'ru' ? 'Пароль обновлён!' : 'Password updated!');
                                                setChangePwOld('');
                                                setChangePwNew('');
                                                setShowSettings(false);
                                            } catch (err) {
                                                toast.error(err.response?.data?.message || t('action_failed'));
                                            } finally {
                                                setChangePwLoading(false);
                                            }
                                        }}
                                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
                                    >
                                        {changePwLoading
                                            ? (lang === 'uz' ? 'Saqlanmoqda...' : lang === 'ru' ? 'Сохранение...' : 'Saving...')
                                            : (lang === 'uz' ? 'Parolni yangilash' : lang === 'ru' ? 'Обновить пароль' : 'Update Password')}
                                    </button>
                                </div>
                            </div>
                        )}

                        <button onClick={() => setShowSettings(false)}
                            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                            Saqlash
                        </button>
                    </div>
                </div>
            )}
            {confirmModal}
        </div>
    );
};

export default RoomPage;

