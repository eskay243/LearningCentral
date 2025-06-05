import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  RotateCcw, 
  Book, 
  Code, 
  Eye, 
  HelpCircle, 
  CheckCircle, 
  XCircle,
  Lightbulb,
  Clock,
  Trophy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

interface TestCase {
  name: string;
  test: string;
  expected: any;
}

interface CodePlaygroundProps {
  title: string;
  instructions: string;
  initialCode: string;
  language: 'javascript' | 'python';
  solution?: string;
  hints?: string[];
  testCases?: TestCase[];
  exerciseId?: number;
  onCompletion?: (exerciseId: number) => void;
}

interface TestResult {
  passed: boolean;
  expected: any;
  actual: any;
  testName: string;
}

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

const CodePlayground: React.FC<CodePlaygroundProps> = ({
  title,
  instructions,
  initialCode,
  language,
  solution,
  hints = [],
  testCases = [],
  exerciseId,
  onCompletion
}) => {
  const { toast } = useToast();
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('instructions');
  const [isRunning, setIsRunning] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure editor settings
    editor.updateOptions({
      fontSize: 14,
      lineHeight: 20,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      tabSize: 2,
    });

    // Add keyboard shortcuts
    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => handleRunCode()
    });

    editor.addAction({
      id: 'test-code',
      label: 'Test Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter],
      run: () => handleTestCode()
    });
  };

  const executeCodeMutation = useMutation({
    mutationFn: async ({ code, language }: { code: string; language: string }) => {
      const response = await apiRequest('POST', '/api/code/execute', { code, language });
      return response.json();
    },
    onSuccess: (result: ExecutionResult) => {
      setOutput(result.output || (result.error ? `Error: ${result.error}` : 'No output'));
      setActiveTab('output');
      
      if (result.success) {
        toast({
          title: 'Code executed successfully',
          description: `Execution time: ${result.executionTime}ms`
        });
      } else {
        toast({
          title: 'Execution failed',
          description: result.error || 'Unknown error',
          variant: 'destructive'
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Execution failed',
        description: error.message,
        variant: 'destructive'
      });
    },
    onSettled: () => {
      setIsRunning(false);
    }
  });

  const testCodeMutation = useMutation({
    mutationFn: async ({ code, language, tests }: { code: string; language: string; tests: TestCase[] }) => {
      const response = await apiRequest('POST', '/api/code/test', { code, language, tests });
      return response.json();
    },
    onSuccess: (result: { allPassed: boolean; testResults: TestResult[]; passedCount: number; totalCount: number }) => {
      setTestResults(result.testResults);
      setIsCorrect(result.allPassed);
      setActiveTab('tests');
      
      if (result.allPassed) {
        toast({
          title: 'All tests passed!',
          description: `${result.passedCount}/${result.totalCount} tests completed successfully`,
        });
        
        if (exerciseId && onCompletion) {
          onCompletion(exerciseId);
        }
      } else {
        toast({
          title: 'Some tests failed',
          description: `${result.passedCount}/${result.totalCount} tests passed`,
          variant: 'destructive'
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Testing failed',
        description: error.message,
        variant: 'destructive'
      });
    },
    onSettled: () => {
      setIsTesting(false);
    }
  });

  const handleRunCode = () => {
    if (!code.trim()) {
      toast({
        title: 'No code to run',
        description: 'Please write some code first',
        variant: 'destructive'
      });
      return;
    }

    setIsRunning(true);
    executeCodeMutation.mutate({ code, language });
  };

  const handleTestCode = () => {
    if (!code.trim()) {
      toast({
        title: 'No code to test',
        description: 'Please write some code first',
        variant: 'destructive'
      });
      return;
    }

    if (testCases.length === 0) {
      toast({
        title: 'No tests available',
        description: 'This exercise has no test cases',
        variant: 'destructive'
      });
      return;
    }

    setIsTesting(true);
    testCodeMutation.mutate({ code, language, tests: testCases });
  };

  const handleReset = () => {
    setCode(initialCode);
    setOutput('');
    setTestResults([]);
    setIsCorrect(false);
    setShowHint(false);
    setCurrentHint(0);
    toast({
      title: 'Code reset',
      description: 'Your code has been reset to the initial state.'
    });
  };

  const handleShowHint = () => {
    if (hints.length === 0) {
      toast({
        title: 'No hints available',
        description: 'This exercise has no hints',
        variant: 'destructive'
      });
      return;
    }
    setShowHint(true);
  };

  const nextHint = () => {
    if (currentHint < hints.length - 1) {
      setCurrentHint(currentHint + 1);
    }
  };

  const prevHint = () => {
    if (currentHint > 0) {
      setCurrentHint(currentHint - 1);
    }
  };

  return (
    <div className="code-playground border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b bg-gray-50 dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{language}</Badge>
              {isCorrect && (
                <Badge variant="default" className="bg-green-500">
                  <Trophy className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShowHint}
              disabled={hints.length === 0}
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Hint
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button 
              size="sm" 
              onClick={handleRunCode}
              disabled={isRunning}
            >
              <Play className="h-4 w-4 mr-1" />
              {isRunning ? 'Running...' : 'Run'}
            </Button>
            {testCases.length > 0 && (
              <Button 
                size="sm" 
                variant="secondary"
                onClick={handleTestCode}
                disabled={isTesting}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {isTesting ? 'Testing...' : 'Test'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="instructions" className="flex items-center gap-1">
              <Book className="h-4 w-4" />
              Instructions
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              Code
            </TabsTrigger>
            <TabsTrigger value="output" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Output
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-1" disabled={testCases.length === 0}>
              <CheckCircle className="h-4 w-4" />
              Tests ({testResults.filter(r => r.passed).length}/{testResults.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="instructions" className="p-0 m-0">
          <div className="p-6 h-[400px] overflow-auto">
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: instructions.replace(/\n/g, '<br>') }} />
            </div>
            {testCases.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Test Cases:</h4>
                <div className="space-y-2">
                  {testCases.map((test, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                      <div className="font-medium text-sm">{test.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Expected: <code>{JSON.stringify(test.expected)}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="code" className="p-0 m-0">
          <div className="relative">
            <Editor
              height="400px"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                lineHeight: 20,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                tabSize: 2,
              }}
            />
            {isCorrect && (
              <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/30 flex items-center justify-center">
                <Card className="p-6 max-w-md">
                  <h3 className="text-xl font-bold flex items-center mb-2">
                    <Trophy className="h-5 w-5 mr-2 text-green-500" />
                    Exercise Completed!
                  </h3>
                  <p className="mb-4">You've successfully completed this exercise. Great job!</p>
                  <Button onClick={() => setActiveTab('tests')}>
                    View Test Results
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="output" className="p-0 m-0">
          <ScrollArea className="h-[400px] w-full">
            <div className="p-4">
              <pre className="font-mono text-sm bg-black text-green-400 p-4 rounded overflow-auto">
                {output || 'Run your code to see the output here.'}
              </pre>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tests" className="p-0 m-0">
          <ScrollArea className="h-[400px] w-full">
            <div className="p-4 space-y-3">
              {testResults.length > 0 ? (
                testResults.map((result, index) => (
                  <Card key={index} className={`border ${result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{result.testName}</h4>
                        {result.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">Expected:</span>{' '}
                          <code className="bg-gray-100 px-1 rounded">{JSON.stringify(result.expected)}</code>
                        </div>
                        <div>
                          <span className="font-medium">Got:</span>{' '}
                          <code className="bg-gray-100 px-1 rounded">{JSON.stringify(result.actual)}</code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Run tests to see results here.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Hint Modal */}
      {showHint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Hint {currentHint + 1} of {hints.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{hints[currentHint]}</p>
              <div className="flex justify-between">
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={prevHint}
                    disabled={currentHint === 0}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={nextHint}
                    disabled={currentHint === hints.length - 1}
                  >
                    Next
                  </Button>
                </div>
                <Button size="sm" onClick={() => setShowHint(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CodePlayground;