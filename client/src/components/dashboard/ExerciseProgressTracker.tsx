import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import useAuth from "@/hooks/useAuth";

interface ExerciseProgressProps {
  userId?: string;
}

type ExerciseProgressData = {
  total: number;
  completed: number;
  inProgress: number;
  totalByDifficulty: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  completedByDifficulty: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  recentExercises: {
    id: number;
    title: string;
    difficulty: string;
    language: string;
    progress: number;
    courseId: number;
    moduleId: number;
    lessonId?: number;
    lastAttempted: string;
  }[];
}

const ExerciseProgressTracker = ({ userId }: ExerciseProgressProps) => {
  const { user } = useAuth();
  const currentUserId = userId || (user?.id as string);
  
  const { data: progress, isLoading } = useQuery<ExerciseProgressData>({
    queryKey: [`/api/users/${currentUserId}/exercise-progress`],
    enabled: !!currentUserId,
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
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
      case 'csharp':
        return 'ri-code-box-line';
      case 'cpp':
        return 'ri-code-s-slash-line';
      default:
        return 'ri-code-line';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full h-96 animate-pulse">
        <CardHeader className="bg-gray-100 h-20" />
        <CardContent className="space-y-4 p-6">
          <div className="h-4 bg-gray-100 rounded w-3/4 mt-4"></div>
          <div className="h-8 bg-gray-100 rounded"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exercise Progress</CardTitle>
          <CardDescription>Track your coding exercise progress</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 mb-4">No exercise data available yet.</p>
          <Link href="/interactive-learning">
            <Button>Start Practicing</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const completionPercentage = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercise Progress</CardTitle>
        <CardDescription>Track your coding exercise progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall progress */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">
              Overall Completion ({progress.completed}/{progress.total})
            </span>
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {/* Progress by difficulty */}
        <div>
          <h3 className="text-sm font-medium mb-3">Progress by Difficulty</h3>
          <div className="space-y-3">
            {Object.entries(progress.totalByDifficulty).map(([difficulty, total]) => {
              const completed = progress.completedByDifficulty[difficulty as keyof typeof progress.completedByDifficulty] || 0;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <div key={difficulty}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs capitalize">{difficulty} ({completed}/{total})</span>
                    <span className="text-xs">{percent}%</span>
                  </div>
                  <Progress value={percent} className={`h-1.5 ${getDifficultyColor(difficulty)}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent exercises */}
        <div>
          <h3 className="text-sm font-medium mb-3">Recent Exercises</h3>
          <div className="space-y-3">
            {progress.recentExercises.length > 0 ? (
              progress.recentExercises.map((exercise) => (
                <div key={exercise.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-medium">{exercise.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <i className={`${getLanguageIcon(exercise.language)} mr-1`}></i>
                          {exercise.language}
                        </Badge>
                        <Badge variant="outline" className={`text-xs`}>
                          {exercise.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(exercise.lastAttempted).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Progress</span>
                      <span className="text-xs">{exercise.progress}%</span>
                    </div>
                    <Progress value={exercise.progress} className="h-1.5" />
                  </div>
                  <div className="mt-3 text-right">
                    <Link href={`/courses/${exercise.courseId}/modules/${exercise.moduleId}/lessons/${exercise.lessonId || 0}/exercises/${exercise.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        {exercise.progress >= 100 ? "Review" : "Continue"}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-gray-500 text-sm">
                No recent exercises
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseProgressTracker;