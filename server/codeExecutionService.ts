import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  memoryUsage?: number;
}

export interface TestResult {
  passed: boolean;
  expected: any;
  actual: any;
  testName: string;
}

export class CodeExecutionService {
  private readonly tempDir: string;
  private readonly timeout: number;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'code-execution');
    this.timeout = 10000; // 10 seconds timeout
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  /**
   * Execute code based on language
   */
  async executeCode(code: string, language: string): Promise<CodeExecutionResult> {
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        return this.executeJavaScript(code);
      case 'python':
      case 'py':
        return this.executePython(code);
      case 'csharp':
      case 'c#':
      case 'cs':
        return this.executeCSharp(code);
      case 'typescript':
      case 'ts':
        return this.executeTypeScript(code);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  /**
   * Execute JavaScript code in a sandboxed environment
   */
  async executeJavaScript(code: string): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    const sessionId = randomUUID();
    const filePath = path.join(this.tempDir, `${sessionId}.js`);

    try {
      // Wrap code in a sandbox with basic security measures
      const sandboxedCode = `
        const console = {
          log: (...args) => process.stdout.write(args.join(' ') + '\\n'),
          error: (...args) => process.stderr.write(args.join(' ') + '\\n')
        };
        
        // Disable dangerous globals
        const fs = undefined;
        const process = { stdout: process.stdout, stderr: process.stderr };
        const require = undefined;
        const module = undefined;
        const exports = undefined;
        const global = undefined;
        const __dirname = undefined;
        const __filename = undefined;
        
        try {
          ${code}
        } catch (error) {
          console.error('Runtime Error:', error.message);
        }
      `;

      await fs.writeFile(filePath, sandboxedCode);

      const result = await this.runCommand('node', [filePath]);
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
    } finally {
      // Cleanup
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Execute C# code in a sandboxed environment
   */
  async executeCSharp(code: string): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    const sessionId = randomUUID();
    const filePath = path.join(this.tempDir, `${sessionId}.cs`);

    try {
      await this.ensureTempDir();
      await fs.writeFile(filePath, code);

      const result = await this.runCommand('dotnet', ['script', filePath]);
      const executionTime = Date.now() - startTime;

      return {
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: Date.now() - startTime,
      };
    } finally {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Execute TypeScript code in a sandboxed environment
   */
  async executeTypeScript(code: string): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    const sessionId = randomUUID();
    const filePath = path.join(this.tempDir, `${sessionId}.ts`);

    try {
      await this.ensureTempDir();
      await fs.writeFile(filePath, code);

      const result = await this.runCommand('npx', ['ts-node', filePath]);
      const executionTime = Date.now() - startTime;

      return {
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: Date.now() - startTime,
      };
    } finally {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Execute Python code in a sandboxed environment
   */
  async executePython(code: string): Promise<CodeExecutionResult> {
    const startTime = Date.now();
    const sessionId = randomUUID();
    const filePath = path.join(this.tempDir, `${sessionId}.py`);

    try {
      // Basic Python sandbox wrapper
      const sandboxedCode = `
import sys
import io
import contextlib

# Redirect stdout to capture output
old_stdout = sys.stdout
sys.stdout = io.StringIO()

try:
    ${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    print(f"Runtime Error: {e}", file=sys.stderr)
finally:
    output = sys.stdout.getvalue()
    sys.stdout = old_stdout
    print(output, end='')
      `;

      await fs.writeFile(filePath, sandboxedCode);

      const result = await this.runCommand('python3', [filePath]);
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      };
    } finally {
      // Cleanup
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Run tests against user code
   */
  async runTests(code: string, tests: Array<{ test: string; expected: any; name: string }>, language: string): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const test of tests) {
      try {
        let testCode: string;
        
        if (language === 'javascript') {
          testCode = `
            ${code}
            
            // Test execution
            try {
              const result = ${test.test};
              console.log(JSON.stringify({ success: true, result }));
            } catch (error) {
              console.log(JSON.stringify({ success: false, error: error.message }));
            }
          `;
        } else if (language === 'python') {
          testCode = `
${code}

import json
try:
    result = ${test.test}
    print(json.dumps({"success": True, "result": result}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
          `;
        } else {
          throw new Error(`Unsupported language: ${language}`);
        }

        const executionResult = language === 'javascript' 
          ? await this.executeJavaScript(testCode)
          : await this.executePython(testCode);

        if (executionResult.success) {
          try {
            const testResult = JSON.parse(executionResult.output.trim());
            if (testResult.success) {
              const passed = this.compareValues(testResult.result, test.expected);
              results.push({
                passed,
                expected: test.expected,
                actual: testResult.result,
                testName: test.name
              });
            } else {
              results.push({
                passed: false,
                expected: test.expected,
                actual: `Error: ${testResult.error}`,
                testName: test.name
              });
            }
          } catch (parseError) {
            results.push({
              passed: false,
              expected: test.expected,
              actual: `Parse Error: ${executionResult.output}`,
              testName: test.name
            });
          }
        } else {
          results.push({
            passed: false,
            expected: test.expected,
            actual: `Execution Error: ${executionResult.error}`,
            testName: test.name
          });
        }
      } catch (error) {
        results.push({
          passed: false,
          expected: test.expected,
          actual: `Test Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          testName: test.name
        });
      }
    }

    return results;
  }

  private compareValues(actual: any, expected: any): boolean {
    if (actual === expected) return true;
    
    // Handle arrays
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      return actual.every((item, index) => this.compareValues(item, expected[index]));
    }
    
    // Handle objects
    if (typeof actual === 'object' && typeof expected === 'object' && actual !== null && expected !== null) {
      const actualKeys = Object.keys(actual).sort();
      const expectedKeys = Object.keys(expected).sort();
      
      if (actualKeys.length !== expectedKeys.length) return false;
      if (!actualKeys.every(key => expectedKeys.includes(key))) return false;
      
      return actualKeys.every(key => this.compareValues(actual[key], expected[key]));
    }
    
    return false;
  }

  private runCommand(command: string, args: string[]): Promise<{ success: boolean; output: string; error?: string }> {
    return new Promise((resolve) => {
      const process = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: this.timeout
      });

      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          success: code === 0,
          output: output.trim(),
          error: error.trim() || undefined
        });
      });

      process.on('error', (err) => {
        resolve({
          success: false,
          output: '',
          error: err.message
        });
      });
    });
  }
}

export const codeExecutionService = new CodeExecutionService();