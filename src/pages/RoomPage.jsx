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
    const [showChat, setShowChat] = useState(true);
    const [showParticipants, setShowParticipants] = useState(false);
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
                socket.emit('join-room', roomID, userInfo._id, userInfo.name, true);
                return;
            }

            try {
                const currentStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
                });
                
                // Mute and hide video by default for all users when entering the room
                currentStream.getAudioTracks().forEach(t => t.enabled = false);
                currentStream.getVideoTracks().forEach(t => t.enabled = false);

                setStream(currentStream);
                streamRef.current = currentStream;
                if (userVideo.current) userVideo.current.srcObject = currentStream;

                socket.emit('join-room', roomID, userInfo._id, userInfo.name, false);

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
                socket.emit('join-room', roomID, userInfo._id, userInfo.name, isGuest);
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
            const constraints = { 
                video: { deviceId: { exact: deviceId } }, 
                audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true 
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
                audio: { deviceId: { exact: deviceId } } 
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

    const toggleScreenShare = (type = 'screen') => {
        // Allow all users to share screen directly without request
        if (isSharingScreen) {
            stopScreenShare();
        } else {
            startScreenShare(type);
        }
    };

    const startScreenShare = (type) => {
        if (isSharingScreenRef.current) return;
        const socket = socketRef.current;
        if (!socket) return;

        const constraints = {
            video: type === 'audio' ? false : {
                cursor: 'always'
            },
            audio: type === 'screen' ? false : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                suppressLocalAudioPlayback: false
            }
        };

        navigator.mediaDevices.getDisplayMedia(constraints).then(screenStream => {
            const screenVideoTrack = screenStream.getVideoTracks()[0];
            const screenAudioTrack = screenStream.getAudioTracks()[0];
            const micTrack = streamRef.current?.getAudioTracks()[0];
            screenStreamRef.current = screenStream;

            let finalTracks = [];
            if (screenVideoTrack) finalTracks.push(screenVideoTrack);

            if (screenAudioTrack && micTrack) {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const micSource = audioCtx.createMediaStreamSource(new MediaStream([micTrack]));
                const screenSource = audioCtx.createMediaStreamSource(new MediaStream([screenAudioTrack]));
                const destination = audioCtx.createMediaStreamDestination();
                const micGain = audioCtx.createGain();
                const screenGain = audioCtx.createGain();
                micGain.gain.value = 1.0;
                screenGain.gain.value = 0.8;
                micSource.connect(micGain).connect(destination);
                screenSource.connect(screenGain).connect(destination);
                audioContextRef.current = audioCtx;
                audioDestinationRef.current = destination;
                finalTracks.push(destination.stream.getAudioTracks()[0]);
            } else if (screenAudioTrack) {
                finalTracks.push(screenAudioTrack);
            } else if (micTrack) {
                finalTracks.push(micTrack);
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
            console.error("Error sharing screen:", err);
            setIsWaitingForPermission(false);
            setRequestPending(false);
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

        // Find the host in the room
        const hostId = meeting.hostId?._id || meeting.hostId;
        const host = roomUsers.find(u => String(u.userId) === String(hostId));
        // If I am the host, no stage user (I am the broadcaster)
        if (host && String(host.userId) !== String(userInfo._id)) {
            return { socketId: host.socketId, userId: host.userId, userName: host.userName, role: 'host', isHost: true };
        }
        // Co-host as stage if host is myself (co-host is presenting)
        if (isHost) {
            const cohost = roomUsers.find(u => u.role === 'cohost');
            if (cohost && String(cohost.userId) !== String(userInfo._id)) {
                return { socketId: cohost.socketId, userId: cohost.userId, userName: cohost.userName, role: 'cohost' };
            }
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
    const totalParticipantCount = roomUsers.length || peers.length + 1;
    const autoGridClass = totalParticipantCount <= 2
        ? 'grid-cols-1 sm:grid-cols-2'
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
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-center mb-6">
                        <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-3xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Lock className="w-7 h-7" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                        Himoyalangan Xona
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
                        Bu xonaga kirish uchun parol talab qilinadi. Parolni kiriting.
                    </p>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (passwordInput.trim()) {
                            const fetchMeeting = async (password = null) => {
                                try {
                                    const config = password ? { params: { password } } : {};
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
                            fetchMeeting(passwordInput);
                        }
                    }} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Parolni kiriting"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            autoFocus
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                            type="submit"
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all"
                        >
                            Kirish
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            Bekor qilish
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-[#0c0e14] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors">
            <div className="fixed top-20 right-4 z-[70] flex flex-col gap-3">
                {waitingToasts.map((waiter) => (
                    <div key={waiter.socketId} className="w-[320px] rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-white/95 dark:bg-[#171a22]/95 shadow-2xl p-4 backdrop-blur-xl">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold text-white">
                                {(waiter.userName || '?').slice(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{waiter.userName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Waiting roomga qo'shilishni so'rayapti</p>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button onClick={() => admitUser(waiter.socketId)} className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Qabul qilish</button>
                            <button onClick={() => denyUser(waiter.socketId)} className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">Rad etish</button>
                        </div>
                    </div>
                ))}
            </div>
            {toastMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
                    <div className="bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
                        <span className="text-sm font-medium">{toastMessage}</span>
                    </div>
                </div>
            )}
            
            {/* Top Bar */}
            <header className="h-14 flex justify-between items-center px-4 md:px-6 bg-white dark:bg-[#13161e]/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/6 z-40 shadow-sm transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex items-center bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/20 shrink-0">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Jonli seans</span>
                    </div>
                    <h1 className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight truncate">{meeting?.title || 'Xona tayyorlanmoqda...'}</h1>
                    <div className="hidden md:flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-1.5">
                        <Clock size={13} className="text-blue-500" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{meetingElapsed}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-1.5">
                        <Users size={13} className="text-blue-500" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{totalParticipantCount}</span>
                    </div>
                    {myRole && (
                        <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${myRole === 'host' ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-500/15 dark:border-blue-500/40 dark:text-blue-400' :
                                myRole === 'cohost' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-400' :
                                    myRole === 'guest' ? 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-500/15 dark:border-gray-500/40 dark:text-gray-400' :
                                        'bg-gray-100 border-gray-200 text-gray-600 dark:bg-white/5 dark:border-white/15 dark:text-gray-400'
                            }`}>
                            {myRole}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 md:gap-6 shrink-0">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Xavfsizlik</span>
                        <div className="flex items-center gap-1">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-500">Shifrlangan</span>
                        </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Network</span>
                        <div className={`flex items-center gap-1 ${networkInfo.tone}`}>
                            <Wifi size={12} />
                            <span className="text-[10px] font-semibold">{networkInfo.label} · {networkInfo.ping}ms</span>
                        </div>
                    </div>
                    <div className="relative group">
                        <button
                            className={`flex flex-col items-center p-2.5 rounded-xl transition-all ${
                                isSharingScreen
                                    ? 'bg-blue-600 text-white'
                                    : requestPending
                                        ? 'bg-amber-100 dark:bg-amber-600/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <div className="relative">
                                {isSharingScreen ? <MonitorOff size={18} /> : <MonitorUp size={18} />}
                                {requestPending && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>}
                            </div>
                            <span className="text-[9px] font-semibold mt-0.5">
                                {isSharingScreen ? 'Ulashilmoqda' : requestPending ? 'Kutilmoqda' : 'Ulashish'}
                            </span>
                        </button>
                        {!isSharingScreen && !requestPending && (
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-white/10 rounded-2xl p-2 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                                <button onClick={() => toggleScreenShare('screen')} className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-left transition text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                    <Monitor size={14} className="text-blue-500" />
                                    <span className="text-xs font-semibold">Faqat ekran</span>
                                </button>
                                <button onClick={() => toggleScreenShare('audio')} className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-left transition text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                    <Volume2 size={14} className="text-emerald-500" />
                                    <span className="text-xs font-semibold">Faqat audio</span>
                                </button>
                                <button onClick={() => toggleScreenShare('both')} className="w-full flex items-center gap-3 p-2.5 bg-blue-50 dark:bg-blue-600/10 hover:bg-blue-100 dark:hover:bg-blue-600/20 rounded-xl text-left transition text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                                    <MonitorUp size={14} />
                                    <span className="text-xs font-semibold">Ekran + Audio</span>
                                </button>
                            </div>
                        )}
                        {isSharingScreen && (
                            <button onClick={stopScreenShare} className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-40 bg-red-600 text-white py-2.5 rounded-xl text-xs font-semibold shadow-xl opacity-0 group-hover:opacity-100 transition-all">
                                To'xtatish
                            </button>
                        )}
                    </div>
                    <button onClick={() => { setShowChat(!showChat); setShowParticipants(false); }} className="lg:hidden p-2 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">
                        <MoreVertical size={18} />
                    </button>
                    <div className="hidden md:flex items-center gap-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-1">
                        <button onClick={() => setViewMode('speaker')} className={`rounded-lg px-2.5 py-1.5 ${viewMode === 'speaker' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                            <Presentation size={14} />
                        </button>
                        <button onClick={() => setViewMode('grid')} className={`rounded-lg px-2.5 py-1.5 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                            <LayoutGrid size={14} />
                        </button>
                    </div>
                    <LanguageToggle compact />
                </div>
            </header>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 flex flex-col p-4 relative z-10">
                    {stageUser && viewMode === 'speaker' ? (
                    <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden animate-in fade-in duration-500">
                        {/* Primary Stage: Remote stream (Host or screen sharer) */}
                        <div className="flex-[4] relative bg-[#15181e] rounded-2xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center">
                            {stageUser.socketId === socketRef.current?.id ? (
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
                                        const stream = remoteStreams[stageUser.socketId];
                                        return stream ? (
                                            <Video
                                                key={`${stageUser.socketId}-${activeSharingUser ? 'sharing' : 'normal'}`}
                                                stream={stream}
                                                userName={stageUser.userName}
                                                role={stageUser.role || (stageUser.isHost ? 'host' : 'participant')}
                                                isStage={true}
                                                isLocal={false}
                                                userVideoStatus={stageUser.videoStatus !== false}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center animate-pulse">
                                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                                <p className="text-xs text-gray-500 font-medium tracking-wide">Syncing Stream...</p>
                                            </div>
                                        );
                                    })()
                                )}
                                <div className="absolute top-6 left-6 flex items-center space-x-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                        {activeSharingUser ? `${stageUser.userName}'S SCREEN` : `PRESENTER: ${stageUser.userName}`}
                                    </span>
                                </div>
                            </div>                            {/* Sidebar Thumbnails */}
                            <div className="flex-1 lg:max-w-[240px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                {stageUser.socketId !== socketRef.current?.id && (
                                    <div className="relative aspect-video bg-[#1a1d23] rounded-xl overflow-hidden border border-white/5 shadow-md hover:border-blue-500/30 transition-colors">
                                        <Video 
                                            stream={stream} 
                                            userName="You" 
                                            role={myRole} 
                                            isLocal={true} 
                                            userVideoStatus={!isVideoOff} 
                                        />
                                        {handRaisedUsers.includes(userInfo._id) && (
                                            <div className="absolute top-2 right-2 bg-blue-600/80 backdrop-blur-sm rounded-lg p-1.5 shadow-lg border border-white/10 animate-in zoom-in">
                                                <span className="text-[12px]">✋</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {peers.filter(p => p.peerID !== stageUser.socketId).map((peerObj, index) => {
                                    const user = roomUsers.find(u => u.socketId === peerObj.peerID);
                                    return (
                                        <div key={index} className="relative aspect-video bg-[#1a1d23] rounded-xl overflow-hidden border border-white/5 shadow-md hover:border-blue-500/30 transition-colors">
                                            <Video
                                                stream={remoteStreams[peerObj.peerID]}
                                                userName={user?.userName || 'Participant'}
                                                role={user?.role}
                                                hasTurn={peerObj.userId === currentTurnUserId}
                                                isLocal={false}
                                                userVideoStatus={user?.videoStatus !== false}
                                            />
                                            {handRaisedUsers.includes(peerObj.userId) && (
                                                <div className="absolute top-2 right-2 bg-blue-600/80 backdrop-blur-sm rounded-lg p-1.5 shadow-lg border border-white/10 animate-in zoom-in">
                                                    <span className="text-[12px]">✋</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 p-2 md:p-4 overflow-y-auto custom-scrollbar flex flex-col">
                            {/* Grid View — Adaptive for mobile/desktop */}
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
                                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    <LayoutGrid size={14} />
                                    <span>Grid view</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {['auto', '1x1', '2x2', '3x3'].map((size) => (
                                        <button key={size} onClick={() => setGridSize(size)} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${gridSize === size ? 'bg-blue-600 text-white' : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300'}`}>
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={`grid gap-2 sm:gap-3 w-full my-auto max-w-7xl mx-auto ${gridClassMap[gridSize] || gridClassMap.auto} animate-in fade-in zoom-in-95 duration-500 pb-20 sm:pb-10`}>

                                {/* Local user tile */}
                                <div className={`relative bg-[#0b0d11] rounded-2xl overflow-hidden shadow-xl border transition-all duration-500
                                    ${isHost ? 'border-blue-500/40 ring-1 ring-blue-500/20'
                                    : isCoHost ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                                    : 'border-white/8 hover:border-white/20'}
                                    min-h-[160px] aspect-video w-full`}>
                                    <Video
                                        stream={stream}
                                        userName={`${userInfo.name} (You)`}
                                        role={myRole}
                                        isLocal={true}
                                        userVideoStatus={!isVideoOff}
                                    />
                                    {handRaisedUsers.includes(userInfo._id) && (
                                        <div className="absolute top-2 right-2 bg-blue-600/80 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-white/10 animate-in zoom-in">
                                            <span className="text-[16px]">✋</span>
                                        </div>
                                    )}
                                </div>

                                {/* Remote participant tiles */}
                                {peers.map((peerObj, index) => {
                                    const user = roomUsers.find(u => u.socketId === peerObj.peerID);
                                    return (
                                        <div key={peerObj.peerID || index} className="relative min-h-[160px] aspect-video w-full bg-[#0b0d11] rounded-2xl overflow-hidden shadow-xl border border-white/8 hover:border-white/20 transition-all duration-300 animate-in fade-in zoom-in-95 duration-500">
                                            <Video
                                                stream={remoteStreams[peerObj.peerID]}
                                                userName={user?.userName || 'Participant'}
                                                role={user?.role}
                                                hasTurn={peerObj.userId === currentTurnUserId}
                                                isLocal={false}
                                                userVideoStatus={user?.videoStatus !== false}
                                            />
                                            {handRaisedUsers.includes(peerObj.userId) && (
                                                <div className="absolute top-2 right-2 bg-blue-600/80 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-white/10 animate-in zoom-in">
                                                    <span className="text-[16px]">✋</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar (Chat/Members) */}
                {(showChat || showParticipants) && (
                    <aside className={`absolute inset-y-0 right-0 w-full z-50 lg:static lg:w-[360px] shrink-0 h-full bg-[#0b0d11]/95 lg:bg-[#12141a]/40 backdrop-blur-3xl border-l border-white/5 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-500`}>
                        <div className="flex items-center justify-between p-5 border-b border-white/5 lg:hidden bg-white/5">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Control Panel</span>
                            <button onClick={() => { setShowChat(false); setShowParticipants(false); }} className="p-2 bg-white/5 rounded-full text-gray-400 active:scale-90 transition-transform">✕</button>
                        </div>
                        <div className="flex p-1.5 bg-black/30 m-4 rounded-2xl border border-white/8 shadow-inner">
                            <button onClick={() => { setShowChat(true); setShowParticipants(false); }} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] rounded-xl transition-all duration-200 ${showChat ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>Chat</button>
                            <button onClick={() => { setShowChat(false); setShowParticipants(true); }} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] rounded-xl transition-all duration-200 ${showParticipants ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>People</button>
                        </div>

                        {showParticipants && (
                            <div className="flex-1 flex flex-col min-h-0 px-4">
                                {/* Waiting Room (Host/Co-host Only) */}
                                {canModerate && waitingRoomUsers.length > 0 && (
                                    <div className="space-y-2 mb-6">
                                        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2">Waiting Room ({waitingRoomUsers.length})</h3>
                                        {waitingRoomUsers.map((waiter, idx) => (
                                            <div key={idx} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-black text-blue-200 truncate">{waiter.userName}</p>
                                                    <p className="text-[9px] text-blue-500 font-bold uppercase">{waiter.isGuest ? 'Guest' : 'Participant'}</p>
                                                </div>
                                                <div className="flex space-x-1 ml-2">
                                                    <button onClick={() => admitUser(waiter.socketId)} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" /></svg></button>
                                                    <button onClick={() => denyUser(waiter.socketId)} className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

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
                                <div className="flex items-center justify-between mt-2 mb-3 px-1">
                                    <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Participants ({roomUsers.length})</h3>
                                </div>
                                <div className="mb-4 relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Find participant..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-[11px] font-bold text-white focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-gray-600"
                                    />
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-2.5 pb-6 pr-1 custom-scrollbar">
                                    {[...roomUsers]
                                        .sort((a, b) => Number(handRaisedUsers.includes(b.userId)) - Number(handRaisedUsers.includes(a.userId)))
                                        .filter(u => u.userName.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((user, idx) => (
                                        <div key={idx} className={`group flex items-center p-3 rounded-2xl border transition-all duration-300 ${user.userId === currentTurnUserId ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}>
                                            <div className="w-9 h-9 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center text-[11px] font-black text-blue-400 border border-white/10 shadow-lg mr-3 shrink-0">
                                                {user.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="text-[11px] font-bold text-slate-200 truncate flex items-center">
                                                    {user.userName} {String(user.userId) === String(userInfo._id) && <span className="ml-1.5 text-[9px] text-gray-500 font-medium">(You)</span>}
                                                </div>
                                                <div className="text-[9px] text-gray-500 font-black uppercase tracking-tighter mt-0.5 opacity-60">
                                                    {user.role === 'host' ? (
                                                        <span className="text-blue-400">Host</span>
                                                    ) : user.role === 'cohost' ? (
                                                        <span className="text-emerald-400">Co-host</span>
                                                    ) : user.role === 'guest' ? (
                                                        <span className="text-gray-500 italic">Guest</span>
                                                    ) : 'Participant'}
                                                </div>
                                            </div>
                                            <div className="flex items-center shrink-0">
                                                <div className="mr-2 flex items-center gap-1.5">
                                                    {user.micStatus ? <Mic size={12} className="text-emerald-400" /> : <MicOff size={12} className="text-red-400" />}
                                                    {user.videoStatus ? <VideoIcon size={12} className="text-emerald-400" /> : <VideoOff size={12} className="text-red-400" />}
                                                </div>
                                                {canModerate && String(user.userId) !== String(userInfo._id) && (
                                                    <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => giveTurn(user.userId)} title={currentTurnUserId === user.userId ? 'Remove Spotlight' : 'Spotlight'} className={`p-1.5 rounded-lg transition-all ${currentTurnUserId === user.userId ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10 text-gray-500 hover:text-white'}`}>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 3l14 9-14 9V3z" strokeWidth="2" strokeLinejoin="round" /></svg>
                                                        </button>
                                                        {isHost && (
                                                            user.role === 'cohost' ? (
                                                                <button onClick={() => demoteCoHost(user.userId, user.socketId)} title="Demote Co-host" className="p-1.5 hover:bg-blue-500/20 rounded-lg text-gray-500 hover:text-blue-500 transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg></button>
                                                            ) : user.role === 'participant' && (
                                                                <button onClick={() => promoteCoHost(user.userId, user.socketId)} title="Promote to Co-host" className="p-1.5 hover:bg-emerald-500/20 rounded-lg text-gray-500 hover:text-emerald-500 transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg></button>
                                                            )
                                                        )}
                                                        <button onClick={() => kickUser(user.socketId)} title="Kick" className="p-1.5 hover:bg-yellow-500/20 rounded-lg text-gray-500 hover:text-yellow-500 transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg></button>
                                                        <button onClick={() => blockUser(user.userId, user.socketId)} title="Block" className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-500 transition-all"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {canModerate && (
                                    <div className="py-4 border-t border-white/5 flex gap-2">
                                        <button onClick={muteAll} className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-red-500/20 transition">Mute All</button>
                                        {isHost && <button onClick={endMeetingForAll} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition shadow-xl shadow-red-900/40">Close Room</button>}
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

