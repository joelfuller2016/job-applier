import { run, get, all, saveDatabase } from '../connection.js';
import {
  JobMatch,
  JobMatchSchema,
  generateId,
  toISOString,
  DatabaseError,
} from '@job-applier/core';

/**
 * Match repository for job-profile matching data
 */
export class MatchRepository {
  /**
   * Save a job match
   */
  save(match: Omit<JobMatch, 'id' | 'analyzedAt'>): JobMatch {
    const now = toISOString(new Date());

    const newMatch: JobMatch = {
      ...match,
      id: generateId(),
      analyzedAt: now,
    };

    try {
      // Use upsert to update existing matches
      run(`
        INSERT INTO job_matches (
          id, job_id, profile_id, overall_score, skill_score, experience_score,
          location_score, salary_score, skill_matches, experience_match,
          location_match, salary_match, strengths, gaps, recommendations,
          fit_category, confidence, suggested_approach, customization_tips, analyzed_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        ON CONFLICT(job_id, profile_id) DO UPDATE SET
          overall_score = excluded.overall_score,
          skill_score = excluded.skill_score,
          experience_score = excluded.experience_score,
          location_score = excluded.location_score,
          salary_score = excluded.salary_score,
          skill_matches = excluded.skill_matches,
          experience_match = excluded.experience_match,
          location_match = excluded.location_match,
          salary_match = excluded.salary_match,
          strengths = excluded.strengths,
          gaps = excluded.gaps,
          recommendations = excluded.recommendations,
          fit_category = excluded.fit_category,
          confidence = excluded.confidence,
          suggested_approach = excluded.suggested_approach,
          customization_tips = excluded.customization_tips,
          analyzed_at = excluded.analyzed_at
      `, [
        newMatch.id,
        newMatch.jobId,
        newMatch.profileId,
        newMatch.overallScore,
        newMatch.skillScore,
        newMatch.experienceScore,
        newMatch.locationScore,
        newMatch.salaryScore ?? null,
        JSON.stringify(newMatch.skillMatches),
        JSON.stringify(newMatch.experienceMatch),
        JSON.stringify(newMatch.locationMatch),
        newMatch.salaryMatch ? JSON.stringify(newMatch.salaryMatch) : null,
        JSON.stringify(newMatch.strengths),
        JSON.stringify(newMatch.gaps),
        JSON.stringify(newMatch.recommendations),
        newMatch.fitCategory,
        newMatch.confidence,
        newMatch.suggestedApproach ?? null,
        JSON.stringify(newMatch.customizationTips ?? []),
        newMatch.analyzedAt
      ]);

      saveDatabase();
      return newMatch;
    } catch (error) {
      throw new DatabaseError(
        `Failed to save match: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find match by job and profile
   */
  findByJobAndProfile(jobId: string, profileId: string): JobMatch | null {
    try {
      const row = get<Record<string, unknown>>(`
        SELECT * FROM job_matches
        WHERE job_id = ? AND profile_id = ?
      `, [jobId, profileId]);

      return row ? this.rowToMatch(row) : null;
    } catch (error) {
      throw new DatabaseError(
        `Failed to find match: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get top matches for a profile
   */
  getTopMatches(profileId: string, limit = 20, minScore = 50): JobMatch[] {
    try {
      const rows = all<Record<string, unknown>>(`
        SELECT * FROM job_matches
        WHERE profile_id = ? AND overall_score >= ?
        ORDER BY overall_score DESC
        LIMIT ?
      `, [profileId, minScore, limit]);

      return rows.map(row => this.rowToMatch(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get top matches: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get matches by fit category
   */
  getByFitCategory(
    profileId: string,
    category: JobMatch['fitCategory']
  ): JobMatch[] {
    try {
      const rows = all<Record<string, unknown>>(`
        SELECT * FROM job_matches
        WHERE profile_id = ? AND fit_category = ?
        ORDER BY overall_score DESC
      `, [profileId, category]);

      return rows.map(row => this.rowToMatch(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get matches by category: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get match statistics
   */
  getStats(profileId: string): {
    totalMatches: number;
    averageScore: number;
    byCategory: Record<string, number>;
    topSkillGaps: Array<{ skill: string; count: number }>;
  } {
    try {
      // Total and average
      const summary = get<{ total: number; avg_score: number | null }>(`
        SELECT COUNT(*) as total, AVG(overall_score) as avg_score
        FROM job_matches
        WHERE profile_id = ?
      `, [profileId]);

      // By category
      const categories = all<{ fit_category: string; count: number }>(`
        SELECT fit_category, COUNT(*) as count
        FROM job_matches
        WHERE profile_id = ?
        GROUP BY fit_category
      `, [profileId]);

      // Analyze skill gaps (requires parsing JSON)
      const allMatches = all<{ gaps: string }>(`
        SELECT gaps FROM job_matches WHERE profile_id = ?
      `, [profileId]);

      const skillGapCounts: Record<string, number> = {};
      for (const match of allMatches) {
        const gaps = JSON.parse(match.gaps) as string[];
        for (const gap of gaps) {
          skillGapCounts[gap] = (skillGapCounts[gap] || 0) + 1;
        }
      }

      const topSkillGaps = Object.entries(skillGapCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count }));

      return {
        totalMatches: summary?.total ?? 0,
        averageScore: summary?.avg_score ?? 0,
        byCategory: Object.fromEntries(categories.map(c => [c.fit_category, c.count])),
        topSkillGaps,
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to get match stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete old matches
   */
  deleteOlderThan(days: number): number {
    try {
      // First count how many will be deleted
      const countResult = get<{ count: number }>(`
        SELECT COUNT(*) as count FROM job_matches
        WHERE analyzed_at < datetime('now', ?)
      `, [`-${days} days`]);

      const count = countResult?.count ?? 0;

      if (count > 0) {
        run(`
          DELETE FROM job_matches
          WHERE analyzed_at < datetime('now', ?)
        `, [`-${days} days`]);

        saveDatabase();
      }

      return count;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete old matches: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert database row to JobMatch
   */
  private rowToMatch(row: Record<string, unknown>): JobMatch {
    const match = {
      id: row.id as string,
      jobId: row.job_id as string,
      profileId: row.profile_id as string,
      overallScore: row.overall_score as number,
      skillScore: row.skill_score as number,
      experienceScore: row.experience_score as number,
      locationScore: row.location_score as number,
      salaryScore: row.salary_score ? (row.salary_score as number) : undefined,
      skillMatches: JSON.parse(row.skill_matches as string),
      experienceMatch: JSON.parse(row.experience_match as string),
      locationMatch: JSON.parse(row.location_match as string),
      salaryMatch: row.salary_match ? JSON.parse(row.salary_match as string) : undefined,
      strengths: JSON.parse(row.strengths as string),
      gaps: JSON.parse(row.gaps as string),
      recommendations: JSON.parse(row.recommendations as string),
      fitCategory: row.fit_category as JobMatch['fitCategory'],
      confidence: row.confidence as number,
      suggestedApproach: row.suggested_approach ? (row.suggested_approach as string) : undefined,
      customizationTips: JSON.parse((row.customization_tips as string) || '[]'),
      analyzedAt: row.analyzed_at as string,
    };

    const result = JobMatchSchema.safeParse(match);
    if (!result.success) {
      throw new DatabaseError(`Invalid match data: ${result.error.message}`);
    }

    return result.data;
  }
}

export const matchRepository = new MatchRepository();
