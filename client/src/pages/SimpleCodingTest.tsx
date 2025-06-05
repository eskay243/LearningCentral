import React from 'react';

const SimpleCodingTest: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1>Simple Coding Test Page</h1>
      <p>This is a test to verify basic component rendering works.</p>
      <div style={{ backgroundColor: 'white', padding: '20px', marginTop: '20px', border: '1px solid #ccc' }}>
        <h2>Test Content</h2>
        <p>If you can see this, the component is loading correctly.</p>
        <button onClick={() => alert('Button works!')}>Test Button</button>
      </div>
    </div>
  );
};

export default SimpleCodingTest;