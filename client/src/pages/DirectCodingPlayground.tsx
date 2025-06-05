import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Code, Trophy } from 'lucide-react';
import CodePlayground from '@/components/coding/CodePlayground';

interface Exercise {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  language: 'javascript' | 'python';
  starterCode: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    description: string;
  }>;
  hints: string[];
}

const sampleExercises: Exercise[] = [
  {
    id: 1,
    title: "Hello World",
    description: "Write a function that returns 'Hello, World!'",
    difficulty: "beginner",
    estimatedTime: "5 min",
    language: "javascript",
    starterCode: `function helloWorld() {
  // Your code here
  
}`,
    testCases: [
      {
        input: "",
        expectedOutput: "Hello, World!",
        description: "Should return the greeting"
      }
    ],
    hints: [
      "Remember to return a string",
      "The exact text should be 'Hello, World!'"
    ]
  },
  {
    id: 2,
    title: "Sum Two Numbers",
    description: "Create a function that adds two numbers together",
    difficulty: "beginner",
    estimatedTime: "10 min",
    language: "javascript",
    starterCode: `function sum(a, b) {
  // Your code here
  
}`,
    testCases: [
      {
        input: "sum(2, 3)",
        expectedOutput: "5",
        description: "Should add two positive numbers"
      },
      {
        input: "sum(-1, 1)",
        expectedOutput: "0",
        description: "Should handle negative numbers"
      }
    ],
    hints: [
      "Use the + operator to add numbers",
      "Make sure to return the result"
    ]
  }
];

const DirectCodingPlayground: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (selectedExercise) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedExercise(null)}
            className="mb-4"
          >
            ← Back to Exercises
          </Button>
          <CodePlayground 
            title={selectedExercise.title}
            instructions={selectedExercise.description}
            initialCode={selectedExercise.starterCode}
            language={selectedExercise.language}
            hints={selectedExercise.hints}
            testCases={selectedExercise.testCases.map(tc => ({
              name: tc.description,
              test: tc.input,
              expected: tc.expectedOutput
            }))}
            exerciseId={selectedExercise.id}
            onCompletion={(exerciseId) => {
              console.log('Exercise completed!', exerciseId);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Interactive Coding Playground
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Practice your coding skills with hands-on exercises
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleExercises.map((exercise) => (
            <Card 
              key={exercise.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-white dark:bg-gray-800"
              onClick={() => setSelectedExercise(exercise)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {exercise.title}
                  </CardTitle>
                  <Badge className={getDifficultyColor(exercise.difficulty)}>
                    {exercise.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                  {exercise.description}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{exercise.estimatedTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Code className="w-4 h-4" />
                    <span className="capitalize">{exercise.language}</span>
                  </div>
                </div>

                <Button className="w-full" size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Start Exercise
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <Trophy className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Ready for More Challenges?
              </h3>
              <p className="text-purple-700 dark:text-purple-300 mb-4">
                Complete these exercises to unlock advanced coding challenges and projects.
              </p>
              <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300">
                View All Exercises
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DirectCodingPlayground;