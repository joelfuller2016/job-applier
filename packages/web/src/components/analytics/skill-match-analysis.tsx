'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { isDemoMode } from '@/lib/demo';

interface SkillMatchAnalysisProps {
  dateRange: string;
  isLoading?: boolean;
}

interface SkillData {
  skill: string;
  yourLevel: number;
  required: number;
  requested: number;
}

export function SkillMatchAnalysis({ dateRange, isLoading }: SkillMatchAnalysisProps) {
  const radarData: SkillData[] = useMemo(() => {
    // Demo data - ONLY used when APP_MODE=demo
    // In production, this would come from API calls
    if (!isDemoMode()) {
      return []; // Return empty array in production
    }

    return [
      { skill: 'React', yourLevel: 90, required: 80, requested: 42 },
      { skill: 'TypeScript', yourLevel: 85, required: 75, requested: 38 },
      { skill: 'Node.js', yourLevel: 75, required: 70, requested: 35 },
      { skill: 'Python', yourLevel: 60, required: 65, requested: 28 },
      { skill: 'AWS', yourLevel: 70, required: 75, requested: 31 },
      { skill: 'Docker', yourLevel: 65, required: 60, requested: 25 },
    ];
  }, [dateRange]);

  const topSkills = useMemo(() => {
    // Most requested skills
    return [...radarData]
      .sort((a, b) => b.requested - a.requested)
      .slice(0, 10);
  }, [radarData]);

  const skillGaps = useMemo(() => {
    // Skills where your level is below required
    return radarData
      .filter((skill) => skill.yourLevel < skill.required)
      .map((skill) => ({
        ...skill,
        gap: skill.required - skill.yourLevel,
      }))
      .sort((a, b) => b.gap - a.gap);
  }, [radarData]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Radar Chart */}
      <div>
        <h4 className="mb-4 text-sm font-semibold">Skill Level Comparison</h4>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData}>
            <PolarGrid className="stroke-muted" />
            <PolarAngleAxis
              dataKey="skill"
              className="text-xs"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              className="text-xs"
            />
            <Radar
              name="Your Level"
              dataKey="yourLevel"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.5}
              strokeWidth={2}
            />
            <Radar
              name="Required"
              dataKey="required"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as SkillData;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <p className="font-semibold mb-2">{data.skill}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground">
                          Your Level: <span className="font-medium text-foreground">{data.yourLevel}%</span>
                        </p>
                        <p className="text-muted-foreground">
                          Required: <span className="font-medium text-foreground">{data.required}%</span>
                        </p>
                        <p className="text-muted-foreground">
                          Requested in: <span className="font-medium text-foreground">{data.requested} jobs</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Skills Analysis */}
      <div className="space-y-6">
        {/* Most Requested Skills */}
        <div>
          <h4 className="mb-3 text-sm font-semibold">Most Requested Skills</h4>
          <div className="space-y-2">
            {topSkills.map((skill, index) => (
              <div
                key={skill.skill}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </div>
                  <span className="font-medium">{skill.skill}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {skill.requested} jobs
                  </span>
                  <Badge
                    variant={skill.yourLevel >= skill.required ? 'default' : 'secondary'}
                  >
                    {skill.yourLevel >= skill.required ? 'Qualified' : 'Gap'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Gap Analysis */}
        {skillGaps.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-semibold">Skills to Improve</h4>
            <div className="space-y-2">
              {skillGaps.map((skill) => (
                <div
                  key={skill.skill}
                  className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{skill.skill}</span>
                    <span className="text-sm text-muted-foreground">
                      Gap: {skill.gap}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-full bg-background">
                        <div
                          className="h-2 rounded-full bg-yellow-500"
                          style={{ width: `${skill.yourLevel}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {skill.yourLevel}% / {skill.required}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {skillGaps.length === 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Great job! Your skills meet or exceed all requirements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
