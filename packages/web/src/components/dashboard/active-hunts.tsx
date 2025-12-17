'use client';

import * as React from 'react';
import { Play, Pause, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatRelativeTime } from '@/lib/utils';

export interface JobHunt {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  searchQuery: string;
  jobsFound: number;
  applicationsSubmitted: number;
  targetCount?: number;
  startedAt: string | Date;
  lastActivityAt?: string | Date;
  errorMessage?: string;
}

interface ActiveHuntsProps {
  hunts: JobHunt[];
  onStartHunt?: (huntId: string) => void;
  onPauseHunt?: (huntId: string) => void;
  onViewHunt?: (huntId: string) => void;
}

const statusConfig = {
  running: {
    label: 'Running',
    variant: 'default' as const,
    icon: Play,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  completed: {
    label: 'Completed',
    variant: 'secondary' as const,
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  failed: {
    label: 'Failed',
    variant: 'destructive' as const,
    icon: XCircle,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  paused: {
    label: 'Paused',
    variant: 'outline' as const,
    icon: Pause,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
};

export function ActiveHunts({
  hunts,
  onStartHunt,
  onPauseHunt,
  onViewHunt,
}: ActiveHuntsProps) {
  const handleToggleHunt = (hunt: JobHunt) => {
    if (hunt.status === 'running') {
      onPauseHunt?.(hunt.id);
    } else if (hunt.status === 'paused') {
      onStartHunt?.(hunt.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Job Hunts</CardTitle>
      </CardHeader>
      <CardContent>
        {hunts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active job hunts. Start a new hunt to begin!
          </p>
        ) : (
          <div className="space-y-4">
            {hunts.map((hunt) => {
              const config = statusConfig[hunt.status];
              const StatusIcon = config.icon;
              const progress = hunt.targetCount
                ? (hunt.applicationsSubmitted / hunt.targetCount) * 100
                : 0;

              return (
                <div
                  key={hunt.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{hunt.searchQuery}</h4>
                        <Badge className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{hunt.jobsFound} jobs found</span>
                        <span>{hunt.applicationsSubmitted} applications sent</span>
                        {hunt.lastActivityAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(hunt.lastActivityAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(hunt.status === 'running' || hunt.status === 'paused') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleHunt(hunt)}
                        >
                          {hunt.status === 'running' ? (
                            <>
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Resume
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewHunt?.(hunt.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>

                  {hunt.targetCount && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>
                          {hunt.applicationsSubmitted} / {hunt.targetCount}
                        </span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}

                  {hunt.status === 'failed' && hunt.errorMessage && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
                      <p className="text-xs text-destructive">{hunt.errorMessage}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
