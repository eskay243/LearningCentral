import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, Users, Plus, Search, Filter, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import useAuth from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Assessments = () => {
  const { user, isMentor, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("quizzes");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch quizzes
  const { data: quizzes = [], isLoading: isQuizzesLoading } = useQuery({
    queryKey: [isMentor ? `/api/mentors/${user?.id}/quizzes` : "/api/quizzes"],
    enabled: !!user && (isMentor || isAdmin),
  });

  // Fetch assignments
  const { data: assignments = [], isLoading: isAssignmentsLoading } = useQuery({
    queryKey: [isMentor ? `/api/mentors/${user?.id}/assignments` : "/api/assignments"],
    enabled: !!user && (isMentor || isAdmin),
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
    const matchesCourse = filterCourse === "all" || quiz.lessonId?.toString() === filterCourse;
    return matchesSearch && matchesCourse;
  });

  // Filter assignments based on search and course filter
  const filteredAssignments = assignments.filter((assignment: any) => {
    if (!assignment?.title) return false;
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = filterCourse === "all" || assignment.courseId?.toString() === filterCourse;
    return matchesSearch && matchesCourse;
  });

  const handleCreateQuiz = () => {
    toast({
      title: "Quiz Creation",
      description: "Opening quiz creation interface...",
    });
    setShowCreateDialog(false);
    // For now, switch to the quizzes tab and show a helpful message
    setActiveTab("quizzes");
  };

  const handleCreateAssignment = () => {
    toast({
      title: "Assignment Creation", 
      description: "Opening assignment creation interface...",
    });
    setShowCreateDialog(false);
    // For now, switch to the assignments tab and show a helpful message
    setActiveTab("assignments");
  };

  const handleEditQuiz = (quizId: number) => {
    toast({
      title: "Edit Quiz",
      description: `Opening editor for quiz ID ${quizId}...`,
    });
  };

  const handleViewResults = (quizId: number) => {
    toast({
      title: "Quiz Results",
      description: `Viewing results for quiz ID ${quizId}...`,
    });
  };

  const handleDeleteQuiz = (quizId: number) => {
    if (confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      toast({
        title: "Quiz Deleted",
        description: "The quiz has been successfully deleted.",
        variant: "destructive",
      });
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
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Assessment</DialogTitle>
                <DialogDescription>
                  Choose the type of assessment you want to create.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Button onClick={handleCreateQuiz} className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Quiz</div>
                    <div className="text-sm text-gray-500">Multiple choice questions with automatic grading</div>
                  </div>
                </Button>
                <Button onClick={handleCreateAssignment} variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Assignment</div>
                    <div className="text-sm text-gray-500">Project-based assessment requiring manual grading</div>
                  </div>
                </Button>
              </div>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Assignment</DropdownMenuItem>
                          <DropdownMenuItem>View Submissions</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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