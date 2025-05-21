import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for serverless environment
neonConfig.webSocketConstructor = ws;

// Helper function for logging database operations
const logDbOperation = (operation: string, success: boolean, error?: any) => {
  const status = success ? "SUCCESS" : "FAILED";
  const message = `[DATABASE] ${operation} - ${status}`;
  
  if (success) {
    console.log(message);
  } else {
    console.error(`${message}: ${error?.message || "Unknown error"}`);
  }
};

// Main database initialization function
export const initializeDatabase = async () => {
  try {
    // Check for database URL
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
    }
    
    // Create connection pool
    console.log("Connecting to database...");
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000, // 10 second timeout
      max: 10, // Maximum number of clients
    });
    
    // Test the connection
    await pool.query('SELECT NOW()');
    logDbOperation("Connection", true);
    
    // Create Drizzle ORM instance
    const db = drizzle({ client: pool, schema });
    
    // Successfully initialized
    return { pool, db };
  } catch (error: any) {
    logDbOperation("Initialization", false, error);
    
    // For development, provide a fallback to allow the application to start
    // without database functionality in order to view the UI
    console.warn("Database initialization failed. App will run with limited functionality.");
    
    // Return a limited version that won't crash but will log errors on usage
    const pool = {
      query: () => {
        console.error("Database connection failed. This operation cannot be completed.");
        return Promise.reject(new Error("Database connection failed"));
      },
      end: () => Promise.resolve(),
    } as unknown as Pool;
    
    const db = drizzle({ client: pool, schema });
    
    return { pool, db, error };
  }
};

// Initialize database connection
const { pool, db } = await initializeDatabase();

// Export the database connection and Drizzle ORM instance
export { pool, db };
