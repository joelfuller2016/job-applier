/**
 * Job Card Component
 * Individual job card with match score and actions
 */

'use client';

import { useState } from 'react';
import { Building2, MapPin, DollarSign, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, getMatchScoreColor } from '@/lib/utils';
import type { DiscoveredJob } from '@/types/hunt';

interface JobCardProps {
  job: DiscoveredJob;
  onApply?: (jobId: string) => void;
  onSkip?: (jobId: string) => void;
  isApplying?: boolean;
}

const sourceColors = {
  exa: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  linkedin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  company: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export function JobCard({ job, onApply, onSkip, isApplying = false }: JobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const matchScoreColor = getMatchScoreColor(job.matchScore);

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        job.applied && 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
        job.skipped && 'opacity-60'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-lg leading-tight">{job.title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{job.company}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div
              className={cn(
                'text-2xl font-bold',
                matchScoreColor
              )}
            >
              {job.matchScore}%
            </div>
            <Badge className={sourceColors[job.source]}>
              {job.source.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Location and Salary */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {job.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
          )}
          {job.salary && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{job.salary}</span>
            </div>
          )}
        </div>

        {/* Description Preview/Full */}
        <div className="space-y-2">
          <p className={cn('text-sm', !isExpanded && 'line-clamp-2')}>
            {job.description}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-auto p-0 text-xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show more
              </>
            )}
          </Button>
        </div>

        {/* External Link */}
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View original posting
          <ExternalLink className="h-3 w-3" />
        </a>

        {/* Status Indicators */}
        {job.applied && (
          <Badge variant="default" className="bg-green-600">
            Applied
          </Badge>
        )}
        {job.skipped && (
          <Badge variant="outline">
            Skipped
          </Badge>
        )}
      </CardContent>

      {/* Actions */}
      {!job.applied && !job.skipped && (onApply || onSkip) && (
        <CardFooter className="flex gap-2 pt-0">
          {onSkip && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onSkip(job.id)}
              disabled={isApplying}
            >
              Skip
            </Button>
          )}
          {onApply && (
            <Button
              className="flex-1"
              onClick={() => onApply(job.id)}
              disabled={isApplying}
            >
              {isApplying ? 'Applying...' : 'Apply Now'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
