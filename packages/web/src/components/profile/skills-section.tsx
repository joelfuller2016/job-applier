'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc/react';
import type { UserProfile, Skill } from '@job-applier/core';
import { Plus, X, Award } from 'lucide-react';

interface SkillsSectionProps {
  profile: UserProfile;
}

const skillCategories = [
  { value: 'technical', label: 'Technical' },
  { value: 'soft', label: 'Soft Skills' },
  { value: 'language', label: 'Languages' },
  { value: 'tool', label: 'Tools' },
  { value: 'framework', label: 'Frameworks' },
  { value: 'other', label: 'Other' },
] as const;

const proficiencyLevels = [
  { value: 'beginner', label: 'Beginner', color: 'bg-gray-100 text-gray-800' },
  { value: 'intermediate', label: 'Intermediate', color: 'bg-blue-100 text-blue-800' },
  { value: 'advanced', label: 'Advanced', color: 'bg-purple-100 text-purple-800' },
  { value: 'expert', label: 'Expert', color: 'bg-green-100 text-green-800' },
] as const;

const skillFormSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  category: z.enum(['technical', 'soft', 'language', 'tool', 'framework', 'other']),
  proficiency: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  yearsOfExperience: z.string().optional(),
});

type SkillFormData = z.infer<typeof skillFormSchema>;

export function SkillsSection({ profile }: SkillsSectionProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const utils = trpc.useUtils();

  const updateProfile = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      utils.profile.getProfile.invalidate();
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SkillFormData>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      name: '',
      category: 'technical',
      proficiency: 'intermediate',
      yearsOfExperience: '',
    },
  });

  const category = watch('category');
  const proficiency = watch('proficiency');

  const onSubmit = async (data: SkillFormData) => {
    const newSkill: Skill = {
      name: data.name,
      category: data.category,
      proficiency: data.proficiency,
      yearsOfExperience: data.yearsOfExperience
        ? parseFloat(data.yearsOfExperience)
        : undefined,
    };

    // Check if skill already exists
    const existingSkill = profile.skills.find(
      (s) => s.name.toLowerCase() === newSkill.name.toLowerCase()
    );

    if (existingSkill) {
      // Update existing skill
      const updatedSkills = profile.skills.map((s) =>
        s.name.toLowerCase() === newSkill.name.toLowerCase() ? newSkill : s
      );

      await updateProfile.mutateAsync({
        id: profile.id,
        data: { skills: updatedSkills },
      });
    } else {
      // Add new skill
      await updateProfile.mutateAsync({
        id: profile.id,
        data: {
          skills: [...profile.skills, newSkill],
        },
      });
    }

    reset();
  };

  const removeSkill = async (skillName: string) => {
    const updatedSkills = profile.skills.filter((s) => s.name !== skillName);

    await updateProfile.mutateAsync({
      id: profile.id,
      data: {
        skills: updatedSkills,
      },
    });
  };

  const getProficiencyColor = (proficiency: string) => {
    const level = proficiencyLevels.find((p) => p.value === proficiency);
    return level?.color || 'bg-gray-100 text-gray-800';
  };

  const filteredSkills =
    selectedCategory === 'all'
      ? profile.skills
      : profile.skills.filter((s) => s.category === selectedCategory);

  const groupedSkills = filteredSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
        <CardDescription>
          Manage your professional skills and proficiency levels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Skill Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold">Add New Skill</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Skill Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="React, Python..."
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(val) => setValue('category', val as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {skillCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proficiency">Proficiency *</Label>
              <Select
                value={proficiency}
                onValueChange={(val) => setValue('proficiency', val as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {proficiencyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience">Years</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                step="0.5"
                min="0"
                {...register('yearsOfExperience')}
                placeholder="2.5"
              />
            </div>
          </div>

          <Button type="submit" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Skill
          </Button>
        </form>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All ({profile.skills.length})
          </Button>
          {skillCategories.map((cat) => {
            const count = profile.skills.filter((s) => s.category === cat.value).length;
            if (count === 0) return null;
            return (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label} ({count})
              </Button>
            );
          })}
        </div>

        {/* Skills Display */}
        {profile.skills.length === 0 ? (
          <div className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              No skills added yet. Add your first skill above.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSkills).map(([category, skills]) => {
              const categoryLabel =
                skillCategories.find((c) => c.value === category)?.label || category;

              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    {categoryLabel}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <div
                        key={skill.name}
                        className={`group relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${getProficiencyColor(
                          skill.proficiency
                        )}`}
                      >
                        <span>{skill.name}</span>
                        {skill.yearsOfExperience && (
                          <span className="text-xs opacity-75">
                            ({skill.yearsOfExperience}y)
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill.name)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
