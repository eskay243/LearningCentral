declare module 'paystack-node' {
  class Paystack {
    constructor(secretKey: string);
    
    transaction: {
      initialize(options: {
        email: string;
        amount: number;
        reference?: string;
        callback_url?: string;
        metadata?: Record<string, any>;
      }): Promise<{
        status: boolean;
        message: string;
        data: {
          authorization_url: string;
          access_code: string;
          reference: string;
        }
      }>;
      
      verify(options: { reference: string }): Promise<{
        status: boolean;
        message: string;
        data: {
          id: number;
          status: string;
          reference: string;
          amount: number;
          gateway_response: string;
          paid_at: string;
          created_at: string;
          channel: string;
          currency: string;
          metadata: any;
          customer: {
            id: number;
            first_name: string;
            last_name: string;
            email: string;
            customer_code: string;
            phone: string;
            metadata: any;
          }
        }
      }>;
      
      get(options: { id: number }): Promise<{
        status: boolean;
        message: string;
        data: any;
      }>;
      
      list(options?: {
        perPage?: number;
        page?: number;
        from?: string;
        to?: string;
      }): Promise<{
        status: boolean;
        message: string;
        data: any[];
      }>;
    };
  }
  
  export default Paystack;
}