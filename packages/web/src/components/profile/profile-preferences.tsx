'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { trpc } from '@/lib/trpc/react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, JobPreferences } from '@job-applier/core';
import {
  Target,
  MapPin,
  DollarSign,
  Building2,
  X,
  Plus,
  Briefcase,
  Globe,
  Loader2,
  Save
} from 'lucide-react';

interface ProfilePreferencesProps {
  profile: UserProfile & { isDefault?: boolean };
}

const preferencesSchema = z.object({
  targetRoles: z.array(z.string()),
  targetIndustries: z.array(z.string()).optional(),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  preferredLocations: z.array(z.string()),
  remotePreference: z.enum(['remote-only', 'hybrid', 'onsite', 'flexible']),
  willingToRelocate: z.boolean(),
  excludedCompanies: z.array(z.string()).optional(),
  excludedIndustries: z.array(z.string()).optional(),
  visaRequired: z.boolean().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

export function ProfilePreferences({ profile }: ProfilePreferencesProps) {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [newRole, setNewRole] = React.useState('');
  const [newLocation, setNewLocation] = React.useState('');
  const [newIndustry, setNewIndustry] = React.useState('');
  const [newExcludedCompany, setNewExcludedCompany] = React.useState('');

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      targetRoles: profile.preferences?.targetRoles || [],
      targetIndustries: profile.preferences?.targetIndustries || [],
      minSalary: profile.preferences?.minSalary,
      maxSalary: profile.preferences?.maxSalary,
      preferredLocations: profile.preferences?.preferredLocations || [],
      remotePreference: profile.preferences?.remotePreference || 'flexible',
      willingToRelocate: profile.preferences?.willingToRelocate || false,
      excludedCompanies: profile.preferences?.excludedCompanies || [],
      excludedIndustries: profile.preferences?.excludedIndustries || [],
      visaRequired: profile.preferences?.visaRequired || false,
      experienceLevel: profile.preferences?.experienceLevel || 'mid',
    },
  });

  const updatePreferences = trpc.profile.updatePreferences.useMutation({
    onSuccess: () => {
      toast({ title: 'Preferences saved successfully' });
      utils.profile.listProfiles.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Failed to save preferences', description: error.message, variant: 'destructive' });
    },
  });

  const onSubmit = (data: PreferencesFormData) => {
    updatePreferences.mutate({
      id: profile.id,
      preferences: data,
    });
  };

  const addItem = (field: keyof PreferencesFormData, value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    const current = form.getValues(field) as string[] || [];
    if (!current.includes(value.trim())) {
      form.setValue(field, [...current, value.trim()]);
    }
    setter('');
  };

  const removeItem = (field: keyof PreferencesFormData, value: string) => {
    const current = form.getValues(field) as string[] || [];
    form.setValue(field, current.filter(item => item !== value));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Target Roles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Target Roles
            </CardTitle>
            <CardDescription>
              What job titles are you looking for?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Software Engineer, Product Manager"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('targetRoles', newRole, setNewRole);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addItem('targetRoles', newRole, setNewRole)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.watch('targetRoles')?.map((role) => (
                <Badge key={role} variant="secondary" className="gap-1">
                  {role}
                  <button
                    type="button"
                    onClick={() => removeItem('targetRoles', role)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Preferred Locations
            </CardTitle>
            <CardDescription>
              Where would you like to work?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., San Francisco, New York, Remote"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('preferredLocations', newLocation, setNewLocation);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addItem('preferredLocations', newLocation, setNewLocation)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.watch('preferredLocations')?.map((location) => (
                <Badge key={location} variant="secondary" className="gap-1">
                  {location}
                  <button
                    type="button"
                    onClick={() => removeItem('preferredLocations', location)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="remotePreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Remote Preference
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="remote-only">Remote Only</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="willingToRelocate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Willing to Relocate</FormLabel>
                      <FormDescription>
                        Open to moving for the right opportunity
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Salary & Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Compensation & Experience
            </CardTitle>
            <CardDescription>
              Your salary expectations and experience level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="minSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Salary</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 100000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>Annual in USD</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Salary</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 150000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>Annual in USD</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Experience Level
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="lead">Lead / Principal</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="visaRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Visa Sponsorship Required</FormLabel>
                    <FormDescription>
                      Do you need visa sponsorship to work?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Target Industries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Target Industries
            </CardTitle>
            <CardDescription>
              What industries are you interested in?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Technology, Healthcare, Finance"
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('targetIndustries', newIndustry, setNewIndustry);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addItem('targetIndustries', newIndustry, setNewIndustry)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.watch('targetIndustries')?.map((industry) => (
                <Badge key={industry} variant="secondary" className="gap-1">
                  {industry}
                  <button
                    type="button"
                    onClick={() => removeItem('targetIndustries', industry)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Excluded Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <X className="h-5 w-5" />
              Excluded Companies
            </CardTitle>
            <CardDescription>
              Companies you don't want to apply to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Company Name"
                value={newExcludedCompany}
                onChange={(e) => setNewExcludedCompany(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem('excludedCompanies', newExcludedCompany, setNewExcludedCompany);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addItem('excludedCompanies', newExcludedCompany, setNewExcludedCompany)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.watch('excludedCompanies')?.map((company) => (
                <Badge key={company} variant="destructive" className="gap-1">
                  {company}
                  <button
                    type="button"
                    onClick={() => removeItem('excludedCompanies', company)}
                    className="ml-1 hover:opacity-70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={updatePreferences.isLoading}>
            {updatePreferences.isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Preferences
          </Button>
        </div>
      </form>
    </Form>
  );
}
