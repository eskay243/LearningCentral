import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Upload, 
  File, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft,
  Send,
  Save,
  X
} from 'lucide-react';

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  submissionType: string;
  instructions: string;
}

interface Submission {
  id: number;
  submissionText: string;
  submissionFiles: any[];
  submittedAt: string;
  status: string;
  grade: number;
  feedback: string;
}

export default function AssignmentSubmission() {
  const { assignmentId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  // Fetch assignment data
  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: [`/api/assignments/${assignmentId}`],
    enabled: !!assignmentId
  });

  // Fetch existing submission
  const { data: existingSubmission, isLoading: submissionLoading } = useQuery({
    queryKey: [`/api/assignments/${assignmentId}/my-submission`],
    enabled: !!assignmentId
  });

  // Load existing submission data
  useEffect(() => {
    if (existingSubmission) {
      setSubmissionText(existingSubmission.submissionText || '');
      setIsDraft(existingSubmission.status === 'draft');
    }
  }, [existingSubmission]);

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('assignmentId', assignmentId!);
      formData.append('submissionText', submissionText);
      formData.append('status', 'draft');
      
      selectedFiles.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });

      const response = await fetch('/api/assignment-submissions/draft', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to save draft');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsDraft(true);
      toast({
        title: "Draft Saved",
        description: "Your work has been saved as a draft."
      });
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignmentId}/my-submission`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save draft",
        variant: "destructive"
      });
    }
  });

  // Submit assignment mutation
  const submitAssignmentMutation = useMutation({
    mutationFn: async () => {
      if (!submissionText.trim() && selectedFiles.length === 0) {
        throw new Error('Please provide either text submission or upload files');
      }

      const formData = new FormData();
      formData.append('assignmentId', assignmentId!);
      formData.append('submissionText', submissionText);
      formData.append('status', 'submitted');
      
      selectedFiles.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });

      const response = await fetch('/api/assignment-submissions', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit assignment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assignment Submitted",
        description: "Your assignment has been submitted successfully!"
      });
      navigate(`/assignments/${assignmentId}/submitted`);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    submitAssignmentMutation.mutate();
  };

  const handleSaveDraft = () => {
    saveDraftMutation.mutate();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isOverdue = assignment?.dueDate && new Date() > new Date(assignment.dueDate);
  const timeUntilDue = assignment?.dueDate ? new Date(assignment.dueDate).getTime() - new Date().getTime() : 0;
  const hoursUntilDue = Math.floor(timeUntilDue / (1000 * 60 * 60));

  if (assignmentLoading || submissionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Assignment Not Found</h2>
            <p className="text-muted-foreground mb-4">The assignment you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If already submitted, show submitted view
  if (existingSubmission && existingSubmission.status === 'submitted') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Assignment Submitted
              </CardTitle>
              <Badge variant="secondary">Submitted</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">{assignment.title}</h3>
              <p className="text-muted-foreground">{assignment.description}</p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Submitted At</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(existingSubmission.submittedAt).toLocaleString()}
                </p>
              </div>

              {existingSubmission.submissionText && (
                <div>
                  <Label className="text-sm font-medium">Your Submission</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{existingSubmission.submissionText}</p>
                  </div>
                </div>
              )}

              {existingSubmission.submissionFiles?.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Submitted Files</Label>
                  <div className="mt-2 space-y-2">
                    {existingSubmission.submissionFiles.map((file: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <File className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {existingSubmission.grade !== null && (
                <div>
                  <Label className="text-sm font-medium">Grade</Label>
                  <p className="text-lg font-semibold">
                    {existingSubmission.grade}/{assignment.maxPoints}
                  </p>
                </div>
              )}

              {existingSubmission.feedback && (
                <div>
                  <Label className="text-sm font-medium">Feedback</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{existingSubmission.feedback}</p>
                  </div>
                </div>
              )}
            </div>

            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Assignment Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{assignment.title}</CardTitle>
            <div className="flex items-center gap-2">
              {isOverdue ? (
                <Badge variant="destructive">Overdue</Badge>
              ) : hoursUntilDue < 24 ? (
                <Badge variant="destructive">Due Soon</Badge>
              ) : (
                <Badge variant="secondary">Open</Badge>
              )}
              {isDraft && <Badge variant="outline">Draft Saved</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{assignment.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Due Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Time Remaining</p>
                <p className="text-sm text-muted-foreground">
                  {isOverdue ? 'Overdue' : `${hoursUntilDue} hours`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Max Points</p>
                <p className="text-sm text-muted-foreground">{assignment.maxPoints}</p>
              </div>
            </div>
          </div>

          {assignment.instructions && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Instructions</h4>
              <p className="text-sm whitespace-pre-wrap">{assignment.instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Text Submission */}
          <div className="space-y-2">
            <Label htmlFor="submission-text">Written Response</Label>
            <Textarea
              id="submission-text"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Type your assignment response here..."
              className="min-h-[300px]"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <Label>File Attachments</Label>
            
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Click to upload files or drag and drop
              </p>
              <Input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                type="button"
              >
                Choose Files
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Files</Label>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saveDraftMutation.isPending}
              >
                {saveDraftMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || submitAssignmentMutation.isPending || (!submissionText.trim() && selectedFiles.length === 0)}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting || submitAssignmentMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </>
                )}
              </Button>
            </div>
          </div>

          {isOverdue && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">
                This assignment is overdue. Late submissions may be penalized.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}