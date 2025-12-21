/**
 * Automation State Store
 * Manages automation status, controls, and real-time updates
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AutomationStatus, LogEntry, ScreenshotUpdate } from '@/lib/socket';
import { AUTOMATION_SETTINGS } from '@job-applier/core';

interface AutomationConfig {
  platforms: ('linkedin' | 'indeed')[];
  searchQuery: string;
  maxApplicationsPerDay: number;
  maxApplicationsPerHour: number;
  delayBetweenApplications: { min: number; max: number };
  headless: boolean;
  autoRetry: boolean;
}

interface AutomationState {
  // Status
  status: AutomationStatus;
  isConnected: boolean;
  lastError: string | null;

  // Logs
  logs: LogEntry[];
  maxLogs: number;

  // Screenshots
  latestScreenshot: ScreenshotUpdate | null;

  // Configuration
  config: AutomationConfig;

  // Session stats
  sessionStats: {
    applicationsSubmitted: number;
    applicationsSkipped: number;
    errorsEncountered: number;
    startTime: string | null;
  };

  // Actions
  setStatus: (status: AutomationStatus) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setScreenshot: (screenshot: ScreenshotUpdate) => void;
  updateConfig: (config: Partial<AutomationConfig>) => void;
  resetSession: () => void;
  incrementStat: (stat: 'applicationsSubmitted' | 'applicationsSkipped' | 'errorsEncountered') => void;
}

const defaultConfig: AutomationConfig = {
  platforms: ['linkedin'],
  searchQuery: '',
  maxApplicationsPerDay: AUTOMATION_SETTINGS.DEFAULT_APPLICATIONS_PER_DAY,
  maxApplicationsPerHour: AUTOMATION_SETTINGS.DEFAULT_APPLICATIONS_PER_HOUR,
  delayBetweenApplications: { min: AUTOMATION_SETTINGS.MIN_DELAY_SECONDS, max: AUTOMATION_SETTINGS.MAX_DELAY_SECONDS },
  headless: false,
  autoRetry: true,
};

const defaultStatus: AutomationStatus = {
  state: 'idle',
  currentTask: undefined,
  progress: 0,
  totalJobs: 0,
  processedJobs: 0,
};

export const useAutomationStore = create<AutomationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        status: defaultStatus,
        isConnected: false,
        lastError: null,
        logs: [],
        maxLogs: AUTOMATION_SETTINGS.MAX_LOGS,
        latestScreenshot: null,
        config: defaultConfig,
        sessionStats: {
          applicationsSubmitted: 0,
          applicationsSkipped: 0,
          errorsEncountered: 0,
          startTime: null,
        },

        // Actions
        setStatus: (status) =>
          set({ status }, false, 'setStatus'),

        setConnected: (connected) =>
          set({ isConnected: connected }, false, 'setConnected'),

        setError: (error) =>
          set({ lastError: error }, false, 'setError'),

        addLog: (log) =>
          set((state) => {
            const logs = [log, ...state.logs].slice(0, state.maxLogs);
            return { logs };
          }, false, 'addLog'),

        clearLogs: () =>
          set({ logs: [] }, false, 'clearLogs'),

        setScreenshot: (screenshot) =>
          set({ latestScreenshot: screenshot }, false, 'setScreenshot'),

        updateConfig: (configUpdate) =>
          set((state) => ({
            config: { ...state.config, ...configUpdate },
          }), false, 'updateConfig'),

        resetSession: () =>
          set({
            status: defaultStatus,
            sessionStats: {
              applicationsSubmitted: 0,
              applicationsSkipped: 0,
              errorsEncountered: 0,
              startTime: null,
            },
            logs: [],
            latestScreenshot: null,
          }, false, 'resetSession'),

        incrementStat: (stat) =>
          set((state) => ({
            sessionStats: {
              ...state.sessionStats,
              [stat]: state.sessionStats[stat] + 1,
            },
          }), false, 'incrementStat'),
      }),
      {
        name: 'automation-storage',
        partialize: (state) => ({
          config: state.config,
        }),
      }
    ),
    { name: 'AutomationStore' }
  )
);
