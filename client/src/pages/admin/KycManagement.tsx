import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Shield, 
  AlertTriangle,
  Download,
  Eye,
  Users,
  FileText,
  TrendingUp
} from "lucide-react";

interface KycSubmission {
  id: number;
  userId: string;
  fullName: string;
  verificationStatus: string;
  verificationLevel: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

interface KycStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface KycDetails {
  id: number;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  verificationStatus: string;
  verificationLevel: string;
  files: Array<{
    id: number;
    documentType: string;
    fileName: string;
    verificationStatus: string;
    uploadedAt: string;
    verificationNotes?: string;
  }>;
  history: Array<{
    id: number;
    action: string;
    reason: string;
    createdAt: string;
    notes?: string;
  }>;
}

export default function KycManagement() {
  const [selectedSubmission, setSelectedSubmission] = useState<KycSubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch KYC statistics
  const { data: statistics } = useQuery<KycStatistics>({
    queryKey: ["/api/admin/kyc/statistics"],
  });

  // Fetch pending KYC submissions
  const { data: pendingSubmissions, isLoading: pendingLoading } = useQuery<KycSubmission[]>({
    queryKey: ["/api/admin/kyc/pending"],
  });

  // Fetch KYC details for selected user
  const { data: kycDetails } = useQuery<KycDetails>({
    queryKey: ["/api/admin/kyc/user", selectedSubmission?.userId],
    enabled: !!selectedSubmission?.userId,
  });

  // Approve KYC mutation
  const approveMutation = useMutation({
    mutationFn: ({ userId, notes }: { userId: string; notes?: string }) =>
      apiRequest("POST", `/api/admin/kyc/${userId}/approve`, { notes }),
    onSuccess: () => {
      toast({
        title: "KYC Approved",
        description: "The KYC verification has been approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/statistics"] });
      setReviewDialogOpen(false);
      setSelectedSubmission(null);
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve KYC",
        variant: "destructive",
      });
    },
  });

  // Reject KYC mutation
  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      apiRequest("POST", `/api/admin/kyc/${userId}/reject`, { reason }),
    onSuccess: () => {
      toast({
        title: "KYC Rejected",
        description: "The KYC verification has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/statistics"] });
      setReviewDialogOpen(false);
      setSelectedSubmission(null);
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject KYC",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleApprove = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSubmission) return;

    const formData = new FormData(event.currentTarget);
    const notes = formData.get("notes") as string;

    approveMutation.mutate({
      userId: selectedSubmission.userId,
      notes: notes || undefined,
    });
  };

  const handleReject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSubmission) return;

    const formData = new FormData(event.currentTarget);
    const reason = formData.get("reason") as string;

    if (!reason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    rejectMutation.mutate({
      userId: selectedSubmission.userId,
      reason,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Management</h1>
          <p className="text-gray-600">
            Review and manage user identity verification submissions
          </p>
        </div>

        {/* Statistics Overview */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                  <p className="text-2xl font-bold">{statistics?.total || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics?.pending || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{statistics?.approved || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{statistics?.rejected || 0}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Pending KYC Submissions
            </CardTitle>
            <CardDescription>
              Review and approve user identity verification requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingSubmissions && pendingSubmissions.length > 0 ? (
              <div className="space-y-4">
                {pendingSubmissions.map((submission) => (
                  <div key={submission.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{submission.fullName}</h3>
                          <p className="text-sm text-gray-500">
                            Level: {submission.verificationLevel} • 
                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(submission.verificationStatus)}>
                          {submission.verificationStatus}
                        </Badge>
                        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending KYC submissions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KYC Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>KYC Details - {selectedSubmission?.fullName}</DialogTitle>
              <DialogDescription>
                Complete verification information and documents
              </DialogDescription>
            </DialogHeader>

            {kycDetails && (
              <div className="space-y-6">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="personal">Personal Info</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Full Name</Label>
                        <p className="text-sm font-medium">{kycDetails.fullName}</p>
                      </div>
                      <div>
                        <Label>Date of Birth</Label>
                        <p className="text-sm font-medium">
                          {new Date(kycDetails.dateOfBirth).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label>Nationality</Label>
                        <p className="text-sm font-medium">{kycDetails.nationality}</p>
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <p className="text-sm font-medium">{kycDetails.phoneNumber}</p>
                      </div>
                    </div>
                    <div>
                      <Label>Address</Label>
                      <p className="text-sm font-medium">
                        {kycDetails.address}, {kycDetails.city}, {kycDetails.state} {kycDetails.postalCode}, {kycDetails.country}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-4">
                    {kycDetails.files && kycDetails.files.length > 0 ? (
                      <div className="space-y-4">
                        {kycDetails.files.map((file) => (
                          <div key={file.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-medium">{file.documentType.replace(/_/g, ' ').toUpperCase()}</h4>
                                <p className="text-sm text-gray-500">{file.fileName}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(file.verificationStatus)}
                                <Badge className={getStatusColor(file.verificationStatus)}>
                                  {file.verificationStatus}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">
                              Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                            </p>
                            {file.verificationNotes && (
                              <Alert className="mt-2">
                                <AlertDescription>{file.verificationNotes}</AlertDescription>
                              </Alert>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No documents uploaded</p>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="space-y-4">
                    {kycDetails.history && kycDetails.history.length > 0 ? (
                      <div className="space-y-4">
                        {kycDetails.history.map((entry) => (
                          <div key={entry.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                            <div className="mt-1">
                              {getStatusIcon(entry.action)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{entry.reason}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(entry.createdAt).toLocaleString()}
                              </p>
                              {entry.notes && (
                                <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No history available</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review KYC Submission</DialogTitle>
              <DialogDescription>
                Approve or reject the KYC verification for {selectedSubmission?.fullName}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="approve" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="approve">Approve</TabsTrigger>
                <TabsTrigger value="reject">Reject</TabsTrigger>
              </TabsList>

              <TabsContent value="approve">
                <form onSubmit={handleApprove} className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Approval Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Add any notes for the approval..."
                      rows={3}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? "Approving..." : "Approve KYC"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="reject">
                <form onSubmit={handleReject} className="space-y-4">
                  <div>
                    <Label htmlFor="reason">Rejection Reason *</Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      placeholder="Please provide a detailed reason for rejection..."
                      rows={3}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="destructive"
                    className="w-full"
                    disabled={rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? "Rejecting..." : "Reject KYC"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}