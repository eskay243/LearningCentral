import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import useAuth from "@/hooks/useAuth";
import { formatTimeFromNow, getInitials, getFullName } from "@/lib/utils";

const Messages = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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
  
  // Fetch conversations with custom query function that handles auth
  const { data: conversations, isLoading: isConversationsLoading, error: conversationsError } = useQuery({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/conversations", {
          credentials: "include",
        });
        if (response.ok) {
          return await response.json();
        }
        // Return empty array if auth fails instead of throwing
        return [];
      } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }
    },
    enabled: true,
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  
  console.log('Query error:', conversationsError);
  
  // Fetch messages for selected conversation
  const { data: messages, isLoading: isMessagesLoading } = useQuery({
    queryKey: [`/api/conversations/${selectedConversation}/messages`],
    enabled: !!selectedConversation,
  });
  
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
  
  // Filter conversations based on search term
  const filteredConversations = (conversations || []).filter(
    (conv) => {
      const searchableText = conv.title?.toLowerCase() || '';
      return searchableText.includes(searchTerm.toLowerCase());
    }
  );
  
  // Debug log to check data
  console.log('Conversations data:', conversations);
  console.log('Filtered conversations:', filteredConversations);
  
  // Get current conversation
  const currentConversation = filteredConversations.find(
    (conv) => conv.id.toString() === selectedConversation
  );
  
  // Get messages for current conversation
  const currentMessages = messages || [];
  
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    
    // Here you would use a mutation to send the message
    // For now, just clear the input
    setMessageText("");
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
                            {conversation.lastMessageAt ? formatTimeFromNow(conversation.lastMessageAt) : ''}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-1">
                          <p className={`text-sm truncate ${
                            conversation.unreadCount > 0
                              ? "font-medium text-gray-900" 
                              : "text-gray-500"
                          }`}>
                            {conversation.lastMessage || 'No messages yet'}
                          </p>
                          
                          {conversation.unreadCount > 0 && (
                            <Badge className="ml-2 h-5 w-5 flex items-center justify-center p-0 rounded-full">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mt-1">
                          <Badge 
                            variant="outline" 
                            className="text-xs font-normal px-1.5 py-0.5"
                          >
                            {conversation.otherUser.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 border-t border-gray-200">
            <Button className="w-full" variant="outline">
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
                  <AvatarImage src={currentConversation.participants?.[0]?.profileImageUrl} />
                  <AvatarFallback>
                    {getInitials(currentConversation.participants?.[0] ? 
                      `${currentConversation.participants[0].firstName} ${currentConversation.participants[0].lastName}` : 
                      currentConversation.title || 'Unknown')}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="font-medium">
                    {currentConversation.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {currentConversation.participants?.[0]?.role || 'Conversation'}
                  </p>
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
                    {currentMessages.map((message) => (
                      <div 
                        key={message.id}
                        className={`flex ${
                          message.senderId === "currentUser" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div 
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.senderId === "currentUser"
                              ? "bg-primary-600 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === "currentUser" ? "text-primary-100" : "text-gray-500"
                          }`}>
                            {formatTimeFromNow(message.sentAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
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
                  />
                  <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                    Send
                  </Button>
                </div>
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
    </div>
  );
};

export default Messages;
