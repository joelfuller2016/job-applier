import { run, get, all, saveDatabase } from '../connection.js';
import { generateId, toISOString, DatabaseError } from '@job-applier/core';

/**
 * Search history entry
 */
export interface SearchHistoryEntry {
  id: string;
  query: string;
  resultsCount: number;
  platforms: string[];
  searchedAt: string;
}

/**
 * Search history repository for logging and querying search history
 */
export class SearchHistoryRepository {
  /**
   * Log a new search
   */
  log(query: string, resultsCount: number, platforms: string[]): SearchHistoryEntry {
    const entry: SearchHistoryEntry = {
      id: generateId(),
      query,
      resultsCount,
      platforms,
      searchedAt: toISOString(new Date()),
    };

    try {
      run(`
        INSERT INTO search_history (id, query, results_count, platforms, searched_at)
        VALUES (?, ?, ?, ?, ?)
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
        `Failed to log search: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find search by ID
   */
  findById(id: string): SearchHistoryEntry | null {
    try {
      const row = get<Record<string, unknown>>(
        'SELECT * FROM search_history WHERE id = ?',
        [id]
      );

      if (!row) return null;
      return this.rowToEntry(row);
    } catch (error) {
      throw new DatabaseError(
        `Failed to find search: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get recent searches
   */
  getRecent(limit: number = 20): SearchHistoryEntry[] {
    try {
      const rows = all<Record<string, unknown>>(`
        SELECT * FROM search_history
        ORDER BY searched_at DESC
        LIMIT ?
      `, [limit]);

      return rows.map(row => this.rowToEntry(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get recent searches: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Search history by query text
   */
  searchByQuery(queryPattern: string, limit: number = 50): SearchHistoryEntry[] {
    try {
      const rows = all<Record<string, unknown>>(`
        SELECT * FROM search_history
        WHERE query LIKE ?
        ORDER BY searched_at DESC
        LIMIT ?
      `, [`%${queryPattern}%`, limit]);

      return rows.map(row => this.rowToEntry(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to search history: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get search history by date range
   */
  getByDateRange(startDate: Date, endDate: Date): SearchHistoryEntry[] {
    try {
      const rows = all<Record<string, unknown>>(`
        SELECT * FROM search_history
        WHERE searched_at BETWEEN ? AND ?
        ORDER BY searched_at DESC
      `, [toISOString(startDate), toISOString(endDate)]);

      return rows.map(row => this.rowToEntry(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get searches by date range: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get statistics about search history
   */
  getStats(): {
    totalSearches: number;
    totalResults: number;
    avgResultsPerSearch: number;
    searchesToday: number;
    topQueries: Array<{ query: string; count: number }>;
  } {
    try {
      // Total searches and results
      const totals = get<{ count: number; total_results: number }>(`
        SELECT COUNT(*) as count, COALESCE(SUM(results_count), 0) as total_results
        FROM search_history
      `);

      // Searches today
      const today = get<{ count: number }>(`
        SELECT COUNT(*) as count
        FROM search_history
        WHERE date(searched_at) = date('now')
      `);

      // Top queries
      const topQueries = all<{ query: string; count: number }>(`
        SELECT query, COUNT(*) as count
        FROM search_history
        GROUP BY query
        ORDER BY count DESC
        LIMIT 10
      `);

      const totalSearches = totals?.count ?? 0;
      const totalResults = totals?.total_results ?? 0;

      return {
        totalSearches,
        totalResults,
        avgResultsPerSearch: totalSearches > 0 ? totalResults / totalSearches : 0,
        searchesToday: today?.count ?? 0,
        topQueries,
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to get search stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete old search history
   */
  deleteOlderThan(days: number): number {
    try {
      const countBefore = get<{ count: number }>('SELECT COUNT(*) as count FROM search_history');

      run(`
        DELETE FROM search_history
        WHERE searched_at < datetime('now', '-' || ? || ' days')
      `, [days]);

      saveDatabase();

      const countAfter = get<{ count: number }>('SELECT COUNT(*) as count FROM search_history');
      return (countBefore?.count ?? 0) - (countAfter?.count ?? 0);
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
  private rowToEntry(row: Record<string, unknown>): SearchHistoryEntry {
    return {
      id: row.id as string,
      query: row.query as string,
      resultsCount: row.results_count as number,
      platforms: JSON.parse(row.platforms as string),
      searchedAt: row.searched_at as string,
    };
  }
}

// Singleton instance
export const searchHistoryRepository = new SearchHistoryRepository();
