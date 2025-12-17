'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

interface SuccessBySourceProps {
  dateRange: string;
  isLoading?: boolean;
}

interface SourceData {
  source: string;
  applications: number;
  responses: number;
  interviews: number;
  offers: number;
  responseRate: number;
  color: string;
}

export function SuccessBySource({ dateRange, isLoading }: SuccessBySourceProps) {
  const data: SourceData[] = useMemo(() => {
    // Mock data - replace with actual API calls
    const sources = [
      {
        source: 'LinkedIn',
        applications: 45,
        responses: 14,
        interviews: 6,
        offers: 2,
        color: 'hsl(var(--chart-1))',
      },
      {
        source: 'Indeed',
        applications: 32,
        responses: 8,
        interviews: 3,
        offers: 1,
        color: 'hsl(var(--chart-2))',
      },
      {
        source: 'Exa Search',
        applications: 28,
        responses: 10,
        interviews: 5,
        offers: 1,
        color: 'hsl(var(--chart-3))',
      },
      {
        source: 'Company Site',
        applications: 22,
        responses: 9,
        interviews: 4,
        offers: 0,
        color: 'hsl(var(--chart-4))',
      },
    ];

    return sources.map((source) => ({
      ...source,
      responseRate: Math.round((source.responses / source.applications) * 100),
    }));
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="source"
            className="text-xs"
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            className="text-xs"
            tickLine={false}
            axisLine={false}
            label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as SourceData;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="font-semibold mb-2">{data.source}</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        Applications: <span className="font-medium text-foreground">{data.applications}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Responses: <span className="font-medium text-foreground">{data.responses}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Interviews: <span className="font-medium text-foreground">{data.interviews}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Offers: <span className="font-medium text-foreground">{data.offers}</span>
                      </p>
                      <p className="font-semibold mt-2">
                        Response Rate: {data.responseRate}%
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="applications" name="Applications" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="space-y-2">
        {data.map((source) => (
          <div
            key={source.source}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: source.color }}
              />
              <span className="font-medium">{source.source}</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-muted-foreground">
                {source.applications} apps
              </span>
              <span className="font-semibold">
                {source.responseRate}% response
              </span>
              <span className="text-muted-foreground">
                {source.offers} offers
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
