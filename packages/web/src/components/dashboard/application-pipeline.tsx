'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Send,
  Search,
  MessageSquare,
  Trophy,
  XCircle,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PipelineStage {
  id: string;
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface ApplicationPipelineProps {
  stages?: PipelineStage[];
  totalApplications?: number;
}

const defaultStages: PipelineStage[] = [
  { id: 'applied', label: 'Applied', count: 0, icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'screening', label: 'Screening', count: 0, icon: Search, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  { id: 'interview', label: 'Interview', count: 0, icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  { id: 'offer', label: 'Offer', count: 0, icon: Trophy, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { id: 'rejected', label: 'Rejected', count: 0, icon: XCircle, color: 'text-slate-500', bgColor: 'bg-slate-100 dark:bg-slate-900/30' },
];

export function ApplicationPipeline({
  stages = defaultStages,
  totalApplications = 0,
}: ApplicationPipelineProps) {
  const activeStages = stages.filter(s => s.id !== 'rejected');
  const rejectedStage = stages.find(s => s.id === 'rejected');
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Application Pipeline</CardTitle>
        <Link href="/applications">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {/* Pipeline Flow */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-12 left-0 right-0 h-0.5 bg-border" />

          {/* Stages */}
          <div className="flex justify-between relative">
            {activeStages.map((stage, index) => {
              const Icon = stage.icon;
              const percentage = totalApplications > 0 ? Math.round((stage.count / totalApplications) * 100) : 0;

              return (
                <React.Fragment key={stage.id}>
                  <Link href={`/applications?status=${stage.id}`} className="group">
                    <div className="flex flex-col items-center">
                      {/* Stage Circle */}
                      <div className={cn(
                        'relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200',
                        'group-hover:scale-110 group-hover:shadow-lg',
                        stage.bgColor,
                        stage.color.replace('text-', 'border-')
                      )}>
                        <Icon className={cn('h-5 w-5', stage.color)} />
                        {stage.count > 0 && (
                          <div className={cn(
                            'absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-bold text-white px-1',
                            stage.color.replace('text-', 'bg-')
                          )}>
                            {stage.count}
                          </div>
                        )}
                      </div>

                      {/* Stage Label */}
                      <span className="mt-2 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {stage.label}
                      </span>

                      {/* Percentage */}
                      {totalApplications > 0 && (
                        <span className={cn('text-xs', stage.color)}>
                          {percentage}%
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Arrow between stages */}
                  {index < activeStages.length - 1 && (
                    <div className="flex items-center justify-center h-12">
                      <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold">{totalApplications}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {stages.find(s => s.id === 'applied')?.count || 0}
            </p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {stages.find(s => s.id === 'offer')?.count || 0}
            </p>
            <p className="text-xs text-muted-foreground">Offers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-500">
              {rejectedStage?.count || 0}
            </p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Interview Rate</span>
            <span className="font-medium">
              {totalApplications > 0
                ? Math.round(((stages.find(s => s.id === 'interview')?.count || 0) / totalApplications) * 100)
                : 0}%
            </span>
          </div>
          <Progress
            value={totalApplications > 0
              ? ((stages.find(s => s.id === 'interview')?.count || 0) / totalApplications) * 100
              : 0}
            className="h-2 mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}
