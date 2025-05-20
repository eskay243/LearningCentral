import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Award,
  TrendingUp,
  Users,
  Book,
  Calendar,
  ChevronRight,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Define chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const COURSE_COLORS: {[key: string]: string} = {};

const CertificateAnalytics = () => {
  const { user, isAdmin, isMentor, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/api/login");
    } else if (!isLoading && isAuthenticated && !isAdmin && !isMentor) {
      setLocation("/dashboard");
    }
  }, [isLoading, isAuthenticated, isAdmin, isMentor, setLocation]);

  // Fetch certificate data
  const { data: certificates = [], isLoading: isLoadingCertificates } = useQuery({
    queryKey: ["/api/certificates/all"],
    enabled: isAuthenticated && (isAdmin || isMentor),
  });

  // Fetch courses data for reference
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses/basic"],
    enabled: isAuthenticated && (isAdmin || isMentor),
  });

  // Fetch students data for reference
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/users/students"],
    enabled: isAuthenticated && (isAdmin || isMentor),
  });

  // Process data for charts
  const calculateIssuanceOverTime = () => {
    // Group certificates by month
    const certificatesByMonth: { [key: string]: number } = {};
    
    certificates.forEach((cert: any) => {
      const date = new Date(cert.issuedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      certificatesByMonth[monthKey] = (certificatesByMonth[monthKey] || 0) + 1;
    });
    
    // Convert to array and sort by month
    return Object.entries(certificatesByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };
  
  const calculateCertificatesByCourse = () => {
    // Group certificates by course
    const certsByCoursesObj: { [key: string]: number } = {};
    
    certificates.forEach((cert: any) => {
      const courseTitle = cert.courseTitle || 'Unknown Course';
      certsByCoursesObj[courseTitle] = (certsByCoursesObj[courseTitle] || 0) + 1;
      
      // Assign a consistent color to each course
      if (!COURSE_COLORS[courseTitle]) {
        const existingCoursesCount = Object.keys(COURSE_COLORS).length;
        COURSE_COLORS[courseTitle] = COLORS[existingCoursesCount % COLORS.length];
      }
    });
    
    // Convert to array and sort by count
    return Object.entries(certsByCoursesObj)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };
  
  const calculateStatusDistribution = () => {
    let active = 0;
    let revoked = 0;
    
    certificates.forEach((cert: any) => {
      if (cert.status === 'revoked') {
        revoked++;
      } else {
        active++;
      }
    });
    
    return [
      { name: 'Active', value: active },
      { name: 'Revoked', value: revoked }
    ];
  };
  
  const calculateTopIssuers = () => {
    // Group certificates by issuer
    const issuerCounts: { [key: string]: number } = {};
    
    certificates.forEach((cert: any) => {
      if (cert.issuedBy) {
        const issuerName = students.find((s: any) => s.id === cert.issuedBy)?.firstName + ' ' + 
                          students.find((s: any) => s.id === cert.issuedBy)?.lastName || cert.issuedBy;
        issuerCounts[issuerName] = (issuerCounts[issuerName] || 0) + 1;
      }
    });
    
    // Convert to array and sort by count
    return Object.entries(issuerCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Get top 5
  };
  
  const calculateMonthlyIssuanceRate = () => {
    const issuanceByMonth: { [key: string]: number } = {};
    const months: string[] = [];
    
    // Get all unique months in the data
    certificates.forEach((cert: any) => {
      const date = new Date(cert.issuedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months.includes(monthKey)) {
        months.push(monthKey);
      }
    });
    
    // Sort months chronologically
    months.sort();
    
    // Calculate certificate count for each month
    months.forEach((month, index) => {
      const certsInMonth = certificates.filter((cert: any) => {
        const date = new Date(cert.issuedAt);
        const certMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return certMonth === month;
      }).length;
      
      // Calculate growth rate if not the first month
      if (index > 0) {
        const prevMonth = months[index - 1];
        const certsInPrevMonth = certificates.filter((cert: any) => {
          const date = new Date(cert.issuedAt);
          const certMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return certMonth === prevMonth;
        }).length;
        
        const growthRate = certsInPrevMonth === 0 
          ? 100 // If there were no certificates in the previous month, show 100% growth
          : Math.round(((certsInMonth - certsInPrevMonth) / certsInPrevMonth) * 100);
        
        issuanceByMonth[month] = growthRate;
      } else {
        issuanceByMonth[month] = 0; // No growth rate for the first month
      }
    });
    
    // Convert to array format
    return Object.entries(issuanceByMonth)
      .map(([month, rate]) => ({ month, rate }));
  };

  // Create data for charts
  const issuanceOverTime = calculateIssuanceOverTime();
  const certificatesByCourse = calculateCertificatesByCourse();
  const statusDistribution = calculateStatusDistribution();
  const topIssuers = calculateTopIssuers();
  const monthlyGrowthRate = calculateMonthlyIssuanceRate();

  // Helper function to format month labels
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${parseInt(month)}/${year.substring(2)}`;
  };
  
  // Calculate summary statistics
  const totalCertificates = certificates.length;
  const activeCertificates = certificates.filter((cert: any) => cert.status !== 'revoked').length;
  const totalCourses = certificatesByCourse.length;
  const mostCertifiedCourse = certificatesByCourse.length > 0 ? certificatesByCourse[0].name : 'None';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin && !isMentor) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have permission to access this page.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation("/dashboard")}>Return to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleExportData = () => {
    // Prepare the data to be exported as CSV
    const csvData = [
      ['Certificate ID', 'Student Name', 'Course', 'Issue Date', 'Status', 'Issued By'],
      ...certificates.map((cert: any) => [
        cert.id,
        cert.studentName,
        cert.courseTitle,
        new Date(cert.issuedAt).toLocaleDateString(),
        cert.status,
        cert.issuedBy ? 
          students.find((s: any) => s.id === cert.issuedBy)?.firstName + ' ' + 
          students.find((s: any) => s.id === cert.issuedBy)?.lastName || cert.issuedBy : 'System'
      ])
    ];
    
    // Convert the data to CSV format
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `certificate_data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    
    // Trigger the download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive analytics and insights on certificate issuance and management.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Certificates</p>
                  <h3 className="text-3xl font-bold mt-2">{totalCertificates}</h3>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Award className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <span className="text-green-500 font-medium">{activeCertificates} active</span> | {totalCertificates - activeCertificates} revoked
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Certified Courses</p>
                  <h3 className="text-3xl font-bold mt-2">{totalCourses}</h3>
                </div>
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Book className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <span className="text-purple-500 font-medium">Top: </span> {mostCertifiedCourse}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Certified Students</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {new Set(certificates.map((cert: any) => cert.userId)).size}
                  </h3>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <span className="text-blue-500 font-medium">
                  {Math.round((new Set(certificates.map((cert: any) => cert.userId)).size / (students.length || 1)) * 100)}%
                </span> of total students
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Latest Issuance</p>
                  <h3 className="text-3xl font-bold mt-2">
                    {certificates.length > 0 ? 
                      new Date(Math.max(...certificates.map((cert: any) => new Date(cert.issuedAt).getTime())))
                        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 
                      'N/A'}
                  </h3>
                </div>
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                {certificates.length > 0 && (
                  <span className="text-amber-500 font-medium">
                    {new Date(Math.max(...certificates.map((cert: any) => new Date(cert.issuedAt).getTime())))
                      .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Range Selector */}
        <div className="flex justify-between items-center">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
              <SelectItem value="quarter">Past Quarter</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={handleExportData}
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Course Analytics</TabsTrigger>
            <TabsTrigger value="students">Student Analytics</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Issuance Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Issuance Over Time</CardTitle>
                  <CardDescription>Monthly count of certificates issued</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {issuanceOverTime.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={issuanceOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tickFormatter={formatMonth}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [`${value} certificates`, 'Issued']}
                          labelFormatter={formatMonth}
                        />
                        <Legend />
                        <Bar dataKey="count" name="Certificates Issued" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Status Distribution</CardTitle>
                  <CardDescription>Active vs. revoked certificates</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {statusDistribution.some(item => item.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#4ade80' : '#f43f5e'} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} certificates`, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Certificates by Course */}
              <Card>
                <CardHeader>
                  <CardTitle>Certificates per Course</CardTitle>
                  <CardDescription>Distribution of certificates across courses</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {certificatesByCourse.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={certificatesByCourse}
                        margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={150}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar dataKey="value" name="Certificates">
                          {certificatesByCourse.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COURSE_COLORS[entry.name] || COLORS[0]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Top Issuing Admins/Mentors */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Certificate Issuers</CardTitle>
                  <CardDescription>Admins/mentors who issue the most certificates</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {topIssuers.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={topIssuers}
                        margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={150}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar dataKey="value" name="Certificates Issued" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Certification Rate</CardTitle>
                <CardDescription>Percentage of students receiving certificates</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {students.length > 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="relative w-64 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Certified', value: new Set(certificates.map((cert: any) => cert.userId)).size },
                              { name: 'Not Certified', value: students.length - new Set(certificates.map((cert: any) => cert.userId)).size }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell fill="#0088FE" />
                            <Cell fill="#DDDDDD" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-4xl font-bold text-primary">
                          {Math.round((new Set(certificates.map((cert: any) => cert.userId)).size / students.length) * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Certification Rate</div>
                      </div>
                    </div>
                    <div className="mt-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Out of {students.length} total students, {new Set(certificates.map((cert: any) => cert.userId)).size} have 
                        received at least one certificate.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No student data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Growth Rate</CardTitle>
                <CardDescription>Month-over-month percentage change in certificate issuance</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {monthlyGrowthRate.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyGrowthRate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={formatMonth}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Growth Rate']}
                        labelFormatter={formatMonth}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        name="Growth Rate" 
                        stroke="#ff7300" 
                        activeDot={{ r: 8 }}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Insufficient data for trend analysis
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CertificateAnalytics;