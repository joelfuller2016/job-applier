/**
 * NotificationSettings - Notification preferences
 *
 * @description Configure email and desktop notification preferences
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/lib/trpc/react';

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  desktopNotifications: z.boolean().default(false),
  notificationFrequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']).default('daily'),
  notifyNewMatches: z.boolean().default(true),
  notifyApplicationSubmitted: z.boolean().default(true),
  notifyApplicationUpdate: z.boolean().default(true),
  notifyInterviewRequest: z.boolean().default(true),
  notifyRejection: z.boolean().default(false),
  notifyWeeklySummary: z.boolean().default(true),
});

type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;

const defaultValues: NotificationSettingsValues = {
  emailNotifications: true,
  desktopNotifications: false,
  notificationFrequency: 'daily',
  notifyNewMatches: true,
  notifyApplicationSubmitted: true,
  notifyApplicationUpdate: true,
  notifyInterviewRequest: true,
  notifyRejection: false,
  notifyWeeklySummary: true,
};

export function NotificationSettings() {
  const { toast } = useToast();

  // Fetch current settings
  const { data: currentSettings, isLoading: isLoadingSettings } = trpc.settings.getUserNotificationSettings.useQuery();

  // Update settings mutation
  const updateSettings = trpc.settings.updateNotificationSettings.useMutation({
    onSuccess: () => {
      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save notification settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues,
    values: currentSettings ?? defaultValues,
  });

  const emailEnabled = form.watch('emailNotifications');
  const desktopEnabled = form.watch('desktopNotifications');

  const requestDesktopPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not supported',
        description: 'Desktop notifications are not supported in your browser.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        form.setValue('desktopNotifications', true);
        toast({
          title: 'Permission granted',
          description: 'Desktop notifications are now enabled.',
        });

        // Show a test notification
        new Notification('Job Applier', {
          body: 'Desktop notifications are working!',
          icon: '/favicon.ico',
        });
      } else {
        toast({
          title: 'Permission denied',
          description: 'You need to allow notifications in your browser settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to request notification permission.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: NotificationSettingsValues) => {
    updateSettings.mutate(data);
  };

  const isLoading = updateSettings.isPending || isLoadingSettings;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Configure how and when you want to be notified about job applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Notification Channels */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notification Channels</h3>

              <FormField
                control={form.control}
                name="emailNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Email Notifications</FormLabel>
                      <FormDescription>
                        Receive notifications via email
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
                name="desktopNotifications"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Desktop Notifications</FormLabel>
                      <FormDescription>
                        Show browser notifications for important updates
                      </FormDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {!desktopEnabled && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={requestDesktopPermission}
                        >
                          Enable
                        </Button>
                      )}
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!('Notification' in window)}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notificationFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notification Frequency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!emailEnabled && !desktopEnabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Hourly digest</SelectItem>
                        <SelectItem value="daily">Daily digest</SelectItem>
                        <SelectItem value="weekly">Weekly digest</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often to receive notifications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notification Types */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">What to Notify About</h3>

              <FormField
                control={form.control}
                name="notifyNewMatches"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!emailEnabled && !desktopEnabled}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>New Job Matches</FormLabel>
                      <FormDescription>
                        When new jobs matching your criteria are found
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyApplicationSubmitted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!emailEnabled && !desktopEnabled}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Application Submitted</FormLabel>
                      <FormDescription>
                        When an application is successfully submitted
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyApplicationUpdate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!emailEnabled && !desktopEnabled}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Application Updates</FormLabel>
                      <FormDescription>
                        When there are updates to your applications
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyInterviewRequest"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!emailEnabled && !desktopEnabled}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Interview Requests</FormLabel>
                      <FormDescription>
                        When you receive interview invitations
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyRejection"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!emailEnabled && !desktopEnabled}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Rejections</FormLabel>
                      <FormDescription>
                        When applications are rejected
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyWeeklySummary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!emailEnabled}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Weekly Summary</FormLabel>
                      <FormDescription>
                        Receive a weekly summary of your job search activity
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
