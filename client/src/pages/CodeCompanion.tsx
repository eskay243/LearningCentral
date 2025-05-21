import React from 'react';
import CodeCompanionBot from '@/components/code-companion/CodeCompanionBot';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { BookOpen, Code2, Lightbulb } from 'lucide-react';

const CodeCompanionPage: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Code Companion</h1>
          <p className="text-lg text-muted-foreground">Please sign in to access the Code Companion</p>
          <Button className="mt-4" onClick={() => window.location.href = '/api/login'}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Code Companion</h1>
        <p className="text-muted-foreground">Your AI programming assistant for learning and problem-solving</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border rounded-lg p-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-medium text-lg mb-2">Get Coding Tips</h3>
          <p className="text-sm text-muted-foreground">Receive personalized coding tips and best practices for any programming language</p>
        </div>
        
        <div className="bg-card border rounded-lg p-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Code2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-medium text-lg mb-2">Debug Your Code</h3>
          <p className="text-sm text-muted-foreground">Get help with error messages and debugging issues in your programming projects</p>
        </div>
        
        <div className="bg-card border rounded-lg p-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-medium text-lg mb-2">Learn Concepts</h3>
          <p className="text-sm text-muted-foreground">Understand programming concepts with clear explanations and practical examples</p>
        </div>
      </div>

      <div className="flex justify-center mb-10">
        <CodeCompanionBot />
      </div>

      <div className="mt-12 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">How to use Code Companion</h2>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">1. Ask a coding question</h3>
            <p className="text-sm text-muted-foreground">Type your programming question in the chat input field and press Enter or click the send button.</p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">2. Share your code</h3>
            <p className="text-sm text-muted-foreground">Switch to the Code tab to paste your code snippet and error messages for specific assistance.</p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">3. Explore topics</h3>
            <p className="text-sm text-muted-foreground">Use the Topics tab to select a programming language, difficulty level, and topic to get tailored guidance.</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-12 text-sm text-muted-foreground">
        <p>Code Companion uses AI to provide coding assistance. The information provided should be verified for accuracy.</p>
      </div>
    </div>
  );
};

export default CodeCompanionPage;