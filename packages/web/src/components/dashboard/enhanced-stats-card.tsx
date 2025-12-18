'use client';

import * as React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EnhancedStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
  href?: string;
  description?: string;
  sparklineData?: number[];
}

const variantStyles = {
  default: {
    icon: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    border: 'hover:border-slate-300 dark:hover:border-slate-600',
    gradient: 'from-slate-500/10 to-transparent',
  },
  success: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    gradient: 'from-emerald-500/10 to-transparent',
  },
  warning: {
    icon: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'hover:border-amber-300 dark:hover:border-amber-700',
    gradient: 'from-amber-500/10 to-transparent',
  },
  danger: {
    icon: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    border: 'hover:border-rose-300 dark:hover:border-rose-700',
    gradient: 'from-rose-500/10 to-transparent',
  },
  info: {
    icon: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'hover:border-blue-300 dark:hover:border-blue-700',
    gradient: 'from-blue-500/10 to-transparent',
  },
  primary: {
    icon: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    border: 'hover:border-violet-300 dark:hover:border-violet-700',
    gradient: 'from-violet-500/10 to-transparent',
  },
};

function MiniSparkline({ data, variant }: { data: number[]; variant: keyof typeof variantStyles }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 40;
  const width = 80;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const variantColor = {
    default: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#f43f5e',
    info: '#3b82f6',
    primary: '#8b5cf6',
  };

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={variantColor[variant]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EnhancedStatsCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  variant = 'default',
  href,
  description,
  sparklineData,
}: EnhancedStatsCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const styles = variantStyles[variant];

  const CardWrapper = href ? Link : 'div';
  const cardProps = href ? { href } : {};

  return (
    <CardWrapper {...(cardProps as any)}>
      <Card className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer group',
        styles.border
      )}>
        {/* Gradient Background */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          styles.gradient
        )} />

        <CardContent className="relative p-6">
          <div className="flex items-start justify-between">
            {/* Left Side - Stats */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight">{value}</span>
                {change !== undefined && (
                  <span className={cn(
                    'flex items-center text-sm font-medium',
                    isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  )}>
                    <TrendIcon className="h-4 w-4 mr-0.5" />
                    {Math.abs(change)}%
                  </span>
                )}
              </div>
              {(changeLabel || description) && (
                <p className="text-xs text-muted-foreground">
                  {changeLabel || description}
                </p>
              )}
            </div>

            {/* Right Side - Icon & Sparkline */}
            <div className="flex flex-col items-end gap-3">
              <div className={cn('rounded-xl p-3', styles.bg)}>
                <Icon className={cn('h-6 w-6', styles.icon)} />
              </div>
              {sparklineData && sparklineData.length > 0 && (
                <MiniSparkline data={sparklineData} variant={variant} />
              )}
            </div>
          </div>

          {/* Hover Arrow */}
          {href && (
            <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  );
}
