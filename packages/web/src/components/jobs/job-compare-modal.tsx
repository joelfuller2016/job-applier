'use client';

import * as React from 'react';
import {
  Building2,
  MapPin,
  DollarSign,
  CheckCircle2,
  XCircle,
  Minus,
  X,
  Zap,
  Clock,
} from 'lucide-react';
import { cn, formatDate, getMatchScoreColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Job } from '@/types/job';

interface JobCompareModalProps {
  jobs: Job[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveJob: (jobId: string) => void;
  onApply: (job: Job) => void;
}

function formatSalary(salary: Job['salary']): string {
  if (!salary) return 'Not specified';
  const { min, max, currency, period } = salary;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  });

  const periodLabel = period === 'yearly' ? '/yr' : period === 'monthly' ? '/mo' : '/hr';

  if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}${periodLabel}`;
  if (min) return `${formatter.format(min)}+${periodLabel}`;
  if (max) return `Up to ${formatter.format(max)}${periodLabel}`;
  return 'Not specified';
}

function CompareValue({ value, best }: { value: string | number | undefined; best?: boolean }) {
  return (
    <div className={cn(
      'text-center p-2 rounded-md',
      best && 'bg-green-50 dark:bg-green-900/20'
    )}>
      {value || <span className="text-muted-foreground">--</span>}
    </div>
  );
}

function CompareBoolean({ value, positive = true }: { value: boolean; positive?: boolean }) {
  const isGood = positive ? value : !value;
  return (
    <div className={cn(
      'flex justify-center p-2 rounded-md',
      isGood && 'bg-green-50 dark:bg-green-900/20'
    )}>
      {value ? (
        <CheckCircle2 className={cn('h-5 w-5', positive ? 'text-green-500' : 'text-red-500')} />
      ) : (
        <XCircle className={cn('h-5 w-5', positive ? 'text-muted-foreground' : 'text-green-500')} />
      )}
    </div>
  );
}

export function JobCompareModal({
  jobs,
  open,
  onOpenChange,
  onRemoveJob,
  onApply,
}: JobCompareModalProps) {
  // Find best values for highlighting
  const bestMatchScore = Math.max(...jobs.map(j => j.matchScore || 0));
  const bestMinSalary = Math.max(...jobs.map(j => j.salary?.min || 0));

  // Collect all skills for comparison
  const allRequiredSkills = Array.from(new Set(jobs.flatMap(j => j.skills.required)));
  const allPreferredSkills = Array.from(new Set(jobs.flatMap(j => j.skills.preferred)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Compare Jobs ({jobs.length})</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-4">
            {jobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No jobs selected for comparison</p>
                <p className="text-sm">Select jobs from the list to compare them</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left p-3 bg-muted/50 font-medium w-40 sticky left-0 z-10">
                        Criteria
                      </th>
                      {jobs.map((job) => (
                        <th key={job.id} className="p-3 bg-muted/50 min-w-[200px]">
                          <div className="space-y-2">
                            {/* Company Logo & Name */}
                            <div className="flex items-center justify-center gap-2">
                              {job.companyLogo ? (
                                <img
                                  src={job.companyLogo}
                                  alt={job.company}
                                  className="h-8 w-8 rounded object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-primary" />
                                </div>
                              )}
                              <div className="text-left">
                                <p className="font-semibold text-sm truncate max-w-[150px]">{job.title}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{job.company}</p>
                              </div>
                            </div>
                            {/* Remove Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7"
                              onClick={() => onRemoveJob(job.id)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Match Score */}
                    <tr className="border-b">
                      <td className="p-3 font-medium sticky left-0 bg-background">Match Score</td>
                      {jobs.map((job) => (
                        <td key={job.id} className="p-3">
                          <div className={cn(
                            'text-center p-2 rounded-md',
                            job.matchScore === bestMatchScore && bestMatchScore > 0 && 'bg-green-50 dark:bg-green-900/20'
                          )}>
                            {job.matchScore !== undefined ? (
                              <span className={cn('text-xl font-bold', getMatchScoreColor(job.matchScore))}>
                                {job.matchScore}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Salary */}
                    <tr className="border-b">
                      <td className="p-3 font-medium sticky left-0 bg-background">Salary</td>
                      {jobs.map((job) => (
                        <td key={job.id} className="p-3">
                          <div className={cn(
                            'text-center p-2 rounded-md',
                            job.salary?.min === bestMinSalary && bestMinSalary > 0 && 'bg-green-50 dark:bg-green-900/20'
                          )}>
                            {job.salary ? (
                              <span className="font-medium">{formatSalary(job.salary)}</span>
                            ) : (
                              <span className="text-muted-foreground">Not specified</span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Location */}
                    <tr className="border-b">
                      <td className="p-3 font-medium sticky left-0 bg-background">Location</td>
                      {jobs.map((job) => (
                        <td key={job.id} className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {job.location}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Work Arrangement */}
                    <tr className="border-b">
                      <td className="p-3 font-medium sticky left-0 bg-background">Work Type</td>
                      {jobs.map((job) => (
                        <td key={job.id} className="p-3 text-center">
                          <Badge variant="outline" className="capitalize">
                            {job.workArrangement}
                          </Badge>
                        </td>
                      ))}
                    </tr>

                    {/* Experience Level */}
                    <tr className="border-b">
                      <td className="p-3 font-medium sticky left-0 bg-background">Experience</td>
                      {jobs.map((job) => (
                        <td key={job.id} className="p-3 text-center">
                          <Badge variant="outline" className="capitalize">
                            {job.experienceLevel}
                          </Badge>
                        </td>
                      ))}
                    </tr>

                    {/* Employment Type */}
                    <tr className="border-b">
                      <td className="p-3 font-medium sticky left-0 bg-background">Employment</td>
                      {jobs.map((job) => (
                        <td key={job.id} className="p-3 text-center">
                          <Badge variant="outline" className="capitalize">
                            {job.employmentType}
                          </Badge>
                        </td>
                      ))}
                    </tr>

                    {/* Platform */}
                    <tr className="border-b">
                      <td className="p-3 font-medium sticky left-0 bg-background">Platform</td>
                      {jobs.map((job) => (
                        <td key={job.id} className="p-3 text-center">
                          <Badge variant="secondary" className="capitalize">
                            {job.platform}
                          </Badge>
                        </td>
                      ))}
                    </tr>

                    {/* Easy Apply */}
                    <tr className="border-b">
                      <td className="p-3 font-medium sticky left-0 bg-background">Easy Apply</td>
                      {jobs.map((job) => (
                        <td key={job.id} className="p-3">
                          <CompareBoolean value={job.hasEasyApply} />
                        </td>
                      ))}
                    </tr>

                    {/* Posted Date */}
                    <tr className="border-b">
                      <td className="p-3 font-medium sticky left-0 bg-background">Posted</td>
                      {jobs.map((job) => (
                        <td key={job.id} className="p-3 text-center text-sm">
                          {formatDate(job.postedAt)}
                        </td>
                      ))}
                    </tr>

                    {/* Required Skills Header */}
                    <tr className="border-b bg-muted/30">
                      <td colSpan={jobs.length + 1} className="p-3 font-medium">
                        Required Skills
                      </td>
                    </tr>

                    {/* Required Skills */}
                    {allRequiredSkills.slice(0, 10).map((skill) => (
                      <tr key={skill} className="border-b">
                        <td className="p-2 text-sm sticky left-0 bg-background">{skill}</td>
                        {jobs.map((job) => (
                          <td key={job.id} className="p-2">
                            <CompareBoolean value={job.skills.required.includes(skill)} />
                          </td>
                        ))}
                      </tr>
                    ))}

                    {/* Apply Actions */}
                    <tr>
                      <td className="p-3 font-medium sticky left-0 bg-background">Action</td>
                      {jobs.map((job) => (
                        <td key={job.id} className="p-3 text-center">
                          {job.applicationId ? (
                            <Badge className="bg-green-100 text-green-700">Applied</Badge>
                          ) : (
                            <Button size="sm" onClick={() => onApply(job)}>
                              Apply Now
                            </Button>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
