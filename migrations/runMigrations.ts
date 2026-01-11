#!/usr/bin/env node

/**
 * Migration runner - executes SQL migration files in order
 * 
 * Usage: node dist/migrations/runMigrations.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, closeDatabase, query } from '../database/connection.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    // Initialize database connection
    await initDatabase();

    // Get migration files
    const migrationsDir = path.join(__dirname, '../../migrations');
    const files = (await fs.readdir(migrationsDir)).filter((f) =>
      f.endsWith('.sql')
    );

    if (files.length === 0) {
      logger.info('No migration files found');
      await closeDatabase();
      return;
    }

    // Run migrations in order
    for (const file of files.sort()) {
      logger.info(`Running migration: ${file}`);
      const sqlPath = path.join(migrationsDir, file);
      const sql = await fs.readFile(sqlPath, 'utf-8');

      // Execute migration
      try {
        await query(sql);
        logger.info(`✓ Completed: ${file}`);
      } catch (error) {
        logger.error(`✗ Failed: ${file}`, error);
        throw error;
      }
    }

    logger.info('All migrations completed successfully');
    await closeDatabase();
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
