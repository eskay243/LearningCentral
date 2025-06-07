import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Send, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Flag,
  RotateCcw,
  Upload,
  Download,
  Code,
  Image as ImageIcon,
  Shuffle
} from "lucide-react";
import Editor from "@monaco-editor/react";

interface AdvancedQuiz {
  id: number;
  title: string;
  description: string;
  instructions: string;
  timeLimit: number;
  attempts: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showResults: boolean;
  passingScore: number;
  questionsPerAttempt: number;
  proctored: boolean;
}

interface QuizQuestion {
  id: number;
  questionType: string;
  questionText: string;
  questionHtml?: string;
  mediaUrl?: string;
  points: number;
  timeLimit?: number;
  options?: QuestionOption[];
  correctAnswers?: string[];
  blanks?: BlankField[];
  codeLanguage?: string;
  codeTemplate?: string;
  testCases?: TestCase[];
  matchingPairs?: MatchingPair[];
  orderItems?: OrderItem[];
  hotspots?: Hotspot[];
}

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

interface BlankField {
  id: string;
  position: number;
  correctAnswers: string[];
  caseSensitive: boolean;
}

interface TestCase {
  input: any;
  expectedOutput: any;
}

interface MatchingPair {
  leftId: string;
  leftText: string;
  rightId: string;
  rightText: string;
}

interface OrderItem {
  id: string;
  text: string;
  correctPosition: number;
}

interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isCorrect: boolean;
}

interface QuizAttempt {
  id: number;
  attemptNumber: number;
  startedAt: string;
  timeSpent: number;
  status: string;
  questionsAnswered: number;
  totalQuestions: number;
}

interface StudentAnswer {
  questionId: number;
  textAnswer?: string;
  selectedOptions?: string[];
  codeAnswer?: string;
  matchingAnswer?: { [key: string]: string };
  orderingAnswer?: string[];
  hotspotAnswer?: { x: number; y: number }[];
  fileUploads?: FileUpload[];
}

interface FileUpload {
  filename: string;
  url: string;
  size: number;
  type: string;
}

export default function AdvancedQuizTaking() {
  const { quizId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: StudentAnswer }>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [tabSwitches, setTabSwitches] = useState(0);
  const [startTime] = useState(Date.now());
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const autoSaveRef = useRef<NodeJS.Timeout>();

  // Fetch quiz data
  const { data: quiz, isLoading: quizLoading } = useQuery<AdvancedQuiz>({
    queryKey: [`/api/advanced-quizzes/${quizId}`],
    enabled: !!quizId,
  });

  // Fetch questions
  const { data: questions, isLoading: questionsLoading } = useQuery<QuizQuestion[]>({
    queryKey: [`/api/advanced-quizzes/${quizId}/questions`],
    enabled: !!quizId,
  });

  // Fetch or create attempt
  const { data: attempt } = useQuery<QuizAttempt>({
    queryKey: [`/api/advanced-quizzes/${quizId}/attempt`],
    enabled: !!quizId,
    onSuccess: (data) => {
      setAttemptId(data.id);
      setTimeSpent(data.timeSpent || 0);
    },
  });

  // Timer effect
  useEffect(() => {
    if (quiz?.timeLimit && attempt) {
      const totalTime = quiz.timeLimit * 60; // Convert to seconds
      setTimeRemaining(Math.max(0, totalTime - timeSpent));
      
      intervalRef.current = setInterval(() => {
        setTimeSpent(prev => {
          const newTime = prev + 1;
          setTimeRemaining(Math.max(0, totalTime - newTime));
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [quiz, attempt, timeSpent]);

  // Auto-save effect
  useEffect(() => {
    if (attemptId && Object.keys(answers).length > 0) {
      autoSaveRef.current = setTimeout(() => {
        autoSaveAnswers();
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [answers, attemptId]);

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && quiz?.proctored) {
        setTabSwitches(prev => prev + 1);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [quiz?.proctored]);

  // Time up effect
  useEffect(() => {
    if (timeRemaining === 0 && quiz?.timeLimit) {
      handleSubmit();
    }
  }, [timeRemaining, quiz?.timeLimit]);

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (answersToSave: { [key: number]: StudentAnswer }) => {
      const response = await apiRequest("POST", `/api/advanced-quiz-attempts/${attemptId}/save`, {
        answers: answersToSave,
        timeSpent,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsAutoSaving(false);
    },
    onError: () => {
      setIsAutoSaving(false);
    },
  });

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/advanced-quiz-attempts/${attemptId}/submit`, {
        answers,
        timeSpent,
        tabSwitches,
      });
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Quiz Submitted",
        description: `Your quiz has been submitted successfully. Score: ${result.percentage}%`,
      });
      setLocation(`/quiz-results/${attemptId}`);
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const autoSaveAnswers = useCallback(() => {
    if (attemptId && Object.keys(answers).length > 0) {
      setIsAutoSaving(true);
      autoSaveMutation.mutate(answers);
    }
  }, [attemptId, answers, autoSaveMutation]);

  const handleAnswerChange = (questionId: number, answer: Partial<StudentAnswer>) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        ...answer,
      },
    }));
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    submitMutation.mutate();
  };

  const toggleFlag = (questionId: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionId: number) => {
    if (answers[questionId]) {
      return 'answered';
    }
    if (flaggedQuestions.has(questionId)) {
      return 'flagged';
    }
    return 'unanswered';
  };

  const renderQuestion = (question: QuizQuestion) => {
    const answer = answers[question.id] || {};

    switch (question.questionType) {
      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <RadioGroup
              value={answer.selectedOptions?.[0] || ""}
              onValueChange={(value) => handleAnswerChange(question.id, { selectedOptions: [value] })}
            >
              {question.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'multiple_select':
        return (
          <div className="space-y-4">
            {question.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={answer.selectedOptions?.includes(option.id) || false}
                  onCheckedChange={(checked) => {
                    const currentOptions = answer.selectedOptions || [];
                    const newOptions = checked
                      ? [...currentOptions, option.id]
                      : currentOptions.filter(id => id !== option.id);
                    handleAnswerChange(question.id, { selectedOptions: newOptions });
                  }}
                />
                <Label htmlFor={option.id} className="cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-4">
            <RadioGroup
              value={answer.selectedOptions?.[0] || ""}
              onValueChange={(value) => handleAnswerChange(question.id, { selectedOptions: [value] })}
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
          </div>
        );

      case 'short_answer':
      case 'essay':
        return (
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your answer..."
              value={answer.textAnswer || ""}
              onChange={(e) => handleAnswerChange(question.id, { textAnswer: e.target.value })}
              className={question.questionType === 'essay' ? "min-h-[200px]" : "min-h-[100px]"}
            />
          </div>
        );

      case 'fill_blank':
        return (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              {question.questionText.split('____').map((part, index, array) => (
                <span key={index}>
                  {part}
                  {index < array.length - 1 && (
                    <Input
                      className="inline-block w-32 mx-2"
                      placeholder="Fill blank"
                      value={answer.textAnswer || ""}
                      onChange={(e) => handleAnswerChange(question.id, { textAnswer: e.target.value })}
                    />
                  )}
                </span>
              ))}
            </div>
          </div>
        );

      case 'code':
        return (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <Editor
                height="300px"
                language={question.codeLanguage || 'javascript'}
                value={answer.codeAnswer || question.codeTemplate || ""}
                onChange={(value) => handleAnswerChange(question.id, { codeAnswer: value || "" })}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  wordWrap: "on",
                }}
              />
            </div>
            {question.testCases && question.testCases.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Test Cases:</div>
                <div className="space-y-2">
                  {question.testCases.map((testCase, index) => (
                    <div key={index} className="border rounded p-2 text-xs">
                      <div>Input: {JSON.stringify(testCase.input)}</div>
                      <div>Expected: {JSON.stringify(testCase.expectedOutput)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium mb-2">Left Items</div>
                <div className="space-y-2">
                  {question.matchingPairs?.map((pair) => (
                    <div key={pair.leftId} className="p-2 border rounded">
                      {pair.leftText}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-medium mb-2">Right Items</div>
                <div className="space-y-2">
                  {question.matchingPairs?.map((pair) => (
                    <Button
                      key={pair.rightId}
                      variant="outline"
                      className="w-full justify-start h-auto p-2"
                      onClick={() => {
                        const currentMatches = answer.matchingAnswer || {};
                        handleAnswerChange(question.id, {
                          matchingAnswer: {
                            ...currentMatches,
                            [pair.leftId]: pair.rightId,
                          },
                        });
                      }}
                    >
                      {pair.rightText}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'ordering':
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              Drag items to arrange them in the correct order:
            </div>
            <div className="space-y-2">
              {question.orderItems?.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 border rounded cursor-move bg-card hover:bg-accent transition-colors"
                  draggable
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{index + 1}.</span>
                    <span>{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'hotspot':
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              Click on the correct areas in the image:
            </div>
            {question.mediaUrl && (
              <div className="relative border rounded-lg overflow-hidden">
                <img
                  src={question.mediaUrl}
                  alt="Question image"
                  className="w-full h-auto"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    
                    const currentClicks = answer.hotspotAnswer || [];
                    handleAnswerChange(question.id, {
                      hotspotAnswer: [...currentClicks, { x, y }],
                    });
                  }}
                />
                {answer.hotspotAnswer?.map((click, index) => (
                  <div
                    key={index}
                    className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${click.x}%`,
                      top: `${click.y}%`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center text-muted-foreground">
            Question type not supported: {question.questionType}
          </div>
        );
    }
  };

  if (quizLoading || questionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!quiz || !questions) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Quiz not found or not available.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Warning for proctored quiz */}
      {showWarning && quiz.proctored && (
        <Alert className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tab switching detected! Please stay focused on the quiz. Switches: {tabSwitches}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {isAutoSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Save className="w-4 h-4 animate-pulse" />
              Auto-saving...
            </div>
          )}
          
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Time: {formatTime(timeSpent)}
            </div>
            {quiz.timeLimit && (
              <div className="text-sm font-medium">
                Remaining: {formatTime(timeRemaining)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span>Progress</span>
          <span>{answeredCount}/{questions.length} answered</span>
        </div>
        <Progress value={(answeredCount / questions.length) * 100} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
                  {questions.map((question, index) => {
                    const status = getQuestionStatus(question.id);
                    return (
                      <Button
                        key={question.id}
                        variant={index === currentQuestionIndex ? "default" : "outline"}
                        size="sm"
                        className={`relative ${
                          status === 'answered' ? 'border-green-500' :
                          status === 'flagged' ? 'border-orange-500' : ''
                        }`}
                        onClick={() => setCurrentQuestionIndex(index)}
                      >
                        {index + 1}
                        {status === 'answered' && (
                          <CheckCircle className="w-3 h-3 absolute -top-1 -right-1 text-green-500" />
                        )}
                        {status === 'flagged' && (
                          <Flag className="w-3 h-3 absolute -top-1 -right-1 text-orange-500" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Current Question */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Question {currentQuestionIndex + 1}
                  <Badge variant="secondary">{currentQuestion.points} pts</Badge>
                  {currentQuestion.timeLimit && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {currentQuestion.timeLimit}min
                    </Badge>
                  )}
                </CardTitle>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFlag(currentQuestion.id)}
                >
                  <Flag className={`w-4 h-4 ${
                    flaggedQuestions.has(currentQuestion.id) ? 'text-orange-500' : ''
                  }`} />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Question Content */}
              <div>
                {currentQuestion.mediaUrl && (
                  <div className="mb-4">
                    <img
                      src={currentQuestion.mediaUrl}
                      alt="Question media"
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                )}
                
                <div className="prose prose-sm max-w-none">
                  {currentQuestion.questionHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: currentQuestion.questionHtml }} />
                  ) : (
                    <p className="whitespace-pre-wrap">{currentQuestion.questionText}</p>
                  )}
                </div>
              </div>

              {/* Question Input */}
              {renderQuestion(currentQuestion)}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={autoSaveAnswers}
                disabled={isAutoSaving}
              >
                <Save className="w-4 h-4 mr-1" />
                Save Progress
              </Button>
              
              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Submit Quiz
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}