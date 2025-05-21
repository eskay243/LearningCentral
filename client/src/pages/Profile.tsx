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
  const { data: enrolledCourses = [] } = useQuery<any[]>({
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
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full grid grid-cols-2 sm:flex sm:w-auto gap-1 p-1">
          <TabsTrigger value="profile" className="text-xs sm:text-sm py-1.5">Profile Information</TabsTrigger>
          <TabsTrigger value="courses" className="text-xs sm:text-sm py-1.5">My Courses</TabsTrigger>
          {user.role === "affiliate" && <TabsTrigger value="affiliate" className="text-xs sm:text-sm py-1.5">Affiliate Dashboard</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <Card className="dark:bg-gray-800">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl dark:text-white">My Profile</CardTitle>
              <CardDescription className="dark:text-gray-300">View and manage your personal information</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 sm:mb-6">
                    <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                      <AvatarImage src={profileData.profileImageUrl} alt={profileData.firstName || "User"} />
                      <AvatarFallback>
                        {profileData.firstName ? profileData.firstName.charAt(0) : "U"}
                        {profileData.lastName ? profileData.lastName.charAt(0) : ""}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="grid w-full items-center gap-1">
                        <Label htmlFor="profileImageUrl" className="text-xs sm:text-sm dark:text-gray-200">Profile Image URL</Label>
                        <Input 
                          type="text"
                          id="profileImageUrl"
                          name="profileImageUrl"
                          value={profileData.profileImageUrl}
                          onChange={handleInputChange}
                          placeholder="https://example.com/your-image.jpg"
                          className="text-xs sm:text-sm h-8 sm:h-10 dark:bg-gray-700 dark:text-gray-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="grid w-full items-center gap-1">
                      <Label htmlFor="firstName" className="text-xs sm:text-sm dark:text-gray-200">First Name</Label>
                      <Input 
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={profileData.firstName}
                        onChange={handleInputChange}
                        placeholder="Your first name"
                        className="text-xs sm:text-sm h-8 sm:h-10 dark:bg-gray-700 dark:text-gray-200"
                      />
                    </div>
                    <div className="grid w-full items-center gap-1">
                      <Label htmlFor="lastName" className="text-xs sm:text-sm dark:text-gray-200">Last Name</Label>
                      <Input 
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={profileData.lastName}
                        onChange={handleInputChange}
                        placeholder="Your last name"
                        className="text-xs sm:text-sm h-8 sm:h-10 dark:bg-gray-700 dark:text-gray-200"
                      />
                    </div>
                  </div>

                  <div className="grid w-full items-center gap-1">
                    <Label htmlFor="bio" className="text-xs sm:text-sm dark:text-gray-200">Bio</Label>
                    <Textarea 
                      id="bio"
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself"
                      rows={4}
                      className="text-xs sm:text-sm min-h-[80px] dark:bg-gray-700 dark:text-gray-200"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-3 sm:mt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="text-xs sm:text-sm h-8 sm:h-10 dark:border-gray-600 dark:text-gray-200"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="text-xs sm:text-sm h-8 sm:h-10"
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                      <AvatarImage src={user.profileImageUrl} alt={user.firstName || "User"} />
                      <AvatarFallback>
                        {user.firstName ? user.firstName.charAt(0) : "U"}
                        {user.lastName ? user.lastName.charAt(0) : ""}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-base sm:text-xl font-semibold dark:text-white">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300">{user.email}</p>
                      <Badge className="mt-1 text-xs py-0 px-2 sm:text-sm sm:py-0.5 sm:px-2.5 dark:bg-gray-700 dark:text-gray-200">{user.role}</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm sm:text-base mb-1 sm:mb-2 dark:text-white">About Me</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300">
                      {user.bio || "No bio provided. Click Edit Profile to add one."}
                    </p>
                  </div>

                  <div className="flex justify-end mt-2 sm:mt-4">
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="text-xs sm:text-sm h-8 sm:h-10"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card className="dark:bg-gray-800">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl dark:text-white">My Courses</CardTitle>
              <CardDescription className="dark:text-gray-300">Courses you have enrolled in</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {enrolledCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {enrolledCourses.map((enrollment: any) => (
                    <Card key={enrollment.id} className="overflow-hidden dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      <div className="h-32 sm:h-40 bg-muted relative">
                        {enrollment.course.imageUrl ? (
                          <img 
                            src={enrollment.course.imageUrl} 
                            alt={enrollment.course.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full dark:bg-gray-600">
                            <span className="text-muted-foreground dark:text-gray-400 text-xs sm:text-sm">No image</span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 sm:p-4">
                          <h4 className="text-white font-medium text-xs sm:text-sm truncate">{enrollment.course.title}</h4>
                        </div>
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm dark:text-gray-200">Progress: {enrollment.progress}%</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => window.location.href = `/course/${enrollment.course.id}`}
                            className="h-7 sm:h-8 text-xs px-2 sm:px-3 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-600"
                          >
                            Continue
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-muted-foreground dark:text-gray-300 text-sm mb-3 sm:mb-4">You haven't enrolled in any courses yet.</p>
                  <Button 
                    onClick={() => window.location.href = "/courses"}
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  >
                    Browse Courses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === "affiliate" && (
          <TabsContent value="affiliate">
            <Card className="dark:bg-gray-800">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl dark:text-white">Affiliate Dashboard</CardTitle>
                <CardDescription className="dark:text-gray-300">Track your referrals and commissions</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="bg-muted dark:bg-gray-700 p-3 sm:p-4 rounded-md mb-4 sm:mb-6">
                  <div className="mb-1 sm:mb-2">
                    <strong className="text-xs sm:text-sm dark:text-white">Your Referral Code:</strong>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input 
                      readOnly 
                      value={user.affiliateCode || "No affiliate code assigned"}
                      className="bg-background dark:bg-gray-600 text-xs sm:text-sm h-8 sm:h-10 dark:text-gray-200"
                    />
                    <Button 
                      className="text-xs sm:text-sm h-8 sm:h-10 w-full sm:w-auto"
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
                  <p className="text-xs text-muted-foreground mt-2 dark:text-gray-300">
                    Share this code with potential students and earn commission when they enroll in courses.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <Card className="dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    <CardContent className="pt-4 sm:pt-6 p-3 sm:p-4">
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold dark:text-white">0</div>
                        <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300">Total Referrals</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    <CardContent className="pt-4 sm:pt-6 p-3 sm:p-4">
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold dark:text-white">₦0</div>
                        <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300">Earned Commission</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    <CardContent className="pt-4 sm:pt-6 p-3 sm:p-4">
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold dark:text-white">₦0</div>
                        <p className="text-xs sm:text-sm text-muted-foreground dark:text-gray-300">Pending Commission</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-4 dark:text-white">Recent Commissions</h3>
                <div className="border rounded-md dark:border-gray-600 overflow-hidden">
                  <div className="px-3 sm:px-4 py-2 sm:py-3 bg-muted dark:bg-gray-700 text-xs sm:text-sm font-medium grid grid-cols-4">
                    <div className="dark:text-gray-200">Student</div>
                    <div className="dark:text-gray-200">Course</div>
                    <div className="dark:text-gray-200">Amount</div>
                    <div className="dark:text-gray-200">Date</div>
                  </div>
                  <div className="p-3 sm:p-4 text-center text-muted-foreground dark:text-gray-300 text-xs sm:text-sm">
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