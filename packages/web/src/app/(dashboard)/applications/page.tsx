'use client';

import * as React from 'react';
import { LayoutGrid, List, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KanbanBoard } from '@/components/applications/kanban-board';
import { ApplicationList } from '@/components/applications/application-list';
import { ApplicationDetail } from '@/components/applications/application-detail';
import { Filters } from '@/components/applications/filters';
import { AddNoteDialog } from '@/components/applications/add-note-dialog';
import type {
  Application,
  ApplicationStatus,
  ApplicationFilters,
  ViewMode,
} from '@/types/application';

// Mock data for demonstration
const mockApplications: Application[] = [
  {
    id: '1',
    jobId: 'job-1',
    jobTitle: 'Senior Frontend Developer',
    company: 'TechCorp',
    companyLogo: '',
    status: 'interview',
    appliedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    matchScore: 92,
    location: 'San Francisco, CA',
    salary: '$120k - $180k',
    description:
      'We are looking for a Senior Frontend Developer to join our growing team. You will be responsible for building scalable web applications using React, TypeScript, and modern frontend technologies.',
    resumeUrl: '/resumes/resume-1.pdf',
    coverLetterUrl: '/cover-letters/cover-1.pdf',
    notes: [
      {
        id: 'note-1',
        content: 'Had a great conversation with the hiring manager. They mentioned the team is growing rapidly.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    timeline: [
      {
        id: 'timeline-1',
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        description: 'Technical interview scheduled for next week',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'timeline-2',
        type: 'status_change',
        title: 'Moved to Screening',
        description: 'Application passed initial review',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'timeline-3',
        type: 'applied',
        title: 'Application Submitted',
        description: 'Successfully submitted application',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    nextSteps: 'Prepare for technical interview on Wednesday',
  },
  {
    id: '2',
    jobId: 'job-2',
    jobTitle: 'Full Stack Engineer',
    company: 'StartupXYZ',
    status: 'screening',
    appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    matchScore: 85,
    location: 'Remote',
    salary: '$100k - $150k',
    description: 'Join our fast-paced startup and help build the next generation of productivity tools.',
    notes: [],
    timeline: [
      {
        id: 'timeline-4',
        type: 'status_change',
        title: 'Moved to Screening',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'timeline-5',
        type: 'applied',
        title: 'Application Submitted',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: '3',
    jobId: 'job-3',
    jobTitle: 'React Developer',
    company: 'BigCo Inc',
    status: 'applied',
    appliedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    matchScore: 78,
    location: 'New York, NY',
    salary: '$110k - $160k',
    notes: [],
    timeline: [
      {
        id: 'timeline-6',
        type: 'applied',
        title: 'Application Submitted',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: '4',
    jobId: 'job-4',
    jobTitle: 'Software Engineer',
    company: 'MegaCorp',
    status: 'rejected',
    appliedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    matchScore: 65,
    location: 'Austin, TX',
    salary: '$90k - $130k',
    notes: [
      {
        id: 'note-2',
        content: 'Received rejection email. They went with a candidate with more backend experience.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    timeline: [
      {
        id: 'timeline-7',
        type: 'status_change',
        title: 'Application Rejected',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'timeline-8',
        type: 'applied',
        title: 'Application Submitted',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: '5',
    jobId: 'job-5',
    jobTitle: 'Frontend Architect',
    company: 'Innovation Labs',
    status: 'offer',
    appliedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    matchScore: 95,
    location: 'Seattle, WA',
    salary: '$150k - $200k',
    notes: [
      {
        id: 'note-3',
        content: 'Received verbal offer! Waiting for written offer letter.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    timeline: [
      {
        id: 'timeline-9',
        type: 'status_change',
        title: 'Offer Received',
        description: 'Verbal offer received',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'timeline-10',
        type: 'interview_scheduled',
        title: 'Final Interview Completed',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'timeline-11',
        type: 'applied',
        title: 'Application Submitted',
        timestamp: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    nextSteps: 'Review and negotiate offer terms',
  },
];

export default function ApplicationsPage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>('kanban');
  const [applications, setApplications] = React.useState<Application[]>(mockApplications);
  const [selectedApplication, setSelectedApplication] = React.useState<Application | null>(null);
  const [addNoteDialogOpen, setAddNoteDialogOpen] = React.useState(false);
  const [noteApplicationId, setNoteApplicationId] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<ApplicationFilters>({});

  const handleStatusChange = (applicationId: string, newStatus: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status: newStatus,
              timeline: [
                {
                  id: `timeline-${Date.now()}`,
                  type: 'status_change',
                  title: `Moved to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
                  timestamp: new Date().toISOString(),
                },
                ...app.timeline,
              ],
            }
          : app
      )
    );

    // Update selected application if it's the one being changed
    if (selectedApplication?.id === applicationId) {
      const updated = applications.find((app) => app.id === applicationId);
      if (updated) {
        setSelectedApplication({ ...updated, status: newStatus });
      }
    }
  };

  const handleApplicationView = (application: Application) => {
    setSelectedApplication(application);
  };

  const handleApplicationDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this application?')) {
      setApplications((prev) => prev.filter((app) => app.id !== id));
      if (selectedApplication?.id === id) {
        setSelectedApplication(null);
      }
    }
  };

  const handleAddNote = (applicationId: string) => {
    setNoteApplicationId(applicationId);
    setAddNoteDialogOpen(true);
  };

  const handleNoteSubmit = (noteContent: string) => {
    if (!noteApplicationId) return;

    const newNote = {
      id: `note-${Date.now()}`,
      content: noteContent,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setApplications((prev) =>
      prev.map((app) =>
        app.id === noteApplicationId
          ? {
              ...app,
              notes: [newNote, ...app.notes],
              timeline: [
                {
                  id: `timeline-${Date.now()}`,
                  type: 'note_added',
                  title: 'Note Added',
                  description: noteContent,
                  timestamp: new Date().toISOString(),
                },
                ...app.timeline,
              ],
            }
          : app
      )
    );

    // Update selected application if it's the one getting the note
    if (selectedApplication?.id === noteApplicationId) {
      setSelectedApplication({
        ...selectedApplication,
        notes: [newNote, ...selectedApplication.notes],
      });
    }

    setNoteApplicationId(null);
  };

  const handleExport = () => {
    const csvContent = [
      ['Company', 'Job Title', 'Status', 'Match Score', 'Applied Date', 'Location'].join(','),
      ...filteredApplications.map((app) =>
        [
          app.company,
          app.jobTitle,
          app.status,
          app.matchScore,
          new Date(app.appliedDate).toLocaleDateString(),
          app.location || 'N/A',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  // Filter applications
  const filteredApplications = React.useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(app.status)) return false;
      }

      // Company filter
      if (filters.company) {
        if (!app.company.toLowerCase().includes(filters.company.toLowerCase()))
          return false;
      }

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = app.jobTitle.toLowerCase().includes(query);
        const matchesCompany = app.company.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCompany) return false;
      }

      // Min match score filter
      if (filters.minMatchScore !== undefined) {
        if (app.matchScore < filters.minMatchScore) return false;
      }

      return true;
    });
  }, [applications, filters]);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-bold">Applications</h1>
            <p className="text-sm text-muted-foreground">
              {filteredApplications.length} application
              {filteredApplications.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="kanban" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Kanban</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Export Button */}
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4">
          <Filters
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleResetFilters}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-6 pt-6">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            applications={filteredApplications}
            onApplicationView={handleApplicationView}
            onApplicationDelete={handleApplicationDelete}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <ApplicationList
            applications={filteredApplications}
            onApplicationView={handleApplicationView}
            onApplicationDelete={handleApplicationDelete}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {/* Application Detail Slide-over */}
      {selectedApplication && (
        <ApplicationDetail
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onStatusChange={handleStatusChange}
          onAddNote={handleAddNote}
        />
      )}

      {/* Add Note Dialog */}
      <AddNoteDialog
        open={addNoteDialogOpen}
        onOpenChange={setAddNoteDialogOpen}
        onSubmit={handleNoteSubmit}
      />
    </div>
  );
}
