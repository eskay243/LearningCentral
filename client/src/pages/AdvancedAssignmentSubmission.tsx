import { useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Upload, 
  File, 
  X, 
  Send, 
  Save, 
  Calendar,
  Clock,
  FileText,
  Code,
  Link,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  Users,
  MessageSquare,
  Star
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { useDropzone } from "react-dropzone";

interface AdvancedAssignment {
  id: number;
  title: string;
  description: string;
  instructions: string;
  requirements: string[];
  submissionType: string;
  allowedFileTypes: string[];
  maxFileSize: number;
  maxFiles: number;
  requiresUpload: boolean;
  dueDate: string;
  availableFrom: string;
  availableUntil: string;
  lateSubmissionAllowed: boolean;
  latePenalty: number;
  maxPoints: number;
  gradingType: string;
  autoGrading: boolean;
  plagiarismCheck: boolean;
  groupAssignment: boolean;
  maxGroupSize: number;
  peerReview: boolean;
  isPublished: boolean;
}

interface AssignmentSubmission {
  id: number;
  textSubmission?: string;
  urlSubmission?: string;
  codeSubmission?: string;
  codeLanguage?: string;
  uploadedFiles: UploadedFile[];
  status: string;
  submittedAt?: string;
  isLate: boolean;
  lateDays: number;
  score?: number;
  maxScore: number;
  grade?: string;
  feedback?: string;
  rubricScores?: RubricScore[];
  plagiarismScore?: number;
  revisionNumber: number;
  allowResubmission: boolean;
  resubmissionDue?: string;
}

interface UploadedFile {
  id: number;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  uploadedAt: string;
}

interface RubricScore {
  criteriaId: number;
  criteria: string;
  maxPoints: number;
  pointsEarned: number;
  feedback: string;
}

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AdvancedAssignmentSubmission() {
  const { assignmentId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [textSubmission, setTextSubmission] = useState("");
  const [urlSubmission, setUrlSubmission] = useState("");
  const [codeSubmission, setCodeSubmission] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);

  // Fetch assignment data
  const { data: assignment, isLoading } = useQuery<AdvancedAssignment>({
    queryKey: [`/api/advanced-assignments/${assignmentId}`],
    enabled: !!assignmentId,
  });

  // Fetch existing submission
  const { data: existingSubmission } = useQuery<AssignmentSubmission>({
    queryKey: [`/api/advanced-assignments/${assignmentId}/submission`],
    enabled: !!assignmentId,
    onSuccess: (data) => {
      if (data) {
        setTextSubmission(data.textSubmission || "");
        setUrlSubmission(data.urlSubmission || "");
        setCodeSubmission(data.codeSubmission || "");
        setCodeLanguage(data.codeLanguage || "javascript");
      }
    },
  });

  // Fetch group members for group assignments
  const { data: availableGroupMembers } = useQuery<GroupMember[]>({
    queryKey: [`/api/advanced-assignments/${assignmentId}/group-members`],
    enabled: !!assignmentId && assignment?.groupAssignment,
  });

  // File upload mutation
  const uploadFilesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch(`/api/advanced-assignments/${assignmentId}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('File upload failed');
      }
      
      return response.json();
    },
    onSuccess: (uploadedFileData) => {
      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${uploadedFileData.length} file(s)`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/advanced-assignments/${assignmentId}/submission`] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
    },
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/advanced-assignments/${assignmentId}/save-draft`, {
        textSubmission,
        urlSubmission,
        codeSubmission,
        codeLanguage,
        groupMembers: selectedGroupMembers,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsDraftSaving(false);
      toast({
        title: "Draft Saved",
        description: "Your work has been saved as a draft",
      });
    },
    onError: () => {
      setIsDraftSaving(false);
      toast({
        title: "Save Failed",
        description: "Failed to save draft",
        variant: "destructive",
      });
    },
  });

  // Submit assignment mutation
  const submitAssignmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/advanced-assignments/${assignmentId}/submit`, {
        textSubmission,
        urlSubmission,
        codeSubmission,
        codeLanguage,
        groupMembers: selectedGroupMembers,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignment Submitted",
        description: "Your assignment has been submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/advanced-assignments/${assignmentId}/submission`] });
      setLocation("/assignments");
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit assignment",
        variant: "destructive",
      });
    },
  });

  // File drop handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!assignment) return;

    // Validate file types
    const invalidFiles = acceptedFiles.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return assignment.allowedFileTypes.length > 0 && 
             !assignment.allowedFileTypes.includes(extension);
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid File Types",
        description: `Only ${assignment.allowedFileTypes.join(", ")} files are allowed`,
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes
    const oversizedFiles = acceptedFiles.filter(file => 
      file.size > assignment.maxFileSize * 1024 * 1024
    );

    if (oversizedFiles.length > 0) {
      toast({
        title: "Files Too Large",
        description: `Maximum file size is ${assignment.maxFileSize}MB`,
        variant: "destructive",
      });
      return;
    }

    // Validate total number of files
    if (uploadedFiles.length + acceptedFiles.length > assignment.maxFiles) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${assignment.maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
    uploadFilesMutation.mutate(acceptedFiles);
  }, [assignment, uploadedFiles.length, toast, uploadFilesMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: !assignment || uploadedFiles.length >= assignment.maxFiles,
  });

  const handleSaveDraft = () => {
    setIsDraftSaving(true);
    saveDraftMutation.mutate();
  };

  const handleSubmit = () => {
    if (!assignment) return;

    // Validation
    if (assignment.requiresUpload && uploadedFiles.length === 0) {
      toast({
        title: "Upload Required",
        description: "Please upload at least one file",
        variant: "destructive",
      });
      return;
    }

    if (assignment.submissionType === "text" && !textSubmission.trim()) {
      toast({
        title: "Text Required",
        description: "Please enter your text submission",
        variant: "destructive",
      });
      return;
    }

    if (assignment.submissionType === "url" && !urlSubmission.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    if (assignment.submissionType === "code" && !codeSubmission.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter your code submission",
        variant: "destructive",
      });
      return;
    }

    if (assignment.groupAssignment && selectedGroupMembers.length === 0) {
      toast({
        title: "Group Members Required",
        description: "Please select your group members",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    submitAssignmentMutation.mutate();
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = assignment && new Date() > new Date(assignment.dueDate);
  const isBeforeAvailable = assignment && new Date() < new Date(assignment.availableFrom);
  const isAfterDeadline = assignment && new Date() > new Date(assignment.availableUntil);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Assignment not found or not available.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isBeforeAvailable) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            This assignment will be available on {formatDate(assignment.availableFrom)}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isAfterDeadline && !assignment.lateSubmissionAllowed) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This assignment is no longer accepting submissions. Deadline was {formatDate(assignment.availableUntil)}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{assignment.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={isOverdue ? "destructive" : "secondary"}>
                {assignment.maxPoints} points
              </Badge>
              {assignment.groupAssignment && (
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  Group Assignment
                </Badge>
              )}
              {assignment.peerReview && (
                <Badge variant="outline">
                  <Star className="w-3 h-3 mr-1" />
                  Peer Review
                </Badge>
              )}
              {assignment.plagiarismCheck && (
                <Badge variant="outline">
                  <Eye className="w-3 h-3 mr-1" />
                  Plagiarism Check
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Due: {formatDate(assignment.dueDate)}
            </div>
            {isOverdue && assignment.lateSubmissionAllowed && (
              <div className="text-sm text-red-600">
                Late penalty: {assignment.latePenalty}% per day
              </div>
            )}
          </div>
        </div>

        {isOverdue && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This assignment is overdue. {assignment.lateSubmissionAllowed 
                ? `Late submissions are accepted with ${assignment.latePenalty}% penalty per day.`
                : "Late submissions are not allowed."
              }
            </AlertDescription>
          </Alert>
        )}

        {existingSubmission && existingSubmission.status === "submitted" && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              You have already submitted this assignment on {formatDate(existingSubmission.submittedAt!)}
              {existingSubmission.allowResubmission && (
                <span className="ml-2">
                  Resubmissions allowed until {formatDate(existingSubmission.resubmissionDue!)}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Assignment Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Assignment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium text-sm mb-2">Description</div>
                <div className="text-sm whitespace-pre-wrap">{assignment.description}</div>
              </div>
              
              <Separator />
              
              <div>
                <div className="font-medium text-sm mb-2">Instructions</div>
                <div className="text-sm whitespace-pre-wrap">{assignment.instructions}</div>
              </div>
              
              {assignment.requirements.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="font-medium text-sm mb-2">Requirements</div>
                    <ul className="text-sm space-y-1">
                      {assignment.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Submission Type:</span>
                  <span className="capitalize">{assignment.submissionType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Max Points:</span>
                  <span>{assignment.maxPoints}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Grading:</span>
                  <span className="capitalize">{assignment.gradingType}</span>
                </div>
                {assignment.allowedFileTypes.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>File Types:</span>
                    <span>{assignment.allowedFileTypes.join(", ")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Max File Size:</span>
                  <span>{assignment.maxFileSize}MB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Max Files:</span>
                  <span>{assignment.maxFiles}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group Members Selection */}
          {assignment.groupAssignment && availableGroupMembers && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Group Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableGroupMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={member.id}
                        checked={selectedGroupMembers.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroupMembers(prev => [...prev, member.id]);
                          } else {
                            setSelectedGroupMembers(prev => prev.filter(id => id !== member.id));
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor={member.id} className="text-sm cursor-pointer">
                        {member.firstName} {member.lastName}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Select up to {assignment.maxGroupSize - 1} group members
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Submission */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Submit Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="submission" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="submission">Submission</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  {existingSubmission && (
                    <TabsTrigger value="feedback">Feedback</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="submission" className="mt-6">
                  <div className="space-y-6">
                    {/* Text Submission */}
                    {(assignment.submissionType === "text" || assignment.submissionType === "mixed") && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Text Submission
                        </label>
                        <Textarea
                          placeholder="Enter your assignment text here..."
                          value={textSubmission}
                          onChange={(e) => setTextSubmission(e.target.value)}
                          className="min-h-[200px]"
                        />
                      </div>
                    )}

                    {/* URL Submission */}
                    {(assignment.submissionType === "url" || assignment.submissionType === "mixed") && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          URL Submission
                        </label>
                        <Input
                          type="url"
                          placeholder="https://example.com/your-project"
                          value={urlSubmission}
                          onChange={(e) => setUrlSubmission(e.target.value)}
                        />
                      </div>
                    )}

                    {/* Code Submission */}
                    {(assignment.submissionType === "code" || assignment.submissionType === "mixed") && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium">
                            Code Submission
                          </label>
                          <select
                            value={codeLanguage}
                            onChange={(e) => setCodeLanguage(e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                            <option value="cpp">C++</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                          </select>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <Editor
                            height="300px"
                            language={codeLanguage}
                            value={codeSubmission}
                            onChange={(value) => setCodeSubmission(value || "")}
                            theme="vs-dark"
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              lineNumbers: "on",
                              wordWrap: "on",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="files" className="mt-6">
                  <div className="space-y-6">
                    {/* File Upload */}
                    {(assignment.submissionType === "file" || assignment.submissionType === "mixed" || assignment.requiresUpload) && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          File Upload
                        </label>
                        
                        <div
                          {...getRootProps()}
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                            isDragActive
                              ? "border-primary bg-primary/5"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <input {...getInputProps()} />
                          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          {isDragActive ? (
                            <p className="text-sm">Drop the files here...</p>
                          ) : (
                            <div>
                              <p className="text-sm mb-2">
                                Drag & drop files here, or click to select files
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Max {assignment.maxFiles} files, {assignment.maxFileSize}MB each
                              </p>
                              {assignment.allowedFileTypes.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Allowed: {assignment.allowedFileTypes.join(", ")}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Uploaded Files List */}
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Uploaded Files</div>
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-2">
                                  <File className="w-4 h-4" />
                                  <span className="text-sm">{file.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({formatFileSize(file.size)})
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Existing Files */}
                        {existingSubmission?.uploadedFiles.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Previously Uploaded Files</div>
                            {existingSubmission.uploadedFiles.map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-2 border rounded bg-gray-50">
                                <div className="flex items-center gap-2">
                                  <File className="w-4 h-4" />
                                  <span className="text-sm">{file.originalName}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({formatFileSize(file.fileSize)})
                                  </span>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {existingSubmission && (
                  <TabsContent value="feedback" className="mt-6">
                    <div className="space-y-6">
                      {/* Submission Status */}
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">Status: {existingSubmission.status}</div>
                          {existingSubmission.submittedAt && (
                            <div className="text-sm text-muted-foreground">
                              Submitted on {formatDate(existingSubmission.submittedAt)}
                            </div>
                          )}
                        </div>
                        {existingSubmission.score !== undefined && (
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {existingSubmission.score}/{existingSubmission.maxScore}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {Math.round((existingSubmission.score / existingSubmission.maxScore) * 100)}%
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Feedback */}
                      {existingSubmission.feedback && (
                        <div>
                          <div className="font-medium mb-2">Instructor Feedback</div>
                          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                            <p className="whitespace-pre-wrap">{existingSubmission.feedback}</p>
                          </div>
                        </div>
                      )}

                      {/* Rubric Scores */}
                      {existingSubmission.rubricScores && existingSubmission.rubricScores.length > 0 && (
                        <div>
                          <div className="font-medium mb-2">Rubric Scores</div>
                          <div className="space-y-3">
                            {existingSubmission.rubricScores.map((rubric) => (
                              <div key={rubric.criteriaId} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{rubric.criteria}</span>
                                  <span className="text-sm">
                                    {rubric.pointsEarned}/{rubric.maxPoints} pts
                                  </span>
                                </div>
                                <Progress 
                                  value={(rubric.pointsEarned / rubric.maxPoints) * 100} 
                                  className="mb-2"
                                />
                                {rubric.feedback && (
                                  <p className="text-sm text-muted-foreground">{rubric.feedback}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Plagiarism Check */}
                      {existingSubmission.plagiarismScore !== undefined && (
                        <div>
                          <div className="font-medium mb-2">Plagiarism Check</div>
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <span>Similarity Score</span>
                              <span className={`font-bold ${
                                existingSubmission.plagiarismScore > 20 ? 'text-red-600' :
                                existingSubmission.plagiarismScore > 10 ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                {existingSubmission.plagiarismScore}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isDraftSaving}
                >
                  {isDraftSaving ? (
                    <div className="w-4 h-4 animate-spin border-2 border-gray-500 border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Draft
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!assignment.lateSubmissionAllowed && isOverdue)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {existingSubmission?.status === "submitted" ? "Resubmit" : "Submit"} Assignment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}