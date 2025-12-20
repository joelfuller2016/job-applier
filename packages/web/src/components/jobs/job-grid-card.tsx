'use client';

import * as React from 'react';
import {
  Building2,
  MapPin,
  DollarSign,
  Star,
  StarOff,
  Zap,
  Clock,
  MoreHorizontal,
  Eye,
  Send,
  ExternalLink,
  EyeOff,
} from 'lucide-react';
import { cn, formatRelativeTime, getMatchScoreColor } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Job } from '@/types/job';

interface JobGridCardProps {
  job: Job;
  onView: (job: Job) => void;
  onApply: (job: Job) => void;
  onSave: (jobId: string) => void;
  onHide: (jobId: string) => void;
  isSelected?: boolean;
  onSelect?: (jobId: string, selected: boolean) => void;
}

const platformColors: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  indeed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  glassdoor: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  ziprecruiter: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  company: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300',
};

function formatSalary(salary: Job['salary']): string {
  if (!salary) return '';
  const { min, max, currency } = salary;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
    notation: 'compact',
  });

  if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
  if (min) return `${formatter.format(min)}+`;
  if (max) return `Up to ${formatter.format(max)}`;
  return '';
}

export function JobGridCard({
  job,
  onView,
  onApply,
  onSave,
  onHide,
  isSelected,
  onSelect,
}: JobGridCardProps) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer',
        isSelected && 'ring-2 ring-primary',
        job.isHidden && 'opacity-50',
        job.applicationId && 'border-l-4 border-l-green-500'
      )}
      onClick={() => onView(job)}
    >
      {/* Match Score Badge */}
      {job.matchScore !== undefined && (
        <div className={cn(
          'absolute top-3 right-3 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm',
          job.matchScore >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
          job.matchScore >= 60 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        )}>
          {job.matchScore}%
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Company Logo */}
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.company}
              className="h-12 w-12 rounded-lg object-cover border"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0 pr-10">
            <h3 className="font-semibold truncate">{job.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{job.company}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{job.location}</span>
        </div>

        {/* Salary */}
        {job.salary && (
          <div className="flex items-center gap-1.5 text-sm">
            <DollarSign className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="font-medium">{formatSalary(job.salary)}</span>
          </div>
        )}

        {/* Posted Time */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>{formatRelativeTime(job.postedAt)}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className={cn('text-xs', platformColors[job.platform])}>
            {job.platform}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {job.experienceLevel}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {job.workArrangement}
          </Badge>
          {job.hasEasyApply && (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <Zap className="h-3 w-3 mr-1" />
              Easy
            </Badge>
          )}
        </div>

        {/* Applied Badge */}
        {job.applicationId && (
          <Badge className="w-full justify-center bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
            Applied
          </Badge>
        )}
      </CardContent>

      <CardFooter className="pt-0 gap-2" onClick={(e) => e.stopPropagation()}>
        {!job.applicationId ? (
          <Button size="sm" className="flex-1" onClick={() => onApply(job)}>
            <Send className="h-3.5 w-3.5 mr-1" />
            Apply
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onView(job)}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSave(job.id)}
        >
          {job.isSaved ? (
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
          ) : (
            <StarOff className="h-3.5 w-3.5" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(job)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(job.url, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Original
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onHide(job.id)}>
              {job.isHidden ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Unhide
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
