import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestCodingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="container mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Coding Playground Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a test page to verify routing is working correctly.</p>
            <p>If you can see this, the routing to /test-coding is working.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestCodingPage;