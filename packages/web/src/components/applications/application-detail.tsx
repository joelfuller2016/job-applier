'use client';

import * as React from 'react';
import {
  X,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  MessageSquarePlus,
  ExternalLink,
  Clock,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  formatDate,
  formatRelativeTime,
  getInitials,
  getMatchScoreColor,
} from '@/lib/utils';
import type { Application, ApplicationStatus } from '@/types/application';

interface ApplicationDetailProps {
  application: Application;
  onClose: () => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
  onAddNote: (applicationId: string) => void;
}

export function ApplicationDetail({
  application,
  onClose,
  onStatusChange,
  onAddNote,
}: ApplicationDetailProps) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl border-l bg-background shadow-2xl">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b p-6">
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="h-12 w-12">
              {application.companyLogo && (
                <AvatarImage
                  src={application.companyLogo}
                  alt={application.company}
                />
              )}
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(application.company)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">{application.jobTitle}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{application.company}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Key Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Status</div>
                <Select
                  value={application.status}
                  onValueChange={(value) =>
                    onStatusChange(application.id, value as ApplicationStatus)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Match Score</div>
                <Badge
                  variant="outline"
                  className={`text-base font-semibold ${getMatchScoreColor(
                    application.matchScore
                  )}`}
                >
                  {application.matchScore}% match
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Applied Date</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(application.appliedDate)}</span>
                </div>
              </div>

              {application.location && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{application.location}</span>
                  </div>
                </div>
              )}

              {application.salary && (
                <div className="space-y-1 col-span-2">
                  <div className="text-sm text-muted-foreground">Salary</div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>{application.salary}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Job Description */}
            {application.description && (
              <>
                <div>
                  <h3 className="font-semibold mb-3">Job Description</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {application.description}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {/* Attachments */}
            <div>
              <h3 className="font-semibold mb-3">Attachments</h3>
              <div className="space-y-2">
                {application.resumeUrl && (
                  <a
                    href={application.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="flex-1 text-sm">Resume</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                {application.coverLetterUrl && (
                  <a
                    href={application.coverLetterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="flex-1 text-sm">Cover Letter</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                {!application.resumeUrl && !application.coverLetterUrl && (
                  <p className="text-sm text-muted-foreground">No attachments</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Timeline */}
            <div>
              <h3 className="font-semibold mb-3">Timeline</h3>
              <div className="space-y-4">
                {application.timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-primary p-1">
                        {index === 0 ? (
                          <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                        ) : (
                          <Circle className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      {index < application.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(event.timestamp)}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Notes</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddNote(application.id)}
                >
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
              <div className="space-y-3">
                {application.notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet</p>
                ) : (
                  application.notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-lg border bg-muted/50">
                      <p className="text-sm mb-2">{note.content}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(note.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Next Steps */}
            {application.nextSteps && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Next Steps</h3>
                  <p className="text-sm text-muted-foreground">
                    {application.nextSteps}
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
