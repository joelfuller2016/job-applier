import { run, get, all, saveDatabase } from '../connection.js';
import { DatabaseError } from '@job-applier/core';

/**
 * Daily statistics entry
 */
export interface DailyStats {
  date: string;
  applicationsSent: number;
  jobsDiscovered: number;
  responsesReceived: number;
  interviewsScheduled: number;
}

/**
 * Stats repository for tracking daily analytics and metrics
 */
export class StatsRepository {
  /**
   * Get stats for a specific date
   */
  getByDate(date: Date): DailyStats | null {
    const dateStr = this.formatDate(date);

    try {
      const row = get<Record<string, unknown>>(
        'SELECT * FROM daily_stats WHERE date = ?',
        [dateStr]
      );

      if (!row) return null;
      return this.rowToStats(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get stats for date: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get today's stats
   */
  getToday(): DailyStats {
    const today = new Date();
    const stats = this.getByDate(today);

    if (stats) return stats;

    // Return empty stats for today if none exist
    return {
      date: this.formatDate(today),
      applicationsSent: 0,
      jobsDiscovered: 0,
      responsesReceived: 0,
      interviewsScheduled: 0,
    };
  }

  /**
   * Get stats for a date range
   */
  getByDateRange(startDate: Date, endDate: Date): DailyStats[] {
    try {
      const rows = all<Record<string, unknown>>(`
        SELECT * FROM daily_stats
        WHERE date BETWEEN ? AND ?
        ORDER BY date ASC
      `, [this.formatDate(startDate), this.formatDate(endDate)]);

      return rows.map(row => this.rowToStats(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get stats by date range: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get stats for the last N days
   */
  getLastDays(days: number): DailyStats[] {
    try {
      const rows = all<Record<string, unknown>>(`
        SELECT * FROM daily_stats
        WHERE date >= date('now', '-' || ? || ' days')
        ORDER BY date ASC
      `, [days]);

      return rows.map(row => this.rowToStats(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get last ${days} days stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Increment applications sent for today
   */
  incrementApplicationsSent(count: number = 1): DailyStats {
    return this.incrementStat('applications_sent', count);
  }

  /**
   * Increment jobs discovered for today
   */
  incrementJobsDiscovered(count: number = 1): DailyStats {
    return this.incrementStat('jobs_discovered', count);
  }

  /**
   * Increment responses received for today
   */
  incrementResponsesReceived(count: number = 1): DailyStats {
    return this.incrementStat('responses_received', count);
  }

  /**
   * Increment interviews scheduled for today
   */
  incrementInterviewsScheduled(count: number = 1): DailyStats {
    return this.incrementStat('interviews_scheduled', count);
  }

  /**
   * Set stats for a specific date
   */
  setForDate(date: Date, stats: Partial<Omit<DailyStats, 'date'>>): DailyStats {
    const dateStr = this.formatDate(date);

    try {
      // Ensure the row exists
      this.ensureDateExists(dateStr);

      // Build update query
      const updates: string[] = [];
      const params: (string | number)[] = [];

      if (stats.applicationsSent !== undefined) {
        updates.push('applications_sent = ?');
        params.push(stats.applicationsSent);
      }
      if (stats.jobsDiscovered !== undefined) {
        updates.push('jobs_discovered = ?');
        params.push(stats.jobsDiscovered);
      }
      if (stats.responsesReceived !== undefined) {
        updates.push('responses_received = ?');
        params.push(stats.responsesReceived);
      }
      if (stats.interviewsScheduled !== undefined) {
        updates.push('interviews_scheduled = ?');
        params.push(stats.interviewsScheduled);
      }

      if (updates.length > 0) {
        params.push(dateStr);
        run(`UPDATE daily_stats SET ${updates.join(', ')} WHERE date = ?`, params);
        saveDatabase();
      }

      return this.getByDate(date)!;
    } catch (error) {
      throw new DatabaseError(
        `Failed to set stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get aggregate statistics
   */
  getAggregateStats(days?: number): {
    totalApplicationsSent: number;
    totalJobsDiscovered: number;
    totalResponsesReceived: number;
    totalInterviewsScheduled: number;
    avgApplicationsPerDay: number;
    responseRate: number;
    interviewRate: number;
    activeDays: number;
  } {
    try {
      const dateFilter = days ? `WHERE date >= date('now', '-${days} days')` : '';

      const totals = get<{
        apps: number;
        jobs: number;
        responses: number;
        interviews: number;
        days: number;
      }>(`
        SELECT
          COALESCE(SUM(applications_sent), 0) as apps,
          COALESCE(SUM(jobs_discovered), 0) as jobs,
          COALESCE(SUM(responses_received), 0) as responses,
          COALESCE(SUM(interviews_scheduled), 0) as interviews,
          COUNT(*) as days
        FROM daily_stats
        ${dateFilter}
      `);

      const totalApps = totals?.apps ?? 0;
      const activeDays = totals?.days ?? 0;

      return {
        totalApplicationsSent: totalApps,
        totalJobsDiscovered: totals?.jobs ?? 0,
        totalResponsesReceived: totals?.responses ?? 0,
        totalInterviewsScheduled: totals?.interviews ?? 0,
        avgApplicationsPerDay: activeDays > 0 ? totalApps / activeDays : 0,
        responseRate: totalApps > 0 ? (totals?.responses ?? 0) / totalApps : 0,
        interviewRate: totalApps > 0 ? (totals?.interviews ?? 0) / totalApps : 0,
        activeDays,
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to get aggregate stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get weekly breakdown
   */
  getWeeklyBreakdown(weeks: number = 4): Array<{
    weekStart: string;
    weekEnd: string;
    stats: Omit<DailyStats, 'date'>;
  }> {
    try {
      const results: Array<{
        weekStart: string;
        weekEnd: string;
        stats: Omit<DailyStats, 'date'>;
      }> = [];

      for (let i = 0; i < weeks; i++) {
        const row = get<{
          week_start: string;
          week_end: string;
          apps: number;
          jobs: number;
          responses: number;
          interviews: number;
        }>(`
          SELECT
            date(date('now', 'weekday 0', '-' || (? + 1) * 7 || ' days')) as week_start,
            date(date('now', 'weekday 0', '-' || ? * 7 || ' days', '-1 day')) as week_end,
            COALESCE(SUM(applications_sent), 0) as apps,
            COALESCE(SUM(jobs_discovered), 0) as jobs,
            COALESCE(SUM(responses_received), 0) as responses,
            COALESCE(SUM(interviews_scheduled), 0) as interviews
          FROM daily_stats
          WHERE date BETWEEN
            date(date('now', 'weekday 0', '-' || (? + 1) * 7 || ' days')) AND
            date(date('now', 'weekday 0', '-' || ? * 7 || ' days', '-1 day'))
        `, [i, i, i, i]);

        if (row) {
          results.push({
            weekStart: row.week_start,
            weekEnd: row.week_end,
            stats: {
              applicationsSent: row.apps,
              jobsDiscovered: row.jobs,
              responsesReceived: row.responses,
              interviewsScheduled: row.interviews,
            },
          });
        }
      }

      return results.reverse();
    } catch (error) {
      throw new DatabaseError(
        `Failed to get weekly breakdown: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete old stats
   */
  deleteOlderThan(days: number): number {
    try {
      const countBefore = get<{ count: number }>('SELECT COUNT(*) as count FROM daily_stats');

      run(`
        DELETE FROM daily_stats
        WHERE date < date('now', '-' || ? || ' days')
      `, [days]);

      saveDatabase();

      const countAfter = get<{ count: number }>('SELECT COUNT(*) as count FROM daily_stats');
      return (countBefore?.count ?? 0) - (countAfter?.count ?? 0);
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete old stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Helper: increment a specific stat for today
   */
  private incrementStat(column: string, count: number): DailyStats {
    const dateStr = this.formatDate(new Date());

    try {
      this.ensureDateExists(dateStr);

      run(`
        UPDATE daily_stats
        SET ${column} = ${column} + ?
        WHERE date = ?
      `, [count, dateStr]);

      saveDatabase();
      return this.getByDate(new Date())!;
    } catch (error) {
      throw new DatabaseError(
        `Failed to increment ${column}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Helper: ensure a date row exists
   */
  private ensureDateExists(dateStr: string): void {
    run(`
      INSERT OR IGNORE INTO daily_stats (date, applications_sent, jobs_discovered, responses_received, interviews_scheduled)
      VALUES (?, 0, 0, 0, 0)
    `, [dateStr]);
  }

  /**
   * Helper: format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Convert database row to DailyStats
   */
  private rowToStats(row: Record<string, unknown>): DailyStats {
    return {
      date: row.date as string,
      applicationsSent: row.applications_sent as number,
      jobsDiscovered: row.jobs_discovered as number,
      responsesReceived: row.responses_received as number,
      interviewsScheduled: row.interviews_scheduled as number,
    };
  }
}

// Singleton instance
export const statsRepository = new StatsRepository();
