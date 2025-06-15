import { useLocation } from 'wouter';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  ArrowLeft, 
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { Link } from 'wouter';

export default function MessagesPage() {
  const [location] = useLocation();
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Extract user ID from query params if present
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const selectedUserId = urlParams.get('user');

  // Mock conversations data
  const conversations = [
    {
      id: '1',
      participantId: 'user1',
      participantName: 'Alice Johnson',
      participantEmail: 'alice@example.com',
      participantRole: 'student',
      lastMessage: 'Thank you for the feedback on my assignment!',
      timestamp: '2 hours ago',
      unreadCount: 0,
      isOnline: true
    },
    {
      id: '2',
      participantId: 'user2',
      participantName: 'Bob Smith',
      participantEmail: 'bob@example.com',
      participantRole: 'student',
      lastMessage: 'Could you help me with the JavaScript exercise?',
      timestamp: '1 day ago',
      unreadCount: 2,
      isOnline: false
    },
    {
      id: '3',
      participantId: 'user3',
      participantName: 'Carol Wilson',
      participantEmail: 'carol@example.com',
      participantRole: 'student',
      lastMessage: 'Great explanation in today\'s session!',
      timestamp: '2 days ago',
      unreadCount: 0,
      isOnline: true
    }
  ];

  // Mock messages for selected conversation
  const messages = [
    {
      id: '1',
      senderId: 'user2',
      senderName: 'Bob Smith',
      content: 'Hi! I\'m having trouble with the JavaScript exercise you assigned.',
      timestamp: '10:30 AM',
      isCurrentUser: false
    },
    {
      id: '2',
      senderId: 'current-user',
      senderName: 'You',
      content: 'Hi Bob! I\'d be happy to help. Which specific part are you struggling with?',
      timestamp: '10:35 AM',
      isCurrentUser: true
    },
    {
      id: '3',
      senderId: 'user2',
      senderName: 'Bob Smith',
      content: 'I can\'t figure out how to implement the array methods. The filter function isn\'t working as expected.',
      timestamp: '10:37 AM',
      isCurrentUser: false
    },
    {
      id: '4',
      senderId: 'current-user',
      senderName: 'You',
      content: 'Let\'s take a look at your code. Can you share what you have so far? The filter method should return a new array with elements that pass the test.',
      timestamp: '10:40 AM',
      isCurrentUser: true
    }
  ];

  const selectedConversation = conversations.find(c => c.participantId === selectedUserId) || conversations[0];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message via API
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/mentors">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mentors
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversations
              </span>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </CardTitle>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => {
                    // In a real app, this would update the selected conversation
                    console.log('Selected conversation:', conversation.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {conversation.participantName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm truncate">
                          {conversation.participantName}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {conversation.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {conversation.participantRole}
                        </Badge>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {selectedConversation?.participantName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedConversation?.participantName}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedConversation?.participantRole}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {selectedConversation?.participantEmail}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${message.isCurrentUser ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.isCurrentUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <p className={`text-xs text-muted-foreground mt-1 ${
                      message.isCurrentUser ? 'text-right' : 'text-left'
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex items-end gap-2">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={2}
                className="resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}