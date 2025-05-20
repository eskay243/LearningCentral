import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const Profile = () => {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    profileImageUrl: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get enrolled courses for this user
  const { data: enrolledCourses = [] } = useQuery({
    queryKey: ["/api/enrollments"],
    enabled: !!user,
  });

  React.useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: user.bio || "",
        profileImageUrl: user.profileImageUrl || ""
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const response = await apiRequest(
        "PATCH", 
        `/api/users/${user.id}`, 
        profileData
      );
      
      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile information has been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setIsEditing(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/4 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Available</CardTitle>
            <CardDescription>You need to be logged in to view your profile.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          {user.role === "affiliate" && <TabsTrigger value="affiliate">Affiliate Dashboard</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>View and manage your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profileData.profileImageUrl} alt={profileData.firstName || "User"} />
                      <AvatarFallback>
                        {profileData.firstName ? profileData.firstName.charAt(0) : "U"}
                        {profileData.lastName ? profileData.lastName.charAt(0) : ""}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="profileImageUrl">Profile Image URL</Label>
                        <Input 
                          type="text"
                          id="profileImageUrl"
                          name="profileImageUrl"
                          value={profileData.profileImageUrl}
                          onChange={handleInputChange}
                          placeholder="https://example.com/your-image.jpg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleInputChange}
                        placeholder="Your first name"
                      />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleInputChange}
                        placeholder="Your last name"
                      />
                    </div>
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio"
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.profileImageUrl} alt={user.firstName || "User"} />
                      <AvatarFallback>
                        {user.firstName ? user.firstName.charAt(0) : "U"}
                        {user.lastName ? user.lastName.charAt(0) : ""}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <Badge className="mt-1">{user.role}</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">About Me</h4>
                    <p className="text-sm text-muted-foreground">
                      {user.bio || "No bio provided. Click Edit Profile to add one."}
                    </p>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>Courses you have enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              {enrolledCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrolledCourses.map((enrollment: any) => (
                    <Card key={enrollment.id} className="overflow-hidden">
                      <div className="h-40 bg-muted relative">
                        {enrollment.course.imageUrl ? (
                          <img 
                            src={enrollment.course.imageUrl} 
                            alt={enrollment.course.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-muted-foreground">No image</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <h4 className="text-white font-medium truncate">{enrollment.course.title}</h4>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Progress: {enrollment.progress}%</span>
                          <Button size="sm" variant="outline" onClick={() => window.location.href = `/course/${enrollment.course.id}`}>
                            Continue
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
                  <Button onClick={() => window.location.href = "/courses"}>Browse Courses</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === "affiliate" && (
          <TabsContent value="affiliate">
            <Card>
              <CardHeader>
                <CardTitle>Affiliate Dashboard</CardTitle>
                <CardDescription>Track your referrals and commissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md mb-6">
                  <div className="mb-2">
                    <strong>Your Referral Code:</strong>
                  </div>
                  <div className="flex">
                    <Input 
                      readOnly 
                      value={user.affiliateCode || "No affiliate code assigned"}
                      className="bg-background"
                    />
                    <Button 
                      className="ml-2"
                      onClick={() => {
                        if (user.affiliateCode) {
                          navigator.clipboard.writeText(user.affiliateCode);
                          toast({
                            title: "Copied!",
                            description: "Affiliate code copied to clipboard",
                          });
                        }
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this code with potential students and earn commission when they enroll in courses.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-sm text-muted-foreground">Total Referrals</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">₦0</div>
                        <p className="text-sm text-muted-foreground">Earned Commission</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">₦0</div>
                        <p className="text-sm text-muted-foreground">Pending Commission</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <h3 className="text-lg font-medium mb-4">Recent Commissions</h3>
                <div className="border rounded-md">
                  <div className="px-4 py-3 bg-muted text-sm font-medium grid grid-cols-4">
                    <div>Student</div>
                    <div>Course</div>
                    <div>Amount</div>
                    <div>Date</div>
                  </div>
                  <div className="p-4 text-center text-muted-foreground">
                    No commission records found.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Profile;