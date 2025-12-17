# Job Hunt Interface

AI-powered job hunting interface with real-time progress tracking and application management.

## Components

### HuntForm (`hunt-form.tsx`)
Search and configuration form for starting a job hunt.

**Features:**
- Job search query input
- Location input with optional filter
- Remote-only toggle
- Specific companies targeting
- Max jobs slider (1-50)
- Match threshold slider (0-100%)
- Dry run mode checkbox

**Props:**
```typescript
{
  onSubmit: (config: HuntConfig) => void;
  isLoading?: boolean;
}
```

### HuntProgress (`hunt-progress.tsx`)
Real-time progress display for active job hunts.

**Features:**
- Phase indicator (Discovering, Matching, Applying)
- Progress bar with visual feedback
- Live activity logs with timestamps
- Job discovery/match/application counters
- Cancel hunt button

**Props:**
```typescript
{
  progress: HuntProgress;
  onCancel?: () => void;
}
```

### JobCard (`job-card.tsx`)
Individual job card with match score and actions.

**Features:**
- Job title, company, location display
- Color-coded match score
- Salary information (if available)
- Source badge (Exa, LinkedIn, Company)
- Expandable job description
- Apply/Skip action buttons
- Applied/Skipped status indicators

**Props:**
```typescript
{
  job: DiscoveredJob;
  onApply?: (jobId: string) => void;
  onSkip?: (jobId: string) => void;
  isApplying?: boolean;
}
```

### JobResults (`job-results.tsx`)
Grid/list view of discovered jobs with filtering and sorting.

**Features:**
- Toggle between grid and list view
- Sort by match score, date, or company
- Filter by source (Exa, LinkedIn, Company)
- Bulk actions (Apply All, Skip All)
- Statistics dashboard
- Empty state handling

**Props:**
```typescript
{
  jobs: DiscoveredJob[];
  onApply?: (jobId: string) => void;
  onSkip?: (jobId: string) => void;
  onApplyAll?: () => void;
  onSkipAll?: () => void;
  isApplying?: boolean;
}
```

### ConfirmationDialog (`confirmation-dialog.tsx`)
Confirmation dialog for application actions.

**Features:**
- Apply single job confirmation
- Skip single job confirmation
- Apply all jobs confirmation with warning
- Skip all jobs confirmation
- Job details display
- Loading states

**Props:**
```typescript
{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: DiscoveredJob;
  action: 'apply' | 'skip' | 'applyAll' | 'skipAll';
  jobCount?: number;
  onConfirm: () => void;
  isLoading?: boolean;
}
```

## Types

See `types/hunt.ts` for all type definitions:
- `HuntConfig` - Hunt configuration
- `DiscoveredJob` - Job data structure
- `HuntPhase` - Hunt lifecycle phases
- `HuntProgress` - Real-time progress tracking
- `HuntLog` - Activity log entry
- `HuntSession` - Complete hunt session

## Integration

### tRPC Integration (To Be Implemented)
Replace mock functions in `page.tsx` with:

```typescript
import { trpc } from '@/lib/trpc/react';

// Start hunt
const startHunt = trpc.hunt.start.useMutation();

// Get hunt status
const { data: session } = trpc.hunt.getSession.useQuery(sessionId);

// Apply to job
const applyToJob = trpc.hunt.apply.useMutation();
```

### WebSocket Integration (To Be Implemented)
For real-time updates:

```typescript
import { useEffect } from 'react';
import { io } from 'socket.io-client';

useEffect(() => {
  const socket = io();

  socket.on('hunt:progress', (data) => {
    setActiveSession((prev) => ({
      ...prev,
      progress: data,
    }));
  });

  socket.on('hunt:job-discovered', (job) => {
    setActiveSession((prev) => ({
      ...prev,
      jobs: [...prev.jobs, job],
    }));
  });

  return () => socket.disconnect();
}, []);
```

## UI Components Used

### Shadcn/ui Components
- Button
- Card
- Input
- Label
- Switch
- Slider
- Checkbox
- Badge
- Progress
- Dialog
- ScrollArea

All components are fully responsive and support dark mode.

## Styling

- Uses Tailwind CSS for styling
- Color-coded match scores:
  - Green (80%+): High match
  - Yellow (60-79%): Medium match
  - Red (<60%): Low match
- Animated transitions for smooth UX
- Accessible with keyboard navigation

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live hunt progress
2. **Job Bookmarking**: Save jobs for later review
3. **Advanced Filters**: Industry, salary range, experience level
4. **AI Insights**: Personalized recommendations and tips
5. **Application Templates**: Custom cover letters per job
6. **Interview Scheduling**: Calendar integration
7. **Hunt History**: View past hunts and results
8. **Analytics**: Success rates, response times, trends
