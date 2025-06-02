import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Users } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { formatDate, getInitials, formatTimeFromNow } from "@/lib/utils";
import { AddStudentDialog } from "@/components/admin/AddStudentDialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const Students = () => {
  const { user, isMentor, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch students
  const { data: students, isLoading } = useQuery({
    queryKey: [isMentor ? `/api/mentors/${user?.id}/students` : "/api/admin/students"],
    enabled: !!user && (isMentor || isAdmin),
  });

  // Fetch mentor's courses for filtering
  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
    enabled: !!user && (isMentor || isAdmin),
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await apiRequest("DELETE", `/api/admin/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      toast({
        title: "Student account removed",
        description: "The student has been permanently removed from the system along with all their data.",
      });
      setStudentToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Couldn't remove student",
        description: "Something prevented us from deleting this student account. Please check your permissions and try again.",
        variant: "destructive",
      });
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async (data: { id: string; firstName: string; lastName: string; email: string; phone?: string }) => {
      const response = await apiRequest("PUT", `/api/admin/students/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
      setEditingStudent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive",
      });
    },
  });

  const filterStudents = (students: any[]) => {
    if (!students) return [];
    
    return students
      .filter(student => 
        student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(student => 
        courseFilter === "all" || (student.courses && student.courses.some((course: any) => course.id.toString() === courseFilter))
      )
      .filter(student => {
        if (activeTab === "all") return true;
        if (activeTab === "active") return student.lastActive && new Date(student.lastActive).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (activeTab === "completed") return student.completedCourses > 0;
        return true;
      });
  };

  // Mock students data for development
  const mockStudents = [
    {
      id: "1",
      firstName: "Emma",
      lastName: "Johnson",
      email: "emma.j@example.com",
      profileImageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 92,
      totalCourses: 3,
      completedCourses: 2,
      courses: [
        { id: 1, title: "JavaScript Course", progress: 92 },
        { id: 2, title: "HTML & CSS Basics", progress: 100 },
        { id: 3, title: "React Fundamentals", progress: 45 },
      ]
    },
    {
      id: "2",
      firstName: "Alex",
      lastName: "Chen",
      email: "alex.c@example.com",
      profileImageUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 87,
      totalCourses: 2,
      completedCourses: 1,
      courses: [
        { id: 1, title: "JavaScript Course", progress: 75 },
        { id: 3, title: "SQL for Data Science", progress: 100 },
      ]
    },
    {
      id: "3",
      firstName: "Sophia",
      lastName: "Martinez",
      email: "sophia.m@example.com",
      profileImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      lastActive: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 78,
      totalCourses: 1,
      completedCourses: 0,
      courses: [
        { id: 2, title: "Python for Beginners", progress: 78 },
      ]
    },
    {
      id: "4",
      firstName: "David",
      lastName: "Kim",
      email: "david.k@example.com",
      profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      lastActive: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 65,
      totalCourses: 2,
      completedCourses: 0,
      courses: [
        { id: 1, title: "JavaScript Course", progress: 65 },
        { id: 3, title: "SQL for Data Science", progress: 32 },
      ]
    },
  ];
  
  const filteredStudents = filterStudents(students || mockStudents);
  
  // Mock courses for filtering
  const mockCourses = [
    { id: 1, title: "JavaScript Course" },
    { id: 2, title: "Python for Beginners" },
    { id: 3, title: "SQL for Data Science" },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-800">Students</h1>
          <p className="mt-1 text-gray-500">
            {isMentor 
              ? "Manage and monitor your students' progress"
              : "View and manage all students in the platform"
            }
          </p>
        </div>
        
        {/* Admin Actions */}
        {isAdmin && (
          <div className="mt-4 sm:mt-0">
            <AddStudentDialog 
              trigger={
                <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg">
                  <Plus className="w-4 h-4" />
                  Add Student
                </Button>
              }
            />
          </div>
        )}
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-semibold">{filteredStudents.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <i className="ri-user-line text-2xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Students</p>
                <p className="text-2xl font-semibold">
                  {filteredStudents.filter(s => 
                    new Date(s.lastActive).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
                  ).length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <i className="ri-user-follow-line text-2xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Course Completions</p>
                <p className="text-2xl font-semibold">
                  {filteredStudents.reduce((acc, student) => acc + (student.completedCourses || 0), 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <i className="ri-medal-line text-2xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters & Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end md:items-center">
        <div className="flex-grow">
          <Input
            placeholder="Search students..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select 
            value={courseFilter} 
            onValueChange={setCourseFilter}
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
          
          <Button variant="outline">
            <i className="ri-download-line mr-2"></i>
            Export
          </Button>
        </div>
      </div>
      
      {/* Student Tabs & Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed Courses</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No students found matching your criteria</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Courses</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                                <AvatarImage src={student.profileImageUrl} />
                                <AvatarFallback>
                                  {getInitials(`${student.firstName} ${student.lastName}`)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{student.firstName} {student.lastName}</p>
                                <p className="text-sm text-gray-500 truncate">{student.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="font-medium">{student.totalCourses}</span>
                              <span className="mx-2 text-gray-300">/</span>
                              <span className="text-green-600">{student.completedCourses} completed</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(student.courses || []).slice(0, 2).map((course: any) => (
                                <Badge key={course.id} variant="outline" className="text-xs">
                                  {course.title.length > 15 ? course.title.substring(0, 15) + '...' : course.title}
                                </Badge>
                              ))}
                              {(student.courses || []).length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(student.courses || []).length - 2} more
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium mb-1">{student.progress}%</span>
                              <Progress value={student.progress} className="h-2 w-32" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {student.lastActive ? formatTimeFromNow(student.lastActive) : 'Never'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {student.lastActive ? formatDate(student.lastActive, true) : 'No activity'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="whitespace-nowrap"
                                onClick={() => window.location.href = `/messages?student=${student.id}`}
                              >
                                <i className="ri-message-line mr-1"></i>
                                Message
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => window.location.href = `/student-profile/${student.id}`}
                              >
                                View
                              </Button>
                              {isAdmin && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingStudent(student)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => setStudentToDelete(student)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Student Dialog */}
      {editingStudent && (
        <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>
                Update the student's information below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="firstName" className="text-right">
                  First Name
                </label>
                <Input
                  id="firstName"
                  defaultValue={editingStudent.firstName}
                  className="col-span-3"
                  onChange={(e) => setEditingStudent({...editingStudent, firstName: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="lastName" className="text-right">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  defaultValue={editingStudent.lastName}
                  className="col-span-3"
                  onChange={(e) => setEditingStudent({...editingStudent, lastName: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="email" className="text-right">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={editingStudent.email}
                  className="col-span-3"
                  onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="phone" className="text-right">
                  Phone
                </label>
                <Input
                  id="phone"
                  defaultValue={editingStudent.phone || ''}
                  className="col-span-3"
                  onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingStudent(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => updateStudentMutation.mutate(editingStudent)}
                disabled={updateStudentMutation.isPending}
              >
                {updateStudentMutation.isPending ? "Updating..." : "Update Student"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Student Confirmation */}
      {studentToDelete && (
        <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete{" "}
                <strong>{studentToDelete.firstName} {studentToDelete.lastName}</strong>{" "}
                and remove all their data from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStudentToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteStudentMutation.mutate(studentToDelete.id)}
                disabled={deleteStudentMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteStudentMutation.isPending ? "Deleting..." : "Delete Student"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Students;
