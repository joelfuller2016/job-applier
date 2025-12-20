/**
 * Database schema definitions
 */

export const SCHEMA = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      image TEXT,
      provider TEXT NOT NULL DEFAULT 'credentials',
      provider_account_id TEXT,
      email_verified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login_at TEXT,
      UNIQUE(provider, provider_account_id)
    )
  `,

  profiles: `
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      headline TEXT,
      summary TEXT,
      contact_info TEXT NOT NULL,
      experience TEXT NOT NULL DEFAULT '[]',
      education TEXT NOT NULL DEFAULT '[]',
      skills TEXT NOT NULL DEFAULT '[]',
      certifications TEXT DEFAULT '[]',
      projects TEXT DEFAULT '[]',
      preferences TEXT NOT NULL,
      resume_path TEXT,
      resume_content TEXT,
      cover_letter_template TEXT,
      is_default INTEGER DEFAULT 0,
      parsed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,

  jobs: `
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      external_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT NOT NULL DEFAULT '[]',
      responsibilities TEXT DEFAULT '[]',
      qualifications TEXT,
      employment_type TEXT,
      experience_level TEXT,
      work_arrangement TEXT,
      salary TEXT,
      benefits TEXT DEFAULT '[]',
      required_skills TEXT NOT NULL DEFAULT '[]',
      preferred_skills TEXT DEFAULT '[]',
      url TEXT NOT NULL,
      apply_url TEXT,
      posted_at TEXT,
      expires_at TEXT,
      discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      easy_apply INTEGER DEFAULT 0,
      application_deadline TEXT,
      applicant_count INTEGER,
      UNIQUE(platform, external_id)
    )
  `,

  applications: `
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      method TEXT,
      cover_letter TEXT,
      submission TEXT,
      platform TEXT NOT NULL,
      platform_application_id TEXT,
      match_score REAL,
      match_reasons TEXT,
      response_received INTEGER DEFAULT 0,
      response_date TEXT,
      response_details TEXT,
      follow_up_dates TEXT DEFAULT '[]',
      next_follow_up TEXT,
      notes TEXT,
      applied_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
  `,

  job_matches: `
    CREATE TABLE IF NOT EXISTS job_matches (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      overall_score REAL NOT NULL,
      skill_score REAL NOT NULL,
      experience_score REAL NOT NULL,
      location_score REAL NOT NULL,
      salary_score REAL,
      skill_matches TEXT NOT NULL,
      experience_match TEXT NOT NULL,
      location_match TEXT NOT NULL,
      salary_match TEXT,
      strengths TEXT NOT NULL DEFAULT '[]',
      gaps TEXT NOT NULL DEFAULT '[]',
      recommendations TEXT NOT NULL DEFAULT '[]',
      fit_category TEXT NOT NULL,
      confidence REAL NOT NULL,
      suggested_approach TEXT,
      customization_tips TEXT DEFAULT '[]',
      analyzed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      UNIQUE(job_id, profile_id)
    )
  `,

  application_events: `
    CREATE TABLE IF NOT EXISTS application_events (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    )
  `,

  platform_credentials: `
    CREATE TABLE IF NOT EXISTS platform_credentials (
      platform TEXT PRIMARY KEY,
      email TEXT,
      password_encrypted TEXT,
      api_key_encrypted TEXT,
      access_token_encrypted TEXT,
      refresh_token_encrypted TEXT,
      expires_at TEXT,
      cookies TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,

  settings: `
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,

  /**
   * Automation sessions table
   * Stores automation and hunt session state for persistence across restarts
   * SECURITY FIX: Replaces in-memory Map storage that caused data loss
   * See: https://github.com/joelfuller2016/job-applier/issues/37
   */
  automation_sessions: `
    CREATE TABLE IF NOT EXISTS automation_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('automation', 'hunt')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'stopped', 'completed', 'error')),
      cancel_requested INTEGER DEFAULT 0,
      config TEXT NOT NULL,
      stats TEXT NOT NULL DEFAULT '{}',
      current_task TEXT,
      progress INTEGER DEFAULT 0,
      total_items INTEGER DEFAULT 0,
      processed_items INTEGER DEFAULT 0,
      error_message TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      last_activity_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,

  /**
   * Session logs table
   * Stores logs for automation sessions
   */
  session_logs: `
    CREATE TABLE IF NOT EXISTS session_logs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('debug', 'info', 'warn', 'error')),
      message TEXT NOT NULL,
      context TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES automation_sessions(id) ON DELETE CASCADE
    )
  `,
};

export const INDEXES = {
  users_email: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
  users_provider: 'CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_account_id)',
  profiles_user: 'CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id)',
  profiles_default: 'CREATE INDEX IF NOT EXISTS idx_profiles_default ON profiles(user_id, is_default)',
  jobs_platform: 'CREATE INDEX IF NOT EXISTS idx_jobs_platform ON jobs(platform)',
  jobs_posted_at: 'CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at)',
  jobs_title: 'CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title)',
  applications_profile: 'CREATE INDEX IF NOT EXISTS idx_applications_profile ON applications(profile_id)',
  applications_job: 'CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id)',
  applications_status: 'CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)',
  applications_applied_at: 'CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at)',
  matches_profile: 'CREATE INDEX IF NOT EXISTS idx_matches_profile ON job_matches(profile_id)',
  matches_score: 'CREATE INDEX IF NOT EXISTS idx_matches_score ON job_matches(overall_score)',
  events_application: 'CREATE INDEX IF NOT EXISTS idx_events_application ON application_events(application_id)',
  events_timestamp: 'CREATE INDEX IF NOT EXISTS idx_events_timestamp ON application_events(timestamp)',
  // Session indexes
  sessions_user: 'CREATE INDEX IF NOT EXISTS idx_sessions_user ON automation_sessions(user_id)',
  sessions_status: 'CREATE INDEX IF NOT EXISTS idx_sessions_status ON automation_sessions(status)',
  sessions_type: 'CREATE INDEX IF NOT EXISTS idx_sessions_type ON automation_sessions(type)',
  session_logs_session: 'CREATE INDEX IF NOT EXISTS idx_session_logs_session ON session_logs(session_id)',
  session_logs_timestamp: 'CREATE INDEX IF NOT EXISTS idx_session_logs_timestamp ON session_logs(timestamp)',
};

export const TRIGGERS = {
  users_updated: `
    CREATE TRIGGER IF NOT EXISTS trigger_users_updated
    AFTER UPDATE ON users
    BEGIN
      UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
    END
  `,
  profiles_updated: `
    CREATE TRIGGER IF NOT EXISTS trigger_profiles_updated
    AFTER UPDATE ON profiles
    BEGIN
      UPDATE profiles SET updated_at = datetime('now') WHERE id = NEW.id;
    END
  `,
  jobs_updated: `
    CREATE TRIGGER IF NOT EXISTS trigger_jobs_updated
    AFTER UPDATE ON jobs
    BEGIN
      UPDATE jobs SET updated_at = datetime('now') WHERE id = NEW.id;
    END
  `,
  applications_updated: `
    CREATE TRIGGER IF NOT EXISTS trigger_applications_updated
    AFTER UPDATE ON applications
    BEGIN
      UPDATE applications SET updated_at = datetime('now') WHERE id = NEW.id;
    END
  `,
  sessions_updated: `
    CREATE TRIGGER IF NOT EXISTS trigger_sessions_updated
    AFTER UPDATE ON automation_sessions
    BEGIN
      UPDATE automation_sessions SET updated_at = datetime('now') WHERE id = NEW.id;
    END
  `,
};
