'use client';

import * as React from 'react';
import {
  Briefcase,
  Send,
  TrendingUp,
  Target,
  Clock,
  Star,
  Zap,
  ArrowRight,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/react';
import { EnhancedStatsCard } from '@/components/dashboard/enhanced-stats-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { ActiveHunts } from '@/components/dashboard/active-hunts';
import { AutomationStatus } from '@/components/dashboard/automation-status';
import { RecentJobsWidget } from '@/components/dashboard/recent-jobs-widget';
import { ApplicationPipeline } from '@/components/dashboard/application-pipeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { isDemoMode } from '@/lib/demo';

// Demo data - ONLY used when APP_MODE=demo
const mockRecentJobs = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    matchScore: 92,
    salary: '$150k - $200k',
    hasEasyApply: true,
    isSaved: true,
    discoveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    platform: 'linkedin',
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    matchScore: 85,
    salary: '$120k - $160k',
    hasEasyApply: false,
    isSaved: false,
    discoveredAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    platform: 'company',
  },
  {
    id: '3',
    title: 'React Developer',
    company: 'BigCo Enterprise',
    location: 'New York, NY',
    matchScore: 78,
    salary: '$110k - $160k',
    hasEasyApply: true,
    isSaved: false,
    discoveredAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    platform: 'indeed',
  },
  {
    id: '4',
    title: 'Frontend Architect',
    company: 'Innovation Labs',
    location: 'Seattle, WA',
    matchScore: 95,
    salary: '$180k - $250k',
    hasEasyApply: true,
    isSaved: true,
    discoveredAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    platform: 'linkedin',
  },
  {
    id: '5',
    title: 'Junior Frontend Developer',
    company: 'GrowthCo',
    location: 'Austin, TX',
    matchScore: 45,
    salary: '$70k - $90k',
    hasEasyApply: false,
    isSaved: false,
    discoveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    platform: 'glassdoor',
  },
];

// Mock pipeline data
const mockPipelineStages = [
  { id: 'applied', label: 'Applied', count: 12, icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'screening', label: 'Screening', count: 5, icon: Target, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  { id: 'interview', label: 'Interview', count: 3, icon: Calendar, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  { id: 'offer', label: 'Offer', count: 1, icon: Star, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { id: 'rejected', label: 'Rejected', count: 4, icon: Clock, color: 'text-slate-500', bgColor: 'bg-slate-100 dark:bg-slate-900/30' },
];

export default function DashboardPage() {
  // Fetch dashboard data
  const { data: overview, isLoading } = trpc.dashboard.getOverview.useQuery({});
  const { data: profile } = trpc.profile.getCurrentProfile.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
          </div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = overview?.stats || {
    jobsDiscovered: 156,
    applicationsSent: 25,
    successRate: 24,
    pendingActions: 3,
  };

  const recentActivity = overview?.recentActivity || [];
  const activeHunts = overview?.activeHunts || [];

  // Calculate weekly trend data (mock)
  const weeklyJobsData = [12, 18, 15, 22, 28, 35, 26];
  const weeklyAppsData = [2, 4, 3, 5, 6, 4, 5];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-6 md:p-8">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back{profile?.firstName ? `, ${profile.firstName}` : ''}!
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Here's an overview of your job search progress. You have{' '}
            <span className="font-medium text-foreground">{stats.pendingActions} pending actions</span>{' '}
            that need your attention.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link href="/hunt">
              <Button>
                <Zap className="h-4 w-4 mr-2" />
                Start Job Hunt
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline">
                <Briefcase className="h-4 w-4 mr-2" />
                Browse Jobs
              </Button>
            </Link>
          </div>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-primary/10 rounded-full blur-2xl translate-y-1/2" />
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <EnhancedStatsCard
          title="Jobs Discovered"
          value={stats.jobsDiscovered}
          icon={Briefcase}
          variant="info"
          change={12}
          changeLabel="from last week"
          href="/jobs"
          sparklineData={weeklyJobsData}
        />
        <EnhancedStatsCard
          title="Applications Sent"
          value={stats.applicationsSent}
          icon={Send}
          variant="success"
          change={8}
          changeLabel="from last week"
          href="/applications"
          sparklineData={weeklyAppsData}
        />
        <EnhancedStatsCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={TrendingUp}
          variant={stats.successRate >= 20 ? 'success' : stats.successRate >= 10 ? 'warning' : 'danger'}
          change={stats.successRate >= 20 ? 5 : -2}
          changeLabel="from last week"
          href="/analytics"
        />
        <EnhancedStatsCard
          title="Pending Actions"
          value={stats.pendingActions}
          icon={Clock}
          variant={stats.pendingActions > 0 ? 'warning' : 'default'}
          description={stats.pendingActions > 0 ? 'Needs attention' : 'All caught up!'}
          href="/applications"
        />
      </div>

      {/* Application Pipeline */}
      <ApplicationPipeline
        stages={isDemoMode() ? mockPipelineStages : []}
        totalApplications={25}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Jobs & Activity Row */}
          <div className="grid gap-6 md:grid-cols-2">
            <RecentJobsWidget jobs={isDemoMode() ? mockRecentJobs : []} maxItems={5} />
            <ActivityFeed activities={recentActivity} maxItems={5} />
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Automation Status */}
          <AutomationStatus />

          {/* Active Hunts */}
          <ActiveHunts hunts={activeHunts} />

          {/* Weekly Goal Progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Weekly Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Applications</span>
                  <span className="font-medium">25 / 30</span>
                </div>
                <Progress value={83} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Jobs Reviewed</span>
                  <span className="font-medium">45 / 50</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Profile Updates</span>
                  <span className="font-medium">2 / 3</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
              <Link href="/analytics">
                <Button variant="outline" className="w-full mt-2">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Full Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
