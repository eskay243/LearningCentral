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
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 space-y-8 max-w-7xl">
      <div className="mb-2">
        <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">Analytics Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          {isMentorOrAdmin 
            ? "Monitor student performance and course effectiveness" 
            : "Track your progress and performance on courses and assessments"}
        </p>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger value="assessments" className="font-medium">Assessment Performance</TabsTrigger>
          <TabsTrigger value="courses" className="font-medium">Course Progress</TabsTrigger>
          {isMentorOrAdmin && (
            <TabsTrigger value="students" className="font-medium">Student Analytics</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="assessments" className="space-y-6">
          <AssessmentAnalytics isMentorView={isMentorOrAdmin} />
        </TabsContent>
        
        <TabsContent value="courses" className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="text-xl text-blue-700 dark:text-blue-400">Course Progress Analytics</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Track your learning journey across all enrolled courses</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">Course analytics will be available soon!</p>
                <p className="text-slate-500 dark:text-slate-400">We're working on comprehensive course analytics to help you track your learning journey.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {isMentorOrAdmin && (
          <TabsContent value="students" className="space-y-6">
            <Card className="border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50 dark:from-slate-800 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="text-xl text-teal-700 dark:text-teal-400">Student Performance Analytics</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">View detailed statistics about your students' performance</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                  <div className="mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">Student analytics will be available soon!</p>
                  <p className="text-slate-500 dark:text-slate-400">We're developing detailed student performance metrics to help you better understand your class.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}