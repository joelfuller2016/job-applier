/**
 * Confirmation Dialog Component
 * Dialog for confirming job application actions
 */

'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DiscoveredJob } from '@/types/hunt';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: DiscoveredJob;
  action: 'apply' | 'skip' | 'applyAll' | 'skipAll';
  jobCount?: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  job,
  action,
  jobCount = 0,
  onConfirm,
  isLoading = false,
}: ConfirmationDialogProps) {
  const getDialogContent = () => {
    switch (action) {
      case 'apply':
        return {
          title: 'Confirm Application',
          description: job
            ? `Are you sure you want to apply to ${job.title} at ${job.company}?`
            : 'Confirm your application',
          confirmText: 'Submit Application',
          confirmVariant: 'default' as const,
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        };
      case 'skip':
        return {
          title: 'Skip Job',
          description: job
            ? `Skip ${job.title} at ${job.company}? You can review this job later.`
            : 'Skip this job',
          confirmText: 'Skip Job',
          confirmVariant: 'outline' as const,
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        };
      case 'applyAll':
        return {
          title: 'Apply to All Jobs',
          description: `Submit applications to all ${jobCount} pending jobs? This will use your saved profile and resume.`,
          confirmText: `Apply to ${jobCount} Jobs`,
          confirmVariant: 'default' as const,
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        };
      case 'skipAll':
        return {
          title: 'Skip All Jobs',
          description: `Skip all ${jobCount} pending jobs? You can review them later from your history.`,
          confirmText: `Skip ${jobCount} Jobs`,
          confirmVariant: 'outline' as const,
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
        };
    }
  };

  const content = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {content.icon}
            <DialogTitle>{content.title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">{content.description}</DialogDescription>
        </DialogHeader>

        {/* Job Details for Single Job Actions */}
        {job && (action === 'apply' || action === 'skip') && (
          <div className="space-y-3 py-4 border-y">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-semibold">{job.title}</h4>
                <p className="text-sm text-muted-foreground">{job.company}</p>
                {job.location && (
                  <p className="text-sm text-muted-foreground">{job.location}</p>
                )}
              </div>
              <Badge
                variant={job.matchScore >= 80 ? 'default' : 'outline'}
                className="shrink-0"
              >
                {job.matchScore}% Match
              </Badge>
            </div>
          </div>
        )}

        {/* Warnings */}
        {action === 'applyAll' && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Make sure your profile and resume are up to date before applying to multiple
              jobs.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={content.confirmVariant}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : content.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
