import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import API from '../api';

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5005');

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
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [remoteStreams, setRemoteStreams] = useState({}); // socketId -> stream
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
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
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
        if (showChat) setUnreadMessages(0);
    }, [messages, showChat]);

    useEffect(() => {
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

        const handleConnect = () => {
            // join-room is called in initMedia
        };

        if (socket.connected) handleConnect();

        socket.on('chat-message', (message) => {
            setMessages((prev) => [...prev, message]);
            if (!showChat) setUnreadMessages(prev => prev + 1);
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
            console.log("Updated user list received:", users);
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

        socket.on('force-stop-share', () => {
            if (isSharingScreen) {
                stopScreenShare();
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

        socket.on('screen-share-request', (data) => setScreenShareRequest(data));
        socket.on('screen-share-permission-result', (data) => {
            setIsWaitingForPermission(false);
            if (data.allowed) startScreenShare();
            else alert('Host denied your screen share request');
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

        socket.on('chat-blocked', () => {
            // silently ignore — the UI already hides the input for guests
        });

        socket.on('room-muted-all', () => {
            if (meeting?.hostId !== userInfo._id) {
                if (streamRef.current && streamRef.current.getAudioTracks()[0].enabled) {
                    streamRef.current.getAudioTracks()[0].enabled = false;
                    setIsMuted(true);
                    socket.emit('update-media-status', { roomId: roomID, micStatus: false });
                }
            }
        });

        socket.on('meeting-ended', () => {
            alert('Host has ended the meeting for everyone.');
            navigate('/');
        });

        socket.on('all-users', (users) => {
            const peers = [];
            users.forEach((u) => {
                const peer = createPeer(u.socketId, socket.id, streamRef.current, userInfo._id);
                peersRef.current.push({ peerID: u.socketId, userId: u.userId, peer });
                peers.push({ peerID: u.socketId, userId: u.userId, peer });
            });
            setPeers(peers);
        });

        socket.on('user-joined', (payload) => {
            const peer = addPeer(payload.signal, payload.callerID, streamRef.current);
            peersRef.current.push({ peerID: payload.callerID, userId: payload.callerUserId, peer });
            setPeers((prev) => [...prev, { peerID: payload.callerID, userId: payload.callerUserId, peer }]);
        });

        socket.on('receiving-returned-signal', (payload) => {
            const item = peersRef.current.find((p) => p.peerID === payload.id);
            if (item) item.peer.signal(payload.signal);
        });

        const initMedia = async () => {
            try {
                const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setStream(currentStream);
                streamRef.current = currentStream;
                if (userVideo.current) userVideo.current.srcObject = currentStream;

                const isGuest = userInfo.role === 'guest' || userInfo._id?.startsWith('guest-');
                socket.emit('join-room', roomID, userInfo._id, userInfo.name, isGuest);

                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoIn = devices.filter(device => device.kind === 'videoinput');
                const audioIn = devices.filter(device => device.kind === 'audioinput');
                setVideoDevices(videoIn);
                setAudioDevices(audioIn);
                if (videoIn.length > 0 && !selectedVideoDevice) setSelectedVideoDevice(videoIn[0].deviceId);
                if (audioIn.length > 0 && !selectedAudioDevice) setSelectedAudioDevice(audioIn[0].deviceId);
            } catch (err) {
                console.error("Media access denied:", err);
                const isGuest = userInfo.role === 'guest' || userInfo._id?.startsWith('guest-');
                socket.emit('join-room', roomID, userInfo._id, userInfo.name, isGuest);
            }
        };
        initMedia();

        return () => {
            socket.off('connect');
            socket.off('update-user-list');
            socket.off('chat-message');
            socket.off('previous-messages');
            socket.off('user-hand-raised');
            socket.off('user-disconnected');
            socket.off('screen-share-request');
            socket.off('screen-share-permission-result');
            socket.off('kicked');
            socket.off('turn-updated');
            socket.off('screen-sharing-started');
            socket.off('screen-sharing-stopped');
            socket.off('room-muted-all');
            socket.off('meeting-ended');
            socket.off('all-users');
            socket.off('user-joined');
            socket.off('receiving-returned-signal');
            socket.off('your-role');
            socket.off('role-updated');
            socket.off('waiting-room');
            socket.off('waiting-room-denied');
            socket.off('waiting-room-update');
            socket.off('chat-blocked');
            socket.off('share-request-received');
            socket.off('share-request-result');
            socket.off('blocked');
            socket.off('error-message');
            socket.emit('leave-room');
        };
    }, [roomID, navigate]);

    useEffect(() => {
        if (!isInWaitingRoom && stream && userVideo.current && !isSharingScreen) {
            userVideo.current.srcObject = stream;
        }
    }, [isInWaitingRoom, stream, isSharingScreen]);

    function createPeer(userToSignal, callerID, stream, callerUserId) {
        const peer = new Peer({ initiator: true, trickle: false, stream });
        if (isSharingScreen && screenStreamRef.current) {
            const screenTrack = screenStreamRef.current.getVideoTracks()[0];
            const cameraTrack = stream.getVideoTracks()[0];
            if (screenTrack && cameraTrack) {
                peer.on('connect', () => {
                    peer.replaceTrack(cameraTrack, screenTrack, stream);
                });
            }
        }
        peer.on('signal', (signal) => socket.emit('sending-signal', { userToSignal, callerID, signal, callerUserId }));
        peer.on('stream', (remoteStream) => {
            console.log("Received remote stream from", userToSignal);
            setRemoteStreams(prev => ({ ...prev, [userToSignal]: remoteStream }));
        });
        peer.on('error', (err) => console.error("Peer error:", err));
        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({ initiator: false, trickle: false, stream });
        if (isSharingScreen && screenStreamRef.current) {
            const screenTrack = screenStreamRef.current.getVideoTracks()[0];
            const cameraTrack = stream.getVideoTracks()[0];
            if (screenTrack && cameraTrack) {
                peer.on('connect', () => {
                    peer.replaceTrack(cameraTrack, screenTrack, stream);
                });
            }
        }
        peer.on('signal', (signal) => socket.emit('returning-signal', { signal, callerID }));
        peer.on('stream', (remoteStream) => {
            console.log("Received remote stream from", callerID);
            setRemoteStreams(prev => ({ ...prev, [callerID]: remoteStream }));
        });
        peer.on('error', (err) => console.error("Peer error:", err));
        peer.signal(incomingSignal);
        return peer;
    }

    const toggleMute = () => {
        if (streamRef.current) {
            const enabled = streamRef.current.getAudioTracks()[0].enabled;
            streamRef.current.getAudioTracks()[0].enabled = !enabled;
            setIsMuted(!enabled);
            socket.emit('update-media-status', { roomId: roomID, micStatus: !enabled });
        }
    };

    const toggleVideo = () => {
        if (streamRef.current) {
            const enabled = streamRef.current.getVideoTracks()[0].enabled;
            streamRef.current.getVideoTracks()[0].enabled = !enabled;
            setIsVideoOff(!enabled);
            socket.emit('update-media-status', { roomId: roomID, videoStatus: !enabled });
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
        // Find all moderators (host/co-hosts) to send request
        const moderators = roomUsers.filter(u => u.role === 'host' || u.role === 'cohost');
        if (moderators.length > 0) {
            moderators.forEach(mod => {
                socket.emit('request-to-share', {
                    roomId: roomID,
                    hostId: mod.socketId,
                    userId: socket.id,
                    userName: userInfo.name,
                    type
                });
            });
        } else {
            alert('No host or co-host available to approve your request.');
            setRequestPending(false);
        }
    };

    const respondToShareRequest = (userId, approved, type) => {
        setShareRequests(prev => prev.filter(req => req.userId !== userId));
        socket.emit('share-permission-response', { userId, approved, type });
    };

    const toggleScreenShare = (type = 'screen') => {
        const isHost = meeting?.hostId === userInfo._id;
        if (!isHost && !isShareApproved) {
            requestShare(type);
            return;
        }

        if (isSharingScreen) {
            stopScreenShare();
        } else {
            startScreenShare(type);
        }
    };

    const startScreenShare = (type) => {
        if (isSharingScreen) return;
        const constraints = {
            video: type === 'audio' ? false : {
                displaySurface: 'monitor',
                logicalSurface: true,
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
                // Create audio context to mix mic + system audio
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const micSource = audioCtx.createMediaStreamSource(new MediaStream([micTrack]));
                const screenSource = audioCtx.createMediaStreamSource(new MediaStream([screenAudioTrack]));
                const destination = audioCtx.createMediaStreamDestination();

                // Set gains for better balance (system audio slightly lower if needed)
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
            setIsSharingScreen(true);
        }).catch(err => {
            console.error("Error sharing screen:", err);
            setIsWaitingForPermission(false);
            setRequestPending(false);
        });
    };

    const stopScreenShare = () => {
        if (!isSharingScreen) return;

        const cameraTrack = streamRef.current?.getVideoTracks()[0];
        const micTrack = streamRef.current?.getAudioTracks()[0];
        const screenVideoTrack = screenStreamRef.current?.getVideoTracks()[0];
        const mixedAudioTrack = audioDestinationRef.current?.stream.getAudioTracks()[0];

        peersRef.current.forEach(({ peer }) => {
            try {
                if (peer.connected) {
                    if (screenVideoTrack && cameraTrack) {
                        peer.replaceTrack(screenVideoTrack, cameraTrack, streamRef.current);
                    }
                    if (mixedAudioTrack && micTrack) {
                        peer.replaceTrack(mixedAudioTrack, micTrack, streamRef.current);
                    } else if (!mixedAudioTrack && screenStreamRef.current?.getAudioTracks()[0] && micTrack) {
                        peer.replaceTrack(screenStreamRef.current.getAudioTracks()[0], micTrack, streamRef.current);
                    }
                }
            } catch (e) { console.error('restoreTrack error:', e); }
        });

        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close().catch(e => console.error("Error closing audio context:", e));
            audioContextRef.current = null;
            audioDestinationRef.current = null;
        }

        socket.emit('stop-screen-share', { roomId: roomID });
        setActiveSharingUser(null);
        if (userVideo.current) userVideo.current.srcObject = streamRef.current;
        setIsSharingScreen(false);
        setIsShareApproved(false);
        setIsWaitingForPermission(false);
    };

    const handlePermissionResponse = (allowed) => {
        if (screenShareRequest) {
            socket.emit('screen-share-permission-response', { requesterSocketId: screenShareRequest.socketId, allowed });
            setScreenShareRequest(null);
        }
    };

    const startRecording = () => {
        if (!canRecord) return alert('Only the meeting host can record the uchrashuv.');
        recordedChunksRef.current = [];
        const options = { mimeType: 'video/webm;codecs=vp9,opus' };
        try {
            const mediaRecorder = new MediaRecorder(userVideo.current.srcObject, options);
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `recording-${roomID}-${Date.now()}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            };
            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
        } catch (e) { console.error("Recording error:", e); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
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
            e.target.value = ''; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            socket.emit('file-message', {
                roomId: roomID, userId: userInfo._id, userName: userInfo.name,
                file: { name: file.name, type: file.type, size: file.size, data: event.target.result }
            });
            e.target.value = ''; // Reset input
        };
        reader.readAsDataURL(file);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (checkGuestAction()) return;
        if (!canChat) return alert('Chat is disabled for this room.');
        if (newMessage.trim()) {
            socket.emit('chat-message', { roomId: roomID, userId: userInfo._id, userName: userInfo.name, message: newMessage });
            setNewMessage('');
        }
    };

    const kickUser = (socketId) => {
        if (window.confirm('Are you sure you want to kick this user?')) {
            socket.emit('kick-user', { roomId: roomID, targetSocketId: socketId });
        }
    };

    const blockUser = (userId, socketId) => {
        if (window.confirm('Are you sure you want to BLOCK this user? They will not be able to rejoin.')) {
            socket.emit('block-user', { roomId: roomID, targetUserId: userId, targetSocketId: socketId });
        }
    };

    const giveTurn = (userId) => socket.emit('give-turn', { roomId: roomID, targetUserId: userId });
    const raiseHand = () => socket.emit('hand-raise', { roomId: roomID, userId: userInfo._id });
    const isHost = myRole === 'host';
    const isCoHost = myRole === 'cohost';
    const canModerate = isHost || isCoHost;
    const canRecord = isHost; // Host only
    const canChat = myRole !== 'guest';

    const admitUser = (targetSocketId) => {
        socket.emit('admit-user', { roomId: roomID, targetSocketId });
    };

    const denyUser = (targetSocketId) => {
        socket.emit('deny-user', { roomId: roomID, targetSocketId });
    };

    const promoteCoHost = async (targetUserId, targetSocketId) => {
        try {
            await API.post(`/api/meetings/${meeting._id}/cohost`, { userId: targetUserId });
            socket.emit('promote-cohost', { roomId: roomID, targetUserId, targetSocketId });
        } catch (error) {
            alert('Failed to promote user');
        }
    };

    const demoteCoHost = async (targetUserId, targetSocketId) => {
        try {
            await API.delete(`/api/meetings/${meeting._id}/cohost`, { data: { userId: targetUserId } });
            socket.emit('demote-cohost', { roomId: roomID, targetUserId, targetSocketId });
        } catch (error) {
            alert('Failed to demote user');
        }
    };

    const muteAll = () => { if (canModerate) socket.emit('mute-all', { roomId: roomID }); };
    const endMeetingForAll = () => {
        if (window.confirm('Are you sure you want to end the meeting for everyone?')) socket.emit('end-meeting', { roomId: roomID });
    };
    const leaveRoom = () => { navigate('/'); window.location.reload(); };

    const getStageUser = () => {
        if (!meeting) return null;
        if (activeSharingUser) return activeSharingUser;
        const host = roomUsers.find(u => String(u.userId) === String(meeting.hostId));
        if (host && String(host.userId) !== String(userInfo._id)) {
            return { socketId: host.socketId, userId: host.userId, userName: host.userName, isHost: true };
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
        <div className="h-screen bg-[#0b0d11] flex flex-col overflow-hidden text-slate-200 font-sans selection:bg-blue-500/30">
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
                            {/* Primary Stage */}
                            <div className="flex-[4] relative bg-[#15181e] rounded-2xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center">
                                {stageUser.socketId === socket.id ? (
                                    <video ref={userVideo} autoPlay muted playsInline className="w-full h-full object-contain" />
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
                            </div>

                            {/* Sidebar Thumbnails */}
                            <div className="flex-1 lg:max-w-[240px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                {stageUser.socketId !== socket.id && (
                                    <div className="relative aspect-video bg-[#1a1d23] rounded-xl overflow-hidden border border-white/5 shadow-md group">
                                        <video ref={userVideo} autoPlay muted playsInline className="w-full h-full object-cover" />
                                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[9px] font-bold">You</div>
                                    </div>
                                )}
                                {peers.filter(p => p.peerID !== stageUser.socketId).map((peerObj, index) => {
                                    const user = roomUsers.find(u => u.socketId === peerObj.peerID);
                                    if (canModerate || peerObj.userId === currentTurnUserId) {
                                        return (
                                            <div key={index} className="relative aspect-video bg-[#1a1d23] rounded-xl overflow-hidden border border-white/5 shadow-md hover:border-blue-500/30 transition-colors">
                                                <Video stream={remoteStreams[peerObj.peerID]} userName={user?.userName || 'Participant'} role={user?.role} hasTurn={peerObj.userId === currentTurnUserId} />
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-4">
                            {/* Grid View Content */}
                            <div className={`grid gap-6 w-full h-full max-w-7xl mx-auto items-center justify-items-center ${peers.length === 0 ? 'grid-cols-1 max-w-2xl' :
                                peers.length === 1 ? 'grid-cols-1 md:grid-cols-2 max-w-5xl' :
                                    peers.length === 2 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl' :
                                        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                } animate-in zoom-in duration-700`}>
                                <div className={`relative w-full aspect-video bg-[#0b0d11] rounded-[2rem] overflow-hidden border transition-all duration-700 group shadow-2xl ${isHost ? 'border-blue-500/40 ring-1 ring-blue-500/20' : isCoHost ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-white/5'}`}>
                                    <video ref={userVideo} autoPlay muted playsInline className="w-full h-full object-cover" />
                                    <div className="absolute bottom-3 left-3 flex items-center bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isHost ? 'bg-blue-500' : isCoHost ? 'bg-emerald-500' : 'bg-gray-500'}`}></div>
                                        <span className="text-[9px] font-black uppercase tracking-wider">{userInfo.name} (You)</span>
                                    </div>
                                    {isVideoOff && (
                                        <div className="absolute inset-0 bg-[#0f1115] flex items-center justify-center">
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-xl font-black text-white shadow-2xl border border-white/10">
                                                {userInfo.name.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {peers.map((peerObj, index) => {
                                    const user = roomUsers.find(u => u.socketId === peerObj.peerID);
                                    return (
                                        <div key={index} className="w-full animate-in slide-in-from-bottom-8 duration-500">
                                            <Video
                                                stream={remoteStreams[peerObj.peerID]}
                                                userName={user?.userName || 'Participant'}
                                                role={user?.role}
                                                hasTurn={peerObj.userId === currentTurnUserId}
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
                    <aside className={`fixed inset-0 lg:static lg:w-[360px] bg-[#0b0d11]/95 lg:bg-[#12141a]/40 backdrop-blur-3xl border-l border-white/5 flex flex-col z-50 lg:z-30 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-500`}>
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
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-4 mt-2 px-1">Participants ({roomUsers.length})</div>
                                <div className="flex-1 overflow-y-auto space-y-2.5 pb-6 pr-1 custom-scrollbar">
                                    {roomUsers.map((user, idx) => (
                                        <div key={idx} className={`group flex items-center p-3 rounded-2xl border transition-all duration-300 ${user.userId === currentTurnUserId ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}>
                                            <div className="w-9 h-9 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center text-[11px] font-black text-blue-400 border border-white/10 shadow-lg mr-3 shrink-0">
                                                {user.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
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
                                            <div className="flex items-center space-x-1">
                                                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${user.micStatus ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-red-500/40'}`}></div>
                                                {canModerate && String(user.userId) !== String(userInfo._id) && (
                                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {isHost && (
                                                            user.role === 'cohost' ? (
                                                                <button onClick={() => demoteCoHost(user.userId, user.socketId)} title="Demote Co-host" className="p-1.5 hover:bg-blue-500/20 rounded-lg text-gray-500 hover:text-blue-500 transition-all">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg>
                                                                </button>
                                                            ) : user.role === 'participant' && (
                                                                <button onClick={() => promoteCoHost(user.userId, user.socketId)} title="Promote to Co-host" className="p-1.5 hover:bg-emerald-500/20 rounded-lg text-gray-500 hover:text-emerald-500 transition-all">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg>
                                                                </button>
                                                            )
                                                        )}
                                                        <button onClick={() => kickUser(user.socketId)} title="Kick" className="p-1.5 hover:bg-yellow-500/20 rounded-lg text-gray-500 hover:text-yellow-500 transition-all">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                                        </button>
                                                        <button onClick={() => blockUser(user.userId, user.socketId)} title="Block" className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-500 transition-all">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                                                        </button>
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
                                            <div className={`px-4 py-3 rounded-2xl text-[11px] leading-relaxed max-w-[90%] shadow-xl border ${msg.userName === userInfo.name ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-400/20 rounded-tr-none' : 'bg-white/5 text-slate-300 border-white/10 rounded-tl-none'}`}>
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
                                                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Send a message..." className="w-full bg-[#2a2d35] border-none rounded-xl px-4 py-2.5 text-[11px] outline-none focus:ring-1 focus:ring-blue-500/50 transition placeholder:text-gray-600" />
                                                <button type="submit" className="absolute right-2 top-1.5 p-1.5 text-blue-500 hover:text-blue-400 transition"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
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
            {/* Bottom Controls */}
            <div className="h-28 md:h-24 bg-[#12141a]/90 backdrop-blur-3xl border-t border-white/10 flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-3 md:py-0 z-50 shadow-[0_-15px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
                <div className="flex items-center space-x-20 hidden md:flex shrink-0">
                    <div className="group cursor-pointer" onClick={() => {
                        navigator.clipboard.writeText(roomID);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    }}>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] mb-1.5 opacity-60 group-hover:text-blue-400 transition-colors">Meeting Context</p>
                        <div className="flex items-center space-x-2">
                            <span className="text-[15px] font-mono font-bold text-blue-400/80 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 group-hover:border-blue-500/30 transition-all shadow-sm">
                                {copied ? 'COPIED!' : `ID: ${roomID}`}
                            </span>
                            <svg className={`w-6 h-6 text-blue-500/40 group-hover:text-blue-400 transition-colors ${copied ? 'scale-125' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3 md:space-x-5">
                    <button onClick={toggleMute} className={`group relative p-3 md:p-4 rounded-2xl transition-all duration-500 border shadow-2xl ${isMuted ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-red-500/10' : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300 active:scale-90'}`}>
                        {isMuted ? <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg> : <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5z"></path></svg>}
                    </button>

                    <button onClick={toggleVideo} className={`group relative p-3 md:p-4 rounded-2xl transition-all duration-500 border shadow-2xl ${isVideoOff ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-red-500/10' : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300 active:scale-90'}`}>
                        {isVideoOff ? <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z M6 18L18 6"></path></svg> : <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>}
                    </button>

                    <div className="w-px h-8 bg-white/10 mx-1 md:mx-3 shrink-0"></div>

                    <button onClick={raiseHand} className="group relative p-3 md:p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/20 transition-all active:scale-90 shadow-2xl shadow-yellow-500/5">
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4.001z"></path></svg>
                    </button>

                    {canRecord && (
                        <button onClick={isRecording ? stopRecording : startRecording} className={`group relative p-3 md:p-4 rounded-2xl transition-all duration-500 border ${isRecording ? 'bg-red-500 animate-pulse border-red-500/40 text-white' : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-500'} hidden sm:block shadow-2xl`}>
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" /></svg>
                        </button>
                    )}

                    <div className="relative">
                        <button 
                            onClick={() => isSharingScreen ? stopScreenShare() : setShowShareMenu(!showShareMenu)} 
                            className={`group relative p-3 md:p-4 rounded-2xl transition-all duration-500 border ${isSharingScreen ? 'bg-blue-600 border-blue-400 text-white animate-pulse shadow-xl shadow-blue-500/40' : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-500'}`}
                        >
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </button>

                        {showShareMenu && !isSharingScreen && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 bg-[#1e222d] border border-white/10 rounded-[2rem] p-2 shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-2 duration-300 z-50">
                                <button onClick={() => { toggleScreenShare('screen'); setShowShareMenu(false); }} className="w-full text-left px-5 py-3 text-[10px] font-black text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all uppercase tracking-widest flex items-center">
                                    <svg className="w-3.5 h-3.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                    Screen Only
                                </button>
                                <button onClick={() => { toggleScreenShare('audio'); setShowShareMenu(false); }} className="w-full text-left px-5 py-3 text-[10px] font-black text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all uppercase tracking-widest flex items-center">
                                    <svg className="w-3.5 h-3.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5z"></path></svg>
                                    Audio Only
                                </button>
                                <button onClick={() => { toggleScreenShare('both'); setShowShareMenu(false); }} className="w-full text-left px-5 py-3 text-[10px] font-black text-blue-400 hover:text-white hover:bg-blue-600 rounded-2xl transition-all uppercase tracking-widest flex items-center">
                                    <svg className="w-3.5 h-3.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                                    Both
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2 md:space-x-3">
                        <button onClick={() => setShowSettings(!showSettings)} className={`group relative p-3 md:p-4 rounded-2xl transition-all duration-500 border ${showSettings ? 'bg-slate-700 border-slate-500 text-white shadow-xl' : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-500 active:scale-90'}`}>
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        </button>

                        <button onClick={() => { setShowChat(!showChat); setShowParticipants(false); }} className={`group relative p-3 md:p-4 rounded-2xl transition-all duration-500 border ${showChat ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-500 active:scale-90'}`}>
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                            {unreadMessages > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#12141a] animate-bounce">{unreadMessages}</span>}
                        </button>

                        <button onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }} className={`group relative p-3 md:p-4 rounded-2xl transition-all duration-500 border ${showParticipants ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-500 active:scale-90'} hidden sm:block`}>
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        </button>
                    </div>
                </div>

                <div className="flex items-center shrink-0">
                    <button onClick={leaveRoom} className="bg-gradient-to-br from-red-500 to-rose-700 hover:from-red-600 hover:to-rose-800 text-white px-5 md:px-10 py-2.5 md:py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl shadow-red-900/40 border border-red-400/20">End Meeting</button>
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
