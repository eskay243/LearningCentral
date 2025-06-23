import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, ThumbsUp, Send, Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { ComponentErrorBoundary } from '@/components/EnhancedErrorBoundary';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Discussion {
  id: number;
  courseId: number;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  isAnnouncement: boolean;
  userFirstName?: string;
  userLastName?: string;
  userRole?: string;
}

interface CourseDiscussionSimpleProps {
  courseId: number;
}

export default function CourseDiscussionSimple({ courseId }: CourseDiscussionSimpleProps) {
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isMarkdown, setIsMarkdown] = useState(true);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch discussions with enhanced error handling
  const {
    data: discussions = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/courses', courseId, 'discussions'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/courses/${courseId}/discussions`);
      if (!response.ok) {
        throw new Error(`Failed to load discussions: ${response.statusText}`);
      }
      return response.json();
    },
    retry: (failureCount, error) => {
      // Only retry on network errors, not on 4xx/5xx
      return failureCount < 2 && !error.message.includes('Failed to load');
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Create discussion mutation with enhanced error handling
  const createDiscussionMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const response = await apiRequest('POST', `/api/courses/${courseId}/discussions`, data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to create discussion: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'discussions'] });
      setNewTitle('');
      setNewContent('');
      setShowNewDiscussion(false);
      toast({
        title: "Success",
        description: "Discussion posted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateDiscussion = () => {
    if (!newTitle.trim()) {
      toast({
        title: "Error",
        description: "Please provide a discussion title",
        variant: "destructive",
      });
      return;
    }

    if (!newContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide discussion content",
        variant: "destructive",
      });
      return;
    }

    createDiscussionMutation.mutate({
      title: newTitle.trim(),
      content: newContent.trim()
    });
  };

  const getUserDisplayName = (discussion: Discussion) => {
    if (discussion.userFirstName && discussion.userLastName) {
      return `${discussion.userFirstName} ${discussion.userLastName}`;
    }
    return 'Anonymous User';
  };

  const getUserInitials = (discussion: Discussion) => {
    const firstName = discussion.userFirstName || '';
    const lastName = discussion.userLastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'AU';
  };

  // Loading state with spinner
  if (isLoading) {
    return (
      <ComponentErrorBoundary title="Discussion Loading Error">
        <Card>
          <CardContent className="p-8">
            <LoadingSpinner text="Loading discussions..." />
          </CardContent>
        </Card>
      </ComponentErrorBoundary>
    );
  }

  // Error state with retry functionality
  if (isError) {
    return (
      <ComponentErrorBoundary title="Discussion Error">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load discussions</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="sm" 
              className="mt-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              Try Again
            </Button>
          </CardContent>
        </Card>
      </ComponentErrorBoundary>
    );
  }

  return (
    <ComponentErrorBoundary title="Course Discussions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Course Discussions</h2>
            <p className="text-muted-foreground">
              Share thoughts and ask questions about this course
            </p>
          </div>
          <Button 
            onClick={() => setShowNewDiscussion(!showNewDiscussion)}
            variant={showNewDiscussion ? "outline" : "default"}
          >
            {showNewDiscussion ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                New Discussion
              </>
            )}
          </Button>
        </div>

        {/* New Discussion Form */}
        {showNewDiscussion && (
          <Card>
            <CardHeader>
              <CardTitle>Start New Discussion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Discussion title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                disabled={createDiscussionMutation.isPending}
              />
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant={isMarkdown ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsMarkdown(true)}
                  >
                    Markdown
                  </Button>
                  <Button
                    type="button"
                    variant={!isMarkdown ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsMarkdown(false)}
                  >
                    Plain Text
                  </Button>
                </div>
                <Textarea
                  placeholder={
                    isMarkdown 
                      ? "Share your thoughts... (Markdown supported: **bold**, *italic*, `code`)" 
                      : "Share your thoughts..."
                  }
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  disabled={createDiscussionMutation.isPending}
                />
              </div>
              
              {/* Preview for markdown */}
              {isMarkdown && newContent.trim() && (
                <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <div className="prose dark:prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{newContent}</ReactMarkdown>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button 
                  onClick={handleCreateDiscussion}
                  disabled={createDiscussionMutation.isPending || !newTitle.trim() || !newContent.trim()}
                >
                  {createDiscussionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Post Discussion
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowNewDiscussion(false);
                    setNewTitle('');
                    setNewContent('');
                  }}
                  disabled={createDiscussionMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Discussions List */}
        {discussions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Be the first to start a discussion about this course
              </p>
              <Button onClick={() => setShowNewDiscussion(true)}>
                Start Discussion
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {discussions.map((discussion: Discussion) => (
              <ComponentErrorBoundary key={discussion.id} title="Discussion Item Error">
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    {/* Discussion Header */}
                    <div className="flex items-start space-x-4 mb-4">
                      <Avatar>
                        <AvatarFallback>{getUserInitials(discussion)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold">{getUserDisplayName(discussion)}</span>
                          {discussion.userRole && (
                            <Badge variant={discussion.userRole === 'mentor' ? 'default' : 'secondary'}>
                              {discussion.userRole}
                            </Badge>
                          )}
                          {discussion.isAnnouncement && (
                            <Badge variant="destructive">Announcement</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    {/* Discussion Title */}
                    <h3 className="text-xl font-semibold mb-3">{discussion.title}</h3>

                    {/* Discussion Content */}
                    <div className="prose dark:prose-invert max-w-none mb-4">
                      <ReactMarkdown>{discussion.content}</ReactMarkdown>
                    </div>

                    {/* Discussion Actions */}
                    <div className="flex items-center space-x-4">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Like
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </ComponentErrorBoundary>
            ))}
          </div>
        )}
      </div>
    </ComponentErrorBoundary>
  );
}