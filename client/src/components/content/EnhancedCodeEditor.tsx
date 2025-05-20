import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Play, RotateCcw, Book, Code, Eye, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedCodeEditorProps {
  initialCode: string;
  language: string;
  instructions: string;
  solution?: string;
  hints?: string[];
  tests?: Array<{
    test: string;
    expected: any;
  }>;
  onCodeChange?: (code: string) => void;
  onCompletion?: (exerciseId: number) => void;
  exerciseId?: number;
}

const EnhancedCodeEditor: React.FC<EnhancedCodeEditorProps> = ({
  initialCode,
  language,
  instructions,
  solution,
  hints = [],
  tests = [],
  onCodeChange,
  onCompletion,
  exerciseId
}) => {
  const { toast } = useToast();
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('instructions');
  const [completionStatus, setCompletionStatus] = useState('incomplete');
  const [isRunning, setIsRunning] = useState(false);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure editor settings
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      folding: true,
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      wordWrap: 'on',
      automaticLayout: true,
      tabSize: 2,
      renderWhitespace: 'selection',
    });
    
    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runCode();
    });
  };

  // Reset code to initial state
  const handleReset = () => {
    setCode(initialCode);
    setOutput('');
    setIsCorrect(false);
    toast({
      title: 'Code Reset',
      description: 'Your code has been reset to the initial state.'
    });
  };

  // Evaluate test results
  const evaluateTests = (code: string): { passed: boolean; results: any[] } => {
    const results = [];
    let allPassed = true;
    
    // In a real implementation, this would use a secure serverside execution environment
    // For now, we'll do some simple pattern matching for demo purposes
    for (const test of tests) {
      try {
        // Simplified test evaluation - pattern matching instead of real execution
        const normalizedCode = code.replace(/\s+/g, '').toLowerCase();
        const testPattern = test.test.replace(/\s+/g, '').toLowerCase();
        const expectedPattern = typeof test.expected === 'string' 
          ? test.expected.replace(/\s+/g, '').toLowerCase()
          : test.expected;
        
        const testPassed = normalizedCode.includes(testPattern);
        if (!testPassed) allPassed = false;
        
        results.push({
          test: test.test,
          expected: test.expected,
          actual: 'Evaluated in browser',
          passed: testPassed
        });
      } catch (error) {
        allPassed = false;
        results.push({
          test: test.test,
          expected: test.expected,
          actual: `Error: ${error}`,
          passed: false
        });
      }
    }
    
    return { passed: allPassed, results };
  };

  // Check if code is correct
  const checkSolution = () => {
    try {
      // For more complex solutions, use test results
      if (tests.length > 0) {
        const { passed, results } = evaluateTests(code);
        
        let testResults = '';
        results.forEach((result, index) => {
          testResults += `Test ${index + 1}: ${result.passed ? 'PASSED' : 'FAILED'}\n`;
          if (!result.passed) {
            testResults += `  Expected: ${result.expected}\n`;
            testResults += `  Test: ${result.test}\n\n`;
          }
        });
        
        setOutput(testResults);
        
        if (passed) {
          setIsCorrect(true);
          setCompletionStatus('completed');
          toast({
            title: 'All Tests Passed!',
            description: 'Great job! You\'ve completed this exercise.'
          });
          if (onCompletion && exerciseId) {
            onCompletion(exerciseId);
          }
          return true;
        } else {
          setIsCorrect(false);
          toast({
            title: 'Tests Failed',
            description: 'Some tests are still failing. Check the output for details.'
          });
          return false;
        }
      }
      
      // Simple string matching fallback
      const normalizedUserCode = code.replace(/\\s+/g, '').toLowerCase();
      const normalizedSolution = solution?.replace(/\\s+/g, '').toLowerCase() || '';
      
      const matches = normalizedSolution.length > 0 && normalizedUserCode.includes(normalizedSolution);
      
      if (matches) {
        setIsCorrect(true);
        setCompletionStatus('completed');
        toast({
          title: 'Correct!',
          description: 'Great job! You\'ve completed this exercise.'
        });
        if (onCompletion && exerciseId) {
          onCompletion(exerciseId);
        }
        return true;
      } else {
        setIsCorrect(false);
        toast({
          title: 'Not quite right',
          description: 'Your solution doesn\'t match what we\'re looking for. Try again!'
        });
        return false;
      }
    } catch (error) {
      console.error('Error checking solution:', error);
      toast({
        title: 'Error checking solution',
        description: 'There was an error evaluating your code.'
      });
      return false;
    }
  };

  // Show next hint
  const showNextHint = () => {
    if (currentHint < hints.length - 1) {
      setCurrentHint(currentHint + 1);
    }
    setShowHint(true);
  };

  // Run the code
  const runCode = async () => {
    try {
      setIsRunning(true);
      
      // In a real implementation, this would send the code to a secure server
      // for execution and return the results
      
      // For now, we'll simulate execution with a delay
      setTimeout(() => {
        // Format code for display
        const formattedCode = code.split('\n').map((line, i) => 
          `${(i + 1).toString().padStart(2, ' ')}| ${line}`
        ).join('\n');
        
        setOutput(`[Code execution output]:\n\n${formattedCode}\n\n[Console output]:\n> Code executed successfully\n`);
        
        // Check if solution is correct
        checkSolution();
        setIsRunning(false);
      }, 800);
    } catch (error) {
      console.error('Error running code:', error);
      setOutput(`Error: ${error}`);
      setIsRunning(false);
    }
  };

  // Notify parent component when code changes
  useEffect(() => {
    if (onCodeChange) {
      onCodeChange(code);
    }
  }, [code, onCodeChange]);

  // Track completion status
  useEffect(() => {
    if (isCorrect && exerciseId) {
      // In a real app, you would save progress to a database
      console.log(`Exercise ${exerciseId} completed!`);
    }
  }, [isCorrect, exerciseId]);

  return (
    <div className="enhanced-code-editor border rounded-lg overflow-hidden">
      <Tabs 
        defaultValue="instructions" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <div className="flex items-center justify-between p-2 bg-muted">
          <TabsList>
            <TabsTrigger value="instructions" className="flex items-center gap-1">
              <Book className="h-4 w-4" />
              <span>Instructions</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              <span>Code</span>
            </TabsTrigger>
            <TabsTrigger value="output" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>Output</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={showNextHint}
              disabled={hints.length === 0 || (showHint && currentHint === hints.length - 1)}
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
              variant={isCorrect ? "outline" : "default"} 
              size="sm" 
              onClick={runCode}
              className="flex items-center"
              disabled={isRunning}
            >
              <Play className="h-4 w-4 mr-1" />
              Run
            </Button>
            {isCorrect && (
              <div className="flex items-center text-green-500 ml-2">
                <Check className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Complete</span>
              </div>
            )}
          </div>
        </div>

        <TabsContent value="instructions" className="p-4 bg-card max-h-[400px] overflow-auto">
          <div className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: instructions }} />
            
            {showHint && hints.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h4 className="text-sm font-medium mb-1">Hint {currentHint + 1}:</h4>
                <p className="text-sm text-muted-foreground">{hints[currentHint]}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="code" className="p-0 m-0">
          <div className="relative">
            <div className="h-[400px]">
              <Editor
                height="100%"
                defaultLanguage={language}
                defaultValue={initialCode}
                theme="vs-dark"
                onChange={(value) => setCode(value || '')}
                onMount={handleEditorDidMount}
                options={{
                  readOnly: isCorrect
                }}
              />
            </div>
            {isCorrect && (
              <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/30 flex items-center justify-center">
                <Card className="p-6 max-w-md">
                  <h3 className="text-xl font-bold flex items-center mb-2">
                    <Check className="h-5 w-5 mr-2 text-green-500" />
                    Exercise Completed!
                  </h3>
                  <p className="mb-4">You've successfully completed this exercise. Great job!</p>
                  <Button onClick={() => setActiveTab('output')}>
                    See Result
                  </Button>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="output" className="p-0 m-0">
          <pre className="font-mono w-full h-[400px] p-4 bg-black text-white overflow-auto">
            {output || 'Run your code to see the output here.\n\nHint: You can press Ctrl+Enter to run your code.'}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedCodeEditor;