import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@shared/schema";
import AssessmentAnalytics from "@/components/analytics/AssessmentAnalytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function Analytics() {
  const { user, isLoading } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("assessments");
  
  // Determine if the user is a mentor or admin
  const isMentorOrAdmin = user?.role === UserRole.MENTOR || user?.role === UserRole.ADMIN;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <Card className="mx-auto max-w-2xl mt-12">
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            Please log in to view your analytics
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-500">
          {isMentorOrAdmin 
            ? "Monitor student performance and course effectiveness" 
            : "Track your progress and performance on courses and assessments"}
        </p>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="assessments">Assessment Performance</TabsTrigger>
          <TabsTrigger value="courses">Course Progress</TabsTrigger>
          {isMentorOrAdmin && (
            <TabsTrigger value="students">Student Analytics</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="assessments" className="space-y-6">
          <AssessmentAnalytics isMentorView={isMentorOrAdmin} />
        </TabsContent>
        
        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Progress Analytics</CardTitle>
              <CardDescription>Track your learning journey across all enrolled courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center">
                <p className="text-gray-500">Course analytics will be available soon!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {isMentorOrAdmin && (
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Performance Analytics</CardTitle>
                <CardDescription>View detailed statistics about your students' performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center">
                  <p className="text-gray-500">Student analytics will be available soon!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}