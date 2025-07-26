import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  FileText, 
  User, 
  Shield, 
  AlertTriangle,
  Download,
  Eye
} from "lucide-react";

interface KycRequirements {
  levels: Array<{
    level: string;
    name: string;
    description: string;
    requirements: string[];
    benefits: string[];
    documentsRequired: number;
  }>;
  documentTypes: Record<string, string>;
}

interface KycStatus {
  status: string;
  verificationLevel: string | null;
  documentsUploaded: number;
  documentsVerified: number;
  canUpgrade: boolean;
  files?: Array<{
    id: number;
    documentType: string;
    fileName: string;
    verificationStatus: string;
    uploadedAt: string;
    verificationNotes?: string;
  }>;
}

export default function KycVerification() {
  const [selectedLevel, setSelectedLevel] = useState("basic");
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadingFile, setUploadingFile] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch KYC requirements
  const { data: requirements } = useQuery<KycRequirements>({
    queryKey: ["/api/kyc/requirements"],
  });

  // Fetch user's KYC status
  const { data: kycStatus, isLoading: statusLoading } = useQuery<KycStatus>({
    queryKey: ["/api/kyc/status"],
  });

  // Fetch uploaded documents
  const { data: documents } = useQuery<any[]>({
    queryKey: ["/api/kyc/documents"],
  });

  // Fetch verification history
  const { data: history } = useQuery<any[]>({
    queryKey: ["/api/kyc/history"],
  });

  // Submit KYC information mutation
  const submitKycMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/kyc/submit", data),
    onSuccess: () => {
      toast({
        title: "KYC Submitted",
        description: "Your KYC information has been submitted for review",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/status"] });
      setActiveTab("documents");
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit KYC information",
        variant: "destructive",
      });
    },
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: (formData: FormData) => {
      return fetch("/api/kyc/upload-document", {
        method: "POST",
        body: formData,
        credentials: "include",
      }).then(res => {
        if (!res.ok) throw new Error("Upload failed");
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/status"] });
      setUploadingFile(false);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
      setUploadingFile(false);
    },
  });

  const handleSubmitKyc = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data.verificationLevel = selectedLevel;
    submitKycMutation.mutate(data);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append("document", file);
    formData.append("documentType", documentType);
    formData.append("description", `${documentType} verification document`);

    uploadDocumentMutation.mutate(formData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
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

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedLevelInfo = requirements?.levels.find(level => level.level === selectedLevel);
  const progressPercentage = kycStatus?.documentsUploaded && selectedLevelInfo
    ? Math.min((kycStatus.documentsUploaded / selectedLevelInfo.documentsRequired) * 100, 100)
    : 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification</h1>
          <p className="text-gray-600">
            Verify your identity to unlock full platform features and higher transaction limits
          </p>
        </div>

        {/* Status Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verification Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(kycStatus?.status || "not_started")}
                <div>
                  <p className="font-medium">
                    {kycStatus?.status === "not_started" ? "Not Started" :
                     kycStatus?.status === "pending" ? "Under Review" :
                     kycStatus?.status === "approved" ? "Verified" : 
                     kycStatus?.status === "rejected" ? "Rejected" : "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Level: {kycStatus?.verificationLevel || "None"}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(kycStatus?.status || "not_started")}>
                {kycStatus?.status || "not_started"}
              </Badge>
            </div>
            
            {kycStatus?.status !== "not_started" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Documents Progress</span>
                  <span>{kycStatus?.documentsUploaded || 0} / {selectedLevelInfo?.documentsRequired || 0}</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submit">Submit KYC</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {requirements?.levels.map((level) => (
                <Card key={level.level} className={`cursor-pointer transition-all ${
                  selectedLevel === level.level ? "ring-2 ring-primary" : ""
                }`} onClick={() => setSelectedLevel(level.level)}>
                  <CardHeader>
                    <CardTitle className="text-lg">{level.name}</CardTitle>
                    <CardDescription>{level.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Requirements</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {level.requirements.map((req, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Benefits</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {level.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Submit KYC Tab */}
          <TabsContent value="submit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submit KYC Information</CardTitle>
                <CardDescription>
                  Please provide accurate information as it will be verified against your documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitKyc} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input id="fullName" name="fullName" required placeholder="Enter your full legal name" />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                    </div>
                    <div>
                      <Label htmlFor="nationality">Nationality *</Label>
                      <Input id="nationality" name="nationality" required placeholder="e.g., Nigerian" />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input id="phoneNumber" name="phoneNumber" required placeholder="+234..." />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea id="address" name="address" required placeholder="Enter your complete address" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input id="city" name="city" required placeholder="City" />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input id="state" name="state" required placeholder="State" />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input id="postalCode" name="postalCode" required placeholder="Postal Code" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input id="country" name="country" required placeholder="Country" defaultValue="Nigeria" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="employmentStatus">Employment Status</Label>
                      <Select name="employmentStatus">
                        <SelectTrigger>
                          <SelectValue placeholder="Select employment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employed">Employed</SelectItem>
                          <SelectItem value="self-employed">Self-Employed</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input id="occupation" name="occupation" placeholder="Your occupation" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sourceOfIncome">Source of Income</Label>
                    <Select name="sourceOfIncome">
                      <SelectTrigger>
                        <SelectValue placeholder="Select source of income" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">Salary/Wages</SelectItem>
                        <SelectItem value="business">Business Income</SelectItem>
                        <SelectItem value="investments">Investment Income</SelectItem>
                        <SelectItem value="freelance">Freelance/Contract Work</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Verification Level</Label>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {requirements?.levels.map((level) => (
                          <SelectItem key={level.level} value={level.level}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={submitKycMutation.isPending}
                  >
                    {submitKycMutation.isPending ? "Submitting..." : "Submit KYC Information"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Upload clear, high-quality photos or scans of your documents. Supported formats: JPG, PNG, PDF (max 10MB)
              </AlertDescription>
            </Alert>

            {selectedLevelInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Required Documents for {selectedLevelInfo.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {selectedLevelInfo.requirements.map((requirement, index) => {
                      const documentKey = requirement.toLowerCase().replace(/[^a-z0-9]/g, '_');
                      const uploadedDoc = documents?.find(doc => 
                        doc.documentType.includes(documentKey) || 
                        requirement.toLowerCase().includes(doc.documentType)
                      );

                      return (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{requirement}</h4>
                              {uploadedDoc && (
                                <p className="text-sm text-gray-500">
                                  {uploadedDoc.fileName} • {new Date(uploadedDoc.uploadedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            {uploadedDoc ? (
                              <div className="flex items-center gap-2">
                                {getStatusIcon(uploadedDoc.verificationStatus)}
                                <Badge className={getStatusColor(uploadedDoc.verificationStatus)}>
                                  {uploadedDoc.verificationStatus}
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="outline">Not uploaded</Badge>
                            )}
                          </div>

                          {!uploadedDoc && (
                            <div className="space-y-2">
                              <Input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf,.webp"
                                onChange={(e) => handleFileUpload(e, documentKey)}
                                disabled={uploadingFile}
                              />
                              {uploadingFile && (
                                <p className="text-sm text-gray-500">Uploading...</p>
                              )}
                            </div>
                          )}

                          {uploadedDoc?.verificationNotes && (
                            <Alert className="mt-3">
                              <AlertDescription>
                                <strong>Verification Notes:</strong> {uploadedDoc.verificationNotes}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification History</CardTitle>
                <CardDescription>
                  Track all changes and updates to your KYC verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                {history && history.length > 0 ? (
                  <div className="space-y-4">
                    {history.map((entry, index) => (
                      <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
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
                  <p className="text-gray-500 text-center py-8">No verification history yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}