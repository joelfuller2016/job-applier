/**
 * GeneralSettings - General application settings
 *
 * @description Default job search preferences and automation settings
 */

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/lib/trpc/react';

const generalSettingsSchema = z.object({
  defaultKeywords: z.string().optional(),
  defaultLocation: z.string().optional(),
  autoApplyEnabled: z.boolean().default(false),
  matchThreshold: z.number().min(0).max(100).default(70),
  browserHeadless: z.boolean().default(true),
  maxApplicationsPerDay: z.number().min(1).max(100).default(10),
  applicationDelay: z.number().min(1).max(60).default(5),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

const defaultValues: GeneralSettingsValues = {
  defaultKeywords: '',
  defaultLocation: '',
  autoApplyEnabled: false,
  matchThreshold: 70,
  browserHeadless: true,
  maxApplicationsPerDay: 10,
  applicationDelay: 5,
};

const DEFAULT_MIN_DELAY_MS = 5000;
const DELAY_MULTIPLIER = 2.5;

export function GeneralSettings() {
  const { toast } = useToast();
  const adminStatusQuery = trpc.settings.getAdminStatus.useQuery();
  const settingsQuery = trpc.settings.getSettings.useQuery();
  const updateSettingsMutation = trpc.settings.updateSettings.useMutation();

  const form = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (!settingsQuery.data) return;

    form.reset({
      defaultKeywords: settingsQuery.data.preferences?.defaultKeywords ?? '',
      defaultLocation: settingsQuery.data.preferences?.defaultLocation ?? '',
      autoApplyEnabled: settingsQuery.data.preferences?.autoApply ?? false,
      matchThreshold: settingsQuery.data.preferences?.minMatchScore ?? 70,
      browserHeadless: settingsQuery.data.browser?.headless ?? true,
      maxApplicationsPerDay: settingsQuery.data.rateLimit?.maxApplicationsPerDay ?? 10,
      applicationDelay: Math.max(
        1,
        Math.round((settingsQuery.data.rateLimit?.minDelayBetweenActions ?? DEFAULT_MIN_DELAY_MS) / 1000)
      ),
    });
  }, [settingsQuery.data]);

  React.useEffect(() => {
    if (!settingsQuery.isError) return;

    toast({
      title: 'Error loading settings',
      description: 'Unable to load settings. Please refresh and try again.',
      variant: 'destructive',
    });
  }, [settingsQuery.isError, toast]);

  const adminConfigured = adminStatusQuery.data?.adminConfigured ?? false;
  const isAdmin = adminStatusQuery.data?.isAdmin ?? false;
  const isReadOnly = adminStatusQuery.isLoading || !isAdmin;

  const onSubmit = async (data: GeneralSettingsValues) => {
    if (!isAdmin) {
      toast({
        title: 'Admin access required',
        description: 'You do not have permission to update system settings.',
        variant: 'destructive',
      });
      return;
    }

    const minDelayMs = Math.max(1000, Math.round(data.applicationDelay * 1000));
    const currentMaxDelay =
      settingsQuery.data?.rateLimit?.maxDelayBetweenActions ??
      Math.round(minDelayMs * DELAY_MULTIPLIER);
    const maxDelayMs =
      currentMaxDelay >= minDelayMs
        ? currentMaxDelay
        : Math.round(minDelayMs * DELAY_MULTIPLIER);

    try {
      await updateSettingsMutation.mutateAsync({
        preferences: {
          defaultKeywords: data.defaultKeywords ?? '',
          defaultLocation: data.defaultLocation ?? '',
          minMatchScore: data.matchThreshold,
          autoApply: data.autoApplyEnabled,
        },
        browser: {
          headless: data.browserHeadless,
        },
        rateLimit: {
          maxApplicationsPerDay: data.maxApplicationsPerDay,
          minDelayBetweenActions: minDelayMs,
          maxDelayBetweenActions: maxDelayMs,
        },
      });

      toast({
        title: 'Settings saved',
        description: 'Your general settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Configure default job search preferences and automation behavior
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!isAdmin && !adminStatusQuery.isLoading && (
              <div className="rounded-lg border border-dashed border-muted-foreground/50 p-4 text-sm text-muted-foreground">
                {adminConfigured
                  ? 'Administrator access is required to update these settings.'
                  : 'Administrator access is not configured. Set ADMIN_USER_IDS to enable updates.'}
              </div>
            )}

            <fieldset disabled={isReadOnly} className="space-y-6">
              {/* Default Search Preferences */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Default Search Preferences</h3>

                <FormField
                  control={form.control}
                  name="defaultKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Keywords</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Software Engineer, Full Stack Developer"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Default job titles or keywords for new job hunts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., San Francisco, CA or Remote"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Default location for job searches
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Auto-Apply Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Auto-Apply Settings</h3>

                <FormField
                  control={form.control}
                  name="autoApplyEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Auto-Apply</FormLabel>
                        <FormDescription>
                          Automatically apply to jobs that match your criteria
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

                <FormField
                  control={form.control}
                  name="matchThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Threshold ({field.value}%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum match percentage to auto-apply (0-100)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxApplicationsPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Applications Per Day</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of applications to submit per day
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Browser Automation Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Browser Automation</h3>

                <FormField
                  control={form.control}
                  name="browserHeadless"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Headless Mode</FormLabel>
                        <FormDescription>
                          Run browser automation in the background (recommended)
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

                <FormField
                  control={form.control}
                  name="applicationDelay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Delay (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="60"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Delay between applications to appear more human-like
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>

            <Button
              type="submit"
              disabled={
                settingsQuery.isLoading ||
                settingsQuery.isError ||
                adminStatusQuery.isLoading ||
                !isAdmin ||
                updateSettingsMutation.isLoading
              }
            >
              {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
