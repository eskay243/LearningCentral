import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

type QuizTakerProps = {
  quizId: number;
  onComplete?: (result: any) => void;
  allowReview?: boolean;
};

type Question = {
  id: number;
  question: string;
  type: string;
  options: string[];
  points: number;
  orderIndex: number;
};

type QuizData = {
  id: number;
  title: string;
  description: string | null;
  passingScore: number;
  lessonId: number;
  questions: Question[];
};

const QuizTaker = ({ quizId, onComplete, allowReview = true }: QuizTakerProps) => {
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [startTime] = useState<Date>(new Date());
  const [mode, setMode] = useState<'quiz' | 'review'>('quiz');

  // Fetch quiz data from the API
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        // Fetch the quiz
        const quizResponse = await fetch(`/api/quizzes/${quizId}`);
        if (!quizResponse.ok) {
          throw new Error('Failed to fetch quiz');
        }
        const quizData = await quizResponse.json();
        
        // Fetch the quiz questions
        const questionsResponse = await fetch(`/api/quizzes/${quizId}/questions`);
        if (!questionsResponse.ok) {
          throw new Error('Failed to fetch quiz questions');
        }
        const questionsData = await questionsResponse.json();
        
        // Sort questions by orderIndex
        questionsData.sort((a: Question, b: Question) => a.orderIndex - b.orderIndex);
        
        // Combine quiz and questions
        setQuiz({
          ...quizData,
          questions: questionsData
        });
        
        // Initialize answers object with empty values
        const initialAnswers: Record<number, any> = {};
        questionsData.forEach((question: Question) => {
          initialAnswers[question.id] = question.type === 'multiple_choice' ? '' : 
                                        question.type === 'true_false' ? '' : '';
        });
        setAnswers(initialAnswers);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast({
          title: 'Error',
          description: 'Failed to load quiz. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId, toast]);
  
  // Timer for tracking time spent
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Format time in minutes and seconds
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle answering a question
  const handleAnswer = (questionId: number, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  
  // Navigate to next question
  const goToNextQuestion = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };
  
  // Navigate to previous question
  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };
  
  // Check if all questions are answered
  const allQuestionsAnswered = () => {
    if (!quiz) return false;
    
    return quiz.questions.every(question => {
      const answer = answers[question.id];
      return answer !== '' && answer !== null && answer !== undefined;
    });
  };
  
  // Calculate quiz result
  const calculateResult = () => {
    if (!quiz) return null;
    
    let totalPoints = 0;
    let earnedPoints = 0;
    const questionResults: Record<number, {
      isCorrect: boolean;
      points: number;
      earnedPoints: number;
      userAnswer: any;
      correctAnswer: any;
    }> = {};
    
    quiz.questions.forEach(question => {
      const userAnswer = answers[question.id];
      // In a real app, we would compare with the correct answer from the database
      // This is a simplified version that assumes we know the correct answers
      
      let isCorrect = false;
      let questionEarnedPoints = 0;
      
      // Simple logic for checking correctness - in a real app this would be more sophisticated
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        // Mock check - in a real app we'd compare with the actual correct answer
        isCorrect = true; // Placeholder for demonstration
        questionEarnedPoints = isCorrect ? question.points : 0;
      } else if (question.type === 'open_ended') {
        // Open-ended questions would need manual grading
        isCorrect = true; // For demonstration
        questionEarnedPoints = question.points;
      }
      
      totalPoints += question.points;
      earnedPoints += questionEarnedPoints;
      
      questionResults[question.id] = {
        isCorrect,
        points: question.points,
        earnedPoints: questionEarnedPoints,
        userAnswer,
        correctAnswer: 'Sample correct answer' // Placeholder
      };
    });
    
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= (quiz.passingScore || 70);
    
    return {
      quizId,
      score,
      totalPoints,
      earnedPoints,
      isPassed: passed,
      timeSpent,
      startedAt: startTime.toISOString(),
      completedAt: new Date().toISOString(),
      questionResults
    };
  };
  
  // Submit quiz
  const submitQuiz = async () => {
    if (!quiz) return;
    
    if (!allQuestionsAnswered()) {
      toast({
        title: 'Warning',
        description: 'Please answer all questions before submitting.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const quizResult = calculateResult();
      
      // Submit quiz attempt to the API
      const response = await apiRequest('POST', '/api/quiz-attempts', {
        quizId,
        score: quizResult?.score,
        isPassed: quizResult?.isPassed,
        startedAt: quizResult?.startedAt,
        completedAt: quizResult?.completedAt,
        answers: answers
      });
      
      const submitResult = await response.json();
      
      setResult({
        ...quizResult,
        ...submitResult
      });
      
      toast({
        title: 'Quiz Submitted',
        description: `You scored ${quizResult?.score}% and ${quizResult?.isPassed ? 'passed' : 'did not pass'} the quiz.`
      });
      
      if (allowReview) {
        setMode('review');
      }
      
      if (onComplete) {
        onComplete({
          ...quizResult,
          ...submitResult
        });
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit quiz. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // If quiz not found
  if (!quiz) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Not Found</CardTitle>
          <CardDescription>
            The requested quiz could not be loaded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
            <p className="text-center text-muted-foreground">
              There was a problem loading this quiz. The quiz may not exist or you may not have permission to access it.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If in review mode (after submission)
  if (mode === 'review' && result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Results: {quiz.title}</CardTitle>
          <CardDescription>
            You have completed this quiz. Review your results below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-6 border rounded-lg">
              <div className={`text-4xl font-bold mb-2 ${result.isPassed ? 'text-green-500' : 'text-red-500'}`}>
                {result.score}%
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-sm font-medium ${result.isPassed ? 'text-green-500' : 'text-red-500'}`}>
                  {result.isPassed ? (
                    <div className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 mr-1" />
                      Passed
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-1" />
                      Failed
                    </div>
                  )}
                </div>
                <span className="text-muted-foreground text-sm">|</span>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Time: {formatTime(result.timeSpent)}
                </div>
              </div>
              <div className="w-full max-w-md mt-4">
                <Progress value={result.score} className="h-2" />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>Passing: {quiz.passingScore}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-medium">Question Review</h3>
            <div className="space-y-4">
              {quiz.questions.map((question, index) => {
                const questionResult = result.questionResults?.[question.id];
                return (
                  <div key={question.id} className={`border rounded-md p-4 ${questionResult?.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">
                        {index + 1}. {question.question}
                      </h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${questionResult?.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {questionResult?.earnedPoints} / {question.points} pts
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {question.type === 'multiple_choice' && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option, i) => (
                            <div 
                              key={i}
                              className={`flex items-center p-2 rounded-md ${
                                answers[question.id] === option && questionResult?.isCorrect
                                  ? 'bg-green-100'
                                  : answers[question.id] === option && !questionResult?.isCorrect
                                  ? 'bg-red-100'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <RadioGroupItem 
                                value={option} 
                                id={`q${question.id}_opt${i}`} 
                                checked={answers[question.id] === option}
                                disabled
                              />
                              <Label htmlFor={`q${question.id}_opt${i}`} className="ml-2">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.type === 'true_false' && (
                        <div className="space-y-2">
                          {['true', 'false'].map((option) => (
                            <div 
                              key={option}
                              className={`flex items-center p-2 rounded-md ${
                                answers[question.id] === option && questionResult?.isCorrect
                                  ? 'bg-green-100'
                                  : answers[question.id] === option && !questionResult?.isCorrect
                                  ? 'bg-red-100'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <RadioGroupItem
                                value={option}
                                id={`q${question.id}_${option}`}
                                checked={answers[question.id] === option}
                                disabled
                              />
                              <Label htmlFor={`q${question.id}_${option}`} className="ml-2 capitalize">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.type === 'open_ended' && (
                        <Textarea
                          value={answers[question.id]}
                          readOnly
                          className="w-full"
                        />
                      )}
                    </div>
                    
                    <div className="text-sm">
                      <div className="font-medium">Your answer:</div>
                      <div className="text-muted-foreground">{answers[question.id]}</div>
                      <div className="font-medium mt-2">Correct answer:</div>
                      <div className="text-muted-foreground">{questionResult?.correctAnswer}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={() => onComplete && onComplete(result)}>Finish Review</Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Quiz taking mode
  const currentQuestionData = quiz.questions[currentQuestion];
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{quiz.title}</CardTitle>
            <CardDescription>
              {quiz.description || 'Answer all questions to complete the quiz'}
            </CardDescription>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            Time: {formatTime(timeSpent)}
          </div>
        </div>
        <div className="mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
            <span>{Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%</span>
          </div>
          <Progress 
            value={((currentQuestion + 1) / quiz.questions.length) * 100}
            className="h-2"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium mb-4">
              {currentQuestionData.question}
            </h3>
            
            {currentQuestionData.type === 'multiple_choice' && currentQuestionData.options && (
              <RadioGroup
                value={answers[currentQuestionData.id] || ''}
                onValueChange={(value) => handleAnswer(currentQuestionData.id, value)}
                className="space-y-2"
              >
                {currentQuestionData.options.map((option, i) => (
                  <div key={i} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                    <RadioGroupItem value={option} id={`option${i}`} />
                    <Label htmlFor={`option${i}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            
            {currentQuestionData.type === 'true_false' && (
              <RadioGroup
                value={answers[currentQuestionData.id] || ''}
                onValueChange={(value) => handleAnswer(currentQuestionData.id, value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true">True</Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false">False</Label>
                </div>
              </RadioGroup>
            )}
            
            {currentQuestionData.type === 'open_ended' && (
              <Textarea
                placeholder="Type your answer here..."
                value={answers[currentQuestionData.id] || ''}
                onChange={(e) => handleAnswer(currentQuestionData.id, e.target.value)}
                className="w-full min-h-[150px]"
              />
            )}
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousQuestion}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            {currentQuestion < quiz.questions.length - 1 ? (
              <Button
                onClick={goToNextQuestion}
                disabled={!answers[currentQuestionData.id]}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={submitQuiz}
                disabled={isSubmitting || !allQuestionsAnswered()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizTaker;