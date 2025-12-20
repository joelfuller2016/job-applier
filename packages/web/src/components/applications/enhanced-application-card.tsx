'use client';

import * as React from 'react';
import {
  Building2,
  MapPin,
  DollarSign,
  MoreVertical,
  Eye,
  Trash2,
  Clock,
  MessageSquare,
  Calendar,
  ChevronRight,
  Bell,
  CheckCircle2,
  AlertCircle,
  Star,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { cn, formatRelativeTime, getInitials, getMatchScoreColor } from '@/lib/utils';
import type { Application, ApplicationStatus } from '@/types/application';

interface EnhancedApplicationCardProps {
  application: Application;
  onView: (application: Application) => void;
  onDelete?: (id: string) => void;
  onAddNote?: (id: string) => void;
  onScheduleFollowUp?: (id: string) => void;
  isDragging?: boolean;
  compact?: boolean;
}

const statusConfig: Record<ApplicationStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
  progress: number;
}> = {
  applied: {
    label: 'Applied',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: CheckCircle2,
    progress: 20,
  },
  screening: {
    label: 'Screening',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: Clock,
    progress: 40,
  },
  interview: {
    label: 'Interview',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: Calendar,
    progress: 70,
  },
  offer: {
    label: 'Offer',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: Star,
    progress: 100,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-slate-500 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-900/30',
    icon: AlertCircle,
    progress: 0,
  },
};

export function EnhancedApplicationCard({
  application,
  onView,
  onDelete,
  onAddNote,
  onScheduleFollowUp,
  isDragging = false,
  compact = false,
}: EnhancedApplicationCardProps) {
  const matchScoreColor = getMatchScoreColor(application.matchScore);
  const status = statusConfig[application.status];
  const StatusIcon = status.icon;

  const hasNotes = application.notes && application.notes.length > 0;
  const hasNextSteps = !!application.nextSteps;
  const daysSinceApplied = Math.floor(
    (Date.now() - new Date(application.appliedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card
      className={cn(
        'group relative overflow-hidden cursor-pointer transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-0.5',
        'border-l-4',
        isDragging && 'opacity-70 rotate-1 scale-105 shadow-xl',
        application.status === 'applied' && 'border-l-blue-500',
        application.status === 'screening' && 'border-l-amber-500',
        application.status === 'interview' && 'border-l-purple-500',
        application.status === 'offer' && 'border-l-emerald-500',
        application.status === 'rejected' && 'border-l-slate-400'
      )}
      onClick={() => onView(application)}
    >
      {/* Progress Indicator */}
      {application.status !== 'rejected' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted">
          <div
            className={cn(
              'h-full transition-all duration-500',
              application.status === 'applied' && 'bg-blue-500',
              application.status === 'screening' && 'bg-amber-500',
              application.status === 'interview' && 'bg-purple-500',
              application.status === 'offer' && 'bg-emerald-500'
            )}
            style={{ width: `${status.progress}%` }}
          />
        </div>
      )}

      <CardContent className={cn('p-4', compact && 'p-3')}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Company Logo */}
            <div className="relative flex-shrink-0">
              {application.companyLogo ? (
                <img
                  src={application.companyLogo}
                  alt={application.company}
                  className="h-11 w-11 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              )}
              {/* Match Score Ring */}
              <div className={cn(
                'absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-background',
                application.matchScore >= 80 ? 'bg-green-500 text-white' :
                application.matchScore >= 60 ? 'bg-amber-500 text-white' :
                'bg-red-500 text-white'
              )}>
                {application.matchScore}
              </div>
            </div>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {application.jobTitle}
              </h3>
              <p className="text-sm text-muted-foreground truncate">{application.company}</p>

              {/* Quick Info Row */}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {application.location && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {application.location}
                  </span>
                )}
                {application.salary && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    {application.salary}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Quick Action Buttons */}
            <TooltipProvider>
              {onAddNote && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onAddNote(application.id)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add Note</TooltipContent>
                </Tooltip>
              )}
              {onScheduleFollowUp && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onScheduleFollowUp(application.id)}
                    >
                      <Bell className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Schedule Follow-up</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>

            {/* More Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(application)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {onAddNote && (
                  <DropdownMenuItem onClick={() => onAddNote(application.id)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Add Note
                  </DropdownMenuItem>
                )}
                {onScheduleFollowUp && (
                  <DropdownMenuItem onClick={() => onScheduleFollowUp(application.id)}>
                    <Bell className="mr-2 h-4 w-4" />
                    Schedule Follow-up
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(application.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status & Timeline */}
        <div className="flex items-center justify-between pt-3 border-t">
          {/* Status Badge */}
          <Badge
            variant="secondary"
            className={cn('gap-1', status.bgColor, status.color)}
          >
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>

          {/* Meta Info */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {/* Notes Indicator */}
            {hasNotes && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {application.notes.length}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{application.notes.length} note(s)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Days Counter */}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {daysSinceApplied}d ago
            </span>
          </div>
        </div>

        {/* Next Steps (if exists) */}
        {hasNextSteps && !compact && (
          <div className="mt-3 p-2 rounded-md bg-muted/50 text-xs">
            <span className="font-medium text-muted-foreground">Next: </span>
            <span className="text-foreground">{application.nextSteps}</span>
          </div>
        )}

        {/* Hover Arrow Indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 translate-x-2">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
