import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import API from '../api';
import Video from '../components/Video';

const RoomPage = () => {
    const { id: roomID } = useParams();
    const navigate = useNavigate();

    const userInfo = useMemo(() => {
        const saved = localStorage.getItem('userInfo');
        if (saved) return JSON.parse(saved);
        const guestId = 'guest-' + Math.random().toString(36).substr(2, 9);
        return { name: 'Guest', _id: guestId };
    }, []);

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
    const [isInWaitingRoom, setIsInWaitingRoom] = useState(false);
    const [waitingRoomDenied, setWaitingRoomDenied] = useState(false);

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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
        if (showChat) setUnreadMessages(0);
    }, [messages, showChat]);

    useEffect(() => {
        // Create socket on mount — avoid module-level singleton
        const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005');
        socketRef.current = socket;

        // Clear old state before joining new room
        setMessages([]);
        setPeers([]);
        setShareRequests([]);
        setIsShareApproved(false);
        setRequestPending(false);

        const fetchMeeting = async () => {
            try {
                const { data } = await API.get(`/api/meetings/${roomID}`);
                setMeeting(data);
            } catch (error) {
                alert('Meeting not found');
                navigate('/');
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

        socket.on('user-hand-raised', (userId) => {
            setHandRaisedUsers((prev) => [...prev, userId]);
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
                alert(`Host denied your request to share ${type}.`);
            }
        });

        // FIX: use isSharingScreenRef (not state) to avoid stale closure
        socket.on('force-stop-share', () => {
            if (isSharingScreenRef.current) {
                stopScreenShareFn(screenStreamRef, audioContextRef, audioDestinationRef, peersRef, streamRef, socket, roomID, setActiveSharingUser, setIsSharingScreen, setIsShareApproved, setIsWaitingForPermission, isSharingScreenRef);
                alert('Host has stopped your screen sharing.');
            }
        });

        socket.on('user-disconnected', (userId) => {
            const peerObj = peersRef.current.find(p => p.peerID === userId);
            if (peerObj) peerObj.peer.destroy();
            const peers = peersRef.current.filter(p => p.peerID !== userId);
            peersRef.current = peers;
            setPeers(peers);
        });

        socket.on('kicked', () => { alert('You have been removed from the meeting.'); navigate('/'); });
        socket.on('blocked', () => { alert('You have been permanently blocked from this meeting.'); navigate('/'); });
        socket.on('error-message', (msg) => { alert(msg); navigate('/'); });

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
            setWaitingRoomUsers(list || []);
        });

        socket.on('room-muted-all', () => {
            if (streamRef.current?.getAudioTracks()[0]?.enabled) {
                streamRef.current.getAudioTracks()[0].enabled = false;
                setIsMuted(true);
                socket.emit('update-media-status', { roomId: roomID, micStatus: false });
            }
        });

        socket.on('meeting-ended', () => {
            alert('Host has ended the meeting for everyone.');
            navigate('/');
        });

        socket.on('all-users', (users) => {
            const newPeers = [];
            // To'liq ro'yxat kelganda eskisini tozalab tashlash (dublikat oldini oladi)
            peersRef.current.forEach(p => p.peer && p.peer.destroy());
            peersRef.current = [];
            
            users.forEach((u) => {
                const peer = createPeer(u.socketId, socket.id, streamRef.current, userInfo._id, socket);
                peersRef.current.push({ peerID: u.socketId, userId: u.userId, peer });
                newPeers.push({ peerID: u.socketId, userId: u.userId, peer });
            });
            setPeers(newPeers);
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
        if (!canRecord) return alert('Only the meeting host can record the meeting.');
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
            };

            displayStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
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

    const checkGuestAction = () => {
        if (myRole === 'guest') {
            if (window.confirm('Guests cannot perform this action. Would you like to log in or register?')) {
                localStorage.removeItem('userInfo');
                navigate('/login');
                window.location.reload();
            }
            return true;
        }
        return false;
    };

    const handleFileUpload = (e) => {
        if (checkGuestAction()) return;
        const file = e.target.files[0];
        if (!file) return;

        const confirmSend = window.confirm(`Do you want to send the file: "${file.name}"?`);
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

    const sendMessage = (e) => {
        e.preventDefault();
        if (checkGuestAction()) return;
        if (!canChat) return alert('Chat is disabled for this room.');
        
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

    const deleteChatMessage = (msgId) => {
        if (window.confirm("Are you sure you want to delete this message?")) {
            socketRef.current?.emit('delete-chat-message', { roomId: roomID, messageId: msgId, userId: userInfo._id });
        }
    };
    
    const startEditingMessage = (msgId, text) => {
        setEditingMessageId(msgId);
        setNewMessage(text);
        if (!showChat) setShowChat(true);
    };

    const kickUser = (socketId) => {
        if (window.confirm('Are you sure you want to kick this user?')) {
            socketRef.current?.emit('kick-user', { roomId: roomID, targetSocketId: socketId });
        }
    };

    const blockUser = (userId, socketId) => {
        if (window.confirm('Are you sure you want to BLOCK this user? They will not be able to rejoin.')) {
            socketRef.current?.emit('block-user', { roomId: roomID, targetUserId: userId, targetSocketId: socketId });
        }
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
    const raiseHand = () => socketRef.current?.emit('hand-raise', { roomId: roomID, userId: userInfo._id });
    const isHost = myRole === 'host';
    const isCoHost = myRole === 'cohost';
    const canModerate = isHost || isCoHost;
    const canRecord = myRole !== 'guest'; // Enable local recording for all non-guests
    const canChat = myRole !== 'guest';

    const admitUser = (targetSocketId) => {
        socketRef.current?.emit('admit-user', { roomId: roomID, targetSocketId });
    };

    const denyUser = (targetSocketId) => {
        socketRef.current?.emit('deny-user', { roomId: roomID, targetSocketId });
    };

    const promoteCoHost = async (targetUserId, targetSocketId) => {
        try {
            await API.post(`/api/meetings/${meeting._id}/cohost`, { userId: targetUserId });
            socketRef.current?.emit('promote-cohost', { roomId: roomID, targetUserId, targetSocketId });
        } catch (error) {
            alert('Failed to promote user');
        }
    };

    const demoteCoHost = async (targetUserId, targetSocketId) => {
        try {
            await API.delete(`/api/meetings/${meeting._id}/cohost`, { data: { userId: targetUserId } });
            socketRef.current?.emit('demote-cohost', { roomId: roomID, targetUserId, targetSocketId });
        } catch (error) {
            alert('Failed to demote user');
        }
    };

    const muteAll = () => { if (canModerate) socketRef.current?.emit('mute-all', { roomId: roomID }); };
    const endMeetingForAll = () => {
        if (window.confirm('Are you sure you want to end the meeting for everyone?')) socketRef.current?.emit('end-meeting', { roomId: roomID });
    };
    const leaveRoom = () => {
        socketRef.current?.emit('leave-room');
        socketRef.current?.disconnect();
        navigate('/');
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

    const stageUser = getStageUser();

    if (isInWaitingRoom) {
        return (
            <div className="h-screen bg-[#0b0d11] flex flex-col items-center justify-center text-white p-6">
                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-8 animate-pulse border border-blue-500/30">
                    <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-widest mb-4">Waiting Room</h1>
                <p className="text-gray-400 text-center max-w-md font-medium leading-relaxed">
                    Please wait, the host will admit you shortly. Your microphone and camera are ready.
                </p>
                <div className="mt-12 flex space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>
        );
    }

    if (waitingRoomDenied) {
        return (
            <div className="h-screen bg-[#0b0d11] flex flex-col items-center justify-center text-white p-6">
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-8 border border-red-500/30">
                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-widest mb-4">Access Denied</h1>
                <p className="text-gray-400 text-center max-w-md font-medium leading-relaxed">
                    The host did not admit you to this meeting.
                </p>
                <button onClick={() => navigate('/')} className="mt-12 bg-white text-black px-10 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition">Back Home</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#0b0d11] text-white font-sans overflow-hidden">
            {toastMessage && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.5)] z-50 animate-in fade-in slide-in-from-top-4 duration-500 font-bold uppercase tracking-widest text-[#FFF] border border-blue-400/50 flex flex-col items-center justify-center">
                    <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 animate-pulse text-[#FFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth="2"></path></svg>
                        <span className="text-[10px] text-[#FFFFFF]">{toastMessage}</span>
                    </div>
                </div>
            )}
            
            {/* Top Bar */}
            <header className="h-16 flex justify-between items-center px-4 md:px-8 bg-[#12141a]/80 backdrop-blur-2xl border-b border-white/5 z-40 shadow-2xl relative">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
                <div className="flex items-center space-x-4 overflow-hidden">
                    <div className="flex items-center bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-400">Live Session</span>
                    </div>
                    <h1 className="text-sm md:text-base font-bold text-white tracking-tight truncate">{meeting?.title || 'Preparing Room...'}</h1>
                    {myRole && (
                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${myRole === 'host' ? 'bg-blue-500/20 border-blue-500 text-blue-400' :
                                myRole === 'cohost' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
                                    myRole === 'guest' ? 'bg-gray-500/20 border-gray-500 text-gray-400' :
                                        'bg-white/10 border-white/20 text-gray-400'
                            }`}>
                            {myRole}
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-3 md:space-x-8 shrink-0">
                    <div className="hidden sm:flex flex-col items-end space-y-0.5">
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Security</span>
                        <div className="flex items-center space-x-1.5">
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                            <span className="text-[10px] font-bold text-emerald-500/80 uppercase">End-to-End Encrypted</span>
                        </div>
                    </div>
                    <div className="relative group">
                        <button
                            className={`flex flex-col items-center p-3 rounded-2xl transition-all ${isSharingScreen
                                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                                    : requestPending
                                        ? 'bg-amber-600/20 text-amber-500 border border-amber-500/30'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <div className="relative">
                                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                                {requestPending && <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {isSharingScreen ? 'Sharing' : requestPending ? 'Pending' : 'Share'}
                            </span>
                        </button>

                        {/* Share Menu Popover */}
                        {!isSharingScreen && !requestPending && (
                            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-48 bg-[#1a1d23] border border-white/10 rounded-2xl p-2 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all transform translate-y-2 group-hover:translate-y-0 z-50">
                                <button onClick={() => toggleScreenShare('screen')} className="w-full flex items-center space-x-3 p-3 hover:bg-white/5 rounded-xl text-left transition text-gray-300 hover:text-white">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Screen Only</span>
                                </button>
                                <button onClick={() => toggleScreenShare('audio')} className="w-full flex items-center space-x-3 p-3 hover:bg-white/5 rounded-xl text-left transition text-gray-300 hover:text-white">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Audio Only</span>
                                </button>
                                <button onClick={() => toggleScreenShare('both')} className="w-full flex items-center space-x-3 p-3 bg-blue-600/10 hover:bg-blue-600/20 rounded-xl text-left transition text-blue-400 hover:text-blue-300 border border-blue-500/20">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2"></path></svg>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Screen + Audio</span>
                                </button>
                            </div>
                        )}

                        {isSharingScreen && (
                            <button onClick={stopScreenShare} className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-40 bg-red-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                Stop Sharing
                            </button>
                        )}
                    </div>
                    <button onClick={() => { setShowChat(!showChat); setShowParticipants(false); }} className="lg:hidden p-2.5 bg-white/5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all active:scale-90">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                </div>
            </header>

            {/* Main Area */}
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 flex flex-col p-4 relative z-10">
                    {stageUser ? (
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
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 p-2 md:p-4 overflow-y-auto custom-scrollbar flex flex-col">
                            {/* Grid View — Zoom-style adaptive layout for large scale */}
                            <div className={`grid gap-3 w-full my-auto ${
                                peers.length === 0
                                    ? 'grid-cols-1 max-w-3xl mx-auto'
                                    : peers.length === 1
                                    ? 'grid-cols-2 max-w-5xl mx-auto'
                                    : peers.length <= 3
                                    ? 'grid-cols-2 max-w-5xl mx-auto'
                                    : peers.length <= 8
                                    ? 'grid-cols-3 max-w-6xl mx-auto'
                                    : peers.length <= 15
                                    ? 'grid-cols-4 max-w-7xl mx-auto'
                                    : peers.length <= 24
                                    ? 'grid-cols-5 max-w-[1600px] mx-auto'
                                    : 'grid-cols-auto-fit-min-200' 
                            } animate-in fade-in zoom-in-95 duration-500 pb-10`}>

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
                        <div className="flex p-1.5 bg-black/40 m-4 rounded-2xl border border-white/10 shadow-inner">
                            <button onClick={() => { setShowChat(true); setShowParticipants(false); }} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${showChat ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>CHAT</button>
                            <button onClick={() => { setShowChat(false); setShowParticipants(true); }} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${showParticipants ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>PEOPLE</button>
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
                                    {roomUsers.filter(u => u.userName.toLowerCase().includes(searchQuery.toLowerCase())).map((user, idx) => (
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
                                                <div className={`w-1.5 h-1.5 rounded-full mr-2 shrink-0 ${user.micStatus ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500/40'}`}></div>
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
                            <div className="flex-1 flex flex-col min-h-0 bg-black/10">
                                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`flex flex-col ${msg.userName === userInfo.name ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                            <div className="flex items-center space-x-2 mb-1.5 px-2">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{msg.userName}</span>
                                                <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tight">{msg.time}</span>
                                            </div>
                                            <div className={`px-4 py-3 rounded-2xl text-[11px] leading-relaxed max-w-[90%] shadow-xl border relative group ${msg.userName === userInfo.name ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-400/20 rounded-tr-none' : 'bg-white/5 text-slate-300 border-white/10 rounded-tl-none'}`}>
                                                {msg.file ? (
                                                    <div className="flex items-center space-x-4 py-1">
                                                        <div className="w-10 h-10 bg-black/30 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                                                            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] font-black truncate mb-1 text-white">{msg.file.name}</p>
                                                            <a href={msg.file.data} download={msg.file.name} className="text-[9px] text-blue-400 hover:text-blue-300 transition-colors font-black uppercase tracking-widest underline decoration-2 underline-offset-4">Download</a>
                                                        </div>
                                                    </div>
                                                ) : msg.text}

                                                {/* Chat message actions (Edit/Delete) */}
                                                {!msg.file && String(msg.userName) === String(userInfo.name) && (
                                                    <div className="absolute top-1/2 -translate-y-1/2 right-[102%] hidden group-hover:flex items-center bg-[#1a1d23] rounded-lg border border-white/10 p-1 shadow-lg space-x-1">
                                                        <button 
                                                            onClick={() => startEditingMessage(msg._id, msg.text)}
                                                            className="p-1 hover:bg-white/10 text-gray-400 hover:text-white rounded-md transition-all title='Edit'"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteChatMessage(msg._id)}
                                                            className="p-1 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-md transition-all title='Delete'"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                {canChat ? (
                                    <form onSubmit={sendMessage} className="p-4 bg-black/10 border-t border-white/5">
                                        <div className="flex items-center space-x-2">
                                            <label className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition text-gray-400 hover:text-white">
                                                <input type="file" className="hidden" onChange={handleFileUpload} />
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.415a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                            </label>
                                            <div className="relative flex-1">
                                                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={editingMessageId ? "Edit your message..." : "Send a message..."} className={`w-full bg-[#2a2d35] border-none rounded-xl px-4 py-2.5 text-[11px] outline-none transition placeholder:text-gray-600 ${editingMessageId ? 'focus:ring-1 focus:ring-amber-500/50' : 'focus:ring-1 focus:ring-blue-500/50'}`} />
                                                <button type="submit" className={`absolute right-2 top-1.5 p-1.5 transition ${editingMessageId ? 'text-amber-500 hover:text-amber-400' : 'text-blue-500 hover:text-blue-400'}`}>
                                                    {editingMessageId ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                                    )}
                                                </button>
                                                {editingMessageId && (
                                                    <button type="button" onClick={() => { setEditingMessageId(null); setNewMessage(''); }} className="absolute right-8 top-1.5 p-1.5 text-gray-500 hover:text-gray-400 transition" title="Cancel Edit">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="p-6 text-center bg-black/20 border-t border-white/5">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Guests cannot participate in chat</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </aside>
                )}
            </div>
            {/* Bottom Controls — Zoom-style */}
            <div className="h-auto min-h-[4.5rem] md:h-20 bg-[#1c1f28] border-t border-white/8 flex flex-wrap md:flex-nowrap items-center justify-between px-3 md:px-8 py-2 md:py-0 z-50 gap-y-2 relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Left: Meeting ID */}
                <div
                    className="hidden md:flex flex-col cursor-pointer group"
                    onClick={() => { navigator.clipboard.writeText(roomID); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                >
                    <span className="text-[9px] text-gray-600 uppercase tracking-[0.3em] font-black">Room ID</span>
                    <span className={`text-xs font-mono font-bold transition-colors ${copied ? 'text-emerald-400' : 'text-gray-400 group-hover:text-white'}`}>
                        {copied ? '✓ Copied!' : roomID}
                    </span>
                </div>

                {/* Center: Control Buttons */}
                <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-4 flex-1 md:flex-none mx-auto">

                    {myRole !== 'guest' && (
                        <>
                            {/* Mic */}
                            <button
                                onClick={toggleMute}
                                className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95 min-w-[52px] ${
                                    isMuted
                                        ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                                        : 'text-gray-300 hover:bg-white/8 hover:text-white'
                                }`}
                            >
                                {isMuted
                                    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 1.56"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                                }
                                <span className="text-[9px] font-semibold">{isMuted ? 'Unmute' : 'Mute'}</span>
                            </button>

                            {/* Camera */}
                            <button
                                onClick={toggleVideo}
                                className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95 min-w-[52px] ${
                                    isVideoOff
                                        ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                                        : 'text-gray-300 hover:bg-white/8 hover:text-white'
                                }`}
                            >
                                {isVideoOff
                                    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z M6 18L18 6"/></svg>
                                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                                }
                                <span className="text-[9px] font-semibold">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
                            </button>

                            <div className="w-px h-8 bg-white/10 hidden sm:block" />

                            {/* Screen Share */}
                            <div className="relative hidden sm:block">
                                <button
                                    onClick={() => isSharingScreen ? stopScreenShare() : setShowShareMenu(!showShareMenu)}
                                    className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95 min-w-[52px] ${
                                        isSharingScreen
                                            ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                                            : 'text-gray-300 hover:bg-white/8 hover:text-white'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <rect x="2" y="3" width="20" height="14" rx="2" />
                                        <path d="M8 21h8M12 17v4"/>
                                        {isSharingScreen && <path d="M9 9l3-3 3 3M12 6v8" strokeLinecap="round"/>}
                                    </svg>
                                    <span className="text-[9px] font-semibold">{isSharingScreen ? 'Stop Share' : 'Share Screen'}</span>
                                </button>
                                {showShareMenu && !isSharingScreen && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 bg-[#1e222d] border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-3 pt-1 pb-2">Select what to share</p>
                                        {[{label: 'Screen Only', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', type: 'screen'},
                                          {label: 'Audio Only', icon: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 10v2a7 7 0 0 1-14 0v-2', type: 'audio'},
                                          {label: 'Screen + Audio', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', type: 'both'}
                                        ].map(({label, icon, type}) => (
                                            <button key={type} onClick={() => { toggleScreenShare(type); setShowShareMenu(false); }}
                                                className="w-full text-left px-3 py-2.5 text-[11px] font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center gap-3">
                                                <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d={icon}/></svg>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Record */}
                            {canRecord && (
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 min-w-[52px] hidden sm:flex ${
                                        isRecording
                                            ? 'bg-red-600/20 text-red-400 hover:bg-red-600/40 shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                                            : 'text-gray-300 hover:bg-white/10 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                    }`}
                                >
                                    <div className="relative">
                                        <svg className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} fill={isRecording ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="8"/>
                                            {isRecording && <circle cx="12" cy="12" r="4" fill="currentColor"/>}
                                        </svg>
                                        {isRecording && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isRecording ? 'text-red-400' : ''}`}>{isRecording ? 'Stop Rec' : 'Record'}</span>
                                </button>
                            )}

                            {/* Raise Hand */}
                            <button
                                onClick={raiseHand}
                                className="flex flex-col items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl text-gray-300 hover:bg-white/8 hover:text-white transition-all duration-200 active:scale-95 min-w-[52px] hidden sm:flex"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
                                <span className="text-[9px] font-semibold">Raise Hand</span>
                            </button>
                        </>
                    )}
                </div>

                {/* Right: Chat, Participants, Settings, End */}
                <div className="flex items-center gap-1 sm:gap-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-200 active:scale-95 min-w-[44px] hidden sm:flex ${
                            showSettings ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/8'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span className="text-[9px] font-semibold">Settings</span>
                    </button>

                    <button
                        onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
                        className={`relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-200 active:scale-95 min-w-[44px] ${
                            showChat ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/8'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                        {unreadMessages > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-[8px] font-black rounded-full flex items-center justify-center border border-[#1c1f28]">{unreadMessages}</span>}
                        <span className="text-[9px] font-semibold">Chat</span>
                    </button>

                    <button
                        onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
                        className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-200 active:scale-95 min-w-[44px] ${
                            showParticipants ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/8'
                        }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <span className="text-[9px] font-semibold">People {roomUsers.length > 0 && `(${roomUsers.length})`}</span>
                    </button>

                    <div className="w-px h-8 bg-white/10 hidden sm:block mx-1" />

                    <button
                        onClick={leaveRoom}
                        className="flex flex-col items-center gap-1 px-3 sm:px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 active:scale-95 font-semibold shadow-lg shadow-red-900/30"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                        <span className="text-[9px] font-semibold">Leave</span>
                    </button>
                </div>
            </div>
            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[#1e222d] border border-white/10 rounded-[3rem] w-full max-w-lg p-10 shadow-2xl relative">
                        <button onClick={() => setShowSettings(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" /></svg>
                        </button>
                        
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Device Settings</h2>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-10">Configure your hardware interface</p>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 px-1">Optical Input (Camera)</label>
                                <select 
                                    value={selectedVideoDevice} 
                                    onChange={(e) => switchCamera(e.target.value)}
                                    className="w-full bg-black/20 border-2 border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    {videoDevices.map(device => (
                                        <option key={device.deviceId} value={device.deviceId} className="bg-[#1e222d]">{device.label || `Camera ${device.deviceId.slice(0, 5)}`}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 px-1">Acoustic Input (Microphone)</label>
                                <select 
                                    value={selectedAudioDevice} 
                                    onChange={(e) => switchAudio(e.target.value)}
                                    className="w-full bg-black/20 border-2 border-white/5 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                                >
                                    {audioDevices.map(device => (
                                        <option key={device.deviceId} value={device.deviceId} className="bg-[#1e222d]">{device.label || `Microphone ${device.deviceId.slice(0, 5)}`}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowSettings(false)}
                            className="w-full mt-12 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-[2rem] text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                        >
                            Save Configuration
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomPage;
