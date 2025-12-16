import type { Database as SqlJsDatabase } from 'sql.js';
import { SCHEMA, INDEXES, TRIGGERS } from '../schema.js';

/**
 * Migration version tracking table
 */
const MIGRATION_TABLE = `
  CREATE TABLE IF NOT EXISTS migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

/**
 * Get current migration version
 */
function getCurrentVersion(db: SqlJsDatabase): number {
  try {
    const stmt = db.prepare('SELECT MAX(version) as version FROM migrations');
    if (stmt.step()) {
      const row = stmt.getAsObject() as { version: number | null };
      stmt.free();
      return row?.version ?? 0;
    }
    stmt.free();
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Record a migration
 */
function recordMigration(db: SqlJsDatabase, version: number, name: string): void {
  db.run('INSERT INTO migrations (version, name) VALUES (?, ?)', [version, name]);
}

/**
 * Migration definitions
 */
const MIGRATIONS: Array<{ version: number; name: string; up: (db: SqlJsDatabase) => void }> = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db) => {
      // Create all tables
      for (const [name, sql] of Object.entries(SCHEMA)) {
        db.exec(sql);
        console.log(`  Created table: ${name}`);
      }

      // Create indexes
      for (const [name, sql] of Object.entries(INDEXES)) {
        db.exec(sql);
        console.log(`  Created index: ${name}`);
      }

      // Create triggers
      for (const [name, sql] of Object.entries(TRIGGERS)) {
        db.exec(sql);
        console.log(`  Created trigger: ${name}`);
      }
    },
  },
  {
    version: 2,
    name: 'add_search_history',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS search_history (
          id TEXT PRIMARY KEY,
          query TEXT NOT NULL,
          results_count INTEGER NOT NULL,
          platforms TEXT NOT NULL,
          searched_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);
      db.exec('CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON search_history(searched_at)');
      console.log('  Created table: search_history');
    },
  },
  {
    version: 3,
    name: 'add_daily_stats',
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS daily_stats (
          date TEXT PRIMARY KEY,
          applications_sent INTEGER DEFAULT 0,
          jobs_discovered INTEGER DEFAULT 0,
          responses_received INTEGER DEFAULT 0,
          interviews_scheduled INTEGER DEFAULT 0
        )
      `);
      console.log('  Created table: daily_stats');
    },
  },
];

/**
 * Run all pending migrations
 */
export function runMigrations(db: SqlJsDatabase): void {
  // Create migrations table
  db.exec(MIGRATION_TABLE);

  const currentVersion = getCurrentVersion(db);
  const pendingMigrations = MIGRATIONS.filter(m => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    console.log('Database is up to date');
    return;
  }

  console.log(`Running ${pendingMigrations.length} migration(s)...`);

  for (const migration of pendingMigrations) {
    console.log(`\nMigration ${migration.version}: ${migration.name}`);

    try {
      db.run('BEGIN TRANSACTION');
      migration.up(db);
      recordMigration(db, migration.version, migration.name);
      db.run('COMMIT');
      console.log(`  Completed migration ${migration.version}`);
    } catch (error) {
      db.run('ROLLBACK');
      throw error;
    }
  }

  console.log('\nAll migrations completed successfully');
}

/**
 * Get migration status
 */
export function getMigrationStatus(db: SqlJsDatabase): {
  currentVersion: number;
  pendingCount: number;
  appliedMigrations: Array<{ version: number; name: string; applied_at: string }>;
} {
  const currentVersion = getCurrentVersion(db);
  const pendingCount = MIGRATIONS.filter(m => m.version > currentVersion).length;

  let appliedMigrations: Array<{ version: number; name: string; applied_at: string }> = [];

  try {
    const stmt = db.prepare('SELECT version, name, applied_at FROM migrations ORDER BY version');
    while (stmt.step()) {
      appliedMigrations.push(stmt.getAsObject() as { version: number; name: string; applied_at: string });
    }
    stmt.free();
  } catch {
    // Migrations table doesn't exist yet
  }

  return {
    currentVersion,
    pendingCount,
    appliedMigrations,
  };
}
