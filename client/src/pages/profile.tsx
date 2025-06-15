import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Users, 
  Star,
  Edit,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'wouter';

interface User {
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

export default function ProfilePage() {
  const { id } = useParams();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/users', id],
    queryFn: async () => {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      return response.json();
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

  if (error || !user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
              <p className="text-muted-foreground mb-4">The requested user profile could not be found.</p>
              <Link href="/admin/mentors">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Mentors
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
          <h1 className="text-3xl font-bold">User Profile</h1>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.profileImageUrl} />
              <AvatarFallback className="text-2xl">
                {user.firstName?.[0] || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email
                  }
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant={user.role === 'mentor' ? 'default' : user.role === 'admin' ? 'destructive' : 'secondary'}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  {user.rating && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {user.rating.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {user.bio && (
                <div>
                  <h4 className="font-semibold mb-2">Bio</h4>
                  <p className="text-muted-foreground">{user.bio}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats for Mentors */}
      {user.role === 'mentor' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {user.totalStudents || 0}
              </div>
              <div className="text-muted-foreground flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                Total Students
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {user.activeCourses || 0}
              </div>
              <div className="text-muted-foreground flex items-center justify-center gap-2">
                <BookOpen className="h-4 w-4" />
                Active Courses
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                ₦{user.totalEarnings?.toLocaleString() || '0'}
              </div>
              <div className="text-muted-foreground">
                Total Earnings
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.specialization && (
            <div>
              <h4 className="font-semibold mb-1">Specialization</h4>
              <p className="text-muted-foreground">{user.specialization}</p>
            </div>
          )}
          
          {user.experience && (
            <div>
              <h4 className="font-semibold mb-1">Experience</h4>
              <p className="text-muted-foreground">{user.experience}</p>
            </div>
          )}

          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span> {new Date(user.createdAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {new Date(user.updatedAt).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}