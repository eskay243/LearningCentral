import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Check, ArrowLeft, ArrowRight, Code, BookOpen, Award } from 'lucide-react';
import EnhancedCodeEditor from '@/components/content/EnhancedCodeEditor';
import { ContextualHelp, WithContextualHelp } from '@/components/ui/ContextualHelp';

const SAMPLE_EXERCISES = [
  {
    id: 1,
    title: "Introduction to JavaScript",
    description: "Learn the basics of JavaScript programming language",
    difficulty: "beginner",
    language: "javascript",
    initialCode: "// Write a function that adds two numbers\nfunction add(a, b) {\n  // Your code here\n}\n\n// Test your function\nconsole.log(add(5, 3));",
    solution: "return a + b;",
    instructions: `
      <h3>Adding Two Numbers</h3>
      <p>In this exercise, you'll write your first JavaScript function that adds two numbers together.</p>
      <p>Complete the <code>add</code> function so that it:</p>
      <ol>
        <li>Takes two parameters: <code>a</code> and <code>b</code></li>
        <li>Returns the sum of those two parameters</li>
      </ol>
      <p>For example, <code>add(5, 3)</code> should return <code>8</code>.</p>
    `,
    hints: [
      "Remember that the + operator adds numbers together in JavaScript.",
      "Your function needs to return a value using the 'return' keyword.",
      "The structure of your function should be: return a + b;"
    ],
    tests: [
      { test: "add(5, 3)", expected: 8 },
      { test: "add(-1, 1)", expected: 0 },
      { test: "add(0, 0)", expected: 0 }
    ]
  },
  {
    id: 2,
    title: "String Manipulation",
    description: "Learn to work with strings in JavaScript",
    difficulty: "beginner",
    language: "javascript",
    initialCode: "// Write a function that reverses a string\nfunction reverseString(str) {\n  // Your code here\n}\n\n// Test your function\nconsole.log(reverseString('hello'));",
    solution: "return str.split('').reverse().join('');",
    instructions: `
      <h3>Reversing a String</h3>
      <p>In this exercise, you'll create a function that reverses a string.</p>
      <p>Complete the <code>reverseString</code> function so that it:</p>
      <ol>
        <li>Takes a string parameter: <code>str</code></li>
        <li>Returns the string with characters in reverse order</li>
      </ol>
      <p>For example, <code>reverseString('hello')</code> should return <code>'olleh'</code>.</p>
    `,
    hints: [
      "You can convert a string to an array of characters using split('').",
      "Arrays have a reverse() method to reverse the order of elements.",
      "You can join an array back into a string using join('')."
    ],
    tests: [
      { test: "reverseString('hello')", expected: "olleh" },
      { test: "reverseString('javascript')", expected: "tpircsavaj" },
      { test: "reverseString('12345')", expected: "54321" }
    ]
  },
  {
    id: 3,
    title: "Array Operations",
    description: "Learn to work with arrays in JavaScript",
    difficulty: "intermediate",
    language: "javascript",
    initialCode: "// Write a function that finds the maximum value in an array\nfunction findMax(arr) {\n  // Your code here\n}\n\n// Test your function\nconsole.log(findMax([4, 2, 8, 1, 9, 3]));",
    solution: "return Math.max(...arr);",
    instructions: `
      <h3>Finding the Maximum Value</h3>
      <p>In this exercise, you'll create a function that finds the maximum value in an array of numbers.</p>
      <p>Complete the <code>findMax</code> function so that it:</p>
      <ol>
        <li>Takes an array parameter: <code>arr</code></li>
        <li>Returns the largest number in the array</li>
      </ol>
      <p>For example, <code>findMax([4, 2, 8, 1, 9, 3])</code> should return <code>9</code>.</p>
    `,
    hints: [
      "You can use a loop to compare each value with the current maximum.",
      "JavaScript has a built-in Math.max() function, but it doesn't work directly on arrays.",
      "You can use the spread operator (...) with Math.max() like this: Math.max(...arr)"
    ],
    tests: [
      { test: "findMax([4, 2, 8, 1, 9, 3])", expected: 9 },
      { test: "findMax([1, 2, 3, 4, 5])", expected: 5 },
      { test: "findMax([-1, -5, -10])", expected: -1 }
    ]
  }
];

const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  switch (difficulty.toLowerCase()) {
    case 'beginner':
      return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Beginner</Badge>;
    case 'intermediate':
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Intermediate</Badge>;
    case 'advanced':
      return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">Advanced</Badge>;
    default:
      return <Badge variant="outline">{difficulty}</Badge>;
  }
};

const InteractiveLearning = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('exercises');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [exerciseProgress, setExerciseProgress] = useState<{ [key: number]: { status: string; currentCode?: string; } }>({});
  
  const currentExercise = SAMPLE_EXERCISES[currentExerciseIndex];
  
  // Load exercises from API
  const { data: exercises, error, isLoading: isLoadingExercises } = useQuery({
    queryKey: ['/api/coding-exercises'],
    enabled: !!isAuthenticated,
  });
  
  // Load user progress from API
  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['/api/users', user?.id, 'exercise-progress'],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/users/${user.id}/exercise-progress`);
      if (!response.ok) {
        throw new Error('Failed to load progress data');
      }
      return response.json();
    },
    enabled: !!isAuthenticated && !!user?.id,
  });
  
  // Update exercise progress state when data is loaded
  useEffect(() => {
    if (progressData?.recentExercises) {
      // Convert progress data to the format expected by our component
      const progress: { [key: number]: { status: string; currentCode?: string } } = {};
      
      // First set up all completed exercises
      const completed: number[] = [];
      
      progressData.recentExercises.forEach((exercise: any) => {
        progress[exercise.id] = {
          status: exercise.status || 'in_progress',
          currentCode: exercise.currentCode
        };
        
        if (exercise.status === 'completed') {
          completed.push(exercise.id);
        }
      });
      
      setExerciseProgress(progress);
      setCompletedExercises(completed);
    }
  }, [progressData]);
  
  // Handle exercise completion
  const handleExerciseComplete = (exerciseId: number) => {
    // Update completed exercises list
    if (!completedExercises.includes(exerciseId)) {
      const updated = [...completedExercises, exerciseId];
      setCompletedExercises(updated);
      
      // Update progress
      const newProgress = {
        ...exerciseProgress,
        [exerciseId]: {
          ...exerciseProgress[exerciseId],
          status: 'completed'
        }
      };
      setExerciseProgress(newProgress);
      
      // Save progress to the API
      if (user) {
        const progressData = {
          status: 'completed',
          currentCode: exerciseProgress[exerciseId]?.currentCode || '',
          timeSpent: 0, // Would track actual time in a real implementation
          attemptCount: 1, // Would track actual attempts in a real implementation
          hintsUsed: 0 // Would track actual hints used in a real implementation
        };
        
        fetch(`/api/coding-exercises/${exerciseId}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(progressData)
        }).catch(error => {
          console.error('Error saving exercise completion:', error);
          toast({
            title: "Error saving progress",
            description: "Your progress was not saved. Please try again.",
            variant: "destructive"
          });
        });
      }
      
      toast({
        title: "Exercise completed!",
        description: "Great job! You've completed this exercise.",
      });
    }
  };
  
  // Handle code changes (to save progress)
  const handleCodeChange = (code: string) => {
    if (!user || !currentExercise) return;
    
    // Update progress with current code
    const newProgress = {
      ...exerciseProgress,
      [currentExercise.id]: {
        ...exerciseProgress[currentExercise.id],
        status: exerciseProgress[currentExercise.id]?.status || 'in_progress',
        currentCode: code
      }
    };
    setExerciseProgress(newProgress);
    
    // We would use a debounced save here in a real implementation
    // to avoid too many API calls while typing
    const saveToApi = () => {
      const progressData = {
        status: 'in_progress',
        currentCode: code,
        timeSpent: 0, // Would track actual time in a real implementation
        attemptCount: 1, // Would track actual attempts in a real implementation
        hintsUsed: 0 // Would track actual hints used in a real implementation
      };
      
      fetch(`/api/coding-exercises/${currentExercise.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData)
      }).catch(error => {
        console.error('Error saving code progress:', error);
      });
    };
    
    // For demo, save immediately - in production we would add debouncing
    saveToApi();
  };
  
  // Navigate to next exercise
  const goToNextExercise = () => {
    if (currentExerciseIndex < SAMPLE_EXERCISES.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };
  
  // Navigate to previous exercise
  const goToPrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };
  
  // Select a specific exercise
  const selectExercise = (index: number) => {
    setCurrentExerciseIndex(index);
    setActiveTab('code');
  };
  
  if (isLoading || isLoadingExercises) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-bold mb-4">Error loading exercises</h2>
        <p className="text-red-500">Please try again later.</p>
      </div>
    );
  }
  
  const totalCompleted = completedExercises.length;
  const totalExercises = SAMPLE_EXERCISES.length;
  const progressPercentage = totalExercises > 0 ? (totalCompleted / totalExercises) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Interactive Learning</h1>
          {isAuthenticated && (
            <div className="flex flex-col items-end">
              <div className="flex items-center mb-2">
                <span className="text-sm mr-2">Progress: {totalCompleted}/{totalExercises} exercises completed</span>
                <span className="font-semibold">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="w-60" />
            </div>
          )}
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="exercises" className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>Exercises</span>
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                <span>Current Exercise</span>
              </TabsTrigger>
              {completedExercises.length > 0 && (
                <TabsTrigger value="achievements" className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>Achievements</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>
          
          <TabsContent value="exercises" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(exercises || SAMPLE_EXERCISES).map((exercise, index) => (
                <Card key={exercise.id} className={completedExercises.includes(exercise.id) ? "border-green-300" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle>{exercise.title}</CardTitle>
                      {completedExercises.includes(exercise.id) && (
                        <span className="bg-green-100 text-green-600 p-1 rounded-full">
                          <Check className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                    <CardDescription>{exercise.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex space-x-2">
                      <DifficultyBadge difficulty={exercise.difficulty} />
                      <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                        {exercise.language}
                      </Badge>
                    </div>
                    {exercise.courseId && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span>From course: </span>
                        <a href={`/courses/${exercise.courseId}/view`} className="text-primary hover:underline">
                          View Course
                        </a>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={completedExercises.includes(exercise.id) ? "outline" : "default"}
                      className="w-full justify-between"
                      onClick={() => selectExercise(index)}
                    >
                      <span>
                        {completedExercises.includes(exercise.id) 
                          ? "Review Exercise" 
                          : exerciseProgress[exercise.id]?.status === 'in_progress'
                            ? "Continue Exercise"
                            : "Start Exercise"
                        }
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="code">
            {currentExercise && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">{currentExercise.title}</h2>
                    <p className="text-muted-foreground">{currentExercise.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <DifficultyBadge difficulty={currentExercise.difficulty} />
                    <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                      {currentExercise.language}
                    </Badge>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <EnhancedCodeEditor
                    initialCode={exerciseProgress[currentExercise.id]?.currentCode || currentExercise.initialCode}
                    language={currentExercise.language}
                    instructions={currentExercise.instructions}
                    solution={currentExercise.solution}
                    hints={currentExercise.hints}
                    tests={currentExercise.tests}
                    onCodeChange={handleCodeChange}
                    onCompletion={handleExerciseComplete}
                    exerciseId={currentExercise.id}
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={goToPrevExercise}
                    disabled={currentExerciseIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous Exercise
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('exercises')}
                  >
                    Back to Exercises
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={goToNextExercise}
                    disabled={currentExerciseIndex === SAMPLE_EXERCISES.length - 1}
                  >
                    Next Exercise
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Your Achievements</CardTitle>
                <CardDescription>Track your progress and accomplishments</CardDescription>
              </CardHeader>
              <CardContent>
                {completedExercises.length > 0 ? (
                  <div className="space-y-2">
                    {completedExercises.map(id => {
                      const exercise = SAMPLE_EXERCISES.find(ex => ex.id === id);
                      return exercise ? (
                        <div key={id} className="flex items-center p-2 border rounded">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span>{exercise.title}</span>
                          <span className="ml-auto text-muted-foreground text-sm">
                            {exercise.difficulty}
                          </span>
                        </div>
                      ) : null;
                    })}
                    
                    {completedExercises.length === SAMPLE_EXERCISES.length && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                        <h3 className="font-bold text-lg flex items-center">
                          <Award className="h-5 w-5 text-yellow-500 mr-2" />
                          Congratulations!
                        </h3>
                        <p>You've completed all available exercises!</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>Complete exercises to earn achievements</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InteractiveLearning;