/**
 * PlatformSettings - Platform credentials management
 *
 * @description Connect and manage credentials for LinkedIn, Indeed, and other job platforms
 */

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

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
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/react';

const platformSettingsSchema = z.object({
  linkedinEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  linkedinPassword: z.string().optional(),
  indeedEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  indeedPassword: z.string().optional(),
});

type PlatformSettingsValues = z.infer<typeof platformSettingsSchema>;

const defaultValues: PlatformSettingsValues = {
  linkedinEmail: '',
  linkedinPassword: '',
  indeedEmail: '',
  indeedPassword: '',
};

interface PlatformStatus {
  linkedin: 'disconnected' | 'connecting' | 'connected' | 'error';
  indeed: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export function PlatformSettings() {
  const { toast } = useToast();
  const [showLinkedInPassword, setShowLinkedInPassword] = React.useState(false);
  const [showIndeedPassword, setShowIndeedPassword] = React.useState(false);
  const [platformStatus, setPlatformStatus] = React.useState<PlatformStatus>({
    linkedin: 'disconnected',
    indeed: 'disconnected',
  });

  // Get current platform status
  const { data: currentStatus } = trpc.settings.getPlatformStatus.useQuery();

  // Update platform status based on server data
  React.useEffect(() => {
    if (currentStatus) {
      setPlatformStatus({
        linkedin: currentStatus.linkedin.configured ? 'connected' : 'disconnected',
        indeed: currentStatus.indeed.configured ? 'connected' : 'disconnected',
      });
    }
  }, [currentStatus]);

  // Test platform connection mutation
  const testConnection = trpc.settings.testPlatformConnection.useMutation({
    onSuccess: (result, variables) => {
      setPlatformStatus((prev) => ({
        ...prev,
        [variables.platform]: result.success ? 'connected' : 'error'
      }));
      toast({
        title: result.success ? 'Connected' : 'Connection failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    },
    onError: (error, variables) => {
      setPlatformStatus((prev) => ({ ...prev, [variables.platform]: 'error' }));
      toast({
        title: 'Error',
        description: error.message || 'Failed to test connection. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update platform credentials mutation
  const updateCredentials = trpc.settings.updatePlatformCredentials.useMutation({
    onSuccess: (result) => {
      toast({
        title: 'Settings saved',
        description: result.message,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save platform credentials. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<PlatformSettingsValues>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: {
      ...defaultValues,
      linkedinEmail: currentStatus?.linkedin.email ?? '',
      indeedEmail: currentStatus?.indeed.email ?? '',
    },
  });

  // Update form values when server data loads
  React.useEffect(() => {
    if (currentStatus) {
      if (currentStatus.linkedin.email) {
        form.setValue('linkedinEmail', currentStatus.linkedin.email);
      }
      if (currentStatus.indeed.email) {
        form.setValue('indeedEmail', currentStatus.indeed.email);
      }
    }
  }, [currentStatus, form]);

  const testLinkedInConnection = async () => {
    const email = form.getValues('linkedinEmail');
    const password = form.getValues('linkedinPassword');

    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please enter both email and password for LinkedIn.',
        variant: 'destructive',
      });
      return;
    }

    setPlatformStatus((prev) => ({ ...prev, linkedin: 'connecting' }));
    testConnection.mutate({ platform: 'linkedin', email, password });
  };

  const testIndeedConnection = async () => {
    const email = form.getValues('indeedEmail');
    const password = form.getValues('indeedPassword');

    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please enter both email and password for Indeed.',
        variant: 'destructive',
      });
      return;
    }

    setPlatformStatus((prev) => ({ ...prev, indeed: 'connecting' }));
    testConnection.mutate({ platform: 'indeed', email, password });
  };

  const onSubmit = async (data: PlatformSettingsValues) => {
    // Save LinkedIn credentials if provided
    if (data.linkedinEmail || data.linkedinPassword) {
      updateCredentials.mutate({
        platform: 'linkedin',
        email: data.linkedinEmail || '',
        password: data.linkedinPassword,
      });
    }

    // Save Indeed credentials if provided
    if (data.indeedEmail || data.indeedPassword) {
      updateCredentials.mutate({
        platform: 'indeed',
        email: data.indeedEmail || '',
        password: data.indeedPassword,
      });
    }
  };

  const isLoading = updateCredentials.isPending;

  const getStatusBadge = (status: PlatformStatus['linkedin' | 'indeed']) => {
    switch (status) {
      case 'connecting':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Connecting...
          </Badge>
        );
      case 'connected':
        return (
          <Badge className="gap-1 bg-success text-success-foreground">
            <CheckCircle2 className="h-3 w-3" />
            Connected
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="outline">Not Connected</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Credentials</CardTitle>
        <CardDescription>
          Connect your accounts to enable automated job applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* LinkedIn */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">LinkedIn</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your LinkedIn account for automated applications
                  </p>
                </div>
                {getStatusBadge(platformStatus.linkedin)}
              </div>

              <FormField
                control={form.control}
                name="linkedinEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedinPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showLinkedInPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowLinkedInPassword(!showLinkedInPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showLinkedInPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="outline"
                onClick={testLinkedInConnection}
                disabled={platformStatus.linkedin === 'connecting'}
                className="w-full"
              >
                {platformStatus.linkedin === 'connecting' ? 'Testing Connection...' : 'Test Connection'}
              </Button>
            </div>

            {/* Indeed */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Indeed</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your Indeed account for automated applications
                  </p>
                </div>
                {getStatusBadge(platformStatus.indeed)}
              </div>

              <FormField
                control={form.control}
                name="indeedEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="indeedPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showIndeedPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="pr-10"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowIndeedPassword(!showIndeedPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showIndeedPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="outline"
                onClick={testIndeedConnection}
                disabled={platformStatus.indeed === 'connecting'}
                className="w-full"
              >
                {platformStatus.indeed === 'connecting' ? 'Testing Connection...' : 'Test Connection'}
              </Button>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-muted bg-muted/50 p-4">
              <div className="flex-1 text-sm text-muted-foreground">
                Your credentials are encrypted and stored securely. We use them only to automate job applications on your behalf.
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Credentials'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
