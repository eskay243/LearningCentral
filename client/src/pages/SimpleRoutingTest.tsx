import React from 'react';

const SimpleRoutingTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1>Simple Routing Test</h1>
      <p>This page bypasses the Layout component to test basic routing.</p>
      <p>Current URL: {window.location.pathname}</p>
      <p>If you can see this, routing is working correctly.</p>
    </div>
  );
};

export default SimpleRoutingTest;