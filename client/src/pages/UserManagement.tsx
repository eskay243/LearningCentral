import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// User role options
const USER_ROLES = {
  admin: "Admin",
  mentor: "Mentor",
  student: "Student",
  affiliate: "Affiliate",
};

const UserManagement = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    bio: "",
    profileImageUrl: "",
    commissionRate: 37,
  });
  
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "student",
    commissionRate: 37,
    bio: "",
    profileImageUrl: "",
    password: "",
    confirmPassword: "",
  });
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const itemsPerPage = 10;

  // Fetch all users
  const { data: allUsers = [], isLoading: usersLoading, isError } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!user && user.role === "admin",
  });

  // Filter users based on search term and selected role
  const filteredUsers = React.useMemo(() => {
    return (allUsers as any[]).filter((user: any) => {
      const matchesSearch = 
        searchTerm === "" || 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = selectedRole === null || user.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });
  }, [allUsers, searchTerm, selectedRole]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleRoleFilterChange = (value: string) => {
    setSelectedRole(value === "all" ? null : value);
    setCurrentPage(1); // Reset to first page on new filter
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      role: user.role || "",
      bio: user.bio || "",
      profileImageUrl: user.profileImageUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (value: string) => {
    setEditForm(prev => ({
      ...prev,
      role: value
    }));
  };
  
  const handleCreateRoleChange = (value: string) => {
    setCreateForm(prev => ({
      ...prev,
      role: value
    }));
  };
  
  const resetCreateForm = () => {
    setCreateForm({
      firstName: "",
      lastName: "",
      email: "",
      role: "student",
      bio: "",
      profileImageUrl: "",
      password: "",
      confirmPassword: "",
    });
    setProfileImage(null);
    setImagePreview("");
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Preview the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Store the file for upload
    setProfileImage(file);
  };
  
  const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!createForm.email || !createForm.password) {
      toast({
        title: "Missing Required Fields",
        description: "Email and password are required.",
        variant: "destructive",
      });
      return;
    }
    
    if (createForm.password !== createForm.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('firstName', createForm.firstName);
      formData.append('lastName', createForm.lastName);
      formData.append('email', createForm.email);
      formData.append('role', createForm.role);
      formData.append('bio', createForm.bio);
      formData.append('password', createForm.password);
      
      // Add the profile image if one was selected
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }
      
      // Make the API request with FormData
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: "User Created",
          description: `User ${createForm.firstName} ${createForm.lastName} has been created successfully.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        setIsCreateDialogOpen(false);
        resetCreateForm();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "There was an error creating the user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      const response = await apiRequest(
        "PATCH", 
        `/api/admin/users/${selectedUser.id}`, 
        editForm
      );
      
      if (response.ok) {
        toast({
          title: "User Updated",
          description: `User ${editForm.firstName} ${editForm.lastName} has been updated successfully.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating the user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not admin
  if (!authLoading && user?.role !== "admin") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access the user management dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (authLoading || usersLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Loading user data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              There was an error loading the user data. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={selectedRole || "all"} onValueChange={handleRoleFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.entries(USER_ROLES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button onClick={() => {
                resetCreateForm();
                setIsCreateDialogOpen(true);
              }}>
                Create User
              </Button>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No users found matching your search criteria.</p>
            </div>
          ) : (
            <>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                              <AvatarFallback>
                                {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === "admin" ? "default" : 
                            user.role === "mentor" ? "secondary" : 
                            user.role === "affiliate" ? "destructive" : 
                            "outline"
                          }>
                            {USER_ROLES[user.role as keyof typeof USER_ROLES] || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-4">
                          Page {currentPage} of {totalPages}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={editForm.profileImageUrl} alt={editForm.firstName || "User"} />
                  <AvatarFallback>
                    {editForm.firstName?.[0] || ''}{editForm.lastName?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="profileImageUrl">Profile Image URL</Label>
                  <Input
                    id="profileImageUrl"
                    name="profileImageUrl"
                    value={editForm.profileImageUrl}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  disabled
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="role">Role</Label>
                <Select value={editForm.role} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(USER_ROLES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={editForm.bio}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              {/* Commission Rate Field - Only visible for mentors */}
              {editForm.role === "mentor" && (
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <div className="flex items-center">
                    <Input
                      id="commissionRate"
                      name="commissionRate"
                      type="number"
                      min="0"
                      max="100"
                      value={editForm.commissionRate}
                      onChange={handleInputChange}
                      className="flex-1"
                    />
                    <span className="ml-2">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Default commission rate is 37% of student payments</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={imagePreview || createForm.profileImageUrl} alt={createForm.firstName || "New User"} />
                  <AvatarFallback>
                    {createForm.firstName?.[0] || ''}{createForm.lastName?.[0] || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="profileImage">Profile Image</Label>
                  <Input
                    id="profileImage"
                    name="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Upload a profile picture (JPEG, PNG, or GIF)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="createFirstName">First Name</Label>
                  <Input
                    id="createFirstName"
                    name="firstName"
                    value={createForm.firstName}
                    onChange={handleCreateInputChange}
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="createLastName">Last Name</Label>
                  <Input
                    id="createLastName"
                    name="lastName"
                    value={createForm.lastName}
                    onChange={handleCreateInputChange}
                  />
                </div>
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="createEmail">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="createEmail"
                  name="email"
                  type="email"
                  value={createForm.email}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="createPassword">Password <span className="text-red-500">*</span></Label>
                <Input
                  id="createPassword"
                  name="password"
                  type="password"
                  value={createForm.password}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="createConfirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                <Input
                  id="createConfirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={handleCreateInputChange}
                  required
                />
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="createRole">Role</Label>
                <Select value={createForm.role} onValueChange={handleCreateRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(USER_ROLES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="createBio">Bio</Label>
                <Textarea
                  id="createBio"
                  name="bio"
                  value={createForm.bio}
                  onChange={handleCreateInputChange}
                  rows={3}
                />
              </div>
              
              {/* Commission Rate Field - Only visible for mentors */}
              {createForm.role === "mentor" && (
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="createCommissionRate">Commission Rate (%)</Label>
                  <div className="flex items-center">
                    <Input
                      id="createCommissionRate"
                      name="commissionRate"
                      type="number"
                      min="0"
                      max="100"
                      value={createForm.commissionRate}
                      onChange={handleCreateInputChange}
                      className="flex-1"
                    />
                    <span className="ml-2">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Default commission rate is 37% of student payments</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;