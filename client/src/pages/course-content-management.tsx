import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Video, 
  Upload, 
  Play, 
  Code, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Users, 
  BarChart3,
  Settings,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Save,
  ArrowLeft,
  Youtube,
  Link
} from "lucide-react";

// Video upload schema
const videoUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  courseId: z.number(),
  lessonId: z.number().optional(),
  duration: z.number().min(1, "Duration must be specified"),
  isPublic: z.boolean().default(false),
  allowDownload: z.boolean().default(false),
  watermarkText: z.string().optional(),
  accessLevel: z.enum(["free", "premium", "restricted"]).default("premium"),
  uploadType: z.enum(["file", "youtube"]).default("file"),
  youtubeUrl: z.string().optional(),
}).refine((data) => {
  if (data.uploadType === "youtube") {
    return data.youtubeUrl && data.youtubeUrl.length > 0;
  }
  return true;
}, {
  message: "YouTube URL is required when upload type is YouTube",
  path: ["youtubeUrl"],
});

// Coding exercise schema
const codingExerciseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  courseId: z.number(),
  lessonId: z.number().optional(),
  language: z.string().min(1, "Programming language is required"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  starterCode: z.string().optional(),
  solutionCode: z.string().min(1, "Solution code is required"),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
    description: z.string().optional(),
    isHidden: z.boolean().default(false),
  })),
  timeLimit: z.number().default(300),
  memoryLimit: z.number().default(128),
  maxAttempts: z.number().default(5),
  points: z.number().default(10),
});

// Assignment schema
const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  courseId: z.number(),
  instructions: z.string().min(1, "Instructions are required"),
  dueDate: z.string(),
  maxScore: z.number().min(1, "Maximum score is required"),
  submissionType: z.enum(["file", "text", "code", "url"]).default("file"),
  allowedFileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().default(10), // MB
  isGroupAssignment: z.boolean().default(false),
  maxGroupSize: z.number().optional(),
  autoGrading: z.boolean().default(false),
  rubric: z.array(z.object({
    criteria: z.string(),
    maxPoints: z.number(),
    description: z.string(),
  })).optional(),
});

// Quiz schema
const quizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  courseId: z.number(),
  lessonId: z.number().optional(),
  timeLimit: z.number().optional(),
  maxAttempts: z.number().default(1),
  passingScore: z.number().min(0).max(100).default(70),
  shuffleQuestions: z.boolean().default(false),
  showCorrectAnswers: z.boolean().default(true),
  isPublished: z.boolean().default(false),
  questions: z.array(z.object({
    type: z.enum(["multiple_choice", "true_false", "short_answer", "essay"]),
    question: z.string().min(1, "Question text is required"),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
    points: z.number().default(1),
    explanation: z.string().optional(),
  })),
});

type VideoUpload = z.infer<typeof videoUploadSchema>;
type CodingExercise = z.infer<typeof codingExerciseSchema>;
type Assignment = z.infer<typeof assignmentSchema>;
type Quiz = z.infer<typeof quizSchema>;

export default function CourseContentManagement() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("videos");
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"file" | "youtube">("file");
  const { toast } = useToast();

  // Parse courseId from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const courseIdParam = urlParams.get('courseId');
    if (courseIdParam) {
      const courseId = parseInt(courseIdParam);
      if (!isNaN(courseId)) {
        setSelectedCourse(courseId);
      }
    }
  }, [location]);

  // Fetch courses for dropdown
  const { data: courses } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
  });

  // Fetch content based on selected course
  const { data: courseContent, refetch: refetchContent } = useQuery({
    queryKey: ['/api/course-content', selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return null;
      const response = await fetch(`/api/courses/${selectedCourse}/content`);
      if (!response.ok) throw new Error('Failed to fetch course content');
      return response.json();
    },
    enabled: !!selectedCourse,
  });

  // Video upload form
  const videoForm = useForm<VideoUpload>({
    resolver: zodResolver(videoUploadSchema),
    defaultValues: {
      isPublic: false,
      allowDownload: false,
      accessLevel: "premium",
      uploadType: "file",
      youtubeUrl: "",
    }
  });

  // Coding exercise form
  const exerciseForm = useForm<CodingExercise>({
    resolver: zodResolver(codingExerciseSchema),
    defaultValues: {
      difficulty: "beginner",
      timeLimit: 300,
      memoryLimit: 128,
      maxAttempts: 5,
      points: 10,
      testCases: [{ input: "", expectedOutput: "", isHidden: false }],
    }
  });

  // Assignment form
  const assignmentForm = useForm<Assignment>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      submissionType: "file",
      maxFileSize: 10,
      isGroupAssignment: false,
      autoGrading: false,
    }
  });

  // Quiz form
  const quizForm = useForm<Quiz>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      courseId: selectedCourse || 0,
      lessonId: 1,
      maxAttempts: 1,
      passingScore: 70,
      shuffleQuestions: false,
      showCorrectAnswers: true,
      isPublished: false,
      questions: [{ type: "multiple_choice", question: "", points: 1, options: ["", "", "", ""] }],
    }
  });

  // Update form courseId when selectedCourse changes
  useEffect(() => {
    if (selectedCourse) {
      quizForm.setValue('courseId', selectedCourse);
    }
  }, [selectedCourse, quizForm]);

  // Video upload mutation
  const uploadVideoMutation = useMutation({
    mutationFn: async (data: VideoUpload & { file: File }) => {
      const formData = new FormData();
      formData.append('video', data.file);
      formData.append('metadata', JSON.stringify(data));
      
      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Video upload failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Video Uploaded",
        description: "Video has been successfully uploaded and is being processed.",
      });
      videoForm.reset();
      refetchContent();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create coding exercise mutation
  const createExerciseMutation = useMutation({
    mutationFn: async (data: CodingExercise) => {
      const response = await apiRequest("POST", "/api/coding-exercises", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Exercise Created",
        description: "Coding exercise has been created successfully.",
      });
      exerciseForm.reset();
      refetchContent();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: Assignment) => {
      const response = await apiRequest("POST", "/api/assignments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignment Created",
        description: "Assignment has been created successfully.",
      });
      assignmentForm.reset();
      refetchContent();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create quiz mutation
  const createQuizMutation = useMutation({
    mutationFn: async (data: Quiz) => {
      const response = await apiRequest("POST", "/api/quizzes", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz Created",
        description: "Quiz has been created successfully.",
      });
      quizForm.reset();
      refetchContent();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVideoUpload = (data: VideoUpload) => {
    if (data.uploadType === "youtube") {
      // Handle YouTube URL upload
      if (!data.youtubeUrl) {
        toast({
          title: "YouTube URL Required",
          description: "Please provide a valid YouTube URL.",
          variant: "destructive",
        });
        return;
      }
      uploadVideoMutation.mutate({ ...data, file: null });
    } else {
      // Handle file upload
      const fileInput = document.getElementById('video-file') as HTMLInputElement;
      const file = fileInput?.files?.[0];
      
      if (!file) {
        toast({
          title: "No File Selected",
          description: "Please select a video file to upload.",
          variant: "destructive",
        });
        return;
      }
      uploadVideoMutation.mutate({ ...data, file });
    }
  };

  const addTestCase = () => {
    const currentTestCases = exerciseForm.getValues("testCases");
    exerciseForm.setValue("testCases", [
      ...currentTestCases,
      { input: "", expectedOutput: "", isHidden: false }
    ]);
  };

  const removeTestCase = (index: number) => {
    const currentTestCases = exerciseForm.getValues("testCases");
    exerciseForm.setValue("testCases", currentTestCases.filter((_, i) => i !== index));
  };

  const addQuizQuestion = () => {
    const currentQuestions = quizForm.getValues("questions");
    quizForm.setValue("questions", [
      ...currentQuestions,
      { type: "multiple_choice", question: "", points: 1, options: ["", "", "", ""] }
    ]);
  };

  const removeQuizQuestion = (index: number) => {
    const currentQuestions = quizForm.getValues("questions");
    quizForm.setValue("questions", currentQuestions.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => setLocation('/my-courses')}
            className="mr-4 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Settings className="mr-3 h-8 w-8" />
              Course Content Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create and manage videos, coding exercises, assignments, and quizzes
            </p>
          </div>
        </div>
      </div>

      {/* Course Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Course</CardTitle>
          <CardDescription>Choose a course to manage its content</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourse?.toString()} onValueChange={(value) => setSelectedCourse(parseInt(value))}>
            <SelectTrigger className="w-full md:w-1/3">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses?.map((course: any) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCourse && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="videos" className="flex items-center space-x-2">
              <Video className="w-4 h-4" />
              <span>Videos</span>
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>Coding Exercises</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Quizzes</span>
            </TabsTrigger>
          </TabsList>

          {/* Video Upload and Management */}
          <TabsContent value="videos" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload Video</span>
                </CardTitle>
                <CardDescription>
                  Upload and configure video content for your course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={videoForm.handleSubmit(handleVideoUpload)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="video-title">Video Title</Label>
                      <Input
                        id="video-title"
                        {...videoForm.register("title")}
                        placeholder="Enter video title"
                      />
                      {videoForm.formState.errors.title && (
                        <p className="text-sm text-red-600 mt-1">
                          {videoForm.formState.errors.title.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="video-duration">Duration (seconds)</Label>
                      <Input
                        id="video-duration"
                        type="number"
                        {...videoForm.register("duration", { valueAsNumber: true })}
                        placeholder="Video duration in seconds"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="video-description">Description</Label>
                    <Textarea
                      id="video-description"
                      {...videoForm.register("description")}
                      placeholder="Video description (optional)"
                      rows={3}
                    />
                  </div>

                  {/* Upload Type Selector */}
                  <div>
                    <Label>Upload Type</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="upload-file"
                          name="uploadType"
                          value="file"
                          checked={videoForm.watch("uploadType") === "file"}
                          onChange={() => videoForm.setValue("uploadType", "file")}
                        />
                        <Label htmlFor="upload-file" className="flex items-center space-x-1 cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span>File Upload</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="upload-youtube"
                          name="uploadType"
                          value="youtube"
                          checked={videoForm.watch("uploadType") === "youtube"}
                          onChange={() => videoForm.setValue("uploadType", "youtube")}
                        />
                        <Label htmlFor="upload-youtube" className="flex items-center space-x-1 cursor-pointer">
                          <Youtube className="w-4 h-4" />
                          <span>YouTube URL</span>
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Conditional Upload Fields */}
                  {videoForm.watch("uploadType") === "file" ? (
                    <div>
                      <Label htmlFor="video-file">Video File</Label>
                      <Input
                        id="video-file"
                        type="file"
                        accept="video/*"
                        className="mt-1"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="youtube-url">YouTube URL</Label>
                      <Input
                        id="youtube-url"
                        {...videoForm.register("youtubeUrl")}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="mt-1"
                      />
                      {videoForm.formState.errors.youtubeUrl && (
                        <p className="text-sm text-red-600 mt-1">
                          {videoForm.formState.errors.youtubeUrl.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="access-level">Access Level</Label>
                      <Select 
                        value={videoForm.watch("accessLevel")} 
                        onValueChange={(value: "free" | "premium" | "restricted") => 
                          videoForm.setValue("accessLevel", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="restricted">Restricted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={videoForm.watch("isPublic")}
                        onCheckedChange={(checked) => videoForm.setValue("isPublic", checked)}
                      />
                      <Label>Public Video</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={videoForm.watch("allowDownload")}
                        onCheckedChange={(checked) => videoForm.setValue("allowDownload", checked)}
                      />
                      <Label>Allow Download</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="watermark">Watermark Text (optional)</Label>
                    <Input
                      id="watermark"
                      {...videoForm.register("watermarkText")}
                      placeholder="Watermark text for video protection"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={uploadVideoMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadVideoMutation.isPending ? "Uploading..." : "Upload Video"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Video List */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Videos</CardTitle>
                <CardDescription>Manage your uploaded videos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courseContent?.videos?.map((video: any) => (
                    <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Video className="w-8 h-8 text-blue-600" />
                        <div>
                          <h3 className="font-medium">{video.title}</h3>
                          <p className="text-sm text-gray-600">{video.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge variant={video.accessLevel === 'free' ? 'secondary' : 'default'}>
                              {video.accessLevel}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coding Exercises */}
          <TabsContent value="exercises" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>Create Coding Exercise</span>
                </CardTitle>
                <CardDescription>
                  Create interactive coding exercises with automated testing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={exerciseForm.handleSubmit((data) => createExerciseMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="exercise-title">Exercise Title</Label>
                      <Input
                        id="exercise-title"
                        {...exerciseForm.register("title")}
                        placeholder="Enter exercise title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="exercise-language">Programming Language</Label>
                      <Select 
                        value={exerciseForm.watch("language")} 
                        onValueChange={(value) => exerciseForm.setValue("language", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                          <SelectItem value="java">Java</SelectItem>
                          <SelectItem value="cpp">C++</SelectItem>
                          <SelectItem value="go">Go</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="exercise-description">Description</Label>
                    <Textarea
                      id="exercise-description"
                      {...exerciseForm.register("description")}
                      placeholder="Describe the exercise requirements"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select 
                        value={exerciseForm.watch("difficulty")} 
                        onValueChange={(value: "beginner" | "intermediate" | "advanced") => 
                          exerciseForm.setValue("difficulty", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="time-limit">Time Limit (seconds)</Label>
                      <Input
                        id="time-limit"
                        type="number"
                        {...exerciseForm.register("timeLimit", { valueAsNumber: true })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="points">Points</Label>
                      <Input
                        id="points"
                        type="number"
                        {...exerciseForm.register("points", { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="starter-code">Starter Code (optional)</Label>
                    <Textarea
                      id="starter-code"
                      {...exerciseForm.register("starterCode")}
                      placeholder="Initial code provided to students"
                      rows={6}
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <Label htmlFor="solution-code">Solution Code</Label>
                    <Textarea
                      id="solution-code"
                      {...exerciseForm.register("solutionCode")}
                      placeholder="Correct solution for the exercise"
                      rows={8}
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label>Test Cases</Label>
                      <Button type="button" onClick={addTestCase} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Test Case
                      </Button>
                    </div>
                    
                    {exerciseForm.watch("testCases").map((_, index) => (
                      <div key={index} className="border rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Test Case {index + 1}</h4>
                          {index > 0 && (
                            <Button
                              type="button"
                              onClick={() => removeTestCase(index)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Input</Label>
                            <Textarea
                              {...exerciseForm.register(`testCases.${index}.input`)}
                              placeholder="Test input"
                              rows={3}
                            />
                          </div>
                          
                          <div>
                            <Label>Expected Output</Label>
                            <Textarea
                              {...exerciseForm.register(`testCases.${index}.expectedOutput`)}
                              placeholder="Expected output"
                              rows={3}
                            />
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-2">
                          <Switch
                            checked={exerciseForm.watch(`testCases.${index}.isHidden`)}
                            onCheckedChange={(checked) => 
                              exerciseForm.setValue(`testCases.${index}.isHidden`, checked)
                            }
                          />
                          <Label>Hidden Test Case</Label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={createExerciseMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {createExerciseMutation.isPending ? "Creating..." : "Create Exercise"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Create Assignment</span>
                </CardTitle>
                <CardDescription>
                  Create assignments with submission management and grading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={assignmentForm.handleSubmit((data) => createAssignmentMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="assignment-title">Assignment Title</Label>
                      <Input
                        id="assignment-title"
                        {...assignmentForm.register("title")}
                        placeholder="Enter assignment title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="due-date">Due Date</Label>
                      <Input
                        id="due-date"
                        type="datetime-local"
                        {...assignmentForm.register("dueDate")}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="assignment-description">Description</Label>
                    <Textarea
                      id="assignment-description"
                      {...assignmentForm.register("description")}
                      placeholder="Assignment description"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      {...assignmentForm.register("instructions")}
                      placeholder="Detailed instructions for students"
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="submission-type">Submission Type</Label>
                      <Select 
                        value={assignmentForm.watch("submissionType")} 
                        onValueChange={(value: "file" | "text" | "code" | "url") => 
                          assignmentForm.setValue("submissionType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="file">File Upload</SelectItem>
                          <SelectItem value="text">Text Entry</SelectItem>
                          <SelectItem value="code">Code Submission</SelectItem>
                          <SelectItem value="url">URL Submission</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="max-score">Maximum Score</Label>
                      <Input
                        id="max-score"
                        type="number"
                        {...assignmentForm.register("maxScore", { valueAsNumber: true })}
                        placeholder="100"
                      />
                    </div>

                    <div>
                      <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                      <Input
                        id="max-file-size"
                        type="number"
                        {...assignmentForm.register("maxFileSize", { valueAsNumber: true })}
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={assignmentForm.watch("isGroupAssignment")}
                        onCheckedChange={(checked) => assignmentForm.setValue("isGroupAssignment", checked)}
                      />
                      <Label>Group Assignment</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={assignmentForm.watch("autoGrading")}
                        onCheckedChange={(checked) => assignmentForm.setValue("autoGrading", checked)}
                      />
                      <Label>Auto Grading</Label>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={createAssignmentMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quizzes */}
          <TabsContent value="quizzes" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Create Quiz</span>
                </CardTitle>
                <CardDescription>
                  Create quizzes with automatic grading and feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = quizForm.getValues();
                  console.log('Quiz form submitted with data:', formData);
                  const quizData = {
                    ...formData,
                    courseId: selectedCourse!,
                    lessonId: 1 // Default lesson ID for now
                  };
                  console.log('Final quiz data:', quizData);
                  createQuizMutation.mutate(quizData);
                }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quiz-title">Quiz Title</Label>
                      <Input
                        id="quiz-title"
                        {...quizForm.register("title")}
                        placeholder="Enter quiz title"
                      />
                      {quizForm.formState.errors.title && (
                        <p className="text-sm text-red-600 mt-1">
                          {quizForm.formState.errors.title.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                      <Input
                        id="time-limit"
                        type="number"
                        {...quizForm.register("timeLimit", { valueAsNumber: true })}
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="quiz-description">Description</Label>
                    <Textarea
                      id="quiz-description"
                      {...quizForm.register("description")}
                      placeholder="Quiz description (optional)"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="max-attempts">Max Attempts</Label>
                      <Input
                        id="max-attempts"
                        type="number"
                        {...quizForm.register("maxAttempts", { valueAsNumber: true })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="passing-score">Passing Score (%)</Label>
                      <Input
                        id="passing-score"
                        type="number"
                        min="0"
                        max="100"
                        {...quizForm.register("passingScore", { valueAsNumber: true })}
                      />
                    </div>

                    <div className="flex items-center space-x-2 mt-6">
                      <Switch
                        checked={quizForm.watch("shuffleQuestions")}
                        onCheckedChange={(checked) => quizForm.setValue("shuffleQuestions", checked)}
                      />
                      <Label>Shuffle Questions</Label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label>Questions</Label>
                      <Button type="button" onClick={addQuizQuestion} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                    
                    {quizForm.watch("questions").map((_, index) => (
                      <div key={index} className="border rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Question {index + 1}</h4>
                          {index > 0 && (
                            <Button
                              type="button"
                              onClick={() => removeQuizQuestion(index)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label>Question Type</Label>
                            <Select 
                              value={quizForm.watch(`questions.${index}.type`)} 
                              onValueChange={(value: "multiple_choice" | "true_false" | "short_answer" | "essay") => 
                                quizForm.setValue(`questions.${index}.type`, value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="true_false">True/False</SelectItem>
                                <SelectItem value="short_answer">Short Answer</SelectItem>
                                <SelectItem value="essay">Essay</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Points</Label>
                            <Input
                              type="number"
                              {...quizForm.register(`questions.${index}.points`, { valueAsNumber: true })}
                              placeholder="1"
                            />
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <Label>Question Text</Label>
                          <Textarea
                            {...quizForm.register(`questions.${index}.question`)}
                            placeholder="Enter your question"
                            rows={3}
                          />
                        </div>

                        {quizForm.watch(`questions.${index}.type`) === "multiple_choice" && (
                          <div className="mb-4">
                            <Label>Answer Options</Label>
                            {quizForm.watch(`questions.${index}.options`)?.map((_, optionIndex) => (
                              <Input
                                key={optionIndex}
                                {...quizForm.register(`questions.${index}.options.${optionIndex}`)}
                                placeholder={`Option ${optionIndex + 1}`}
                                className="mt-2"
                              />
                            ))}
                          </div>
                        )}

                        <div>
                          <Label>Correct Answer</Label>
                          <Input
                            {...quizForm.register(`questions.${index}.correctAnswer`)}
                            placeholder="Enter correct answer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={quizForm.watch("showCorrectAnswers")}
                        onCheckedChange={(checked) => quizForm.setValue("showCorrectAnswers", checked)}
                      />
                      <Label>Show Correct Answers</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={quizForm.watch("isPublished")}
                        onCheckedChange={(checked) => quizForm.setValue("isPublished", checked)}
                      />
                      <Label>Publish Quiz</Label>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={createQuizMutation.isPending || !selectedCourse}
                    className="w-full md:w-auto"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {createQuizMutation.isPending ? "Creating..." : "Create Quiz"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}