import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, Trophy, Clock, ArrowLeft, TrendingUp, Award } from "lucide-react";
import useAuth from "@/hooks/useAuth";

interface QuizAttempt {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  score: number;
  percentage: number;
  passed: boolean;
  submittedAt: string;
  timeSpent: number;
  answers: Array<{
    questionId: number;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    correct: boolean;
    points: number;
  }>;
}

interface QuizStats {
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  highestScore: number;
  lowestScore: number;
  averageTimeSpent: number;
}

export default function QuizResults() {
  const { quizId } = useParams() as { quizId: string };
  const { user, isMentor, isAdmin } = useAuth();

  // Fetch quiz details
  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !!quizId,
  });

  // Fetch quiz attempts for mentors/admins
  const { data: attempts = [], isLoading: attemptsLoading } = useQuery<QuizAttempt[]>({
    queryKey: [`/api/quizzes/${quizId}/attempts`],
    enabled: !!quizId && (isMentor || isAdmin),
  });

  // Calculate quiz statistics
  const stats: QuizStats = {
    totalAttempts: attempts.length,
    averageScore: attempts.length > 0 ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length : 0,
    passRate: attempts.length > 0 ? (attempts.filter(a => a.passed).length / attempts.length) * 100 : 0,
    highestScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0,
    lowestScore: attempts.length > 0 ? Math.min(...attempts.map(a => a.percentage)) : 0,
    averageTimeSpent: attempts.length > 0 ? attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / attempts.length : 0,
  };

  if (quizLoading || attemptsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Quiz not found</h3>
            <p className="text-gray-500 mb-4">The quiz you're looking for doesn't exist.</p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{quiz.title} - Results</h1>
          <p className="text-gray-600 mt-1">{quiz.description}</p>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              Students who took this quiz
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Overall performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Students who passed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageTimeSpent)}m</div>
            <p className="text-xs text-muted-foreground">
              Time to complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Tabs defaultValue="attempts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attempts">Student Attempts</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="attempts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Attempts</CardTitle>
              <CardDescription>
                Detailed view of all quiz attempts by students
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No attempts yet</h3>
                  <p className="text-gray-500">Students haven't taken this quiz yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                            {attempt.userEmail?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {attempt.userName || attempt.userEmail}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {new Date(attempt.submittedAt).toLocaleDateString()} at{' '}
                              {new Date(attempt.submittedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold">{attempt.percentage.toFixed(1)}%</div>
                          <Badge variant={attempt.passed ? "default" : "secondary"}>
                            {attempt.passed ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>Time: {attempt.timeSpent || 0}m</div>
                          <div>Score: {attempt.score}/{quiz.questions?.length || 0}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Performance breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Highest Score</span>
                    <span className="font-medium">{stats.highestScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.highestScore} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Score</span>
                    <span className="font-medium">{stats.averageScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.averageScore} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Lowest Score</span>
                    <span className="font-medium">{stats.lowestScore.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.lowestScore} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quiz Information</CardTitle>
                <CardDescription>Quiz settings and details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Passing Score</span>
                  <span className="font-medium">{quiz.passingScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Questions</span>
                  <span className="font-medium">{quiz.questions?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Time Limit</span>
                  <span className="font-medium">{quiz.timeLimit ? `${quiz.timeLimit} minutes` : "No limit"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Max Attempts</span>
                  <span className="font-medium">{quiz.maxAttempts || "Unlimited"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}