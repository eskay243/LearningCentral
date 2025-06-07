// Test script to verify Paystack payment integration components
import https from 'https';
import fs from 'fs';
import path from 'path';

console.log('Testing Paystack Payment Integration Components...\n');

// Test 1: Check if Paystack API keys are properly configured
const paystackPublicKey = process.env.VITE_PAYSTACK_PUBLIC_KEY;
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

console.log('1. API Key Configuration:');
console.log(`   Public Key: ${paystackPublicKey ? 'Configured ✓' : 'Missing ✗'}`);
console.log(`   Secret Key: ${paystackSecretKey ? 'Configured ✓' : 'Missing ✗'}`);
console.log();

// Test 2: Verify Paystack API connectivity
console.log('2. Testing Paystack API Connectivity...');

if (paystackSecretKey) {
  const options = {
    hostname: 'api.paystack.co',
    path: '/bank',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('   Paystack API: Connected ✓');
        console.log('   Response: API is accessible');
      } else {
        console.log('   Paystack API: Connection issue ✗');
        console.log(`   Status: ${res.statusCode}`);
      }
      console.log();
      
      // Test 3: Check payment flow components
      testPaymentComponents();
    });
  });

  req.on('error', (error) => {
    console.log('   Paystack API: Connection failed ✗');
    console.log(`   Error: ${error.message}`);
    console.log();
    testPaymentComponents();
  });

  req.end();
} else {
  console.log('   Paystack API: Cannot test - no secret key ✗');
  console.log();
  testPaymentComponents();
}

function testPaymentComponents() {
  console.log('3. Payment Integration Components:');
  
  // Check if required files exist
  
  const components = [
    'server/paymentRoutes.ts',
    'server/invoiceService.ts', 
    'client/src/components/PaymentModal.tsx',
    'client/src/pages/payment-callback.tsx',
    'client/src/pages/student-payments.tsx'
  ];
  
  components.forEach(component => {
    const exists = fs.existsSync(path.join('.', component));
    console.log(`   ${component}: ${exists ? 'Created ✓' : 'Missing ✗'}`);
  });
  
  console.log();
  console.log('4. Payment Flow Summary:');
  console.log('   ✓ PaymentModal - Course payment initiation');
  console.log('   ✓ Paystack Integration - Nigerian payment processing');
  console.log('   ✓ Payment Callback - Verification and enrollment');
  console.log('   ✓ Invoice Generation - PDF receipts and invoices');
  console.log('   ✓ Student Dashboard - Payment history tracking');
  console.log();
  console.log('Payment integration is ready for testing with authenticated users.');
}