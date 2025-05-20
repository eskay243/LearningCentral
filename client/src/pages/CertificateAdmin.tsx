import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  Award,
  Search,
  UserCheck,
  Download,
  FileText,
  Printer,
} from "lucide-react";
import CertificateTemplate from "@/components/certificates/CertificateTemplate";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";

const issueCertificateSchema = z.object({
  userId: z.string().min(1, "Please select a student"),
  courseId: z.string().min(1, "Please select a course"),
  templateStyle: z.enum(["default", "modern", "classic"]),
  additionalNote: z.string().optional(),
});

export default function CertificateAdmin() {
  const { user, isAdmin, isMentor, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCertificate, setSelectedCertificate] = useState<any | null>(null);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/api/login");
    } else if (!isLoading && isAuthenticated && !isAdmin && !isMentor) {
      setLocation("/dashboard");
      toast({
        title: "Access Denied",
        description: "You need admin or mentor privileges to access this page.",
        variant: "destructive",
      });
    }
  }, [isLoading, isAuthenticated, isAdmin, isMentor, setLocation, toast]);

  // Fetch all certificates
  const { data: certificates = [], isLoading: isLoadingCertificates } = useQuery({
    queryKey: ["/api/certificates/all"],
    enabled: isAuthenticated && (isAdmin || isMentor),
  });

  // Fetch all students for the dropdown
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/users/students"],
    enabled: isAuthenticated && (isAdmin || isMentor),
  });

  // Fetch all courses for the dropdown
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses/basic"],
    enabled: isAuthenticated && (isAdmin || isMentor),
  });

  const form = useForm<z.infer<typeof issueCertificateSchema>>({
    resolver: zodResolver(issueCertificateSchema),
    defaultValues: {
      userId: "",
      courseId: "",
      templateStyle: "default",
      additionalNote: "",
    },
  });

  async function onSubmit(values: z.infer<typeof issueCertificateSchema>) {
    try {
      if (previewMode) {
        setPreviewMode(false);
        return;
      }

      const response = await apiRequest("POST", "/api/certificates/issue-manual", values);
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Certificate Issued",
          description: "The certificate has been successfully issued to the student.",
        });
        
        // Reset form and refresh certificates
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/certificates/all"] });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to issue certificate",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handlePreview = () => {
    const values = form.getValues();
    if (!form.formState.isValid) {
      form.trigger();
      return;
    }
    setPreviewMode(true);
  };

  const revokeCertificate = async (certificateId: number) => {
    try {
      const response = await apiRequest("POST", `/api/certificates/${certificateId}/revoke`, {});
      
      if (response.ok) {
        toast({
          title: "Certificate Revoked",
          description: "The certificate has been successfully revoked.",
        });
        
        // Refresh certificates list
        queryClient.invalidateQueries({ queryKey: ["/api/certificates/all"] });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to revoke certificate",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const restoreCertificate = async (certificateId: number) => {
    try {
      const response = await apiRequest("POST", `/api/certificates/${certificateId}/restore`, {});
      
      if (response.ok) {
        toast({
          title: "Certificate Restored",
          description: "The certificate has been successfully restored.",
        });
        
        // Refresh certificates list
        queryClient.invalidateQueries({ queryKey: ["/api/certificates/all"] });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to restore certificate",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredCertificates = certificates
    .filter((cert: any) => {
      const matchesSearch = searchQuery === "" ||
        cert.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.courseTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.verificationCode?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === "all" ||
        (filterStatus === "active" && cert.status === "issued") ||
        (filterStatus === "revoked" && cert.status === "revoked");
      
      return matchesSearch && matchesStatus;
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin && !isMentor) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to access this page.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation("/dashboard")}>Return to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const studentName = form.watch("userId")
    ? students.find((s: any) => s.id === form.watch("userId"))?.firstName + " " + 
      students.find((s: any) => s.id === form.watch("userId"))?.lastName
    : "Student Name";

  const courseTitle = form.watch("courseId")
    ? courses.find((c: any) => c.id.toString() === form.watch("courseId"))?.title
    : "Course Title";

  const selectedTemplate = form.watch("templateStyle");
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Certificate Management</h1>
              <p className="text-muted-foreground mt-2">
                Issue, view, and manage certificates for students.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/certificate/analytics")}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              View Analytics
            </Button>
          </div>
        </div>

        <Tabs defaultValue="issue" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="issue">Issue Certificate</TabsTrigger>
            <TabsTrigger value="manage">Manage Certificates</TabsTrigger>
          </TabsList>
          
          {/* Issue Certificate Tab */}
          <TabsContent value="issue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Issue New Certificate</CardTitle>
                <CardDescription>
                  Manually issue certificates to students who have completed courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {previewMode ? (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-center">Certificate Preview</h3>
                    <div className="border rounded-md p-4 bg-white">
                      <CertificateTemplate
                        studentName={studentName}
                        courseTitle={courseTitle}
                        issueDate={currentDate}
                        verificationCode="PREVIEW"
                        templateStyle={selectedTemplate}
                      />
                    </div>
                    <div className="flex justify-end space-x-4">
                      <Button variant="outline" onClick={() => setPreviewMode(false)}>
                        Edit
                      </Button>
                      <Button onClick={form.handleSubmit(onSubmit)}>
                        Issue Certificate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="userId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Student</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a student" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {isLoadingStudents ? (
                                    <div className="flex justify-center py-2">
                                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                                    </div>
                                  ) : students.length === 0 ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                      No students found
                                    </div>
                                  ) : (
                                    students.map((student: any) => (
                                      <SelectItem key={student.id} value={student.id}>
                                        {student.firstName} {student.lastName}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="courseId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a course" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {isLoadingCourses ? (
                                    <div className="flex justify-center py-2">
                                      <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                                    </div>
                                  ) : courses.length === 0 ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                      No courses found
                                    </div>
                                  ) : (
                                    courses.map((course: any) => (
                                      <SelectItem key={course.id} value={course.id.toString()}>
                                        {course.title}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="templateStyle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certificate Template</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="default">Default Blue</SelectItem>
                                <SelectItem value="modern">Modern Gradient</SelectItem>
                                <SelectItem value="classic">Classic Gold</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="additionalNote"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Note (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Any special recognition or achievement" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-4">
                        <Button type="button" variant="outline" onClick={handlePreview}>
                          Preview
                        </Button>
                        <Button type="submit">Issue Certificate</Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Manage Certificates Tab */}
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Manage Certificates</CardTitle>
                <CardDescription>
                  View, filter, and manage all issued certificates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by student, course, or verification code..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Certificates</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="revoked">Revoked Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoadingCertificates ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : filteredCertificates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Certificates Found</h3>
                    <p className="text-muted-foreground max-w-md mt-2">
                      {searchQuery || filterStatus !== "all" 
                        ? "No certificates match your search criteria. Try adjusting your filters."
                        : "No certificates have been issued yet. Use the 'Issue Certificate' tab to create one."}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Issue Date</TableHead>
                          <TableHead>Verification Code</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCertificates.map((certificate: any) => (
                          <TableRow key={certificate.id}>
                            <TableCell>
                              <Badge variant={certificate.status === "issued" ? "default" : "destructive"}>
                                {certificate.status === "issued" ? "Active" : "Revoked"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-muted-foreground" />
                              {certificate.studentName}
                            </TableCell>
                            <TableCell>{certificate.courseTitle}</TableCell>
                            <TableCell>
                              {new Date(certificate.issuedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                {certificate.verificationCode}
                              </code>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`/certificate/verify/${certificate.id}`, '_blank')}
                                >
                                  <Award className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`/api/certificates/${certificate.id}/download`, '_blank')}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                {certificate.status === "issued" ? (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => revokeCertificate(certificate.id)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => restoreCertificate(certificate.id)}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}