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
import { Slider } from '@/components/ui/slider';
import { FileText, Clock, Download, ExternalLink, CheckCircle2 } from 'lucide-react';

// Define schema for assignment grading
const gradingSchema = z.object({
  grade: z.coerce.number().min(0).max(100),
  feedback: z.string().min(1, 'Feedback is required'),
});

type AssignmentGradingProps = {
  submission: any;
  onComplete?: (gradedSubmission: any) => void;
};

const AssignmentGrading = ({ submission, onComplete }: AssignmentGradingProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Check if the submission was made after the due date
  const isLateSubmission = submission.assignment?.dueDate && 
    new Date(submission.submittedAt) > new Date(submission.assignment.dueDate);

  // Form for grading
  const form = useForm<z.infer<typeof gradingSchema>>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      grade: submission.grade || 0,
      feedback: submission.feedback || '',
    },
  });

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof gradingSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest('POST', `/api/assignment-submissions/${submission.id}/grade`, {
        grade: data.grade,
        feedback: data.feedback,
      });
      
      const gradedSubmission = await response.json();
      
      toast({
        title: 'Assignment Graded',
        description: 'The assignment has been graded successfully.',
      });
      
      if (onComplete) {
        onComplete(gradedSubmission);
      }
    } catch (error) {
      console.error('Error grading assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to grade assignment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Assignment Submission</CardTitle>
        <CardDescription>
          Review and grade the student's assignment submission.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Submission details section */}
        <div className="border rounded-md p-4 space-y-3">
          <h3 className="font-medium text-lg">Submission Details</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-sm font-medium block">Student:</span>
              <span className="text-sm">{submission.user?.firstName} {submission.user?.lastName}</span>
            </div>
            <div>
              <span className="text-sm font-medium block">Submitted:</span>
              <div className="flex items-center">
                <span className="text-sm">{formatDate(submission.submittedAt)}</span>
                {isLateSubmission && (
                  <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">Late</Badge>
                )}
              </div>
            </div>
            
            {submission.assignment?.dueDate && (
              <div>
                <span className="text-sm font-medium block">Due Date:</span>
                <span className="text-sm">{formatDate(submission.assignment.dueDate)}</span>
              </div>
            )}
            
            {submission.gradedAt && (
              <div>
                <span className="text-sm font-medium block">Previously Graded:</span>
                <span className="text-sm">{formatDate(submission.gradedAt)}</span>
              </div>
            )}
          </div>
          
          <div>
            <span className="text-sm font-medium block">Assignment:</span>
            <span className="text-sm">{submission.assignment?.title}</span>
          </div>
          
          {submission.comments && (
            <div>
              <span className="text-sm font-medium block">Student Comments:</span>
              <div className="p-2 bg-muted rounded-md text-sm mt-1">
                {submission.comments}
              </div>
            </div>
          )}
        </div>
        
        {/* Submission file */}
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-3">Submission File</h3>
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              <span className="text-sm truncate max-w-[200px]">
                {submission.fileUrl.split('/').pop()}
              </span>
            </div>
            <div className="flex space-x-2">
              <a 
                href={submission.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-1 hover:bg-accent rounded"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <a 
                href={submission.fileUrl} 
                download
                className="p-1 hover:bg-accent rounded"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        
        {/* Grading rubric - if one exists */}
        {submission.assignment?.rubric && (
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-3">Grading Rubric</h3>
            <div className="space-y-2">
              {Object.entries(submission.assignment.rubric).map(([criterion, points]: [string, any]) => (
                <div key={criterion} className="flex justify-between items-center p-2 border-b last:border-0">
                  <span className="text-sm">{criterion}</span>
                  <span className="text-sm font-medium">{points} points</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Grading form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade (out of 100)</FormLabel>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <Slider
                        value={[field.value]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="flex-1"
                      />
                      <div className="w-16">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={field.value}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value >= 0 && value <= 100) {
                              field.onChange(value);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>F (0)</span>
                      <span>D (60)</span>
                      <span>C (70)</span>
                      <span>B (80)</span>
                      <span>A (90)</span>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback for Student</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide detailed feedback about the submission..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include specific commentary on what was done well and areas for improvement.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center">
          {submission.grade !== undefined && (
            <Badge 
              variant="outline" 
              className="bg-blue-50 text-blue-700 border-blue-200 mr-2"
            >
              Previous Grade: {submission.grade}%
            </Badge>
          )}
        </div>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting || !form.formState.isDirty}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full" />
              Submitting...
            </div>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Submit Grading
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AssignmentGrading;