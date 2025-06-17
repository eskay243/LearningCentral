import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Send,
  Users,
  UserCheck,
  Globe,
  Search,
  Plus,
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: number;
  title: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  participants: Array<{
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  }>;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export function MessageCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [recipientType, setRecipientType] = useState<'individual' | 'course' | 'sitewide'>('individual');
  const [selectedCourse, setSelectedCourse] = useState('');

  // Fetch conversations only when user is authenticated
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    enabled: !!user,
    refetchInterval: 30000,
    retry: false,
  });

  // Fetch available recipients based on user role
  const { data: availableUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/messaging/available-users'],
    enabled: newMessageOpen,
    retry: false,
  });

  // Fetch user's courses (for mentors)
  const { data: mentorCourses = [] } = useQuery({
    queryKey: ['/api/mentor/courses'],
    enabled: newMessageOpen && user?.role === 'mentor',
    retry: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      recipients: string[];
      title: string;
      content: string;
      type: 'individual' | 'course' | 'sitewide';
      courseId?: string;
    }) => {
      return apiRequest('POST', '/api/conversations', messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setNewMessageOpen(false);
      setSelectedRecipients([]);
      setMessageTitle('');
      setMessageContent('');
      setRecipientType('individual');
      setSelectedCourse('');
      toast({
        title: "Message sent successfully",
        description: "Your message has been delivered.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const unreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  const getAvailableRecipients = () => {
    if (user?.role === 'admin') {
      return availableUsers;
    } else if (user?.role === 'mentor') {
      // Mentors can only message students enrolled in their courses
      return availableUsers;
    } else if (user?.role === 'student') {
      // Students can message mentors and admins
      return availableUsers.filter(u => u.role === 'mentor' || u.role === 'admin');
    }
    return availableUsers;
  };

  const handleSendMessage = () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      toast({
        title: "Please fill in all fields",
        description: "Title and message content are required.",
        variant: "destructive",
      });
      return;
    }

    if (recipientType === 'individual' && selectedRecipients.length === 0) {
      toast({
        title: "Please select recipients",
        description: "You must select at least one recipient.",
        variant: "destructive",
      });
      return;
    }

    if (recipientType === 'course' && !selectedCourse) {
      toast({
        title: "Please select a course",
        description: "You must select a course to message students.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      recipients: recipientType === 'sitewide' ? [] : selectedRecipients,
      title: messageTitle,
      content: messageContent,
      type: recipientType,
      courseId: selectedCourse || undefined,
    });
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-10 w-10 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-primary/10 hover:text-primary">
            <MessageSquare size={20} />
            {unreadCount > 0 && (
              <Badge 
                variant="default"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 bg-primary"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <DropdownMenuLabel className="p-0">
              Messages
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNewMessageOpen(true)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="h-80">
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((conversation) => (
                  <DropdownMenuItem
                    key={conversation.id}
                    className="flex flex-col items-start p-3 cursor-pointer hover:bg-gray-50 rounded-lg"
                    onClick={() => window.location.href = `/messages?conversation=${conversation.id}`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium truncate">
                            {conversation.title}
                          </h4>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="h-4 text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {conversation.lastMessage?.sentAt 
                            ? formatDistanceToNow(new Date(conversation.lastMessage.sentAt), { addSuffix: true })
                            : ''
                          }
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </ScrollArea>

          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => window.location.href = '/messages'}
            >
              View all messages
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* New Message Dialog */}
      <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Message Type Selection (Admin only) */}
            {user?.role === 'admin' && (
              <div>
                <label className="text-sm font-medium">Message Type</label>
                <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Individual Users
                      </div>
                    </SelectItem>
                    <SelectItem value="sitewide">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Sitewide Announcement
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Course Selection (Mentors) */}
            {user?.role === 'mentor' && (
              <div>
                <label className="text-sm font-medium">Send to Course Students</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentorCourses.map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Recipients Selection */}
            {recipientType === 'individual' && (
              <div>
                <label className="text-sm font-medium">Recipients</label>
                <Select 
                  value={selectedRecipients.join(',')} 
                  onValueChange={(value) => setSelectedRecipients(value ? value.split(',') : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipients" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRecipients().map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id}>
                        {recipient.firstName} {recipient.lastName} ({recipient.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Message Title */}
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="Enter message title"
              />
            </div>

            {/* Message Content */}
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Enter your message"
                rows={5}
              />
            </div>

            {/* Send Button */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewMessageOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}