/**
 * AppearanceSettings - Appearance preferences
 *
 * @description Customize theme, colors, and visual preferences
 */

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';

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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const appearanceSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  accentColor: z.enum(['blue', 'green', 'purple', 'orange', 'red']).default('blue'),
  compactMode: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
});

type AppearanceSettingsValues = z.infer<typeof appearanceSettingsSchema>;

const defaultValues: AppearanceSettingsValues = {
  theme: 'system',
  accentColor: 'blue',
  compactMode: false,
  reducedMotion: false,
};

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

const accentColors = [
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'red', label: 'Red', color: 'bg-red-500' },
] as const;

const appearanceStorageKey = 'job-applier-appearance-settings';

export function AppearanceSettings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<AppearanceSettingsValues>({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: {
      ...defaultValues,
      theme: (theme as AppearanceSettingsValues['theme']) || 'system',
    },
  });

  const currentTheme = form.watch('theme');
  const currentAccent = form.watch('accentColor');

  React.useEffect(() => {
    if (currentTheme) {
      setTheme(currentTheme);
    }
  }, [currentTheme, setTheme]);

  const applyPreferences = React.useCallback(
    (data: AppearanceSettingsValues) => {
      setTheme(data.theme);

      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-accent', data.accentColor);
        document.documentElement.classList.toggle('compact', data.compactMode);
        document.documentElement.classList.toggle('reduce-motion', data.reducedMotion);
      }
    },
    [setTheme]
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const saved = window.localStorage.getItem(appearanceStorageKey);
    if (!saved) {
      return;
    }

    let savedData: unknown;
    try {
      savedData = JSON.parse(saved);
    } catch (error) {
      console.warn('Failed to parse saved appearance settings.', error);
      return;
    }

    const parsed = appearanceSettingsSchema.safeParse(savedData);
    if (!parsed.success) {
      return;
    }

    form.reset(parsed.data);
    applyPreferences(parsed.data);
  }, [applyPreferences, form]);

  const onSubmit = async (data: AppearanceSettingsValues) => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(appearanceStorageKey, JSON.stringify(data));
      }

      applyPreferences(data);

      toast({
        title: 'Settings saved',
        description: 'Your appearance preferences have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save appearance settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Theme Selection */}
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-4">
                      {themeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
                              field.value === option.value
                                ? 'border-primary bg-primary/10'
                                : 'border-muted hover:border-primary/50'
                            )}
                          >
                            <Icon className="h-6 w-6" />
                            <span className="text-sm font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose your preferred color theme
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Accent Color */}
            <FormField
              control={form.control}
              name="accentColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accent Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-3">
                      {accentColors.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => field.onChange(color.value)}
                          className={cn(
                            'group relative flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110',
                            color.color,
                            field.value === color.value && 'ring-2 ring-offset-2 ring-primary'
                          )}
                          title={color.label}
                        >
                          {field.value === color.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose your preferred accent color
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Display Options</h3>

              <FormField
                control={form.control}
                name="compactMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Compact Mode</FormLabel>
                      <FormDescription>
                        Reduce spacing and padding for more content density
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
                name="reducedMotion"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Reduced Motion</FormLabel>
                      <FormDescription>
                        Minimize animations and transitions
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

            {/* Preview */}
            <div className="rounded-lg border p-6">
              <h3 className="mb-4 text-sm font-medium">Preview</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-primary" />
                  <div className="h-4 flex-1 rounded bg-muted" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-primary/80" />
                  <div className="h-4 flex-1 rounded bg-muted" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-primary/60" />
                  <div className="h-4 flex-1 rounded bg-muted" />
                </div>
              </div>
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
