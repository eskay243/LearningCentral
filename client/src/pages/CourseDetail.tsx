import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { 
  UsersIcon, 
  ClockIcon, 
  PlayIcon, 
  BookOpenIcon, 
  BellIcon,
  PlusIcon,
  CalendarIcon,
  EditIcon
} from "lucide-react";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Dialog states
  const [mentorDialogOpen, setMentorDialogOpen] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");

  // Check if user is admin or mentor
  const isAdmin = user?.role === 'admin';
  const isMentor = user?.role === 'mentor';
  const canEdit = isAdmin || isMentor;

  // Fetch course data
  const { data: course, isLoading } = useQuery({
    queryKey: [`/api/courses/${id}`],
    enabled: !!id,
  });

  // Check enrollment status
  const { data: enrollmentStatus, isLoading: isEnrollmentLoading } = useQuery({
    queryKey: [`/api/courses/${id}/enrollment-status`],
    enabled: !!id && isAuthenticated,
  });

  // Fetch mentors for this course
  const { data: mentors, isLoading: isMentorsLoading } = useQuery({
    queryKey: [`/api/courses/${id}/mentors`],
    enabled: !!id,
  });

  // Fetch available mentors for assignment (admin only)
  const { data: availableMentors } = useQuery({
    queryKey: ["/api/mentors/available"],
    enabled: isAdmin,
  });

  // Fetch announcements
  const { data: announcements } = useQuery({
    queryKey: [`/api/courses/${id}/announcements`],
    enabled: !!id,
  });

  // Fetch modules and lessons for curriculum
  const { data: modules } = useQuery({
    queryKey: [`/api/courses/${id}/modules`],
    enabled: !!id,
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("POST", `/api/courses/${id}/announcements`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Announcement created successfully!",
      });
      setAnnouncementDialogOpen(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}/announcements`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  // Assign mentor mutation
  const assignMentorMutation = useMutation({
    mutationFn: async (mentorId: string) => {
      const res = await apiRequest("POST", `/api/courses/${id}/mentors`, { mentorId });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Mentor assigned successfully!",
      });
      setMentorDialogOpen(false);
      setSelectedMentorId("");
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}/mentors`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign mentor",
        variant: "destructive",
      });
    },
  });

  // Remove mentor mutation
  const removeMentorMutation = useMutation({
    mutationFn: async (mentorId: string) => {
      const res = await apiRequest("DELETE", `/api/courses/${id}/mentors/${mentorId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Mentor removed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}/mentors`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove mentor",
        variant: "destructive",
      });
    },
  });

  // Enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/courses/${id}/enroll`);
      return res.json();
    },
    onSuccess: () => {
      if (course?.price && course.price > 0) {
        // Redirect to payment page for paid courses
        setLocation(`/payment?courseId=${id}&amount=${course.price}`);
      } else {
        // Free course enrollment
        toast({
          title: "Success",
          description: "You have been enrolled in this course!",
        });
        queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}`] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll in course",
        variant: "destructive",
      });
    },
  });

  const handleCreateAnnouncement = () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    createAnnouncementMutation.mutate({
      title: announcementTitle,
      content: announcementContent,
    });
  };

  const handleAssignMentor = () => {
    if (!selectedMentorId) {
      toast({
        title: "Validation Error",
        description: "Please select a mentor",
        variant: "destructive",
      });
      return;
    }
    assignMentorMutation.mutate(selectedMentorId);
  };

  const handleEnroll = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to enroll in this course",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    
    // If already enrolled, go directly to course content without enrolling again
    if (isEnrolled) {
      setLocation(`/courses/${id}/view`);
      return;
    }
    
    // Only enroll if not already enrolled
    enrollMutation.mutate();
  };

  // Check if user is enrolled - handle both data structures
  const isEnrolled = enrollmentStatus?.isEnrolled === true;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Course not found</h2>
          <p className="text-gray-600">The course you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="relative h-64 bg-gradient-to-r from-purple-600 to-blue-600">
            {course.thumbnail && (
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Badge variant="secondary">{course.category}</Badge>
              <div className="flex items-center text-gray-600">
                <UsersIcon className="h-4 w-4 mr-1" />
                <span>{course.enrollmentCount || 0} students</span>
              </div>
              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>Self-paced</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">
                ₦{course.price?.toLocaleString()}
              </div>
              <div className="flex gap-2">
                {canEdit && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation(`/courses/${id}/edit`)}
                    >
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit Course
                    </Button>
                    <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <BellIcon className="h-4 w-4 mr-2" />
                          Create Announcement
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Course Announcement</DialogTitle>
                          <DialogDescription>
                            Share important updates with students enrolled in this course.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="announcement-title">Title</Label>
                            <Input
                              id="announcement-title"
                              value={announcementTitle}
                              onChange={(e) => setAnnouncementTitle(e.target.value)}
                              placeholder="Enter announcement title"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="announcement-content">Content</Label>
                            <Textarea
                              id="announcement-content"
                              value={announcementContent}
                              onChange={(e) => setAnnouncementContent(e.target.value)}
                              placeholder="Enter announcement content"
                              rows={4}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAnnouncementDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleCreateAnnouncement}
                            disabled={createAnnouncementMutation.isPending}
                          >
                            {createAnnouncementMutation.isPending ? "Creating..." : "Create Announcement"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
                <Button 
                  size="lg" 
                  className={isEnrolled ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"}
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending || isEnrollmentLoading}
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  {enrollMutation.isPending 
                    ? "Processing..." 
                    : isEnrollmentLoading
                      ? "Loading..."
                      : isEnrolled 
                        ? "Continue Learning" 
                        : "Start Learning"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
            <TabsTrigger value="mentors">Mentors</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
                <CardDescription>
                  Learn what this course covers and what you'll achieve
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {course.description || "No detailed description available for this course."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="curriculum">
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>
                  Detailed breakdown of lessons and modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                {modules && Array.isArray(modules) && modules.length > 0 ? (
                  <div className="space-y-6">
                    {modules.map((module: any, moduleIndex: number) => (
                      <div key={module.id} className="border rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-purple-600 font-medium">{moduleIndex + 1}</span>
                          </div>
                          <div>
                            <h3 className="font-medium text-lg">{module.title}</h3>
                            <p className="text-sm text-gray-600">{module.description}</p>
                          </div>
                        </div>
                        
                        {module.lessons && Array.isArray(module.lessons) && module.lessons.length > 0 ? (
                          <div className="ml-11 space-y-2">
                            {module.lessons.map((lesson: any) => (
                              <div key={lesson.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <BookOpenIcon className="h-4 w-4 text-gray-400 mr-3" />
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{lesson.title}</h4>
                                  <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <span>{lesson.type || 'Lesson'}</span>
                                    {lesson.duration && (
                                      <>
                                        <span className="mx-2">•</span>
                                        <span>{lesson.duration} min</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {isAdmin && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={() => setLocation(`/courses/${id}/lessons/${lesson.id}/edit`)}
                                  >
                                    Edit
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="ml-11 text-sm text-gray-500 py-2">
                            No lessons in this module yet
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isAdmin && (
                      <div className="text-center pt-4 space-x-2">
                        <Button variant="outline" onClick={() => setLocation(`/courses/${id}/curriculum`)}>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Module
                        </Button>
                        <Button variant="outline" onClick={() => setLocation(`/courses/${id}/lessons/new`)}>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Lesson
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-1">No curriculum available</h3>
                    <p className="text-gray-600 mb-4">
                      {isAdmin 
                        ? "Start building your course by adding modules and lessons"
                        : "This course doesn't have a curriculum yet"}
                    </p>
                    {isAdmin && (
                      <Button onClick={() => setLocation(`/create-course?edit=${id}`)}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Create Curriculum
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discussion">
            <Card>
              <CardHeader>
                <CardTitle>Course Discussion</CardTitle>
                <CardDescription>
                  Engage with fellow students and instructors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.524A11.956 11.956 0 002.001 18c0-1.01.327-1.93.876-2.68A8.998 8.998 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Join the Discussion</h3>
                  <p className="text-gray-600 mb-4">
                    Connect with your classmates and instructors in dedicated discussion forums
                  </p>
                  <Button 
                    onClick={() => setLocation(`/courses/${id}/discussion`)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Open Discussion Forum
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentors">
            <Card>
              <CardHeader>
                <CardTitle>Course Mentors</CardTitle>
                <CardDescription>
                  Meet your instructors and guides for this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isMentorsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading mentor information...</p>
                  </div>
                ) : mentors && Array.isArray(mentors) && mentors.length > 0 ? (
                  <div className="space-y-6">
                    {mentors.map((mentor: any) => (
                      <div key={mentor.id} className="flex gap-4 items-start justify-between">
                        <div className="flex gap-4 items-start">
                          <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                            {mentor.profileImageUrl ? (
                              <img 
                                src={mentor.profileImageUrl} 
                                alt={`${mentor.firstName} ${mentor.lastName}`} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400">
                                <UsersIcon className="h-8 w-8" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-lg">{mentor.firstName} {mentor.lastName}</h3>
                            <p className="text-gray-500 mb-1">{mentor.email}</p>
                            <p className="text-gray-500 mb-2">Course Mentor</p>
                            <p>{mentor.bio || "Experienced instructor dedicated to helping students succeed"}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMentorMutation.mutate(mentor.id)}
                            disabled={removeMentorMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            {removeMentorMutation.isPending ? "Removing..." : "Remove"}
                          </Button>
                        )}
                      </div>
                    ))}
                    {isAdmin && (
                      <div className="mt-6 text-center">
                        <Dialog open={mentorDialogOpen} onOpenChange={setMentorDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Assign More Mentors
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Assign Mentor to Course</DialogTitle>
                              <DialogDescription>
                                Select a mentor to help guide students in this course.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="mentor-select">Select Mentor</Label>
                                <Select value={selectedMentorId} onValueChange={setSelectedMentorId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a mentor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableMentors && Array.isArray(availableMentors) && availableMentors.map((mentor: any) => (
                                      <SelectItem key={mentor.id} value={mentor.id}>
                                        {mentor.firstName} {mentor.lastName} ({mentor.email})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setMentorDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleAssignMentor}
                                disabled={assignMentorMutation.isPending}
                              >
                                {assignMentorMutation.isPending ? "Assigning..." : "Assign Mentor"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg">
                    <div className="text-5xl mb-2">👨‍🏫</div>
                    <h3 className="text-lg font-medium mb-1">No mentors assigned</h3>
                    <p className="text-gray-500 mb-4">
                      {isAdmin
                        ? "Assign mentors to help teach and manage this course"
                        : "This course doesn't have any mentors assigned yet"}
                    </p>
                    {isAdmin && (
                      <Dialog open={mentorDialogOpen} onOpenChange={setMentorDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Assign Mentors
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Mentor to Course</DialogTitle>
                            <DialogDescription>
                              Select a mentor to help guide students in this course.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="mentor-select">Select Mentor</Label>
                              <Select value={selectedMentorId} onValueChange={setSelectedMentorId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a mentor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableMentors && Array.isArray(availableMentors) && availableMentors.map((mentor: any) => (
                                    <SelectItem key={mentor.id} value={mentor.id}>
                                      {mentor.firstName} {mentor.lastName} ({mentor.email})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setMentorDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleAssignMentor}
                              disabled={assignMentorMutation.isPending}
                            >
                              {assignMentorMutation.isPending ? "Assigning..." : "Assign Mentor"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Course Announcements</CardTitle>
                <CardDescription>
                  Important updates and information from your instructors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {announcements && Array.isArray(announcements) && announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map((announcement: any) => (
                      <div key={announcement.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg mb-2">{announcement.title}</h3>
                            <p className="text-gray-700 mb-3">{announcement.content}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-1">No announcements yet</h3>
                    <p className="text-gray-600">
                      {isAdmin 
                        ? "Create announcements to keep students informed"
                        : "Check back later for important updates from your instructors"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Student Reviews</CardTitle>
                <CardDescription>
                  See what other students are saying about this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-5xl mb-2">⭐</div>
                  <h3 className="text-lg font-medium mb-1">No reviews yet</h3>
                  <p className="text-gray-600">Be the first to review this course after enrollment!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}