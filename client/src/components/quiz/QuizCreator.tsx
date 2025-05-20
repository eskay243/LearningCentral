import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Save, Edit, AlertTriangle } from 'lucide-react';

// Define schema for quiz creation
const quizFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  lessonId: z.string().min(1, 'Lesson is required'),
  passingScore: z.coerce.number().min(1).max(100).default(70)
});

// Define schema for question creation
const questionFormSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  type: z.enum(['multiple_choice', 'true_false', 'open_ended']),
  options: z.array(z.string().min(1)).min(2, 'At least 2 options required').optional(),
  correctAnswer: z.union([
    z.string().min(1, 'Correct answer is required'),
    z.array(z.string().min(1)).min(1, 'At least one correct answer is required')
  ]),
  points: z.coerce.number().min(1).default(1),
  orderIndex: z.coerce.number().default(0)
});

type QuizCreatorProps = {
  lessonId: number;
  onComplete?: (quiz: any) => void;
  existingQuiz?: any;
};

const QuizCreator = ({ lessonId, onComplete, existingQuiz }: QuizCreatorProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('quiz');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdQuiz, setCreatedQuiz] = useState<any>(existingQuiz || null);
  const [questions, setQuestions] = useState<any[]>(existingQuiz?.questions || []);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);

  // Form for quiz creation
  const quizForm = useForm<z.infer<typeof quizFormSchema>>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: existingQuiz ? {
      title: existingQuiz.title,
      description: existingQuiz.description || '',
      lessonId: String(existingQuiz.lessonId),
      passingScore: existingQuiz.passingScore || 70
    } : {
      title: '',
      description: '',
      lessonId: String(lessonId),
      passingScore: 70
    }
  });

  // Form for question creation
  const questionForm = useForm<z.infer<typeof questionFormSchema>>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: '',
      type: 'multiple_choice',
      options: ['', ''],
      correctAnswer: '',
      points: 1,
      orderIndex: questions.length
    }
  });

  // Handle quiz form submission
  const onQuizSubmit = async (data: z.infer<typeof quizFormSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest(
        existingQuiz ? 'PUT' : 'POST',
        existingQuiz ? `/api/quizzes/${existingQuiz.id}` : '/api/quizzes',
        {
          ...data,
          lessonId: parseInt(data.lessonId)
        }
      );
      
      const quiz = await response.json();
      setCreatedQuiz(quiz);
      setActiveTab('questions');
      
      toast({
        title: existingQuiz ? 'Quiz Updated' : 'Quiz Created',
        description: `Your quiz has been ${existingQuiz ? 'updated' : 'created'} successfully.`
      });
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: 'Error',
        description: `Failed to ${existingQuiz ? 'update' : 'create'} quiz`,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle question form submission
  const onQuestionSubmit = async (data: z.infer<typeof questionFormSchema>) => {
    if (!createdQuiz) {
      toast({
        title: 'Error',
        description: 'Please create a quiz first',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the question data
      const questionData = {
        ...data,
        quizId: createdQuiz.id,
        // Format options and correctAnswer based on question type
        options: data.type === 'multiple_choice' ? data.options : null,
        correctAnswer: data.type === 'true_false' ? data.correctAnswer : 
                      data.type === 'multiple_choice' ? data.correctAnswer : 
                      data.correctAnswer
      };

      const response = await apiRequest(
        editingQuestion ? 'PUT' : 'POST',
        editingQuestion ? `/api/quiz-questions/${editingQuestion.id}` : '/api/quiz-questions',
        questionData
      );
      
      const question = await response.json();

      if (editingQuestion) {
        // Update existing question in the list
        setQuestions(questions.map(q => q.id === question.id ? question : q));
        setEditingQuestion(null);
      } else {
        // Add new question to the list
        setQuestions([...questions, question]);
      }
      
      // Reset form
      questionForm.reset({
        question: '',
        type: 'multiple_choice',
        options: ['', ''],
        correctAnswer: '',
        points: 1,
        orderIndex: editingQuestion ? questionData.orderIndex : questions.length + 1
      });

      toast({
        title: editingQuestion ? 'Question Updated' : 'Question Added',
        description: `Your question has been ${editingQuestion ? 'updated' : 'added'} successfully.`
      });
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: 'Error',
        description: `Failed to ${editingQuestion ? 'update' : 'add'} question`,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle editing a question
  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    
    // Set form values for editing
    questionForm.reset({
      question: question.question,
      type: question.type,
      options: question.options || ['', ''],
      correctAnswer: question.correctAnswer,
      points: question.points,
      orderIndex: question.orderIndex
    });
  };

  // Handle deleting a question
  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await apiRequest('DELETE', `/api/quiz-questions/${questionId}`, {});
      setQuestions(questions.filter(q => q.id !== questionId));
      
      toast({
        title: 'Question Deleted',
        description: 'The question has been deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete question',
        variant: 'destructive'
      });
    }
  };

  // Handle quiz completion
  const handleCompleteQuiz = () => {
    if (questions.length === 0) {
      toast({
        title: 'Warning',
        description: 'Please add at least one question to the quiz',
        variant: 'destructive'
      });
      return;
    }

    if (onComplete && createdQuiz) {
      onComplete({
        ...createdQuiz,
        questions
      });
    }

    toast({
      title: 'Quiz Completed',
      description: 'Your quiz has been completed successfully.'
    });
  };

  // Add option to multiple choice question
  const addOption = () => {
    const currentOptions = questionForm.getValues('options') || [];
    questionForm.setValue('options', [...currentOptions, '']);
  };

  // Remove option from multiple choice question
  const removeOption = (index: number) => {
    const currentOptions = questionForm.getValues('options') || [];
    if (currentOptions.length <= 2) return; // Minimum 2 options required
    
    questionForm.setValue('options', currentOptions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="quiz">Quiz Details</TabsTrigger>
          <TabsTrigger value="questions" disabled={!createdQuiz}>Questions</TabsTrigger>
          <TabsTrigger value="preview" disabled={!createdQuiz || questions.length === 0}>Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="quiz">
          <Card>
            <CardHeader>
              <CardTitle>{existingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</CardTitle>
              <CardDescription>
                Define the quiz details. After saving, you can add questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...quizForm}>
                <form onSubmit={quizForm.handleSubmit(onQuizSubmit)} className="space-y-4">
                  <FormField
                    control={quizForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiz Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter quiz title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quizForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter quiz description" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={quizForm.control}
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Score (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : existingQuiz ? 'Update Quiz' : 'Create Quiz'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</CardTitle>
                <CardDescription>
                  {editingQuestion 
                    ? 'Edit the selected question details.' 
                    : 'Add a new question to your quiz.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...questionForm}>
                  <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-4">
                    <FormField
                      control={questionForm.control}
                      name="question"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter your question" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={questionForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select question type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                              <SelectItem value="open_ended">Open Ended</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Dynamic fields based on question type */}
                    {questionForm.watch('type') === 'multiple_choice' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <FormLabel>Options</FormLabel>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={addOption}
                          >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Add Option
                          </Button>
                        </div>
                        
                        {/* Options for multiple choice */}
                        {(questionForm.watch('options') || []).map((_, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <FormField
                              control={questionForm.control}
                              name={`options.${index}`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder={`Option ${index + 1}`} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(index)}
                              disabled={(questionForm.watch('options') || []).length <= 2}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}

                        <FormField
                          control={questionForm.control}
                          name="correctAnswer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Correct Answer</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value as string}
                                value={field.value as string}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select correct answer" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {(questionForm.watch('options') || []).map((option, index) => (
                                    <SelectItem key={index} value={option} disabled={!option.trim()}>
                                      {option || `Option ${index + 1} (empty)`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {questionForm.watch('type') === 'true_false' && (
                      <FormField
                        control={questionForm.control}
                        name="correctAnswer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correct Answer</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value as string}
                              value={field.value as string}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select correct answer" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {questionForm.watch('type') === 'open_ended' && (
                      <FormField
                        control={questionForm.control}
                        name="correctAnswer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model Answer (for grading)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter model answer" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={questionForm.control}
                      name="points"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-2">
                      {editingQuestion && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setEditingQuestion(null);
                            questionForm.reset({
                              question: '',
                              type: 'multiple_choice',
                              options: ['', ''],
                              correctAnswer: '',
                              points: 1,
                              orderIndex: questions.length
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Questions ({questions.length})</CardTitle>
                  <CardDescription>
                    {questions.length === 0 
                      ? 'No questions added yet. Add your first question.' 
                      : 'All questions in this quiz. Click to edit.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {questions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No questions have been added to this quiz yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((question, index) => (
                        <div 
                          key={question.id || index} 
                          className="border rounded-md p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">
                                {index + 1}. {question.question}
                              </h4>
                              <div className="text-xs text-muted-foreground mt-1">
                                {question.type === 'multiple_choice' && 'Multiple Choice'}
                                {question.type === 'true_false' && 'True/False'}
                                {question.type === 'open_ended' && 'Open Ended'}
                                {' · '}{question.points} {question.points === 1 ? 'point' : 'points'}
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditQuestion(question)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteQuestion(question.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    onClick={handleCompleteQuiz}
                    disabled={questions.length === 0}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {onComplete ? 'Save and Complete' : 'Finish Quiz'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Preview: {createdQuiz?.title}</CardTitle>
              <CardDescription>
                Preview how your quiz will appear to students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div key={index} className="border rounded-md p-4">
                    <h3 className="font-medium mb-3">
                      Question {index + 1}: {question.question}
                    </h3>
                    
                    {question.type === 'multiple_choice' && (
                      <div className="space-y-2">
                        {question.options?.map((option: string, i: number) => (
                          <div key={i} className="flex items-center space-x-2">
                            <input 
                              type="radio" 
                              name={`q${index}`} 
                              id={`q${index}_opt${i}`}
                              className="h-4 w-4"
                            />
                            <label htmlFor={`q${index}_opt${i}`} className="text-sm">
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'true_false' && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            name={`q${index}`} 
                            id={`q${index}_true`}
                            className="h-4 w-4"
                          />
                          <label htmlFor={`q${index}_true`} className="text-sm">True</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            name={`q${index}`} 
                            id={`q${index}_false`}
                            className="h-4 w-4"
                          />
                          <label htmlFor={`q${index}_false`} className="text-sm">False</label>
                        </div>
                      </div>
                    )}
                    
                    {question.type === 'open_ended' && (
                      <Textarea placeholder="Enter your answer" className="w-full" />
                    )}
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      {question.points} {question.points === 1 ? 'point' : 'points'}
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end">
                  <Button disabled>Submit Quiz</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('questions')}>
                Back to Questions
              </Button>
              <Button onClick={handleCompleteQuiz}>
                <Save className="h-4 w-4 mr-1" />
                {onComplete ? 'Save and Complete' : 'Finish Quiz'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuizCreator;