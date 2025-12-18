import { run, get, all, saveDatabase } from '../connection.js';
import {
  ApplicationEvent,
  generateId,
  toISOString,
  DatabaseError,
} from '@job-applier/core';

/**
 * Application event types
 */
export type ApplicationEventType =
  | 'created'
  | 'submitted'
  | 'status-change'
  | 'response-received'
  | 'interview-scheduled'
  | 'follow-up-sent'
  | 'note-added'
  | 'error';

/**
 * Event database row
 */
interface EventRow {
  id: string;
  application_id: string;
  type: string;
  description: string;
  metadata: string | null;
  timestamp: string;
}

/**
 * Event query options
 */
export interface EventQueryOptions {
  applicationId?: string;
  type?: ApplicationEventType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Application events repository for event logging
 */
export class ApplicationEventsRepository {
  /**
   * Create a new event
   */
  create(
    applicationId: string,
    type: ApplicationEventType,
    description: string,
    metadata?: Record<string, unknown>
  ): ApplicationEvent {
    const now = toISOString(new Date());

    const event: ApplicationEvent = {
      id: generateId(),
      applicationId,
      type,
      description,
      metadata,
      timestamp: now,
    };

    try {
      run(`
        INSERT INTO application_events (
          id, application_id, type, description, metadata, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        event.id,
        event.applicationId,
        event.type,
        event.description,
        event.metadata ? JSON.stringify(event.metadata) : null,
        event.timestamp,
      ]);

      saveDatabase();
      return event;
    } catch (error) {
      throw new DatabaseError(
        `Failed to create event: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find event by ID
   */
  findById(id: string): ApplicationEvent | null {
    try {
      const row = get<EventRow>(
        'SELECT * FROM application_events WHERE id = ?',
        [id]
      );

      if (!row) {
        return null;
      }

      return this.rowToEvent(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find event: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find events by application ID
   */
  findByApplicationId(applicationId: string): ApplicationEvent[] {
    try {
      const rows = all<EventRow>(
        'SELECT * FROM application_events WHERE application_id = ? ORDER BY timestamp DESC',
        [applicationId]
      );

      return rows.map(row => this.rowToEvent(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find events for application: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Query events with filters
   */
  query(options: EventQueryOptions = {}): ApplicationEvent[] {
    try {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (options.applicationId) {
        conditions.push('application_id = ?');
        params.push(options.applicationId);
      }

      if (options.type) {
        conditions.push('type = ?');
        params.push(options.type);
      }

      if (options.startDate) {
        conditions.push('timestamp >= ?');
        params.push(options.startDate);
      }

      if (options.endDate) {
        conditions.push('timestamp <= ?');
        params.push(options.endDate);
      }

      let sql = 'SELECT * FROM application_events';
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' ORDER BY timestamp DESC';

      if (options.limit) {
        sql += ` LIMIT ${options.limit}`;
        if (options.offset) {
          sql += ` OFFSET ${options.offset}`;
        }
      }

      const rows = all<EventRow>(sql, params);
      return rows.map(row => this.rowToEvent(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to query events: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find events by type
   */
  findByType(type: ApplicationEventType, limit?: number): ApplicationEvent[] {
    try {
      let sql = 'SELECT * FROM application_events WHERE type = ? ORDER BY timestamp DESC';
      if (limit) {
        sql += ` LIMIT ${limit}`;
      }

      const rows = all<EventRow>(sql, [type]);
      return rows.map(row => this.rowToEvent(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to find events by type: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get recent events
   */
  getRecent(limit: number = 50): ApplicationEvent[] {
    try {
      const rows = all<EventRow>(
        'SELECT * FROM application_events ORDER BY timestamp DESC LIMIT ?',
        [limit]
      );

      return rows.map(row => this.rowToEvent(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get recent events: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete event by ID
   */
  delete(id: string): boolean {
    try {
      const existing = this.findById(id);
      if (!existing) {
        return false;
      }

      run('DELETE FROM application_events WHERE id = ?', [id]);
      saveDatabase();
      return true;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete event: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete all events for an application
   */
  deleteByApplicationId(applicationId: string): number {
    try {
      const events = this.findByApplicationId(applicationId);
      run('DELETE FROM application_events WHERE application_id = ?', [applicationId]);
      saveDatabase();
      return events.length;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete events for application: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete old events
   */
  deleteOlderThan(date: string): number {
    try {
      const rows = all<{ count: number }>(
        'SELECT COUNT(*) as count FROM application_events WHERE timestamp < ?',
        [date]
      );
      const count = rows[0]?.count ?? 0;

      run('DELETE FROM application_events WHERE timestamp < ?', [date]);
      saveDatabase();
      return count;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete old events: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Count events by type
   */
  countByType(): Record<ApplicationEventType, number> {
    try {
      const rows = all<{ type: string; count: number }>(
        'SELECT type, COUNT(*) as count FROM application_events GROUP BY type'
      );

      const counts: Record<string, number> = {};
      for (const row of rows) {
        counts[row.type] = row.count;
      }

      return counts as Record<ApplicationEventType, number>;
    } catch (error) {
      throw new DatabaseError(
        `Failed to count events by type: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Log a status change event
   */
  logStatusChange(
    applicationId: string,
    fromStatus: string,
    toStatus: string,
    reason?: string
  ): ApplicationEvent {
    return this.create(
      applicationId,
      'status-change',
      `Status changed from ${fromStatus} to ${toStatus}${reason ? `: ${reason}` : ''}`,
      { fromStatus, toStatus, reason }
    );
  }

  /**
   * Log an error event
   */
  logError(applicationId: string, error: string, details?: Record<string, unknown>): ApplicationEvent {
    return this.create(
      applicationId,
      'error',
      error,
      details
    );
  }

  /**
   * Log application submission
   */
  logSubmission(applicationId: string, platform: string, method: string): ApplicationEvent {
    return this.create(
      applicationId,
      'submitted',
      `Application submitted via ${method} on ${platform}`,
      { platform, method }
    );
  }

  /**
   * Log interview scheduled
   */
  logInterviewScheduled(
    applicationId: string,
    interviewDate: string,
    interviewType?: string
  ): ApplicationEvent {
    return this.create(
      applicationId,
      'interview-scheduled',
      `Interview scheduled for ${interviewDate}${interviewType ? ` (${interviewType})` : ''}`,
      { interviewDate, interviewType }
    );
  }

  /**
   * Convert database row to ApplicationEvent
   */
  private rowToEvent(row: EventRow): ApplicationEvent {
    const event: ApplicationEvent = {
      id: row.id,
      applicationId: row.application_id,
      type: row.type as ApplicationEventType,
      description: row.description,
      timestamp: row.timestamp,
    };

    if (row.metadata) {
      try {
        event.metadata = JSON.parse(row.metadata);
      } catch {
        // If parsing fails, leave metadata undefined
      }
    }

    return event;
  }
}

// Singleton instance
export const eventsRepository = new ApplicationEventsRepository();
