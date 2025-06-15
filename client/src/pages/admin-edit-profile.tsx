import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  User, 
  Settings, 
  Save,
  AlertTriangle,
  Mail,
  Calendar,
  UserCheck,
  Edit,
  Upload
} from 'lucide-react';
import { Link } from 'wouter';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status?: string;
  bio?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminEditProfile() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Extract user info from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const userId = urlParams.get('userId');
  const userName = urlParams.get('name');
  const userEmail = urlParams.get('email');
  const userRole = urlParams.get('role');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    profileImageUrl: '',
    role: userRole || 'student'
  });

  // Fetch user details
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      alert('Profile updated successfully');
    },
    onError: (error: any) => {
      alert(`Failed to update profile: ${error.message}`);
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        bio: user.bio || '',
        profileImageUrl: user.profileImageUrl || '',
        role: user.role || 'student'
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!userId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Invalid User</h3>
            <p className="text-muted-foreground mb-4">No user ID provided</p>
            <Link href="/admin/mentors">
              <Button>Back to Mentors</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => setLocation('/admin/mentors')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Mentors
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Edit className="h-6 w-6 text-blue-600" />
            Edit Profile
          </h1>
          <p className="text-muted-foreground">
            Manage profile information for {userName || userEmail}
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">User ID:</span>
              <span className="font-mono text-sm">{userId}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Current Email:</span>
              <span>{userEmail || user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Current Role:</span>
              <Badge variant="outline">{user?.role || 'Unknown'}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Status:</span>
              <Badge variant={user?.status === 'suspended' ? 'destructive' : 'default'}>
                {user?.status || 'Active'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Edit Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">User Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="mentor">Mentor</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="affiliate">Affiliate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileImageUrl">Profile Image URL</Label>
              <Input
                id="profileImageUrl"
                value={formData.profileImageUrl}
                onChange={(e) => handleInputChange('profileImageUrl', e.target.value)}
                placeholder="Enter profile image URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Enter user bio or description..."
                rows={4}
              />
            </div>

            {/* Profile Preview */}
            {(formData.firstName || formData.lastName || formData.profileImageUrl) && (
              <div className="space-y-2">
                <Label>Profile Preview</Label>
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                      {formData.profileImageUrl ? (
                        <img src={formData.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        (formData.firstName?.[0] || formData.lastName?.[0] || formData.email[0]).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {formData.firstName || formData.lastName 
                          ? `${formData.firstName} ${formData.lastName}`.trim()
                          : formData.email
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground">{formData.email}</p>
                      <Badge variant="outline" className="mt-1">{formData.role}</Badge>
                    </div>
                  </div>
                  {formData.bio && (
                    <p className="mt-3 text-sm text-muted-foreground">{formData.bio}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={updateProfileMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}