import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Users, 
  Star,
  TrendingUp,
  Clock,
  MessageSquare,
  Award,
  ArrowLeft,
  Activity
} from 'lucide-react';
import { Link } from 'wouter';

interface MentorDetails {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  profileImageUrl?: string;
  bio?: string;
  specialization?: string;
  experience?: string;
  rating?: number;
  totalStudents?: number;
  activeCourses?: number;
  totalEarnings?: number;
  courses: Array<{
    id: number;
    title: string;
    category: string;
    enrollments: number;
    completionRate: number;
    averageRating: number;
  }>;
  students: Array<{
    id: string;
    name: string;
    email: string;
    progress: number;
    lastActivity: string;
  }>;
  analytics: {
    monthlyEarnings: Array<{ month: string; amount: number }>;
    studentProgress: Array<{ course: string; avgProgress: number }>;
    responseTime: number;
    satisfactionRate: number;
  };
}

export default function AdminMentorDetails() {
  const { id } = useParams();
  
  // Mock detailed mentor data - in real app this would come from API
  const mockMentorDetails: MentorDetails = {
    id: id || '',
    email: 'mentor@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'mentor',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-15T14:30:00Z',
    profileImageUrl: undefined,
    bio: 'Experienced software developer with 8+ years in full-stack development. Passionate about teaching and helping students grow their coding skills.',
    specialization: 'Full-Stack Development',
    experience: '8+ years',
    rating: 4.8,
    totalStudents: 142,
    activeCourses: 5,
    totalEarnings: 2850000,
    courses: [
      { id: 1, title: 'React Fundamentals', category: 'Frontend', enrollments: 45, completionRate: 87, averageRating: 4.9 },
      { id: 2, title: 'Node.js Backend', category: 'Backend', enrollments: 38, completionRate: 82, averageRating: 4.7 },
      { id: 3, title: 'JavaScript Advanced', category: 'Programming', enrollments: 32, completionRate: 79, averageRating: 4.8 },
      { id: 4, title: 'Database Design', category: 'Database', enrollments: 27, completionRate: 91, averageRating: 4.6 },
    ],
    students: [
      { id: '1', name: 'Alice Johnson', email: 'alice@example.com', progress: 85, lastActivity: '2 hours ago' },
      { id: '2', name: 'Bob Smith', email: 'bob@example.com', progress: 67, lastActivity: '1 day ago' },
      { id: '3', name: 'Carol Wilson', email: 'carol@example.com', progress: 92, lastActivity: '3 hours ago' },
      { id: '4', name: 'David Brown', email: 'david@example.com', progress: 45, lastActivity: '2 days ago' },
    ],
    analytics: {
      monthlyEarnings: [
        { month: 'Jan', amount: 450000 },
        { month: 'Feb', amount: 520000 },
        { month: 'Mar', amount: 480000 },
        { month: 'Apr', amount: 590000 },
        { month: 'May', amount: 670000 },
        { month: 'Jun', amount: 720000 },
      ],
      studentProgress: [
        { course: 'React Fundamentals', avgProgress: 87 },
        { course: 'Node.js Backend', avgProgress: 82 },
        { course: 'JavaScript Advanced', avgProgress: 79 },
        { course: 'Database Design', avgProgress: 91 },
      ],
      responseTime: 2.4,
      satisfactionRate: 96
    }
  };

  const { data: mentor = mockMentorDetails, isLoading } = useQuery({
    queryKey: ['/api/admin/mentor-details', id],
    queryFn: async () => {
      // In real app, this would fetch from API
      // const response = await fetch(`/api/admin/mentor-details/${id}`);
      // if (!response.ok) throw new Error('Failed to fetch mentor details');
      // return response.json();
      return mockMentorDetails;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/mentors">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mentors
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Mentor Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button>
            <User className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Mentor Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={mentor.profileImageUrl} />
              <AvatarFallback className="text-2xl">
                {mentor.firstName?.[0] || mentor.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {mentor.firstName && mentor.lastName 
                    ? `${mentor.firstName} ${mentor.lastName}`
                    : mentor.email
                  }
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="default">Mentor</Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {mentor.rating?.toFixed(1)}
                  </Badge>
                  <span className="text-muted-foreground">{mentor.specialization}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{mentor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(mentor.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {mentor.bio && (
                <p className="text-muted-foreground">{mentor.bio}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{mentor.totalStudents}</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{mentor.activeCourses}</div>
                <div className="text-sm text-muted-foreground">Courses</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">₦{mentor.totalEarnings?.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Earnings</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mentor.courses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-semibold">{course.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{course.category}</span>
                        <span>{course.enrollments} students</span>
                        <span>★ {course.averageRating.toFixed(1)} rating</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant="secondary">{course.completionRate}% completion</Badge>
                      <Button variant="outline" size="sm">View Course</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mentor.students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{student.name}</h4>
                        <span className="text-sm text-muted-foreground">{student.email}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{student.progress}%</span>
                        </div>
                        <Progress value={student.progress} className="h-2" />
                      </div>
                      <p className="text-xs text-muted-foreground">Last activity: {student.lastActivity}</p>
                    </div>
                    <Button variant="outline" size="sm">View Profile</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Average Response Time</span>
                  <Badge variant="secondary">{mentor.analytics.responseTime}h</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Student Satisfaction</span>
                  <Badge variant="secondary">{mentor.analytics.satisfactionRate}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Course Completion Rate</span>
                  <Badge variant="secondary">85%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mentor.analytics.monthlyEarnings.map((earning) => (
                    <div key={earning.month} className="flex justify-between">
                      <span>{earning.month}</span>
                      <span>₦{earning.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Graded assignment in React Fundamentals</p>
                    <p className="text-sm text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Responded to student question</p>
                    <p className="text-sm text-muted-foreground">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <BookOpen className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Updated course curriculum</p>
                    <p className="text-sm text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}