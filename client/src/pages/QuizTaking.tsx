import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  FileText,
  ArrowLeft,
  ArrowRight,
  Flag,
  Timer,
  Award,
  Send
} from "lucide-react";

export default function QuizTaking() {
  const [, params] = useRoute("/quiz/:id");
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quizId = params?.id;

  // Fetch quiz details
  const { data: quiz, isLoading } = useQuery({
    queryKey: ["/api/assessments", quizId],
    enabled: !!quizId,
  });

  // Fetch quiz questions
  const { data: questions = [] } = useQuery({
    queryKey: ["/api/assessments", quizId, "questions"],
    enabled: !!quizId && quizStarted,
  });

  // Submit quiz attempt mutation
  const submitQuizMutation = useMutation({
    mutationFn: async (submissionData: any) => {
      const response = await fetch(`/api/assessments/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });
      if (!response.ok) throw new Error("Failed to submit quiz");
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({
        title: "Quiz submitted successfully! 🎉",
        description: `You scored ${result.score}/${result.totalPoints} points.`,
      });
      // Redirect to results page or back to course
      window.location.href = `/quiz/${quizId}/results`;
    },
    onError: () => {
      toast({
        title: "Submission failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Timer effect
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && quizStarted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleSubmitQuiz(true); // Auto-submit when time runs out
    }
  }, [timeRemaining, quizStarted]);

  const startQuiz = () => {
    setQuizStarted(true);
    if (quiz?.timeLimit) {
      setTimeRemaining(quiz.timeLimit * 60); // Convert minutes to seconds
    }
  };

  const handleAnswerChange = (questionId: number, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleFlag = (questionIndex: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  const handleSubmitQuiz = (autoSubmit = false) => {
    if (!autoSubmit) {
      const unansweredCount = questions.length - Object.keys(answers).length;
      if (unansweredCount > 0) {
        if (!confirm(`You have ${unansweredCount} unanswered questions. Submit anyway?`)) {
          return;
        }
      }
    }

    setIsSubmitting(true);
    const submissionData = {
      answers,
      timeSpent: quiz?.timeLimit ? (quiz.timeLimit * 60 - (timeRemaining || 0)) : null,
      isAutoSubmit: autoSubmit,
    };
    submitQuizMutation.mutate(submissionData);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestionInput = (question: any) => {
    const questionId = question.id;
    const currentAnswer = answers[questionId];

    switch (question.type) {
      case "multiple_choice":
        return (
          <RadioGroup
            value={currentAnswer?.toString() || ""}
            onValueChange={(value) => handleAnswerChange(questionId, value)}
            className="space-y-3"
          >
            {question.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "multiple_select":
        return (
          <div className="space-y-3">
            {question.options?.map((option: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`option-${index}`}
                  checked={currentAnswer?.includes(index) || false}
                  onCheckedChange={(checked) => {
                    const newAnswer = currentAnswer || [];
                    if (checked) {
                      handleAnswerChange(questionId, [...newAnswer, index]);
                    } else {
                      handleAnswerChange(questionId, newAnswer.filter((i: number) => i !== index));
                    }
                  }}
                />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      case "short_answer":
      case "essay":
        return (
          <Textarea
            placeholder="Enter your answer..."
            value={currentAnswer || ""}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            className={question.type === "essay" ? "min-h-[200px]" : "min-h-[100px]"}
          />
        );

      case "true_false":
        return (
          <RadioGroup
            value={currentAnswer?.toString() || ""}
            onValueChange={(value) => handleAnswerChange(questionId, value === "true")}
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

      default:
        return <div className="text-gray-500">Unsupported question type</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Quiz not found</h2>
            <p className="text-gray-600 mb-4">The quiz you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            <CardDescription className="text-lg">{quiz.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="font-semibold">{quiz.totalPoints}</div>
                <div className="text-sm text-gray-600">Total Points</div>
              </div>
              
              {quiz.timeLimit && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Timer className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="font-semibold">{quiz.timeLimit} min</div>
                  <div className="text-sm text-gray-600">Time Limit</div>
                </div>
              )}
            </div>

            {quiz.instructions && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Instructions:</strong> {quiz.instructions}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold">Important Notes:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Make sure you have a stable internet connection</li>
                <li>• You can flag questions for review</li>
                <li>• Your progress is automatically saved</li>
                {quiz.timeLimit && <li>• The quiz will auto-submit when time runs out</li>}
                <li>• You can only submit the quiz once</li>
              </ul>
            </div>

            <Button 
              onClick={startQuiz} 
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No questions available</h2>
            <p className="text-gray-600">This quiz doesn't have any questions yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {timeRemaining !== null && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-semibold">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
          
          <Badge variant="outline">
            {answeredCount}/{questions.length} answered
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>Progress: {Math.round(progress)}%</span>
          <span>{questions.length - answeredCount} remaining</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Question Navigator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`
                      w-8 h-8 rounded text-xs font-semibold relative
                      ${index === currentQuestionIndex 
                        ? 'bg-purple-600 text-white' 
                        : answers[questions[index]?.id] 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-gray-100 text-gray-600 border'
                      }
                    `}
                  >
                    {index + 1}
                    {flaggedQuestions.has(index) && (
                      <Flag className="absolute -top-1 -right-1 h-3 w-3 text-orange-500" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-600 rounded"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-100 border rounded"></div>
                  <span>Not answered</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Question */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    Question {currentQuestionIndex + 1}
                  </CardTitle>
                  <div className="prose prose-sm max-w-none">
                    <p>{currentQuestion.question}</p>
                  </div>
                  {currentQuestion.points && (
                    <Badge variant="outline" className="mt-2">
                      {currentQuestion.points} points
                    </Badge>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFlag(currentQuestionIndex)}
                  className={flaggedQuestions.has(currentQuestionIndex) ? "text-orange-600" : ""}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  {flaggedQuestions.has(currentQuestionIndex) ? "Unflag" : "Flag"}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {renderQuestionInput(currentQuestion)}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <div className="flex gap-3">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <Button
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubmitQuiz()}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Submitting..." : "Submit Quiz"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}