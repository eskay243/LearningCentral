import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, ThumbsUp, ThumbsDown, Reply, Send, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

interface Discussion {
  id: number;
  courseId: number;
  userId: string;
  parentId?: number;
  title?: string;
  content: string;
  contentType: string;
  isSticky: boolean;
  isLocked: boolean;
  isResolved: boolean;
  isAnnouncement: boolean;
  likes: number;
  dislikes: number;
  replyCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  userFirstName: string;
  userLastName: string;
  userProfileImage?: string;
  userRole: string;
  replies?: Discussion[];
  hasMoreReplies?: boolean;
}

interface CourseDiscussionsProps {
  courseId: number;
}

export default function CourseDiscussions({ courseId }: CourseDiscussionsProps) {
  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'oldest'>('recent');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch discussions with error handling
  const {
    data: discussionsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/courses', courseId, 'discussions', { sortBy }],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/courses/${courseId}/discussions?sortBy=${sortBy}`);
      if (!response.ok) {
        throw new Error('Failed to fetch discussions');
      }
      return response.json();
    },
    retry: 2,
    staleTime: 30000
  });

  // Create discussion mutation
  const createDiscussionMutation = useMutation({
    mutationFn: async (data: { title?: string; content: string; parentId?: number }) => {
      const response = await apiRequest('POST', `/api/courses/${courseId}/discussions`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create discussion');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'discussions'] });
      setNewDiscussionTitle('');
      setNewDiscussionContent('');
      setShowNewDiscussion(false);
      setReplyingTo(null);
      setReplyContent('');
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

  // React to discussion mutation
  const reactMutation = useMutation({
    mutationFn: async ({ discussionId, reactionType }: { discussionId: number; reactionType: 'like' | 'dislike' }) => {
      const response = await apiRequest('POST', `/api/discussions/${discussionId}/react`, { reactionType });
      if (!response.ok) {
        throw new Error('Failed to react to discussion');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'discussions'] });
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
    if (!newDiscussionTitle.trim() || !newDiscussionContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide both title and content",
        variant: "destructive",
      });
      return;
    }

    createDiscussionMutation.mutate({
      title: newDiscussionTitle,
      content: newDiscussionContent
    });
  };

  const handleReply = (discussionId: number) => {
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please provide reply content",
        variant: "destructive",
      });
      return;
    }

    createDiscussionMutation.mutate({
      content: replyContent,
      parentId: discussionId
    });
  };

  const handleReact = (discussionId: number, reactionType: 'like' | 'dislike') => {
    reactMutation.mutate({ discussionId, reactionType });
  };

  const getUserDisplayName = (discussion: Discussion) => {
    return `${discussion.userFirstName} ${discussion.userLastName}`.trim() || 'Anonymous';
  };

  const getUserInitials = (discussion: Discussion) => {
    const firstName = discussion.userFirstName || '';
    const lastName = discussion.userLastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'A';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading discussions...</span>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
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
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const discussions = discussionsData?.discussions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Course Discussions</h2>
          <div className="flex space-x-2">
            {['recent', 'popular', 'oldest'].map((sort) => (
              <Button
                key={sort}
                variant={sortBy === sort ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy(sort as typeof sortBy)}
              >
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        <Button onClick={() => setShowNewDiscussion(!showNewDiscussion)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          New Discussion
        </Button>
      </div>

      {/* New Discussion Form */}
      {showNewDiscussion && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Start New Discussion</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Discussion title..."
              value={newDiscussionTitle}
              onChange={(e) => setNewDiscussionTitle(e.target.value)}
            />
            <Textarea
              placeholder="Share your thoughts... (Markdown supported)"
              value={newDiscussionContent}
              onChange={(e) => setNewDiscussionContent(e.target.value)}
              rows={4}
            />
            <div className="flex space-x-2">
              <Button 
                onClick={handleCreateDiscussion}
                disabled={createDiscussionMutation.isPending}
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
                onClick={() => setShowNewDiscussion(false)}
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
            <Card key={discussion.id} className="overflow-hidden">
              <CardContent className="p-6">
                {/* Discussion Header */}
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar>
                    <AvatarImage src={discussion.userProfileImage} />
                    <AvatarFallback>{getUserInitials(discussion)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold">{getUserDisplayName(discussion)}</span>
                      <Badge variant={discussion.userRole === 'mentor' ? 'default' : 'secondary'}>
                        {discussion.userRole}
                      </Badge>
                      {discussion.isAnnouncement && (
                        <Badge variant="destructive">Announcement</Badge>
                      )}
                      {discussion.isSticky && (
                        <Badge variant="outline">Pinned</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Discussion Title */}
                {discussion.title && (
                  <h3 className="text-xl font-semibold mb-3">{discussion.title}</h3>
                )}

                {/* Discussion Content */}
                <div className="prose dark:prose-invert max-w-none mb-4">
                  {discussion.contentType === 'markdown' ? (
                    <ReactMarkdown>{discussion.content}</ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{discussion.content}</p>
                  )}
                </div>

                {/* Discussion Actions */}
                <div className="flex items-center space-x-4 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReact(discussion.id, 'like')}
                    disabled={reactMutation.isPending}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {discussion.likes}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReact(discussion.id, 'dislike')}
                    disabled={reactMutation.isPending}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    {discussion.dislikes}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(replyingTo === discussion.id ? null : discussion.id)}
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Reply ({discussion.replyCount})
                  </Button>
                </div>

                {/* Reply Form */}
                {replyingTo === discussion.id && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Textarea
                      placeholder="Write your reply... (Markdown supported)"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                      className="mb-3"
                    />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
                        onClick={() => handleReply(discussion.id)}
                        disabled={createDiscussionMutation.isPending}
                      >
                        {createDiscussionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Post Reply
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Recent Replies */}
                {discussion.replies && discussion.replies.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <Separator />
                    <h4 className="font-semibold text-sm">Recent Replies</h4>
                    {discussion.replies.map((reply: Discussion) => (
                      <div key={reply.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reply.userProfileImage} />
                          <AvatarFallback className="text-xs">{getUserInitials(reply)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">{getUserDisplayName(reply)}</span>
                            <Badge variant="outline" className="text-xs">
                              {reply.userRole}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="prose dark:prose-invert prose-sm max-w-none">
                            {reply.contentType === 'markdown' ? (
                              <ReactMarkdown>{reply.content}</ReactMarkdown>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReact(reply.id, 'like')}
                              className="h-6 px-2 text-xs"
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {reply.likes}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReact(reply.id, 'dislike')}
                              className="h-6 px-2 text-xs"
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              {reply.dislikes}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {discussion.hasMoreReplies && (
                      <Button variant="outline" size="sm" className="w-full">
                        Load More Replies
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}