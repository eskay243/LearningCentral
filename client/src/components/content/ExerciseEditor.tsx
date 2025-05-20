import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, Code, Pencil, Book, Trash, Plus } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface Test {
  test: string;
  expected: any;
}

interface ExerciseData {
  id?: number;
  title: string;
  description: string;
  instructions: string;
  initialCode: string;
  solution: string;
  language: string;
  difficulty: string;
  moduleId?: number;
  lessonId?: number;
  hints: string[];
  tests: Test[];
  orderIndex?: number;
  tags?: string[];
}

interface ExerciseEditorProps {
  moduleId?: number;
  lessonId?: number;
  initialExercise?: ExerciseData;
  onSave?: (exercise: ExerciseData) => void;
  onCancel?: () => void;
}

const DEFAULT_EXERCISE: ExerciseData = {
  title: 'New Exercise',
  description: 'Exercise description',
  instructions: '<h3>Instructions</h3><p>Complete the code to solve the problem.</p>',
  initialCode: '// Write your code here\n\n',
  solution: '// Solution code\n\n',
  language: 'javascript',
  difficulty: 'beginner',
  hints: ['Hint 1'],
  tests: [{ test: 'example()', expected: 'expected result' }],
  tags: []
};

const ExerciseEditor: React.FC<ExerciseEditorProps> = ({
  moduleId,
  lessonId,
  initialExercise,
  onSave,
  onCancel
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [exercise, setExercise] = useState<ExerciseData>(initialExercise || {...DEFAULT_EXERCISE, moduleId, lessonId});
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExercise(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setExercise(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCodeChange = (field: string, value: string | undefined) => {
    if (value !== undefined) {
      setExercise(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  const addHint = () => {
    setExercise(prev => ({
      ...prev,
      hints: [...prev.hints, '']
    }));
  };
  
  const updateHint = (index: number, value: string) => {
    const updatedHints = [...exercise.hints];
    updatedHints[index] = value;
    setExercise(prev => ({
      ...prev,
      hints: updatedHints
    }));
  };
  
  const removeHint = (index: number) => {
    setExercise(prev => ({
      ...prev,
      hints: prev.hints.filter((_, i) => i !== index)
    }));
  };
  
  const addTest = () => {
    setExercise(prev => ({
      ...prev,
      tests: [...prev.tests, { test: '', expected: '' }]
    }));
  };
  
  const updateTest = (index: number, field: 'test' | 'expected', value: string) => {
    const updatedTests = [...exercise.tests];
    updatedTests[index] = {
      ...updatedTests[index],
      [field]: value
    };
    setExercise(prev => ({
      ...prev,
      tests: updatedTests
    }));
  };
  
  const removeTest = (index: number) => {
    setExercise(prev => ({
      ...prev,
      tests: prev.tests.filter((_, i) => i !== index)
    }));
  };
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validation
      if (!exercise.title?.trim()) {
        toast({
          title: "Validation Error",
          description: "Title is required",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }
      
      // Send to API (or to parent component)
      if (onSave) {
        onSave(exercise);
      } else {
        // Direct API call if no callback provided
        const endpoint = exercise.id 
          ? `/api/coding-exercises/${exercise.id}` 
          : '/api/coding-exercises';
        
        const method = exercise.id ? 'PUT' : 'POST';
        
        const response = await apiRequest(method, endpoint, exercise);
        
        if (response.ok) {
          const savedExercise = await response.json();
          toast({
            title: "Success",
            description: exercise.id 
              ? "Exercise updated successfully" 
              : "Exercise created successfully"
          });
          
          // Update local state with saved data (including new ID)
          setExercise(savedExercise);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save exercise');
        }
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save exercise',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="exercise-editor space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {exercise.id ? 'Edit Exercise' : 'Create New Exercise'}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : (exercise.id ? 'Update Exercise' : 'Create Exercise')}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details" className="flex items-center gap-1">
            <Pencil className="h-4 w-4" />
            <span>Basic Details</span>
          </TabsTrigger>
          <TabsTrigger value="instructions" className="flex items-center gap-1">
            <Book className="h-4 w-4" />
            <span>Instructions</span>
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-1">
            <Code className="h-4 w-4" />
            <span>Code</span>
          </TabsTrigger>
          <TabsTrigger value="hints" className="flex items-center gap-1">
            <span>Hints</span>
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-1">
            <Check className="h-4 w-4" />
            <span>Tests</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="p-4 border rounded-md">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  name="title" 
                  value={exercise.title} 
                  onChange={handleInputChange}
                  placeholder="Enter exercise title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  name="description" 
                  value={exercise.description} 
                  onChange={handleInputChange}
                  placeholder="Brief description of the exercise"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={exercise.language}
                  onValueChange={(value) => handleSelectChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="csharp">C#</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                    <SelectItem value="php">PHP</SelectItem>
                    <SelectItem value="ruby">Ruby</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                    <SelectItem value="sql">SQL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={exercise.difficulty}
                  onValueChange={(value) => handleSelectChange('difficulty', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orderIndex">Order Index</Label>
                <Input 
                  id="orderIndex" 
                  name="orderIndex" 
                  type="number"
                  value={exercise.orderIndex?.toString() || "0"} 
                  onChange={handleInputChange}
                  placeholder="Display order"
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="instructions" className="p-4 border rounded-md">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="block mb-2">Instructions (HTML)</Label>
                <div className="h-[400px] border rounded-md overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    value={exercise.instructions}
                    onChange={(value) => handleCodeChange('instructions', value)}
                    options={{
                      minimap: { enabled: false },
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  You can use HTML to format instructions. Use &lt;code&gt; tags for inline code examples.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="code" className="p-4 border rounded-md">
          <div className="space-y-6">
            <div>
              <Label className="block mb-2">Initial Code</Label>
              <div className="h-[300px] border rounded-md overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage={exercise.language}
                  value={exercise.initialCode}
                  onChange={(value) => handleCodeChange('initialCode', value)}
                  options={{
                    minimap: { enabled: false },
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                This is the starting code that students will see when they begin the exercise.
              </p>
            </div>
            
            <div>
              <Label className="block mb-2">Solution Code</Label>
              <div className="h-[300px] border rounded-md overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage={exercise.language}
                  value={exercise.solution}
                  onChange={(value) => handleCodeChange('solution', value)}
                  options={{
                    minimap: { enabled: false },
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                This is the solution code used to validate student submissions. Not shown to students until they complete the exercise.
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="hints" className="p-4 border rounded-md">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Hints</h3>
              <Button size="sm" onClick={addHint}>
                <Plus className="h-4 w-4 mr-1" />
                Add Hint
              </Button>
            </div>
            
            {exercise.hints.length === 0 ? (
              <div className="p-4 border rounded-md text-center text-muted-foreground">
                No hints added yet. Click "Add Hint" to create your first hint.
              </div>
            ) : (
              <div className="space-y-3">
                {exercise.hints.map((hint, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-2">
                      {index + 1}
                    </Badge>
                    <Textarea
                      value={hint}
                      onChange={(e) => updateHint(index, e.target.value)}
                      placeholder={`Hint ${index + 1}`}
                      className="flex-1"
                    />
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => removeHint(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-4">
              Hints are shown to students progressively as they request help with the exercise.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="tests" className="p-4 border rounded-md">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Test Cases</h3>
              <Button size="sm" onClick={addTest}>
                <Plus className="h-4 w-4 mr-1" />
                Add Test
              </Button>
            </div>
            
            {exercise.tests.length === 0 ? (
              <div className="p-4 border rounded-md text-center text-muted-foreground">
                No tests added yet. Click "Add Test" to create your first test case.
              </div>
            ) : (
              <div className="space-y-4">
                {exercise.tests.map((test, index) => (
                  <Card key={index}>
                    <CardHeader className="py-2">
                      <CardTitle className="text-base flex items-center">
                        <span>Test Case #{index + 1}</span>
                        <Button 
                          variant="outline" 
                          size="icon"
                          className="h-6 w-6 ml-auto"
                          onClick={() => removeTest(index)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 space-y-3">
                      <div>
                        <Label htmlFor={`test-${index}`} className="text-sm">
                          Test Code/Pattern
                        </Label>
                        <Input 
                          id={`test-${index}`}
                          value={test.test}
                          onChange={(e) => updateTest(index, 'test', e.target.value)}
                          placeholder="e.g., add(2, 3) or function pattern to match"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`expected-${index}`} className="text-sm">
                          Expected Result
                        </Label>
                        <Input 
                          id={`expected-${index}`}
                          value={test.expected?.toString() || ''}
                          onChange={(e) => updateTest(index, 'expected', e.target.value)}
                          placeholder="e.g., 5"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mt-4">
              Tests are used to verify if a student's solution is correct. Define the test case and the expected result.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExerciseEditor;