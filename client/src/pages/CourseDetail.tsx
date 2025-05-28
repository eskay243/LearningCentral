import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PlayIcon, BookOpenIcon, UsersIcon, ClockIcon, PlusIcon, BellIcon, CalendarIcon, TrashIcon } from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  isPublished: boolean;
  category: string;
  tags: string[];
  enrollmentCount?: number;
  mentors?: { id: string; name: string }[];
  modules?: any[];
}

export default function CourseDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // State for dialogs and forms
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [mentorDialogOpen, setMentorDialogOpen] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  const { data: course, isLoading } = useQuery({
    queryKey: ["/api/courses", id],
    enabled: !!id,
  });

  // Fetch mentors for this course
  const { data: mentors, isLoading: isMentorsLoading } = useQuery({
    queryKey: ["/api/courses", id, "mentors"],
    enabled: !!id,
  });

  // Fetch available mentors for assignment (admin only)
  const { data: availableMentors } = useQuery({
    queryKey: ["/api/mentors/available"],
    enabled: isAdmin,
  });

  // Fetch announcements
  const { data: announcements } = useQuery({
    queryKey: ["/api/courses", id, "announcements"],
    enabled: !!id,
  });

  // Mutations
  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("POST", `/api/courses/${id}/announcements`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", id, "announcements"] });
      setAnnouncementDialogOpen(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
      toast({
        title: "Success",
        description: "Announcement created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  const assignMentorMutation = useMutation({
    mutationFn: async (mentorId: string) => {
      const res = await apiRequest("POST", `/api/courses/${id}/mentors`, { mentorId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", id, "mentors"] });
      setMentorDialogOpen(false);
      setSelectedMentorId("");
      toast({
        title: "Success",
        description: "Mentor assigned successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign mentor",
        variant: "destructive",
      });
    },
  });

  const removeMentorMutation = useMutation({
    mutationFn: async (mentorId: string) => {
      const res = await apiRequest("DELETE", `/api/courses/${id}/mentors/${mentorId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", id, "mentors"] });
      toast({
        title: "Success",
        description: "Mentor removed successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove mentor",
        variant: "destructive",
      });
    },
  });

  const handleCreateAnnouncement = () => {
    if (!announcementTitle || !announcementContent) {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/courses")}>
            Back to Courses
          </Button>
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
              <p className="text-gray-200 text-lg">{course.description}</p>
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
                {isAdmin && (
                  <>
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
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Enroll Now
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
                <div className="space-y-4">
                  <div className="flex items-center p-4 border rounded-lg">
                    <BookOpenIcon className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <h3 className="font-medium">Introduction Module</h3>
                      <p className="text-sm text-gray-600">Getting started with the basics</p>
                    </div>
                  </div>
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading mentor information...</p>
                  </div>
                ) : mentors && mentors.length > 0 ? (
                  <div className="space-y-6">
                    {mentors.map((mentor: any) => (
                      <div key={mentor.id} className="flex gap-4 items-start justify-between">
                        <div className="flex gap-4 items-start">
                          <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                            {mentor.profileImageUrl ? (
                              <img 
                                src={mentor.profileImageUrl} 
                                alt={mentor.name} 
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
                            <p>{mentor.bio || "No bio provided"}</p>
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
                                    {availableMentors?.map((mentor: any) => (
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
                                  {availableMentors?.map((mentor: any) => (
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
                {announcements && announcements.length > 0 ? (
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
                  <p className="text-gray-600">No reviews available yet.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}