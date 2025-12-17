'use client';

import * as React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variantStyles = {
  default: 'text-muted-foreground',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  danger: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
};

const variantBgStyles = {
  default: 'bg-muted/50',
  success: 'bg-green-100 dark:bg-green-900/20',
  warning: 'bg-yellow-100 dark:bg-yellow-900/20',
  danger: 'bg-red-100 dark:bg-red-900/20',
  info: 'bg-blue-100 dark:bg-blue-900/20',
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  variant = 'default',
}: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div
          className={cn(
            'rounded-full p-2',
            variantBgStyles[variant]
          )}
        >
          <Icon className={cn('h-4 w-4', variantStyles[variant])} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <TrendIcon
              className={cn(
                'h-3 w-3',
                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
            />
            <span className={isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {Math.abs(change)}%
            </span>
            {changeLabel && <span className="ml-1">{changeLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
