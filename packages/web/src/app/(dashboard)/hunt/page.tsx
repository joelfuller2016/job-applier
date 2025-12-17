/**
 * Hunt Page
 * AI-powered job hunting interface with real-time progress
 */

'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { HuntForm } from '@/components/hunt/hunt-form';
import { HuntProgress } from '@/components/hunt/hunt-progress';
import { JobResults } from '@/components/hunt/job-results';
import { ConfirmationDialog } from '@/components/hunt/confirmation-dialog';
import type { HuntConfig, HuntSession, DiscoveredJob } from '@/types/hunt';

export default function HuntPage() {
  const [activeSession, setActiveSession] = useState<HuntSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'apply' | 'skip' | 'applyAll' | 'skipAll';
    job?: DiscoveredJob;
    jobCount?: number;
  }>({
    open: false,
    action: 'apply',
  });

  // Mock function to start hunt - will be replaced with tRPC mutation
  const startHunt = async (config: HuntConfig) => {
    setIsStarting(true);

    // Simulate API call
    setTimeout(() => {
      const newSession: HuntSession = {
        id: Math.random().toString(36).substring(7),
        config,
        progress: {
          phase: 'discovering',
          jobsDiscovered: 0,
          jobsMatched: 0,
          applicationsSubmitted: 0,
          currentActivity: 'Searching for jobs matching your criteria...',
          logs: [
            {
              id: '1',
              timestamp: new Date(),
              level: 'info',
              message: 'Hunt session started',
            },
          ],
        },
        jobs: [],
        startedAt: new Date(),
        status: 'running',
      };

      setActiveSession(newSession);
      setIsStarting(false);

      // Simulate progress updates
      simulateHuntProgress(newSession);
    }, 1000);
  };

  // Mock function to simulate hunt progress - will be replaced with WebSocket/polling
  const simulateHuntProgress = (session: HuntSession) => {
    let step = 0;
    const interval = setInterval(() => {
      step++;

      setActiveSession((prev) => {
        if (!prev) return null;

        const updated = { ...prev };

        // Simulate discovering jobs
        if (step <= 5) {
          updated.progress.phase = 'discovering';
          updated.progress.jobsDiscovered = step * 2;
          updated.progress.currentActivity = `Found ${step * 2} potential jobs...`;
          updated.progress.logs.push({
            id: Math.random().toString(),
            timestamp: new Date(),
            level: 'info',
            message: `Discovered ${step * 2} jobs from Exa search`,
          });

          // Add mock jobs
          if (step === 3) {
            updated.jobs.push(
              {
                id: '1',
                title: 'Senior Frontend Developer',
                company: 'TechCorp Inc.',
                location: 'San Francisco, CA',
                salary: '$150k - $200k',
                description: 'We are looking for an experienced Frontend Developer proficient in React, TypeScript, and modern web technologies. You will work on building scalable web applications...',
                url: 'https://example.com/job/1',
                source: 'exa',
                matchScore: 92,
                discoveredAt: new Date(),
                applied: false,
                skipped: false,
              },
              {
                id: '2',
                title: 'React Developer',
                company: 'StartupXYZ',
                location: 'Remote',
                salary: '$120k - $160k',
                description: 'Join our fast-growing startup as a React Developer. We need someone passionate about creating amazing user experiences with React, Next.js, and TypeScript...',
                url: 'https://example.com/job/2',
                source: 'linkedin',
                matchScore: 88,
                discoveredAt: new Date(),
                applied: false,
                skipped: false,
              },
              {
                id: '3',
                title: 'Full Stack Engineer',
                company: 'MegaCorp',
                location: 'New York, NY',
                description: 'Looking for a Full Stack Engineer to join our engineering team. Strong React and Node.js experience required. You will be working on our main product platform...',
                url: 'https://example.com/job/3',
                source: 'company',
                matchScore: 75,
                discoveredAt: new Date(),
                applied: false,
                skipped: false,
              }
            );
          }
        }
        // Simulate matching
        else if (step <= 8) {
          updated.progress.phase = 'matching';
          updated.progress.jobsMatched = (step - 5) * 3;
          updated.progress.currentActivity = 'Analyzing job requirements and matching with your profile...';
          updated.progress.logs.push({
            id: Math.random().toString(),
            timestamp: new Date(),
            level: 'success',
            message: `Matched ${(step - 5) * 3} jobs above threshold`,
          });
        }
        // Simulate applying (only if not dry run)
        else if (step <= 10 && !session.config.dryRun) {
          updated.progress.phase = 'applying';
          updated.progress.applicationsSubmitted = (step - 8) * 2;
          updated.progress.currentActivity = 'Submitting applications to matched jobs...';
          updated.progress.logs.push({
            id: Math.random().toString(),
            timestamp: new Date(),
            level: 'success',
            message: `Application submitted for ${updated.jobs[step - 9]?.title || 'job'}`,
          });
        }
        // Complete
        else {
          updated.progress.phase = 'completed';
          updated.progress.currentActivity = 'Hunt completed successfully!';
          updated.progress.logs.push({
            id: Math.random().toString(),
            timestamp: new Date(),
            level: 'success',
            message: `Hunt completed: ${updated.progress.jobsDiscovered} discovered, ${updated.progress.jobsMatched} matched, ${updated.progress.applicationsSubmitted} applied`,
          });
          updated.status = 'completed';
          updated.completedAt = new Date();
          clearInterval(interval);
        }

        return updated;
      });
    }, 2000);
  };

  const handleApply = (jobId: string) => {
    const job = activeSession?.jobs.find((j) => j.id === jobId);
    setConfirmDialog({
      open: true,
      action: 'apply',
      job,
    });
  };

  const handleSkip = (jobId: string) => {
    const job = activeSession?.jobs.find((j) => j.id === jobId);
    setConfirmDialog({
      open: true,
      action: 'skip',
      job,
    });
  };

  const handleApplyAll = () => {
    const pendingCount = activeSession?.jobs.filter((j) => !j.applied && !j.skipped).length || 0;
    setConfirmDialog({
      open: true,
      action: 'applyAll',
      jobCount: pendingCount,
    });
  };

  const handleSkipAll = () => {
    const pendingCount = activeSession?.jobs.filter((j) => !j.applied && !j.skipped).length || 0;
    setConfirmDialog({
      open: true,
      action: 'skipAll',
      jobCount: pendingCount,
    });
  };

  const handleConfirmAction = () => {
    // Mock implementation - will be replaced with actual API calls
    setActiveSession((prev) => {
      if (!prev) return null;

      const updated = { ...prev };

      switch (confirmDialog.action) {
        case 'apply':
          if (confirmDialog.job) {
            const jobIndex = updated.jobs.findIndex((j) => j.id === confirmDialog.job!.id);
            if (jobIndex !== -1) {
              updated.jobs[jobIndex].applied = true;
              updated.progress.applicationsSubmitted++;
            }
          }
          break;
        case 'skip':
          if (confirmDialog.job) {
            const jobIndex = updated.jobs.findIndex((j) => j.id === confirmDialog.job!.id);
            if (jobIndex !== -1) {
              updated.jobs[jobIndex].skipped = true;
            }
          }
          break;
        case 'applyAll':
          updated.jobs.forEach((job) => {
            if (!job.applied && !job.skipped) {
              job.applied = true;
              updated.progress.applicationsSubmitted++;
            }
          });
          break;
        case 'skipAll':
          updated.jobs.forEach((job) => {
            if (!job.applied && !job.skipped) {
              job.skipped = true;
            }
          });
          break;
      }

      return updated;
    });
  };

  const handleCancelHunt = () => {
    if (activeSession) {
      setActiveSession({
        ...activeSession,
        status: 'cancelled',
        completedAt: new Date(),
        progress: {
          ...activeSession.progress,
          phase: 'error',
          currentActivity: 'Hunt cancelled by user',
        },
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">AI Job Hunt</h1>
        </div>
        <p className="text-muted-foreground">
          Let AI discover, match, and apply to jobs that fit your profile
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hunt Form */}
        <div>
          <HuntForm
            onSubmit={startHunt}
            isLoading={isStarting || activeSession?.status === 'running'}
          />
        </div>

        {/* Hunt Progress */}
        <div>
          {activeSession && (
            <HuntProgress
              progress={activeSession.progress}
              onCancel={activeSession.status === 'running' ? handleCancelHunt : undefined}
            />
          )}
        </div>
      </div>

      {/* Job Results */}
      {activeSession && activeSession.jobs.length > 0 && (
        <JobResults
          jobs={activeSession.jobs}
          onApply={handleApply}
          onSkip={handleSkip}
          onApplyAll={handleApplyAll}
          onSkipAll={handleSkipAll}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        job={confirmDialog.job}
        action={confirmDialog.action}
        jobCount={confirmDialog.jobCount}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
