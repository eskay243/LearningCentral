import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Award, Clock } from "lucide-react";

interface Question {
  id: number;
  question: string;
  type: string;
  options: string[];
  correctAnswer: string[];
  points: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  passingScore: number;
  questions: Question[];
}

interface QuizResult {
  score: number;
  percentage: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  results: Array<{
    questionId: number;
    question: string;
    userAnswer: string;
    correctAnswer: string[];
    correct: boolean;
    points: number;
  }>;
}

export default function QuizViewer() {
  const { quizId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`);
      if (response.ok) {
        const quizData = await response.json();
        setQuiz(quizData);
      } else {
        toast({
          title: "Error",
          description: "Failed to load quiz",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitQuiz = async () => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (response.ok) {
        const result = await response.json();
        setResults(result);
        setSubmitted(true);
        toast({
          title: result.passed ? "Quiz Passed!" : "Quiz Completed",
          description: `You scored ${result.percentage}%`,
          variant: result.passed ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit quiz",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading quiz...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p>Quiz not found</p>
            <Button onClick={() => setLocation("/")} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted && results) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {results.passed ? (
                <Award className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              Quiz Results
            </CardTitle>
            <CardDescription>
              {quiz.title} - Score: {results.percentage}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {results.percentage}%
                  </div>
                  <div className="text-sm text-gray-600">Final Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {results.correctAnswers}/{results.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${results.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {results.passed ? 'PASSED' : 'FAILED'}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detailed Results</h3>
              {results.results.map((result, index) => (
                <Card key={result.questionId}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {result.correct ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-1" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{result.question}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Your answer: <span className={result.correct ? 'text-green-600' : 'text-red-600'}>
                            {result.userAnswer}
                          </span>
                        </p>
                        {!result.correct && (
                          <p className="text-sm text-green-600 mt-1">
                            Correct answer: {result.correctAnswer.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-sm font-medium">
                        {result.points} pts
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()}>
                Retake Quiz
              </Button>
              <Button variant="outline" onClick={() => setLocation("/")}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          <CardDescription>
            {quiz.description} | Passing Score: {quiz.passingScore}%
          </CardDescription>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            Question {currentQuestion + 1} of {quiz.questions.length}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">{currentQ.question}</h3>
              
              {currentQ.type === 'multiple_choice' && (
                <RadioGroup
                  value={answers[currentQ.id] || ''}
                  onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
                >
                  {currentQ.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            {currentQuestion < quiz.questions.length - 1 ? (
              <Button 
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={!answers[currentQ.id]}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={submitQuiz}
                disabled={quiz.questions.some(q => !answers[q.id])}
                className="bg-green-600 hover:bg-green-700"
              >
                Submit Quiz
              </Button>
            )}
          </div>

          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Object.keys(answers).length}/{quiz.questions.length} answered</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}