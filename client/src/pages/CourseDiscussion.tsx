import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Plus, 
  User, 
  Clock,
  Pin,
  Send
} from "lucide-react";

interface Discussion {
  id: number;
  title: string;
  content: string;
  userId: string;
  courseId: number;
  createdAt: string;
  isAnnouncement: boolean;
  userName?: string;
  userRole?: string;
}

export default function CourseDiscussion() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);

  // Fetch discussions for this course
  const { data: discussions = [], isLoading } = useQuery<Discussion[]>({
    queryKey: [`/api/courses/${id}/discussions`],
    enabled: !!id,
  });

  // Fetch course info
  const { data: course } = useQuery({
    queryKey: [`/api/courses/${id}`],
    enabled: !!id,
  });

  const createDiscussionMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const response = await apiRequest("POST", `/api/courses/${id}/discussions`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}/discussions`] });
      setNewTopicTitle("");
      setNewTopicContent("");
      setShowNewTopicForm(false);
      toast({
        title: "Success",
        description: "Discussion topic created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTopic = () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and content",
        variant: "destructive",
      });
      return;
    }

    createDiscussionMutation.mutate({
      title: newTopicTitle,
      content: newTopicContent,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Course Discussion</h1>
          <p className="text-gray-600">{course?.title}</p>
        </div>

        {/* New Topic Form */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Start a New Discussion
              </CardTitle>
              {!showNewTopicForm && (
                <Button onClick={() => setShowNewTopicForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Topic
                </Button>
              )}
            </div>
          </CardHeader>
          
          {showNewTopicForm && (
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Discussion title"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  className="mb-3"
                />
                <Textarea
                  placeholder="What would you like to discuss?"
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateTopic}
                  disabled={createDiscussionMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {createDiscussionMutation.isPending ? "Creating..." : "Create Topic"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowNewTopicForm(false);
                    setNewTopicTitle("");
                    setNewTopicContent("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Discussions List */}
        <div className="space-y-4">
          {discussions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No discussions yet</h3>
                <p className="text-gray-500 mb-4">Be the first to start a discussion in this course!</p>
                <Button onClick={() => setShowNewTopicForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start First Discussion
                </Button>
              </CardContent>
            </Card>
          ) : (
            discussions.map((discussion) => (
              <Card key={discussion.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {discussion.isAnnouncement && (
                        <Pin className="h-5 w-5 text-orange-500" />
                      )}
                      <h3 className="text-lg font-semibold">{discussion.title}</h3>
                      {discussion.isAnnouncement && (
                        <Badge variant="secondary">Announcement</Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {discussion.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{discussion.userName || 'Unknown User'}</span>
                      {discussion.userRole && (
                        <Badge variant="outline" className="text-xs">
                          {discussion.userRole}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(discussion.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}