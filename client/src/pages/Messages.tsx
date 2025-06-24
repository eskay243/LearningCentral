import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import useAuth from "@/hooks/useAuth";
import { formatTimeFromNow, getInitials, getFullName } from "@/lib/utils";
import { Paperclip, Download, FileText, Image, Video, Music, Archive, X } from "lucide-react";

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [newMessageTitle, setNewMessageTitle] = useState("");
  const [newMessageContent, setNewMessageContent] = useState("");
  
  // File attachment states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Use fallback user for rendering
  const currentUser = user || {
    id: 'demo-user',
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@example.com',
    role: 'student'
  };
  
  // Handle URL parameters for conversation selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversation');
    if (conversationId) {
      setSelectedConversation(conversationId);
    }
  }, []);
  
  // Fetch conversations directly with useEffect
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        console.log('Fetching conversations from /api/conversations...');
        setIsConversationsLoading(true);
        const response = await fetch("/api/conversations", {
          credentials: "include",
        });
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Successfully fetched conversations:', data);
          console.log('Setting conversations state to:', data || []);
          setConversations(data || []);
          console.log('State should be updated now');
        } else {
          console.log('Response not ok, status:', response.status);
          const errorText = await response.text();
          console.log('Error response:', errorText);
          setConversations([]);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setConversations([]);
      } finally {
        setIsConversationsLoading(false);
      }
    };

    fetchConversations();
  }, []);
  
  // Debug effect to track conversations state changes
  useEffect(() => {
    console.log('Conversations state changed:', conversations);
    console.log('Length:', conversations.length);
  }, [conversations]);
  
  // Fetch messages for selected conversation using direct state
  const [messages, setMessages] = useState<any[]>([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  
  useEffect(() => {
    if (!selectedConversation) return;
    
    const fetchMessages = async () => {
      try {
        setIsMessagesLoading(true);
        console.log(`Fetching messages for conversation ${selectedConversation}`);
        const response = await fetch(`/api/messages/conversations/${selectedConversation}`, {
          credentials: "include",
        });
        
        console.log('Messages response status:', response.status);
        console.log('Messages response ok:', response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Successfully fetched messages:', data);
          setMessages(data || []);
        } else {
          console.log('Messages response not ok, status:', response.status);
          const errorText = await response.text();
          console.log('Messages error response:', errorText);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } finally {
        setIsMessagesLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversation]);
  
  // Mock data for development
  const mockConversations = [
    {
      id: "conv1",
      otherUser: {
        id: "user1",
        firstName: "Emma",
        lastName: "Johnson",
        profileImageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        role: "student"
      },
      lastMessage: {
        id: "msg1",
        content: "Hi, I have a question about the JavaScript course",
        sentAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        senderId: "user1",
        isRead: false
      },
      unreadCount: 1
    },
    {
      id: "conv2",
      otherUser: {
        id: "user2",
        firstName: "Alex",
        lastName: "Chen",
        profileImageUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        role: "student"
      },
      lastMessage: {
        id: "msg2",
        content: "Thank you for the detailed feedback on my assignment",
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        senderId: "user2",
        isRead: true
      },
      unreadCount: 0
    },
    {
      id: "conv3",
      otherUser: {
        id: "user3",
        firstName: "Sophia",
        lastName: "Martinez",
        profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        role: "student"
      },
      lastMessage: {
        id: "msg3",
        content: "When is the next live session for Python course?",
        sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        senderId: "user3",
        isRead: true
      },
      unreadCount: 0
    },
    {
      id: "conv4",
      otherUser: {
        id: "user4",
        firstName: "David",
        lastName: "Kim",
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        role: "student"
      },
      lastMessage: {
        id: "msg4",
        content: "I've submitted my final project for review",
        sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        senderId: "user4",
        isRead: true
      },
      unreadCount: 0
    },
    {
      id: "conv5",
      otherUser: {
        id: "user5",
        firstName: "James",
        lastName: "Wilson",
        profileImageUrl: "",
        role: "mentor"
      },
      lastMessage: {
        id: "msg5",
        content: "Can you review the new course material I've prepared?",
        sentAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        senderId: "user5",
        isRead: false
      },
      unreadCount: 3
    },
  ];
  
  const mockMessages = [
    {
      id: "msg1",
      conversationId: "conv1",
      senderId: "user1",
      content: "Hi, I have a question about the JavaScript course",
      sentAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: "msg2",
      conversationId: "conv1",
      senderId: "currentUser",
      content: "Sure, what would you like to know?",
      sentAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: "msg3",
      conversationId: "conv1",
      senderId: "user1",
      content: "I'm having trouble understanding closures in JavaScript. Could you explain them in a simpler way?",
      sentAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: "msg4",
      conversationId: "conv1",
      senderId: "currentUser",
      content: "Of course! Closures are functions that remember the environment in which they were created. Think of it like a function that keeps a backpack of variables it had access to when it was defined, and it can use these variables later even when executed elsewhere.",
      sentAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: "msg5",
      conversationId: "conv1",
      senderId: "user1",
      content: "That makes more sense now, thank you! Do you have any examples I could look at?",
      sentAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      isRead: false
    },
  ];
  
  // Set first conversation as selected by default when data loads
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id.toString());
    }
  }, [conversations, selectedConversation]);
  
  // Filter conversations based on search term - ensure conversations is an array
  const conversationsArray = Array.isArray(conversations) ? conversations : [];
  const filteredConversations = conversationsArray.filter(
    (conv) => {
      const searchableText = conv.title?.toLowerCase() || '';
      return searchableText.includes(searchTerm.toLowerCase());
    }
  );
  
  // Debug log to check data - moved to useEffect to avoid render loops
  
  // Get current conversation
  const currentConversation = filteredConversations.find(
    (conv) => conv.id.toString() === selectedConversation
  );
  
  // Get messages for current conversation
  const currentMessages = messages || [];
  
  // File upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const fileInfo = await response.json();
        setUploadedFileInfo(fileInfo);
        setSelectedFile(null);
        toast({
          title: "File uploaded",
          description: `${fileInfo.originalName} is ready to send`,
        });
      } else {
        toast({
          title: "Upload failed",
          description: "Failed to upload file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !uploadedFileInfo) || !selectedConversation) return;
    
    try {
      const payload: any = {
        conversationId: parseInt(selectedConversation),
      };

      if (messageText.trim()) {
        payload.content = messageText;
      }

      if (uploadedFileInfo) {
        payload.attachmentUrl = uploadedFileInfo.url;
        payload.attachmentName = uploadedFileInfo.originalName;
        payload.attachmentSize = uploadedFileInfo.size;
        payload.attachmentType = uploadedFileInfo.mimeType;
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        setMessageText("");
        setUploadedFileInfo(null);
        setSelectedFile(null);
        
        // Refresh messages
        const messagesResponse = await fetch(`/api/messages/conversations/${selectedConversation}`, {
          credentials: "include",
        });
        if (messagesResponse.ok) {
          const updatedMessages = await messagesResponse.json();
          setMessages(updatedMessages || []);
        }
      } else {
        toast({
          title: "Send failed",
          description: "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Send failed",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAttachment = () => {
    setUploadedFileInfo(null);
    setSelectedFile(null);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="w-4 h-4" />;
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return <Archive className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleNewMessage = () => {
    setShowNewMessageModal(true);
    // Fetch available users
    fetchAvailableUsers();
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/messaging/available-users', {
        credentials: 'include',
      });
      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users || []);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleCreateConversation = async () => {
    if (!newMessageContent.trim() || selectedRecipients.length === 0) return;
    
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipients: selectedRecipients,
          title: newMessageTitle || null,
          content: newMessageContent,
          type: 'individual',
        }),
      });
      
      if (response.ok) {
        const conversation = await response.json();
        setShowNewMessageModal(false);
        setNewMessageTitle("");
        setNewMessageContent("");
        setSelectedRecipients([]);
        setSelectedConversation(conversation.id.toString());
        // Refresh conversations
        fetchConversations();
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };
  
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-800">Messages</h1>
        <p className="mt-1 text-gray-500">Communicate with your students and colleagues</p>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col md:flex-row h-[calc(100vh-12rem)]">
        {/* Conversation List */}
        <div className="w-full md:w-80 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <ScrollArea className="flex-grow">
            {isConversationsLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No conversations found
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedConversation === conversation.id.toString() 
                        ? "bg-primary-50" 
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedConversation(conversation.id.toString())}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversation.participants?.[0]?.profileImageUrl} />
                        <AvatarFallback>
                          {getInitials(conversation.participants?.[0] ? 
                            `${conversation.participants[0].firstName} ${conversation.participants[0].lastName}` : 
                            conversation.title || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium truncate">
                            {conversation.title}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {conversation.lastMessage?.sentAt ? formatTimeFromNow(conversation.lastMessage.sentAt) : ''}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-1">
                          <p className={`text-sm truncate ${
                            conversation.unreadCount > 0
                              ? "font-medium text-gray-900" 
                              : "text-gray-500"
                          }`}>
                            {conversation.lastMessage?.content || 'No messages yet'}
                          </p>
                          
                          {conversation.unreadCount > 0 && (
                            <Badge className="ml-2 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mt-1 space-y-1">
                          {conversation.otherUser && (
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">
                                {conversation.otherUser.firstName} {conversation.otherUser.lastName}
                              </span>
                              <span className="text-gray-500 ml-1">
                                ({conversation.otherUser.role})
                              </span>
                            </div>
                          )}
                          {conversation.participants && conversation.participants.length > 2 && (
                            <div className="text-xs text-gray-500">
                              {conversation.participants.length} participants
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 border-t border-gray-200">
            <Button className="w-full" variant="outline" onClick={handleNewMessage}>
              <i className="ri-add-line mr-2"></i>
              New Message
            </Button>
          </div>
        </div>
        
        {/* Message Thread */}
        <div className="flex-grow flex flex-col">
          {selectedConversation && currentConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-gray-200 flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={currentConversation.otherUser?.profileImageUrl} />
                  <AvatarFallback>
                    {currentConversation.otherUser ? 
                      getInitials(`${currentConversation.otherUser.firstName} ${currentConversation.otherUser.lastName}`) : 
                      getInitials(currentConversation.title || 'Unknown')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-grow">
                  <h3 className="font-medium">
                    {currentConversation.title}
                  </h3>
                  {currentConversation.otherUser ? (
                    <div className="text-sm text-gray-500">
                      <div>{currentConversation.otherUser.firstName} {currentConversation.otherUser.lastName}</div>
                      <div className="text-xs">{currentConversation.otherUser.email} • {currentConversation.otherUser.role}</div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {currentConversation.participants?.length || 0} participants
                    </p>
                  )}
                </div>
              </div>
              
              {/* Messages */}
              <ScrollArea className="flex-grow p-4">
                {isMessagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : currentMessages.length === 0 ? (
                  <div className="text-center text-gray-500 h-full flex items-center justify-center">
                    <div>
                      <p>No messages yet</p>
                      <p className="text-sm mt-1">Start the conversation by sending a message</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentMessages.map((message) => {
                      const isCurrentUser = message.senderId === user?.id;
                      const sender = message.sender;
                      
                      return (
                        <div 
                          key={message.id}
                          className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[70%] ${!isCurrentUser ? "flex gap-2" : ""}`}>
                            {!isCurrentUser && (
                              <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                                <AvatarImage src={sender?.profileImageUrl} />
                                <AvatarFallback className="text-xs">
                                  {sender ? getInitials(`${sender.firstName} ${sender.lastName}`) : "?"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div className="flex-grow">
                              {!isCurrentUser && sender && (
                                <div className="mb-1">
                                  <p className="text-xs text-gray-600 font-medium">
                                    {sender.firstName} {sender.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {sender.email} • {sender.role}
                                  </p>
                                </div>
                              )}
                              
                              <div 
                                className={`rounded-lg px-4 py-2 ${
                                  isCurrentUser
                                    ? "bg-primary-600 text-white"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {message.attachmentUrl ? (
                                  <div className="space-y-2">
                                    {/* File attachment display */}
                                    <div className={`flex items-center gap-2 p-2 rounded border ${
                                      isCurrentUser 
                                        ? "bg-primary-700 border-primary-500" 
                                        : "bg-white border-gray-200"
                                    }`}>
                                      {getFileIcon(message.attachmentType || 'application/octet-stream')}
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${
                                          isCurrentUser ? "text-white" : "text-gray-900"
                                        }`}>
                                          {message.attachmentName || 'File attachment'}
                                        </p>
                                        {message.attachmentSize && (
                                          <p className={`text-xs ${
                                            isCurrentUser ? "text-primary-200" : "text-gray-500"
                                          }`}>
                                            {formatFileSize(message.attachmentSize)}
                                          </p>
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const link = document.createElement('a');
                                          link.href = message.attachmentUrl;
                                          link.download = message.attachmentName || 'download';
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }}
                                        className={`p-1 h-6 w-6 ${
                                          isCurrentUser 
                                            ? "text-white hover:bg-primary-800" 
                                            : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                      >
                                        <Download className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    
                                    {/* Message text if present */}
                                    {message.content && !message.content.startsWith('📎') && (
                                      <p>{message.content}</p>
                                    )}
                                  </div>
                                ) : (
                                  <p>{message.content}</p>
                                )}
                                
                                <p className={`text-xs mt-1 ${
                                  isCurrentUser ? "text-primary-100" : "text-gray-500"
                                }`}>
                                  {formatTimeFromNow(message.sentAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              
              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                {/* File attachment preview */}
                {uploadedFileInfo && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getFileIcon(uploadedFileInfo.mimeType)}
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            {uploadedFileInfo.originalName}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {formatFileSize(uploadedFileInfo.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAttachment}
                        className="text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Selected file preview */}
                {selectedFile && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getFileIcon(selectedFile.type)}
                        <div>
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleFileUpload}
                          disabled={isUploading}
                          className="text-xs"
                        >
                          {isUploading ? "Uploading..." : "Upload"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="pr-12"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8"
                      disabled={isUploading}
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={(!messageText.trim() && !uploadedFileInfo) || isUploading}
                  >
                    Send
                  </Button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <i className="ri-message-3-line text-4xl mb-2"></i>
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* New Message Modal */}
      <Dialog open={showNewMessageModal} onOpenChange={setShowNewMessageModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Subject (Optional)</Label>
              <Input
                id="title"
                value={newMessageTitle}
                onChange={(e) => setNewMessageTitle(e.target.value)}
                placeholder="Enter message subject"
              />
            </div>
            
            <div>
              <Label>Recipients</Label>
              <ScrollArea className="h-32 border rounded p-2">
                {availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={user.id}
                      checked={selectedRecipients.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRecipients([...selectedRecipients, user.id]);
                        } else {
                          setSelectedRecipients(selectedRecipients.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <label htmlFor={user.id} className="text-sm">
                      {user.firstName} {user.lastName} ({user.role})
                    </label>
                  </div>
                ))}
              </ScrollArea>
            </div>
            
            <div>
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNewMessageModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateConversation}
                disabled={!newMessageContent.trim() || selectedRecipients.length === 0}
              >
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
