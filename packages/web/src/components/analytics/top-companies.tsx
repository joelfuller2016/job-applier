'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { isDemoMode } from '@/lib/demo';

interface TopCompaniesProps {
  dateRange: string;
  isLoading?: boolean;
}

interface CompanyData {
  id: string;
  name: string;
  applications: number;
  responses: number;
  interviews: number;
  offers: number;
  responseRate: number;
  interviewConversion: number;
  trend: 'up' | 'down' | 'stable';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function TopCompanies({ dateRange, isLoading }: TopCompaniesProps) {
  const companies: CompanyData[] = useMemo(() => {
    // Demo data - ONLY used when APP_MODE=demo
    // In production, this would come from API calls
    if (!isDemoMode()) {
      return []; // Return empty array in production
    }

    const mockCompanies = [
      {
        id: '1',
        name: 'Google',
        applications: 8,
        responses: 3,
        interviews: 2,
        offers: 1,
        trend: 'up' as const,
      },
      {
        id: '2',
        name: 'Microsoft',
        applications: 7,
        responses: 2,
        interviews: 1,
        offers: 0,
        trend: 'stable' as const,
      },
      {
        id: '3',
        name: 'Amazon',
        applications: 6,
        responses: 2,
        interviews: 1,
        offers: 1,
        trend: 'up' as const,
      },
      {
        id: '4',
        name: 'Meta',
        applications: 5,
        responses: 1,
        interviews: 0,
        offers: 0,
        trend: 'down' as const,
      },
      {
        id: '5',
        name: 'Apple',
        applications: 5,
        responses: 2,
        interviews: 1,
        offers: 0,
        trend: 'stable' as const,
      },
      {
        id: '6',
        name: 'Netflix',
        applications: 4,
        responses: 1,
        interviews: 1,
        offers: 0,
        trend: 'up' as const,
      },
      {
        id: '7',
        name: 'Salesforce',
        applications: 4,
        responses: 2,
        interviews: 1,
        offers: 0,
        trend: 'stable' as const,
      },
      {
        id: '8',
        name: 'Stripe',
        applications: 3,
        responses: 1,
        interviews: 1,
        offers: 1,
        trend: 'up' as const,
      },
    ];

    return mockCompanies.map((company) => ({
      ...company,
      responseRate: Math.round((company.responses / company.applications) * 100),
      interviewConversion: company.responses > 0
        ? Math.round((company.interviews / company.responses) * 100)
        : 0,
    }));
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 rounded-t-lg border-b bg-muted/50 px-4 py-3 text-xs font-semibold text-muted-foreground">
        <div className="col-span-3">Company</div>
        <div className="col-span-2 text-center">Applications</div>
        <div className="col-span-2 text-center">Response Rate</div>
        <div className="col-span-2 text-center">Interview Conv.</div>
        <div className="col-span-2 text-center">Offers</div>
        <div className="col-span-1 text-center">Trend</div>
      </div>

      {/* Table Body */}
      <div className="divide-y">
        {companies.map((company, index) => (
          <div
            key={company.id}
            className="grid grid-cols-12 gap-4 items-center px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            {/* Company Name */}
            <div className="col-span-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(company.name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{company.name}</span>
            </div>

            {/* Applications */}
            <div className="col-span-2 text-center">
              <span className="font-semibold">{company.applications}</span>
            </div>

            {/* Response Rate */}
            <div className="col-span-2 text-center">
              <Badge
                variant={
                  company.responseRate >= 40
                    ? 'default'
                    : company.responseRate >= 20
                    ? 'secondary'
                    : 'outline'
                }
              >
                {company.responseRate}%
              </Badge>
            </div>

            {/* Interview Conversion */}
            <div className="col-span-2 text-center">
              <Badge
                variant={
                  company.interviewConversion >= 50
                    ? 'default'
                    : company.interviewConversion >= 25
                    ? 'secondary'
                    : 'outline'
                }
              >
                {company.interviewConversion}%
              </Badge>
            </div>

            {/* Offers */}
            <div className="col-span-2 text-center">
              <span className="font-semibold text-green-600 dark:text-green-400">
                {company.offers}
              </span>
            </div>

            {/* Trend */}
            <div className="col-span-1 flex justify-center">
              <TrendIcon trend={company.trend} />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 rounded-lg border bg-muted/30 p-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{companies.length}</div>
          <div className="text-xs text-muted-foreground">Companies</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {Math.round(
              companies.reduce((sum, c) => sum + c.responseRate, 0) / companies.length
            )}%
          </div>
          <div className="text-xs text-muted-foreground">Avg Response Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">
            {companies.reduce((sum, c) => sum + c.offers, 0)}
          </div>
          <div className="text-xs text-muted-foreground">Total Offers</div>
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950">
        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
          Focus on companies with high response rates. {companies.filter(c => c.responseRate >= 40).length} companies have 40%+ response rates.
        </p>
      </div>
    </div>
  );
}
