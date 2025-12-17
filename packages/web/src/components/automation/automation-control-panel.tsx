'use client';

import * as React from 'react';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Settings,
  Monitor,
  AlertTriangle,
  Check,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAutomationStore } from '@/stores/automation-store';
import { useSocket } from '@/hooks/use-socket';
import { cn } from '@/lib/utils';

export function AutomationControlPanel() {
  const [showSettings, setShowSettings] = React.useState(false);

  const {
    status,
    isConnected,
    lastError,
    config,
    sessionStats,
    latestScreenshot,
    updateConfig,
    resetSession,
  } = useAutomationStore();

  const {
    connect,
    disconnect,
    startAutomation,
    stopAutomation,
    pauseAutomation,
    resumeAutomation,
  } = useSocket();

  const handleStart = () => {
    resetSession();
    startAutomation({
      platforms: config.platforms,
      searchQuery: config.searchQuery,
      maxApplications: config.maxApplicationsPerDay,
    });
  };

  const handlePause = () => {
    if (status.state === 'paused') {
      resumeAutomation();
    } else {
      pauseAutomation();
    }
  };

  const getStatusColor = () => {
    switch (status.state) {
      case 'running':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBadge = () => {
    switch (status.state) {
      case 'running':
        return <Badge variant="default" className="bg-green-500">Running</Badge>;
      case 'paused':
        return <Badge variant="default" className="bg-yellow-500">Paused</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            Automation Control
            <span className={cn('h-2 w-2 rounded-full', getStatusColor())} />
          </CardTitle>
          <CardDescription>
            Control the automated job application engine
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="gap-1">
              <Wifi className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" />
              Disconnected
            </Badge>
          )}
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          {status.state === 'idle' || status.state === 'error' ? (
            <Button
              onClick={handleStart}
              disabled={!isConnected}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Start Automation
            </Button>
          ) : (
            <>
              <Button
                onClick={handlePause}
                variant="outline"
                className="gap-2"
              >
                {status.state === 'paused' ? (
                  <>
                    <Play className="h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                )}
              </Button>
              <Button
                onClick={stopAutomation}
                variant="destructive"
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </>
          )}

          {!isConnected && (
            <Button onClick={connect} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reconnect
            </Button>
          )}

          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="ghost"
            size="icon"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Error Display */}
        {lastError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{lastError}</span>
          </div>
        )}

        {/* Progress Section */}
        {status.state !== 'idle' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {status.processedJobs} / {status.totalJobs} jobs
              </span>
            </div>
            <Progress
              value={status.totalJobs ? (status.processedJobs! / status.totalJobs) * 100 : 0}
              className="h-2"
            />
            {status.currentTask && (
              <p className="text-sm text-muted-foreground">
                Current: {status.currentTask}
              </p>
            )}
          </div>
        )}

        {/* Session Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <p className="text-2xl font-bold text-green-600">
              {sessionStats.applicationsSubmitted}
            </p>
            <p className="text-xs text-muted-foreground">Submitted</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/10">
            <p className="text-2xl font-bold text-yellow-600">
              {sessionStats.applicationsSkipped}
            </p>
            <p className="text-xs text-muted-foreground">Skipped</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10">
            <p className="text-2xl font-bold text-red-600">
              {sessionStats.errorsEncountered}
            </p>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
        </div>

        {/* Browser Preview */}
        {latestScreenshot && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span className="text-sm font-medium">Browser Preview</span>
            </div>
            <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
              <img
                src={latestScreenshot.dataUrl}
                alt="Browser screenshot"
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-2 left-2 text-xs bg-background/80 px-2 py-1 rounded">
                {new Date(latestScreenshot.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* Settings Collapsible */}
        <Collapsible open={showSettings} onOpenChange={setShowSettings}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </span>
              {showSettings ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>Target Platforms</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.platforms.includes('linkedin')}
                    onCheckedChange={(checked) => {
                      const platforms = checked
                        ? [...config.platforms, 'linkedin' as const]
                        : config.platforms.filter((p) => p !== 'linkedin');
                      updateConfig({ platforms });
                    }}
                  />
                  <Label>LinkedIn</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.platforms.includes('indeed')}
                    onCheckedChange={(checked) => {
                      const platforms = checked
                        ? [...config.platforms, 'indeed' as const]
                        : config.platforms.filter((p) => p !== 'indeed');
                      updateConfig({ platforms });
                    }}
                  />
                  <Label>Indeed</Label>
                </div>
              </div>
            </div>

            {/* Rate Limiting */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Max Applications Per Day</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.maxApplicationsPerDay}
                  </span>
                </div>
                <Slider
                  value={[config.maxApplicationsPerDay]}
                  onValueChange={([value]) =>
                    updateConfig({ maxApplicationsPerDay: value })
                  }
                  min={1}
                  max={50}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Max Applications Per Hour</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.maxApplicationsPerHour}
                  </span>
                </div>
                <Slider
                  value={[config.maxApplicationsPerHour]}
                  onValueChange={([value]) =>
                    updateConfig({ maxApplicationsPerHour: value })
                  }
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Headless Mode</Label>
                <Switch
                  checked={config.headless}
                  onCheckedChange={(headless) => updateConfig({ headless })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Auto Retry on Error</Label>
                <Switch
                  checked={config.autoRetry}
                  onCheckedChange={(autoRetry) => updateConfig({ autoRetry })}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
