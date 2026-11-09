import { neon, neonConfig } from '@neondatabase/serverless';

// Configure Neon for serverless environments
neonConfig.fetchConnectionCache = true;

let sqlClient: ReturnType<typeof neon> | null = null;

/**
 * Get or create a database connection using Neon serverless driver.
 * Returns null if DATABASE_URL is not configured.
 */
export function getDb() {
  if (sqlClient) return sqlClient;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('DATABASE_URL is not set. Database operations will fail.');
    return null;
  }

  sqlClient = neon(databaseUrl);
  return sqlClient;
}

/**
 * Execute a SQL query against the database.
 * Throws an error with a helpful message if the database is not configured.
 */
export async function query(sql: string, params: unknown[] = []): Promise<any> {
  const db = getDb();
  if (!db) {
    throw new Error(
      'Database is not configured. Set the DATABASE_URL environment variable to connect to your Neon PostgreSQL database.'
    );
  }
  return (await db(sql, params as any)) as any;
}

/**
 * Check if the database connection is available.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const db = getDb();
    if (!db) return false;
    await db('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export default { getDb, query, isDatabaseAvailable };
