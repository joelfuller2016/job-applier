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
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc/react';
import type { UserProfile, WorkExperience } from '@job-applier/core';
import { Loader2, Plus, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const experienceFormSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  title: z.string().min(1, 'Job title is required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().nullable(),
  current: z.boolean(),
  description: z.string(),
  highlights: z.array(z.object({ value: z.string() })),
  skills: z.array(z.object({ value: z.string() })),
});

type ExperienceFormData = z.infer<typeof experienceFormSchema>;

interface ExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  experience?: WorkExperience;
}

export function ExperienceDialog({
  open,
  onOpenChange,
  profile,
  experience,
}: ExperienceDialogProps) {
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
  } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: experience
      ? {
          company: experience.company,
          title: experience.title,
          location: experience.location || '',
          startDate: experience.startDate.split('T')[0],
          endDate: experience.endDate ? experience.endDate.split('T')[0] : null,
          current: !experience.endDate,
          description: experience.description,
          highlights: experience.highlights.map((h) => ({ value: h })),
          skills: experience.skills.map((s) => ({ value: s })),
        }
      : {
          company: '',
          title: '',
          location: '',
          startDate: '',
          endDate: null,
          current: false,
          description: '',
          highlights: [{ value: '' }],
          skills: [{ value: '' }],
        },
  });

  const {
    fields: highlightFields,
    append: appendHighlight,
    remove: removeHighlight,
  } = useFieldArray({
    control,
    name: 'highlights',
  });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control,
    name: 'skills',
  });

  const isCurrent = watch('current');

  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: ExperienceFormData) => {
    const experienceData: WorkExperience = {
      id: experience?.id || uuidv4(),
      company: data.company,
      title: data.title,
      location: data.location || undefined,
      startDate: new Date(data.startDate).toISOString(),
      endDate: data.current || !data.endDate ? null : new Date(data.endDate).toISOString(),
      description: data.description,
      highlights: data.highlights
        .map((h) => h.value.trim())
        .filter((h) => h.length > 0),
      skills: data.skills
        .map((s) => s.value.trim())
        .filter((s) => s.length > 0),
    };

    const updatedExperience = experience
      ? profile.experience.map((exp) => (exp.id === experience.id ? experienceData : exp))
      : [...profile.experience, experienceData];

    await updateProfile.mutateAsync({
      id: profile.id,
      data: {
        experience: updatedExperience,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {experience ? 'Edit Experience' : 'Add Experience'}
          </DialogTitle>
          <DialogDescription>
            {experience
              ? 'Update your work experience details'
              : 'Add a new work experience to your profile'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input id="company" {...register('company')} placeholder="Acme Inc." />
              {errors.company && (
                <p className="text-sm text-destructive">{errors.company.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Senior Software Engineer"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="San Francisco, CA"
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
                  I currently work here
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe your role and responsibilities..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Key Highlights</Label>
            {highlightFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...register(`highlights.${index}.value`)}
                  placeholder="Led a team of 5 engineers to deliver..."
                />
                {highlightFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHighlight(index)}
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
              onClick={() => appendHighlight({ value: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Highlight
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Skills Used</Label>
            <div className="grid grid-cols-2 gap-2">
              {skillFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    {...register(`skills.${index}.value`)}
                    placeholder="React, TypeScript..."
                  />
                  {skillFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSkill(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendSkill({ value: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Skill
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
              {experience ? 'Update' : 'Add'} Experience
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
