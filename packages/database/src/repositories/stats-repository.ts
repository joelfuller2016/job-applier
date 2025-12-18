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
 * Daily stats database row
 */
interface StatsRow {
  date: string;
  applications_sent: number;
  jobs_discovered: number;
  responses_received: number;
  interviews_scheduled: number;
}

/**
 * Date range for queries
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Aggregated statistics
 */
export interface AggregatedStats {
  totalApplicationsSent: number;
  totalJobsDiscovered: number;
  totalResponsesReceived: number;
  totalInterviewsScheduled: number;
  responseRate: number;
  interviewRate: number;
  daysTracked: number;
  averageApplicationsPerDay: number;
}

/**
 * Daily stats repository for analytics
 */
export class DailyStatsRepository {
  /**
   * Get today's date string (YYYY-MM-DD)
   */
  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get or create stats for a date
   */
  getOrCreate(date?: string): DailyStats {
    const targetDate = date || this.getToday();

    try {
      const existing = this.findByDate(targetDate);
      if (existing) {
        return existing;
      }

      // Create new entry
      run(`
        INSERT INTO daily_stats (
          date, applications_sent, jobs_discovered, responses_received, interviews_scheduled
        ) VALUES (?, 0, 0, 0, 0)
      `, [targetDate]);

      saveDatabase();

      return {
        date: targetDate,
        applicationsSent: 0,
        jobsDiscovered: 0,
        responsesReceived: 0,
        interviewsScheduled: 0,
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to get/create stats for ${targetDate}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find stats by date
   */
  findByDate(date: string): DailyStats | null {
    try {
      const row = get<StatsRow>(
        'SELECT * FROM daily_stats WHERE date = ?',
        [date]
      );

      if (!row) {
        return null;
      }

      return this.rowToStats(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find stats for ${date}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get today's stats
   */
  getTodays(): DailyStats {
    return this.getOrCreate(this.getToday());
  }

  /**
   * Get stats for a date range
   */
  findByDateRange(range: DateRange): DailyStats[] {
    try {
      const rows = all<StatsRow>(
        'SELECT * FROM daily_stats WHERE date >= ? AND date <= ? ORDER BY date DESC',
        [range.startDate, range.endDate]
      );

      return rows.map(row => this.rowToStats(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get stats for range: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get stats for last N days
   */
  getLastNDays(days: number): DailyStats[] {
    const endDate = this.getToday();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);

    return this.findByDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate,
    });
  }

  /**
   * Get all stats
   */
  findAll(): DailyStats[] {
    try {
      const rows = all<StatsRow>(
        'SELECT * FROM daily_stats ORDER BY date DESC'
      );

      return rows.map(row => this.rowToStats(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get all stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Increment applications sent
   */
  incrementApplicationsSent(date?: string, amount: number = 1): DailyStats {
    const targetDate = date || this.getToday();
    this.getOrCreate(targetDate);

    try {
      run(
        'UPDATE daily_stats SET applications_sent = applications_sent + ? WHERE date = ?',
        [amount, targetDate]
      );

      saveDatabase();
      return this.findByDate(targetDate)!;
    } catch (error) {
      throw new DatabaseError(
        `Failed to increment applications sent: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Increment jobs discovered
   */
  incrementJobsDiscovered(date?: string, amount: number = 1): DailyStats {
    const targetDate = date || this.getToday();
    this.getOrCreate(targetDate);

    try {
      run(
        'UPDATE daily_stats SET jobs_discovered = jobs_discovered + ? WHERE date = ?',
        [amount, targetDate]
      );

      saveDatabase();
      return this.findByDate(targetDate)!;
    } catch (error) {
      throw new DatabaseError(
        `Failed to increment jobs discovered: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Increment responses received
   */
  incrementResponsesReceived(date?: string, amount: number = 1): DailyStats {
    const targetDate = date || this.getToday();
    this.getOrCreate(targetDate);

    try {
      run(
        'UPDATE daily_stats SET responses_received = responses_received + ? WHERE date = ?',
        [amount, targetDate]
      );

      saveDatabase();
      return this.findByDate(targetDate)!;
    } catch (error) {
      throw new DatabaseError(
        `Failed to increment responses received: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Increment interviews scheduled
   */
  incrementInterviewsScheduled(date?: string, amount: number = 1): DailyStats {
    const targetDate = date || this.getToday();
    this.getOrCreate(targetDate);

    try {
      run(
        'UPDATE daily_stats SET interviews_scheduled = interviews_scheduled + ? WHERE date = ?',
        [amount, targetDate]
      );

      saveDatabase();
      return this.findByDate(targetDate)!;
    } catch (error) {
      throw new DatabaseError(
        `Failed to increment interviews scheduled: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update stats for a date
   */
  update(date: string, updates: Partial<Omit<DailyStats, 'date'>>): DailyStats | null {
    const existing = this.findByDate(date);
    if (!existing) {
      return null;
    }

    try {
      const updated = { ...existing, ...updates };

      run(`
        UPDATE daily_stats SET
          applications_sent = ?,
          jobs_discovered = ?,
          responses_received = ?,
          interviews_scheduled = ?
        WHERE date = ?
      `, [
        updated.applicationsSent,
        updated.jobsDiscovered,
        updated.responsesReceived,
        updated.interviewsScheduled,
        date,
      ]);

      saveDatabase();
      return updated;
    } catch (error) {
      throw new DatabaseError(
        `Failed to update stats for ${date}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get aggregated statistics
   */
  getAggregatedStats(range?: DateRange): AggregatedStats {
    try {
      let sql = 'SELECT COUNT(*) as days, SUM(applications_sent) as apps, SUM(jobs_discovered) as jobs, SUM(responses_received) as responses, SUM(interviews_scheduled) as interviews FROM daily_stats';
      const params: unknown[] = [];

      if (range) {
        sql += ' WHERE date >= ? AND date <= ?';
        params.push(range.startDate, range.endDate);
      }

      const row = get<{
        days: number;
        apps: number;
        jobs: number;
        responses: number;
        interviews: number;
      }>(sql, params);

      const days = row?.days ?? 0;
      const apps = row?.apps ?? 0;
      const responses = row?.responses ?? 0;
      const interviews = row?.interviews ?? 0;
      const jobs = row?.jobs ?? 0;

      return {
        totalApplicationsSent: apps,
        totalJobsDiscovered: jobs,
        totalResponsesReceived: responses,
        totalInterviewsScheduled: interviews,
        responseRate: apps > 0 ? Math.round((responses / apps) * 100) : 0,
        interviewRate: apps > 0 ? Math.round((interviews / apps) * 100) : 0,
        daysTracked: days,
        averageApplicationsPerDay: days > 0 ? Math.round(apps / days) : 0,
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to get aggregated stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get weekly stats summary
   */
  getWeeklySummary(): AggregatedStats {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return this.getAggregatedStats({
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  }

  /**
   * Get monthly stats summary
   */
  getMonthlySummary(): AggregatedStats {
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    return this.getAggregatedStats({
      startDate: monthAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    });
  }

  /**
   * Delete stats for a date
   */
  delete(date: string): boolean {
    try {
      const existing = this.findByDate(date);
      if (!existing) {
        return false;
      }

      run('DELETE FROM daily_stats WHERE date = ?', [date]);
      saveDatabase();
      return true;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete stats for ${date}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete old stats
   */
  deleteOlderThan(date: string): number {
    try {
      const rows = all<{ count: number }>(
        'SELECT COUNT(*) as count FROM daily_stats WHERE date < ?',
        [date]
      );
      const count = rows[0]?.count ?? 0;

      run('DELETE FROM daily_stats WHERE date < ?', [date]);
      saveDatabase();
      return count;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete old stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Clear all stats
   */
  clear(): void {
    try {
      run('DELETE FROM daily_stats');
      saveDatabase();
    } catch (error) {
      throw new DatabaseError(
        `Failed to clear stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert database row to DailyStats
   */
  private rowToStats(row: StatsRow): DailyStats {
    return {
      date: row.date,
      applicationsSent: row.applications_sent,
      jobsDiscovered: row.jobs_discovered,
      responsesReceived: row.responses_received,
      interviewsScheduled: row.interviews_scheduled,
    };
  }
}

// Singleton instance
export const statsRepository = new DailyStatsRepository();
