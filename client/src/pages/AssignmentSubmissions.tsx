import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Clock, CheckCircle, Upload, Eye } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const AssignmentSubmissions = () => {
  const { assignmentId } = useParams();
  const { user, isMentor, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    content: "",
    fileUrl: "",
    notes: ""
  });

  // Fetch assignment details
  const { data: assignment, isLoading: assignmentLoading } = useQuery({
    queryKey: [`/api/assignments/${assignmentId}`],
    enabled: !!assignmentId,
  });

  // Fetch submissions (for mentors) or user's submission (for students)
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: [`/api/assignments/${assignmentId}/submissions`],
    enabled: !!assignmentId && (isMentor || isAdmin),
  });

  // Fetch user's own submission (for students)
  const { data: userSubmission } = useQuery({
    queryKey: [`/api/assignment-submissions/user/${user?.id}/${assignmentId}`],
    enabled: !!assignmentId && !!user && !isMentor && !isAdmin,
  });

  // Submit assignment mutation
  const submitAssignmentMutation = useMutation({
    mutationFn: async (submissionData: any) => {
      const response = await apiRequest("POST", "/api/assignment-submissions", submissionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignment-submissions/user/${user?.id}/${assignmentId}`] });
      toast({
        title: "Assignment Submitted",
        description: "Your assignment has been successfully submitted.",
      });
      setShowSubmissionDialog(false);
      setSubmissionForm({ content: "", fileUrl: "", notes: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitAssignment = () => {
    if (!submissionForm.content.trim()) {
      toast({
        title: "Missing Content",
        description: "Please provide your assignment content.",
        variant: "destructive",
      });
      return;
    }

    submitAssignmentMutation.mutate({
      assignmentId: parseInt(assignmentId!),
      content: submissionForm.content,
      fileUrl: submissionForm.fileUrl || null,
      notes: submissionForm.notes || null,
    });
  };

  if (assignmentLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {assignment?.title || "Assignment"} - Submissions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {assignment?.description || "View and manage assignment submissions"}
        </p>
      </div>

      {/* Assignment Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                Due: {assignment?.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Points: {assignment?.totalPoints || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                Submissions: {submissions?.length || 0}
              </span>
            </div>
          </div>
          {assignment?.instructions && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Instructions:</h4>
              <p className="text-gray-600 dark:text-gray-400">{assignment.instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student View - Submit Assignment */}
      {!isMentor && !isAdmin && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Submission</CardTitle>
            <CardDescription>
              {userSubmission ? "You have already submitted this assignment" : "Submit your assignment below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userSubmission ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Submitted
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(userSubmission.submittedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Your Content:</h4>
                  <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    {userSubmission.content}
                  </p>
                </div>
                {userSubmission.fileUrl && (
                  <div>
                    <h4 className="font-medium mb-2">File:</h4>
                    <a 
                      href={userSubmission.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View submitted file
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Submit Assignment</DialogTitle>
                    <DialogDescription>
                      Provide your assignment content and any additional notes.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="content">Assignment Content *</Label>
                      <Textarea
                        id="content"
                        placeholder="Enter your assignment content here..."
                        value={submissionForm.content}
                        onChange={(e) => setSubmissionForm(prev => ({ ...prev, content: e.target.value }))}
                        rows={6}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fileUrl">File URL (optional)</Label>
                      <Input
                        id="fileUrl"
                        placeholder="Link to your file (Google Drive, GitHub, etc.)"
                        value={submissionForm.fileUrl}
                        onChange={(e) => setSubmissionForm(prev => ({ ...prev, fileUrl: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Additional Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional notes or comments..."
                        value={submissionForm.notes}
                        onChange={(e) => setSubmissionForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleSubmitAssignment}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={submitAssignmentMutation.isPending}
                      >
                        {submitAssignmentMutation.isPending ? "Submitting..." : "Submit Assignment"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowSubmissionDialog(false)}
                        disabled={submitAssignmentMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mentor/Admin View - All Submissions */}
      {(isMentor || isAdmin) && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Student Submissions</h2>
          {submissionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : submissions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No submissions yet</h3>
                <p className="text-gray-500 text-center">
                  Students haven't submitted this assignment yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {submissions.map((submission: any) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {submission.user?.firstName} {submission.user?.lastName}
                        </CardTitle>
                        <CardDescription>
                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Submitted
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Content:</h4>
                        <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          {submission.content}
                        </p>
                      </div>
                      {submission.fileUrl && (
                        <div>
                          <h4 className="font-medium mb-2">File:</h4>
                          <a 
                            href={submission.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline"
                          >
                            <Eye className="w-4 h-4" />
                            View submitted file
                          </a>
                        </div>
                      )}
                      {submission.notes && (
                        <div>
                          <h4 className="font-medium mb-2">Notes:</h4>
                          <p className="text-gray-600 dark:text-gray-400">{submission.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentSubmissions;