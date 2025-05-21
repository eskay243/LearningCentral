import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, Code, Code2, Sparkles, Loader2, Send } from 'lucide-react';

interface CodeCompanionProps {
  initialCode?: string;
  initialError?: string;
  initialLanguage?: string;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
}

const CodeCompanionBot: React.FC<CodeCompanionProps> = ({ 
  initialCode = '', 
  initialError = '', 
  initialLanguage = 'javascript',
  onClose 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState(initialLanguage);
  const [difficulty, setDifficulty] = useState('');
  const [topic, setTopic] = useState('');
  const [currentCode, setCurrentCode] = useState(initialCode);
  const [error, setError] = useState(initialError);
  const [context, setContext] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      message: 'Hello! I\'m your Code Companion. Ask me for coding tips, help with errors, or explanations about programming concepts.',
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Languages options
  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'go', label: 'Go' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'sql', label: 'SQL' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' }
  ];

  // Difficulty levels
  const difficultyLevels = [
    { value: '', label: 'Any Level' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  // Topics
  const topics = [
    { value: '', label: 'General' },
    { value: 'variables', label: 'Variables & Data Types' },
    { value: 'functions', label: 'Functions' },
    { value: 'loops', label: 'Loops & Iteration' },
    { value: 'conditionals', label: 'Conditionals' },
    { value: 'arrays', label: 'Arrays & Lists' },
    { value: 'objects', label: 'Objects & Dictionaries' },
    { value: 'classes', label: 'Classes & OOP' },
    { value: 'async', label: 'Async/Await & Promises' },
    { value: 'algorithms', label: 'Algorithms' },
    { value: 'debugging', label: 'Debugging' },
    { value: 'bestpractices', label: 'Best Practices' }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() && !currentCode.trim() && !error.trim()) {
      toast({
        title: "Empty Input",
        description: "Please provide a question, code snippet, or error message.",
        variant: "destructive"
      });
      return;
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: userInput || (error ? `I'm getting this error: ${error}` : `Can you help with this code? \`\`\`${language}\n${currentCode}\n\`\`\``),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/code-companion/tip', {
        language,
        difficulty,
        topic,
        currentCode: currentCode || undefined,
        error: error || undefined,
        context: context || userInput
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Code Companion');
      }

      const data = await response.json();
      
      // Add bot response to chat
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        message: data.tip,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);

    } catch (error: any) {
      console.error("Code Companion error:", error);
      
      // Add a bot message for the error
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        message: "I'm sorry, I encountered an issue processing your request. Please try again with a different question or check your connection.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Request Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRandomTip = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/code-companion/tip', {
        language,
        difficulty,
        topic,
        context: "Give me a random helpful tip"
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Code Companion');
      }

      const data = await response.json();
      
      // Add bot response to chat
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'bot',
        message: data.tip,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get a tip. Please try again.",
        variant: "destructive"
      });
      console.error("Code Companion error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl h-[600px] flex flex-col dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8 bg-primary/20">
            <AvatarFallback className="text-primary text-sm">CC</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base font-semibold dark:text-white">Code Companion</CardTitle>
            <p className="text-xs text-muted-foreground dark:text-gray-400">Your programming assistant</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 dark:text-gray-400 dark:hover:bg-gray-700">
            <span className="sr-only">Close</span>
            <span className="text-lg">×</span>
          </Button>
        )}
      </CardHeader>
      
      <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="px-4 pt-2 bg-background border-b justify-start dark:bg-gray-800 dark:border-gray-700">
          <TabsTrigger value="chat" className="text-xs dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            <MessageCircle className="h-3.5 w-3.5 mr-1" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="code" className="text-xs dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            <Code className="h-3.5 w-3.5 mr-1" />
            Code
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Topics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex-1 overflow-hidden flex flex-col p-0 m-0">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`mb-4 ${msg.sender === 'bot' ? 'mr-12' : 'ml-12'}`}
              >
                <div className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                  {msg.sender === 'bot' && (
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">CC</AvatarFallback>
                    </Avatar>
                  )}
                  <div 
                    className={`rounded-lg p-4 text-sm shadow-md transform transition-all duration-300 ease-in-out ${msg.sender === 'bot' 
                      ? 'bg-muted text-foreground dark:bg-gray-700 dark:text-gray-200 border-l-4 border-blue-500' 
                      : 'bg-primary text-primary-foreground'}`}
                    style={{
                      animation: `fadeIn 0.5s ease-out forwards`,
                    }}
                  >
                    {msg.sender === 'bot' && (
                      <div className="flex items-center mb-2 pb-1 border-b border-gray-200 dark:border-gray-600">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                          <Code className="h-3 w-3 text-white" />
                        </div>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Code Companion</span>
                      </div>
                    )}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>
                        {msg.message}
                      </ReactMarkdown>
                    </div>
                    <div className="text-xs opacity-70 mt-2 text-right">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {msg.sender === 'user' && (
                    <Avatar className="h-8 w-8 ml-2">
                      <AvatarFallback className="text-xs">You</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <CardFooter className="p-3 border-t dark:border-gray-700">
            <div className="flex w-full items-center space-x-2">
              <Textarea
                placeholder="Ask for a coding tip or paste an error message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-10 flex-1 dark:bg-gray-700 dark:text-gray-200"
                rows={1}
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading}
                size="icon"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="code" className="flex-1 overflow-hidden flex flex-col p-0 m-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Programming Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {languages.map((lang) => (
                    <SelectItem 
                      key={lang.value} 
                      value={lang.value}
                      className="dark:text-gray-200 dark:focus:bg-gray-600"
                    >
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Code Snippet</label>
              <Textarea
                placeholder="Paste your code here..."
                value={currentCode}
                onChange={(e) => setCurrentCode(e.target.value)}
                className="font-mono text-sm dark:bg-gray-700 dark:text-gray-200"
                rows={7}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Error Message (if any)</label>
              <Textarea
                placeholder="Paste any error messages here..."
                value={error}
                onChange={(e) => setError(e.target.value)}
                className="font-mono text-sm dark:bg-gray-700 dark:text-gray-200"
                rows={3}
              />
            </div>
            
            <Button 
              onClick={handleSendMessage}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting help...
                </>
              ) : (
                <>
                  <Code2 className="mr-2 h-4 w-4" />
                  Get Help With This Code
                </>
              )}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="flex-1 overflow-hidden flex flex-col p-0 m-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Programming Language</label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {languages.map((lang) => (
                    <SelectItem 
                      key={lang.value} 
                      value={lang.value}
                      className="dark:text-gray-200 dark:focus:bg-gray-600"
                    >
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Difficulty Level</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {difficultyLevels.map((level) => (
                    <SelectItem 
                      key={level.value} 
                      value={level.value}
                      className="dark:text-gray-200 dark:focus:bg-gray-600"
                    >
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Topic</label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {topics.map((t) => (
                    <SelectItem 
                      key={t.value} 
                      value={t.value}
                      className="dark:text-gray-200 dark:focus:bg-gray-600"
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-2">
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Popular Topics</label>
              <div className="flex flex-wrap gap-2">
                {topics.slice(1, 7).map((t) => (
                  <Badge 
                    key={t.value} 
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => setTopic(t.value)}
                  >
                    {t.label}
                  </Badge>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={getRandomTip}
              disabled={isLoading}
              className="w-full mt-6"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting tip...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Random Coding Tip
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default CodeCompanionBot;