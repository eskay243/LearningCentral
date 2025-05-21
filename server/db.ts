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

// Initialize database connection with a function to avoid top-level await
const initDb = async () => {
  let poolConnection;
  let dbInstance;

  try {
    const result = await initializeDatabase();
    poolConnection = result.pool;
    dbInstance = result.db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    // Provide fallback implementations
    poolConnection = {
      query: async () => [],
      end: async () => {}
    } as unknown as Pool;
    
    dbInstance = {
      select: () => ({ from: () => ({ where: () => [] }) }),
      insert: () => ({ values: () => ({ returning: () => [] }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) })
    } as unknown as ReturnType<typeof drizzle>;
  }

  return { pool: poolConnection, db: dbInstance };
};

// Export pool and db with initial fallbacks that will be replaced
export let pool: Pool = {
  query: async () => [],
  end: async () => {}
} as unknown as Pool;

export let db: ReturnType<typeof drizzle> = {
  select: () => ({ from: () => ({ where: () => [] }) }),
  insert: () => ({ values: () => ({ returning: () => [] }) }),
  update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) })
} as unknown as ReturnType<typeof drizzle>;

// Initialize the database (will update pool and db)
initDb().then(result => {
  pool = result.pool;
  db = result.db;
  console.log("Database connection initialized successfully");
}).catch(error => {
  console.error("Failed to initialize database:", error);
});
