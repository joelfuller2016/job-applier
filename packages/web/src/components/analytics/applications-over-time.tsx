'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { format, subDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

interface ApplicationsOverTimeProps {
  dateRange: string;
  isLoading?: boolean;
}

type Granularity = 'day' | 'week' | 'month';

export function ApplicationsOverTime({ dateRange, isLoading }: ApplicationsOverTimeProps) {
  const [granularity, setGranularity] = useState<Granularity>('day');

  const data = useMemo(() => {
    // Mock data generation based on granularity
    const endDate = new Date();
    const startDate = subDays(endDate, dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90);

    let intervals: Date[];
    let formatString: string;

    switch (granularity) {
      case 'week':
        intervals = eachWeekOfInterval({ start: startDate, end: endDate });
        formatString = 'MMM dd';
        break;
      case 'month':
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        formatString = 'MMM yyyy';
        break;
      default:
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        formatString = 'MMM dd';
    }

    return intervals.map((date) => ({
      date: format(date, formatString),
      applied: Math.floor(Math.random() * 10) + 1,
      responded: Math.floor(Math.random() * 5),
      interviewed: Math.floor(Math.random() * 3),
    }));
  }, [dateRange, granularity]);

  if (isLoading) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Granularity Toggle */}
      <div className="flex justify-end gap-1 rounded-lg border p-1 w-fit ml-auto">
        <Button
          variant={granularity === 'day' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setGranularity('day')}
          className="h-7 text-xs"
        >
          Daily
        </Button>
        <Button
          variant={granularity === 'week' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setGranularity('week')}
          className="h-7 text-xs"
        >
          Weekly
        </Button>
        <Button
          variant={granularity === 'month' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setGranularity('month')}
          className="h-7 text-xs"
        >
          Monthly
        </Button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorApplied" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorResponded" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorInterviewed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            className="text-xs"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-lg">
                    <p className="font-semibold mb-2">{label}</p>
                    {payload.map((entry, index) => (
                      <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey="applied"
            name="Applied"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#colorApplied)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="responded"
            name="Responded"
            stroke="hsl(var(--chart-2))"
            fillOpacity={1}
            fill="url(#colorResponded)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="interviewed"
            name="Interviewed"
            stroke="hsl(var(--chart-3))"
            fillOpacity={1}
            fill="url(#colorInterviewed)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
