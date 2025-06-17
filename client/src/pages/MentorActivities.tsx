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
import { Activity, Clock, Users, BookOpen, MessageSquare, Video, CheckCircle, Plus, Filter, Download } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const activitySchema = z.object({
  mentorId: z.string().min(1, "Mentor is required"),
  type: z.enum(["course_interaction", "live_session", "assignment_grading", "student_communication", "content_creation"]),
  description: z.string().min(1, "Description is required"),
  metadata: z.object({
    courseId: z.number().optional(),
    studentId: z.string().optional(),
    sessionId: z.number().optional(),
    assignmentId: z.number().optional(),
    duration: z.number().optional(),
  }).optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

export default function MentorActivities() {
  const [filters, setFilters] = useState({
    mentorId: "",
    type: "",
    courseId: "",
    fromDate: "",
    toDate: "",
    page: 1,
    limit: 20
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      mentorId: "",
      type: "course_interaction",
      description: "",
      metadata: {
        courseId: undefined,
        studentId: "",
        sessionId: undefined,
        assignmentId: undefined,
        duration: undefined,
      },
    },
  });

  // Fetch activities with filters
  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ["/api/admin/mentor-activities", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      const response = await apiRequest("GET", `/api/admin/mentor-activities?${params}`);
      return response.json();
    },
  });

  // Fetch activity summary
  const { data: summary } = useQuery({
    queryKey: ["/api/admin/mentor-activity-summary"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/mentor-activity-summary");
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

  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async (data: ActivityFormData) => {
      const response = await apiRequest("POST", "/api/admin/mentor-activities", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentor-activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mentor-activity-summary"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Activity Logged",
        description: "Mentor activity has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log activity",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ActivityFormData) => {
    createActivityMutation.mutate(data);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "course_interaction":
        return <BookOpen className="w-4 h-4" />;
      case "live_session":
        return <Video className="w-4 h-4" />;
      case "assignment_grading":
        return <CheckCircle className="w-4 h-4" />;
      case "student_communication":
        return <MessageSquare className="w-4 h-4" />;
      case "content_creation":
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityBadge = (type: string) => {
    const configs = {
      course_interaction: { color: "bg-blue-100 text-blue-800", label: "Course Interaction" },
      live_session: { color: "bg-green-100 text-green-800", label: "Live Session" },
      assignment_grading: { color: "bg-purple-100 text-purple-800", label: "Assignment Grading" },
      student_communication: { color: "bg-orange-100 text-orange-800", label: "Communication" },
      content_creation: { color: "bg-pink-100 text-pink-800", label: "Content Creation" },
    };
    const config = configs[type as keyof typeof configs] || configs.course_interaction;
    return (
      <Badge className={config.color}>
        {getActivityIcon(type)}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentor Activities</h1>
          <p className="text-muted-foreground">Track and manage mentor activities and engagement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Log Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Log Mentor Activity</DialogTitle>
                <DialogDescription>
                  Record a new activity for a mentor.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select activity type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="course_interaction">Course Interaction</SelectItem>
                            <SelectItem value="live_session">Live Session</SelectItem>
                            <SelectItem value="assignment_grading">Assignment Grading</SelectItem>
                            <SelectItem value="student_communication">Student Communication</SelectItem>
                            <SelectItem value="content_creation">Content Creation</SelectItem>
                          </SelectContent>
                        </Select>
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
                            placeholder="Describe the activity..."
                            className="resize-none"
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
                      name="metadata.courseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course (Optional)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select course" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
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
                      name="metadata.duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="metadata.studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
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
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createActivityMutation.isPending}
                    >
                      {createActivityMutation.isPending ? "Logging..." : "Log Activity"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalActivities || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all mentors
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Mentors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeMentors || 0}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round((summary.totalMinutes || 0) / 60)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalMinutes || 0} minutes logged
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Daily</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.averageDaily || 0}</div>
              <p className="text-xs text-muted-foreground">
                Activities per mentor
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
              <label className="text-sm font-medium">Activity Type</label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="course_interaction">Course Interaction</SelectItem>
                  <SelectItem value="live_session">Live Session</SelectItem>
                  <SelectItem value="assignment_grading">Assignment Grading</SelectItem>
                  <SelectItem value="student_communication">Communication</SelectItem>
                  <SelectItem value="content_creation">Content Creation</SelectItem>
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
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value, page: 1 }))}
                  className="text-xs"
                />
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value, page: 1 }))}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Detailed log of mentor activities and engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : activitiesData?.activities?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No activities found</TableCell>
                  </TableRow>
                ) : (
                  activitiesData?.activities?.map((activity: any) => (
                    <TableRow key={activity.activity.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {activity.mentor?.firstName} {activity.mentor?.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.mentor?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getActivityBadge(activity.activity.type)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm truncate" title={activity.activity.description}>
                            {activity.activity.description}
                          </p>
                          {activity.activity.metadata?.studentId && activity.student && (
                            <p className="text-xs text-muted-foreground">
                              Student: {activity.student.firstName} {activity.student.lastName}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.course?.title ? (
                          <Badge variant="outline">
                            {activity.course.title}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.activity.metadata?.duration ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDuration(activity.activity.metadata.duration)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(activity.activity.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(activity.activity.createdAt), "h:mm a")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {activitiesData?.pagination && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {((activitiesData.pagination.page - 1) * activitiesData.pagination.limit) + 1} to{" "}
                {Math.min(activitiesData.pagination.page * activitiesData.pagination.limit, activitiesData.pagination.total)} of{" "}
                {activitiesData.pagination.total} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activitiesData.pagination.page <= 1}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activitiesData.pagination.page >= activitiesData.pagination.pages}
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