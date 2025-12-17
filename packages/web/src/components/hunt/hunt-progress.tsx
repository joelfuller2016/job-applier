/**
 * Hunt Progress Component
 * Real-time progress display for active job hunt
 */

'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, Loader2, Target, Zap, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { HuntProgress, HuntPhase } from '@/types/hunt';

interface HuntProgressProps {
  progress: HuntProgress;
  onCancel?: () => void;
}

const phaseConfig: Record<
  HuntPhase,
  { label: string; icon: React.ReactNode; color: string }
> = {
  idle: {
    label: 'Ready',
    icon: <Target className="h-4 w-4" />,
    color: 'bg-gray-500',
  },
  discovering: {
    label: 'Discovering Jobs',
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: 'bg-blue-500',
  },
  matching: {
    label: 'Matching Profiles',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-yellow-500',
  },
  applying: {
    label: 'Submitting Applications',
    icon: <Send className="h-4 w-4" />,
    color: 'bg-green-500',
  },
  completed: {
    label: 'Hunt Completed',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'bg-emerald-500',
  },
  error: {
    label: 'Error',
    icon: <XCircle className="h-4 w-4" />,
    color: 'bg-red-500',
  },
};

const logIcons = {
  info: <Info className="h-3 w-3 text-blue-500" />,
  success: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  warning: <AlertCircle className="h-3 w-3 text-yellow-500" />,
  error: <XCircle className="h-3 w-3 text-red-500" />,
};

export function HuntProgress({ progress, onCancel }: HuntProgressProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { phase, jobsDiscovered, jobsMatched, applicationsSubmitted, currentActivity, logs } =
    progress;

  const phaseInfo = phaseConfig[phase];
  const isActive = ['discovering', 'matching', 'applying'].includes(phase);

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (phase === 'idle') return 0;
    if (phase === 'discovering') return 25;
    if (phase === 'matching') return 50;
    if (phase === 'applying') return 75;
    if (phase === 'completed') return 100;
    return 0;
  };

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <div className={cn('h-2 w-2 rounded-full', phaseInfo.color)} />
              Hunt Progress
            </CardTitle>
            <CardDescription>{currentActivity || 'Waiting to start...'}</CardDescription>
          </div>
          {onCancel && isActive && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel Hunt
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phase Indicator */}
        <div className="flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg">
          {phaseInfo.icon}
          <span className="font-medium">{phaseInfo.label}</span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={getProgressPercentage()} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Discovering</span>
            <span>Matching</span>
            <span>Applying</span>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1 text-center">
            <div className="text-2xl font-bold text-blue-600">{jobsDiscovered}</div>
            <div className="text-xs text-muted-foreground">Discovered</div>
          </div>
          <div className="space-y-1 text-center">
            <div className="text-2xl font-bold text-yellow-600">{jobsMatched}</div>
            <div className="text-xs text-muted-foreground">Matched</div>
          </div>
          <div className="space-y-1 text-center">
            <div className="text-2xl font-bold text-green-600">{applicationsSubmitted}</div>
            <div className="text-xs text-muted-foreground">Applied</div>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Activity Log</h4>
            <Badge variant="outline">{logs.length} events</Badge>
          </div>
          <ScrollArea className="h-64 rounded-md border p-4">
            <div ref={scrollRef} className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity yet. Start a hunt to see logs here.
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 text-sm animate-in fade-in slide-in-from-bottom-1 duration-300"
                  >
                    <div className="mt-0.5">{logIcons[log.level]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="break-words">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
