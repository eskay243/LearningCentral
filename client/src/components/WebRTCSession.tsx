import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Share2, 
  Users, 
  MessageCircle,
  Send,
  Settings,
  Maximize2,
  Minimize2,
  Camera,
  Monitor
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Participant {
  id: string;
  name: string;
  role: string;
  isHost: boolean;
  isMuted: boolean;
  hasVideo: boolean;
  isScreenSharing: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system';
}

interface WebRTCSessionProps {
  sessionId: string;
  userId: string;
  userName: string;
  userRole: string;
  onLeave: () => void;
}

// WebRTC configuration with STUN servers
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

export default function WebRTCSession({ 
  sessionId, 
  userId, 
  userName, 
  userRole, 
  onLeave 
}: WebRTCSessionProps) {
  const { toast } = useToast();
  
  // Media state
  const [isMuted, setIsMuted] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Participants and chat
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  
  // Refs for media and connections
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<{ [key: string]: HTMLVideoElement }>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const wsRef = useRef<WebSocket | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected for WebRTC session');
      setIsConnected(true);
      
      // Join the session
      wsRef.current?.send(JSON.stringify({
        type: 'join-session',
        sessionId,
        userId,
        userName,
        userRole
      }));
    };
    
    wsRef.current.onmessage = handleWebSocketMessage;
    
    wsRef.current.onclose = () => {
      setIsConnected(false);
      toast({
        title: "Connection Lost",
        description: "Trying to reconnect...",
        variant: "destructive"
      });
    };
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      cleanupMediaStreams();
    };
  }, [sessionId, userId, userName, userRole]);
  
  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'user-joined':
        handleUserJoined(data);
        break;
      case 'user-left':
        handleUserLeft(data);
        break;
      case 'webrtc-offer':
        handleOffer(data);
        break;
      case 'webrtc-answer':
        handleAnswer(data);
        break;
      case 'webrtc-ice-candidate':
        handleIceCandidate(data);
        break;
      case 'chat-message':
        handleChatMessage(data);
        break;
      case 'participants-update':
        setParticipants(data.participants);
        break;
      case 'media-state-changed':
        handleMediaStateChanged(data);
        break;
    }
  }, []);
  
  // Initialize local media stream
  const initializeLocalStream = useCallback(async (video = false, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720 } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Add tracks to existing peer connections
      Object.values(peerConnectionsRef.current).forEach(pc => {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      });
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Media Access Error",
        description: "Could not access camera or microphone",
        variant: "destructive"
      });
      return null;
    }
  }, []);
  
  // Create peer connection
  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection(rtcConfiguration);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current?.send(JSON.stringify({
          type: 'webrtc-ice-candidate',
          sessionId,
          targetId: peerId,
          candidate: event.candidate
        }));
      }
    };
    
    pc.ontrack = (event) => {
      const remoteVideo = remoteVideosRef.current[peerId];
      if (remoteVideo && event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
      }
    };
    
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, pc.connectionState);
    };
    
    // Add local stream tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }
    
    peerConnectionsRef.current[peerId] = pc;
    return pc;
  }, [sessionId]);
  
  // Handle user joined
  const handleUserJoined = useCallback(async (data: any) => {
    const { userId: joinedUserId, userName: joinedUserName, userRole: joinedUserRole } = data;
    
    if (joinedUserId === userId) return; // Don't create connection to self
    
    // Create peer connection and send offer
    const pc = createPeerConnection(joinedUserId);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      wsRef.current?.send(JSON.stringify({
        type: 'webrtc-offer',
        sessionId,
        targetId: joinedUserId,
        offer
      }));
    } catch (error) {
      console.error('Error creating offer:', error);
    }
    
    addSystemMessage(`${joinedUserName} joined the session`);
  }, [userId, sessionId, createPeerConnection]);
  
  // Handle user left
  const handleUserLeft = useCallback((data: any) => {
    const { userId: leftUserId, userName: leftUserName } = data;
    
    // Close peer connection
    if (peerConnectionsRef.current[leftUserId]) {
      peerConnectionsRef.current[leftUserId].close();
      delete peerConnectionsRef.current[leftUserId];
    }
    
    // Remove from participants
    setParticipants(prev => prev.filter(p => p.id !== leftUserId));
    
    addSystemMessage(`${leftUserName} left the session`);
  }, []);
  
  // Handle WebRTC offer
  const handleOffer = useCallback(async (data: any) => {
    const { senderId, offer } = data;
    
    const pc = createPeerConnection(senderId);
    
    try {
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      wsRef.current?.send(JSON.stringify({
        type: 'webrtc-answer',
        sessionId,
        targetId: senderId,
        answer
      }));
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [sessionId, createPeerConnection]);
  
  // Handle WebRTC answer
  const handleAnswer = useCallback(async (data: any) => {
    const { senderId, answer } = data;
    
    const pc = peerConnectionsRef.current[senderId];
    if (pc) {
      try {
        await pc.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }, []);
  
  // Handle ICE candidate
  const handleIceCandidate = useCallback(async (data: any) => {
    const { senderId, candidate } = data;
    
    const pc = peerConnectionsRef.current[senderId];
    if (pc) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }, []);
  
  // Handle chat message
  const handleChatMessage = useCallback((data: any) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: data.senderId,
      senderName: data.senderName,
      message: data.message,
      timestamp: new Date(data.timestamp),
      type: 'text'
    }]);
  }, []);
  
  // Handle media state changes
  const handleMediaStateChanged = useCallback((data: any) => {
    setParticipants(prev => prev.map(p => 
      p.id === data.userId 
        ? { ...p, isMuted: data.isMuted, hasVideo: data.hasVideo, isScreenSharing: data.isScreenSharing }
        : p
    ));
  }, []);
  
  // Add system message
  const addSystemMessage = useCallback((message: string) => {
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: 'system',
      senderName: 'System',
      message,
      timestamp: new Date(),
      type: 'system'
    }]);
  }, []);
  
  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!localStreamRef.current) {
      await initializeLocalStream(hasVideo, !isMuted);
    } else {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
      }
    }
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // Broadcast state change
    wsRef.current?.send(JSON.stringify({
      type: 'media-state-change',
      sessionId,
      isMuted: newMutedState,
      hasVideo,
      isScreenSharing
    }));
  }, [isMuted, hasVideo, isScreenSharing, sessionId]);
  
  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (!localStreamRef.current || !hasVideo) {
      await initializeLocalStream(!hasVideo, !isMuted);
    } else {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);
      }
    }
    
    const newVideoState = !hasVideo;
    setHasVideo(newVideoState);
    
    wsRef.current?.send(JSON.stringify({
      type: 'media-state-change',
      sessionId,
      isMuted,
      hasVideo: newVideoState,
      isScreenSharing
    }));
  }, [hasVideo, isMuted, isScreenSharing, sessionId]);
  
  // Start screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      // Return to camera if video was on
      if (hasVideo) {
        await initializeLocalStream(true, !isMuted);
      }
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        screenStreamRef.current = screenStream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Replace video tracks in peer connections
        Object.values(peerConnectionsRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender && screenStream.getVideoTracks()[0]) {
            sender.replaceTrack(screenStream.getVideoTracks()[0]);
          }
        });
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (hasVideo) {
            initializeLocalStream(true, !isMuted);
          }
        };
        
      } catch (error) {
        console.error('Error starting screen share:', error);
        toast({
          title: "Screen Share Error",
          description: "Could not start screen sharing",
          variant: "destructive"
        });
        return;
      }
    }
    
    const newScreenShareState = !isScreenSharing;
    setIsScreenSharing(newScreenShareState);
    
    wsRef.current?.send(JSON.stringify({
      type: 'media-state-change',
      sessionId,
      isMuted,
      hasVideo,
      isScreenSharing: newScreenShareState
    }));
  }, [isScreenSharing, hasVideo, isMuted, sessionId]);
  
  // Send chat message
  const sendChatMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    
    wsRef.current?.send(JSON.stringify({
      type: 'chat-message',
      sessionId,
      message: chatInput.trim()
    }));
    
    setChatInput("");
  }, [chatInput, sessionId]);
  
  // Leave session
  const handleLeave = useCallback(() => {
    // Clean up media streams
    cleanupMediaStreams();
    
    // Close peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    
    // Notify server
    wsRef.current?.send(JSON.stringify({
      type: 'leave-session',
      sessionId
    }));
    
    onLeave();
  }, [sessionId, onLeave]);
  
  // Cleanup media streams
  const cleanupMediaStreams = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
  }, []);
  
  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Initialize local stream on mount
  useEffect(() => {
    initializeLocalStream(false, false);
  }, []);
  
  return (
    <div className={`h-screen bg-black text-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Live Session</h2>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connected" : "Connecting..."}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setChatOpen(!chatOpen)}
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </Button>
          
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      
      <div className="flex h-full">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          {/* Local Video */}
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Local Video Overlay */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 rounded-lg p-2">
            <p className="text-sm font-medium">{userName} (You)</p>
            <div className="flex items-center gap-1 mt-1">
              {isScreenSharing && <Monitor className="w-3 h-3 text-blue-400" />}
              {hasVideo ? <Camera className="w-3 h-3 text-green-400" /> : <VideoOff className="w-3 h-3 text-red-400" />}
              {isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-green-400" />}
            </div>
          </div>
          
          {/* Remote Videos Grid */}
          {participants.length > 0 && (
            <div className="absolute top-4 right-4 grid grid-cols-2 gap-2 max-w-md">
              {participants.map(participant => (
                <div key={participant.id} className="relative">
                  <video
                    ref={el => {
                      if (el) remoteVideosRef.current[participant.id] = el;
                    }}
                    autoPlay
                    playsInline
                    className="w-32 h-24 object-cover rounded-lg bg-gray-800"
                  />
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 rounded px-1">
                    <p className="text-xs">{participant.name}</p>
                  </div>
                  <div className="absolute top-1 right-1 flex gap-1">
                    {participant.isScreenSharing && <Monitor className="w-3 h-3 text-blue-400" />}
                    {participant.hasVideo ? <Camera className="w-3 h-3 text-green-400" /> : <VideoOff className="w-3 h-3 text-red-400" />}
                    {participant.isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-green-400" />}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black bg-opacity-50 rounded-lg p-2">
            <Button
              variant={isMuted ? "destructive" : "default"}
              size="sm"
              onClick={toggleMicrophone}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            
            <Button
              variant={hasVideo ? "default" : "secondary"}
              size="sm"
              onClick={toggleVideo}
            >
              {hasVideo ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>
            
            <Button
              variant={isScreenSharing ? "default" : "secondary"}
              size="sm"
              onClick={toggleScreenShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeave}
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Chat Sidebar */}
        {chatOpen && (
          <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Chat ({participants.length + 1})
              </h3>
            </div>
            
            <ScrollArea ref={chatScrollRef} className="flex-1 p-3">
              <div className="space-y-2">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`p-2 rounded ${msg.type === 'system' ? 'bg-gray-700 text-gray-300' : 'bg-gray-800'}`}>
                    {msg.type !== 'system' && (
                      <p className="text-xs text-gray-400 font-medium">{msg.senderName}</p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  className="bg-gray-800 border-gray-600"
                />
                <Button size="sm" onClick={sendChatMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}