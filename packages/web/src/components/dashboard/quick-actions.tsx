'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Play, Upload, FileText, Settings, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

interface QuickActionsProps {
  onStartHunt?: () => void;
  onImportResume?: () => void;
}

export function QuickActions({ onStartHunt, onImportResume }: QuickActionsProps) {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      id: 'start-hunt',
      label: 'Start Job Hunt',
      description: 'Begin searching for new opportunities',
      icon: Play,
      onClick: onStartHunt || (() => router.push('/hunt')),
      variant: 'default',
    },
    {
      id: 'import-resume',
      label: 'Import Resume',
      description: 'Upload your latest resume',
      icon: Upload,
      onClick: onImportResume || (() => router.push('/profile?tab=resume')),
      variant: 'outline',
    },
    {
      id: 'view-applications',
      label: 'View Applications',
      description: 'See all your submitted applications',
      icon: FileText,
      href: '/applications',
      variant: 'outline',
    },
    {
      id: 'settings',
      label: 'Configure Settings',
      description: 'Update your preferences',
      icon: Settings,
      href: '/settings',
      variant: 'secondary',
    },
  ];

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      router.push(action.href);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant={action.variant}
                className="h-auto flex-col items-start p-4 space-y-2"
                onClick={() => handleActionClick(action)}
              >
                <div className="flex items-center gap-2 w-full">
                  <Icon className="h-5 w-5" />
                  <span className="font-semibold">{action.label}</span>
                </div>
                <span className="text-xs text-muted-foreground font-normal text-left">
                  {action.description}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
