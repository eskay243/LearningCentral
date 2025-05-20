import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Eye, FileText, Check, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import QuizCreator from "@/components/quiz/QuizCreator";
import QuizTaker from "@/components/quiz/QuizTaker";
import AssignmentSubmission from "@/components/assessment/AssignmentSubmission";
import AssignmentGrading from "@/components/assessment/AssignmentGrading";

const Assessments = () => {
  const { user, isMentor, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("quizzes");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch quizzes
  const { data: quizzes, isLoading: isQuizzesLoading } = useQuery({
    queryKey: [isMentor ? `/api/mentors/${user?.id}/quizzes` : "/api/quizzes"],
    enabled: !!user && (isMentor || isAdmin),
  });

  // Fetch assignments
  const { data: assignments, isLoading: isAssignmentsLoading } = useQuery({
    queryKey: [isMentor ? `/api/mentors/${user?.id}/assignments` : "/api/assignments"],
    enabled: !!user && (isMentor || isAdmin),
  });

  // Fetch courses for filter dropdown
  const { data: courses, isLoading: isCoursesLoading } = useQuery({
    queryKey: ["/api/courses"],
    enabled: !!user && (isMentor || isAdmin),
  });

  // Mock data for development
  const mockQuizzes = [
    {
      id: 1,
      title: "JavaScript Fundamentals Quiz",
      course: { id: 1, title: "Advanced JavaScript Concepts" },
      module: { id: 1, title: "Module 1: Fundamentals" },
      lesson: { id: 1, title: "Introduction to JavaScript" },
      questionCount: 15,
      passingScore: 70,
      attempts: 45,
      avgScore: 82,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      title: "Python Syntax Quiz",
      course: { id: 2, title: "Python for Beginners" },
      module: { id: 4, title: "Module 1: Getting Started" },
      lesson: { id: 10, title: "Python Syntax Basics" },
      questionCount: 10,
      passingScore: 60,
      attempts: 32,
      avgScore: 75,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      title: "SQL Joins Assessment",
      course: { id: 3, title: "SQL for Data Science" },
      module: { id: 7, title: "Module 2: Advanced Queries" },
      lesson: { id: 15, title: "Understanding SQL Joins" },
      questionCount: 8,
      passingScore: 75,
      attempts: 18,
      avgScore: 79,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const mockAssignments = [
    {
      id: 1,
      title: "Create a JavaScript Calculator",
      course: { id: 1, title: "Advanced JavaScript Concepts" },
      module: { id: 2, title: "Module 2: DOM Manipulation" },
      lesson: { id: 5, title: "Working with the DOM" },
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      submissions: 12,
      pending: 3,
      graded: 9,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      title: "Build a Python Data Analysis Tool",
      course: { id: 2, title: "Python for Beginners" },
      module: { id: 5, title: "Module 2: Data Structures" },
      lesson: { id: 12, title: "Lists and Dictionaries" },
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      submissions: 8,
      pending: 8,
      graded: 0,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      title: "Design a Database Schema",
      course: { id: 3, title: "SQL for Data Science" },
      module: { id: 8, title: "Module 3: Database Design" },
      lesson: { id: 18, title: "Normalization and Relationships" },
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      submissions: 5,
      pending: 5,
      graded: 0,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const mockCourses = [
    { id: 1, title: "Advanced JavaScript Concepts" },
    { id: 2, title: "Python for Beginners" },
    { id: 3, title: "SQL for Data Science" },
  ];

  // Filter quizzes based on search and course filter
  const filteredQuizzes = (quizzes || mockQuizzes)
    .filter((quiz) => 
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.course.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((quiz) => filterCourse === "all" || quiz.course.id.toString() === filterCourse);

  // Filter assignments based on search and course filter
  const filteredAssignments = (assignments || mockAssignments)
    .filter((assignment) => 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((assignment) => filterCourse === "all" || assignment.course.id.toString() === filterCourse);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-800">Assessments</h1>
          <p className="mt-1 text-gray-500">Create and manage quizzes and assignments for your courses</p>
        </div>
        
        {(isMentor || isAdmin) && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <i className="ri-add-line mr-2"></i>
            Create Assessment
          </Button>
        )}
      </div>

      {/* Filters & Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end md:items-center">
        <div className="flex-grow">
          <Input
            placeholder="Search assessments..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select 
            value={filterCourse}
            onValueChange={setFilterCourse}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {(courses || mockCourses).map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs for Quiz and Assignment sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes">
          <Card>
            <CardContent className="p-0">
              {isQuizzesLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredQuizzes.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No quizzes found matching your criteria</p>
                  {(isMentor || isAdmin) && (
                    <Button 
                      className="mt-4"
                      onClick={() => {
                        setShowCreateDialog(true); 
                        setActiveTab("quizzes");
                      }}
                    >
                      Create Your First Quiz
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quiz Title</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Passing Score</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Avg. Score</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuizzes.map((quiz) => (
                      <TableRow key={quiz.id}>
                        <TableCell className="font-medium">{quiz.title}</TableCell>
                        <TableCell>
                          <div>
                            <p>{quiz.course.title}</p>
                            <p className="text-xs text-gray-500">{quiz.lesson.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>{quiz.questionCount}</TableCell>
                        <TableCell>{quiz.passingScore}%</TableCell>
                        <TableCell>{quiz.attempts}</TableCell>
                        <TableCell>
                          <Badge variant={quiz.avgScore >= quiz.passingScore ? "success" : "destructive"}>
                            {quiz.avgScore}%
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(quiz.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button size="sm">
                              View Results
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <Card>
            <CardContent className="p-0">
              {isAssignmentsLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No assignments found matching your criteria</p>
                  {(isMentor || isAdmin) && (
                    <Button 
                      className="mt-4"
                      onClick={() => {
                        setShowCreateDialog(true);
                        setActiveTab("assignments");
                      }}
                    >
                      Create Your First Assignment
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment Title</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Graded</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.title}</TableCell>
                        <TableCell>
                          <div>
                            <p>{assignment.course.title}</p>
                            <p className="text-xs text-gray-500">{assignment.lesson.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(assignment.dueDate)}</TableCell>
                        <TableCell>{assignment.submissions}</TableCell>
                        <TableCell>
                          <Badge variant={assignment.pending > 0 ? "secondary" : "outline"}>
                            {assignment.pending}
                          </Badge>
                        </TableCell>
                        <TableCell>{assignment.graded}</TableCell>
                        <TableCell>{formatDate(assignment.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button size="sm">
                              Review
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Assessment Dialog */}
      {(isMentor || isAdmin) && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Assessment</DialogTitle>
              <DialogDescription>
                Add a new quiz or assignment to your course
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="quiz" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
              </TabsList>

              <TabsContent value="quiz" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quiz Title</label>
                    <Input placeholder="Enter quiz title" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {(courses || mockCourses).map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Module</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mod1">Module 1: Fundamentals</SelectItem>
                          <SelectItem value="mod2">Module 2: Advanced Topics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lesson</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lesson" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lesson1">Introduction to JavaScript</SelectItem>
                          <SelectItem value="lesson2">Variables and Data Types</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea placeholder="Enter quiz description" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Passing Score (%)</label>
                      <Input type="number" min="0" max="100" defaultValue="70" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time Limit (minutes)</label>
                      <Input type="number" min="0" defaultValue="30" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="assignment" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Assignment Title</label>
                    <Input placeholder="Enter assignment title" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {(courses || mockCourses).map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Module</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select module" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mod1">Module 1: Fundamentals</SelectItem>
                          <SelectItem value="mod2">Module 2: Advanced Topics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lesson</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lesson" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lesson1">Introduction to JavaScript</SelectItem>
                          <SelectItem value="lesson2">Variables and Data Types</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description & Instructions</label>
                    <Textarea placeholder="Enter detailed assignment instructions" className="min-h-32" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Due Date</label>
                      <Input type="date" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Maximum Points</label>
                      <Input type="number" min="0" defaultValue="100" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button>Create Assessment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Assessments;
