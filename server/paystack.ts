if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error("Missing required Paystack secret: PAYSTACK_SECRET_KEY");
}

// Initialize payment for course enrollment using direct HTTP API
export async function initializePayment(options: {
  email: string;
  amount: number;
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}) {
  const { email, amount, reference, callbackUrl, metadata } = options;
  
  try {
    const paymentData = {
      email,
      amount: Math.round(amount * 100), // Convert to kobo
      reference: reference || `CLB-${Date.now()}`,
      callback_url: callbackUrl,
      metadata
    };

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    
    if (!result.status) {
      throw new Error(result.message || 'Payment initialization failed');
    }
    
    return {
      status: true,
      data: result.data,
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference
    };
  } catch (error: any) {
    console.error('Paystack initialization error:', error);
    throw new Error(`Failed to initialize payment: ${error.message}`);
  }
}

// Verify payment after completion using direct HTTP API
export async function verifyPayment(reference: string) {
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    const result = await response.json();
    
    if (!result.status) {
      throw new Error(result.message || 'Payment verification failed');
    }
    
    return {
      status: true,
      data: result.data
    };
  } catch (error: any) {
    console.error('Paystack verification error:', error);
    throw new Error(`Failed to verify payment: ${error.message}`);
  }
}