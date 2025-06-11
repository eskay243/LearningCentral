import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { codeExecutionService } from './codeExecutionService';
import { isAuthenticated } from './auth';

const executeCodeSchema = z.object({
  code: z.string(),
  language: z.enum(['javascript', 'python', 'csharp', 'typescript', 'js', 'py', 'cs', 'ts', 'c#']),
});

const runTestsSchema = z.object({
  code: z.string(),
  language: z.enum(['javascript', 'python', 'csharp', 'typescript', 'js', 'py', 'cs', 'ts', 'c#']),
  tests: z.array(z.object({
    test: z.string(),
    expected: z.any(),
    name: z.string()
  }))
});

export function registerCodeExecutionRoutes(app: Express) {
  // Execute code endpoint
  app.post('/api/code/execute', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { code, language } = executeCodeSchema.parse(req.body);
      
      const result = await codeExecutionService.executeCode(code, language);
      res.json(result);
    } catch (error) {
      console.error('Code execution error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Code execution failed',
        success: false,
        output: '',
        executionTime: 0
      });
    }
  });

  // Run tests endpoint
  app.post('/api/code/test', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { code, language, tests } = runTestsSchema.parse(req.body);
      
      const testResults = await codeExecutionService.runTests(code, tests, language);
      
      const allPassed = testResults.every(result => result.passed);
      
      res.json({
        success: true,
        allPassed,
        testResults,
        passedCount: testResults.filter(r => r.passed).length,
        totalCount: testResults.length
      });
    } catch (error) {
      console.error('Test execution error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      res.status(500).json({ message: 'Test execution failed' });
    }
  });

  // Get supported languages
  app.get('/api/code/languages', isAuthenticated, async (req: Request, res: Response) => {
    res.json({
      languages: [
        {
          id: 'javascript',
          name: 'JavaScript',
          extension: 'js',
          monacoLanguage: 'javascript'
        },
        {
          id: 'python',
          name: 'Python',
          extension: 'py',
          monacoLanguage: 'python'
        },
        {
          id: 'csharp',
          name: 'C#',
          extension: 'cs',
          monacoLanguage: 'csharp'
        },
        {
          id: 'typescript',
          name: 'TypeScript',
          extension: 'ts',
          monacoLanguage: 'typescript'
        }
      ]
    });
  });
}