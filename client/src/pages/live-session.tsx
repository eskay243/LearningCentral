import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Users, 
  MessageCircle, 
  HelpCircle, 
  BarChart3,
  Phone,
  PhoneOff,
  Share2,
  Settings,
  Clock,
  Play,
  Pause,
  Volume2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LiveSession {
  id: number;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  status: string;
  meetingUrl: string;
  recordingUrl?: string;
  provider: string;
  currentAttendance: number;
  maxParticipants: number;
  allowChat: boolean;
  allowScreenShare: boolean;
  createdBy: string;
}

interface ChatMessage {
  id: number;
  message: string;
  sentAt: string;
  senderName: string;
  senderRole: string;
}

interface Question {
  id: number;
  question: string;
  answer?: string;
  askedAt: string;
  answeredAt?: string;
  askedByName: string;
  isAnswered: boolean;
}

interface Poll {
  id: number;
  question: string;
  options: string[];
  results: { answer: string; count: number }[];
  totalResponses: number;
  isActive: boolean;
}

export default function LiveSessionPage() {
  const [match, params] = useRoute("/live-sessions/:id");
  const sessionId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [selectedPoll, setSelectedPoll] = useState<number | null>(null);
  const [pollAnswer, setPollAnswer] = useState("");

  // WebSocket connection
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch session data
  const { data: session, isLoading } = useQuery<LiveSession>({
    queryKey: [`/api/live-sessions/${sessionId}`],
    enabled: !!sessionId,
  });

  // Fetch chat messages
  const { data: chatMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: [`/api/live-sessions/${sessionId}/chat`],
    enabled: !!sessionId && isJoined,
    refetchInterval: 2000,
  });

  // Fetch Q&A
  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: [`/api/live-sessions/${sessionId}/questions`],
    enabled: !!sessionId && isJoined,
    refetchInterval: 3000,
  });

  // Fetch attendance
  const { data: attendance = [] } = useQuery({
    queryKey: [`/api/live-sessions/${sessionId}/attendance`],
    enabled: !!sessionId && isJoined,
    refetchInterval: 5000,
  });

  // Join session mutation
  const joinSessionMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/live-sessions/${sessionId}/join`),
    onSuccess: () => {
      setIsJoined(true);
      toast({
        title: "Joined Session",
        description: "You've successfully joined the live session",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Join Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Leave session mutation
  const leaveSessionMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/live-sessions/${sessionId}/leave`),
    onSuccess: () => {
      setIsJoined(false);
      toast({
        title: "Left Session",
        description: "You've left the live session",
      });
    },
  });

  // Send chat message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => 
      apiRequest("POST", `/api/live-sessions/${sessionId}/chat`, { message }),
    onSuccess: () => {
      setChatMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/live-sessions/${sessionId}/chat`] });
    },
  });

  // Ask question mutation
  const askQuestionMutation = useMutation({
    mutationFn: (question: string) => 
      apiRequest("POST", `/api/live-sessions/${sessionId}/questions`, { question }),
    onSuccess: () => {
      setQuestion("");
      queryClient.invalidateQueries({ queryKey: [`/api/live-sessions/${sessionId}/questions`] });
      toast({
        title: "Question Submitted",
        description: "Your question has been sent to the instructor",
      });
    },
  });

  // Submit poll response mutation
  const submitPollMutation = useMutation({
    mutationFn: ({ pollId, answer }: { pollId: number; answer: string }) => 
      apiRequest("POST", `/api/live-sessions/${sessionId}/polls/${pollId}/respond`, { answer }),
    onSuccess: () => {
      setPollAnswer("");
      setSelectedPoll(null);
      toast({
        title: "Response Submitted",
        description: "Your poll response has been recorded",
      });
    },
  });

  // WebSocket setup for real-time updates
  useEffect(() => {
    if (!sessionId || !isJoined) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'NEW_CHAT_MESSAGE':
          queryClient.invalidateQueries({ queryKey: [`/api/live-sessions/${sessionId}/chat`] });
          break;
        case 'NEW_QUESTION':
          queryClient.invalidateQueries({ queryKey: [`/api/live-sessions/${sessionId}/questions`] });
          break;
        case 'QUESTION_ANSWERED':
          queryClient.invalidateQueries({ queryKey: [`/api/live-sessions/${sessionId}/questions`] });
          break;
        case 'NEW_POLL':
          toast({
            title: "New Poll",
            description: "A new poll has been created",
          });
          break;
        case 'USER_JOINED':
        case 'USER_LEFT':
          queryClient.invalidateQueries({ queryKey: [`/api/live-sessions/${sessionId}/attendance`] });
          break;
        case 'SESSION_STARTED':
          queryClient.invalidateQueries({ queryKey: [`/api/live-sessions/${sessionId}`] });
          toast({
            title: "Session Started",
            description: "The live session has begun",
          });
          break;
        case 'SESSION_ENDED':
          queryClient.invalidateQueries({ queryKey: [`/api/live-sessions/${sessionId}`] });
          toast({
            title: "Session Ended",
            description: "The live session has ended",
          });
          break;
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId, isJoined, queryClient, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Session Not Found</h2>
            <p className="text-gray-600">The requested live session could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Session Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">{session.title}</CardTitle>
                <Badge className={`${getStatusColor(session.status)} text-white`}>
                  {session.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-gray-600 mb-4">{session.description}</p>
              
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(session.scheduledAt).toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {session.currentAttendance} / {session.maxParticipants} participants
                </div>
                <div className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  {session.provider.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {!isJoined ? (
                <Button 
                  onClick={() => joinSessionMutation.mutate()}
                  disabled={joinSessionMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Join Session
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => window.open(session.meetingUrl, '_blank')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Open Meeting
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => leaveSessionMutation.mutate()}
                    disabled={leaveSessionMutation.isPending}
                  >
                    <PhoneOff className="w-4 h-4 mr-2" />
                    Leave
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {isJoined && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="video" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="qa">Q&A</TabsTrigger>
                <TabsTrigger value="polls">Polls</TabsTrigger>
              </TabsList>

              {/* Video Tab */}
              <TabsContent value="video" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                      <div className="text-center text-white">
                        <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Live Session</p>
                        <p className="text-sm opacity-75">Click "Open Meeting" to join the video call</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-4">
                      <Button
                        variant={isMuted ? "destructive" : "secondary"}
                        size="sm"
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant={isVideoOff ? "destructive" : "secondary"}
                        size="sm"
                        onClick={() => setIsVideoOff(!isVideoOff)}
                      >
                        {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                      </Button>
                      <Button variant="secondary" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="secondary" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Live Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96 mb-4">
                      <div className="space-y-3">
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className="flex gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{msg.senderName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {msg.senderRole}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(msg.sentAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm">{msg.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && chatMessage.trim()) {
                            sendMessageMutation.mutate(chatMessage);
                          }
                        }}
                      />
                      <Button
                        onClick={() => sendMessageMutation.mutate(chatMessage)}
                        disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                      >
                        Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Q&A Tab */}
              <TabsContent value="qa" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      Questions & Answers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Textarea
                        placeholder="Ask a question..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="mb-2"
                      />
                      <Button
                        onClick={() => askQuestionMutation.mutate(question)}
                        disabled={!question.trim() || askQuestionMutation.isPending}
                      >
                        Ask Question
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-80">
                      <div className="space-y-4">
                        {questions.map((q) => (
                          <div key={q.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium">{q.question}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm text-gray-500">by {q.askedByName}</span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(q.askedAt).toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                              <Badge variant={q.isAnswered ? "default" : "secondary"}>
                                {q.isAnswered ? "Answered" : "Pending"}
                              </Badge>
                            </div>
                            
                            {q.answer && (
                              <div className="mt-3 p-3 bg-gray-50 rounded">
                                <p className="text-sm font-medium text-gray-700 mb-1">Answer:</p>
                                <p className="text-sm">{q.answer}</p>
                                {q.answeredAt && (
                                  <span className="text-xs text-gray-500">
                                    Answered at {new Date(q.answeredAt).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Polls Tab */}
              <TabsContent value="polls" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Live Polls
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No active polls at the moment</p>
                      <p className="text-sm text-gray-400">Polls will appear here when the instructor creates them</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participants ({session.currentAttendance})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={(session.currentAttendance / session.maxParticipants) * 100} 
                  className="mb-4"
                />
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {attendance.map((attendee: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded border">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm font-medium">{attendee.userName}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {attendee.userRole}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-sm">{session.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Provider</p>
                  <p className="text-sm">{session.provider.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Features</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {session.allowChat && <Badge variant="secondary" className="text-xs">Chat</Badge>}
                    {session.allowScreenShare && <Badge variant="secondary" className="text-xs">Screen Share</Badge>}
                    <Badge variant="secondary" className="text-xs">Q&A</Badge>
                    <Badge variant="secondary" className="text-xs">Polls</Badge>
                  </div>
                </div>
                {session.recordingUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recording</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-1"
                      onClick={() => window.open(session.recordingUrl, '_blank')}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Watch Recording
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}