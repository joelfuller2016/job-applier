/**
 * Hunt Form Component
 * Search and configuration form for starting a job hunt
 */

'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { HuntConfig } from '@/types/hunt';

interface HuntFormProps {
  onSubmit: (config: HuntConfig) => void;
  isLoading?: boolean;
}

export function HuntForm({ onSubmit, isLoading = false }: HuntFormProps) {
  const [config, setConfig] = useState<HuntConfig>({
    query: '',
    location: '',
    remoteOnly: false,
    specificCompanies: [],
    maxJobs: 25,
    matchThreshold: 70,
    dryRun: false,
  });

  const [companiesInput, setCompaniesInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const companies = companiesInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    onSubmit({ ...config, specificCompanies: companies });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configure Job Hunt</CardTitle>
        <CardDescription>
          Set your search criteria and preferences for the AI-powered job hunt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search Query */}
          <div className="space-y-2">
            <Label htmlFor="query">Job Search Query *</Label>
            <Input
              id="query"
              placeholder="e.g., Senior Frontend Developer React"
              value={config.query}
              onChange={(e) => setConfig({ ...config, query: e.target.value })}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Describe the role and skills you're looking for
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., San Francisco, CA or Remote"
              value={config.location}
              onChange={(e) => setConfig({ ...config, location: e.target.value })}
              disabled={isLoading}
            />
          </div>

          {/* Remote Only Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="remote-only">Remote Only</Label>
              <p className="text-xs text-muted-foreground">
                Only show remote positions
              </p>
            </div>
            <Switch
              id="remote-only"
              checked={config.remoteOnly}
              onCheckedChange={(checked) =>
                setConfig({ ...config, remoteOnly: checked })
              }
              disabled={isLoading}
            />
          </div>

          {/* Specific Companies */}
          <div className="space-y-2">
            <Label htmlFor="companies">Specific Companies (Optional)</Label>
            <Input
              id="companies"
              placeholder="e.g., Google, Meta, Amazon"
              value={companiesInput}
              onChange={(e) => setCompaniesInput(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated list of companies to target
            </p>
          </div>

          {/* Max Jobs Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Maximum Jobs to Process</Label>
              <span className="text-sm font-medium">{config.maxJobs}</span>
            </div>
            <Slider
              value={[config.maxJobs]}
              onValueChange={([value]) => setConfig({ ...config, maxJobs: value })}
              min={1}
              max={50}
              step={1}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Limit the number of jobs to discover and evaluate
            </p>
          </div>

          {/* Match Threshold Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Match Threshold</Label>
              <span className="text-sm font-medium">{config.matchThreshold}%</span>
            </div>
            <Slider
              value={[config.matchThreshold]}
              onValueChange={([value]) =>
                setConfig({ ...config, matchThreshold: value })
              }
              min={0}
              max={100}
              step={5}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Minimum match score to consider a job (higher is more selective)
            </p>
          </div>

          {/* Dry Run Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dry-run"
              checked={config.dryRun}
              onCheckedChange={(checked) =>
                setConfig({ ...config, dryRun: checked as boolean })
              }
              disabled={isLoading}
            />
            <Label htmlFor="dry-run" className="cursor-pointer">
              Dry Run (discover and match jobs without applying)
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || !config.query.trim()}
          >
            <Play className="mr-2 h-4 w-4" />
            {isLoading ? 'Starting Hunt...' : 'Start Job Hunt'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
