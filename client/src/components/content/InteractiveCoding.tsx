import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Play, RotateCcw, Book, Code, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InteractiveCodingProps {
  initialCode: string;
  language: string;
  instructions: string;
  solution?: string;
  hints?: string[];
  tests?: Array<{
    test: string;
    expected: any;
  }>;
}

const InteractiveCoding: React.FC<InteractiveCodingProps> = ({
  initialCode,
  language,
  instructions,
  solution,
  hints = [],
  tests = []
}) => {
  const { toast } = useToast();
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('instructions');
  const [completionStatus, setCompletionStatus] = useState('incomplete');

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

  // Check if code is correct
  const checkSolution = () => {
    try {
      // For simple exercises, we can do basic string comparison
      const normalizedUserCode = code.replace(/\\s+/g, '').toLowerCase();
      const normalizedSolution = solution?.replace(/\\s+/g, '').toLowerCase() || '';
      
      // Basic comparison for now, in a real implementation this would execute tests
      if (normalizedUserCode.includes(normalizedSolution)) {
        setIsCorrect(true);
        setCompletionStatus('completed');
        toast({
          title: 'Correct!',
          description: 'Great job! You\'ve completed this exercise.'
        });
      } else {
        setIsCorrect(false);
        toast({
          title: 'Not quite right',
          description: 'Your solution doesn\'t match what we\'re looking for. Try again!'
        });
      }
    } catch (error) {
      console.error('Error checking solution:', error);
      toast({
        title: 'Error checking solution',
        description: 'There was an error evaluating your code.'
      });
    }
  };

  // Show next hint
  const showNextHint = () => {
    if (currentHint < hints.length - 1) {
      setCurrentHint(currentHint + 1);
    }
    setShowHint(true);
  };

  // Run the code (in a real application, this would execute the code)
  const runCode = () => {
    try {
      // In a real implementation, this would be replaced with actual code execution
      // For now, we'll just echo the code as output
      setOutput(`[Code execution output]:\n${code}`);
      
      // Also check if code is correct when running
      checkSolution();
    } catch (error) {
      console.error('Error running code:', error);
      setOutput(`Error: ${error}`);
    }
  };

  // Track completion status
  useEffect(() => {
    if (isCorrect) {
      // In a real app, you would save progress to a database
      console.log('Exercise completed!');
    }
  }, [isCorrect]);

  return (
    <div className="interactive-coding border rounded-lg overflow-hidden">
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

        <TabsContent value="instructions" className="p-4 bg-card">
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
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono w-full h-[300px] p-4 bg-black text-white focus:outline-none resize-none"
              spellCheck="false"
              disabled={isCorrect}
            />
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
          <pre className="font-mono w-full h-[300px] p-4 bg-black text-white overflow-auto">
            {output || 'Run your code to see the output here.'}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InteractiveCoding;