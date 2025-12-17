'use client';

import * as React from 'react';
import {
  Briefcase,
  Send,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeTime } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  type: 'job_discovered' | 'application_sent' | 'interview_scheduled' | 'application_accepted' | 'application_rejected' | 'resume_updated';
  title: string;
  description?: string;
  timestamp: string | Date;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

const activityIcons: Record<ActivityItem['type'], LucideIcon> = {
  job_discovered: Briefcase,
  application_sent: Send,
  interview_scheduled: Calendar,
  application_accepted: CheckCircle,
  application_rejected: XCircle,
  resume_updated: FileText,
};

const activityColors: Record<ActivityItem['type'], string> = {
  job_discovered: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  application_sent: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  interview_scheduled: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  application_accepted: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  application_rejected: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  resume_updated: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
};

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {displayedActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => {
              const Icon = activityIcons[activity.type];
              const colorClass = activityColors[activity.type];

              return (
                <div key={activity.id} className="flex gap-3">
                  <div className={`rounded-full p-2 h-fit ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                  {index < displayedActivities.length - 1 && (
                    <div className="absolute left-[1.5rem] top-[3rem] h-full w-px bg-border" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
