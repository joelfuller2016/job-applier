'use client';

import * as React from 'react';
import {
  Building2,
  MapPin,
  DollarSign,
  ExternalLink,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Send,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Bookmark,
  Clock,
  Briefcase,
  Users,
  Zap,
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime, getMatchScoreColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Job, JobSort, JobSortField } from '@/types/job';

interface JobDataTableProps {
  jobs: Job[];
  selectedJobs: string[];
  onSelectJob: (jobId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onViewJob: (job: Job) => void;
  onApplyJob: (job: Job) => void;
  onSaveJob: (jobId: string) => void;
  onHideJob: (jobId: string) => void;
  sort: JobSort;
  onSortChange: (sort: JobSort) => void;
}

const platformColors: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  indeed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  glassdoor: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  ziprecruiter: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  company: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300',
};

const workArrangementColors: Record<string, string> = {
  remote: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  hybrid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  onsite: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300',
};

function formatSalary(salary: Job['salary']): string {
  if (!salary) return 'Not specified';
  const { min, max, currency, period } = salary;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}/${period === 'yearly' ? 'yr' : period === 'monthly' ? 'mo' : 'hr'}`;
  }
  if (min) return `${formatter.format(min)}+/${period === 'yearly' ? 'yr' : period === 'monthly' ? 'mo' : 'hr'}`;
  if (max) return `Up to ${formatter.format(max)}/${period === 'yearly' ? 'yr' : period === 'monthly' ? 'mo' : 'hr'}`;
  return 'Not specified';
}

export function JobDataTable({
  jobs,
  selectedJobs,
  onSelectJob,
  onSelectAll,
  onViewJob,
  onApplyJob,
  onSaveJob,
  onHideJob,
  sort,
  onSortChange,
}: JobDataTableProps) {
  const allSelected = jobs.length > 0 && selectedJobs.length === jobs.length;
  const someSelected = selectedJobs.length > 0 && selectedJobs.length < jobs.length;

  const handleSortClick = (field: JobSortField) => {
    if (sort.field === field) {
      onSortChange({ field, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortChange({ field, direction: 'desc' });
    }
  };

  const SortHeader = ({ field, children }: { field: JobSortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSortClick(field)}
      className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
      {sort.field === field && (
        sort.direction === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      )}
    </button>
  );

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <ScrollArea className="w-full">
        <div className="min-w-[900px]">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_2fr_1fr_1fr_100px_100px_80px] gap-4 items-center px-4 py-3 bg-muted/50 border-b text-sm">
            <div>
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = someSelected;
                  }
                }}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
                aria-label="Select all jobs"
              />
            </div>
            <SortHeader field="title">Job Title</SortHeader>
            <SortHeader field="company">Company</SortHeader>
            <div className="font-medium text-muted-foreground">Location</div>
            <SortHeader field="salary">Salary</SortHeader>
            <SortHeader field="matchScore">Match</SortHeader>
            <div className="font-medium text-muted-foreground text-center">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Briefcase className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No jobs found</p>
                <p className="text-sm">Try adjusting your filters or search query</p>
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className={cn(
                    'grid grid-cols-[40px_2fr_1fr_1fr_100px_100px_80px] gap-4 items-center px-4 py-4 hover:bg-muted/30 transition-colors cursor-pointer group',
                    selectedJobs.includes(job.id) && 'bg-primary/5',
                    job.isHidden && 'opacity-50',
                    job.applicationId && 'border-l-4 border-l-green-500'
                  )}
                  onClick={() => onViewJob(job)}
                >
                  {/* Checkbox */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedJobs.includes(job.id)}
                      onCheckedChange={(checked) => onSelectJob(job.id, !!checked)}
                      aria-label={`Select ${job.title}`}
                    />
                  </div>

                  {/* Job Title & Info */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{job.title}</h3>
                      {job.hasEasyApply && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent>Easy Apply Available</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {job.isSaved && (
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className={cn('text-xs', platformColors[job.platform])}>
                        {job.platform.charAt(0).toUpperCase() + job.platform.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)}
                      </Badge>
                      <Badge variant="outline" className={cn('text-xs', workArrangementColors[job.workArrangement])}>
                        {job.workArrangement.charAt(0).toUpperCase() + job.workArrangement.slice(1)}
                      </Badge>
                      {job.applicationId && (
                        <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                          Applied
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Company */}
                  <div className="flex items-center gap-2 min-w-0">
                    {job.companyLogo ? (
                      <img
                        src={job.companyLogo}
                        alt={job.company}
                        className="h-8 w-8 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <span className="font-medium truncate">{job.company}</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </div>

                  {/* Salary */}
                  <div className="text-sm">
                    {job.salary ? (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-green-600" />
                        <span className="font-medium">{formatSalary(job.salary)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </div>

                  {/* Match Score */}
                  <div className="flex items-center justify-center">
                    {job.matchScore !== undefined ? (
                      <div className={cn(
                        'flex items-center justify-center w-14 h-10 rounded-lg font-bold text-lg',
                        job.matchScore >= 80 ? 'bg-green-100 dark:bg-green-900/30' :
                        job.matchScore >= 60 ? 'bg-amber-100 dark:bg-amber-900/30' :
                        'bg-red-100 dark:bg-red-900/30',
                        getMatchScoreColor(job.matchScore)
                      )}>
                        {job.matchScore}%
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">--</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onSaveJob(job.id)}
                          >
                            {job.isSaved ? (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{job.isSaved ? 'Unsave' : 'Save'}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewJob(job)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {!job.applicationId && (
                          <DropdownMenuItem onClick={() => onApplyJob(job)}>
                            <Send className="h-4 w-4 mr-2" />
                            Apply Now
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => window.open(job.url, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Original
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onSaveJob(job.id)}>
                          {job.isSaved ? (
                            <>
                              <StarOff className="h-4 w-4 mr-2" />
                              Remove from Saved
                            </>
                          ) : (
                            <>
                              <Star className="h-4 w-4 mr-2" />
                              Save Job
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onHideJob(job.id)}>
                          {job.isHidden ? (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Unhide Job
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide Job
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
