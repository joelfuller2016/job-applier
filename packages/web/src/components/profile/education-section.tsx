'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EducationDialog } from './education-dialog';
import { trpc } from '@/lib/trpc/react';
import type { UserProfile, Education } from '@job-applier/core';
import { Plus, Pencil, Trash2, GraduationCap, Calendar, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface EducationSectionProps {
  profile: UserProfile;
}

export function EducationSection({ profile }: EducationSectionProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingEducation, setEditingEducation] = React.useState<Education | undefined>();
  const utils = trpc.useUtils();

  const deleteEducation = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      utils.profile.getProfile.invalidate();
    },
  });

  const handleEdit = (education: Education) => {
    setEditingEducation(education);
    setDialogOpen(true);
  };

  const handleDelete = async (educationId: string) => {
    if (!confirm('Are you sure you want to delete this education?')) return;

    const updatedEducation = profile.education.filter((edu) => edu.id !== educationId);

    await deleteEducation.mutateAsync({
      id: profile.id,
      data: {
        education: updatedEducation,
      },
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEducation(undefined);
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
            <CardTitle>Education</CardTitle>
            <CardDescription>
              Add your educational background and qualifications
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Education
          </Button>
        </CardHeader>
        <CardContent>
          {profile.education.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No education added yet
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setDialogOpen(true)}
              >
                Add Your First Education
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {profile.education.map((education) => (
                <div
                  key={education.id}
                  className="group relative border rounded-lg p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        {education.degree} in {education.field}
                      </h3>
                      <p className="text-base text-muted-foreground font-medium">
                        {education.institution}
                      </p>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(education)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(education.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateRange(education.startDate, education.endDate)}
                    </div>
                    {education.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {education.location}
                      </div>
                    )}
                    {education.gpa && (
                      <Badge variant="secondary">GPA: {education.gpa.toFixed(2)}</Badge>
                    )}
                  </div>

                  {education.honors && education.honors.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Honors & Awards:</p>
                      <div className="flex flex-wrap gap-2">
                        {education.honors.map((honor, index) => (
                          <Badge key={index} variant="outline">
                            {honor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EducationDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        profile={profile}
        education={editingEducation}
      />
    </>
  );
}
