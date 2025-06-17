import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Filter, Plus, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ratingSchema = z.object({
  mentorId: z.string().min(1, "Mentor is required"),
  studentId: z.string().min(1, "Student is required"),
  courseId: z.number().min(1, "Course is required"),
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  feedback: z.string().optional(),
  category: z.enum(["teaching", "communication", "knowledge", "support", "overall"]),
});

type RatingFormData = z.infer<typeof ratingSchema>;

export default function MentorRatings() {
  const [filters, setFilters] = useState({
    mentorId: "",
    courseId: "",
    category: "",
    rating: "",
    fromDate: "",
    toDate: "",
    page: 1,
    limit: 20
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RatingFormData>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      mentorId: "",
      studentId: "",
      courseId: 0,
      rating: 5,
      feedback: "",
      category: "overall",
    },
  });

  // Fetch ratings with filters
  const { data: ratingsData, isLoading } = useQuery({
    queryKey: ["/api/admin/mentor-ratings", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      const response = await apiRequest("GET", `/api/admin/mentor-ratings?${params}`);
      return response.json();
    },
  });

  // Fetch rating summary
  const { data: summary } = useQuery({
    queryKey: ["/api/admin/mentor-rating-summary"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/mentor-rating-summary");
      return response.json();
    },
  });

  // Fetch mentors for dropdown
  const { data: mentors } = useQuery({
    queryKey: ["/api/admin/mentors"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/mentors");
      return response.json();
    },
  });

  // Fetch students for dropdown
  const { data: students } = useQuery({
    queryKey: ["/api/admin/students"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/students");
      return response.json();
    },
  });

  // Fetch courses for dropdown
  const { data: courses } = useQuery({
    queryKey: ["/api/courses/basic"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/courses/basic");
      return response.json();
    },
  });

  // Create rating mutation
  const createRatingMutation = useMutation({
    mutationFn: async (data: RatingFormData) => {
      const response = await apiRequest("POST", "/api/admin/mentor-ratings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentor-ratings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentor-rating-summary"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Rating Created",
        description: "Mentor rating has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create rating",
        variant: "destructive",
      });
    },
  });

  // Update rating status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/mentor-ratings/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentor-ratings"] });
      toast({
        title: "Status Updated",
        description: "Rating status has been updated successfully.",
      });
    },
  });

  const onSubmit = (data: RatingFormData) => {
    createRatingMutation.mutate(data);
  };

  const handleStatusUpdate = (ratingId: number, status: string) => {
    updateStatusMutation.mutate({ id: ratingId, status });
  };

  const getStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "text-yellow-400 fill-current"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rating >= 4.0) return <Badge className="bg-blue-100 text-blue-800">Very Good</Badge>;
    if (rating >= 3.0) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (rating >= 2.0) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      teaching: "bg-blue-100 text-blue-800",
      communication: "bg-green-100 text-green-800",
      knowledge: "bg-purple-100 text-purple-800",
      support: "bg-orange-100 text-orange-800",
      overall: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[category as keyof typeof colors] || colors.overall}>{category}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentor Ratings</h1>
          <p className="text-muted-foreground">Manage mentor ratings and feedback</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Rating
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add Mentor Rating</DialogTitle>
              <DialogDescription>
                Create a new rating record for a mentor.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mentorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mentor</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mentor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mentors?.map((mentor: any) => (
                              <SelectItem key={mentor.id} value={mentor.id}>
                                {mentor.firstName} {mentor.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students?.map((student: any) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.firstName} {student.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses?.map((course: any) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            <SelectItem value="teaching">Teaching</SelectItem>
                            <SelectItem value="communication">Communication</SelectItem>
                            <SelectItem value="knowledge">Knowledge</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            <SelectItem value="overall">Overall</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (1-5)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                            className="w-20"
                          />
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-5 h-5 cursor-pointer ${
                                  star <= (field.value || 0)
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                                onClick={() => field.onChange(star)}
                              />
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feedback (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter detailed feedback..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createRatingMutation.isPending}
                  >
                    {createRatingMutation.isPending ? "Creating..." : "Create Rating"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.averageRating?.toFixed(1) || "0.0"}</div>
              <div className="flex items-center pt-1">
                {getStarRating(summary.averageRating || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalRatings || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all mentors
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">5-Star Ratings</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.fiveStarRatings || 0}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalRatings > 0 ? Math.round((summary.fiveStarRatings / summary.totalRatings) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.ratingsWithFeedback || 0}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalRatings > 0 ? Math.round((summary.ratingsWithFeedback / summary.totalRatings) * 100) : 0}% have feedback
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Mentor</label>
              <Select
                value={filters.mentorId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, mentorId: value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All mentors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All mentors</SelectItem>
                  {mentors?.map((mentor: any) => (
                    <SelectItem key={mentor.id} value={mentor.id}>
                      {mentor.firstName} {mentor.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Course</label>
              <Select
                value={filters.courseId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, courseId: value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All courses</SelectItem>
                  {courses?.map((course: any) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value="teaching">Teaching</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="knowledge">Knowledge</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="overall">Overall</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Rating</label>
              <Select
                value={filters.rating}
                onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <div>
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value, page: 1 }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value, page: 1 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ratings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Records</CardTitle>
          <CardDescription>
            Manage mentor rating records and feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : ratingsData?.ratings?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">No ratings found</TableCell>
                  </TableRow>
                ) : (
                  ratingsData?.ratings?.map((rating: any) => (
                    <TableRow key={rating.rating.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {rating.mentor?.firstName} {rating.mentor?.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {rating.mentor?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {rating.student?.firstName} {rating.student?.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {rating.student?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {rating.course?.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(rating.rating.category)}
                      </TableCell>
                      <TableCell>
                        {getStarRating(rating.rating.rating)}
                      </TableCell>
                      <TableCell>
                        {getRatingBadge(rating.rating.rating)}
                      </TableCell>
                      <TableCell>
                        {rating.rating.feedback ? (
                          <div className="max-w-xs">
                            <p className="text-sm truncate" title={rating.rating.feedback}>
                              {rating.rating.feedback}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No feedback</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(rating.rating.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {rating.rating.status === "active" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(rating.rating.id, "hidden")}
                              disabled={updateStatusMutation.isPending}
                            >
                              Hide
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(rating.rating.id, "active")}
                              disabled={updateStatusMutation.isPending}
                            >
                              Show
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {ratingsData?.pagination && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {((ratingsData.pagination.page - 1) * ratingsData.pagination.limit) + 1} to{" "}
                {Math.min(ratingsData.pagination.page * ratingsData.pagination.limit, ratingsData.pagination.total)} of{" "}
                {ratingsData.pagination.total} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={ratingsData.pagination.page <= 1}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={ratingsData.pagination.page >= ratingsData.pagination.pages}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}