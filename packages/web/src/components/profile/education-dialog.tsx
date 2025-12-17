'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc/react';
import type { UserProfile, Education } from '@job-applier/core';
import { Loader2, Plus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const educationFormSchema = z.object({
  institution: z.string().min(1, 'Institution name is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().min(1, 'Field of study is required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().nullable(),
  current: z.boolean(),
  gpa: z.string().optional(),
  honors: z.array(z.object({ value: z.string() })),
});

type EducationFormData = z.infer<typeof educationFormSchema>;

interface EducationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  education?: Education;
}

export function EducationDialog({
  open,
  onOpenChange,
  profile,
  education,
}: EducationDialogProps) {
  const utils = trpc.useUtils();
  const updateProfile = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      utils.profile.getProfile.invalidate();
      onOpenChange(false);
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationFormSchema),
    defaultValues: education
      ? {
          institution: education.institution,
          degree: education.degree,
          field: education.field,
          location: education.location || '',
          startDate: education.startDate.split('T')[0],
          endDate: education.endDate ? education.endDate.split('T')[0] : null,
          current: !education.endDate,
          gpa: education.gpa?.toString() || '',
          honors: education.honors?.map((h) => ({ value: h })) || [{ value: '' }],
        }
      : {
          institution: '',
          degree: '',
          field: '',
          location: '',
          startDate: '',
          endDate: null,
          current: false,
          gpa: '',
          honors: [{ value: '' }],
        },
  });

  const {
    fields: honorFields,
    append: appendHonor,
    remove: removeHonor,
  } = useFieldArray({
    control,
    name: 'honors',
  });

  const isCurrent = watch('current');

  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: EducationFormData) => {
    const educationData: Education = {
      id: education?.id || uuidv4(),
      institution: data.institution,
      degree: data.degree,
      field: data.field,
      location: data.location || undefined,
      startDate: new Date(data.startDate).toISOString(),
      endDate: data.current || !data.endDate ? null : new Date(data.endDate).toISOString(),
      gpa: data.gpa ? parseFloat(data.gpa) : undefined,
      honors: data.honors
        .map((h) => h.value.trim())
        .filter((h) => h.length > 0),
    };

    const updatedEducation = education
      ? profile.education.map((edu) => (edu.id === education.id ? educationData : edu))
      : [...profile.education, educationData];

    await updateProfile.mutateAsync({
      id: profile.id,
      data: {
        education: updatedEducation,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {education ? 'Edit Education' : 'Add Education'}
          </DialogTitle>
          <DialogDescription>
            {education
              ? 'Update your education details'
              : 'Add a new education to your profile'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="institution">Institution *</Label>
            <Input
              id="institution"
              {...register('institution')}
              placeholder="Stanford University"
            />
            {errors.institution && (
              <p className="text-sm text-destructive">{errors.institution.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="degree">Degree *</Label>
              <Input
                id="degree"
                {...register('degree')}
                placeholder="Bachelor of Science"
              />
              {errors.degree && (
                <p className="text-sm text-destructive">{errors.degree.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="field">Field of Study *</Label>
              <Input
                id="field"
                {...register('field')}
                placeholder="Computer Science"
              />
              {errors.field && (
                <p className="text-sm text-destructive">{errors.field.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Stanford, CA"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                disabled={isCurrent}
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="current"
                  {...register('current')}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="current" className="font-normal cursor-pointer">
                  Currently studying here
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpa">GPA (Optional)</Label>
            <Input
              id="gpa"
              type="number"
              step="0.01"
              min="0"
              max="4"
              {...register('gpa')}
              placeholder="3.85"
            />
            <p className="text-xs text-muted-foreground">On a 4.0 scale</p>
          </div>

          <div className="space-y-2">
            <Label>Honors & Awards</Label>
            {honorFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...register(`honors.${index}.value`)}
                  placeholder="Dean's List, Summa Cum Laude..."
                />
                {honorFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHonor(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendHonor({ value: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Honor
            </Button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {education ? 'Update' : 'Add'} Education
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
