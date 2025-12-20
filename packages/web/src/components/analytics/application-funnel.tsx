'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts';
import { isDemoMode } from '@/lib/demo';

interface ApplicationFunnelProps {
  dateRange: string;
  isLoading?: boolean;
}

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

export function ApplicationFunnel({ dateRange, isLoading }: ApplicationFunnelProps) {
  const data: FunnelStage[] = useMemo(() => {
    // Demo data - ONLY used when APP_MODE=demo
    // In production, this would come from API calls
    if (!isDemoMode()) {
      return []; // Return empty array in production
    }

    const stages = [
      { stage: 'Applied', count: 127, color: 'hsl(var(--primary))' },
      { stage: 'Screening', count: 45, color: 'hsl(var(--chart-1))' },
      { stage: 'Interview', count: 16, color: 'hsl(var(--chart-2))' },
      { stage: 'Offer', count: 4, color: 'hsl(var(--chart-3))' },
      { stage: 'Accepted', count: 2, color: 'hsl(var(--chart-4))' },
    ];

    // Calculate percentages
    const total = stages[0].count;
    return stages.map((stage) => ({
      ...stage,
      percentage: Math.round((stage.count / total) * 100),
    }));
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Empty state for production mode
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        <p>No application data available</p>
      </div>
    );
  }

  const CustomLabel = (props: any) => {
    const { x, y, width, value, percentage } = props;
    return (
      <g>
        <text
          x={x + width / 2}
          y={y - 10}
          fill="hsl(var(--foreground))"
          textAnchor="middle"
          className="text-sm font-semibold"
        >
          {value}
        </text>
        <text
          x={x + width / 2}
          y={y + 10}
          fill="hsl(var(--muted-foreground))"
          textAnchor="middle"
          className="text-xs"
        >
          {percentage}%
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 30, right: 30, bottom: 20, left: 100 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="stage"
            axisLine={false}
            tickLine={false}
            className="text-sm"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as FunnelStage;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="font-semibold">{data.stage}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.count} applications ({data.percentage}%)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList
              dataKey="count"
              content={<CustomLabel />}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-4 gap-4 border-t pt-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-chart-1">
            {Math.round((data[1].count / data[0].count) * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">
            Screening Rate
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-chart-2">
            {Math.round((data[2].count / data[0].count) * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">
            Interview Rate
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-chart-3">
            {Math.round((data[3].count / data[0].count) * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">
            Offer Rate
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-chart-4">
            {Math.round((data[4].count / data[0].count) * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">
            Acceptance Rate
          </div>
        </div>
      </div>
    </div>
  );
}
