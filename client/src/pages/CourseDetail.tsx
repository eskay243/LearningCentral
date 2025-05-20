import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import useAuth from "@/hooks/useAuth";
import { UserRole } from "@/types";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { CheckIcon, PlusIcon, FileIcon, PlayIcon, UsersIcon, EditIcon, TrashIcon, LockIcon, UnlockIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const CourseDetail = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("content");
  const [isEditMode, setIsEditMode] = useState(false);
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    price: 0,
    isPublished: false,
    category: "",
    tags: [],
  });
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [newLesson, setNewLesson] = useState({
    title: "",
    description: "",
    content: "",
    contentType: "text",
    isPreview: false,
    orderIndex: 0,
  });

  // Fetch course details
  const {
    data: course,
    isLoading: isCourseLoading,
    isError: isCourseError,
  } = useQuery({
    queryKey: [`/api/courses/${id}`],
    enabled: !!id,
  });

  // Fetch course modules
  const {
    data: modules,
    isLoading: isModulesLoading,
    isError: isModulesError,
  } = useQuery({
    queryKey: [`/api/courses/${id}/modules`],
    enabled: !!id,
  });

  // Fetch course mentors
  const {
    data: mentors,
    isLoading: isMentorsLoading,
  } = useQuery({
    queryKey: [`/api/courses/${id}/mentors`],
    enabled: !!id,
  });

  // Fetch course enrollment status
  const {
    data: enrollment,
    isLoading: isEnrollmentLoading,
  } = useQuery({
    queryKey: [`/api/courses/${id}/enrollment`],
    enabled: !!id && isAuthenticated,
  });

  useEffect(() => {
    if (course) {
      setCourseData({
        title: course.title || "",
        description: course.description || "",
        thumbnail: course.thumbnail || "",
        price: course.price || 0,
        isPublished: course.isPublished || false,
        category: course.category || "",
        tags: course.tags || [],
      });
    }
  }, [course]);

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const response = await apiRequest("POST", "/api/modules", moduleData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create module");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}/modules`] });
      setModuleDialogOpen(false);
      setNewModule({ title: "", description: "" });
      toast({
        title: "Module created",
        description: "The module has been added to your course.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: any) => {
      const response = await apiRequest("POST", "/api/lessons", lessonData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create lesson");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/modules/${selectedModuleId}/lessons`] });
      setLessonDialogOpen(false);
      setNewLesson({
        title: "",
        description: "",
        content: "",
        contentType: "text",
        isPreview: false,
        orderIndex: 0,
      });
      toast({
        title: "Lesson created",
        description: "The lesson has been added to the module.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create lesson",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async (updatedCourse: any) => {
      const response = await apiRequest("PUT", `/api/courses/${id}`, updatedCourse);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update course");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}`] });
      setIsEditMode(false);
      toast({
        title: "Course updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Enroll in course mutation
  const enrollCourseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/courses/${id}/enroll`, {});
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to enroll in course");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${id}/enrollment`] });
      toast({
        title: "Enrolled successfully",
        description: "You have been enrolled in this course.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to enroll",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateModule = () => {
    if (!newModule.title) {
      toast({
        title: "Missing information",
        description: "Please provide a title for the module.",
        variant: "destructive",
      });
      return;
    }

    createModuleMutation.mutate({
      courseId: parseInt(id as string),
      title: newModule.title,
      description: newModule.description,
      orderIndex: modules?.length || 0,
    });
  };

  const handleCreateLesson = () => {
    if (!newLesson.title || !selectedModuleId) {
      toast({
        title: "Missing information",
        description: "Please provide a title for the lesson and select a module.",
        variant: "destructive",
      });
      return;
    }

    createLessonMutation.mutate({
      moduleId: selectedModuleId,
      title: newLesson.title,
      description: newLesson.description,
      content: newLesson.content,
      contentType: newLesson.contentType,
      isPreview: newLesson.isPreview,
      orderIndex: newLesson.orderIndex,
    });
  };

  const handleUpdateCourse = () => {
    updateCourseMutation.mutate(courseData);
  };

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    enrollCourseMutation.mutate();
  };

  const renderLessons = (moduleId: number, lessons: any[]) => {
    if (!lessons || lessons.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No lessons yet. Add your first lesson to this module.
        </div>
      );
    }

    return lessons.map((lesson) => (
      <div 
        key={lesson.id} 
        className="flex items-center justify-between py-2 sm:py-3 border-b last:border-0 dark:border-gray-700"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {lesson.contentType === "video" ? (
            <PlayIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
          ) : lesson.contentType === "quiz" ? (
            <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
          ) : (
            <FileIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 dark:text-gray-400" />
          )}
          <div>
            <div className="font-medium text-sm sm:text-base dark:text-gray-200">
              {lesson.title}
              {lesson.isPreview && (
                <Badge variant="outline" className="ml-1 sm:ml-2 text-[10px] sm:text-xs">
                  Preview
                </Badge>
              )}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              {lesson.contentType === "video" 
                ? `${Math.floor(lesson.duration / 60)}:${String(lesson.duration % 60).padStart(2, '0')}`
                : lesson.contentType === "quiz"
                ? "Quiz"
                : "Text lesson"
              }
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {(user?.role === UserRole.ADMIN || user?.role === UserRole.MENTOR) && (
            <>
              <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                <EditIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              {lesson.isPreview ? (
                <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                  <UnlockIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                  <LockIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-500">
                <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    ));
  };

  if (isCourseLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isCourseError || !course) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Course</h2>
        <p className="text-gray-600 mb-4">
          We couldn't load the course information. Please try again later.
        </p>
        <Button onClick={() => navigate("/courses")}>Back to Courses</Button>
      </div>
    );
  }

  const isEnrolled = enrollment && enrollment.id;
  const isMentor = user?.role === UserRole.MENTOR && mentors?.some(mentor => mentor.id === user.id);
  const isAdmin = user?.role === UserRole.ADMIN;
  const canEdit = isAdmin || isMentor;

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Course Information Column */}
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={course.isPublished ? "success" : "secondary"} className="text-xs sm:text-sm">
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
                {course.category && <Badge variant="outline" className="text-xs sm:text-sm">{course.category}</Badge>}
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                {isEditMode ? (
                  <>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => setIsEditMode(false)}>
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={handleUpdateCourse}
                      disabled={updateCourseMutation.isPending}
                    >
                      {updateCourseMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm" onClick={() => setIsEditMode(true)}>
                    <EditIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Edit Course
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Course Image */}
          <div className="mb-4 sm:mb-6 relative rounded-lg overflow-hidden h-48 sm:h-64 bg-gray-100 dark:bg-gray-800">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl mb-2">🖼️</div>
                  <div className="text-sm sm:text-base">No thumbnail image</div>
                </div>
              </div>
            )}
            {isEditMode && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 sm:p-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                  <Label htmlFor="thumbnail" className="text-white text-xs sm:text-sm whitespace-nowrap">Thumbnail URL:</Label>
                  <Input 
                    id="thumbnail"
                    value={courseData.thumbnail}
                    onChange={(e) => setCourseData({...courseData, thumbnail: e.target.value})}
                    className="bg-transparent text-white text-xs sm:text-sm h-8"
                    size={20}
                  />
                </div>
              </div>
            )}
          </div>

          {isEditMode ? (
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input 
                  id="title"
                  value={courseData.title}
                  onChange={(e) => setCourseData({...courseData, title: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  value={courseData.description}
                  onChange={(e) => setCourseData({...courseData, description: e.target.value})}
                  className="min-h-32"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input 
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={courseData.price}
                    onChange={(e) => setCourseData({...courseData, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input 
                    id="category"
                    value={courseData.category}
                    onChange={(e) => setCourseData({...courseData, category: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isPublished"
                  checked={courseData.isPublished}
                  onCheckedChange={(checked) => setCourseData({...courseData, isPublished: checked})}
                />
                <Label htmlFor="isPublished">Published</Label>
                <div className="text-sm text-gray-500 ml-2">
                  {courseData.isPublished 
                    ? "Course is visible to students" 
                    : "Course is in draft mode"
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-gray-500" />
                  <span>
                    <strong>{course.enrollmentCount || 0}</strong> students enrolled
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    <strong>Price:</strong> {course.price > 0 ? formatCurrency(course.price) : "Free"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Course Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-full sm:max-w-md gap-1 p-1">
              <TabsTrigger value="content" className="text-xs sm:text-sm py-1.5">Content</TabsTrigger>
              <TabsTrigger value="discussions" className="text-xs sm:text-sm py-1.5">Discussions</TabsTrigger>
              <TabsTrigger value="announcements" className="text-xs sm:text-sm py-1.5">Announcements</TabsTrigger>
              <TabsTrigger value="mentors" className="text-xs sm:text-sm py-1.5">Mentors</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-6">
              {canEdit && (
                <div className="flex justify-end">
                  <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Module
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create a New Module</DialogTitle>
                        <DialogDescription>
                          Add a module to organize your course content.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="module-title">Module Title</Label>
                          <Input 
                            id="module-title" 
                            placeholder="e.g. Introduction to JavaScript"
                            value={newModule.title}
                            onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="module-description">Description (Optional)</Label>
                          <Textarea 
                            id="module-description" 
                            placeholder="Briefly describe what this module covers"
                            value={newModule.description}
                            onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateModule}
                          disabled={createModuleMutation.isPending}
                        >
                          {createModuleMutation.isPending ? "Creating..." : "Create Module"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {isModulesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading modules...</p>
                </div>
              ) : modules && modules.length > 0 ? (
                <div className="space-y-6">
                  {modules.map((module: any) => (
                    <Card key={module.id} className="dark:bg-gray-800">
                      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 sm:gap-0">
                          <div>
                            <CardTitle className="text-base sm:text-lg dark:text-white">{module.title}</CardTitle>
                            {module.description && (
                              <CardDescription className="text-xs sm:text-sm dark:text-gray-300">{module.description}</CardDescription>
                            )}
                          </div>
                          {canEdit && (
                            <Dialog open={lessonDialogOpen && selectedModuleId === module.id} onOpenChange={(open) => {
                              setLessonDialogOpen(open);
                              if (open) setSelectedModuleId(module.id);
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <PlusIcon className="h-4 w-4 mr-2" />
                                  Add Lesson
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Create a New Lesson</DialogTitle>
                                  <DialogDescription>
                                    Add a lesson to the module "{module.title}".
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="lesson-title">Lesson Title</Label>
                                    <Input 
                                      id="lesson-title" 
                                      placeholder="e.g. Variables and Data Types"
                                      value={newLesson.title}
                                      onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="lesson-description">Description (Optional)</Label>
                                    <Textarea 
                                      id="lesson-description" 
                                      placeholder="Briefly describe what this lesson covers"
                                      value={newLesson.description}
                                      onChange={(e) => setNewLesson({...newLesson, description: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="lesson-content">Content</Label>
                                    <Textarea 
                                      id="lesson-content" 
                                      placeholder="Lesson content (markdown supported)"
                                      className="min-h-32"
                                      value={newLesson.content}
                                      onChange={(e) => setNewLesson({...newLesson, content: e.target.value})}
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch 
                                      id="is-preview"
                                      checked={newLesson.isPreview}
                                      onCheckedChange={(checked) => setNewLesson({...newLesson, isPreview: checked})}
                                    />
                                    <Label htmlFor="is-preview">Free Preview</Label>
                                    <div className="text-sm text-gray-500 ml-2">
                                      Make this lesson available as a free preview
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={handleCreateLesson}
                                    disabled={createLessonMutation.isPending}
                                  >
                                    {createLessonMutation.isPending ? "Creating..." : "Create Lesson"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {module.lessons ? (
                          renderLessons(module.id, module.lessons)
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            {canEdit 
                              ? "Add your first lesson to this module" 
                              : "No lessons available yet"}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <div className="text-5xl mb-2">📚</div>
                  <h3 className="text-lg font-medium mb-1">No content yet</h3>
                  <p className="text-gray-500 mb-4">
                    {canEdit
                      ? "Start building your course by adding modules and lessons"
                      : "The instructor is still building this course"}
                  </p>
                  {canEdit && (
                    <Button onClick={() => setModuleDialogOpen(true)}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add First Module
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="discussions" className="mt-6">
              <div className="text-center py-8 border rounded-lg">
                <div className="text-5xl mb-2">💬</div>
                <h3 className="text-lg font-medium mb-1">Discussion forum</h3>
                <p className="text-gray-500 mb-4">
                  {isEnrolled
                    ? "Join the conversation with your peers and instructors"
                    : "Enroll in this course to join the discussion forum"}
                </p>
                {isEnrolled ? (
                  <Button>View Discussions</Button>
                ) : (
                  <Button onClick={handleEnroll}>Enroll to Access</Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="announcements" className="mt-6">
              <div className="text-center py-8 border rounded-lg">
                <div className="text-5xl mb-2">📢</div>
                <h3 className="text-lg font-medium mb-1">Announcements</h3>
                <p className="text-gray-500 mb-4">
                  {canEdit
                    ? "Keep your students updated with important information"
                    : "Stay updated with important course announcements"}
                </p>
                {canEdit && (
                  <Button>Create Announcement</Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="mentors" className="mt-6">
              {isMentorsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading mentor information...</p>
                </div>
              ) : mentors && mentors.length > 0 ? (
                <div className="space-y-6">
                  {mentors.map((mentor: any) => (
                    <div key={mentor.id} className="flex gap-4 items-start">
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
                        <h3 className="font-medium text-lg">{mentor.name}</h3>
                        <p className="text-gray-500 mb-2">Instructor</p>
                        <p>{mentor.bio || "No bio provided"}</p>
                      </div>
                    </div>
                  ))}
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
                    <Button>Assign Mentors</Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Enrollment Column */}
        <div>
          <Card className="sticky top-6">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold mb-2">
                  {course.price > 0 ? formatCurrency(course.price) : "Free"}
                </div>
                {isEnrolled ? (
                  <div className="flex flex-col gap-3">
                    <Button asChild>
                      <a href={`/courses/${course.id}/learn`}>
                        Continue Learning
                      </a>
                    </Button>
                    <div className="text-sm text-gray-500">
                      {enrollment.progress > 0 
                        ? `You've completed ${enrollment.progress}% of this course`
                        : "You've enrolled but haven't started learning yet"}
                    </div>
                    {enrollment.progress > 0 && (
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-green-500 rounded-full" 
                          style={{width: `${enrollment.progress}%`}}
                        ></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={handleEnroll}
                    disabled={enrollCourseMutation.isPending}
                  >
                    {enrollCourseMutation.isPending ? "Processing..." : "Enroll Now"}
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">This course includes:</h3>
                  <ul className="space-y-2">
                    <li className="flex gap-2 items-center text-sm">
                      <FileIcon className="h-4 w-4 text-gray-500" />
                      <span>{modules?.length || 0} modules</span>
                    </li>
                    <li className="flex gap-2 items-center text-sm">
                      <CheckIcon className="h-4 w-4 text-gray-500" />
                      <span>Quizzes and assignments</span>
                    </li>
                    <li className="flex gap-2 items-center text-sm">
                      <UsersIcon className="h-4 w-4 text-gray-500" />
                      <span>Discussion forum access</span>
                    </li>
                    <li className="flex gap-2 items-center text-sm">
                      <Badge variant="outline" className="text-xs">
                        Certificate
                      </Badge>
                      <span>Completion certificate</span>
                    </li>
                  </ul>
                </div>

                <Separator />

                {course.tags && course.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Tags:</h3>
                    <div className="flex flex-wrap gap-1">
                      {course.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;