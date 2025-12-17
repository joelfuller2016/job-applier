/**
 * Hunt types for job hunting interface
 */

export interface HuntConfig {
  query: string;
  location?: string;
  remoteOnly: boolean;
  specificCompanies?: string[];
  maxJobs: number;
  matchThreshold: number;
  dryRun: boolean;
}

export interface DiscoveredJob {
  id: string;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  description: string;
  url: string;
  source: 'exa' | 'linkedin' | 'company';
  matchScore: number;
  discoveredAt: Date;
  applied: boolean;
  skipped: boolean;
}

export type HuntPhase = 'idle' | 'discovering' | 'matching' | 'applying' | 'completed' | 'error';

export interface HuntProgress {
  phase: HuntPhase;
  jobsDiscovered: number;
  jobsMatched: number;
  applicationsSubmitted: number;
  currentActivity: string;
  logs: HuntLog[];
}

export interface HuntLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface HuntSession {
  id: string;
  config: HuntConfig;
  progress: HuntProgress;
  jobs: DiscoveredJob[];
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'cancelled' | 'failed';
}
