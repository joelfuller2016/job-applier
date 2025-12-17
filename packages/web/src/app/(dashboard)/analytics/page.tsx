'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { OverviewStats } from '@/components/analytics/overview-stats';
import { ApplicationFunnel } from '@/components/analytics/application-funnel';
import { ApplicationsOverTime } from '@/components/analytics/applications-over-time';
import { SuccessBySource } from '@/components/analytics/success-by-source';
import { SkillMatchAnalysis } from '@/components/analytics/skill-match-analysis';
import { ResponseTimes } from '@/components/analytics/response-times';
import { TopCompanies } from '@/components/analytics/top-companies';

type DateRange = '7d' | '30d' | '90d' | 'all';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [isLoading, setIsLoading] = useState(false);

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ];

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Track your job application performance and insights
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1 rounded-lg border p-1">
            {dateRangeOptions.map((option) => (
              <Button
                key={option.value}
                variant={dateRange === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange(option.value)}
                className="h-8"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <OverviewStats dateRange={dateRange} isLoading={isLoading} />

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Application Funnel */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Application Funnel</CardTitle>
            <CardDescription>
              Conversion rates at each stage of the application process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationFunnel dateRange={dateRange} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Applications Over Time */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Applications Over Time</CardTitle>
            <CardDescription>
              Track your application volume and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationsOverTime dateRange={dateRange} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Success by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Success by Source</CardTitle>
            <CardDescription>
              Compare success rates across job platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SuccessBySource dateRange={dateRange} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Response Times */}
        <Card>
          <CardHeader>
            <CardTitle>Response Times</CardTitle>
            <CardDescription>
              Average company response times by stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponseTimes dateRange={dateRange} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Skill Match Analysis */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Skill Match Analysis</CardTitle>
            <CardDescription>
              How your skills align with job requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SkillMatchAnalysis dateRange={dateRange} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Companies</CardTitle>
            <CardDescription>
              Your most frequent applications and their success rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopCompanies dateRange={dateRange} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
