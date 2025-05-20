import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, BookOpen, Code, CheckCircle } from 'lucide-react';
import InteractiveCoding from '@/components/content/InteractiveCoding';

// Mock exercise data
const EXERCISES = [
  {
    id: 1,
    title: 'Introduction to HTML',
    description: 'Learn the basics of HTML structure and elements',
    progress: 0,
    completed: false,
    modules: [
      {
        id: 101,
        title: 'HTML Document Structure',
        exercises: [
          {
            id: 1001,
            title: 'Creating Your First HTML Page',
            instructions: `
              <h1>Creating Your First HTML Page</h1>
              <p>HTML (HyperText Markup Language) is the standard markup language for creating web pages.</p>
              <p>Every HTML document has a required structure that includes the following declarations and elements:</p>
              <ul>
                <li><code>&lt;!DOCTYPE html&gt;</code> - Defines the document type</li>
                <li><code>&lt;html&gt;</code> - The root element of an HTML page</li>
                <li><code>&lt;head&gt;</code> - Contains meta information about the document</li>
                <li><code>&lt;title&gt;</code> - Specifies a title for the document</li>
                <li><code>&lt;body&gt;</code> - Contains the visible page content</li>
              </ul>
              <h3>Your Task:</h3>
              <p>Complete the HTML document structure in the editor.</p>
            `,
            initialCode: `<!DOCTYPE html>
<html>
  <head>
    <!-- Add the title element here -->
    
  </head>
  <body>
    <!-- Add an h1 element with the text "My First Web Page" -->
    
    <!-- Add a paragraph element with some text -->
    
  </body>
</html>`,
            solution: `<!DOCTYPEhtml><html><head><title>MyFirstWebPage</title></head><body><h1>MyFirstWebPage</h1><p>`,
            language: 'html',
            hints: [
              'The title element goes inside the head element and defines the title shown in the browser tab.',
              'The h1 element represents the main heading and should contain the text "My First Web Page".',
              'The p element represents a paragraph. You can add any text you want inside it.'
            ],
            tests: [
              {
                test: 'document.title',
                expected: 'My First Web Page'
              },
              {
                test: 'document.querySelector("h1").textContent',
                expected: 'My First Web Page'
              },
              {
                test: 'document.querySelector("p") !== null',
                expected: true
              }
            ]
          },
          {
            id: 1002,
            title: 'Working with HTML Lists',
            instructions: `
              <h1>Working with HTML Lists</h1>
              <p>HTML offers several ways to specify lists of information:</p>
              <ul>
                <li><strong>Ordered lists</strong> (&lt;ol&gt;) - Create a list where each item is numbered</li>
                <li><strong>Unordered lists</strong> (&lt;ul&gt;) - Create a list with bullet points</li>
                <li><strong>List items</strong> (&lt;li&gt;) - Define items in both ordered and unordered lists</li>
              </ul>
              <h3>Your Task:</h3>
              <p>Create an unordered list with three favorite foods.</p>
            `,
            initialCode: `<!DOCTYPE html>
<html>
  <head>
    <title>HTML Lists</title>
  </head>
  <body>
    <h1>My Favorite Foods</h1>
    
    <!-- Create an unordered list with at least 3 favorite foods -->
    
    
  </body>
</html>`,
            solution: `<ul><li>`,
            language: 'html',
            hints: [
              'Use the <ul> tag to create an unordered list.',
              'Each item in the list should be wrapped in <li> tags.',
              'Make sure to close all your tags properly.'
            ]
          }
        ]
      },
      {
        id: 102,
        title: 'HTML Text Formatting',
        exercises: [
          {
            id: 2001,
            title: 'Text Formatting Elements',
            instructions: `
              <h1>Text Formatting Elements</h1>
              <p>HTML provides several elements for formatting text:</p>
              <ul>
                <li><code>&lt;b&gt;</code> - Bold text</li>
                <li><code>&lt;strong&gt;</code> - Important text (typically displayed as bold)</li>
                <li><code>&lt;i&gt;</code> - Italic text</li>
                <li><code>&lt;em&gt;</code> - Emphasized text (typically displayed as italic)</li>
                <li><code>&lt;mark&gt;</code> - Marked/highlighted text</li>
                <li><code>&lt;small&gt;</code> - Smaller text</li>
              </ul>
              <h3>Your Task:</h3>
              <p>Format the given paragraph using appropriate HTML text formatting elements.</p>
            `,
            initialCode: `<!DOCTYPE html>
<html>
  <head>
    <title>Text Formatting</title>
  </head>
  <body>
    <h1>About HTML</h1>
    
    <p>
      HTML stands for HyperText Markup Language. It is the standard markup language for creating web pages. 
      HTML describes the structure of a web page and consists of a series of elements that tell the browser 
      how to display the content.
    </p>
    
    <!-- Format the paragraph above. Make "HTML" bold, "HyperText Markup Language" italic, 
         and highlight "standard markup language" -->
    
  </body>
</html>`,
            solution: `<b>HTML</b><i>HyperTextMarkupLanguage</i><mark>standardmarkuplanguage</mark>`,
            language: 'html',
            hints: [
              'Use <b> or <strong> tags to make "HTML" bold.',
              'Use <i> or <em> tags to make "HyperText Markup Language" italic.',
              'Use <mark> tags to highlight "standard markup language".'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Introduction to CSS',
    description: 'Learn how to style HTML elements with CSS',
    progress: 0,
    completed: false,
    modules: [
      {
        id: 201,
        title: 'CSS Basics',
        exercises: [
          {
            id: 3001,
            title: 'CSS Selectors',
            instructions: `
              <h1>CSS Selectors</h1>
              <p>CSS selectors are used to "find" (or select) the HTML elements you want to style.</p>
              <p>There are several types of selectors:</p>
              <ul>
                <li><strong>Element selector</strong> - Selects elements based on the element name (e.g., p, h1, div)</li>
                <li><strong>ID selector</strong> - Selects an element with a specific ID (e.g., #header)</li>
                <li><strong>Class selector</strong> - Selects elements with a specific class (e.g., .intro)</li>
              </ul>
              <h3>Your Task:</h3>
              <p>Add CSS to style the HTML elements using appropriate selectors.</p>
            `,
            initialCode: `<!DOCTYPE html>
<html>
  <head>
    <title>CSS Selectors</title>
    <style>
      /* Add your CSS styles here */
      
      /* 1. Make all paragraphs blue */
      
      /* 2. Make the element with id="main-title" red and 24px font size */
      
      /* 3. Make all elements with class="highlight" yellow background */
      
    </style>
  </head>
  <body>
    <h1 id="main-title">Learning CSS Selectors</h1>
    
    <p>This is a paragraph. It should be blue.</p>
    
    <p class="highlight">This paragraph should be blue with a yellow background.</p>
    
    <div class="highlight">This div should have a yellow background.</div>
  </body>
</html>`,
            solution: `p{color:blue}#main-title{color:red;font-size:24px}.highlight{background-color:yellow}`,
            language: 'css',
            hints: [
              'Use "p" to select all paragraph elements.',
              'Use "#main-title" to select the element with id="main-title".',
              'Use ".highlight" to select all elements with class="highlight".'
            ]
          }
        ]
      }
    ]
  },
  {
    id: 3,
    title: 'JavaScript Fundamentals',
    description: 'Learn the basics of JavaScript programming',
    progress: 0,
    completed: false,
    modules: [
      {
        id: 301,
        title: 'JavaScript Basics',
        exercises: [
          {
            id: 4001,
            title: 'Variables and Data Types',
            instructions: `
              <h1>Variables and Data Types</h1>
              <p>JavaScript variables are containers for storing data values. You can declare variables using <code>var</code>, <code>let</code>, or <code>const</code>.</p>
              <p>JavaScript has several data types:</p>
              <ul>
                <li><strong>String</strong> - For text values (e.g., "Hello")</li>
                <li><strong>Number</strong> - For numeric values (e.g., 100, 3.14)</li>
                <li><strong>Boolean</strong> - For true/false values</li>
                <li><strong>Object</strong> - For complex data structures</li>
                <li><strong>Array</strong> - For lists of values</li>
              </ul>
              <h3>Your Task:</h3>
              <p>Declare variables using appropriate data types as instructed in the comments.</p>
            `,
            initialCode: `// 1. Declare a variable named 'name' and assign your name to it as a string


// 2. Declare a variable named 'age' and assign your age to it as a number


// 3. Declare a constant named 'PI' and assign 3.14 to it


// 4. Declare a variable named 'isStudent' and assign a boolean value


// 5. Create an array named 'colors' with at least three color names as strings


// Don't modify the code below
console.log('Name:', name);
console.log('Age:', age);
console.log('PI:', PI);
console.log('Is Student:', isStudent);
console.log('Colors:', colors);`,
            solution: `let name="var name=let age=const PI=3.14let isStudent=let colors=["`,
            language: 'javascript',
            hints: [
              'Use let or const to declare variables.',
              'Strings must be enclosed in quotes (single or double).',
              'Arrays are declared using square brackets [].',
              'Boolean values are either true or false (without quotes).'
            ]
          }
        ]
      }
    ]
  }
];

const InteractiveLearning: React.FC = () => {
  const [currentCourseIndex, setCurrentCourseIndex] = useState(0);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  
  const currentCourse = EXERCISES[currentCourseIndex];
  const currentModule = currentCourse.modules[currentModuleIndex];
  const currentExercise = currentModule.exercises[currentExerciseIndex];
  
  // Calculate progress
  const totalExercises = currentCourse.modules.reduce(
    (total, module) => total + module.exercises.length, 
    0
  );
  const progress = (completedExercises.length / totalExercises) * 100;
  
  const handleNext = () => {
    // If not the last exercise in the module
    if (currentExerciseIndex < currentModule.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } 
    // If not the last module in the course
    else if (currentModuleIndex < currentCourse.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentExerciseIndex(0);
    }
    // If last module and last exercise
    else if (currentCourseIndex < EXERCISES.length - 1) {
      setCurrentCourseIndex(currentCourseIndex + 1);
      setCurrentModuleIndex(0);
      setCurrentExerciseIndex(0);
    }
  };
  
  const handlePrevious = () => {
    // If not the first exercise in the module
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    } 
    // If not the first module in the course
    else if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
      setCurrentExerciseIndex(currentCourse.modules[currentModuleIndex - 1].exercises.length - 1);
    }
    // If first module and first exercise but not first course
    else if (currentCourseIndex > 0) {
      setCurrentCourseIndex(currentCourseIndex - 1);
      const prevCourse = EXERCISES[currentCourseIndex - 1];
      setCurrentModuleIndex(prevCourse.modules.length - 1);
      setCurrentExerciseIndex(
        prevCourse.modules[prevCourse.modules.length - 1].exercises.length - 1
      );
    }
  };
  
  const handleExerciseComplete = (exerciseId: number) => {
    if (!completedExercises.includes(exerciseId)) {
      setCompletedExercises([...completedExercises, exerciseId]);
    }
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-2">Interactive Learning</h1>
      <p className="text-muted-foreground mb-6">Learn by doing with interactive exercises</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with modules and lessons */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{currentCourse.title}</CardTitle>
              <CardDescription>{currentCourse.description}</CardDescription>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {currentCourse.modules.map((module, moduleIndex) => (
                  <div key={module.id} className="py-2 px-4">
                    <div 
                      className={`font-medium ${moduleIndex === currentModuleIndex ? 'text-primary' : ''}`}
                    >
                      {module.title}
                    </div>
                    <ul className="mt-1 space-y-1">
                      {module.exercises.map((exercise, exerciseIndex) => (
                        <li key={exercise.id}>
                          <button 
                            className={`text-sm flex items-center w-full text-left py-1 px-2 rounded hover:bg-muted ${
                              moduleIndex === currentModuleIndex && 
                              exerciseIndex === currentExerciseIndex ? 
                              'bg-muted' : ''
                            }`}
                            onClick={() => {
                              setCurrentModuleIndex(moduleIndex);
                              setCurrentExerciseIndex(exerciseIndex);
                            }}
                          >
                            {completedExercises.includes(exercise.id) ? (
                              <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                            ) : (
                              <div className="h-3 w-3 mr-2 rounded-full border border-muted-foreground" />
                            )}
                            <span className="truncate">{exercise.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{currentExercise.title}</CardTitle>
                <CardDescription>
                  {currentModule.title} • Exercise {currentExerciseIndex + 1} of {currentModule.exercises.length}
                </CardDescription>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrevious}
                  disabled={currentCourseIndex === 0 && currentModuleIndex === 0 && currentExerciseIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNext}
                  disabled={
                    currentCourseIndex === EXERCISES.length - 1 && 
                    currentModuleIndex === currentCourse.modules.length - 1 && 
                    currentExerciseIndex === currentModule.exercises.length - 1
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <InteractiveCoding
                initialCode={currentExercise.initialCode}
                language={currentExercise.language}
                instructions={currentExercise.instructions}
                solution={currentExercise.solution}
                hints={currentExercise.hints}
                tests={currentExercise.tests}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InteractiveLearning;