import { run, get, all, saveDatabase } from '../connection.js';
import {
  JobPlatform,
  generateId,
  toISOString,
  DatabaseError,
} from '@job-applier/core';

/**
 * Search history entry
 */
export interface SearchHistoryEntry {
  id: string;
  query: string;
  resultsCount: number;
  platforms: JobPlatform[];
  searchedAt: string;
}

/**
 * Search history database row
 */
interface SearchHistoryRow {
  id: string;
  query: string;
  results_count: number;
  platforms: string;
  searched_at: string;
}

/**
 * Search history query options
 */
export interface SearchHistoryQueryOptions {
  query?: string;
  platform?: JobPlatform;
  startDate?: string;
  endDate?: string;
  minResults?: number;
  limit?: number;
  offset?: number;
}

/**
 * Search history repository for tracking job searches
 */
export class SearchHistoryRepository {
  /**
   * Record a new search
   */
  create(
    query: string,
    resultsCount: number,
    platforms: JobPlatform[]
  ): SearchHistoryEntry {
    const now = toISOString(new Date());

    const entry: SearchHistoryEntry = {
      id: generateId(),
      query,
      resultsCount,
      platforms,
      searchedAt: now,
    };

    try {
      run(`
        INSERT INTO search_history (
          id, query, results_count, platforms, searched_at
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        entry.id,
        entry.query,
        entry.resultsCount,
        JSON.stringify(entry.platforms),
        entry.searchedAt,
      ]);

      saveDatabase();
      return entry;
    } catch (error) {
      throw new DatabaseError(
        `Failed to record search: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find search by ID
   */
  findById(id: string): SearchHistoryEntry | null {
    try {
      const row = get<SearchHistoryRow>(
        'SELECT * FROM search_history WHERE id = ?',
        [id]
      );

      if (!row) {
        return null;
      }

      return this.rowToEntry(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find search: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all search history
   */
  findAll(limit?: number): SearchHistoryEntry[] {
    try {
      let sql = 'SELECT * FROM search_history ORDER BY searched_at DESC';
      if (limit) {
        sql += ` LIMIT ${limit}`;
      }

      const rows = all<SearchHistoryRow>(sql);
      return rows.map(row => this.rowToEntry(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get search history: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Query search history with filters
   */
  query(options: SearchHistoryQueryOptions = {}): SearchHistoryEntry[] {
    try {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (options.query) {
        conditions.push('query LIKE ?');
        params.push(`%${options.query}%`);
      }

      if (options.platform) {
        conditions.push('platforms LIKE ?');
        params.push(`%"${options.platform}"%`);
      }

      if (options.startDate) {
        conditions.push('searched_at >= ?');
        params.push(options.startDate);
      }

      if (options.endDate) {
        conditions.push('searched_at <= ?');
        params.push(options.endDate);
      }

      if (options.minResults !== undefined) {
        conditions.push('results_count >= ?');
        params.push(options.minResults);
      }

      let sql = 'SELECT * FROM search_history';
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' ORDER BY searched_at DESC';

      if (options.limit) {
        sql += ` LIMIT ${options.limit}`;
        if (options.offset) {
          sql += ` OFFSET ${options.offset}`;
        }
      }

      const rows = all<SearchHistoryRow>(sql, params);
      return rows.map(row => this.rowToEntry(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to query search history: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get recent searches
   */
  getRecent(limit: number = 10): SearchHistoryEntry[] {
    return this.findAll(limit);
  }

  /**
   * Get unique queries
   */
  getUniqueQueries(): string[] {
    try {
      const rows = all<{ query: string }>(
        'SELECT DISTINCT query FROM search_history ORDER BY query'
      );

      return rows.map(row => row.query);
    } catch (error) {
      throw new DatabaseError(
        `Failed to get unique queries: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get search statistics
   */
  getStats(): {
    totalSearches: number;
    totalResults: number;
    averageResults: number;
    topQueries: Array<{ query: string; count: number }>;
    searchesByPlatform: Record<string, number>;
  } {
    try {
      // Get total searches and results
      const totals = get<{ total_searches: number; total_results: number }>(
        'SELECT COUNT(*) as total_searches, SUM(results_count) as total_results FROM search_history'
      );

      // Get top queries
      const topQueries = all<{ query: string; count: number }>(
        `SELECT query, COUNT(*) as count
         FROM search_history
         GROUP BY query
         ORDER BY count DESC
         LIMIT 10`
      );

      // Get all entries to count platforms
      const allEntries = this.findAll();
      const platformCounts: Record<string, number> = {};

      for (const entry of allEntries) {
        for (const platform of entry.platforms) {
          platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        }
      }

      const totalSearches = totals?.total_searches ?? 0;
      const totalResults = totals?.total_results ?? 0;

      return {
        totalSearches,
        totalResults,
        averageResults: totalSearches > 0 ? Math.round(totalResults / totalSearches) : 0,
        topQueries: topQueries.map(q => ({ query: q.query, count: q.count })),
        searchesByPlatform: platformCounts,
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to get search stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a search entry
   */
  delete(id: string): boolean {
    try {
      const existing = this.findById(id);
      if (!existing) {
        return false;
      }

      run('DELETE FROM search_history WHERE id = ?', [id]);
      saveDatabase();
      return true;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete search: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete old search history
   */
  deleteOlderThan(date: string): number {
    try {
      const rows = all<{ count: number }>(
        'SELECT COUNT(*) as count FROM search_history WHERE searched_at < ?',
        [date]
      );
      const count = rows[0]?.count ?? 0;

      run('DELETE FROM search_history WHERE searched_at < ?', [date]);
      saveDatabase();
      return count;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete old searches: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Clear all search history
   */
  clear(): void {
    try {
      run('DELETE FROM search_history');
      saveDatabase();
    } catch (error) {
      throw new DatabaseError(
        `Failed to clear search history: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert database row to SearchHistoryEntry
   */
  private rowToEntry(row: SearchHistoryRow): SearchHistoryEntry {
    return {
      id: row.id,
      query: row.query,
      resultsCount: row.results_count,
      platforms: JSON.parse(row.platforms) as JobPlatform[],
      searchedAt: row.searched_at,
    };
  }
}

// Singleton instance
export const searchHistoryRepository = new SearchHistoryRepository();
