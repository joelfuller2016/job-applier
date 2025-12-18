'use client';

import * as React from 'react';
import {
  Briefcase,
  LayoutGrid,
  List,
  TableIcon,
  RefreshCw,
  Download,
  Send,
  Star,
  Trash2,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { JobDataTable } from '@/components/jobs/job-data-table';
import { JobGridCard } from '@/components/jobs/job-grid-card';
import { JobFilters } from '@/components/jobs/job-filters';
import { JobDetailModal } from '@/components/jobs/job-detail-modal';
import { JobCompareModal } from '@/components/jobs/job-compare-modal';
import type { Job, JobFilters as JobFiltersType, JobSort, JobViewMode } from '@/types/job';

// Mock data for demonstration
const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    companyLogo: '',
    location: 'San Francisco, CA',
    workArrangement: 'hybrid',
    salary: { min: 150000, max: 200000, currency: 'USD', period: 'yearly' },
    description: 'We are looking for an experienced Frontend Developer proficient in React, TypeScript, and modern web technologies. You will work on building scalable web applications and lead a small team of developers. This is an exciting opportunity to shape the future of our product.',
    requirements: [
      '5+ years of experience with React and TypeScript',
      'Experience with state management (Redux, Zustand, or similar)',
      'Strong understanding of web performance optimization',
      'Experience with CI/CD pipelines and testing frameworks',
    ],
    responsibilities: [
      'Design and implement new features for our web application',
      'Mentor junior developers and conduct code reviews',
      'Collaborate with product and design teams',
      'Participate in architectural decisions',
    ],
    qualifications: [
      'Bachelor\'s degree in Computer Science or equivalent experience',
      'Strong problem-solving skills',
      'Excellent communication skills',
    ],
    benefits: [
      'Health Insurance',
      '401k Match',
      'Unlimited PTO',
      'Remote Flexibility',
      'Learning Budget',
    ],
    skills: {
      required: ['React', 'TypeScript', 'CSS', 'Git', 'REST APIs'],
      preferred: ['Next.js', 'GraphQL', 'AWS', 'Docker', 'Testing'],
    },
    experienceLevel: 'senior',
    employmentType: 'full-time',
    platform: 'linkedin',
    url: 'https://linkedin.com/jobs/123',
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    discoveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    matchScore: 92,
    hasEasyApply: true,
    isSaved: true,
    isHidden: false,
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    workArrangement: 'remote',
    salary: { min: 120000, max: 160000, currency: 'USD', period: 'yearly' },
    description: 'Join our fast-paced startup and help build the next generation of productivity tools. We value creativity, ownership, and moving fast while maintaining quality.',
    requirements: [
      '3+ years of full-stack development experience',
      'Experience with Node.js and React',
      'Familiarity with cloud services (AWS/GCP)',
    ],
    responsibilities: [
      'Build and maintain full-stack features',
      'Contribute to system architecture',
      'Participate in product planning',
    ],
    benefits: [
      'Equity Package',
      'Health Insurance',
      'Flexible Hours',
    ],
    skills: {
      required: ['JavaScript', 'Node.js', 'React', 'PostgreSQL'],
      preferred: ['TypeScript', 'Docker', 'Kubernetes'],
    },
    experienceLevel: 'mid',
    employmentType: 'full-time',
    platform: 'company',
    url: 'https://startupxyz.com/careers/123',
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    discoveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    matchScore: 85,
    hasEasyApply: false,
    isSaved: false,
    isHidden: false,
  },
  {
    id: '3',
    title: 'React Developer',
    company: 'BigCo Enterprise',
    location: 'New York, NY',
    workArrangement: 'onsite',
    salary: { min: 110000, max: 160000, currency: 'USD', period: 'yearly' },
    description: 'BigCo is looking for a React Developer to join our growing team. You will work on enterprise-grade applications serving millions of users worldwide.',
    requirements: [
      '4+ years of React experience',
      'Experience with large-scale applications',
      'Strong testing skills',
    ],
    benefits: [
      'Premium Health Insurance',
      '401k with 6% match',
      'Annual Bonus',
    ],
    skills: {
      required: ['React', 'JavaScript', 'CSS', 'Jest'],
      preferred: ['TypeScript', 'Redux', 'Cypress'],
    },
    experienceLevel: 'mid',
    employmentType: 'full-time',
    platform: 'indeed',
    url: 'https://indeed.com/jobs/123',
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    discoveredAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    matchScore: 78,
    hasEasyApply: true,
    isSaved: false,
    isHidden: false,
    applicantCount: 145,
  },
  {
    id: '4',
    title: 'Frontend Architect',
    company: 'Innovation Labs',
    location: 'Seattle, WA',
    workArrangement: 'hybrid',
    salary: { min: 180000, max: 250000, currency: 'USD', period: 'yearly' },
    description: 'Lead the frontend architecture for our suite of AI-powered products. This is a senior leadership role with significant impact on our technical direction.',
    requirements: [
      '8+ years of frontend development',
      '3+ years in architecture or tech lead role',
      'Experience with micro-frontends',
    ],
    responsibilities: [
      'Define frontend architecture strategy',
      'Lead technical decisions across teams',
      'Mentor senior engineers',
    ],
    benefits: [
      'Top-tier compensation',
      'Stock options',
      'Sabbatical program',
    ],
    skills: {
      required: ['React', 'TypeScript', 'System Design', 'Leadership'],
      preferred: ['Micro-frontends', 'Performance', 'WebGL'],
    },
    experienceLevel: 'lead',
    employmentType: 'full-time',
    platform: 'linkedin',
    url: 'https://linkedin.com/jobs/456',
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    discoveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    matchScore: 95,
    hasEasyApply: true,
    isSaved: true,
    isHidden: false,
    applicationId: 'app-1',
    applicationStatus: 'interview',
  },
  {
    id: '5',
    title: 'Junior Frontend Developer',
    company: 'GrowthCo',
    location: 'Austin, TX',
    workArrangement: 'hybrid',
    salary: { min: 70000, max: 90000, currency: 'USD', period: 'yearly' },
    description: 'Great opportunity for a junior developer to grow their skills in a supportive environment.',
    requirements: [
      '1+ years of experience',
      'Knowledge of HTML, CSS, JavaScript',
      'Eagerness to learn',
    ],
    skills: {
      required: ['JavaScript', 'HTML', 'CSS'],
      preferred: ['React', 'Git'],
    },
    experienceLevel: 'entry',
    employmentType: 'full-time',
    platform: 'glassdoor',
    url: 'https://glassdoor.com/jobs/123',
    postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    discoveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    matchScore: 45,
    hasEasyApply: false,
    isSaved: false,
    isHidden: false,
  },
  {
    id: '6',
    title: 'Senior Software Engineer',
    company: 'CloudTech Solutions',
    location: 'Denver, CO',
    workArrangement: 'remote',
    salary: { min: 140000, max: 180000, currency: 'USD', period: 'yearly' },
    description: 'Build cloud-native applications at scale.',
    skills: {
      required: ['Go', 'Kubernetes', 'AWS'],
      preferred: ['Terraform', 'React'],
    },
    experienceLevel: 'senior',
    employmentType: 'full-time',
    platform: 'linkedin',
    url: 'https://linkedin.com/jobs/789',
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    discoveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    matchScore: 72,
    hasEasyApply: true,
    isSaved: false,
    isHidden: false,
  },
];

export default function JobsPage() {
  const [jobs, setJobs] = React.useState<Job[]>(mockJobs);
  const [viewMode, setViewMode] = React.useState<JobViewMode>('table');
  const [selectedJobs, setSelectedJobs] = React.useState<string[]>([]);
  const [filters, setFilters] = React.useState<JobFiltersType>({});
  const [sort, setSort] = React.useState<JobSort>({ field: 'matchScore', direction: 'desc' });
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isCompareOpen, setIsCompareOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Filter and sort jobs
  const filteredJobs = React.useMemo(() => {
    let result = [...jobs];

    // Apply filters
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.company.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query)
      );
    }

    if (filters.platforms?.length) {
      result = result.filter((job) => filters.platforms!.includes(job.platform));
    }

    if (filters.workArrangements?.length) {
      result = result.filter((job) => filters.workArrangements!.includes(job.workArrangement));
    }

    if (filters.experienceLevels?.length) {
      result = result.filter((job) => filters.experienceLevels!.includes(job.experienceLevel));
    }

    if (filters.employmentTypes?.length) {
      result = result.filter((job) => filters.employmentTypes!.includes(job.employmentType));
    }

    if (filters.minSalary) {
      result = result.filter((job) => (job.salary?.min || 0) >= filters.minSalary!);
    }

    if (filters.minMatchScore) {
      result = result.filter((job) => (job.matchScore || 0) >= filters.minMatchScore!);
    }

    if (filters.hasEasyApply) {
      result = result.filter((job) => job.hasEasyApply);
    }

    if (filters.showSaved) {
      result = result.filter((job) => job.isSaved);
    }

    if (!filters.showHidden) {
      result = result.filter((job) => !job.isHidden);
    }

    if (!filters.showApplied) {
      result = result.filter((job) => !job.applicationId);
    }

    if (filters.postedWithin && filters.postedWithin !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      switch (filters.postedWithin) {
        case '24h':
          cutoff.setHours(cutoff.getHours() - 24);
          break;
        case '7d':
          cutoff.setDate(cutoff.getDate() - 7);
          break;
        case '14d':
          cutoff.setDate(cutoff.getDate() - 14);
          break;
        case '30d':
          cutoff.setDate(cutoff.getDate() - 30);
          break;
      }
      result = result.filter((job) => new Date(job.postedAt) >= cutoff);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sort.field) {
        case 'matchScore':
          aVal = a.matchScore || 0;
          bVal = b.matchScore || 0;
          break;
        case 'salary':
          aVal = a.salary?.min || 0;
          bVal = b.salary?.min || 0;
          break;
        case 'postedAt':
          aVal = new Date(a.postedAt).getTime();
          bVal = new Date(b.postedAt).getTime();
          break;
        case 'company':
          aVal = a.company.toLowerCase();
          bVal = b.company.toLowerCase();
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
      }

      if (typeof aVal === 'string') {
        return sort.direction === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sort.direction === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
    });

    return result;
  }, [jobs, filters, sort]);

  const handleSelectJob = (jobId: string, selected: boolean) => {
    setSelectedJobs((prev) =>
      selected ? [...prev, jobId] : prev.filter((id) => id !== jobId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedJobs(selected ? filteredJobs.map((job) => job.id) : []);
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  const handleApplyJob = (job: Job) => {
    // Mock apply - would trigger actual application flow
    alert(`Apply to ${job.title} at ${job.company}`);
  };

  const handleSaveJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, isSaved: !job.isSaved } : job
      )
    );
  };

  const handleHideJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, isHidden: !job.isHidden } : job
      )
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    const csvContent = [
      ['Title', 'Company', 'Location', 'Salary', 'Match Score', 'Platform', 'Posted'].join(','),
      ...filteredJobs.map((job) =>
        [
          `"${job.title}"`,
          `"${job.company}"`,
          `"${job.location}"`,
          job.salary ? `"${job.salary.min}-${job.salary.max}"` : '""',
          job.matchScore || '',
          job.platform,
          new Date(job.postedAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleBulkApply = () => {
    const selectedJobsList = jobs.filter((job) => selectedJobs.includes(job.id) && !job.applicationId);
    if (selectedJobsList.length > 0) {
      alert(`Apply to ${selectedJobsList.length} jobs`);
    }
  };

  const handleCompare = () => {
    setIsCompareOpen(true);
  };

  const compareJobs = jobs.filter((job) => selectedJobs.includes(job.id));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Jobs</h1>
          </div>
          <p className="text-muted-foreground">
            Discover and manage job opportunities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <JobFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={() => setFilters({})}
        totalJobs={jobs.length}
        filteredCount={filteredJobs.length}
      />

      {/* View Controls & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-y">
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as JobViewMode)}>
            <TabsList>
              <TabsTrigger value="table" className="gap-2">
                <TableIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </TabsTrigger>
              <TabsTrigger value="grid" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Grid</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Selection Info */}
          {selectedJobs.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedJobs.length} selected</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedJobs([])}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedJobs.length > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleBulkApply}>
              <Send className="h-4 w-4 mr-2" />
              Apply ({selectedJobs.filter(id => !jobs.find(j => j.id === id)?.applicationId).length})
            </Button>
            <Button size="sm" variant="outline" onClick={handleCompare} disabled={selectedJobs.length < 2}>
              <Scale className="h-4 w-4 mr-2" />
              Compare
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => selectedJobs.forEach((id) => handleSaveJob(id))}
            >
              <Star className="h-4 w-4 mr-2" />
              Save All
            </Button>
          </div>
        )}
      </div>

      {/* Jobs Display */}
      {viewMode === 'table' ? (
        <JobDataTable
          jobs={filteredJobs}
          selectedJobs={selectedJobs}
          onSelectJob={handleSelectJob}
          onSelectAll={handleSelectAll}
          onViewJob={handleViewJob}
          onApplyJob={handleApplyJob}
          onSaveJob={handleSaveJob}
          onHideJob={handleHideJob}
          sort={sort}
          onSortChange={setSort}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <JobGridCard
              key={job.id}
              job={job}
              onView={handleViewJob}
              onApply={handleApplyJob}
              onSave={handleSaveJob}
              onHide={handleHideJob}
              isSelected={selectedJobs.includes(job.id)}
              onSelect={handleSelectJob}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredJobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Briefcase className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-xl font-medium">No jobs found</p>
          <p className="text-sm mt-1">Try adjusting your filters or start a new job hunt</p>
          <Button className="mt-4" onClick={() => setFilters({})}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onApply={handleApplyJob}
        onSave={handleSaveJob}
        onCompare={(job) => {
          if (!selectedJobs.includes(job.id)) {
            setSelectedJobs([...selectedJobs, job.id]);
          }
          setIsDetailOpen(false);
          setIsCompareOpen(true);
        }}
      />

      {/* Compare Modal */}
      <JobCompareModal
        jobs={compareJobs}
        open={isCompareOpen}
        onOpenChange={setIsCompareOpen}
        onRemoveJob={(jobId) => setSelectedJobs((prev) => prev.filter((id) => id !== jobId))}
        onApply={handleApplyJob}
      />
    </div>
  );
}
