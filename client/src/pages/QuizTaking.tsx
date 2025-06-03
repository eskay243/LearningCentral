import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Save,
  Send,
  Timer
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  questionText: string;
  questionType: string;
  options: any[];
  points: number;
  orderIndex: number;
}

interface QuizData {
  id: number;
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  attempts: number;
}

interface QuizAttempt {
  id: number;
  startedAt: string;
  timeSpent: number;
  status: string;
}

export default function QuizTaking() {
  const { quizId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Fetch quiz data
  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}`],
    enabled: !!quizId
  });

  // Fetch quiz questions
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: [`/api/quizzes/${quizId}/questions`],
    enabled: !!quizId && hasStarted
  });

  // Start quiz attempt mutation
  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/quiz-attempts/start', {
        quizId: Number(quizId)
      });
      return response.json();
    },
    onSuccess: (attempt) => {
      setAttemptId(attempt.id);
      setHasStarted(true);
      if (quiz?.timeLimit) {
        setTimeRemaining(quiz.timeLimit * 60); // Convert minutes to seconds
      }
      toast({
        title: "Quiz Started",
        description: "Good luck! Remember to save your progress regularly."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start quiz",
        variant: "destructive"
      });
    }
  });

  // Save answer mutation
  const saveAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: string }) => {
      const response = await apiRequest('POST', '/api/quiz-attempts/save-answer', {
        attemptId,
        questionId,
        answer
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Answer Saved",
        description: "Your answer has been saved automatically."
      });
    }
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/quiz-attempts/submit', {
        attemptId,
        answers
      });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Quiz Submitted",
        description: `Your quiz has been submitted successfully. Score: ${result.percentage}%`
      });
      navigate(`/quiz-results/${attemptId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit quiz",
        variant: "destructive"
      });
    }
  });

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Auto-submit when time runs out
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Auto-save answers
  useEffect(() => {
    if (!attemptId || !questions) return;

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion?.id];

    if (currentQuestion && currentAnswer) {
      const timeoutId = setTimeout(() => {
        saveAnswerMutation.mutate({
          questionId: currentQuestion.id,
          answer: currentAnswer
        });
      }, 2000); // Save after 2 seconds of no changes

      return () => clearTimeout(timeoutId);
    }
  }, [answers, currentQuestionIndex, attemptId, questions]);

  const handleStartQuiz = () => {
    startAttemptMutation.mutate();
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (questions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!attemptId) return;
    setIsSubmitting(true);
    submitQuizMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: QuizQuestion) => {
    const currentAnswer = answers[question.id] || '';

    switch (question.questionType) {
      case 'multiple_choice':
        return (
          <RadioGroup 
            value={currentAnswer} 
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className="space-y-3"
          >
            {question.options?.map((option: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value || option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option.text || option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true_false':
        return (
          <RadioGroup 
            value={currentAnswer} 
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        );

      case 'short_answer':
        return (
          <Input
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full"
          />
        );

      case 'essay':
        return (
          <Textarea
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Write your answer here..."
            className="w-full min-h-[200px]"
          />
        );

      default:
        return (
          <Input
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            className="w-full"
          />
        );
    }
  };

  if (quizLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Quiz Not Found</h2>
            <p className="text-muted-foreground mb-4">The quiz you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              {quiz.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose max-w-none">
              <p className="text-muted-foreground">{quiz.description}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quiz.timeLimit && (
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Time Limit</p>
                    <p className="text-sm text-muted-foreground">{quiz.timeLimit} minutes</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Passing Score</p>
                  <p className="text-sm text-muted-foreground">{quiz.passingScore}%</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Attempts Allowed</p>
                  <p className="text-sm text-muted-foreground">{quiz.attempts || 'Unlimited'}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Instructions</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Read each question carefully before answering</li>
                <li>• Your answers are saved automatically as you type</li>
                <li>• You can navigate between questions using the navigation buttons</li>
                <li>• Make sure to submit your quiz before the time limit expires</li>
                {quiz.timeLimit && <li>• The quiz will auto-submit when time runs out</li>}
              </ul>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleStartQuiz}
                disabled={startAttemptMutation.isPending}
                className="flex-1"
              >
                {startAttemptMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Starting Quiz...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Start Quiz
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const currentQuestion = questions?.[currentQuestionIndex];
  const progress = questions ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = questions ? questions.filter(q => answers[q.id]).length : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Quiz Header */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            {timeRemaining !== null && (
              <Badge variant={timeRemaining < 300 ? "destructive" : "secondary"} className="text-lg px-3 py-1">
                <Clock className="h-4 w-4 mr-2" />
                {formatTime(timeRemaining)}
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestionIndex + 1} of {questions?.length || 0}</span>
              <span>{answeredCount} answered</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      {currentQuestion && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">
                Question {currentQuestionIndex + 1}
              </CardTitle>
              <Badge variant="outline">
                {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose max-w-none">
              <p className="text-base">{currentQuestion.questionText}</p>
            </div>
            
            {renderQuestion(currentQuestion)}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (currentQuestion && answers[currentQuestion.id]) {
                    saveAnswerMutation.mutate({
                      questionId: currentQuestion.id,
                      answer: answers[currentQuestion.id]
                    });
                  }
                }}
                disabled={saveAnswerMutation.isPending || !currentQuestion || !answers[currentQuestion.id]}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Answer
              </Button>

              {currentQuestionIndex === (questions?.length || 0) - 1 ? (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting || submitQuizMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting || submitQuizMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Quiz
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex >= (questions?.length || 0) - 1}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Navigator */}
      {questions && questions.length > 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Question Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {questions.map((question, index) => (
                <Button
                  key={question.id}
                  variant={index === currentQuestionIndex ? "default" : answers[question.id] ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setCurrentQuestionIndex(index)}
                  className="aspect-square p-0"
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}