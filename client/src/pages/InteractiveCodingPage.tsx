import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import CodePlayground from '@/components/coding/CodePlayground';
import { 
  Code2, 
  Trophy, 
  Clock, 
  Star, 
  BookOpen,
  Play,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CodingExercise {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: 'javascript' | 'python';
  category: string;
  estimatedTime: number;
  initialCode: string;
  instructions: string;
  solution?: string;
  hints: string[];
  testCases: Array<{
    name: string;
    test: string;
    expected: any;
  }>;
  completed?: boolean;
}

const InteractiveCodingPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState<CodingExercise | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  // Sample coding exercises for demonstration
  const exercises: CodingExercise[] = [
    {
      id: 1,
      title: "Hello World",
      description: "Write a function that returns 'Hello, World!'",
      difficulty: 'beginner',
      language: 'javascript',
      category: 'Basics',
      estimatedTime: 5,
      initialCode: `// Write a function that returns "Hello, World!"
function helloWorld() {
  // Your code here
  
}`,
      instructions: `Create a function called 'helloWorld' that returns the string "Hello, World!".

This is your first coding exercise. Follow these steps:
1. Complete the function body
2. Make sure it returns exactly "Hello, World!"
3. Click the Test button to verify your solution`,
      hints: [
        "Use the 'return' keyword to return a value from the function",
        "String literals in JavaScript are enclosed in quotes",
        "Make sure the capitalization and punctuation match exactly"
      ],
      testCases: [
        {
          name: "Should return Hello, World!",
          test: "helloWorld()",
          expected: "Hello, World!"
        }
      ]
    },
    {
      id: 2,
      title: "Add Two Numbers",
      description: "Create a function that adds two numbers together",
      difficulty: 'beginner',
      language: 'javascript',
      category: 'Basics',
      estimatedTime: 10,
      initialCode: `// Write a function that adds two numbers
function addNumbers(a, b) {
  // Your code here
  
}`,
      instructions: `Create a function called 'addNumbers' that takes two parameters and returns their sum.

Requirements:
- The function should accept two parameters: a and b
- Return the sum of a and b
- Handle both positive and negative numbers`,
      hints: [
        "Use the + operator to add numbers in JavaScript",
        "The parameters a and b are already provided",
        "Return the result of a + b"
      ],
      testCases: [
        {
          name: "Should add positive numbers",
          test: "addNumbers(2, 3)",
          expected: 5
        },
        {
          name: "Should add negative numbers", 
          test: "addNumbers(-1, -2)",
          expected: -3
        },
        {
          name: "Should add mixed numbers",
          test: "addNumbers(10, -5)",
          expected: 5
        }
      ]
    },
    {
      id: 3,
      title: "Find Maximum",
      description: "Write a function to find the maximum number in an array",
      difficulty: 'intermediate',
      language: 'javascript',
      category: 'Arrays',
      estimatedTime: 15,
      initialCode: `// Write a function that finds the maximum number in an array
function findMax(numbers) {
  // Your code here
  
}`,
      instructions: `Create a function called 'findMax' that finds and returns the largest number in an array.

Requirements:
- The function should accept an array of numbers
- Return the largest number in the array
- Handle empty arrays by returning undefined
- Handle arrays with negative numbers`,
      hints: [
        "You can use Math.max() with the spread operator",
        "Alternatively, use a loop to compare each number",
        "Consider what to return for an empty array"
      ],
      testCases: [
        {
          name: "Should find max in positive numbers",
          test: "findMax([1, 3, 2, 8, 5])",
          expected: 8
        },
        {
          name: "Should find max with negative numbers",
          test: "findMax([-1, -3, -2])",
          expected: -1
        },
        {
          name: "Should handle single element",
          test: "findMax([42])",
          expected: 42
        }
      ]
    },
    {
      id: 4,
      title: "Python List Sum",
      description: "Calculate the sum of all numbers in a Python list",
      difficulty: 'beginner',
      language: 'python',
      category: 'Lists',
      estimatedTime: 10,
      initialCode: `# Write a function that calculates the sum of numbers in a list
def list_sum(numbers):
    # Your code here
    pass`,
      instructions: `Create a function called 'list_sum' that calculates and returns the sum of all numbers in a list.

Requirements:
- The function should accept a list of numbers
- Return the sum of all numbers
- Handle empty lists by returning 0`,
      hints: [
        "You can use the built-in sum() function",
        "Alternatively, use a for loop to add each number",
        "Remember to handle the empty list case"
      ],
      testCases: [
        {
          name: "Should sum positive numbers",
          test: "list_sum([1, 2, 3, 4, 5])",
          expected: 15
        },
        {
          name: "Should handle empty list",
          test: "list_sum([])",
          expected: 0
        },
        {
          name: "Should sum negative numbers",
          test: "list_sum([-1, -2, 3])",
          expected: 0
        }
      ]
    }
  ];

  const handleExerciseCompletion = (exerciseId: number) => {
    setCompletedExercises(prev => new Set([...prev, exerciseId]));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the coding playground.</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Log In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {!selectedExercise ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Interactive Coding Playground
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Practice coding with real-time feedback and automatic testing
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{completedExercises.size}</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Code2 className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">{exercises.length}</p>
                      <p className="text-sm text-gray-600">Total Exercises</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Star className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">
                        {Math.round((completedExercises.size / exercises.length) * 100)}%
                      </p>
                      <p className="text-sm text-gray-600">Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Exercise Categories */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Exercises</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exercises.map((exercise) => (
                    <Card 
                      key={exercise.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant="secondary"
                            className={getDifficultyColor(exercise.difficulty)}
                          >
                            {getDifficultyText(exercise.difficulty)}
                          </Badge>
                          {completedExercises.has(exercise.id) && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <CardTitle className="text-lg">{exercise.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          {exercise.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {exercise.estimatedTime} min
                          </div>
                          <Badge variant="outline">
                            {exercise.language}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="javascript" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exercises.filter(e => e.language === 'javascript').map((exercise) => (
                    <Card 
                      key={exercise.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant="secondary"
                            className={getDifficultyColor(exercise.difficulty)}
                          >
                            {getDifficultyText(exercise.difficulty)}
                          </Badge>
                          {completedExercises.has(exercise.id) && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <CardTitle className="text-lg">{exercise.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          {exercise.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {exercise.estimatedTime} min
                          </div>
                          <Badge variant="outline">
                            {exercise.language}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="python" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exercises.filter(e => e.language === 'python').map((exercise) => (
                    <Card 
                      key={exercise.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant="secondary"
                            className={getDifficultyColor(exercise.difficulty)}
                          >
                            {getDifficultyText(exercise.difficulty)}
                          </Badge>
                          {completedExercises.has(exercise.id) && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <CardTitle className="text-lg">{exercise.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          {exercise.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {exercise.estimatedTime} min
                          </div>
                          <Badge variant="outline">
                            {exercise.language}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exercises.filter(e => Array.from(completedExercises).includes(e.id)).map((exercise) => (
                    <Card 
                      key={exercise.id} 
                      className="cursor-pointer hover:shadow-lg transition-shadow border-green-200"
                      onClick={() => setSelectedExercise(exercise)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant="secondary"
                            className={getDifficultyColor(exercise.difficulty)}
                          >
                            {getDifficultyText(exercise.difficulty)}
                          </Badge>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <CardTitle className="text-lg">{exercise.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          {exercise.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {exercise.estimatedTime} min
                          </div>
                          <Badge variant="outline">
                            {exercise.language}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            {/* Exercise View */}
            <div className="mb-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedExercise(null)}
              >
                ← Back to Exercises
              </Button>
            </div>

            <CodePlayground
              title={selectedExercise.title}
              instructions={selectedExercise.instructions}
              initialCode={selectedExercise.initialCode}
              language={selectedExercise.language}
              solution={selectedExercise.solution}
              hints={selectedExercise.hints}
              testCases={selectedExercise.testCases}
              exerciseId={selectedExercise.id}
              onCompletion={handleExerciseCompletion}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default InteractiveCodingPage;