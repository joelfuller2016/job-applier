'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  TrendingUp,
  Users,
  Award,
  Clock
} from 'lucide-react';

interface OverviewStatsProps {
  dateRange: string;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function StatCard({ title, value, change, icon, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-7 w-20 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {change && (
              <p className="text-xs text-muted-foreground">
                {change}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function OverviewStats({ dateRange, isLoading }: OverviewStatsProps) {
  // Mock data - replace with actual API calls
  const stats = {
    totalApplications: 127,
    responseRate: '24.4%',
    interviewRate: '12.6%',
    offerRate: '3.1%',
    avgResponseTime: '4.2 days',
  };

  const changes = {
    totalApplications: '+12% from last period',
    responseRate: '+2.1% from last period',
    interviewRate: '-0.4% from last period',
    offerRate: '+0.8% from last period',
    avgResponseTime: '-0.3 days from last period',
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Applications"
        value={stats.totalApplications}
        change={changes.totalApplications}
        icon={<FileText className="h-4 w-4" />}
        isLoading={isLoading}
      />

      <StatCard
        title="Response Rate"
        value={stats.responseRate}
        change={changes.responseRate}
        icon={<TrendingUp className="h-4 w-4" />}
        isLoading={isLoading}
      />

      <StatCard
        title="Interview Rate"
        value={stats.interviewRate}
        change={changes.interviewRate}
        icon={<Users className="h-4 w-4" />}
        isLoading={isLoading}
      />

      <StatCard
        title="Offer Rate"
        value={stats.offerRate}
        change={changes.offerRate}
        icon={<Award className="h-4 w-4" />}
        isLoading={isLoading}
      />

      <StatCard
        title="Avg Response Time"
        value={stats.avgResponseTime}
        change={changes.avgResponseTime}
        icon={<Clock className="h-4 w-4" />}
        isLoading={isLoading}
      />
    </div>
  );
}
