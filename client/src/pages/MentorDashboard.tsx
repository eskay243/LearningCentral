import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  BookOpen, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Banknote,
  Edit,
  Eye,
  Plus
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

// Type definitions
interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string | null;
  isPublished: boolean;
  thumbnail: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  tags: string[] | null;
}

interface Earnings {
  totalEarnings: number;
  thisMonthEarnings: number;
  pendingPayouts: number;
  withdrawnFunds: number;
  commissionRate: number;
  totalEnrollments: number;
  courseCount: number;
}

interface WithdrawalMethod {
  id: string;
  name: string;
  description: string;
  fees: string;
  minimumAmount: number;
  processingTime: string;
}

const withdrawalSchema = z.object({
  amount: z.number().min(500, "Minimum withdrawal amount is ₦500"),
  method: z.string().min(1, "Please select a withdrawal method"),
  accountDetails: z.string().min(1, "Account details are required"),
});

type WithdrawalForm = z.infer<typeof withdrawalSchema>;

const courseEditSchema = z.object({
  title: z.string().min(1, "Course title is required"),
  description: z.string().min(1, "Course description is required"),
  price: z.number().min(0, "Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  published: z.boolean(),
});

type CourseEditForm = z.infer<typeof courseEditSchema>;

function EditCourseForm({ course }: { course: Course }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  console.log('EditCourseForm received course:', course);
  
  const form = useForm<CourseEditForm>({
    resolver: zodResolver(courseEditSchema),
    defaultValues: {
      title: course?.title || "",
      description: course?.description || "",
      price: course?.price || 0,
      category: course?.category || "",
      published: course?.isPublished || false,
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (data: CourseEditForm) => {
      const response = await apiRequest("PUT", `/api/courses/${course.id}`, {
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        isPublished: data.published,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Great work! 🎉",
        description: "Your course changes have been saved. Students will see the updated content right away.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/courses"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Oops! Something went wrong",
        description: "We couldn't save your changes right now. Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CourseEditForm) => {
    updateCourseMutation.mutate(data);
  };

  if (!course) {
    return <div>No course selected</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter course title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter course description" 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₦)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="programming">Programming</SelectItem>
                    <SelectItem value="web-development">Web Development</SelectItem>
                    <SelectItem value="mobile-development">Mobile Development</SelectItem>
                    <SelectItem value="data-science">Data Science</SelectItem>
                    <SelectItem value="machine-learning">Machine Learning</SelectItem>
                    <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                    <SelectItem value="cloud-computing">Cloud Computing</SelectItem>
                    <SelectItem value="ui-ux-design">UI/UX Design</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Publish Course</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Make this course visible to students
                </div>
              </div>
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Reset
          </Button>
          <Button 
            type="submit" 
            disabled={updateCourseMutation.isPending}
            className="min-w-[100px]"
          >
            {updateCourseMutation.isPending ? "Updating..." : "Update Course"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function WithdrawalForm({ withdrawalMethods }: { withdrawalMethods: WithdrawalMethod[] }) {
  const { toast } = useToast();
  
  const form = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      method: "",
      accountDetails: "",
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalForm) => {
      const response = await apiRequest("POST", "/api/mentor/withdrawal-request", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted successfully.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Withdrawal Failed", 
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WithdrawalForm) => {
    withdrawalMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Withdrawal Amount (₦)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter amount"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Withdrawal Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select withdrawal method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {withdrawalMethods && withdrawalMethods.length > 0 ? (
                    withdrawalMethods.map((method: any) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name} - {method.fees}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                      <SelectItem value="paystack">Paystack</SelectItem>
                      <SelectItem value="flutterwave">Flutterwave</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Details</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter your account details (bank name, account number, account name, etc.)"
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="submit" 
            disabled={withdrawalMutation.isPending}
            className="min-w-[120px]"
          >
            {withdrawalMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function MentorDashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isMentor, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Simple loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // For now, render the dashboard directly to test functionality
  // We'll add proper auth checks once the basic dashboard is working

  const { data: earnings, isLoading: earningsLoading } = useQuery<Earnings>({
    queryKey: ["/api/mentor/earnings"],
  });

  const { data: withdrawalMethods = [] } = useQuery<WithdrawalMethod[]>({
    queryKey: ["/api/mentor/withdrawal-methods"],
  });

  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useQuery<Course[]>({
    queryKey: ["/api/mentor/courses"],
    enabled: !!user && user.role === 'mentor', // Only run query when user is authenticated and is a mentor
  });

  console.log('Mentor courses debug:', { 
    courses, 
    coursesCount: Array.isArray(courses) ? courses.length : 0, 
    coursesLoading, 
    coursesError: coursesError?.message,
    firstCourse: Array.isArray(courses) ? courses[0] : null 
  });

  const withdrawalForm = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      method: "",
      accountDetails: "",
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalForm) => {
      const response = await apiRequest("POST", "/api/mentor/withdrawal-request", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Money's on the way! 💰",
        description: `Your ₦${withdrawalForm.getValues().amount.toLocaleString()} withdrawal request is being processed. We'll notify you once it's complete.`,
      });
      setWithdrawalDialogOpen(false);
      withdrawalForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/earnings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Having trouble with your withdrawal",
        description: "We couldn't process your request right now. Please check your details and try again.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const onWithdrawalSubmit = (data: WithdrawalForm) => {
    withdrawalMutation.mutate(data);
  };

  if (earningsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentor Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Track your earnings and manage your teaching activities</p>
        </div>
        <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Request Withdrawal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Withdrawal</DialogTitle>
            </DialogHeader>
            <Form {...withdrawalForm}>
              <form onSubmit={withdrawalForm.handleSubmit(onWithdrawalSubmit)} className="space-y-4">
                <FormField
                  control={withdrawalForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={withdrawalForm.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Withdrawal Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select withdrawal method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(withdrawalMethods) && withdrawalMethods.map((method: any) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name} - {method.fees}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={withdrawalForm.control}
                  name="accountDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your account details (account number, bank name, etc.)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={withdrawalMutation.isPending} className="flex-1">
                    {withdrawalMutation.isPending ? "Processing..." : "Submit Request"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setWithdrawalDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Earnings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
              {formatCurrency(earnings?.totalEarnings || 0)}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {earnings?.commissionRate || 37}% commission rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              {formatCurrency(earnings?.thisMonthEarnings || 0)}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              From {earnings?.totalEnrollments || 0} enrollments
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">
              {formatCurrency(earnings?.pendingPayouts || 0)}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Available for withdrawal
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Withdrawn Funds</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {formatCurrency(earnings?.withdrawnFunds || 0)}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Successfully withdrawn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Teaching Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Courses</span>
                  <Badge variant="secondary">{earnings?.courseCount || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Enrollments</span>
                  <Badge variant="secondary">{earnings?.totalEnrollments || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Commission Rate</span>
                  <Badge variant="default">{earnings?.commissionRate || 37}%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Withdrawal Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Available Withdrawal Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {withdrawalMethods.length > 0 ? (
                  withdrawalMethods.map((method) => (
                    <div key={method.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{method.name || 'Payment Method'}</h4>
                        <Badge variant="outline">{method.fees || 'No fees'}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {method.description || 'No description available'}
                      </p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Min: {formatCurrency(method.minimumAmount || 0)}</span>
                        <span>{method.processingTime || 'N/A'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600">No withdrawal methods available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>My Courses</CardTitle>
              <Button 
                onClick={() => navigate('/create-course')}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : coursesError ? (
                <div className="text-center py-8">
                  <p className="text-red-600">Error loading courses</p>
                </div>
              ) : !courses || !Array.isArray(courses) || courses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No courses assigned yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course: any) => (
                    <Card key={course.id} className="border">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{course.title || 'Untitled Course'}</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-medium">{formatCurrency(course.price || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Your Earnings:</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency((course.price || 0) * 0.37)}
                            </span>
                          </div>
                          <Badge variant={course.isPublished ? "default" : "secondary"} className="w-full justify-center mb-3">
                            {course.isPublished ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => navigate(`/course/${course.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => setEditingCourse(course)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Course</DialogTitle>
                              </DialogHeader>
                              <EditCourseForm course={editingCourse!} />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No withdrawal history yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Your withdrawal requests will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Performance analytics coming soon</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Track your teaching performance and student engagement
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}