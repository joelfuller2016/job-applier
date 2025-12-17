/**
 * Socket Hook
 * Manages socket connection and event subscriptions
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  type AutomationStatus,
  type LogEntry,
  type ScreenshotUpdate,
  type ApplicationUpdate,
  type JobDiscoveryUpdate,
} from '@/lib/socket';
import { useAutomationStore } from '@/stores/automation-store';
import { useApplicationsStore } from '@/stores/applications-store';

interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  const connectedRef = useRef(false);

  const automationStore = useAutomationStore();
  const applicationsStore = useApplicationsStore();

  // Setup event handlers
  useEffect(() => {
    const socket = getSocket();

    // Connection events
    const handleConnect = () => {
      connectedRef.current = true;
      automationStore.setConnected(true);
      onConnect?.();
    };

    const handleDisconnect = (reason: string) => {
      connectedRef.current = false;
      automationStore.setConnected(false);
      onDisconnect?.(reason);
    };

    const handleError = (error: Error) => {
      automationStore.setError(error.message);
      onError?.(error);
    };

    // Automation events
    const handleAutomationStatus = (status: AutomationStatus) => {
      automationStore.setStatus(status);
    };

    const handleAutomationLog = (log: LogEntry) => {
      automationStore.addLog(log);

      // Track stats based on log content
      if (log.message.includes('Application submitted')) {
        automationStore.incrementStat('applicationsSubmitted');
      } else if (log.message.includes('Skipping')) {
        automationStore.incrementStat('applicationsSkipped');
      } else if (log.level === 'error') {
        automationStore.incrementStat('errorsEncountered');
      }
    };

    const handleScreenshot = (screenshot: ScreenshotUpdate) => {
      automationStore.setScreenshot(screenshot);
    };

    // Application events
    const handleApplicationUpdate = (update: ApplicationUpdate) => {
      applicationsStore.updateApplication(update.id, {
        status: update.status as any,
        updatedAt: update.updatedAt,
      });
    };

    const handleJobDiscovery = (update: JobDiscoveryUpdate) => {
      if (update.type === 'new' || update.type === 'match') {
        applicationsStore.addApplication({
          id: crypto.randomUUID(),
          jobId: update.job.id,
          profileId: '', // Will be set by backend
          status: 'discovered',
          platform: 'linkedin', // Will be determined by backend
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          job: {
            id: update.job.id,
            title: update.job.title,
            company: update.job.company,
            matchScore: update.job.matchScore,
          },
          notes: [],
          history: [{ status: 'discovered', timestamp: new Date().toISOString() }],
        });
      }
    };

    // Register event handlers
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError as any);
    socket.on('automation:status', handleAutomationStatus);
    socket.on('automation:log', handleAutomationLog);
    socket.on('automation:screenshot', handleScreenshot);
    socket.on('application:update', handleApplicationUpdate);
    socket.on('job:discovery', handleJobDiscovery);

    // Auto-connect if enabled
    if (autoConnect && !isSocketConnected()) {
      connectSocket();
    }

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError as any);
      socket.off('automation:status', handleAutomationStatus);
      socket.off('automation:log', handleAutomationLog);
      socket.off('automation:screenshot', handleScreenshot);
      socket.off('application:update', handleApplicationUpdate);
      socket.off('job:discovery', handleJobDiscovery);
    };
  }, [autoConnect, onConnect, onDisconnect, onError, automationStore, applicationsStore]);

  // Control functions
  const connect = useCallback(() => {
    connectSocket();
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
  }, []);

  const startAutomation = useCallback((config: {
    platforms: ('linkedin' | 'indeed')[];
    searchQuery?: string;
    maxApplications?: number;
  }) => {
    const socket = getSocket();
    socket.emit('automation:start', config);
  }, []);

  const stopAutomation = useCallback(() => {
    const socket = getSocket();
    socket.emit('automation:stop');
  }, []);

  const pauseAutomation = useCallback(() => {
    const socket = getSocket();
    socket.emit('automation:pause');
  }, []);

  const resumeAutomation = useCallback(() => {
    const socket = getSocket();
    socket.emit('automation:resume');
  }, []);

  const subscribeLogs = useCallback((options?: { level?: LogEntry['level'] }) => {
    const socket = getSocket();
    socket.emit('subscribe:logs', options);
  }, []);

  const unsubscribeLogs = useCallback(() => {
    const socket = getSocket();
    socket.emit('unsubscribe:logs');
  }, []);

  return {
    isConnected: automationStore.isConnected,
    connect,
    disconnect,
    startAutomation,
    stopAutomation,
    pauseAutomation,
    resumeAutomation,
    subscribeLogs,
    unsubscribeLogs,
  };
}
