import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, Users, Plus, Search, Filter, MoreVertical, Play, Upload } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import useAuth from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const Assessments = () => {
  const { user, isMentor, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("quizzes");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createType, setCreateType] = useState("");
  const [editingAssignment, setEditingAssignment] = useState<number | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<number | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    lessonId: "",
    timeLimit: 30,
    totalPoints: 100
  });
  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    instructions: "",
    dueDate: "",
    totalPoints: 100,
    lessonId: 1 // Default to lesson 1
  });

  // Fetch quizzes
  const { data: quizzes = [], isLoading: isQuizzesLoading } = useQuery({
    queryKey: isStudent ? ["/api/student/quizzes"] : [isMentor ? `/api/mentors/${user?.id}/quizzes` : "/api/quizzes"],
    enabled: !!user,
  });

  // Fetch assignments
  const { data: assignments = [], isLoading: isAssignmentsLoading } = useQuery({
    queryKey: isStudent ? ["/api/student/assignments"] : [isMentor ? `/api/mentors/${user?.id}/assignments` : "/api/assignments"],
    enabled: !!user,
  });

  // Fetch courses for filter dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
    enabled: !!user,
  });

  // Early return if still loading auth
  if (authLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  // Filter quizzes based on search and course filter
  const filteredQuizzes = quizzes.filter((quiz: any) => {
    if (!quiz?.title) return false;
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
    // For course filtering, we need to check if the quiz's lesson belongs to the selected course
    const matchesCourse = filterCourse === "all" || quiz.lesson?.courseId?.toString() === filterCourse;
    return matchesSearch && matchesCourse;
  });

  // Filter assignments based on search and course filter
  const filteredAssignments = assignments.filter((assignment: any) => {
    if (!assignment?.title) return false;
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase());
    // For course filtering, we need to check if the assignment's lesson belongs to the selected course
    const matchesCourse = filterCourse === "all" || assignment.lesson?.courseId?.toString() === filterCourse;
    return matchesSearch && matchesCourse;
  });

  // Mutations for creating assessments
  const createQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      try {
        console.log('Creating quiz with data:', quizData);
        const response = await apiRequest("POST", "/api/quizzes", quizData);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Quiz creation failed:', response.status, errorData);
          throw new Error(`Server error: ${response.status} - ${errorData}`);
        }
        
        return response.json();
      } catch (error) {
        console.error('Quiz creation error:', error);
        throw error;
      }
    },
    onSuccess: (newQuiz) => {
      console.log('Quiz created successfully:', newQuiz);
      // Force refetch the data instead of just invalidating cache
      queryClient.refetchQueries({ queryKey: [`/api/mentors/${user?.id}/quizzes`] });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      
      toast({
        title: "Quiz Created",
        description: "Your quiz has been created successfully!",
      });
      setShowCreateDialog(false);
      setCreateType('');
      setQuizForm({
        title: "",
        description: "",
        lessonId: "",
        timeLimit: 30,
        totalPoints: 100
      });
      setActiveTab("quizzes");
    },
    onError: (error: any) => {
      console.error('Quiz creation mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update quiz mutation
  const updateQuizMutation = useMutation({
    mutationFn: async ({ quizId, quizData }: { quizId: number; quizData: any }) => {
      const response = await apiRequest("PUT", `/api/quizzes/${quizId}`, quizData);
      return response.json();
    },
    onSuccess: (updatedQuiz, { quizId }) => {
      // Update the quiz in the cache immediately
      const queryKey = isMentor ? [`/api/mentors/${user?.id}/quizzes`] : ["/api/quizzes"];
      queryClient.setQueryData(queryKey, (oldData: any[]) => {
        return oldData ? oldData.map((quiz: any) => 
          quiz.id === quizId ? { ...quiz, ...updatedQuiz } : quiz
        ) : [];
      });
      
      setShowCreateDialog(false);
      setEditingQuiz(null);
      setQuizForm({
        title: "",
        description: "",
        lessonId: "",
        timeLimit: 30,
        totalPoints: 100
      });
      
      toast({
        title: "Quiz Updated",
        description: "The quiz has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      const response = await apiRequest("POST", "/api/assignments", assignmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/mentors/${user?.id}/assignments`] });
      toast({
        title: "Assignment Created",
        description: "Your assignment has been created successfully!",
      });
      setShowCreateDialog(false);
      setAssignmentForm({
        title: "",
        description: "",
        instructions: "",
        dueDate: "",
        totalPoints: 100
      });
      setActiveTab("assignments");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateQuiz = () => {
    console.log('handleCreateQuiz called with form data:', quizForm);
    
    if (!quizForm.title || !quizForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const quizData = {
      title: quizForm.title,
      description: quizForm.description,
      lessonId: parseInt(quizForm.lessonId) || 1, // Default to lesson 1 if not specified
      timeLimit: quizForm.timeLimit || 30,
      totalPoints: quizForm.totalPoints || 100,
      isPublished: false, // Default to unpublished
      showCorrectAnswers: true // Default to showing answers
    };

    console.log('Final quiz data to submit:', quizData);

    if (editingQuiz) {
      // Update existing quiz
      updateQuizMutation.mutate({ quizId: editingQuiz, quizData });
    } else {
      // Create new quiz
      createQuizMutation.mutate(quizData);
    }
  };

  const handleCreateAssignment = () => {
    if (!assignmentForm.title || !assignmentForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    const assignmentData = {
      ...assignmentForm,
      dueDate: assignmentForm.dueDate ? new Date(assignmentForm.dueDate) : null,
    };
    
    if (editingAssignment) {
      updateAssignmentMutation.mutate({ id: editingAssignment, data: assignmentData });
    } else {
      createAssignmentMutation.mutate(assignmentData);
    }
  };

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: number) => {
      const response = await apiRequest("DELETE", `/api/quizzes/${quizId}`);
      return response;
    },
    onSuccess: (data, quizId) => {
      // Remove the deleted quiz from the cache immediately
      const queryKey = isMentor ? [`/api/mentors/${user?.id}/quizzes`] : ["/api/quizzes"];
      queryClient.setQueryData(queryKey, (oldData: any[]) => {
        return oldData ? oldData.filter((quiz: any) => quiz.id !== quizId) : [];
      });
      
      toast({
        title: "Quiz Deleted",
        description: "The quiz has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditQuiz = (quizId: number) => {
    const quiz = filteredQuizzes.find((q: any) => q.id === quizId);
    if (quiz) {
      setQuizForm({
        title: quiz.title,
        description: quiz.description || "",
        lessonId: quiz.lessonId?.toString() || "1",
        timeLimit: quiz.timeLimit || 30,
        totalPoints: quiz.totalPoints || 100
      });
      setEditingQuiz(quizId);
      setCreateType('quiz');
      setShowCreateDialog(true);
    }
  };

  const handleViewResults = (quizId: number) => {
    // For now, show a message - this would navigate to results page
    toast({
      title: "Quiz Results",
      description: "Results viewing feature will be available soon. This would show detailed analytics.",
    });
  };

  const handleDeleteQuiz = (quizId: number) => {
    if (confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      deleteQuizMutation.mutate(quizId);
    }
  };

  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/assignments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/mentors/${user?.id}/assignments`] });
      toast({
        title: "Assignment Updated",
        description: "The assignment has been successfully updated.",
      });
      setShowCreateDialog(false);
      setEditingAssignment(null);
      setAssignmentForm({
        title: "",
        description: "",
        instructions: "",
        dueDate: "",
        totalPoints: 100,
        lessonId: 1
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      const response = await apiRequest("DELETE", `/api/assignments/${assignmentId}`);
      return response;
    },
    onSuccess: (data, assignmentId) => {
      // Remove the deleted assignment from the cache immediately
      const queryKey = isMentor ? [`/api/mentors/${user?.id}/assignments`] : ["/api/assignments"];
      queryClient.setQueryData(queryKey, (oldData: any[]) => {
        return oldData ? oldData.filter((assignment: any) => assignment.id !== assignmentId) : [];
      });
      
      toast({
        title: "Assignment Deleted",
        description: "The assignment has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditAssignment = (assignmentId: number) => {
    const assignment = filteredAssignments.find((a: any) => a.id === assignmentId);
    if (assignment) {
      setAssignmentForm({
        title: assignment.title,
        description: assignment.description || "",
        instructions: assignment.instructions || "",
        dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : "",
        totalPoints: assignment.totalPoints,
        lessonId: assignment.lessonId
      });
      setEditingAssignment(assignmentId);
      setShowCreateDialog(true);
    }
  };

  const handleViewAssignmentSubmissions = (assignmentId: number) => {
    window.location.href = `/assignment-submissions/${assignmentId}`;
  };

  const handleDeleteAssignment = (assignmentId: number) => {
    if (confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      deleteAssignmentMutation.mutate(assignmentId);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assessments</h1>
          <p className="mt-1 text-gray-500">Create and manage quizzes and assignments for your courses</p>
        </div>
        
        {(isMentor || isAdmin) && (
          <Dialog open={showCreateDialog} onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) {
              setCreateType('');
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingAssignment ? 'Edit Assignment' : createType ? `Create ${createType === 'quiz' ? 'Quiz' : 'Assignment'}` : 'Create New Assessment'}
                </DialogTitle>
                <DialogDescription>
                  {editingAssignment ? 'Update the assignment details below' : createType ? 'Fill in the details below' : 'Choose the type of assessment you want to create.'}
                </DialogDescription>
              </DialogHeader>

              {!createType ? (
                <div className="grid gap-4 py-4">
                  <Button onClick={() => setCreateType('quiz')} className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Quiz</div>
                      <div className="text-sm text-gray-500">Multiple choice questions with automatic grading</div>
                    </div>
                  </Button>
                  <Button onClick={() => setCreateType('assignment')} variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Assignment</div>
                      <div className="text-sm text-gray-500">Project-based assessment requiring manual grading</div>
                    </div>
                  </Button>
                </div>
              ) : createType === 'quiz' ? (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiz-title">Title *</Label>
                    <Input
                      id="quiz-title"
                      value={quizForm.title}
                      onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
                      placeholder="Enter quiz title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiz-description">Description *</Label>
                    <Textarea
                      id="quiz-description"
                      value={quizForm.description}
                      onChange={(e) => setQuizForm({...quizForm, description: e.target.value})}
                      placeholder="Enter quiz description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiz-lesson">Lesson ID</Label>
                    <Input
                      id="quiz-lesson"
                      type="number"
                      value={quizForm.lessonId}
                      onChange={(e) => setQuizForm({...quizForm, lessonId: e.target.value})}
                      placeholder="Enter lesson ID (optional)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quiz-time">Time Limit (minutes)</Label>
                      <Input
                        id="quiz-time"
                        type="number"
                        value={quizForm.timeLimit}
                        onChange={(e) => setQuizForm({...quizForm, timeLimit: parseInt(e.target.value) || 30})}
                        placeholder="30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quiz-points">Total Points</Label>
                      <Input
                        id="quiz-points"
                        type="number"
                        value={quizForm.totalPoints}
                        onChange={(e) => setQuizForm({...quizForm, totalPoints: parseInt(e.target.value) || 100})}
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => setCreateType('')}
                      variant="outline" 
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleCreateQuiz}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={createQuizMutation.isPending || updateQuizMutation.isPending}
                    >
                      {createQuizMutation.isPending || updateQuizMutation.isPending 
                        ? (editingQuiz ? "Updating..." : "Creating...") 
                        : (editingQuiz ? "Update Quiz" : "Create Quiz")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignment-title">Title *</Label>
                    <Input
                      id="assignment-title"
                      value={assignmentForm.title}
                      onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})}
                      placeholder="Enter assignment title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignment-description">Description *</Label>
                    <Textarea
                      id="assignment-description"
                      value={assignmentForm.description}
                      onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})}
                      placeholder="Enter assignment description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignment-instructions">Instructions</Label>
                    <Textarea
                      id="assignment-instructions"
                      value={assignmentForm.instructions}
                      onChange={(e) => setAssignmentForm({...assignmentForm, instructions: e.target.value})}
                      placeholder="Enter detailed instructions"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assignment-due">Due Date</Label>
                      <Input
                        id="assignment-due"
                        type="date"
                        value={assignmentForm.dueDate}
                        onChange={(e) => setAssignmentForm({...assignmentForm, dueDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignment-points">Total Points</Label>
                      <Input
                        id="assignment-points"
                        type="number"
                        value={assignmentForm.totalPoints}
                        onChange={(e) => setAssignmentForm({...assignmentForm, totalPoints: parseInt(e.target.value) || 100})}
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => setCreateType('')}
                      variant="outline" 
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleCreateAssignment}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={createAssignmentMutation.isPending}
                    >
                      {editingAssignment 
                        ? (updateAssignmentMutation.isPending ? "Updating..." : "Update Assignment")
                        : (createAssignmentMutation.isPending ? "Creating..." : "Create Assignment")
                      }
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters & Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end md:items-center">
        <div className="flex-grow">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assessments..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterCourse} onValueChange={setFilterCourse}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course: any) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Assessment Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="quizzes">
            Quizzes ({filteredQuizzes.length})
          </TabsTrigger>
          <TabsTrigger value="assignments">
            Assignments ({filteredAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quizzes" className="space-y-4">
          {isQuizzesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No quizzes found</h3>
                <p className="text-gray-500 text-center mb-4">
                  {searchTerm || filterCourse !== "all" 
                    ? "No quizzes match your current filters." 
                    : "Start by creating your first quiz to assess student knowledge."}
                </p>
                {(isMentor || isAdmin) && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Quiz
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredQuizzes.map((quiz: any) => (
                <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {quiz.description || "No description provided"}
                        </CardDescription>
                      </div>
                      {(isMentor || isAdmin) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditQuiz(quiz.id)}>Edit Quiz</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewResults(quiz.id)}>View Results</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteQuiz(quiz.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {quiz.attempted || 0} attempts
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                        {quiz.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {quiz.questions?.length || 0} questions
                      </span>
                    </div>
                    
                    {/* Student action buttons */}
                    {!isMentor && !isAdmin && quiz.isPublished && (
                      <div className="mt-4 pt-3 border-t">
                        <Button 
                          onClick={() => window.location.href = `/quiz/${quiz.id}`}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Take Quiz
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {isAssignmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No assignments found</h3>
                <p className="text-gray-500 text-center mb-4">
                  {searchTerm || filterCourse !== "all" 
                    ? "No assignments match your current filters." 
                    : "Start by creating your first assignment to give students practical projects."}
                </p>
                {(isMentor || isAdmin) && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Assignment
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssignments.map((assignment: any) => (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {assignment.description || "No description provided"}
                        </CardDescription>
                      </div>
                      {(isMentor || isAdmin) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditAssignment(assignment.id)}>Edit Assignment</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewAssignmentSubmissions(assignment.id)}>View Submissions</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteAssignment(assignment.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {assignment.submitted || 0} submissions
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant={assignment.isPublished ? "default" : "secondary"}>
                        {assignment.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {assignment.maxPoints || 0} points
                      </span>
                    </div>
                    
                    {/* Student action buttons */}
                    {!isMentor && !isAdmin && assignment.isPublished && (
                      <div className="mt-4 pt-3 border-t">
                        <Button 
                          onClick={() => window.location.href = `/assignment/${assignment.id}/submissions`}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Submit Assignment
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Assessments;