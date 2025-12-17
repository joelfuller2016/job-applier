export type ApplicationStatus =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected';

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  status: ApplicationStatus;
  appliedDate: string;
  matchScore: number;
  location?: string;
  salary?: string;
  description?: string;
  resumeUrl?: string;
  coverLetterUrl?: string;
  notes: ApplicationNote[];
  timeline: TimelineEvent[];
  nextSteps?: string;
}

export interface ApplicationNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  type: 'applied' | 'status_change' | 'note_added' | 'reminder' | 'interview_scheduled';
  title: string;
  description?: string;
  timestamp: string;
}

export interface ApplicationFilters {
  status?: ApplicationStatus[];
  company?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  minMatchScore?: number;
  searchQuery?: string;
}

export type ViewMode = 'kanban' | 'list';
