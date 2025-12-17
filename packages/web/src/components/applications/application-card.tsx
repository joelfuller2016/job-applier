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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime, getInitials, getMatchScoreColor } from '@/lib/utils';
import type { Application } from '@/types/application';

interface ApplicationCardProps {
  application: Application;
  onView: (application: Application) => void;
  onDelete?: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function ApplicationCard({
  application,
  onView,
  onDelete,
  isDragging = false,
  dragHandleProps,
}: ApplicationCardProps) {
  const matchScoreColorClass = getMatchScoreColor(application.matchScore);

  return (
    <Card
      className={`group cursor-pointer transition-all hover:shadow-lg ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
      onClick={() => onView(application)}
      {...dragHandleProps}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Company Logo/Avatar */}
            <Avatar className="h-10 w-10 flex-shrink-0">
              {application.companyLogo && (
                <AvatarImage src={application.companyLogo} alt={application.company} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(application.company)}
              </AvatarFallback>
            </Avatar>

            {/* Job Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                {application.jobTitle}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span className="truncate">{application.company}</span>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(application)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(application.id);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Details */}
        <div className="space-y-2">
          {application.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{application.location}</span>
            </div>
          )}

          {application.salary && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <span>{application.salary}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          {/* Applied Date */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatRelativeTime(application.appliedDate)}</span>
          </div>

          {/* Match Score Badge */}
          <Badge
            variant="outline"
            className={`font-semibold ${matchScoreColorClass}`}
          >
            {application.matchScore}% match
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
