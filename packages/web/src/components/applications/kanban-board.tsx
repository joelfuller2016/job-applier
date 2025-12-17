'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ApplicationCard } from './application-card';
import type { Application, ApplicationStatus } from '@/types/application';

interface KanbanBoardProps {
  applications: Application[];
  onApplicationView: (application: Application) => void;
  onApplicationDelete?: (id: string) => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
}

const statusColumns: Array<{
  status: ApplicationStatus;
  label: string;
  color: string;
}> = [
  { status: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { status: 'screening', label: 'Screening', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { status: 'interview', label: 'Interview', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { status: 'offer', label: 'Offer', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { status: 'rejected', label: 'Rejected', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
];

export function KanbanBoard({
  applications,
  onApplicationView,
  onApplicationDelete,
  onStatusChange,
}: KanbanBoardProps) {
  const [draggedItem, setDraggedItem] = React.useState<Application | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = React.useState<ApplicationStatus | null>(null);

  const getApplicationsByStatus = (status: ApplicationStatus) => {
    return applications.filter((app) => app.status === status);
  };

  const handleDragStart = (e: React.DragEvent, application: Application) => {
    setDraggedItem(application);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverColumn(status);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    if (draggedItem && draggedItem.status !== status) {
      onStatusChange(draggedItem.id, status);
    }
    setDraggedItem(null);
    setDraggedOverColumn(null);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-300px)] overflow-x-auto pb-4">
      {statusColumns.map((column) => {
        const columnApplications = getApplicationsByStatus(column.status);
        const isDraggedOver = draggedOverColumn === column.status;

        return (
          <div
            key={column.status}
            className="flex-shrink-0 w-80 flex flex-col"
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{column.label}</h3>
                <Badge variant="secondary" className="rounded-full">
                  {columnApplications.length}
                </Badge>
              </div>
            </div>

            {/* Column Content */}
            <ScrollArea
              className={`flex-1 rounded-lg border-2 border-dashed p-2 transition-colors ${
                isDraggedOver
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50'
              }`}
            >
              <div className="space-y-3 min-h-full">
                {columnApplications.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    No applications
                  </div>
                ) : (
                  columnApplications.map((application) => (
                    <div
                      key={application.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, application)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <ApplicationCard
                        application={application}
                        onView={onApplicationView}
                        onDelete={onApplicationDelete}
                        isDragging={draggedItem?.id === application.id}
                      />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
