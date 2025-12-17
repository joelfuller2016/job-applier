'use client';

import * as React from 'react';
import {
  Briefcase,
  Send,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/react';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { ActiveHunts } from '@/components/dashboard/active-hunts';
import { AutomationStatus } from '@/components/dashboard/automation-status';

export default function DashboardPage() {
  // Fetch dashboard data
  const { data: overview, isLoading } = trpc.dashboard.getOverview.useQuery({});
  const { data: profile } = trpc.profile.getProfile.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = overview?.stats || {
    jobsDiscovered: 0,
    applicationsSent: 0,
    successRate: 0,
    pendingActions: 0,
  };

  const recentActivity = overview?.recentActivity || [];
  const activeHunts = overview?.activeHunts || [];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{profile?.firstName ? `, ${profile.firstName}` : ''}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your job search today.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Jobs Discovered"
          value={stats.jobsDiscovered}
          icon={Briefcase}
          variant="info"
          change={12}
          changeLabel="from last week"
        />
        <StatsCard
          title="Applications Sent"
          value={stats.applicationsSent}
          icon={Send}
          variant="success"
          change={8}
          changeLabel="from last week"
        />
        <StatsCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={TrendingUp}
          variant={stats.successRate >= 20 ? 'success' : stats.successRate >= 10 ? 'warning' : 'default'}
          change={stats.successRate >= 20 ? 5 : -2}
          changeLabel="from last week"
        />
        <StatsCard
          title="Pending Actions"
          value={stats.pendingActions}
          icon={AlertCircle}
          variant={stats.pendingActions > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <QuickActions />
          <ActivityFeed activities={recentActivity} maxItems={5} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <AutomationStatus />
          <ActiveHunts hunts={activeHunts} />
        </div>
      </div>
    </div>
  );
}
