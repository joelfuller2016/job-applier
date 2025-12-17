# Application Tracker - Quick Reference

## Component Imports

```typescript
import {
  KanbanBoard,
  ApplicationList,
  ApplicationCard,
  ApplicationDetail,
  Filters,
  AddNoteDialog,
} from '@/components/applications';

import type {
  Application,
  ApplicationStatus,
  ApplicationFilters,
  ViewMode,
} from '@/types/application';
```

## Props Reference

### KanbanBoard

```typescript
<KanbanBoard
  applications={applications}              // Application[]
  onApplicationView={(app) => {...}}       // (app: Application) => void
  onApplicationDelete={(id) => {...}}      // (id: string) => void
  onStatusChange={(id, status) => {...}}   // (id: string, status: ApplicationStatus) => void
/>
```

### ApplicationList

```typescript
<ApplicationList
  applications={applications}              // Application[]
  onApplicationView={(app) => {...}}       // (app: Application) => void
  onApplicationDelete={(id) => {...}}      // (id: string) => void
  onStatusChange={(id, status) => {...}}   // (id: string, status: ApplicationStatus) => void
/>
```

### ApplicationCard

```typescript
<ApplicationCard
  application={application}                // Application
  onView={(app) => {...}}                  // (app: Application) => void
  onDelete={(id) => {...}}                 // (id: string) => void (optional)
  isDragging={false}                       // boolean (optional)
  dragHandleProps={{...}}                  // HTMLAttributes (optional)
/>
```

### ApplicationDetail

```typescript
<ApplicationDetail
  application={application}                // Application
  onClose={() => {...}}                    // () => void
  onStatusChange={(id, status) => {...}}   // (id: string, status: ApplicationStatus) => void
  onAddNote={(id) => {...}}                // (id: string) => void
/>
```

### Filters

```typescript
<Filters
  filters={filters}                        // ApplicationFilters
  onFiltersChange={(filters) => {...}}     // (filters: ApplicationFilters) => void
  onReset={() => {...}}                    // () => void
/>
```

### AddNoteDialog

```typescript
<AddNoteDialog
  open={isOpen}                            // boolean
  onOpenChange={(open) => {...}}           // (open: boolean) => void
  onSubmit={(note) => {...}}               // (note: string) => void
/>
```

## Type Definitions

### Application

```typescript
interface Application {
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
```

### ApplicationStatus

```typescript
type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';
```

### ApplicationFilters

```typescript
interface ApplicationFilters {
  status?: ApplicationStatus[];
  company?: string;
  dateRange?: { from: Date; to: Date };
  minMatchScore?: number;
  searchQuery?: string;
}
```

## Utility Functions

### From `@/lib/utils`

```typescript
formatDate(date: string | Date): string
// "2024-01-15" => "Jan 15, 2024"

formatRelativeTime(date: string | Date): string
// Recent dates => "2d ago", "5h ago", etc.

getInitials(name: string): string
// "TechCorp Inc" => "TI"

getMatchScoreColor(score: number): string
// Returns Tailwind classes based on score

getStatusColor(status: string): string
// Returns Tailwind classes for status badges
```

## Common Patterns

### Basic Page Setup

```typescript
'use client';

import { useState } from 'react';
import { KanbanBoard, ApplicationList } from '@/components/applications';

export default function ApplicationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [applications, setApplications] = useState<Application[]>([]);

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    setApplications(prev =>
      prev.map(app => app.id === id ? { ...app, status } : app)
    );
  };

  return (
    <div>
      {viewMode === 'kanban' ? (
        <KanbanBoard
          applications={applications}
          onStatusChange={handleStatusChange}
          {...otherProps}
        />
      ) : (
        <ApplicationList
          applications={applications}
          onStatusChange={handleStatusChange}
          {...otherProps}
        />
      )}
    </div>
  );
}
```

### With Filtering

```typescript
const [filters, setFilters] = useState<ApplicationFilters>({});

const filteredApps = useMemo(() => {
  return applications.filter(app => {
    if (filters.status?.length && !filters.status.includes(app.status)) {
      return false;
    }
    if (filters.minMatchScore && app.matchScore < filters.minMatchScore) {
      return false;
    }
    return true;
  });
}, [applications, filters]);

return (
  <>
    <Filters
      filters={filters}
      onFiltersChange={setFilters}
      onReset={() => setFilters({})}
    />
    <KanbanBoard applications={filteredApps} {...props} />
  </>
);
```

### With Detail View

```typescript
const [selectedApp, setSelectedApp] = useState<Application | null>(null);

return (
  <>
    <KanbanBoard
      applications={applications}
      onApplicationView={setSelectedApp}
      {...props}
    />

    {selectedApp && (
      <ApplicationDetail
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        {...props}
      />
    )}
  </>
);
```

### With Notes

```typescript
const [noteDialogOpen, setNoteDialogOpen] = useState(false);
const [noteAppId, setNoteAppId] = useState<string | null>(null);

const handleAddNote = (appId: string) => {
  setNoteAppId(appId);
  setNoteDialogOpen(true);
};

const handleNoteSubmit = (content: string) => {
  if (!noteAppId) return;

  const newNote = {
    id: crypto.randomUUID(),
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  setApplications(prev =>
    prev.map(app =>
      app.id === noteAppId
        ? { ...app, notes: [newNote, ...app.notes] }
        : app
    )
  );
};

return (
  <>
    <ApplicationDetail
      application={selectedApp}
      onAddNote={handleAddNote}
      {...props}
    />

    <AddNoteDialog
      open={noteDialogOpen}
      onOpenChange={setNoteDialogOpen}
      onSubmit={handleNoteSubmit}
    />
  </>
);
```

## Styling Customization

### Custom Status Colors

```typescript
// In utils.ts
export function getStatusColor(status: ApplicationStatus): string {
  const colors: Record<ApplicationStatus, string> = {
    applied: 'bg-blue-100 text-blue-800',
    screening: 'bg-yellow-100 text-yellow-800',
    interview: 'bg-purple-100 text-purple-800',
    offer: 'bg-green-100 text-green-800',
    rejected: 'bg-gray-100 text-gray-800',
  };
  return colors[status];
}
```

### Custom Card Styling

```typescript
<ApplicationCard
  className="hover:shadow-xl transition-shadow"
  application={app}
  {...props}
/>
```

## Event Handlers

### Status Change

```typescript
const handleStatusChange = (id: string, newStatus: ApplicationStatus) => {
  // Update local state
  setApplications(prev =>
    prev.map(app =>
      app.id === id
        ? {
            ...app,
            status: newStatus,
            timeline: [
              {
                id: crypto.randomUUID(),
                type: 'status_change',
                title: `Moved to ${newStatus}`,
                timestamp: new Date().toISOString(),
              },
              ...app.timeline,
            ],
          }
        : app
    )
  );

  // API call
  updateStatusMutation.mutate({ id, status: newStatus });
};
```

### Delete Application

```typescript
const handleDelete = (id: string) => {
  if (!confirm('Delete this application?')) return;

  // Optimistic update
  setApplications(prev => prev.filter(app => app.id !== id));

  // Close detail view if open
  if (selectedApp?.id === id) {
    setSelectedApp(null);
  }

  // API call
  deleteAppMutation.mutate(id);
};
```

## Keyboard Shortcuts

Add keyboard shortcuts for better UX:

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // ESC to close detail view
    if (e.key === 'Escape' && selectedApp) {
      setSelectedApp(null);
    }

    // K to toggle view mode
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setViewMode(v => v === 'kanban' ? 'list' : 'kanban');
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [selectedApp]);
```

## Testing

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { ApplicationCard } from './application-card';

const mockApp: Application = {
  id: '1',
  jobTitle: 'Frontend Dev',
  company: 'TechCorp',
  status: 'applied',
  appliedDate: new Date().toISOString(),
  matchScore: 85,
  notes: [],
  timeline: [],
};

test('renders application card', () => {
  render(<ApplicationCard application={mockApp} onView={jest.fn()} />);

  expect(screen.getByText('Frontend Dev')).toBeInTheDocument();
  expect(screen.getByText('TechCorp')).toBeInTheDocument();
  expect(screen.getByText('85% match')).toBeInTheDocument();
});
```

## Performance Tips

1. **Memoize filtered data**: Use `useMemo` for filtering
2. **Virtualize large lists**: Consider `react-virtual` for 100+ items
3. **Debounce search**: Use `debounce` utility for search input
4. **Lazy load detail view**: Code split detail component
5. **Optimize images**: Use Next.js Image component

## Troubleshooting

### Drag and Drop Not Working

- Ensure `draggable` attribute is set
- Check event handlers are attached
- Verify `onDragOver` calls `e.preventDefault()`

### Filters Not Updating

- Check state updates are immutable
- Verify filter logic in memo
- Ensure filter values match data types

### Detail Panel Not Closing

- Check if `onClose` handler is connected
- Verify overlay click handler works
- Test ESC key handler

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 90+     | Full    |
| Firefox | 88+     | Full    |
| Safari  | 14+     | Full    |
| Edge    | 90+     | Full    |

## Resources

- [Main Documentation](./README.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)
- [Component API](../ui/)
- [Type Definitions](../../types/application.ts)
