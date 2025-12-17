# Application Tracker Architecture

Visual guide to the Application Tracker component structure and data flow.

## Component Tree

```
┌─────────────────────────────────────────────────────────────┐
│                    ApplicationsPage                          │
│                    (page.tsx)                                │
│                                                              │
│  State:                                                      │
│  • applications: Application[]                              │
│  • viewMode: 'kanban' | 'list'                              │
│  • selectedApplication: Application | null                  │
│  • filters: ApplicationFilters                              │
│  • addNoteDialogOpen: boolean                               │
│  • noteApplicationId: string | null                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
┌─────────────┐         ┌─────────────┐
│   Header    │         │   Filters   │
│             │         │             │
│ • Title     │         │ • Search    │
│ • Counter   │         │ • Status    │
│ • Toggle    │         │ • Score     │
│ • Export    │         │ • Clear     │
└─────────────┘         └─────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         Content Area                     │
│  (Conditional based on viewMode)         │
└──────────┬──────────────────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐   ┌────────────┐
│Kanban  │   │Application │
│Board   │   │List        │
└───┬────┘   └─────┬──────┘
    │              │
    │    ┌─────────┴─────────┐
    │    │                   │
    ▼    ▼                   ▼
┌────────────┐         ┌──────────┐
│Application │         │  Table   │
│Card        │         │   Row    │
│            │         │          │
│(draggable) │         │• Avatar  │
│            │         │• Info    │
│• Avatar    │         │• Status  │
│• Job Info  │         │• Actions │
│• Score     │         └──────────┘
│• Actions   │
└────────────┘

        │
        │ (onClick)
        ▼
┌─────────────────────────────────────────┐
│      ApplicationDetail                   │
│      (slide-over panel)                  │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Header                         │    │
│  │  • Avatar                       │    │
│  │  • Job Title                    │    │
│  │  • Company                      │    │
│  │  • Close Button                 │    │
│  └────────────────────────────────┘    │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Key Info Grid                  │    │
│  │  • Status (editable)            │    │
│  │  • Match Score                  │    │
│  │  • Applied Date                 │    │
│  │  • Location                     │    │
│  │  • Salary                       │    │
│  └────────────────────────────────┘    │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Job Description                │    │
│  └────────────────────────────────┘    │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Attachments                    │    │
│  │  • Resume Link                  │    │
│  │  • Cover Letter Link            │    │
│  └────────────────────────────────┘    │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Timeline                       │    │
│  │  • Events with timestamps       │    │
│  │  • Visual indicators            │    │
│  └────────────────────────────────┘    │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Notes Section                  │    │
│  │  • Add Note Button              │    │
│  │  • Note List                    │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘

        │
        │ (Add Note Click)
        ▼
┌─────────────────────────────────────────┐
│       AddNoteDialog                      │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Header                         │    │
│  │  • Title                        │    │
│  │  • Description                  │    │
│  └────────────────────────────────┘    │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Content                        │    │
│  │  • Textarea                     │    │
│  └────────────────────────────────┘    │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Actions                        │    │
│  │  • Cancel Button                │    │
│  │  • Submit Button                │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Actions                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
  [Drag Card]    [Update Filter]  [Add Note]
       │               │               │
       │               │               │
       ▼               ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│handleStatus│  │setFilters  │  │handleNote  │
│Change      │  │            │  │Submit      │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      │               │               │
      ▼               ▼               ▼
┌──────────────────────────────────────────┐
│      Update State (setApplications)       │
│                                           │
│  applications.map(app =>                  │
│    app.id === targetId                    │
│      ? { ...app, [changes] }              │
│      : app                                │
│  )                                        │
└───────────────────┬───────────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │  useMemo Trigger  │
         │                   │
         │ filteredApps =    │
         │   applications    │
         │   .filter(...)    │
         └────────┬──────────┘
                  │
                  ▼
         ┌────────────────┐
         │  Re-render UI   │
         │                 │
         │ • Kanban/List   │
         │ • Detail Panel  │
         │ • Counters      │
         └─────────────────┘
```

## State Update Flow

```
User Action
    │
    ▼
Event Handler
    │
    ▼
State Update (setState)
    │
    ├─► Add Timeline Event
    │
    ├─► Update Application
    │
    └─► Update Related State
        │
        ▼
    React Re-render
        │
        ├─► Update Kanban Board
        │
        ├─► Update List View
        │
        ├─► Update Detail Panel
        │
        └─► Update Filters/Counters
```

## Drag and Drop Flow

```
1. User grabs card
   │
   ▼
2. onDragStart
   │ • Set draggedItem state
   │ • Set dataTransfer
   │
   ▼
3. User drags over column
   │
   ▼
4. onDragOver
   │ • preventDefault()
   │ • Set draggedOverColumn
   │ • Show visual feedback
   │
   ▼
5. User releases card
   │
   ▼
6. onDrop
   │ • Get new status from column
   │ • Call handleStatusChange
   │ • Clear drag states
   │
   ▼
7. State Update
   │ • Update application status
   │ • Add timeline event
   │ • Trigger re-render
   │
   ▼
8. UI Updates
   • Card appears in new column
   • Timeline shows new event
   • Visual feedback clears
```

## Filter Flow

```
User Input
    │
    ▼
Filter Component
    │
    ├─► Search Input
    │   └─► onFiltersChange({ searchQuery })
    │
    ├─► Status Pill
    │   └─► onFiltersChange({ status: [...] })
    │
    └─► Score Dropdown
        └─► onFiltersChange({ minMatchScore })
    │
    ▼
State Update (setFilters)
    │
    ▼
useMemo Recalculation
    │
    │ filteredApplications = applications.filter(app => {
    │   if (filters.status && !filters.status.includes(app.status))
    │     return false;
    │   if (filters.searchQuery && !matches(app, query))
    │     return false;
    │   if (filters.minMatchScore && app.matchScore < min)
    │     return false;
    │   return true;
    │ })
    │
    ▼
Component Re-render
    │
    └─► Pass filteredApplications to Kanban/List
        │
        └─► UI shows filtered results
```

## Component Communication

```
┌─────────────────┐
│ ApplicationsPage│ ◄─── Props from parent (none)
└────────┬────────┘
         │
         │ Props ▼
         │
    ┌────┴────┬────────┬──────────┬────────────┐
    ▼         ▼        ▼          ▼            ▼
┌───────┐ ┌─────┐ ┌──────┐ ┌──────────┐ ┌─────────┐
│Filters│ │Kanban│ │List  │ │Detail    │ │NoteDialog│
└───┬───┘ └──┬──┘ └───┬──┘ └────┬─────┘ └────┬────┘
    │        │        │         │            │
    │        │        │         │            │
    └────────┴────────┴─────────┴────────────┘
                      │
         Callbacks ▲  │  Data ▼
                      │
              ┌───────┴────────┐
              │ Event Handlers │
              │                │
              │ • onStatusChange
              │ • onApplicationView
              │ • onApplicationDelete
              │ • onFiltersChange
              │ • onAddNote
              │ • onNoteSubmit
              └────────────────┘
```

## Type Safety Flow

```
TypeScript Interfaces
    │
    ├─► Application
    │   ├─► ApplicationNote
    │   └─► TimelineEvent
    │
    ├─► ApplicationStatus (enum)
    │
    ├─► ApplicationFilters
    │
    └─► ViewMode
        │
        ▼
Component Props
    │
    ├─► KanbanBoard: { applications, onStatusChange, ... }
    │
    ├─► ApplicationList: { applications, onStatusChange, ... }
    │
    ├─► ApplicationCard: { application, onView, ... }
    │
    └─► ApplicationDetail: { application, onClose, ... }
        │
        ▼
    Runtime Type Checking
        │
        └─► TypeScript compiler validates all types
            • Props match interfaces
            • Event handlers have correct signatures
            • State updates are type-safe
```

## File Dependencies

```
page.tsx
  │
  ├─► @/components/applications
  │   ├─► KanbanBoard
  │   ├─► ApplicationList
  │   ├─► ApplicationDetail
  │   ├─► Filters
  │   └─► AddNoteDialog
  │
  ├─► @/components/ui
  │   ├─► Button
  │   ├─► Tabs
  │   ├─► Badge
  │   ├─► Card
  │   ├─► Dialog
  │   ├─► Input
  │   ├─► Select
  │   ├─► Avatar
  │   ├─► ScrollArea
  │   └─► Separator
  │
  ├─► @/types/application
  │   └─► All type definitions
  │
  └─► @/lib/utils
      ├─► formatDate
      ├─► formatRelativeTime
      ├─► getInitials
      ├─► getMatchScoreColor
      └─► getStatusColor
```

## Performance Optimizations

```
┌─────────────────────────────────────┐
│        Render Optimization           │
└─────────────────────────────────────┘
    │
    ├─► useMemo (filteredApplications)
    │   • Only recalculates when
    │     applications or filters change
    │
    ├─► React.memo (future)
    │   • Can wrap ApplicationCard
    │   • Prevent unnecessary re-renders
    │
    ├─► Pagination (List View)
    │   • Only render 10 items at a time
    │   • Reduces DOM nodes
    │
    └─► Conditional Rendering
        • Only render active view
        • Detail panel only when selected
        • Dialog only when open
```

## Error Boundaries (Future)

```
┌─────────────────┐
│  ErrorBoundary  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ApplicationsPage│
└────────┬────────┘
         │
         ▼
  ┌──────┴──────┐
  │   Suspense  │ (Loading states)
  └──────┬──────┘
         │
         ▼
    Components
```

## Mobile Responsiveness

```
Desktop (>768px)          Mobile (<768px)
┌─────────────────┐      ┌──────┐
│  Kanban Board   │      │Kanban│◄─ Horizontal
│  ┌───┬───┬───┐  │      │Scroll│   Scroll
│  │ A │ B │ C │  │      └──────┘
│  └───┴───┴───┘  │
└─────────────────┘      ┌──────┐
                         │ List │
┌─────────────────┐      │  ↕   │◄─ Vertical
│   List Table    │      │      │   Scroll
│                 │      └──────┘
└─────────────────┘
                         ┌──────┐
┌─────────────────┐      │Detail│
│ Detail Panel    │      │Full  │◄─ Full Screen
│   (Slide-over)  │      │Screen│
└─────────────────┘      └──────┘
```

## Summary

This architecture provides:
✅ Clear separation of concerns
✅ Unidirectional data flow
✅ Type-safe components
✅ Optimized rendering
✅ Scalable structure
✅ Easy to maintain
✅ Ready for backend integration
