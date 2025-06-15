import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Shield, 
  User, 
  Settings, 
  Save,
  AlertTriangle,
  CheckCircle,
  Mail,
  Calendar,
  UserCheck
} from 'lucide-react';
import { Link } from 'wouter';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminUserPermissions() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Extract user info from URL params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const userId = urlParams.get('userId');
  const userName = urlParams.get('name');
  const userEmail = urlParams.get('email');

  const [formData, setFormData] = useState({
    role: '',
    status: 'active',
    canCreateCourses: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canManagePayments: false,
    canManageContent: false,
    commissionRate: 37,
    notes: ''
  });

  // Fetch user details
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Update user permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      alert('User permissions updated successfully');
    },
    onError: (error: any) => {
      alert(`Failed to update permissions: ${error.message}`);
    },
  });

  // Suspend/Activate user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async (data: { action: string; reason: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      alert('User status updated successfully');
    },
    onError: (error: any) => {
      alert(`Failed to update user status: ${error.message}`);
    },
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        role: user.role,
        status: user.status || 'active',
      }));
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePermissionsMutation.mutate(formData);
  };

  const handleSuspendUser = () => {
    const reason = prompt('Please provide a reason for suspending this user:');
    if (reason) {
      suspendUserMutation.mutate({ action: 'suspend', reason });
    }
  };

  const handleActivateUser = () => {
    suspendUserMutation.mutate({ action: 'activate', reason: 'Account reactivated by admin' });
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
            <Shield className="h-6 w-6 text-blue-600" />
            User Permissions
          </h1>
          <p className="text-muted-foreground">
            Manage permissions and access levels for {userName || userEmail}
          </p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Name:</span>
              <span>{userName || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Email:</span>
              <span>{userEmail || user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Role:</span>
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

      {/* Permissions Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Role & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">User Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
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

            {/* Permission Toggles */}
            <div className="space-y-4">
              <h4 className="font-medium">Specific Permissions</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="canCreateCourses">Create Courses</Label>
                    <p className="text-sm text-muted-foreground">Allow user to create and publish courses</p>
                  </div>
                  <Switch
                    id="canCreateCourses"
                    checked={formData.canCreateCourses}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canCreateCourses: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="canManageUsers">Manage Users</Label>
                    <p className="text-sm text-muted-foreground">Allow user to manage other users</p>
                  </div>
                  <Switch
                    id="canManageUsers"
                    checked={formData.canManageUsers}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canManageUsers: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="canViewAnalytics">View Analytics</Label>
                    <p className="text-sm text-muted-foreground">Allow user to view platform analytics</p>
                  </div>
                  <Switch
                    id="canViewAnalytics"
                    checked={formData.canViewAnalytics}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canViewAnalytics: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="canManagePayments">Manage Payments</Label>
                    <p className="text-sm text-muted-foreground">Allow user to manage payment settings</p>
                  </div>
                  <Switch
                    id="canManagePayments"
                    checked={formData.canManagePayments}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canManagePayments: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="canManageContent">Manage Content</Label>
                    <p className="text-sm text-muted-foreground">Allow user to manage platform content</p>
                  </div>
                  <Switch
                    id="canManageContent"
                    checked={formData.canManageContent}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canManageContent: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* Commission Rate for Mentors */}
            {formData.role === 'mentor' && (
              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Select 
                  value={formData.commissionRate.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, commissionRate: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="35">35%</SelectItem>
                    <SelectItem value="37">37% (Default)</SelectItem>
                    <SelectItem value="40">40%</SelectItem>
                    <SelectItem value="45">45%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Administrative Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this user's permissions or status..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            {user?.status !== 'suspended' ? (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleSuspendUser}
                disabled={suspendUserMutation.isPending}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Suspend User
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleActivateUser}
                disabled={suspendUserMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate User
              </Button>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={updatePermissionsMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </form>
    </div>
  );
}