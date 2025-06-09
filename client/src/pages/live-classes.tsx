import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import useAuth from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Plus,
  Play,
  Download,
  ExternalLink,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Share,
  FileText
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const liveSessionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  courseId: z.number().min(1, "Course is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  provider: z.enum(["google_meet", "zoom", "zoho"]).default("google_meet"),
  timezone: z.string().default("Africa/Lagos"),
  maxParticipants: z.number().min(1).max(1000).default(100),
  autoRecord: z.boolean().default(true),
  waitingRoomEnabled: z.boolean().default(true),
  requiresEnrollment: z.boolean().default(true),
});

type LiveSessionForm = z.infer<typeof liveSessionSchema>;

export default function LiveClassesPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "analytics">("upcoming");
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<LiveSessionForm>({
    resolver: zodResolver(liveSessionSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: 0,
      startTime: "",
      endTime: "",
      provider: "google_meet",
      timezone: "Africa/Lagos",
      maxParticipants: 100,
      autoRecord: true,
      waitingRoomEnabled: true,
      requiresEnrollment: true,
    },
  });

  // Fetch upcoming sessions - use mentor endpoint for admin/mentor users
  const { data: upcomingSessions = [], isLoading: loadingUpcoming } = useQuery({
    queryKey: user?.role === 'admin' || user?.role === 'mentor' ? ["/api/mentor/live-sessions"] : ["/api/student/upcoming-sessions"],
    enabled: activeTab === "upcoming",
  });

  // Fetch courses for session creation
  const { data: courses = [] } = useQuery({
    queryKey: ["/api/courses"],
  });

  // Fetch live session analytics
  const { data: analytics } = useQuery({
    queryKey: ["/api/live-sessions/analytics"],
    enabled: activeTab === "analytics",
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: LiveSessionForm) => {
      const response = await apiRequest("POST", "/api/live-sessions", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Live session created successfully!",
      });
      setIsCreateDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: user?.role === 'admin' || user?.role === 'mentor' ? ["/api/mentor/live-sessions"] : ["/api/student/upcoming-sessions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create live session",
        variant: "destructive",
      });
    },
  });

  // Join session mutation
  const joinSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest("POST", `/api/live-sessions/${sessionId}/join`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.meetingUrl) {
        window.open(data.meetingUrl, "_blank");
      }
      toast({
        title: "Joined Session",
        description: "Redirecting to video conference...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join session",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LiveSessionForm) => {
    createSessionMutation.mutate(data);
  };

  const formatSessionTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${format(start, "MMM dd, yyyy • h:mm a")} - ${format(end, "h:mm a")}`;
  };

  const getSessionStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) return { status: "upcoming", color: "bg-blue-500" };
    if (now >= start && now <= end) return { status: "live", color: "bg-red-500" };
    return { status: "ended", color: "bg-gray-500" };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Live Classes</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Join live sessions, manage your classes, and view analytics
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Live Session</DialogTitle>
              <DialogDescription>
                Schedule a new live class session with video conferencing integration
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduction to React Hooks" {...field} />
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
                          placeholder="Session overview and objectives..."
                          {...field}
                        />
                      </FormControl>
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
                      <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course: any) => (
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="google_meet">Google Meet</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="zoho">Zoho Meeting</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createSessionMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {createSessionMutation.isPending ? "Creating..." : "Create Session"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {[
          { key: "upcoming", label: "Upcoming", icon: Calendar },
          { key: "past", label: "Past Sessions", icon: Clock },
          { key: "analytics", label: "Analytics", icon: BarChart3 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "upcoming" && (
        <div className="space-y-4">
          {loadingUpcoming ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
            </div>
          ) : upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <Video className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No upcoming sessions
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first live session to get started
                </p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingSessions.map((session: any) => {
                const { status, color } = getSessionStatus(session.startTime, session.endTime);
                
                return (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <div>
                            <CardTitle className="text-lg">{session.title}</CardTitle>
                            <CardDescription>
                              {formatSessionTime(session.startTime, session.endTime)}
                            </CardDescription>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant={status === "live" ? "destructive" : "secondary"}>
                            {status === "live" ? "LIVE" : status.toUpperCase()}
                          </Badge>
                          
                          {status === "live" && (
                            <Button
                              onClick={() => joinSessionMutation.mutate(session.id)}
                              disabled={joinSessionMutation.isPending}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Join Now
                            </Button>
                          )}
                          
                          {status === "upcoming" && (
                            <Button
                              onClick={() => joinSessionMutation.mutate(session.id)}
                              disabled={joinSessionMutation.isPending}
                              variant="outline"
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {session.maxParticipants || 100} max
                          </div>
                          <div className="flex items-center">
                            <Video className="w-4 h-4 mr-1" />
                            {session.provider === "google_meet" ? "Google Meet" :
                             session.provider === "zoom" ? "Zoom" : "Zoho Meeting"}
                          </div>
                          {session.autoRecord && (
                            <div className="flex items-center">
                              <Download className="w-4 h-4 mr-1" />
                              Recording enabled
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {session.description && (
                        <>
                          <Separator className="my-3" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {session.description}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalSessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.avgAttendance || 0}%</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalHours || 0}h</div>
              <p className="text-xs text-muted-foreground">
                Live session hours this month
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}