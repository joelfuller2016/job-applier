'use client';

import * as React from 'react';
import {
  Building2,
  MapPin,
  DollarSign,
  ExternalLink,
  Star,
  StarOff,
  Send,
  Clock,
  Briefcase,
  Users,
  Zap,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Award,
  Target,
  TrendingUp,
  Calendar,
  Globe,
  X,
  ChevronRight,
  Bookmark,
  Share2,
  Copy,
} from 'lucide-react';
import { cn, formatDate, formatRelativeTime, getMatchScoreColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Job } from '@/types/job';

interface JobDetailModalProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (job: Job) => void;
  onSave: (jobId: string) => void;
  onCompare?: (job: Job) => void;
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
  if (!salary) return 'Not specified';
  const { min, max, currency, period } = salary;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  });

  const periodLabel = period === 'yearly' ? '/year' : period === 'monthly' ? '/month' : '/hour';

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}${periodLabel}`;
  }
  if (min) return `${formatter.format(min)}+${periodLabel}`;
  if (max) return `Up to ${formatter.format(max)}${periodLabel}`;
  return 'Not specified';
}

function MatchScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorClass = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-500', colorClass)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-bold', colorClass)}>{score}%</span>
        <span className="text-xs text-muted-foreground">Match</span>
      </div>
    </div>
  );
}

export function JobDetailModal({
  job,
  open,
  onOpenChange,
  onApply,
  onSave,
  onCompare,
}: JobDetailModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!job) return null;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(job.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="p-6 pb-4">
            <div className="flex gap-4">
              {/* Company Logo */}
              <div className="flex-shrink-0">
                {job.companyLogo ? (
                  <img
                    src={job.companyLogo}
                    alt={job.company}
                    className="h-16 w-16 rounded-xl object-cover border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>

              {/* Job Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold leading-tight">{job.title}</h2>
                    <p className="text-lg text-muted-foreground">{job.company}</p>
                  </div>
                  {job.matchScore !== undefined && (
                    <MatchScoreRing score={job.matchScore} size={80} />
                  )}
                </div>

                {/* Quick Info */}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">{formatSalary(job.salary)}</span>
                    </div>
                  )}
                  <Badge variant="secondary" className={platformColors[job.platform]}>
                    {job.platform.charAt(0).toUpperCase() + job.platform.slice(1)}
                  </Badge>
                  {job.hasEasyApply && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                      <Zap className="h-3 w-3 mr-1" />
                      Easy Apply
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline">{job.experienceLevel}</Badge>
                  <Badge variant="outline">{job.employmentType}</Badge>
                  <Badge variant="outline">{job.workArrangement}</Badge>
                  {job.deadline && (
                    <Badge variant="outline" className="text-orange-600">
                      <Clock className="h-3 w-3 mr-1" />
                      Deadline: {formatDate(job.deadline)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-4">
              {job.applicationId ? (
                <Button disabled className="flex-1 sm:flex-none">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Already Applied
                </Button>
              ) : (
                <Button onClick={() => onApply(job)} className="flex-1 sm:flex-none">
                  <Send className="h-4 w-4 mr-2" />
                  Apply Now
                </Button>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={() => onSave(job.id)}>
                      {job.isSaved ? (
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{job.isSaved ? 'Unsave' : 'Save job'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleCopyLink}>
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{copied ? 'Copied!' : 'Copy link'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" size="icon" onClick={() => window.open(job.url, '_blank')}>
                <ExternalLink className="h-4 w-4" />
              </Button>
              {onCompare && (
                <Button variant="outline" onClick={() => onCompare(job)}>
                  <Target className="h-4 w-4 mr-2" />
                  Compare
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 max-h-[calc(90vh-280px)]">
          <div className="p-6">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="company">Company</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="space-y-6">
                {/* Job Description */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    About This Role
                  </h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                </div>

                {/* Responsibilities */}
                {job.responsibilities && job.responsibilities.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Responsibilities
                    </h3>
                    <ul className="space-y-2">
                      {job.responsibilities.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ChevronRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {job.benefits && job.benefits.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Benefits
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {job.benefits.map((benefit, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="requirements" className="space-y-6">
                {/* Requirements */}
                {job.requirements && job.requirements.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Requirements
                    </h3>
                    <ul className="space-y-2">
                      {job.requirements.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ChevronRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Qualifications */}
                {job.qualifications && job.qualifications.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Qualifications
                    </h3>
                    <ul className="space-y-2">
                      {job.qualifications.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ChevronRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Experience Level Info */}
                <div className="rounded-lg border p-4 bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Experience Level</p>
                      <p className="font-medium capitalize">{job.experienceLevel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Employment Type</p>
                      <p className="font-medium capitalize">{job.employmentType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Work Arrangement</p>
                      <p className="font-medium capitalize">{job.workArrangement}</p>
                    </div>
                    {job.applicantCount && (
                      <div>
                        <p className="text-xs text-muted-foreground">Applicants</p>
                        <p className="font-medium flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {job.applicantCount}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="skills" className="space-y-6">
                {/* Required Skills */}
                {job.skills.required.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.required.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferred Skills */}
                {job.skills.preferred.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-500" />
                      Preferred Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.preferred.map((skill, index) => (
                        <Badge key={index} variant="outline" className="px-3 py-1">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Match Summary */}
                {job.matchScore !== undefined && (
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <h4 className="font-medium mb-3">Your Skill Match</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Required Skills</span>
                          <span className="text-green-600">70% Match</span>
                        </div>
                        <Progress value={70} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Preferred Skills</span>
                          <span className="text-amber-600">50% Match</span>
                        </div>
                        <Progress value={50} className="h-2" />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="company" className="space-y-6">
                {/* Company Info */}
                <div className="flex items-center gap-4">
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt={job.company}
                      className="h-20 w-20 rounded-xl object-cover border"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border">
                      <Building2 className="h-10 w-10 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{job.company}</h3>
                    <p className="text-muted-foreground">Technology Company</p>
                  </div>
                </div>

                {/* Company Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold text-primary">500+</p>
                    <p className="text-xs text-muted-foreground">Employees</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold text-primary">2010</p>
                    <p className="text-xs text-muted-foreground">Founded</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold text-primary">4.2</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-2xl font-bold text-primary">15</p>
                    <p className="text-xs text-muted-foreground">Open Positions</p>
                  </div>
                </div>

                {/* Job Posting Info */}
                <div className="rounded-lg border p-4 bg-muted/30">
                  <h4 className="font-medium mb-3">Job Posting Info</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Posted</p>
                      <p className="font-medium">{formatDate(job.postedAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Discovered</p>
                      <p className="font-medium">{formatRelativeTime(job.discoveredAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Source</p>
                      <p className="font-medium capitalize">{job.platform}</p>
                    </div>
                    {job.deadline && (
                      <div>
                        <p className="text-muted-foreground">Deadline</p>
                        <p className="font-medium text-orange-600">{formatDate(job.deadline)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
