import { useParams } from 'wouter';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  User, 
  Settings, 
  BookOpen, 
  Users, 
  BarChart3,
  CreditCard,
  MessageSquare,
  ArrowLeft,
  Save
} from 'lucide-react';
import { Link } from 'wouter';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

export default function AdminPermissions() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [permissions, setPermissions] = useState<Permission[]>([
    // Course Management Permissions
    { id: 'create_courses', name: 'Create Courses', description: 'Can create new courses', category: 'Course Management', enabled: true },
    { id: 'edit_courses', name: 'Edit Courses', description: 'Can modify existing courses', category: 'Course Management', enabled: true },
    { id: 'delete_courses', name: 'Delete Courses', description: 'Can delete courses', category: 'Course Management', enabled: false },
    { id: 'manage_curriculum', name: 'Manage Curriculum', description: 'Can edit course curriculum and lessons', category: 'Course Management', enabled: true },
    
    // Student Management Permissions
    { id: 'view_students', name: 'View Students', description: 'Can view student profiles and progress', category: 'Student Management', enabled: true },
    { id: 'edit_student_progress', name: 'Edit Student Progress', description: 'Can modify student progress and grades', category: 'Student Management', enabled: true },
    { id: 'message_students', name: 'Message Students', description: 'Can send messages to students', category: 'Student Management', enabled: true },
    { id: 'enroll_students', name: 'Enroll Students', description: 'Can enroll students in courses', category: 'Student Management', enabled: false },
    
    // Assessment Permissions
    { id: 'create_assessments', name: 'Create Assessments', description: 'Can create quizzes and assignments', category: 'Assessments', enabled: true },
    { id: 'grade_assessments', name: 'Grade Assessments', description: 'Can grade student submissions', category: 'Assessments', enabled: true },
    { id: 'view_analytics', name: 'View Analytics', description: 'Can access course and student analytics', category: 'Assessments', enabled: true },
    
    // System Permissions
    { id: 'access_admin_panel', name: 'Access Admin Panel', description: 'Can access administrative features', category: 'System', enabled: false },
    { id: 'manage_users', name: 'Manage Users', description: 'Can create, edit, and delete user accounts', category: 'System', enabled: false },
    { id: 'view_payments', name: 'View Payments', description: 'Can view payment information and reports', category: 'System', enabled: false },
  ]);

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/admin/users', id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async (updatedPermissions: Permission[]) => {
      const response = await fetch(`/api/admin/users/${id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updatedPermissions }),
      });
      if (!response.ok) throw new Error('Failed to update permissions');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Permissions Updated",
        description: "User permissions have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
    },
  });

  const togglePermission = (permissionId: string) => {
    setPermissions(prev => 
      prev.map(p => 
        p.id === permissionId ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const handleSavePermissions = () => {
    updatePermissionsMutation.mutate(permissions);
  };

  const getPermissionsByCategory = (category: string) => {
    return permissions.filter(p => p.category === category);
  };

  const categories = ['Course Management', 'Student Management', 'Assessments', 'System'];
  const categoryIcons = {
    'Course Management': BookOpen,
    'Student Management': Users,
    'Assessments': BarChart3,
    'System': Settings,
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
              <p className="text-muted-foreground mb-4">The requested user could not be found.</p>
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
          <div>
            <h1 className="text-3xl font-bold">Manage Permissions</h1>
            <p className="text-muted-foreground">
              Configure permissions for {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.email
              }
            </p>
          </div>
        </div>
        <Button onClick={handleSavePermissions} disabled={updatePermissionsMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* User Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white text-lg font-bold">
              {user.firstName?.[0] || user.email[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.email
                }
              </h3>
              <p className="text-muted-foreground">{user.email}</p>
              <Badge variant={user.role === 'mentor' ? 'default' : user.role === 'admin' ? 'destructive' : 'secondary'}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions by Category */}
      {categories.map((category) => {
        const categoryPermissions = getPermissionsByCategory(category);
        const Icon = categoryIcons[category as keyof typeof categoryIcons];
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryPermissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={permission.id} className="font-medium">
                        {permission.name}
                      </Label>
                      <Badge variant={permission.enabled ? 'default' : 'secondary'} className="text-xs">
                        {permission.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {permission.description}
                    </p>
                  </div>
                  <Switch
                    id={permission.id}
                    checked={permission.enabled}
                    onCheckedChange={() => togglePermission(permission.id)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {permissions.filter(p => p.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Enabled</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {permissions.filter(p => !p.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Disabled</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {permissions.length}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((permissions.filter(p => p.enabled).length / permissions.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Access Level</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}