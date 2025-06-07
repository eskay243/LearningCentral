import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Play, 
  RotateCcw, 
  Lightbulb, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trophy,
  Code,
  Terminal,
  FileText,
  Zap
} from "lucide-react";
import Editor from "@monaco-editor/react";

interface CodingChallenge {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  language: string;
  starterCode: string;
  testCases: TestCase[];
  hints: Hint[];
  timeLimit: number;
  maxAttempts: number;
  points: number;
  tags: string[];
  prerequisites: string[];
  learningObjectives: string[];
}

interface TestCase {
  id: string;
  input: any;
  expectedOutput: any;
  isHidden: boolean;
  description?: string;
}

interface Hint {
  level: number;
  text: string;
  codeSnippet?: string;
  penaltyPoints: number;
}

interface ExecutionResult {
  status: string;
  output: string;
  errors?: string;
  executionTime: number;
  memoryUsed: number;
  testResults: TestResult[];
  score: number;
}

interface TestResult {
  testId: string;
  passed: boolean;
  input: any;
  expectedOutput: any;
  actualOutput: any;
  executionTime: number;
}

export default function InteractiveCodingChallenge() {
  const { challengeId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const editorRef = useRef<any>(null);
  
  const [code, setCode] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [startTime] = useState(Date.now());

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Fetch challenge data
  const { data: challenge, isLoading } = useQuery<CodingChallenge>({
    queryKey: [`/api/coding-challenges/${challengeId}`],
    enabled: !!challengeId,
  });

  // Initialize code when challenge loads
  useEffect(() => {
    if (challenge && !code) {
      setCode(challenge.starterCode || "");
    }
  }, [challenge, code]);

  // Execute code mutation
  const executeCodeMutation = useMutation({
    mutationFn: async (codeToRun: string) => {
      const response = await apiRequest("POST", `/api/coding-challenges/${challengeId}/execute`, {
        code: codeToRun,
        language: challenge?.language,
        sessionId,
      });
      return response.json();
    },
    onSuccess: (result: ExecutionResult) => {
      setExecutionResult(result);
      setAttempts(prev => prev + 1);
      
      if (result.status === "success" && result.testResults.every(t => t.passed)) {
        toast({
          title: "Congratulations! 🎉",
          description: `All tests passed! Score: ${result.score}/${challenge?.points}`,
        });
      } else if (result.status === "error") {
        toast({
          title: "Execution Error",
          description: "Your code has syntax or runtime errors.",
          variant: "destructive",
        });
      } else {
        const passedTests = result.testResults.filter(t => t.passed).length;
        const totalTests = result.testResults.length;
        toast({
          title: "Tests Completed",
          description: `${passedTests}/${totalTests} tests passed.`,
          variant: passedTests === totalTests ? "default" : "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Execution Failed",
        description: "Failed to execute code. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit solution mutation
  const submitSolutionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/coding-challenges/${challengeId}/submit`, {
        code,
        language: challenge?.language,
        hintsUsed,
        timeSpent,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solution Submitted!",
        description: "Your solution has been submitted for grading.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/coding-challenges/${challengeId}/progress`] });
    },
  });

  // Get hint mutation
  const getHintMutation = useMutation({
    mutationFn: async (hintLevel: number) => {
      const response = await apiRequest("POST", `/api/coding-challenges/${challengeId}/hint`, {
        hintLevel,
      });
      return response.json();
    },
    onSuccess: (hint: Hint) => {
      setHintsUsed(prev => prev + 1);
      toast({
        title: "Hint Unlocked",
        description: hint.text,
        duration: 8000,
      });
    },
  });

  const handleRunCode = () => {
    if (!code.trim()) {
      toast({
        title: "No Code",
        description: "Please write some code before running.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    executeCodeMutation.mutate(code);
    setTimeout(() => setIsRunning(false), 1000);
  };

  const handleReset = () => {
    setCode(challenge?.starterCode || "");
    setExecutionResult(null);
    if (editorRef.current) {
      editorRef.current.setValue(challenge?.starterCode || "");
    }
  };

  const handleGetHint = () => {
    if (challenge && hintsUsed < challenge.hints.length) {
      getHintMutation.mutate(hintsUsed + 1);
    }
  };

  const handleSubmit = () => {
    if (!executionResult || !executionResult.testResults.every(t => t.passed)) {
      toast({
        title: "Cannot Submit",
        description: "Please ensure all tests pass before submitting.",
        variant: "destructive",
      });
      return;
    }
    submitSolutionMutation.mutate();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>Challenge not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const timeRemaining = challenge.timeLimit ? Math.max(0, challenge.timeLimit - timeSpent) : null;
  const progressPercentage = executionResult ? 
    Math.round((executionResult.testResults.filter(t => t.passed).length / executionResult.testResults.length) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{challenge.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getDifficultyColor(challenge.difficulty)}>
                {challenge.difficulty}
              </Badge>
              <Badge variant="outline">
                <Trophy className="w-3 h-3 mr-1" />
                {challenge.points} pts
              </Badge>
              <Badge variant="outline">
                <Code className="w-3 h-3 mr-1" />
                {challenge.language}
              </Badge>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(timeSpent)}
              </div>
              <div>Attempts: {attempts}/{challenge.maxAttempts}</div>
              <div>Hints: {hintsUsed}/{challenge.hints.length}</div>
            </div>
            {timeRemaining !== null && (
              <div className="mt-1">
                <Progress 
                  value={(timeRemaining / challenge.timeLimit) * 100} 
                  className="w-48"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {formatTime(timeRemaining)} remaining
                </div>
              </div>
            )}
          </div>
        </div>

        {progressPercentage > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Test Progress</span>
              <span>{progressPercentage}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Problem Description */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Problem Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{challenge.description}</p>
              </div>
              
              {challenge.tags.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Tags:</div>
                  <div className="flex flex-wrap gap-1">
                    {challenge.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {challenge.learningObjectives.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Learning Objectives:</div>
                  <ul className="text-sm space-y-1">
                    {challenge.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Cases */}
          <Card>
            <CardHeader>
              <CardTitle>Test Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {challenge.testCases.filter(tc => !tc.isHidden).map((testCase, index) => (
                  <div key={testCase.id} className="border rounded-lg p-3">
                    <div className="text-sm font-medium mb-2">Test Case {index + 1}</div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="font-medium text-muted-foreground">Input:</div>
                        <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(testCase.input, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Expected Output:</div>
                        <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(testCase.expectedOutput, null, 2)}
                        </pre>
                      </div>
                    </div>
                    {testCase.description && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {testCase.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hints */}
          {challenge.hints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Hints
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGetHint}
                    disabled={hintsUsed >= challenge.hints.length || getHintMutation.isPending}
                  >
                    Get Hint ({hintsUsed}/{challenge.hints.length})
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {challenge.hints.slice(0, hintsUsed).map((hint, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950">
                      <div className="text-sm font-medium mb-2">Hint {index + 1}</div>
                      <p className="text-sm">{hint.text}</p>
                      {hint.codeSnippet && (
                        <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-x-auto">
                          {hint.codeSnippet}
                        </pre>
                      )}
                      {hint.penaltyPoints > 0 && (
                        <div className="text-xs text-orange-600 mt-1">
                          Penalty: -{hint.penaltyPoints} points
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Code Editor and Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Code Editor
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                  <Button
                    onClick={handleRunCode}
                    disabled={isRunning || executeCodeMutation.isPending}
                    size="sm"
                  >
                    {isRunning ? (
                      <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-1" />
                    ) : (
                      <Play className="w-4 h-4 mr-1" />
                    )}
                    Run Code
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Editor
                  height="400px"
                  language={challenge.language}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  onMount={(editor) => {
                    editorRef.current = editor;
                  }}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    wordWrap: "on",
                    automaticLayout: true,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Execution Results */}
          {executionResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tests" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="tests">Test Results</TabsTrigger>
                    <TabsTrigger value="output">Output</TabsTrigger>
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="tests" className="mt-4">
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {executionResult.testResults.map((result, index) => (
                          <div key={result.testId} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Test {index + 1}</span>
                              {result.passed ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <div className="font-medium text-muted-foreground">Input:</div>
                                <pre className="bg-muted p-1 rounded mt-1">
                                  {JSON.stringify(result.input)}
                                </pre>
                              </div>
                              <div>
                                <div className="font-medium text-muted-foreground">Expected:</div>
                                <pre className="bg-muted p-1 rounded mt-1">
                                  {JSON.stringify(result.expectedOutput)}
                                </pre>
                              </div>
                              <div>
                                <div className="font-medium text-muted-foreground">Actual:</div>
                                <pre className={`p-1 rounded mt-1 ${
                                  result.passed ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
                                }`}>
                                  {JSON.stringify(result.actualOutput)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="output" className="mt-4">
                    <div className="space-y-3">
                      {executionResult.output && (
                        <div>
                          <div className="font-medium text-sm mb-2">Console Output:</div>
                          <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                            {executionResult.output}
                          </pre>
                        </div>
                      )}
                      {executionResult.errors && (
                        <div>
                          <div className="font-medium text-sm mb-2 text-red-600">Errors:</div>
                          <pre className="bg-red-50 dark:bg-red-950 p-3 rounded text-sm overflow-x-auto text-red-700 dark:text-red-300">
                            {executionResult.errors}
                          </pre>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="metrics" className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {executionResult.executionTime}ms
                        </div>
                        <div className="text-sm text-muted-foreground">Execution Time</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {executionResult.memoryUsed}KB
                        </div>
                        <div className="text-sm text-muted-foreground">Memory Used</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {executionResult.score}/{challenge.points}
                        </div>
                        <div className="text-sm text-muted-foreground">Score</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {executionResult.testResults.filter(t => t.passed).length}/
                          {executionResult.testResults.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Tests Passed</div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {executionResult.testResults.every(t => t.passed) && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      onClick={handleSubmit}
                      disabled={submitSolutionMutation.isPending}
                      className="w-full"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Submit Solution
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}