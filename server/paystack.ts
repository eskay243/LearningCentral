import Paystack from "paystack-node";

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error("Missing required Paystack secret: PAYSTACK_SECRET_KEY");
}

// Initialize Paystack
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY);

// Initialize payment for course enrollment
export async function initializePayment(options: {
  email: string;
  amount: number;
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}) {
  const { email, amount, reference, callbackUrl, metadata } = options;
  
  try {
    // Amount should be in kobo (multiply by 100)
    const response = await paystack.transaction.initialize({
      email,
      amount: Math.round(amount * 100),
      reference,
      callback_url: callbackUrl,
      metadata
    });
    
    if (!response.status) {
      throw new Error(response.message || 'Payment initialization failed');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Paystack initialization error:', error);
    throw new Error(`Failed to initialize payment: ${error.message}`);
  }
}

// Verify payment after completion
export async function verifyPayment(reference: string) {
  try {
    const response = await paystack.transaction.verify({ reference });
    
    if (!response.status) {
      throw new Error(response.message || 'Payment verification failed');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Paystack verification error:', error);
    throw new Error(`Failed to verify payment: ${error.message}`);
  }
}

// Get transaction details
export async function getTransaction(id: number) {
  try {
    const response = await paystack.transaction.get({ id });
    
    if (!response.status) {
      throw new Error(response.message || 'Failed to get transaction');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Paystack transaction fetch error:', error);
    throw new Error(`Failed to get transaction: ${error.message}`);
  }
}

// List transactions
export async function listTransactions(options?: {
  perPage?: number;
  page?: number;
  from?: string;
  to?: string;
}) {
  try {
    const response = await paystack.transaction.list(options);
    
    if (!response.status) {
      throw new Error(response.message || 'Failed to list transactions');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Paystack transactions fetch error:', error);
    throw new Error(`Failed to list transactions: ${error.message}`);
  }
}