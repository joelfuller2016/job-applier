/**
 * Job Results Component
 * Grid/list view of discovered jobs with filtering and sorting
 */

'use client';

import { useState } from 'react';
import { Grid3x3, List, ArrowUpDown, CheckSquare, XSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { JobCard } from './job-card';
import type { DiscoveredJob } from '@/types/hunt';

interface JobResultsProps {
  jobs: DiscoveredJob[];
  onApply?: (jobId: string) => void;
  onSkip?: (jobId: string) => void;
  onApplyAll?: () => void;
  onSkipAll?: () => void;
  isApplying?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'matchScore' | 'date' | 'company';
type FilterSource = 'all' | 'exa' | 'linkedin' | 'company';

export function JobResults({
  jobs,
  onApply,
  onSkip,
  onApplyAll,
  onSkipAll,
  isApplying = false,
}: JobResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('matchScore');
  const [filterSource, setFilterSource] = useState<FilterSource>('all');

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    if (filterSource === 'all') return true;
    return job.source === filterSource;
  });

  // Sort jobs
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'matchScore':
        return b.matchScore - a.matchScore;
      case 'date':
        return new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime();
      case 'company':
        return a.company.localeCompare(b.company);
      default:
        return 0;
    }
  });

  // Statistics
  const stats = {
    total: jobs.length,
    matched: jobs.filter((j) => j.matchScore >= 70).length,
    applied: jobs.filter((j) => j.applied).length,
    skipped: jobs.filter((j) => j.skipped).length,
    pending: jobs.filter((j) => !j.applied && !j.skipped).length,
  };

  const sourceCounts = {
    exa: jobs.filter((j) => j.source === 'exa').length,
    linkedin: jobs.filter((j) => j.source === 'linkedin').length,
    company: jobs.filter((j) => j.source === 'company').length,
  };

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Discovered Jobs
                <Badge variant="outline">{sortedJobs.length}</Badge>
              </CardTitle>
              <div className="flex gap-2 mt-2 text-sm text-muted-foreground">
                <span>{stats.matched} high matches</span>
                <span>•</span>
                <span>{stats.pending} pending</span>
              </div>
            </div>

            <div className="flex gap-2">
              {/* View Mode Toggle */}
              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-2">
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <div className="flex rounded-md border">
                <Button
                  variant={sortBy === 'matchScore' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('matchScore')}
                  className="rounded-r-none text-xs"
                >
                  Match Score
                </Button>
                <Button
                  variant={sortBy === 'date' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('date')}
                  className="rounded-none text-xs"
                >
                  Date
                </Button>
                <Button
                  variant={sortBy === 'company' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('company')}
                  className="rounded-l-none text-xs"
                >
                  Company
                </Button>
              </div>
            </div>

            {/* Filter by Source */}
            <div className="flex gap-1">
              <Button
                variant={filterSource === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSource('all')}
              >
                All ({jobs.length})
              </Button>
              <Button
                variant={filterSource === 'exa' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSource('exa')}
              >
                Exa ({sourceCounts.exa})
              </Button>
              <Button
                variant={filterSource === 'linkedin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSource('linkedin')}
              >
                LinkedIn ({sourceCounts.linkedin})
              </Button>
              <Button
                variant={filterSource === 'company' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSource('company')}
              >
                Company ({sourceCounts.company})
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {stats.pending > 0 && (onApplyAll || onSkipAll) && (
            <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground flex-1">
                {stats.pending} pending jobs
              </span>
              {onSkipAll && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSkipAll}
                  disabled={isApplying}
                >
                  <XSquare className="h-4 w-4 mr-1" />
                  Skip All
                </Button>
              )}
              {onApplyAll && (
                <Button size="sm" onClick={onApplyAll} disabled={isApplying}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Apply to All
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jobs Grid/List */}
      {sortedJobs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            No jobs found matching your criteria. Try adjusting your filters.
          </p>
        </Card>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'flex flex-col gap-4'
          )}
        >
          {sortedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={onApply}
              onSkip={onSkip}
              isApplying={isApplying}
            />
          ))}
        </div>
      )}
    </div>
  );
}
