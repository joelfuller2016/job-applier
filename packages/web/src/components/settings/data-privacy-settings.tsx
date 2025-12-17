/**
 * DataPrivacySettings - Data and privacy management
 *
 * @description Export data, manage retention, and account deletion
 */

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Download, Trash2, AlertTriangle, Database } from 'lucide-react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const dataPrivacySchema = z.object({
  dataRetention: z.enum(['30', '90', '180', '365', 'forever']).default('365'),
  autoDeleteRejected: z.boolean().default(false),
});

type DataPrivacyValues = z.infer<typeof dataPrivacySchema>;

const defaultValues: DataPrivacyValues = {
  dataRetention: '365',
  autoDeleteRejected: false,
};

export function DataPrivacySettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isClearingHistory, setIsClearingHistory] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const form = useForm<DataPrivacyValues>({
    resolver: zodResolver(dataPrivacySchema),
    defaultValues,
  });

  const exportData = async () => {
    setIsExporting(true);
    try {
      // TODO: Implement tRPC mutation to export data
      // const data = await trpc.settings.exportUserData.query();

      // Simulate data export
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockData = {
        profile: { name: 'User', email: 'user@example.com' },
        applications: [],
        jobHunts: [],
        settings: {},
        exportedAt: new Date().toISOString(),
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(mockData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `job-applier-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data exported',
        description: 'Your data has been downloaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const clearApplicationHistory = async () => {
    setIsClearingHistory(true);
    try {
      // TODO: Implement tRPC mutation to clear history
      // await trpc.settings.clearApplicationHistory.mutate();

      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: 'History cleared',
        description: 'Your application history has been deleted.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear history. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsClearingHistory(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: 'Invalid confirmation',
        description: 'Please type DELETE to confirm account deletion.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      // TODO: Implement tRPC mutation to delete account
      // await trpc.settings.deleteAccount.mutate();

      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
      });

      // Redirect to login or home page
      // router.push('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
    }
  };

  const onSubmit = async (data: DataPrivacyValues) => {
    setIsLoading(true);
    try {
      // TODO: Implement tRPC mutation to save data privacy settings
      // await trpc.settings.updateDataPrivacy.mutate(data);

      console.log('Data privacy settings:', data);

      toast({
        title: 'Settings saved',
        description: 'Your data privacy preferences have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data & Privacy</CardTitle>
        <CardDescription>
          Manage your data, privacy settings, and account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Export */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Export Your Data</h3>
          <div className="flex items-start justify-between rounded-lg border p-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium">Download all data</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Export all your applications, job hunts, and settings in JSON format
              </p>
            </div>
            <Button
              onClick={exportData}
              disabled={isExporting}
              variant="outline"
              className="ml-4"
            >
              {isExporting ? (
                'Exporting...'
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Data Retention */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="text-sm font-medium">Data Retention</h3>

            <FormField
              control={form.control}
              name="dataRetention"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keep application data for</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select retention period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">6 months</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="forever">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Old applications will be automatically deleted after this period
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </form>
        </Form>

        {/* Clear History */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Clear Data</h3>
          <div className="flex items-start justify-between rounded-lg border border-warning/50 bg-warning/5 p-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h4 className="text-sm font-medium">Clear application history</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Delete all your job applications and related data. This action cannot be undone.
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="ml-4 border-warning text-warning hover:bg-warning/10">
                  Clear History
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear Application History</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all your job applications, matches, and related data.
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {}}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={clearApplicationHistory}
                    disabled={isClearingHistory}
                  >
                    {isClearingHistory ? 'Clearing...' : 'Clear History'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Delete Account */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Danger Zone</h3>
          <div className="flex items-start justify-between rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                <h4 className="text-sm font-medium">Delete account</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action is irreversible.
              </p>
            </div>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="ml-4">
                  Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Account</DialogTitle>
                  <DialogDescription>
                    This will permanently delete your account and all your data including:
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      <li>All job applications</li>
                      <li>Job hunts and searches</li>
                      <li>Profile and settings</li>
                      <li>API keys and credentials</li>
                    </ul>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm font-medium">
                    Type <span className="font-bold text-destructive">DELETE</span> to confirm:
                  </p>
                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE"
                    className="font-mono"
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeleteConfirmation('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={deleteAccount}
                    disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account Permanently'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="rounded-lg border border-muted bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            We take your privacy seriously. Your data is encrypted, never shared with third parties,
            and you have full control over its retention and deletion.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
