/**
 * SettingsNav - Settings navigation sidebar
 *
 * @description Navigation component for settings page with categorized sections
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  Key,
  Globe,
  Bell,
  Palette,
  Shield,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface SettingsNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const settingsNavItems: SettingsNavItem[] = [
  {
    title: 'General',
    href: '#general',
    icon: Settings,
    description: 'Default preferences and automation settings',
  },
  {
    title: 'API Keys',
    href: '#api-keys',
    icon: Key,
    description: 'Manage Claude and Exa API credentials',
  },
  {
    title: 'Platforms',
    href: '#platforms',
    icon: Globe,
    description: 'Connect LinkedIn, Indeed, and other platforms',
  },
  {
    title: 'Notifications',
    href: '#notifications',
    icon: Bell,
    description: 'Configure email and desktop notifications',
  },
  {
    title: 'Appearance',
    href: '#appearance',
    icon: Palette,
    description: 'Customize theme and visual preferences',
  },
  {
    title: 'Data & Privacy',
    href: '#data-privacy',
    icon: Shield,
    description: 'Export data and manage account',
  },
];

interface SettingsNavProps extends React.HTMLAttributes<HTMLElement> {
  activeSection?: string;
}

export function SettingsNav({ className, activeSection, ...props }: SettingsNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn('flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1', className)}
      {...props}
    >
      {settingsNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.href.slice(1);

        return (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              isActive
                ? 'bg-muted hover:bg-muted'
                : 'hover:bg-transparent hover:underline',
              'justify-start group'
            )}
          >
            <Icon className={cn(
              'mr-2 h-4 w-4',
              isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
            )} />
            <div className="flex flex-col items-start">
              <span className={cn(
                'text-sm font-medium',
                isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
              )}>
                {item.title}
              </span>
              <span className="hidden lg:block text-xs text-muted-foreground">
                {item.description}
              </span>
            </div>
          </a>
        );
      })}
    </nav>
  );
}

export { settingsNavItems };
