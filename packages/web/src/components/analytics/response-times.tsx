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
  Cell,
} from 'recharts';

interface ResponseTimesProps {
  dateRange: string;
  isLoading?: boolean;
}

interface ResponseTimeData {
  stage: string;
  avgDays: number;
  minDays: number;
  maxDays: number;
  color: string;
}

export function ResponseTimes({ dateRange, isLoading }: ResponseTimesProps) {
  const data: ResponseTimeData[] = useMemo(() => {
    // Mock data - replace with actual API calls
    return [
      {
        stage: 'Initial Response',
        avgDays: 4.2,
        minDays: 1,
        maxDays: 14,
        color: 'hsl(var(--chart-1))',
      },
      {
        stage: 'Screening',
        avgDays: 6.5,
        minDays: 2,
        maxDays: 21,
        color: 'hsl(var(--chart-2))',
      },
      {
        stage: 'Interview Invite',
        avgDays: 8.3,
        minDays: 3,
        maxDays: 28,
        color: 'hsl(var(--chart-3))',
      },
      {
        stage: 'Final Decision',
        avgDays: 12.7,
        minDays: 5,
        maxDays: 42,
        color: 'hsl(var(--chart-4))',
      },
    ];
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
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="stage"
            className="text-xs"
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis
            className="text-xs"
            tickLine={false}
            axisLine={false}
            label={{ value: 'Days', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as ResponseTimeData;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="font-semibold mb-2">{data.stage}</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        Average: <span className="font-medium text-foreground">{data.avgDays} days</span>
                      </p>
                      <p className="text-muted-foreground">
                        Fastest: <span className="font-medium text-foreground">{data.minDays} days</span>
                      </p>
                      <p className="text-muted-foreground">
                        Slowest: <span className="font-medium text-foreground">{data.maxDays} days</span>
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="avgDays" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="space-y-2">
        {data.map((stage) => (
          <div
            key={stage.stage}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span className="font-medium text-sm">{stage.stage}</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <div className="text-muted-foreground">Avg</div>
                <div className="font-semibold">{stage.avgDays}d</div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground">Range</div>
                <div className="font-semibold">{stage.minDays}-{stage.maxDays}d</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
          Pro Tip: Companies that respond within 3 days have a 2x higher interview rate.
          Follow up if you haven't heard back within a week.
        </p>
      </div>
    </div>
  );
}
