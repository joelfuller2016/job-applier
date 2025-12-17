/**
 * Applications State Store
 * Manages job applications state and real-time updates
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ApplicationStatus =
  | 'discovered'
  | 'queued'
  | 'applying'
  | 'submitted'
  | 'viewed'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'withdrawn'
  | 'error';

export interface Application {
  id: string;
  jobId: string;
  profileId: string;
  status: ApplicationStatus;
  platform: 'linkedin' | 'indeed' | 'other';
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    company: string;
    location?: string;
    salary?: string;
    matchScore?: number;
    url?: string;
  };
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
  history: Array<{
    status: ApplicationStatus;
    timestamp: string;
    note?: string;
  }>;
}

interface ApplicationFilters {
  status?: ApplicationStatus[];
  platform?: ('linkedin' | 'indeed' | 'other')[];
  searchQuery?: string;
  dateRange?: { from: string; to: string };
  minMatchScore?: number;
}

interface ApplicationsState {
  // Data
  applications: Application[];
  selectedApplicationId: string | null;
  isLoading: boolean;

  // Filters & Sorting
  filters: ApplicationFilters;
  sortBy: 'date' | 'company' | 'status' | 'matchScore';
  sortOrder: 'asc' | 'desc';

  // View
  viewMode: 'list' | 'kanban' | 'calendar';

  // Stats
  stats: {
    total: number;
    byStatus: Record<ApplicationStatus, number>;
    todayCount: number;
    weekCount: number;
  };

  // Actions
  setApplications: (applications: Application[]) => void;
  addApplication: (application: Application) => void;
  updateApplication: (id: string, updates: Partial<Application>) => void;
  removeApplication: (id: string) => void;
  selectApplication: (id: string | null) => void;
  setFilters: (filters: ApplicationFilters) => void;
  setSorting: (sortBy: ApplicationsState['sortBy'], sortOrder?: 'asc' | 'desc') => void;
  setViewMode: (mode: ApplicationsState['viewMode']) => void;
  setLoading: (loading: boolean) => void;
  addNote: (applicationId: string, content: string) => void;
  updateStatus: (applicationId: string, status: ApplicationStatus, note?: string) => void;

  // Computed
  getFilteredApplications: () => Application[];
  getApplicationById: (id: string) => Application | undefined;
  getApplicationsByStatus: (status: ApplicationStatus) => Application[];
}

export const useApplicationsStore = create<ApplicationsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      applications: [],
      selectedApplicationId: null,
      isLoading: false,
      filters: {},
      sortBy: 'date',
      sortOrder: 'desc',
      viewMode: 'kanban',
      stats: {
        total: 0,
        byStatus: {
          discovered: 0,
          queued: 0,
          applying: 0,
          submitted: 0,
          viewed: 0,
          interviewing: 0,
          offered: 0,
          rejected: 0,
          withdrawn: 0,
          error: 0,
        },
        todayCount: 0,
        weekCount: 0,
      },

      // Actions
      setApplications: (applications) => {
        const stats = calculateStats(applications);
        set({ applications, stats }, false, 'setApplications');
      },

      addApplication: (application) =>
        set((state) => {
          const applications = [...state.applications, application];
          const stats = calculateStats(applications);
          return { applications, stats };
        }, false, 'addApplication'),

      updateApplication: (id, updates) =>
        set((state) => {
          const applications = state.applications.map((app) =>
            app.id === id ? { ...app, ...updates, updatedAt: new Date().toISOString() } : app
          );
          const stats = calculateStats(applications);
          return { applications, stats };
        }, false, 'updateApplication'),

      removeApplication: (id) =>
        set((state) => {
          const applications = state.applications.filter((app) => app.id !== id);
          const stats = calculateStats(applications);
          return { applications, stats };
        }, false, 'removeApplication'),

      selectApplication: (id) =>
        set({ selectedApplicationId: id }, false, 'selectApplication'),

      setFilters: (filters) =>
        set({ filters }, false, 'setFilters'),

      setSorting: (sortBy, sortOrder) =>
        set((state) => ({
          sortBy,
          sortOrder: sortOrder ?? (state.sortBy === sortBy && state.sortOrder === 'asc' ? 'desc' : 'asc'),
        }), false, 'setSorting'),

      setViewMode: (viewMode) =>
        set({ viewMode }, false, 'setViewMode'),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),

      addNote: (applicationId, content) =>
        set((state) => {
          const applications = state.applications.map((app) => {
            if (app.id !== applicationId) return app;
            return {
              ...app,
              notes: [
                ...app.notes,
                {
                  id: crypto.randomUUID(),
                  content,
                  createdAt: new Date().toISOString(),
                },
              ],
              updatedAt: new Date().toISOString(),
            };
          });
          return { applications };
        }, false, 'addNote'),

      updateStatus: (applicationId, status, note) =>
        set((state) => {
          const applications = state.applications.map((app) => {
            if (app.id !== applicationId) return app;
            const now = new Date().toISOString();
            return {
              ...app,
              status,
              history: [
                ...app.history,
                { status, timestamp: now, note },
              ],
              updatedAt: now,
            };
          });
          const stats = calculateStats(applications);
          return { applications, stats };
        }, false, 'updateStatus'),

      // Computed
      getFilteredApplications: () => {
        const state = get();
        let filtered = [...state.applications];

        // Apply filters
        if (state.filters.status?.length) {
          filtered = filtered.filter((app) => state.filters.status!.includes(app.status));
        }
        if (state.filters.platform?.length) {
          filtered = filtered.filter((app) => state.filters.platform!.includes(app.platform));
        }
        if (state.filters.searchQuery) {
          const query = state.filters.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (app) =>
              app.job.title.toLowerCase().includes(query) ||
              app.job.company.toLowerCase().includes(query)
          );
        }
        if (state.filters.minMatchScore) {
          filtered = filtered.filter(
            (app) => (app.job.matchScore ?? 0) >= state.filters.minMatchScore!
          );
        }

        // Apply sorting
        filtered.sort((a, b) => {
          let comparison = 0;
          switch (state.sortBy) {
            case 'date':
              comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              break;
            case 'company':
              comparison = a.job.company.localeCompare(b.job.company);
              break;
            case 'status':
              comparison = a.status.localeCompare(b.status);
              break;
            case 'matchScore':
              comparison = (b.job.matchScore ?? 0) - (a.job.matchScore ?? 0);
              break;
          }
          return state.sortOrder === 'asc' ? -comparison : comparison;
        });

        return filtered;
      },

      getApplicationById: (id) => get().applications.find((app) => app.id === id),

      getApplicationsByStatus: (status) =>
        get().applications.filter((app) => app.status === status),
    }),
    { name: 'ApplicationsStore' }
  )
);

function calculateStats(applications: Application[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const byStatus: Record<ApplicationStatus, number> = {
    discovered: 0,
    queued: 0,
    applying: 0,
    submitted: 0,
    viewed: 0,
    interviewing: 0,
    offered: 0,
    rejected: 0,
    withdrawn: 0,
    error: 0,
  };

  let todayCount = 0;
  let weekCount = 0;

  applications.forEach((app) => {
    byStatus[app.status]++;
    const createdAt = new Date(app.createdAt);
    if (createdAt >= today) todayCount++;
    if (createdAt >= weekAgo) weekCount++;
  });

  return {
    total: applications.length,
    byStatus,
    todayCount,
    weekCount,
  };
}
