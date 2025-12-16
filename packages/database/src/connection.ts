import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { DatabaseError } from '@job-applier/core';
import { runMigrations } from './migrations/index.js';

let db: SqlJsDatabase | null = null;
let dbPath: string = '';

export interface DatabaseConfig {
  path: string;
  readonly?: boolean;
  verbose?: boolean;
}

/**
 * Initialize database connection
 */
export async function initDatabase(config: DatabaseConfig): Promise<SqlJsDatabase> {
  if (db) {
    return db;
  }

  try {
    const SQL = await initSqlJs();

    // Check if using in-memory database
    const isInMemory = config.path === ':memory:';

    if (!isInMemory) {
      // Create directory if needed
      const dir = dirname(config.path);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Load existing database or create new one
      if (existsSync(config.path)) {
        const fileBuffer = readFileSync(config.path);
        db = new SQL.Database(fileBuffer);
      } else {
        db = new SQL.Database();
      }
    } else {
      // In-memory database
      db = new SQL.Database();
    }

    dbPath = isInMemory ? '' : config.path;

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Run migrations
    runMigrations(db);

    // Save after migrations (skip for in-memory)
    if (!isInMemory) {
      saveDatabase();
    }

    return db;
  } catch (error) {
    throw new DatabaseError(
      `Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`,
      undefined,
      { path: config.path }
    );
  }
}

/**
 * Initialize database synchronously (for backwards compatibility)
 */
export function initDatabaseSync(_config: DatabaseConfig): SqlJsDatabase {
  throw new DatabaseError('Use initDatabase (async) instead of initDatabaseSync with sql.js');
}

/**
 * Get the database instance
 */
export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new DatabaseError('Database not initialized. Call initDatabase first.');
  }
  return db;
}

/**
 * Save database to file
 */
export function saveDatabase(): void {
  // Only save if we have a database, a path, and it's not in-memory
  if (db && dbPath && dbPath !== ':memory:') {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

/**
 * Execute a transaction
 */
export function transaction<T>(fn: () => T): T {
  const database = getDatabase();
  try {
    database.run('BEGIN TRANSACTION');
    const result = fn();
    database.run('COMMIT');
    saveDatabase();
    return result;
  } catch (error) {
    database.run('ROLLBACK');
    throw error;
  }
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return db !== null;
}

/**
 * Database health check
 */
export function checkDatabaseHealth(): { healthy: boolean; error?: string } {
  try {
    const database = getDatabase();
    database.exec('SELECT 1');
    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Helper to run a single statement
 */
export function run(sql: string, params: unknown[] = []): void {
  const database = getDatabase();
  database.run(sql, params as (string | number | null | Uint8Array)[]);
}

/**
 * Helper to get a single row
 */
export function get<T>(sql: string, params: unknown[] = []): T | undefined {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params as (string | number | null | Uint8Array)[]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row as T;
  }
  stmt.free();
  return undefined;
}

/**
 * Helper to get all rows
 */
export function all<T>(sql: string, params: unknown[] = []): T[] {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params as (string | number | null | Uint8Array)[]);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}
