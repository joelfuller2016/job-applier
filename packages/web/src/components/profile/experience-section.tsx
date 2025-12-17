'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExperienceDialog } from './experience-dialog';
import { trpc } from '@/lib/trpc/react';
import type { UserProfile, WorkExperience } from '@job-applier/core';
import { Plus, Pencil, Trash2, Briefcase, Calendar, MapPin, GripVertical } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ExperienceSectionProps {
  profile: UserProfile;
}

export function ExperienceSection({ profile }: ExperienceSectionProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingExperience, setEditingExperience] = React.useState<WorkExperience | undefined>();
  const utils = trpc.useUtils();

  const deleteExperience = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      utils.profile.getProfile.invalidate();
    },
  });

  const handleEdit = (experience: WorkExperience) => {
    setEditingExperience(experience);
    setDialogOpen(true);
  };

  const handleDelete = async (experienceId: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;

    const updatedExperience = profile.experience.filter((exp) => exp.id !== experienceId);

    await deleteExperience.mutateAsync({
      id: profile.id,
      data: {
        experience: updatedExperience,
      },
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingExperience(undefined);
  };

  const formatDateRange = (start: string, end: string | null) => {
    const startDate = formatDate(start);
    const endDate = end ? formatDate(end) : 'Present';
    return `${startDate} - ${endDate}`;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Work Experience</CardTitle>
            <CardDescription>
              Add your work history and professional experience
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Experience
          </Button>
        </CardHeader>
        <CardContent>
          {profile.experience.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No work experience added yet
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setDialogOpen(true)}
              >
                Add Your First Experience
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {profile.experience.map((experience) => (
                <div
                  key={experience.id}
                  className="group relative border rounded-lg p-6 hover:border-primary/50 transition-colors"
                >
                  {/* Drag Handle - for future drag-to-reorder feature */}
                  <div className="absolute left-2 top-6 opacity-0 group-hover:opacity-50 transition-opacity cursor-move">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="pl-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{experience.title}</h3>
                        <p className="text-base text-muted-foreground font-medium">
                          {experience.company}
                        </p>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(experience)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(experience.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateRange(experience.startDate, experience.endDate)}
                      </div>
                      {experience.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {experience.location}
                        </div>
                      )}
                    </div>

                    {experience.description && (
                      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                        {experience.description}
                      </p>
                    )}

                    {experience.highlights.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {experience.highlights.map((highlight, index) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground flex gap-2"
                          >
                            <span className="text-primary">•</span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {experience.skills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {experience.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ExperienceDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        profile={profile}
        experience={editingExperience}
      />
    </>
  );
}
