# Application Tracker Integration Guide

Quick reference for integrating the Application Tracker with your backend.

## API Integration Examples

### 1. Fetch Applications

```typescript
// hooks/useApplications.ts
import { useQuery } from '@tanstack/react-query';
import type { Application } from '@/types/application';

export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const response = await fetch('/api/applications');
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json() as Promise<Application[]>;
    },
  });
}

// Update page.tsx
const { data: applications = [], isLoading, error } = useApplications();
```

### 2. Update Application Status

```typescript
// hooks/useUpdateStatus.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      const response = await fetch(`/api/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

// In page.tsx
const updateStatusMutation = useUpdateStatus();

const handleStatusChange = (applicationId: string, newStatus: ApplicationStatus) => {
  updateStatusMutation.mutate({ id: applicationId, status: newStatus });
};
```

### 3. Add Note to Application

```typescript
// hooks/useAddNote.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, content }: { applicationId: string; content: string }) => {
      const response = await fetch(`/api/applications/${applicationId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to add note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
```

### 4. Delete Application

```typescript
// hooks/useDeleteApplication.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete application');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
```

## tRPC Integration

### Router Definition

```typescript
// server/routers/applications.ts
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

const statusEnum = z.enum(['applied', 'screening', 'interview', 'offer', 'rejected']);

export const applicationsRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.application.findMany({
      where: { userId: ctx.userId },
      include: {
        notes: true,
        timeline: true,
      },
      orderBy: { appliedDate: 'desc' },
    });
  }),

  updateStatus: publicProcedure
    .input(z.object({
      id: z.string(),
      status: statusEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.db.application.update({
        where: { id: input.id },
        data: { status: input.status },
      });

      // Add timeline event
      await ctx.db.timelineEvent.create({
        data: {
          applicationId: input.id,
          type: 'status_change',
          title: `Moved to ${input.status}`,
          timestamp: new Date(),
        },
      });

      return application;
    }),

  addNote: publicProcedure
    .input(z.object({
      applicationId: z.string(),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.applicationNote.create({
        data: {
          applicationId: input.applicationId,
          content: input.content,
        },
      });

      // Add timeline event
      await ctx.db.timelineEvent.create({
        data: {
          applicationId: input.applicationId,
          type: 'note_added',
          title: 'Note Added',
          description: input.content,
          timestamp: new Date(),
        },
      });

      return note;
    }),

  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.application.delete({
        where: { id: input },
      });
    }),
});
```

### Usage in Page Component

```typescript
// page.tsx
import { trpc } from '@/lib/trpc';

export default function ApplicationsPage() {
  const { data: applications = [], isLoading } = trpc.applications.list.useQuery();
  const updateStatus = trpc.applications.updateStatus.useMutation();
  const addNote = trpc.applications.addNote.useMutation();
  const deleteApp = trpc.applications.delete.useMutation();

  const handleStatusChange = (applicationId: string, newStatus: ApplicationStatus) => {
    updateStatus.mutate(
      { id: applicationId, status: newStatus },
      {
        onSuccess: () => {
          // Optionally show toast notification
        },
      }
    );
  };

  const handleNoteSubmit = (content: string) => {
    if (!noteApplicationId) return;

    addNote.mutate(
      { applicationId: noteApplicationId, content },
      {
        onSuccess: () => {
          setNoteApplicationId(null);
          setAddNoteDialogOpen(false);
        },
      }
    );
  };

  const handleApplicationDelete = (id: string) => {
    if (confirm('Are you sure?')) {
      deleteApp.mutate(id, {
        onSuccess: () => {
          setSelectedApplication(null);
        },
      });
    }
  };

  // ... rest of component
}
```

## Database Schema (Prisma)

```prisma
model Application {
  id              String            @id @default(cuid())
  userId          String
  jobId           String
  jobTitle        String
  company         String
  companyLogo     String?
  status          ApplicationStatus @default(APPLIED)
  appliedDate     DateTime          @default(now())
  matchScore      Int
  location        String?
  salary          String?
  description     String?
  resumeUrl       String?
  coverLetterUrl  String?
  nextSteps       String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  user            User              @relation(fields: [userId], references: [id])
  notes           ApplicationNote[]
  timeline        TimelineEvent[]

  @@index([userId])
  @@index([status])
  @@index([appliedDate])
}

enum ApplicationStatus {
  APPLIED
  SCREENING
  INTERVIEW
  OFFER
  REJECTED
}

model ApplicationNote {
  id              String      @id @default(cuid())
  applicationId   String
  content         String
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  application     Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([applicationId])
}

model TimelineEvent {
  id              String      @id @default(cuid())
  applicationId   String
  type            String
  title           String
  description     String?
  timestamp       DateTime    @default(now())

  application     Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([applicationId])
  @@index([timestamp])
}
```

## Real-time Updates with Socket.IO

```typescript
// hooks/useApplicationUpdates.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '@/lib/socket';
import type { Application } from '@/types/application';

export function useApplicationUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    socket.on('application:created', (application: Application) => {
      queryClient.setQueryData<Application[]>(['applications'], (old = []) => [
        application,
        ...old,
      ]);
    });

    socket.on('application:updated', (application: Application) => {
      queryClient.setQueryData<Application[]>(['applications'], (old = []) =>
        old.map((app) => (app.id === application.id ? application : app))
      );
    });

    socket.on('application:deleted', (id: string) => {
      queryClient.setQueryData<Application[]>(['applications'], (old = []) =>
        old.filter((app) => app.id !== id)
      );
    });

    return () => {
      socket.off('application:created');
      socket.off('application:updated');
      socket.off('application:deleted');
    };
  }, [queryClient]);
}

// In page.tsx
useApplicationUpdates();
```

## Optimistic Updates

```typescript
// hooks/useUpdateStatus.ts with optimistic updates
export function useUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ApplicationStatus }) => {
      // API call
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['applications'] });

      // Snapshot current state
      const previousApplications = queryClient.getQueryData<Application[]>(['applications']);

      // Optimistically update
      queryClient.setQueryData<Application[]>(['applications'], (old = []) =>
        old.map((app) =>
          app.id === id
            ? {
                ...app,
                status,
                timeline: [
                  {
                    id: `temp-${Date.now()}`,
                    type: 'status_change',
                    title: `Moved to ${status}`,
                    timestamp: new Date().toISOString(),
                  },
                  ...app.timeline,
                ],
              }
            : app
        )
      );

      return { previousApplications };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousApplications) {
        queryClient.setQueryData(['applications'], context.previousApplications);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
```

## Export with Backend Data

```typescript
const handleExport = async () => {
  try {
    const response = await fetch('/api/applications/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
  }
};
```

## Pagination for Large Datasets

```typescript
// Add to page.tsx for server-side pagination
const [page, setPage] = useState(1);
const pageSize = 20;

const { data, isLoading } = trpc.applications.list.useQuery({
  page,
  pageSize,
  filters,
});

// Update ApplicationList to use server pagination
<ApplicationList
  applications={data?.applications || []}
  totalCount={data?.totalCount || 0}
  currentPage={page}
  pageSize={pageSize}
  onPageChange={setPage}
  // ... other props
/>
```

## Caching Strategy

```typescript
// lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});
```

## Error Handling

```typescript
// Add to page.tsx
if (isLoading) {
  return <div>Loading applications...</div>;
}

if (error) {
  return (
    <div className="text-center py-12">
      <p className="text-destructive">Failed to load applications</p>
      <Button onClick={() => queryClient.invalidateQueries(['applications'])}>
        Retry
      </Button>
    </div>
  );
}
```

## Toast Notifications

```typescript
// Add to mutations
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

const updateStatus = trpc.applications.updateStatus.useMutation({
  onSuccess: () => {
    toast({
      title: 'Status updated',
      description: 'Application status has been updated successfully.',
    });
  },
  onError: () => {
    toast({
      title: 'Error',
      description: 'Failed to update status. Please try again.',
      variant: 'destructive',
    });
  },
});
```

## Summary

This guide provides:
- API integration patterns
- tRPC setup
- Database schema
- Real-time updates
- Optimistic updates
- Error handling
- Caching strategies
- Export functionality

All patterns are production-ready and follow Next.js and React Query best practices.
