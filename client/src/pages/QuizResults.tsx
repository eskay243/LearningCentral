import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trophy,
  Target,
  ArrowLeft,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

interface QuizResult {
  id: number;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
  completedAt: string;
  status: string;
  gradedAnswers: Array<{
    questionId: number;
    answer: string;
    isCorrect: boolean;
    pointsEarned: number;
    maxPoints: number;
    questionText: string;
    correctAnswer: string;
    explanation?: string;
  }>;
  quiz: {
    id: number;
    title: string;
    description: string;
    passingScore: number;
    attempts: number;
  };
}

export default function QuizResults() {
  const { attemptId } = useParams();
  const [, navigate] = useLocation();

  // Fetch quiz results
  const { data: result, isLoading, error } = useQuery({
    queryKey: [`/api/quiz-attempts/${attemptId}/results`],
    enabled: !!attemptId
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceMessage = (percentage: number, passingScore: number) => {
    if (percentage >= passingScore) {
      if (percentage >= 90) return "Excellent work! Outstanding performance.";
      if (percentage >= 80) return "Great job! You performed very well.";
      return "Good work! You passed the quiz.";
    }
    return "You didn't reach the passing score. Consider reviewing the material and trying again.";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Results Not Found</h2>
            <p className="text-muted-foreground mb-4">Unable to load quiz results.</p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPassing = result.percentage >= result.quiz.passingScore;
  const correctCount = result.gradedAnswers.filter(a => a.isCorrect).length;
  const totalQuestions = result.gradedAnswers.length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Results Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isPassing ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              Quiz Results: {result.quiz.title}
            </CardTitle>
            <Badge variant={isPassing ? "default" : "destructive"}>
              {isPassing ? "Passed" : "Failed"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getPerformanceColor(result.percentage)}`}>
                {Math.round(result.percentage)}%
              </div>
              <p className="text-sm text-muted-foreground">Final Score</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-semibold">
                {result.score}/{result.maxScore}
              </div>
              <p className="text-sm text-muted-foreground">Points Earned</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-semibold">
                {correctCount}/{totalQuestions}
              </div>
              <p className="text-sm text-muted-foreground">Correct Answers</p>
            </div>

            <div className="text-center">
              <div className="text-lg font-medium flex items-center justify-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(result.timeSpent)}
              </div>
              <p className="text-sm text-muted-foreground">Time Taken</p>
            </div>
          </div>

          <Progress value={result.percentage} className="h-3" />

          <div className="text-center">
            <p className={`text-lg font-medium ${getPerformanceColor(result.percentage)}`}>
              {getPerformanceMessage(result.percentage, result.quiz.passingScore)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Passing score: {result.quiz.passingScore}% • 
              Completed on {new Date(result.completedAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Question-by-Question Review */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Question Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.gradedAnswers.map((answer, index) => (
            <div key={answer.questionId} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      Question {index + 1}
                    </Badge>
                    {answer.isCorrect ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {answer.pointsEarned}/{answer.maxPoints} points
                    </span>
                  </div>
                  <p className="font-medium mb-2">{answer.questionText}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Your Answer:</p>
                  <p className={`text-sm ${answer.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {answer.answer || 'No answer provided'}
                  </p>
                </div>

                {!answer.isCorrect && answer.correctAnswer && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Correct Answer:</p>
                    <p className="text-sm text-green-700">{answer.correctAnswer}</p>
                  </div>
                )}

                {answer.explanation && (
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Explanation:</p>
                    <p className="text-sm">{answer.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Strengths</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {correctCount > totalQuestions * 0.8 && (
                  <li>• Excellent overall understanding</li>
                )}
                {result.timeSpent < 300 && (
                  <li>• Efficient time management</li>
                )}
                {correctCount > 0 && (
                  <li>• Correctly answered {correctCount} questions</li>
                )}
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Areas for Improvement</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {!isPassing && (
                  <li>• Review material to reach passing score</li>
                )}
                {totalQuestions - correctCount > 0 && (
                  <li>• Focus on {totalQuestions - correctCount} missed questions</li>
                )}
                {result.timeSpent > 1800 && (
                  <li>• Consider reviewing for faster completion</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>

            <div className="flex gap-3">
              {result.quiz.attempts > 1 && !isPassing && (
                <Button
                  onClick={() => navigate(`/quiz/${result.quiz.id}/take`)}
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Quiz
                </Button>
              )}
              
              <Button
                onClick={() => navigate(`/courses/${result.quiz.courseId || ''}`)}
              >
                Continue Learning
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}