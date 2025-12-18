'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  DollarSign,
  ExternalLink,
  ArrowRight,
  Zap,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatRelativeTime, getMatchScoreColor } from '@/lib/utils';

interface RecentJob {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore: number;
  salary?: string;
  hasEasyApply: boolean;
  isSaved: boolean;
  discoveredAt: string;
  platform: string;
}

interface RecentJobsWidgetProps {
  jobs: RecentJob[];
  maxItems?: number;
}

const platformColors: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  indeed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  glassdoor: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  company: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
};

export function RecentJobsWidget({ jobs, maxItems = 5 }: RecentJobsWidgetProps) {
  const displayedJobs = jobs.slice(0, maxItems);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Recent Discoveries</CardTitle>
        <Link href="/jobs">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[380px]">
          <div className="px-6 pb-6 space-y-3">
            {displayedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Building2 className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No recent jobs discovered</p>
                <Link href="/hunt">
                  <Button variant="link" size="sm">Start a job hunt</Button>
                </Link>
              </div>
            ) : (
              displayedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs?selected=${job.id}`}
                  className="block group"
                >
                  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all duration-200 hover:shadow-sm">
                    {/* Company Logo Placeholder */}
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 border">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>

                    {/* Job Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {job.title}
                        </h4>
                        {/* Match Score */}
                        <div className={cn(
                          'text-sm font-bold px-2 py-0.5 rounded-md flex-shrink-0',
                          job.matchScore >= 80 ? 'bg-green-100 dark:bg-green-900/30' :
                          job.matchScore >= 60 ? 'bg-amber-100 dark:bg-amber-900/30' :
                          'bg-red-100 dark:bg-red-900/30',
                          getMatchScoreColor(job.matchScore)
                        )}>
                          {job.matchScore}%
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{job.company}</p>
                      <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                        {job.salary && (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <DollarSign className="h-3 w-3" />
                            {job.salary}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', platformColors[job.platform] || 'bg-gray-100')}>
                          {job.platform}
                        </Badge>
                        {job.hasEasyApply && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                            <Zap className="h-2.5 w-2.5 mr-0.5" />
                            Easy
                          </Badge>
                        )}
                        {job.isSaved && (
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {formatRelativeTime(job.discoveredAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
