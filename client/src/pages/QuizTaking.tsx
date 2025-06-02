import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizAttempt {
  id: number;
  quizId: number;
  userId: string;
  answers: Record<string, number>;
  score: number;
  completedAt: string | null;
  startedAt: string;
  timeSpent: number;
}

const QuizTaking = () => {
  const { id: quizId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);

  // Fetch quiz details
  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !!quizId,
  });

  // Check for existing attempt
  const { data: existingAttempt } = useQuery({
    queryKey: [`/api/quiz-attempts/user/${user?.id}/${quizId}`],
    enabled: !!quizId && !!user,
  });

  // Start quiz attempt mutation
  const startQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/quiz-attempts", {
        quizId: parseInt(quizId!),
      });
      return response.json();
    },
    onSuccess: (attempt: QuizAttempt) => {
      setAttemptId(attempt.id);
      setQuizStarted(true);
      if (quiz?.timeLimit) {
        setTimeRemaining(quiz.timeLimit * 60); // Convert minutes to seconds
      }
      toast({
        title: "Quiz Started",
        description: "Good luck! Answer all questions to complete the quiz.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit quiz attempt mutation
  const submitQuizMutation = useMutation({
    mutationFn: async (submissionData: { answers: Record<string, number>; timeSpent: number }) => {
      const response = await apiRequest("PUT", `/api/quiz-attempts/${attemptId}`, submissionData);
      return response.json();
    },
    onSuccess: (result) => {
      setShowResults(true);
      queryClient.invalidateQueries({ queryKey: [`/api/quiz-attempts/user/${user?.id}/${quizId}`] });
      toast({
        title: "Quiz Completed",
        description: `You scored ${result.score}/${quiz?.questions?.length || 0}!`,
      });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && quizStarted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleSubmitQuiz();
    }
  }, [timeRemaining, quizStarted]);

  const handleStartQuiz = () => {
    startQuizMutation.mutate();
  };

  const handleAnswerChange = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    const startTime = Date.now() - (quiz?.timeLimit ? (quiz.timeLimit * 60 - (timeRemaining || 0)) * 1000 : 0);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    submitQuizMutation.mutate({
      answers,
      timeSpent
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAnsweredQuestionsCount = () => {
    return Object.keys(answers).length;
  };

  const currentQuestion = quiz?.questions?.[currentQuestionIndex];
  const progress = quiz?.questions?.length ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0;

  if (quizLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Quiz Not Found</h3>
            <p className="text-gray-500 text-center mb-4">
              The quiz you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => setLocation("/assessments")}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show results if quiz is already completed
  if (existingAttempt && existingAttempt.completedAt && !showResults) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Quiz Completed
            </CardTitle>
            <CardDescription>You have already completed this quiz.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {existingAttempt.score}/{quiz.questions?.length || 0}
                  </div>
                  <div className="text-sm text-gray-500">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((existingAttempt.score / (quiz.questions?.length || 1)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-500">Percentage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatTime(existingAttempt.timeSpent || 0)}
                  </div>
                  <div className="text-sm text-gray-500">Time Spent</div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Completed on {new Date(existingAttempt.completedAt).toLocaleString()}
                </p>
                <Button onClick={() => setLocation("/assessments")}>
                  Back to Assessments
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz start screen
  if (!quizStarted && !showResults) {
    return (
      <div className="p-4 md:p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{quiz.title}</CardTitle>
            <CardDescription>{quiz.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-500" />
                  <span>Questions: {quiz.questions?.length || 0}</span>
                </div>
                {quiz.timeLimit && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span>Time Limit: {quiz.timeLimit} minutes</span>
                  </div>
                )}
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Instructions:
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• Read each question carefully before answering</li>
                  <li>• You can navigate between questions using the Previous/Next buttons</li>
                  <li>• Make sure to answer all questions before submitting</li>
                  {quiz.timeLimit && <li>• The quiz will auto-submit when time expires</li>}
                  <li>• You can only take this quiz once</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleStartQuiz}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={startQuizMutation.isPending}
                >
                  {startQuizMutation.isPending ? "Starting..." : "Start Quiz"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/assessments")}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz taking interface
  if (quizStarted && !showResults) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {/* Header with progress and timer */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            {timeRemaining !== null && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-500" />
                <span className={`font-mono font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Question {currentQuestionIndex + 1} of {quiz.questions?.length || 0}</span>
              <span>Answered: {getAnsweredQuestionsCount()}/{quiz.questions?.length || 0}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                Question {currentQuestionIndex + 1}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-lg">{currentQuestion.question}</p>
                
                <RadioGroup
                  value={answers[currentQuestion.id]?.toString() || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id.toString(), parseInt(value))}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-3">
            {currentQuestionIndex === (quiz.questions?.length || 0) - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                className="bg-green-600 hover:bg-green-700"
                disabled={submitQuizMutation.isPending}
              >
                {submitQuizMutation.isPending ? "Submitting..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === (quiz.questions?.length || 0) - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Results dialog
  return (
    <Dialog open={showResults} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Quiz Completed!
          </DialogTitle>
          <DialogDescription>
            Here are your results for "{quiz.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {submitQuizMutation.data?.score || 0}/{quiz.questions?.length || 0}
            </div>
            <div className="text-lg text-gray-500">
              {Math.round(((submitQuizMutation.data?.score || 0) / (quiz.questions?.length || 1)) * 100)}% Score
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getAnsweredQuestionsCount()}
              </div>
              <div className="text-sm text-gray-500">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatTime(submitQuizMutation.data?.timeSpent || 0)}
              </div>
              <div className="text-sm text-gray-500">Time Spent</div>
            </div>
          </div>

          <Button 
            onClick={() => setLocation("/assessments")} 
            className="w-full"
          >
            Back to Assessments
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizTaking;