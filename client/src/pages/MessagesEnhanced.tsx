import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { ThreadedMessage } from '@/components/chat/ThreadedMessage';
import { RichTextEditor } from '@/components/chat/RichTextEditor';
import { MessageSearch } from '@/components/chat/MessageSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
  SheetDescription, SheetFooter, SheetClose
} from '@/components/ui/sheet';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog';
import { ChatMessage, Conversation } from '@shared/schema';
import { 
  Search, 
  Edit,
  Users,
  Plus,
  Send,
  User,
  UsersRound,
  Loader2
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useLocation, Link } from 'wouter';

export default function MessagesEnhanced() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useLocation();
  
  // State for conversation management
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [attachment, setAttachment] = useState<{url: string, name: string, type: string} | null>(null);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  
  // Get conversations
  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['/api/messages/conversations'],
    queryFn: async () => {
      const res = await fetch('/api/messages/conversations');
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
  });

  // Get messages for active conversation
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/messages/conversations', activeConversationId],
    queryFn: async () => {
      if (!activeConversationId) return [];
      const res = await fetch(`/api/messages/conversations/${activeConversationId}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    enabled: !!activeConversationId,
  });

  // Get users for new conversation
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: newConversationOpen,
  });

  // WebSocket connection
  const { 
    isConnected,
    joinConversation,
    sendChatMessage,
    markMessageRead,
    sendTypingIndicator,
    addReaction,
    removeReaction
  } = useWebSocket({
    onMessage: (type, payload) => {
      switch (type) {
        case 'new_message':
          // Update messages cache with new message
          queryClient.setQueryData(
            ['/api/messages/conversations', payload.conversationId],
            (old: ChatMessage[] = []) => [...old, payload]
          );
          
          // Update conversation list to show latest message
          queryClient.setQueryData(
            ['/api/messages/conversations'],
            (old: Conversation[] = []) => {
              const updatedConversations = [...old];
              const conversationIndex = updatedConversations.findIndex(c => c.id === payload.conversationId);
              
              if (conversationIndex !== -1) {
                const conversation = updatedConversations[conversationIndex];
                updatedConversations.splice(conversationIndex, 1);
                updatedConversations.unshift({
                  ...conversation,
                  lastMessage: payload,
                  unreadCount: activeConversationId === payload.conversationId ? 0 : (conversation.unreadCount || 0) + 1
                });
              }
              
              return updatedConversations;
            }
          );
          
          // Scroll to bottom if in active conversation
          if (activeConversationId === payload.conversationId) {
            scrollToBottom();
            // Mark as read
            markMessageRead(payload.conversationId, payload.id);
          } else {
            // Show notification for other conversations
            toast({
              title: 'New message',
              description: `You have a new message in ${conversations?.find(c => c.id === payload.conversationId)?.title || 'a conversation'}`,
            });
          }
          break;
          
        case 'message_read':
          // Update messages to show read status
          if (payload.conversationId === activeConversationId) {
            queryClient.setQueryData(
              ['/api/messages/conversations', activeConversationId],
              (old: ChatMessage[] = []) => {
                return old.map(message => 
                  message.id <= payload.messageId && message.senderId === user?.id
                    ? { ...message, isRead: true }
                    : message
                );
              }
            );
          }
          break;
          
        case 'typing_indicator':
          // Update conversation to show typing status
          queryClient.setQueryData(
            ['/api/messages/conversations'],
            (old: Conversation[] = []) => {
              return old.map(conversation => 
                conversation.id === payload.conversationId
                  ? { 
                      ...conversation, 
                      typingUsers: payload.isTyping 
                        ? [...(conversation.typingUsers || []), payload.userId]
                        : (conversation.typingUsers || []).filter(id => id !== payload.userId)
                    }
                  : conversation
              );
            }
          );
          break;
          
        case 'message_reaction_added':
        case 'message_reaction_removed':
          // Update message reactions
          if (payload.messageId) {
            queryClient.setQueryData(
              ['/api/messages/conversations', activeConversationId],
              (old: ChatMessage[] = []) => {
                return old.map(message => {
                  if (message.id === payload.messageId) {
                    const reactions = message.reactions || [];
                    
                    if (type === 'message_reaction_added') {
                      // Add reaction
                      const existingReaction = reactions.find(r => r.emoji === payload.reaction);
                      if (existingReaction) {
                        // Update existing reaction
                        return {
                          ...message,
                          reactions: reactions.map(r => 
                            r.emoji === payload.reaction
                              ? { 
                                  ...r, 
                                  count: r.count + 1, 
                                  userIds: [...r.userIds, payload.userId]
                                }
                              : r
                          )
                        };
                      } else {
                        // Add new reaction
                        return {
                          ...message,
                          reactions: [
                            ...reactions,
                            { emoji: payload.reaction, count: 1, userIds: [payload.userId] }
                          ]
                        };
                      }
                    } else {
                      // Remove reaction
                      return {
                        ...message,
                        reactions: reactions.map(r => 
                          r.emoji === payload.reaction
                            ? { 
                                ...r, 
                                count: r.count - 1, 
                                userIds: r.userIds.filter(id => id !== payload.userId)
                              }
                            : r
                        ).filter(r => r.count > 0)
                      };
                    }
                  }
                  return message;
                });
              }
            );
          }
          break;
      }
    }
  });

  // Handle active conversation change
  useEffect(() => {
    if (activeConversationId) {
      // Join conversation via WebSocket
      joinConversation(activeConversationId);
      
      // Reset reply state
      setReplyToMessage(null);
      
      // Reset attachment
      setAttachment(null);
      
      // Extract and set conversation ID from URL parameter
      const conversationIdParam = new URLSearchParams(location).get('id');
      if (conversationIdParam !== activeConversationId.toString()) {
        setLocation(`/messages?id=${activeConversationId}`);
      }
      
      // Update conversation list to mark as read
      queryClient.setQueryData(
        ['/api/messages/conversations'],
        (old: Conversation[] = []) => {
          return old.map(conversation => 
            conversation.id === activeConversationId
              ? { ...conversation, unreadCount: 0 }
              : conversation
          );
        }
      );
    }
  }, [activeConversationId, joinConversation, location, setLocation, queryClient]);

  // Handle URL param change
  useEffect(() => {
    const conversationIdParam = new URLSearchParams(location).get('id');
    if (conversationIdParam && (!activeConversationId || activeConversationId.toString() !== conversationIdParam)) {
      setActiveConversationId(parseInt(conversationIdParam));
    }
  }, [location, activeConversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!activeConversationId || (!newMessage.trim() && !attachment)) return;
    
    // Send message via WebSocket for real-time delivery
    sendChatMessage(
      activeConversationId, 
      newMessage.trim(),
      {
        contentType: attachment?.type ? 'rich' : 'text',
        attachmentUrl: attachment?.url,
        replyToId: replyToMessage?.id
      }
    );
    
    // Reset after sending
    setNewMessage('');
    setReplyToMessage(null);
    setAttachment(null);
  };

  // Handle file attachment
  const handleFileAttached = (fileUrl: string, fileName: string, fileType: string) => {
    setAttachment({
      url: fileUrl,
      name: fileName,
      type: fileType
    });
  };

  // Handle creating a new conversation
  const handleCreateConversation = async () => {
    if (selectedParticipants.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one participant',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const result = await apiRequest('POST', '/api/messages/conversations', {
        participantIds: selectedParticipants,
        title: newConversationTitle || null,
        initialMessage: newMessage || null,
      });
      
      const newConversation = await result.json();
      
      // Invalidate conversations query to show the new one
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      
      // Set active conversation to the new one
      setActiveConversationId(newConversation.id);
      
      // Reset states
      setNewConversationOpen(false);
      setSelectedParticipants([]);
      setNewConversationTitle('');
      setNewMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive',
      });
    }
  };

  // Handle message search
  const handleMessageSearch = (message: ChatMessage) => {
    // Set active conversation to the one containing the message
    setActiveConversationId(message.conversationId);
    
    // Close search
    setSearchOpen(false);
    
    // Highlight the message (could implement scrolling to the message)
    // This would require additional logic to find the message in the list
  };

  // Get user display name
  const getUserDisplayName = (userId: string) => {
    const user = users?.find(u => u.id === userId);
    if (!user) return 'Unknown User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User';
  };

  // Get conversation display name
  const getConversationDisplayName = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;
    
    // For direct messages, show the other participant's name
    if (conversation.participants && !conversation.isGroup) {
      const otherParticipant = conversation.participants.find(p => p.userId !== user?.id);
      if (otherParticipant) return getUserDisplayName(otherParticipant.userId);
    }
    
    return 'Conversation';
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (activeConversationId) {
      sendTypingIndicator(activeConversationId, true);
      
      // Reset typing status after 2 seconds of inactivity
      setTimeout(() => {
        sendTypingIndicator(activeConversationId, false);
      }, 2000);
    }
  };

  // If not authenticated, redirect to login
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access messages</h1>
          <Button asChild>
            <Link href="/api/login">Log In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar with conversations list */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Messages</h1>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSearchOpen(true)}
                title="Search messages"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setNewConversationOpen(true)}
                title="New conversation"
              >
                <Edit className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <Input 
            placeholder="Search conversations..." 
            className="w-full"
          />
        </div>
        
        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : conversations?.length > 0 ? (
            <div className="divide-y">
              {conversations.map((conversation: any) => (
                <div 
                  key={conversation.id}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    activeConversationId === conversation.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setActiveConversationId(conversation.id)}
                >
                  <div className="flex items-start space-x-3">
                    {conversation.isGroup ? (
                      <div className="relative h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                        <UsersRound className="h-5 w-5" />
                      </div>
                    ) : (
                      <Avatar className="h-10 w-10">
                        {conversation.participants?.[0]?.profileImageUrl ? (
                          <AvatarImage src={conversation.participants[0].profileImageUrl} />
                        ) : (
                          <AvatarFallback>
                            {getConversationDisplayName(conversation).substring(0, 2)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">
                          {getConversationDisplayName(conversation)}
                        </h3>
                        {conversation.lastMessage?.sentAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(conversation.lastMessage.sentAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.typingUsers?.length > 0 ? (
                            <span className="italic">Typing...</span>
                          ) : conversation.lastMessage ? (
                            conversation.lastMessage.content || 'Attachment'
                          ) : (
                            'No messages yet'
                          )}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="rounded-full px-2">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="font-medium">No conversations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start a new conversation to begin messaging
              </p>
              <Button onClick={() => setNewConversationOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Conversation
              </Button>
            </div>
          )}
        </div>
        
        {/* Connection status */}
        <div className="p-2 border-t flex items-center">
          <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeConversationId ? (
          <>
            {/* Conversation header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center">
                {conversations?.find(c => c.id === activeConversationId)?.isGroup ? (
                  <div className="mr-2 h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                    <UsersRound className="h-4 w-4" />
                  </div>
                ) : (
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>
                      {getConversationDisplayName(conversations?.find(c => c.id === activeConversationId))?.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <h2 className="font-medium">
                    {conversations?.find(c => c.id === activeConversationId)?.title || 
                      getConversationDisplayName(conversations?.find(c => c.id === activeConversationId))}
                  </h2>
                  <div className="text-xs text-muted-foreground">
                    {conversations?.find(c => c.id === activeConversationId)?.participants?.length} participants
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  title="Search in conversation"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Messages list */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingMessages ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : messages?.length > 0 ? (
                <div>
                  {messages.map((message: any) => (
                    <ThreadedMessage
                      key={message.id}
                      message={message}
                      currentUserId={user.id}
                      onReply={(messageId) => {
                        const replyMessage = messages.find(m => m.id === messageId);
                        if (replyMessage) {
                          setReplyToMessage(replyMessage);
                        }
                      }}
                      onAddReaction={(messageId, emoji) => addReaction(messageId, emoji)}
                      onRemoveReaction={(messageId, emoji) => removeReaction(messageId, emoji)}
                      isOwnMessage={message.senderId === user.id}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="max-w-md text-center">
                    <h3 className="font-medium mb-2">No messages yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Send a message to start the conversation
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Reply indicator */}
            {replyToMessage && (
              <div className="px-4 py-2 bg-muted border-t flex items-center justify-between">
                <div className="flex items-center">
                  <div className="border-l-2 border-primary pl-2">
                    <div className="text-xs font-medium">
                      Replying to {replyToMessage.senderId === user.id ? 'yourself' : (replyToMessage.senderName || 'Unknown')}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {replyToMessage.content}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => setReplyToMessage(null)}
                >
                  <Plus className="h-4 w-4 rotate-45" />
                </Button>
              </div>
            )}
            
            {/* Message input */}
            <div className="p-4 border-t">
              <RichTextEditor
                value={newMessage}
                onChange={(value) => {
                  setNewMessage(value);
                  handleTyping();
                }}
                onSend={handleSendMessage}
                onTypingStateChange={(isTyping) => {
                  if (activeConversationId) {
                    sendTypingIndicator(activeConversationId, isTyping);
                  }
                }}
                attachment={attachment}
                onAttachment={handleFileAttached}
                placeholder="Type a message..."
              />
              
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-muted-foreground">
                  {conversations?.find(c => c.id === activeConversationId)?.typingUsers?.length > 0 && (
                    <span className="italic">Someone is typing...</span>
                  )}
                </div>
                <Button 
                  size="sm" 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() && !attachment}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="max-w-md text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4 mx-auto" />
              <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
              <p className="text-muted-foreground mb-4">
                Select a conversation or start a new one to begin messaging
              </p>
              <Button onClick={() => setNewConversationOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* New conversation dialog */}
      <Sheet 
        open={newConversationOpen} 
        onOpenChange={setNewConversationOpen}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New Conversation</SheetTitle>
            <SheetDescription>
              Create a new conversation with one or more users
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6">
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users">Select Users</TabsTrigger>
                <TabsTrigger value="details">Conversation Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="mt-4 space-y-4">
                <Input placeholder="Search users..." className="mb-4" />
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {isLoadingUsers ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    (users || [])
                      .filter((u: any) => u.id !== user?.id)
                      .map((user: any) => (
                        <div 
                          key={user.id}
                          className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                          onClick={() => {
                            setSelectedParticipants(prev => 
                              prev.includes(user.id)
                                ? prev.filter(id => id !== user.id)
                                : [...prev, user.id]
                            );
                          }}
                        >
                          <div className={`w-5 h-5 border rounded-sm flex items-center justify-center ${
                            selectedParticipants.includes(user.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-input'
                          }`}>
                            {selectedParticipants.includes(user.id) && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                                <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                              </svg>
                            )}
                          </div>
                          
                          <Avatar className="h-8 w-8">
                            {user.profileImageUrl ? (
                              <AvatarImage src={user.profileImageUrl} alt={user.firstName || 'User'} />
                            ) : (
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email || ''}
                            </p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="mt-4 space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Group Name (optional)</label>
                    <Input 
                      placeholder="Enter a name for this group"
                      value={newConversationTitle}
                      onChange={(e) => setNewConversationTitle(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave blank for direct messages
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Message (optional)</label>
                    <RichTextEditor
                      value={newMessage}
                      onChange={setNewMessage}
                      onSend={() => {}}
                      attachment={null}
                      onAttachment={() => {}}
                      placeholder="Type your first message..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selected Participants ({selectedParticipants.length})</label>
                    {selectedParticipants.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedParticipants.map(id => {
                          const user = users?.find((u: any) => u.id === id);
                          return (
                            <Badge key={id} variant="secondary" className="flex items-center gap-1">
                              {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown User'}
                              <button
                                onClick={() => setSelectedParticipants(prev => prev.filter(p => p !== id))}
                                className="ml-1 rounded-full hover:bg-muted"
                              >
                                <Plus className="h-3 w-3 rotate-45" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No participants selected
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <SheetFooter>
            <Button 
              variant="outline" 
              onClick={() => setNewConversationOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={selectedParticipants.length === 0}
            >
              Create Conversation
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      {/* Message search dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Messages</DialogTitle>
            <DialogDescription>
              Search through all your messages
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <MessageSearch onMessageSelect={handleMessageSearch} />
          </div>
          
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => setSearchOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}