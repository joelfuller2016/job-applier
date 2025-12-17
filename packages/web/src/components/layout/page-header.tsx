import * as React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">{actions}</div>
        )}
      </div>
    </div>
  );
}

interface PageHeaderHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHeaderHeading({
  children,
  className,
}: PageHeaderHeadingProps) {
  return (
    <h1 className={cn('text-3xl font-bold tracking-tight', className)}>
      {children}
    </h1>
  );
}

interface PageHeaderDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHeaderDescription({
  children,
  className,
}: PageHeaderDescriptionProps) {
  return (
    <p className={cn('text-muted-foreground', className)}>
      {children}
    </p>
  );
}

interface PageHeaderActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHeaderActions({
  children,
  className,
}: PageHeaderActionsProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {children}
    </div>
  );
}
