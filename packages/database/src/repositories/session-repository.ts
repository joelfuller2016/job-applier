/**
 * Session Repository
 * Handles database operations for automation and hunt sessions
 * 
 * SECURITY FIX: This replaces in-memory Map storage that caused data loss on restart
 * See: https://github.com/joelfuller2016/job-applier/issues/37
 */

import { run, get, all, saveDatabase } from '../connection.js';
import { generateId, toISOString, DatabaseError } from '@job-applier/core';

// Session types
export type SessionType = 'automation' | 'hunt';
export type SessionStatus = 'active' | 'paused' | 'stopped' | 'completed' | 'error';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface AutomationSession {
  id: string;
  userId: string;
  type: SessionType;
  status: SessionStatus;
  cancelRequested: boolean;
  config: Record<string, unknown>;
  stats: {
    applicationsSubmitted?: number;
    applicationsSkipped?: number;
    errorsEncountered?: number;
    jobsDiscovered?: number;
    jobsMatched?: number;
  };
  currentTask?: string;
  progress: number;
  totalItems: number;
  processedItems: number;
  errorMessage?: string;
  startedAt: string;
  endedAt?: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionLog {
  id: string;
  sessionId: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export interface CreateSessionInput {
  userId: string;
  type: SessionType;
  config: Record<string, unknown>;
  totalItems?: number;
}

export interface UpdateSessionInput {
  status?: SessionStatus;
  cancelRequested?: boolean;
  currentTask?: string;
  progress?: number;
  processedItems?: number;
  stats?: AutomationSession['stats'];
  errorMessage?: string;
}

/**
 * Session repository for database operations
 */
export class SessionRepository {
  /**
   * Create a new session
   */
  create(input: CreateSessionInput): AutomationSession {
    const now = toISOString(new Date());
    const id = generateId();

    const session: AutomationSession = {
      id,
      userId: input.userId,
      type: input.type,
      status: 'active',
      cancelRequested: false,
      config: input.config,
      stats: {},
      progress: 0,
      totalItems: input.totalItems ?? 0,
      processedItems: 0,
      startedAt: now,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    };

    try {
      run(`
        INSERT INTO automation_sessions (
          id, user_id, type, status, cancel_requested, config, stats,
          current_task, progress, total_items, processed_items, error_message,
          started_at, ended_at, last_activity_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        session.id,
        session.userId,
        session.type,
        session.status,
        session.cancelRequested ? 1 : 0,
        JSON.stringify(session.config),
        JSON.stringify(session.stats),
        session.currentTask ?? null,
        session.progress,
        session.totalItems,
        session.processedItems,
        session.errorMessage ?? null,
        session.startedAt,
        session.endedAt ?? null,
        session.lastActivityAt,
        session.createdAt,
        session.updatedAt,
      ]);

      saveDatabase();

      // Add initial log
      this.addLog(session.id, 'info', `${input.type} session started`);

      return session;
    } catch (error) {
      throw new DatabaseError(
        `Failed to create session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find session by ID
   */
  findById(id: string): AutomationSession | null {
    try {
      const row = get<Record<string, unknown>>(
        'SELECT * FROM automation_sessions WHERE id = ?',
        [id]
      );
      if (!row) return null;
      return this.rowToSession(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find active session for user by type
   */
  findActiveByUserAndType(userId: string, type: SessionType): AutomationSession | null {
    try {
      const row = get<Record<string, unknown>>(`
        SELECT * FROM automation_sessions 
        WHERE user_id = ? AND type = ? AND status IN ('active', 'paused')
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId, type]);
      if (!row) return null;
      return this.rowToSession(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find active session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find sessions by user ID
   */
  findByUser(userId: string, options?: { type?: SessionType; limit?: number; offset?: number }): AutomationSession[] {
    const { type, limit = 10, offset = 0 } = options ?? {};
    
    try {
      const whereClause = type 
        ? 'WHERE user_id = ? AND type = ?' 
        : 'WHERE user_id = ?';
      const params = type ? [userId, type] : [userId];

      const rows = all<Record<string, unknown>>(`
        SELECT * FROM automation_sessions
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      return rows.map(row => this.rowToSession(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find sessions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update session
   */
  update(id: string, input: UpdateSessionInput): AutomationSession | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const now = toISOString(new Date());

    try {
      const updates: string[] = ['last_activity_at = ?'];
      const params: unknown[] = [now];

      if (input.status !== undefined) {
        updates.push('status = ?');
        params.push(input.status);
        
        // Set ended_at when session ends
        if (['stopped', 'completed', 'error'].includes(input.status)) {
          updates.push('ended_at = ?');
          params.push(now);
        }
      }

      if (input.cancelRequested !== undefined) {
        updates.push('cancel_requested = ?');
        params.push(input.cancelRequested ? 1 : 0);
      }

      if (input.currentTask !== undefined) {
        updates.push('current_task = ?');
        params.push(input.currentTask);
      }

      if (input.progress !== undefined) {
        updates.push('progress = ?');
        params.push(input.progress);
      }

      if (input.processedItems !== undefined) {
        updates.push('processed_items = ?');
        params.push(input.processedItems);
      }

      if (input.stats !== undefined) {
        updates.push('stats = ?');
        params.push(JSON.stringify({ ...existing.stats, ...input.stats }));
      }

      if (input.errorMessage !== undefined) {
        updates.push('error_message = ?');
        params.push(input.errorMessage);
      }

      params.push(id);

      run(`
        UPDATE automation_sessions
        SET ${updates.join(', ')}
        WHERE id = ?
      `, params);

      saveDatabase();
      return this.findById(id);
    } catch (error) {
      throw new DatabaseError(
        `Failed to update session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Request cancellation (polling-based - replaces AbortController)
   */
  requestCancel(id: string): boolean {
    try {
      run(`
        UPDATE automation_sessions
        SET cancel_requested = 1, last_activity_at = ?
        WHERE id = ? AND status IN ('active', 'paused')
      `, [toISOString(new Date()), id]);
      
      saveDatabase();
      
      this.addLog(id, 'info', 'Cancellation requested');
      
      return true;
    } catch (error) {
      throw new DatabaseError(
        `Failed to request cancellation: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if cancellation was requested
   */
  isCancelRequested(id: string): boolean {
    try {
      const row = get<{ cancel_requested: number }>(
        'SELECT cancel_requested FROM automation_sessions WHERE id = ?',
        [id]
      );
      return row?.cancel_requested === 1;
    } catch (error) {
      return false;
    }
  }

  /**
   * Add log entry to session
   */
  addLog(sessionId: string, level: LogLevel, message: string, context?: Record<string, unknown>): SessionLog {
    const now = toISOString(new Date());
    const id = generateId();

    const log: SessionLog = {
      id,
      sessionId,
      level,
      message,
      context,
      timestamp: now,
    };

    try {
      run(`
        INSERT INTO session_logs (id, session_id, level, message, context, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        log.id,
        log.sessionId,
        log.level,
        log.message,
        log.context ? JSON.stringify(log.context) : null,
        log.timestamp,
      ]);

      saveDatabase();
      return log;
    } catch (error) {
      throw new DatabaseError(
        `Failed to add log: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get logs for session
   */
  getLogs(sessionId: string, options?: { level?: LogLevel; limit?: number; offset?: number }): SessionLog[] {
    const { level, limit = 100, offset = 0 } = options ?? {};

    try {
      const whereClause = level
        ? 'WHERE session_id = ? AND level = ?'
        : 'WHERE session_id = ?';
      const params = level ? [sessionId, level] : [sessionId];

      const rows = all<Record<string, unknown>>(`
        SELECT * FROM session_logs
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
      `, [...params, limit, offset]);

      return rows.map(row => ({
        id: row.id as string,
        sessionId: row.session_id as string,
        level: row.level as LogLevel,
        message: row.message as string,
        context: row.context ? JSON.parse(row.context as string) : undefined,
        timestamp: row.timestamp as string,
      }));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get logs: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Clean up old completed sessions (older than 30 days)
   */
  cleanupOldSessions(daysOld: number = 30): number {
    try {
      // Count rows to be deleted first
      const countResult = get<{ count: number }>(`
        SELECT COUNT(*) as count FROM automation_sessions
        WHERE status IN ('completed', 'stopped', 'error')
        AND ended_at < datetime('now', '-' || ? || ' days')
      `, [daysOld]);

      const count = countResult?.count ?? 0;

      if (count > 0) {
        run(`
          DELETE FROM automation_sessions
          WHERE status IN ('completed', 'stopped', 'error')
          AND ended_at < datetime('now', '-' || ? || ' days')
        `, [daysOld]);

        saveDatabase();
      }

      return count;
    } catch (error) {
      throw new DatabaseError(
        `Failed to cleanup sessions: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert database row to AutomationSession
   */
  private rowToSession(row: Record<string, unknown>): AutomationSession {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      type: row.type as SessionType,
      status: row.status as SessionStatus,
      cancelRequested: (row.cancel_requested as number) === 1,
      config: JSON.parse(row.config as string),
      stats: JSON.parse(row.stats as string),
      currentTask: row.current_task as string | undefined,
      progress: row.progress as number,
      totalItems: row.total_items as number,
      processedItems: row.processed_items as number,
      errorMessage: row.error_message as string | undefined,
      startedAt: row.started_at as string,
      endedAt: row.ended_at as string | undefined,
      lastActivityAt: row.last_activity_at as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

export const sessionRepository = new SessionRepository();
