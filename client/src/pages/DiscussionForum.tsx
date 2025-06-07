import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Flag,
  Pin,
  Lock,
  Eye,
  Users,
  Calendar,
  Tag,
  CheckCircle,
  Star,
  TrendingUp,
  Clock,
  MoreVertical,
  Edit
} from "lucide-react";

interface DiscussionForum {
  id: number;
  courseId: number;
  lessonId?: number;
  title: string;
  description: string;
  forumType: string;
  isModerated: boolean;
  allowAnonymous: boolean;
  isLocked: boolean;
  isPinned: boolean;
  orderIndex: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  course?: {
    title: string;
  };
}

interface DiscussionTopic {
  id: number;
  forumId: number;
  userId: string;
  title: string;
  content: string;
  contentType: string;
  topicType: string;
  isSticky: boolean;
  isLocked: boolean;
  isAnonymous: boolean;
  isQuestion: boolean;
  hasAcceptedAnswer: boolean;
  acceptedAnswerId?: number;
  views: number;
  likes: number;
  dislikes: number;
  replies: number;
  attachments?: any;
  isApproved: boolean;
  moderatedBy?: string;
  moderatedAt?: string;
  tags: string[];
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

interface DiscussionReply {
  id: number;
  topicId: number;
  parentReplyId?: number;
  userId: string;
  content: string;
  contentType: string;
  isAnonymous: boolean;
  isAcceptedAnswer: boolean;
  isEndorsed: boolean;
  likes: number;
  dislikes: number;
  helpfulVotes: number;
  attachments?: any;
  isApproved: boolean;
  moderatedBy?: string;
  moderatedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  replies?: DiscussionReply[];
}

export default function DiscussionForum() {
  const { courseId, forumId, topicId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedTopicType, setSelectedTopicType] = useState("discussion");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [newTopicTags, setNewTopicTags] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [showNewTopicDialog, setShowNewTopicDialog] = useState(false);

  // Fetch forums for course
  const { data: forums, isLoading: forumsLoading } = useQuery<DiscussionForum[]>({
    queryKey: [`/api/courses/${courseId}/forums`],
    enabled: !!courseId && !forumId,
  });

  // Fetch specific forum
  const { data: forum } = useQuery<DiscussionForum>({
    queryKey: [`/api/forums/${forumId}`],
    enabled: !!forumId,
  });

  // Fetch topics for forum
  const { data: topics, isLoading: topicsLoading } = useQuery<DiscussionTopic[]>({
    queryKey: [`/api/forums/${forumId}/topics`, searchQuery, selectedFilter],
    enabled: !!forumId && !topicId,
  });

  // Fetch specific topic with replies
  const { data: topic } = useQuery<DiscussionTopic & { replies: DiscussionReply[] }>({
    queryKey: [`/api/topics/${topicId}`],
    enabled: !!topicId,
  });

  // Create new topic mutation
  const createTopicMutation = useMutation({
    mutationFn: async (topicData: any) => {
      const response = await apiRequest("POST", `/api/forums/${forumId}/topics`, topicData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Topic Created",
        description: "Your topic has been posted successfully",
      });
      setShowNewTopicDialog(false);
      setNewTopicTitle("");
      setNewTopicContent("");
      setNewTopicTags("");
      queryClient.invalidateQueries({ queryKey: [`/api/forums/${forumId}/topics`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create topic",
        variant: "destructive",
      });
    },
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async (replyData: any) => {
      const response = await apiRequest("POST", `/api/topics/${topicId}/replies`, replyData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reply Posted",
        description: "Your reply has been posted successfully",
      });
      setReplyContent("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: [`/api/topics/${topicId}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
    },
  });

  // Vote mutations
  const voteMutation = useMutation({
    mutationFn: async ({ type, targetId, targetType, voteType }: {
      type: 'topic' | 'reply';
      targetId: number;
      targetType: string;
      voteType: 'like' | 'dislike' | 'helpful';
    }) => {
      const endpoint = type === 'topic' 
        ? `/api/topics/${targetId}/vote`
        : `/api/replies/${targetId}/vote`;
      
      const response = await apiRequest("POST", endpoint, { voteType });
      return response.json();
    },
    onSuccess: () => {
      if (topicId) {
        queryClient.invalidateQueries({ queryKey: [`/api/topics/${topicId}`] });
      } else {
        queryClient.invalidateQueries({ queryKey: [`/api/forums/${forumId}/topics`] });
      }
    },
  });

  const handleCreateTopic = () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and content",
        variant: "destructive",
      });
      return;
    }

    createTopicMutation.mutate({
      title: newTopicTitle,
      content: newTopicContent,
      contentType: "text",
      topicType: selectedTopicType,
      isAnonymous,
      isQuestion: selectedTopicType === "question",
      tags: newTopicTags.split(",").map(tag => tag.trim()).filter(Boolean),
    });
  };

  const handleCreateReply = () => {
    if (!replyContent.trim()) {
      toast({
        title: "Missing Content",
        description: "Please enter your reply",
        variant: "destructive",
      });
      return;
    }

    createReplyMutation.mutate({
      content: replyContent,
      contentType: "text",
      parentReplyId: replyingTo,
      isAnonymous,
    });
  };

  const handleVote = (type: 'topic' | 'reply', targetId: number, voteType: 'like' | 'dislike' | 'helpful') => {
    voteMutation.mutate({ type, targetId, targetType: voteType, voteType });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getTopicTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'announcement': return <Pin className="w-4 h-4 text-green-500" />;
      case 'discussion': return <Users className="w-4 h-4 text-purple-500" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const renderReply = (reply: DiscussionReply, depth = 0) => (
    <div key={reply.id} className={`${depth > 0 ? 'ml-8 mt-4' : ''}`}>
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={reply.user?.profileImageUrl} />
              <AvatarFallback>
                {reply.isAnonymous 
                  ? "?" 
                  : `${reply.user?.firstName?.[0]}${reply.user?.lastName?.[0]}`
                }
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">
                  {reply.isAnonymous 
                    ? "Anonymous" 
                    : `${reply.user?.firstName} ${reply.user?.lastName}`
                  }
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(reply.createdAt)}
                </span>
                {reply.isAcceptedAnswer && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Accepted Answer
                  </Badge>
                )}
                {reply.isEndorsed && (
                  <Badge variant="secondary" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Endorsed
                  </Badge>
                )}
              </div>
              
              <div className="prose prose-sm max-w-none mb-3">
                <p className="whitespace-pre-wrap">{reply.content}</p>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('reply', reply.id, 'like')}
                  className="h-auto p-1"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" />
                  {reply.likes}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('reply', reply.id, 'dislike')}
                  className="h-auto p-1"
                >
                  <ThumbsDown className="w-4 h-4 mr-1" />
                  {reply.dislikes}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote('reply', reply.id, 'helpful')}
                  className="h-auto p-1"
                >
                  <Star className="w-4 h-4 mr-1" />
                  {reply.helpfulVotes}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(reply.id)}
                  className="h-auto p-1"
                >
                  <Reply className="w-4 h-4 mr-1" />
                  Reply
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {reply.replies?.map(nestedReply => renderReply(nestedReply, depth + 1))}
    </div>
  );

  // Show forums list if no specific forum selected
  if (!forumId && courseId) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Discussion Forums</h1>
        </div>

        {forumsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : forums && forums.length > 0 ? (
          <div className="grid gap-4">
            {forums.map((forum) => (
              <Card key={forum.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link href={`/courses/${courseId}/forums/${forum.id}`}>
                          <h3 className="text-xl font-semibold hover:text-primary cursor-pointer">
                            {forum.title}
                          </h3>
                        </Link>
                        {forum.isPinned && <Pin className="w-4 h-4 text-green-500" />}
                        {forum.isLocked && <Lock className="w-4 h-4 text-red-500" />}
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{forum.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span className="capitalize">{forum.forumType}</span>
                        </div>
                        {forum.isModerated && (
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>Moderated</span>
                          </div>
                        )}
                        {forum.allowAnonymous && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>Anonymous allowed</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button asChild>
                      <Link href={`/courses/${courseId}/forums/${forum.id}`}>
                        View Forum
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              No discussion forums available for this course yet.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Show topic list for selected forum
  if (forumId && !topicId) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{forum?.title}</h1>
            <p className="text-muted-foreground mt-1">{forum?.description}</p>
          </div>
          
          <Dialog open={showNewTopicDialog} onOpenChange={setShowNewTopicDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Topic
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Topic</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Topic Type</label>
                  <Select value={selectedTopicType} onValueChange={setSelectedTopicType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discussion">Discussion</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    placeholder="Enter topic title..."
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <Textarea
                    placeholder="Enter your message..."
                    value={newTopicContent}
                    onChange={(e) => setNewTopicContent(e.target.value)}
                    rows={6}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                  <Input
                    placeholder="javascript, react, help..."
                    value={newTopicTags}
                    onChange={(e) => setNewTopicTags(e.target.value)}
                  />
                </div>
                
                {forum?.allowAnonymous && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    <label htmlFor="anonymous" className="text-sm">
                      Post anonymously
                    </label>
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewTopicDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTopic} disabled={createTopicMutation.isPending}>
                    Create Topic
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              <SelectItem value="questions">Questions</SelectItem>
              <SelectItem value="discussions">Discussions</SelectItem>
              <SelectItem value="announcements">Announcements</SelectItem>
              <SelectItem value="unanswered">Unanswered</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Topics List */}
        {topicsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : topics && topics.length > 0 ? (
          <div className="space-y-4">
            {topics.map((topic) => (
              <Card key={topic.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={topic.user?.profileImageUrl} />
                      <AvatarFallback>
                        {topic.isAnonymous 
                          ? "?" 
                          : `${topic.user?.firstName?.[0]}${topic.user?.lastName?.[0]}`
                        }
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTopicTypeIcon(topic.topicType)}
                        <Link href={`/courses/${courseId}/forums/${forumId}/topics/${topic.id}`}>
                          <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
                            {topic.title}
                          </h3>
                        </Link>
                        {topic.isSticky && <Pin className="w-4 h-4 text-green-500" />}
                        {topic.isLocked && <Lock className="w-4 h-4 text-red-500" />}
                        {topic.hasAcceptedAnswer && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Solved
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {topic.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {topic.isAnonymous 
                              ? "Anonymous" 
                              : `${topic.user?.firstName} ${topic.user?.lastName}`
                            }
                          </span>
                          <span>{formatTimeAgo(topic.createdAt)}</span>
                          {topic.tags.length > 0 && (
                            <div className="flex gap-1">
                              {topic.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {topic.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{topic.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {topic.views}
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {topic.likes}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {topic.replies}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              No topics found. Be the first to start a discussion!
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Show individual topic with replies
  if (topicId && topic) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Topic Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={topic.user?.profileImageUrl} />
                <AvatarFallback>
                  {topic.isAnonymous 
                    ? "?" 
                    : `${topic.user?.firstName?.[0]}${topic.user?.lastName?.[0]}`
                  }
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {getTopicTypeIcon(topic.topicType)}
                  <h1 className="text-2xl font-bold">{topic.title}</h1>
                  {topic.isSticky && <Pin className="w-5 h-5 text-green-500" />}
                  {topic.isLocked && <Lock className="w-5 h-5 text-red-500" />}
                  {topic.hasAcceptedAnswer && (
                    <Badge variant="secondary">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Solved
                    </Badge>
                  )}
                </div>
                
                <div className="prose prose-sm max-w-none mb-4">
                  <p className="whitespace-pre-wrap">{topic.content}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {topic.isAnonymous 
                        ? "Anonymous" 
                        : `${topic.user?.firstName} ${topic.user?.lastName}`
                      }
                    </span>
                    <span>{formatTimeAgo(topic.createdAt)}</span>
                    {topic.tags.length > 0 && (
                      <div className="flex gap-1">
                        {topic.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote('topic', topic.id, 'like')}
                      className="h-auto p-1"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {topic.likes}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote('topic', topic.id, 'dislike')}
                      className="h-auto p-1"
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      {topic.dislikes}
                    </Button>
                    
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      {topic.views}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Replies ({topic.replies?.length || 0})
          </h2>
          
          {topic.replies && topic.replies.length > 0 ? (
            <div className="space-y-4">
              {topic.replies.map(reply => renderReply(reply))}
            </div>
          ) : (
            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                No replies yet. Be the first to respond!
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Reply Form */}
        {user && !topic.isLocked && (
          <Card>
            <CardHeader>
              <CardTitle>Reply to Topic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {replyingTo && (
                  <Alert>
                    <Reply className="h-4 w-4" />
                    <AlertDescription>
                      Replying to a specific comment
                      <Button
                        variant="link"
                        className="ml-2 p-0 h-auto"
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                
                <Textarea
                  placeholder="Write your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                />
                
                {forum?.allowAnonymous && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="reply-anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    <label htmlFor="reply-anonymous" className="text-sm">
                      Reply anonymously
                    </label>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button onClick={handleCreateReply} disabled={createReplyMutation.isPending}>
                    <Reply className="w-4 h-4 mr-2" />
                    Post Reply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Alert>
        <AlertDescription>Loading discussion forum...</AlertDescription>
      </Alert>
    </div>
  );
}