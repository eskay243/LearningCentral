import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SimpleContentNav from '@/components/content/SimpleContentNav';
import SimpleContentSearch from '@/components/content/SimpleContentSearch';
import SimpleContentExport from '@/components/content/SimpleContentExport';
import { Button } from '@/components/ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data for demonstration
const MOCK_MODULES = [
  {
    id: 1,
    title: 'Introduction to Web Development',
    isCompleted: false,
    lessons: [
      {
        id: 101,
        title: 'Getting Started with HTML',
        moduleId: 1,
        isCompleted: true,
        contentType: 'text',
      },
      {
        id: 102,
        title: 'CSS Fundamentals',
        moduleId: 1,
        isCompleted: true,
        contentType: 'text',
      },
      {
        id: 103,
        title: 'JavaScript Basics',
        moduleId: 1,
        isCompleted: false,
        contentType: 'text',
      }
    ]
  },
  {
    id: 2,
    title: 'Frontend Frameworks',
    isCompleted: false,
    lessons: [
      {
        id: 201,
        title: 'Introduction to React',
        moduleId: 2,
        isCompleted: false,
        contentType: 'video',
      },
      {
        id: 202,
        title: 'React Hooks',
        moduleId: 2,
        isCompleted: false,
        contentType: 'text',
      },
      {
        id: 203,
        title: 'Building a React Project',
        moduleId: 2,
        isCompleted: false,
        contentType: 'text',
      }
    ]
  }
];

// Mock lesson content
const MOCK_LESSON_CONTENT: Record<number, {
  title: string;
  content: string;
  contentType: string;
  courseId: number;
  courseName: string;
}> = {
  101: {
    title: 'Getting Started with HTML',
    content: `
      <h1>Getting Started with HTML</h1>
      <p>HTML (Hypertext Markup Language) is the standard markup language for documents designed to be displayed in a web browser.</p>
      
      <h2>Basic Structure</h2>
      <p>An HTML document has a required structure that includes the following declaration and elements:</p>
      
      <pre><code>
&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
  &lt;title&gt;Page Title&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;h1&gt;My First Heading&lt;/h1&gt;
  &lt;p&gt;My first paragraph.&lt;/p&gt;
&lt;/body&gt;
&lt;/html&gt;
      </code></pre>
      
      <h2>HTML Elements</h2>
      <p>HTML elements are represented by tags, written using angle brackets. Tags come in pairs like &lt;h1&gt; and &lt;/h1&gt;.</p>
      
      <h3>Common HTML Elements:</h3>
      <ul>
        <li>&lt;h1&gt; to &lt;h6&gt; - Headings</li>
        <li>&lt;p&gt; - Paragraph</li>
        <li>&lt;a&gt; - Anchor (for links)</li>
        <li>&lt;img&gt; - Image</li>
        <li>&lt;ul&gt;, &lt;ol&gt;, &lt;li&gt; - Lists</li>
        <li>&lt;div&gt; - Division or section</li>
        <li>&lt;span&gt; - Inline container</li>
      </ul>
    `,
    contentType: 'text',
    courseId: 1,
    courseName: 'Web Development Fundamentals',
  },
  102: {
    title: 'CSS Fundamentals',
    content: `
      <h1>CSS Fundamentals</h1>
      <p>CSS (Cascading Style Sheets) is a stylesheet language used to describe the presentation of a document written in HTML.</p>
      
      <h2>CSS Syntax</h2>
      <p>A CSS rule consists of a selector and a declaration block:</p>
      
      <pre><code>
selector {
  property: value;
  property: value;
}
      </code></pre>
      
      <h2>CSS Selectors</h2>
      <p>CSS selectors are used to "find" (or select) the HTML elements you want to style.</p>
      
      <h3>Common CSS Selectors:</h3>
      <ul>
        <li>Element selector (e.g., p {})</li>
        <li>ID selector (e.g., #id {})</li>
        <li>Class selector (e.g., .class {})</li>
        <li>Universal selector (e.g., * {})</li>
        <li>Attribute selector (e.g., [attribute=value] {})</li>
      </ul>
      
      <h2>CSS Box Model</h2>
      <p>All HTML elements can be considered as boxes. In CSS, the term "box model" is used when talking about design and layout.</p>
      
      <p>The CSS box model is essentially a box that wraps around every HTML element. It consists of: margins, borders, padding, and the actual content.</p>
    `,
    contentType: 'text',
    courseId: 1,
    courseName: 'Web Development Fundamentals',
  },
  103: {
    title: 'JavaScript Basics',
    content: `
      <h1>JavaScript Basics</h1>
      <p>JavaScript is a programming language that enables interactive web pages and is an essential part of web development.</p>
      
      <h2>Variables and Data Types</h2>
      <p>Variables are containers for storing data values. In JavaScript, you can declare variables using var, let, or const.</p>
      
      <pre><code>
// Variable declaration
let message = "Hello World";
const PI = 3.14159;
var oldWay = "This is the old way";

// Data types
let number = 42;          // Number
let string = "Text";      // String
let boolean = true;       // Boolean
let array = [1, 2, 3];    // Array
let object = {            // Object
  name: "John", 
  age: 30
};
let nothing = null;       // Null
let undef;                // Undefined
      </code></pre>
      
      <h2>Functions</h2>
      <p>Functions are blocks of code designed to perform a particular task. They are executed when "called" (invoked).</p>
      
      <pre><code>
// Function declaration
function greet(name) {
  return "Hello, " + name + "!";
}

// Function expression
const add = function(a, b) {
  return a + b;
};

// Arrow function
const multiply = (a, b) => a * b;
      </code></pre>
    `,
    contentType: 'text',
    courseId: 1,
    courseName: 'Web Development Fundamentals',
  },
  201: {
    title: 'Introduction to React',
    content: `
      <h1>Introduction to React</h1>
      <p>React is a JavaScript library for building user interfaces, particularly single-page applications.</p>
      
      <h2>Key Concepts</h2>
      <ul>
        <li><strong>Virtual DOM:</strong> React creates a virtual DOM in memory, where it does all the necessary manipulating, before making the changes in the browser DOM.</li>
        <li><strong>JSX:</strong> JSX is a syntax extension to JavaScript. It looks like HTML but it's actually JavaScript.</li>
        <li><strong>Components:</strong> Components are the building blocks of any React application.</li>
        <li><strong>Props:</strong> Props are inputs to components. They are data passed from a parent component to a child component.</li>
        <li><strong>State:</strong> State is an object that determines how a component renders and behaves.</li>
      </ul>
    `,
    contentType: 'text',
    courseId: 2,
    courseName: 'Frontend Frameworks',
  },
  202: {
    title: 'React Hooks',
    content: `
      <h1>React Hooks</h1>
      <p>Hooks are functions that let you "hook into" React state and lifecycle features from function components.</p>
      
      <h2>useState</h2>
      <p>The useState hook lets you add state to function components.</p>
      
      <pre><code>
import React, { useState } from 'react';

function Counter() {
  // Declare a state variable 'count' with initial value 0
  const [count, setCount] = useState(0);
  
  return (
    &lt;div&gt;
      &lt;p&gt;You clicked {count} times&lt;/p&gt;
      &lt;button onClick={() => setCount(count + 1)}&gt;
        Click me
      &lt;/button&gt;
    &lt;/div&gt;
  );
}
      </code></pre>
    `,
    contentType: 'text',
    courseId: 2,
    courseName: 'Frontend Frameworks',
  },
  203: {
    title: 'Building a React Project',
    content: `
      <h1>Building a React Project</h1>
      <p>This lesson will guide you through setting up a React project and building a simple application.</p>
      
      <h2>Setting Up a React Project</h2>
      <p>The easiest way to start with React is using Create React App:</p>
      
      <pre><code>
# Create a new React application
npx create-react-app my-app

# Navigate to the project directory
cd my-app

# Start the development server
npm start
      </code></pre>
    `,
    contentType: 'text',
    courseId: 2,
    courseName: 'Frontend Frameworks',
  }
};

const ContentDemo: React.FC = () => {
  const { toast } = useToast();
  const [currentLessonId, setCurrentLessonId] = useState<number>(101); // Start with the first lesson
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const currentLesson = MOCK_LESSON_CONTENT[currentLessonId];
  
  const handleLessonSelect = (lessonId: number) => {
    setCurrentLessonId(lessonId);
    setIsBookmarked(false); // Reset bookmark state when changing lessons
  };
  
  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    
    toast({
      title: isBookmarked ? 'Bookmark Removed' : 'Bookmark Added',
      description: isBookmarked 
        ? `Removed bookmark for "${currentLesson.title}"` 
        : `Added bookmark for "${currentLesson.title}"`,
    });
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Content Delivery System Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation sidebar */}
        <div className="md:col-span-1 border rounded-lg p-4 bg-card">
          <h2 className="text-xl font-semibold mb-4">Course Navigation</h2>
          <SimpleContentNav 
            modules={MOCK_MODULES} 
            currentLessonId={currentLessonId}
            onLessonSelect={handleLessonSelect}
          />
        </div>
        
        {/* Main content area */}
        <div className="md:col-span-3 border rounded-lg p-4 bg-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-semibold">{currentLesson.title}</h2>
              <p className="text-muted-foreground">{currentLesson.courseName}</p>
            </div>
            
            <div className="flex space-x-2">
              {/* Search button */}
              <SimpleContentSearch 
                onResultClick={(result) => {
                  if (result.lessonId) {
                    handleLessonSelect(result.lessonId);
                  }
                }}
              />
              
              {/* Bookmark button */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleBookmark}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
              
              {/* Export button */}
              <SimpleContentExport
                id={currentLessonId}
                title={currentLesson.title}
                content={currentLesson.content}
                contentType={currentLesson.contentType}
                courseId={currentLesson.courseId}
                courseName={currentLesson.courseName}
              />
            </div>
          </div>
          
          {/* Content tabs */}
          <Tabs defaultValue="content">
            <TabsList className="mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="discussions">Discussions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="pt-2">
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: currentLesson.content }}
              />
            </TabsContent>
            
            <TabsContent value="resources" className="pt-2">
              <div className="flex flex-col space-y-4">
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium">Supplementary Reading</h3>
                  <p className="text-muted-foreground">PDF document with additional information</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium">Practice Exercises</h3>
                  <p className="text-muted-foreground">Coding exercises to reinforce concepts</p>
                </div>
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium">Cheat Sheet</h3>
                  <p className="text-muted-foreground">Quick reference guide</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="discussions" className="pt-2">
              <div className="flex flex-col space-y-4">
                <p className="text-muted-foreground">No discussions yet. Be the first to start a discussion!</p>
                <div className="flex">
                  <textarea 
                    className="flex-1 p-2 border rounded-md" 
                    placeholder="Start a new discussion..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end">
                  <Button>Post Discussion</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ContentDemo;