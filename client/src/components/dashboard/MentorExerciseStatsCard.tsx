import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MentorExerciseStatsCardProps {
  courseId?: number;
}

type ExerciseStat = {
  id: number;
  title: string;
  module: string;
  language: string;
  difficulty: string;
  attempts: number;
  completions: number;
  averageAttempts: number;
  completionRate: number;
};

type ChartData = {
  name: string;
  completionRate: number;
  averageAttempts: number;
};

const MentorExerciseStatsCard = ({ courseId }: MentorExerciseStatsCardProps) => {
  const [currentTab, setCurrentTab] = useState("completion");
  const [sortField, setSortField] = useState<string>("completionRate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const { data: exerciseStats, isLoading } = useQuery<ExerciseStat[]>({
    queryKey: [courseId ? `/api/courses/${courseId}/exercise-stats` : '/api/exercises/stats'],
    enabled: true,
  });
  
  // Sort function for exercise stats
  const sortStats = (a: ExerciseStat, b: ExerciseStat) => {
    if (sortField === "completionRate") {
      return sortOrder === "desc" ? b.completionRate - a.completionRate : a.completionRate - b.completionRate;
    } else if (sortField === "attempts") {
      return sortOrder === "desc" ? b.attempts - a.attempts : a.attempts - b.attempts;
    } else if (sortField === "completions") {
      return sortOrder === "desc" ? b.completions - a.completions : a.completions - b.completions;
    } else if (sortField === "averageAttempts") {
      return sortOrder === "desc" ? b.averageAttempts - a.averageAttempts : a.averageAttempts - b.averageAttempts;
    }
    return 0;
  };
  
  // Toggle sort order and field
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };
  
  // Prepare data for chart
  const prepareChartData = (): ChartData[] => {
    if (!exerciseStats) return [];
    
    const chartData: Record<string, ChartData> = {};
    
    exerciseStats.forEach(stat => {
      if (!chartData[stat.difficulty]) {
        chartData[stat.difficulty] = {
          name: stat.difficulty,
          completionRate: 0,
          averageAttempts: 0,
        };
      }
      
      chartData[stat.difficulty].completionRate += stat.completionRate;
      chartData[stat.difficulty].averageAttempts += stat.averageAttempts;
    });
    
    // Calculate averages
    Object.keys(chartData).forEach(difficulty => {
      const difficultyStats = exerciseStats.filter(stat => stat.difficulty === difficulty);
      chartData[difficulty].completionRate = chartData[difficulty].completionRate / difficultyStats.length;
      chartData[difficulty].averageAttempts = chartData[difficulty].averageAttempts / difficultyStats.length;
    });
    
    return Object.values(chartData);
  };
  
  // Mock data if query returns empty
  const mockStats: ExerciseStat[] = [
    {
      id: 1,
      title: "JavaScript Array Methods",
      module: "JavaScript Fundamentals",
      language: "javascript",
      difficulty: "Beginner",
      attempts: 124,
      completions: 98,
      averageAttempts: 2.3,
      completionRate: 79,
    },
    {
      id: 2,
      title: "Async/Await Functions",
      module: "Advanced JavaScript",
      language: "javascript",
      difficulty: "Intermediate",
      attempts: 87,
      completions: 56,
      averageAttempts: 3.2,
      completionRate: 64,
    },
    {
      id: 3,
      title: "React Hooks Implementation",
      module: "React Basics",
      language: "javascript",
      difficulty: "Advanced",
      attempts: 75,
      completions: 38,
      averageAttempts: 4.7,
      completionRate: 51,
    },
    {
      id: 4,
      title: "Python List Comprehensions",
      module: "Python Basics",
      language: "python",
      difficulty: "Intermediate",
      attempts: 92,
      completions: 73,
      averageAttempts: 2.1,
      completionRate: 79,
    },
    {
      id: 5,
      title: "SQL Joins Practice",
      module: "SQL Basics",
      language: "sql",
      difficulty: "Beginner",
      attempts: 116,
      completions: 96,
      averageAttempts: 1.8,
      completionRate: 83,
    },
  ];
  
  const stats = exerciseStats || mockStats;
  const sortedStats = [...stats].sort(sortStats);
  const chartData = prepareChartData();
  
  const getColorByDifficulty = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return "#10b981"; // green
      case 'intermediate':
        return "#f59e0b"; // amber
      case 'advanced':
        return "#ef4444"; // red
      default:
        return "#3b82f6"; // blue
    }
  };
  
  const getLanguageIcon = (language: string) => {
    switch (language.toLowerCase()) {
      case 'javascript':
        return 'ri-javascript-line';
      case 'python':
        return 'ri-python-line';
      case 'java':
        return 'ri-java-line';
      case 'sql':
        return 'ri-database-2-line';
      default:
        return 'ri-code-line';
    }
  };
  
  if (isLoading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader className="bg-gray-100 h-20" />
        <CardContent className="space-y-4 p-6">
          <div className="h-4 bg-gray-100 rounded w-3/4 mt-4"></div>
          <div className="h-60 bg-gray-100 rounded"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercise Performance Analytics</CardTitle>
        <CardDescription>
          Track student engagement and success with your interactive exercises
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="completion">Completion Rates</TabsTrigger>
            <TabsTrigger value="table">Exercise Stats</TabsTrigger>
            <TabsTrigger value="chart">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="completion">
            <div className="space-y-4">
              <div className="text-sm text-gray-500 mb-2">
                Overall completion rates for exercises by difficulty
              </div>
              
              {sortedStats.slice(0, 5).map((stat) => (
                <div key={stat.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{stat.title}</div>
                      <div className="text-xs text-gray-500">{stat.module}</div>
                    </div>
                    <Badge variant="outline">
                      <i className={`${getLanguageIcon(stat.language)} mr-1`}></i>
                      {stat.language}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div>
                      <Badge variant="outline" style={{color: getColorByDifficulty(stat.difficulty)}}>
                        {stat.difficulty}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">{stat.completionRate}%</span> completion rate
                    </div>
                  </div>
                  
                  <Progress 
                    value={stat.completionRate} 
                    className="h-2"
                    style={{backgroundColor: '#e5e7eb'}} // light gray background
                    indicatorStyle={{backgroundColor: getColorByDifficulty(stat.difficulty)}}
                  />
                </div>
              ))}
              
              <div className="text-center pt-4">
                <Link href={`/courses/${courseId}/exercises`}>
                  <Button variant="outline">View All Exercises</Button>
                </Link>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="table">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-xs uppercase text-gray-500">
                    <th className="py-3 px-2 font-semibold">Exercise</th>
                    <th className="py-3 px-2 font-semibold cursor-pointer" onClick={() => toggleSort("attempts")}>
                      Attempts {sortField === "attempts" && (sortOrder === "desc" ? "↓" : "↑")}
                    </th>
                    <th className="py-3 px-2 font-semibold cursor-pointer" onClick={() => toggleSort("completions")}>
                      Completions {sortField === "completions" && (sortOrder === "desc" ? "↓" : "↑")}
                    </th>
                    <th className="py-3 px-2 font-semibold cursor-pointer" onClick={() => toggleSort("averageAttempts")}>
                      Avg. Attempts {sortField === "averageAttempts" && (sortOrder === "desc" ? "↓" : "↑")}
                    </th>
                    <th className="py-3 px-2 font-semibold cursor-pointer" onClick={() => toggleSort("completionRate")}>
                      Completion % {sortField === "completionRate" && (sortOrder === "desc" ? "↓" : "↑")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStats.map((stat) => (
                    <tr key={stat.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="font-medium">{stat.title}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <i className={`${getLanguageIcon(stat.language)} mr-1`}></i>
                            {stat.language}
                          </Badge>
                          <Badge variant="outline" className="text-xs" style={{color: getColorByDifficulty(stat.difficulty)}}>
                            {stat.difficulty}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-2">{stat.attempts}</td>
                      <td className="py-3 px-2">{stat.completions}</td>
                      <td className="py-3 px-2">{stat.averageAttempts.toFixed(1)}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center">
                          <span className="mr-2">{stat.completionRate}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${stat.completionRate}%`,
                                backgroundColor: getColorByDifficulty(stat.difficulty)
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="chart">
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-medium mb-3">Performance by Difficulty Level</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="completionRate" name="Completion Rate (%)" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="averageAttempts" name="Avg. Attempts" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="text-center">
                <Link href={`/analytics?courseId=${courseId}&view=exercises`}>
                  <Button>View Detailed Analytics</Button>
                </Link>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MentorExerciseStatsCard;