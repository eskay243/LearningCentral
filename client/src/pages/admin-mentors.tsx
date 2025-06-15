import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Search, 
  UserPlus, 
  GraduationCap,
  BookOpen,
  TrendingUp,
  Star,
  Clock,
  Calendar,
  Mail,
  Phone,
  Award,
  Activity,
  MessageSquare,
  BarChart3,
  X,
  Edit,
  Shield,
  Ban
} from 'lucide-react';

interface Mentor {
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
}

interface MentorStats {
  totalMentors: number;
  activeMentors: number;
  newMentorsThisMonth: number;
  averageRating: number;
  totalStudentsManaged: number;
  totalCoursesCreated: number;
}

interface MentorPerformance {
  mentorId: string;
  mentorName: string;
  studentsCount: number;
  coursesCount: number;
  averageRating: number;
  totalEarnings: number;
  completionRate: number;
  responseTime: number;
  lastActivity: string;
}

export default function AdminMentors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [, setLocation] = useLocation();

  // Fetch all mentors
  const { data: mentors = [], isLoading: mentorsLoading, refetch: refetchMentors } = useQuery<Mentor[]>({
    queryKey: ["/api/admin/mentors"],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always consider data stale for real-time updates
  });

  // Fetch mentor statistics
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<MentorStats>({
    queryKey: ["/api/admin/mentor-stats"],
    refetchInterval: 30000,
    staleTime: 0,
  });

  // Fetch mentor performance data
  const { data: performance = [], isLoading: performanceLoading, refetch: refetchPerformance } = useQuery<MentorPerformance[]>({
    queryKey: ["/api/admin/mentor-performance"],
    refetchInterval: 30000,
    staleTime: 0,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeVariant = (mentor: Mentor) => {
    // Check multiple criteria for active status
    const hasStudents = mentor.totalStudents && mentor.totalStudents > 0;
    const hasCourses = mentor.activeCourses && mentor.activeCourses > 0;
    const recentActivity = mentor.updatedAt && 
      (new Date().getTime() - new Date(mentor.updatedAt).getTime()) < (30 * 24 * 60 * 60 * 1000); // 30 days
    
    if (hasStudents || hasCourses || recentActivity) {
      return 'default';
    }
    return 'secondary';
  };

  const getMentorStatus = (mentor: Mentor) => {
    const hasStudents = mentor.totalStudents && mentor.totalStudents > 0;
    const hasCourses = mentor.activeCourses && mentor.activeCourses > 0;
    const recentActivity = mentor.updatedAt && 
      (new Date().getTime() - new Date(mentor.updatedAt).getTime()) < (30 * 24 * 60 * 60 * 1000); // 30 days
    
    if (hasStudents && hasCourses) {
      return 'Active';
    } else if (hasCourses && !hasStudents) {
      return 'Available';
    } else if (recentActivity) {
      return 'Recent';
    } else {
      return 'Inactive';
    }
  };

  const getPerformanceBadge = (rating: number) => {
    if (rating >= 4.5) return { variant: 'default' as const, text: 'Excellent' };
    if (rating >= 4.0) return { variant: 'secondary' as const, text: 'Good' };
    if (rating >= 3.5) return { variant: 'outline' as const, text: 'Average' };
    return { variant: 'destructive' as const, text: 'Needs Improvement' };
  };

  // Filter and sort mentors
  const filteredMentors = mentors
    .filter(mentor => {
      const matchesSearch = 
        mentor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mentor.firstName && mentor.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (mentor.lastName && mentor.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const mentorStatus = getMentorStatus(mentor).toLowerCase();
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && mentorStatus === 'active') ||
        (statusFilter === 'inactive' && mentorStatus === 'inactive');
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'students':
          return (b.totalStudents || 0) - (a.totalStudents || 0);
        case 'name':
          return (a.firstName || a.email).localeCompare(b.firstName || b.email);
        default:
          return 0;
      }
    });

  if (statsLoading || mentorsLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            Mentor Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage mentors, track performance, and monitor student interactions
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add New Mentor
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mentors</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMentors || 0}</div>
            <p className="text-xs text-muted-foreground">Teaching on platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mentors</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.activeMentors || 0}</div>
            <p className="text-xs text-muted-foreground">Currently teaching</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Managed</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.totalStudentsManaged || 0}</div>
            <p className="text-xs text-muted-foreground">Across all mentors</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Mentor Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Mentors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mentors by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Mentors</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="rating">Highest Rating</SelectItem>
                    <SelectItem value="students">Most Students</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mentors List */}
              <div className="space-y-4">
                {filteredMentors.length === 0 ? (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No mentors found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'No mentors have been registered yet.'
                      }
                    </p>
                  </div>
                ) : (
                  filteredMentors.map((mentor) => (
                    <div key={mentor.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {(mentor.firstName || mentor.email).charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {mentor.firstName && mentor.lastName 
                                ? `${mentor.firstName} ${mentor.lastName}`
                                : mentor.email
                              }
                            </p>
                            <Badge variant={getStatusBadgeVariant(mentor)} className="text-xs">
                              {getMentorStatus(mentor)}
                            </Badge>
                            {mentor.rating && (
                              <Badge variant={getPerformanceBadge(mentor.rating).variant} className="text-xs flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {mentor.rating.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {mentor.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {mentor.totalStudents || 0} students
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {mentor.activeCourses || 0} courses
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Joined {formatDate(mentor.createdAt)}
                            </div>
                          </div>

                          {mentor.specialization && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Award className="h-3 w-3" />
                              Specialization: {mentor.specialization}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setLocation(`/profile/${mentor.id}`);
                          }}
                        >
                          View Profile
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedMentor(mentor)}
                        >
                          Manage
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setLocation(`/messages?user=${mentor.id}`);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination info */}
              {filteredMentors.length > 0 && (
                <div className="mt-6 text-sm text-muted-foreground text-center">
                  Showing {filteredMentors.length} of {mentors.length} mentors
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Mentor Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {performance.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No performance data available</h3>
                      <p className="text-muted-foreground">Performance analytics will appear once mentors start teaching.</p>
                    </div>
                  ) : (
                    performance.map((perf) => (
                      <div key={perf.mentorId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{perf.mentorName}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{perf.studentsCount} students</span>
                            <span>{perf.coursesCount} courses</span>
                            <span>★ {perf.averageRating.toFixed(1)} rating</span>
                            <span>{perf.completionRate}% completion</span>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-medium text-green-600">₦{perf.totalEarnings.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">
                            Avg response: {perf.responseTime}h
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Mentor Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Activity tracking coming soon</h3>
                  <p className="text-muted-foreground">Recent mentor activities and interactions will be displayed here.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mentor Management Dialog */}
      {selectedMentor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">Manage Mentor</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedMentor(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Mentor Profile Section */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {selectedMentor.firstName?.[0] || selectedMentor.email[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {selectedMentor.firstName && selectedMentor.lastName 
                      ? `${selectedMentor.firstName} ${selectedMentor.lastName}`
                      : selectedMentor.email
                    }
                  </h3>
                  <p className="text-muted-foreground">{selectedMentor.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getStatusBadgeVariant(selectedMentor)}>
                      {getMentorStatus(selectedMentor)}
                    </Badge>
                    {selectedMentor.rating && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {selectedMentor.rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedMentor.totalStudents || 0}</div>
                  <div className="text-sm text-muted-foreground">Students</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedMentor.activeCourses || 0}</div>
                  <div className="text-sm text-muted-foreground">Courses</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ₦{selectedMentor.totalEarnings?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Earnings</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedMentor.rating?.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
              </div>

              {/* Management Actions */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Management Actions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => {
                      const mentorName = selectedMentor.firstName && selectedMentor.lastName 
                        ? `${selectedMentor.firstName} ${selectedMentor.lastName}`
                        : selectedMentor.firstName || selectedMentor.lastName || selectedMentor.email;
                      setLocation(`/admin/edit-profile?userId=${selectedMentor.id}&name=${encodeURIComponent(mentorName)}&email=${encodeURIComponent(selectedMentor.email)}&role=${selectedMentor.role}`);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/users/${selectedMentor.id}`);
                        if (response.ok) {
                          const userData = await response.json();
                          const userName = userData.firstName && userData.lastName 
                            ? `${userData.firstName} ${userData.lastName}`
                            : userData.firstName || userData.lastName || userData.email;
                          setLocation(`/admin/user-permissions?userId=${selectedMentor.id}&name=${encodeURIComponent(userName)}&email=${encodeURIComponent(userData.email)}`);
                        } else {
                          alert('User not found or unable to load user data');
                        }
                      } catch (error) {
                        console.error('Error loading user:', error);
                        alert('Error loading user data');
                      }
                    }}
                  >
                    <Shield className="h-4 w-4" />
                    Manage Permissions
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => {
                      const mentorName = selectedMentor.firstName && selectedMentor.lastName 
                        ? `${selectedMentor.firstName} ${selectedMentor.lastName}`
                        : selectedMentor.email;
                      setLocation(`/messages?user=${selectedMentor.id}&name=${encodeURIComponent(mentorName)}&email=${encodeURIComponent(selectedMentor.email)}&role=${selectedMentor.role}`);
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Send Message
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    onClick={async () => {
                      if (confirm('Are you sure you want to suspend this mentor? This will prevent them from accessing their account.')) {
                        try {
                          const response = await fetch(`/api/admin/users/${selectedMentor.id}/suspend`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              action: 'suspend',
                              reason: 'Administrative action'
                            })
                          });

                          if (response.ok) {
                            alert('Mentor account has been suspended successfully');
                            setSelectedMentor(null);
                            // Refresh mentor list
                            window.location.reload();
                          } else {
                            const error = await response.json();
                            alert(`Failed to suspend account: ${error.message || 'Unknown error'}`);
                          }
                        } catch (error) {
                          console.error('Error suspending mentor:', error);
                          alert('Failed to suspend account. Please try again.');
                        }
                      }
                    }}
                  >
                    <Ban className="h-4 w-4" />
                    Suspend Account
                  </Button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Recent Activity</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm">No recent activity data available</p>
                    <p className="text-xs text-muted-foreground">Activity tracking will be implemented soon</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedMentor(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setLocation(`/admin/mentor-details/${selectedMentor.id}`);
                }}>
                  View Full Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}