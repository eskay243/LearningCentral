import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

// Define schema for assignment submission
const assignmentSubmissionSchema = z.object({
  assignmentId: z.number(),
  fileUrl: z.string().min(1, 'File is required'),
  comments: z.string().optional()
});

type AssignmentSubmissionProps = {
  assignment: any;
  existingSubmission?: any;
  onComplete?: (submission: any) => void;
};

const AssignmentSubmission = ({ assignment, existingSubmission, onComplete }: AssignmentSubmissionProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Check if the assignment is past due
  const isPastDue = assignment.dueDate ? new Date(assignment.dueDate) < new Date() : false;

  // Form for assignment submission
  const form = useForm<z.infer<typeof assignmentSubmissionSchema>>({
    resolver: zodResolver(assignmentSubmissionSchema),
    defaultValues: {
      assignmentId: assignment.id,
      fileUrl: existingSubmission?.fileUrl || '',
      comments: existingSubmission?.comments || ''
    }
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Simulate file upload - in a real app this would upload to a file storage service
  const uploadFile = async () => {
    if (!file) return '';
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
    
    // Simulate a delay for the upload
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    clearInterval(interval);
    setUploadProgress(100);
    setIsUploading(false);
    
    // Return a mock URL - in a real app this would be the actual upload URL
    return `https://storage.example.com/assignments/${assignment.id}/${file.name}`;
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof assignmentSubmissionSchema>) => {
    setIsSubmitting(true);
    try {
      // Upload file if a new one is selected
      let fileUrl = data.fileUrl;
      if (file) {
        fileUrl = await uploadFile();
        if (!fileUrl) {
          throw new Error('File upload failed');
        }
      }
      
      // Submit assignment
      const response = await apiRequest(
        existingSubmission ? 'PUT' : 'POST',
        existingSubmission ? `/api/assignment-submissions/${existingSubmission.id}` : '/api/assignment-submissions',
        {
          ...data,
          fileUrl
        }
      );
      
      const submission = await response.json();
      
      toast({
        title: existingSubmission ? 'Submission Updated' : 'Assignment Submitted',
        description: existingSubmission 
          ? 'Your submission has been updated successfully.' 
          : 'Your assignment has been submitted successfully.',
      });
      
      if (onComplete) {
        onComplete(submission);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: 'Error',
        description: `Failed to ${existingSubmission ? 'update' : 'submit'} assignment`,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If the submission is already graded, show the grade
  if (existingSubmission?.grade !== undefined && existingSubmission?.grade !== null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{assignment.title}</CardTitle>
          <CardDescription>
            Graded Assignment Submission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant="outline" className="bg-green-100 text-green-700">
                Graded
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Grade:</span>
              <span className="text-lg font-bold">{existingSubmission.grade}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Submitted:</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(existingSubmission.submittedAt)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Graded:</span>
              <span className="text-sm text-muted-foreground">
                {existingSubmission.gradedAt ? formatDate(existingSubmission.gradedAt) : 'Not yet'}
              </span>
            </div>
            
            {existingSubmission.feedback && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Feedback from Instructor:</h4>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {existingSubmission.feedback}
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Your Submission:</h4>
              <a 
                href={existingSubmission.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors"
              >
                <FileText className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm truncate">
                  {existingSubmission.fileUrl.split('/').pop()}
                </span>
              </a>
              
              {existingSubmission.comments && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2">Your Comments:</h4>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {existingSubmission.comments}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For submissions that are pending grading
  if (existingSubmission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{assignment.title}</CardTitle>
          <CardDescription>
            Assignment Submission Pending Grading
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                Pending Grading
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Submitted:</span>
              <span className="text-sm text-muted-foreground">
                {formatDate(existingSubmission.submittedAt)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Due Date:</span>
              <div className="flex items-center">
                {assignment.dueDate ? (
                  <>
                    <span className={`text-sm ${isPastDue ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {formatDate(assignment.dueDate)}
                    </span>
                    {isPastDue && (
                      <AlertCircle className="h-4 w-4 text-red-500 ml-1" />
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">No due date</span>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Your Submission:</h4>
              <a 
                href={existingSubmission.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors"
              >
                <FileText className="h-5 w-5 mr-2 flex-shrink-0" />
                <span className="text-sm truncate">
                  {existingSubmission.fileUrl.split('/').pop()}
                </span>
              </a>
              
              {existingSubmission.comments && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2">Your Comments:</h4>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {existingSubmission.comments}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={!file || isSubmitting || isUploading}
                  className="whitespace-nowrap"
                >
                  {isSubmitting || isUploading ? 'Updating...' : 'Update Submission'}
                </Button>
              </div>
              
              {isUploading && (
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              
              <input 
                type="hidden" 
                {...form.register('assignmentId')} 
                value={assignment.id}
              />
              <input 
                type="hidden" 
                {...form.register('fileUrl')} 
                value={existingSubmission.fileUrl}
              />
            </form>
          </Form>
        </CardFooter>
      </Card>
    );
  }

  // For new submissions
  return (
    <Card>
      <CardHeader>
        <CardTitle>{assignment.title}</CardTitle>
        <CardDescription>
          {assignment.description || 'Submit your assignment file below.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Due Date:</span>
            <div className="flex items-center">
              {assignment.dueDate ? (
                <>
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className={`text-sm ${isPastDue ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {formatDate(assignment.dueDate)}
                  </span>
                  {isPastDue && (
                    <AlertCircle className="h-4 w-4 text-red-500 ml-1" />
                  )}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No due date</span>
              )}
            </div>
          </div>
          
          {assignment.rubric && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Grading Rubric:</h4>
              <div className="p-3 bg-muted rounded-md">
                <ul className="text-sm list-disc list-inside space-y-1">
                  {Object.entries(assignment.rubric).map(([key, value]: [string, any]) => (
                    <li key={key}>
                      <span className="font-medium">{key}:</span> {value} points
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="assignmentId"
              render={({ field }) => (
                <input type="hidden" {...field} value={assignment.id} />
              )}
            />
            
            <div className="space-y-2">
              <FormLabel>Assignment File</FormLabel>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {file && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>
              <FormDescription>
                Upload your completed assignment. Accepted file types: PDF, DOC, DOCX, PPT, PPTX, ZIP.
              </FormDescription>
              
              {isUploading && (
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="fileUrl"
                render={() => <></>}
              />
            </div>
            
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any comments about your submission..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    You can include any additional information or context about your submission.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-2">
              <Button
                type="submit"
                disabled={!file || isSubmitting || isUploading || isPastDue}
                className="w-full"
              >
                {isSubmitting ? 'Submitting...' : 
                 isUploading ? `Uploading (${uploadProgress}%)` : 
                 isPastDue ? 'Past Due Date' : 'Submit Assignment'}
              </Button>
              
              {isPastDue && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  This assignment is past the due date. Contact your instructor if you need an extension.
                </p>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AssignmentSubmission;