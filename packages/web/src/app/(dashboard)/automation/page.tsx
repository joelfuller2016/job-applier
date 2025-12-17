'use client';

import * as React from 'react';
import { Bot, Activity, Clock, Zap } from 'lucide-react';
import { AutomationControlPanel } from '@/components/automation/automation-control-panel';
import { LogViewer } from '@/components/automation/log-viewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAutomationStore } from '@/stores/automation-store';
import { useSocket } from '@/hooks/use-socket';

export default function AutomationPage() {
  // Initialize socket connection
  useSocket({ autoConnect: true });

  const { status, sessionStats, config } = useAutomationStore();

  const getRuntimeDisplay = () => {
    if (!sessionStats.startTime) return '--:--:--';
    const start = new Date(sessionStats.startTime);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Bot className="h-8 w-8" />
          Automation Center
        </h1>
        <p className="text-muted-foreground">
          Control and monitor your automated job application engine
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{status.state}</div>
            <p className="text-xs text-muted-foreground">
              {status.currentTask || 'No active task'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Runtime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{getRuntimeDisplay()}</div>
            <p className="text-xs text-muted-foreground">
              Session duration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessionStats.applicationsSubmitted}
              <span className="text-sm font-normal text-muted-foreground">
                /{config.maxApplicationsPerDay}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessionStats.applicationsSubmitted + sessionStats.applicationsSkipped > 0
                ? Math.round(
                    (sessionStats.applicationsSubmitted /
                      (sessionStats.applicationsSubmitted + sessionStats.applicationsSkipped)) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              This session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="control" className="space-y-4">
        <TabsList>
          <TabsTrigger value="control">Control Panel</TabsTrigger>
          <TabsTrigger value="logs">Live Logs</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <AutomationControlPanel />
            <LogViewer maxHeight="500px" />
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <LogViewer maxHeight="600px" />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Automation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Schedule automation runs for specific times. Coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
