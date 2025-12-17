'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bot, Play, Pause, Square, Activity, Zap, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAutomationStore } from '@/stores/automation-store';
import { useSocket } from '@/hooks/use-socket';
import { cn } from '@/lib/utils';

const stateConfig = {
  idle: {
    label: 'Idle',
    color: 'bg-gray-500',
    badgeVariant: 'secondary' as const,
  },
  running: {
    label: 'Running',
    color: 'bg-green-500',
    badgeVariant: 'default' as const,
  },
  paused: {
    label: 'Paused',
    color: 'bg-yellow-500',
    badgeVariant: 'outline' as const,
  },
  error: {
    label: 'Error',
    color: 'bg-red-500',
    badgeVariant: 'destructive' as const,
  },
};

export function AutomationStatus() {
  const { status, sessionStats, isConnected } = useAutomationStore();
  const { startAutomation, stopAutomation, pauseAutomation, resumeAutomation } = useSocket({
    autoConnect: true,
  });

  const stateInfo = stateConfig[status.state];
  const progress = status.totalJobs
    ? Math.round((status.processedJobs || 0) / status.totalJobs * 100)
    : 0;

  const handleQuickAction = () => {
    switch (status.state) {
      case 'idle':
        startAutomation({ platforms: ['linkedin'] });
        break;
      case 'running':
        pauseAutomation();
        break;
      case 'paused':
        resumeAutomation();
        break;
      case 'error':
        startAutomation({ platforms: ['linkedin'] });
        break;
    }
  };

  const getQuickActionButton = () => {
    switch (status.state) {
      case 'idle':
        return (
          <Button size="sm" onClick={handleQuickAction} className="gap-2">
            <Play className="h-4 w-4" />
            Start
          </Button>
        );
      case 'running':
        return (
          <Button size="sm" variant="outline" onClick={handleQuickAction} className="gap-2">
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        );
      case 'paused':
        return (
          <Button size="sm" onClick={handleQuickAction} className="gap-2">
            <Play className="h-4 w-4" />
            Resume
          </Button>
        );
      case 'error':
        return (
          <Button size="sm" variant="destructive" onClick={handleQuickAction} className="gap-2">
            <Play className="h-4 w-4" />
            Retry
          </Button>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Automation
          </CardTitle>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              )}
              title={isConnected ? 'Connected' : 'Disconnected'}
            />
            <Badge variant={stateInfo.badgeVariant}>
              {stateInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Task */}
        {status.currentTask && (
          <div className="text-sm">
            <span className="text-muted-foreground">Current: </span>
            <span className="font-medium">{status.currentTask}</span>
          </div>
        )}

        {/* Progress */}
        {status.state === 'running' && status.totalJobs && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {status.processedJobs || 0} / {status.totalJobs} jobs
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Zap className="h-3 w-3" />
            </div>
            <p className="text-lg font-bold">{sessionStats.applicationsSubmitted}</p>
            <p className="text-xs text-muted-foreground">Submitted</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Activity className="h-3 w-3" />
            </div>
            <p className="text-lg font-bold">{sessionStats.applicationsSkipped}</p>
            <p className="text-xs text-muted-foreground">Skipped</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
            </div>
            <p className="text-lg font-bold">{sessionStats.errorsEncountered}</p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          {getQuickActionButton()}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/automation" className="gap-2">
              Open Center
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
