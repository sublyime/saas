import { Pool, PoolClient } from 'pg';
import config from '../config';
import { logger } from '../config/logger';

let pool: Pool | null = null;

export const initDatabase = async () => {
  try {
    pool = new Pool({
      connectionString: config.database.url,
      max: config.database.maxConnections,
      idleTimeoutMillis: config.database.idleTimeoutMs,
      // Connection validation
      connectionTimeoutMillis: 5000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('Database connection established');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

export const getDatabase = (): Pool => {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
};

export const closeDatabase = async () => {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
};

/**
 * Execute a query with parameters
 */
export const query = async (
  sql: string,
  params?: (string | number | boolean | null | undefined)[]
) => {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (error) {
    logger.error(`Database query error: ${sql}`, error);
    throw error;
  }
};

/**
 * Execute a transaction
 */
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  if (!pool) {
    throw new Error('Database not initialized');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Query with transaction client
 */
export const queryWithClient = (client: PoolClient) => {
  return (sql: string, params?: (string | number | boolean | null | undefined)[]) => {
    return client.query(sql, params);
  };
};
