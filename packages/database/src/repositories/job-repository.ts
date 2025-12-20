import { run, get, all, saveDatabase } from '../connection.js';
import {
  JobListing,
  JobListingSchema,
  JobPlatform,
  JobSearchQuery,
  generateId,
  toISOString,
  DatabaseError,
} from '@job-applier/core';

/**
 * Job repository for database operations
 */
export class JobRepository {
  /**
   * Create or update a job listing
   */
  upsert(job: Omit<JobListing, 'id' | 'discoveredAt' | 'updatedAt'>): JobListing {
    const now = toISOString(new Date());

    // Check if job exists
    const existing = this.findByExternalId(job.platform, job.externalId);

    if (existing) {
      return this.update(existing.id, job) as JobListing;
    }

    const newJob: JobListing = {
      ...job,
      id: generateId(),
      discoveredAt: now,
      updatedAt: now,
    };

    try {
      run(`
        INSERT INTO jobs (
          id, external_id, platform, title, company, location, description,
          requirements, responsibilities, qualifications, employment_type,
          experience_level, work_arrangement, salary, benefits, required_skills,
          preferred_skills, url, apply_url, posted_at, expires_at, discovered_at,
          updated_at, easy_apply, application_deadline, applicant_count
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `, [
        newJob.id,
        newJob.externalId,
        newJob.platform,
        newJob.title,
        JSON.stringify(newJob.company),
        newJob.location,
        newJob.description,
        JSON.stringify(newJob.requirements),
        newJob.responsibilities ? JSON.stringify(newJob.responsibilities) : null,
        newJob.qualifications ? JSON.stringify(newJob.qualifications) : null,
        newJob.employmentType ?? null,
        newJob.experienceLevel ?? null,
        newJob.workArrangement ?? null,
        newJob.salary ? JSON.stringify(newJob.salary) : null,
        newJob.benefits ? JSON.stringify(newJob.benefits) : null,
        JSON.stringify(newJob.requiredSkills),
        newJob.preferredSkills ? JSON.stringify(newJob.preferredSkills) : null,
        newJob.url,
        newJob.applyUrl ?? null,
        newJob.postedAt ?? null,
        newJob.expiresAt ?? null,
        newJob.discoveredAt,
        newJob.updatedAt,
        newJob.easyApply ? 1 : 0,
        newJob.applicationDeadline ?? null,
        newJob.applicantCount ?? null
      ]);

      saveDatabase();
      return newJob;
    } catch (error) {
      throw new DatabaseError(
        `Failed to create job: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find a job by ID
   */
  findById(id: string): JobListing | null {
    try {
      const row = get<Record<string, unknown>>('SELECT * FROM jobs WHERE id = ?', [id]);
      return row ? this.rowToJob(row) : null;
    } catch (error) {
      throw new DatabaseError(
        `Failed to find job: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find multiple jobs by IDs (bulk fetch to avoid N+1 queries)
   */
  findByIds(ids: string[]): Map<string, JobListing> {
    if (ids.length === 0) {
      return new Map();
    }

    try {
      const placeholders = ids.map(() => '?').join(',');
      const rows = all<Record<string, unknown>>(
        `SELECT * FROM jobs WHERE id IN (${placeholders})`,
        ids
      );

      const result = new Map<string, JobListing>();
      for (const row of rows) {
        const job = this.rowToJob(row);
        result.set(job.id, job);
      }
      return result;
    } catch (error) {
      throw new DatabaseError(
        `Failed to find jobs by IDs: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find a job by external ID and platform
   */
  findByExternalId(platform: JobPlatform, externalId: string): JobListing | null {
    try {
      const row = get<Record<string, unknown>>(
        'SELECT * FROM jobs WHERE platform = ? AND external_id = ?',
        [platform, externalId]
      );

      return row ? this.rowToJob(row) : null;
    } catch (error) {
      throw new DatabaseError(
        `Failed to find job by external ID: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Search jobs with filters
   */
  search(query: Partial<JobSearchQuery>): JobListing[] {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.keywords && query.keywords.length > 0) {
      const keywordConditions = query.keywords.map(() => '(title LIKE ? OR description LIKE ?)');
      conditions.push(`(${keywordConditions.join(' OR ')})`);
      for (const keyword of query.keywords) {
        params.push(`%${keyword}%`, `%${keyword}%`);
      }
    }

    if (query.location) {
      conditions.push('location LIKE ?');
      params.push(`%${query.location}%`);
    }

    if (query.platforms && query.platforms.length > 0) {
      conditions.push(`platform IN (${query.platforms.map(() => '?').join(',')})`);
      params.push(...query.platforms);
    }

    if (query.employmentType) {
      conditions.push('employment_type = ?');
      params.push(query.employmentType);
    }

    if (query.experienceLevel) {
      conditions.push('experience_level = ?');
      params.push(query.experienceLevel);
    }

    if (query.remote) {
      conditions.push("work_arrangement = 'remote'");
    }

    if (query.postedWithin) {
      const days = {
        '24h': 1,
        '7d': 7,
        '14d': 14,
        '30d': 30,
      }[query.postedWithin];
      conditions.push("posted_at >= datetime('now', ?)");
      params.push(`-${days} days`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = query.limit ?? 20;

    try {
      const sql = `
        SELECT * FROM jobs
        ${whereClause}
        ORDER BY posted_at DESC NULLS LAST, discovered_at DESC
        LIMIT ?
      `;
      params.push(limit);

      const rows = all<Record<string, unknown>>(sql, params);
      return rows.map(row => this.rowToJob(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to search jobs: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get recent jobs
   */
  getRecent(limit = 50): JobListing[] {
    try {
      const rows = all<Record<string, unknown>>(`
        SELECT * FROM jobs
        ORDER BY discovered_at DESC
        LIMIT ?
      `, [limit]);

      return rows.map(row => this.rowToJob(row));
    } catch (error) {
      throw new DatabaseError(
        `Failed to get recent jobs: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update a job
   */
  update(id: string, updates: Partial<JobListing>): JobListing | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
      discoveredAt: existing.discoveredAt,
      updatedAt: toISOString(new Date()),
    };

    try {
      run(`
        UPDATE jobs SET
          title = ?, company = ?, location = ?, description = ?,
          requirements = ?, responsibilities = ?, qualifications = ?,
          employment_type = ?, experience_level = ?, work_arrangement = ?,
          salary = ?, benefits = ?, required_skills = ?, preferred_skills = ?,
          url = ?, apply_url = ?, posted_at = ?, expires_at = ?, updated_at = ?,
          easy_apply = ?, application_deadline = ?, applicant_count = ?
        WHERE id = ?
      `, [
        updated.title,
        JSON.stringify(updated.company),
        updated.location,
        updated.description,
        JSON.stringify(updated.requirements),
        updated.responsibilities ? JSON.stringify(updated.responsibilities) : null,
        updated.qualifications ? JSON.stringify(updated.qualifications) : null,
        updated.employmentType ?? null,
        updated.experienceLevel ?? null,
        updated.workArrangement ?? null,
        updated.salary ? JSON.stringify(updated.salary) : null,
        updated.benefits ? JSON.stringify(updated.benefits) : null,
        JSON.stringify(updated.requiredSkills),
        updated.preferredSkills ? JSON.stringify(updated.preferredSkills) : null,
        updated.url,
        updated.applyUrl ?? null,
        updated.postedAt ?? null,
        updated.expiresAt ?? null,
        updated.updatedAt,
        updated.easyApply ? 1 : 0,
        updated.applicationDeadline ?? null,
        updated.applicantCount ?? null,
        id
      ]);

      saveDatabase();
      return updated as JobListing;
    } catch (error) {
      throw new DatabaseError(
        `Failed to update job: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete a job
   */
  delete(id: string): boolean {
    try {
      const existing = this.findById(id);
      if (!existing) {
        return false;
      }

      run('DELETE FROM jobs WHERE id = ?', [id]);
      saveDatabase();
      return true;
    } catch (error) {
      throw new DatabaseError(
        `Failed to delete job: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get job count by platform
   */
  countByPlatform(): Record<string, number> {
    try {
      const rows = all<{ platform: string; count: number }>(`
        SELECT platform, COUNT(*) as count
        FROM jobs
        GROUP BY platform
      `);

      return Object.fromEntries(rows.map(r => [r.platform, r.count]));
    } catch (error) {
      throw new DatabaseError(
        `Failed to count jobs: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert database row to JobListing
   */
  private rowToJob(row: Record<string, unknown>): JobListing {
    const job: Record<string, unknown> = {
      id: row.id as string,
      externalId: row.external_id as string,
      platform: row.platform as JobPlatform,
      title: row.title as string,
      company: JSON.parse(row.company as string),
      location: row.location as string,
      description: row.description as string,
      requirements: JSON.parse(row.requirements as string),
      requiredSkills: JSON.parse(row.required_skills as string),
      url: row.url as string,
      discoveredAt: row.discovered_at as string,
      updatedAt: row.updated_at as string,
      easyApply: (row.easy_apply as number) === 1,
    };

    // Add optional fields only if they are not null
    // For JSON fields, parse first and only add if not null
    if (row.responsibilities !== null && row.responsibilities !== undefined) {
      const parsed = JSON.parse(row.responsibilities as string);
      if (parsed && parsed.length > 0) job.responsibilities = parsed;
    }
    if (row.qualifications !== null && row.qualifications !== undefined) {
      const parsed = JSON.parse(row.qualifications as string);
      if (parsed !== null && parsed !== undefined) job.qualifications = parsed;
    }
    if (row.salary !== null && row.salary !== undefined) {
      const parsed = JSON.parse(row.salary as string);
      if (parsed !== null && parsed !== undefined) job.salary = parsed;
    }
    if (row.benefits !== null && row.benefits !== undefined) {
      const parsed = JSON.parse(row.benefits as string);
      if (parsed && parsed.length > 0) job.benefits = parsed;
    }
    if (row.preferred_skills !== null && row.preferred_skills !== undefined) {
      const parsed = JSON.parse(row.preferred_skills as string);
      if (parsed && parsed.length > 0) job.preferredSkills = parsed;
    }

    // For scalar fields, check if not null/undefined
    if (row.employment_type !== null && row.employment_type !== undefined) {
      job.employmentType = row.employment_type as string;
    }
    if (row.experience_level !== null && row.experience_level !== undefined) {
      job.experienceLevel = row.experience_level as string;
    }
    if (row.work_arrangement !== null && row.work_arrangement !== undefined) {
      job.workArrangement = row.work_arrangement as string;
    }
    if (row.apply_url !== null && row.apply_url !== undefined) {
      job.applyUrl = row.apply_url as string;
    }
    if (row.posted_at !== null && row.posted_at !== undefined) {
      job.postedAt = row.posted_at as string;
    }
    if (row.expires_at !== null && row.expires_at !== undefined) {
      job.expiresAt = row.expires_at as string;
    }
    if (row.application_deadline !== null && row.application_deadline !== undefined) {
      job.applicationDeadline = row.application_deadline as string;
    }
    if (row.applicant_count !== null && row.applicant_count !== undefined) {
      job.applicantCount = row.applicant_count as number;
    }

    const result = JobListingSchema.safeParse(job);
    if (!result.success) {
      throw new DatabaseError(`Invalid job data in database: ${result.error.message}`);
    }

    return result.data;
  }
}

export const jobRepository = new JobRepository();
