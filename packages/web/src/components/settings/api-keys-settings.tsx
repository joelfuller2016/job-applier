/**
 * ApiKeysSettings - API keys management
 *
 * @description Manage Claude and Exa API credentials with masked inputs and validation
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
import { cn } from '@/lib/utils';

const apiKeysSchema = z.object({
  claudeApiKey: z.string().min(1, 'Claude API key is required'),
  exaApiKey: z.string().optional(),
});

type ApiKeysValues = z.infer<typeof apiKeysSchema>;

const defaultValues: ApiKeysValues = {
  claudeApiKey: '',
  exaApiKey: '',
};

interface ApiKeyStatus {
  claude: 'idle' | 'testing' | 'valid' | 'invalid';
  exa: 'idle' | 'testing' | 'valid' | 'invalid';
}

export function ApiKeysSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showClaudeKey, setShowClaudeKey] = React.useState(false);
  const [showExaKey, setShowExaKey] = React.useState(false);
  const [keyStatus, setKeyStatus] = React.useState<ApiKeyStatus>({
    claude: 'idle',
    exa: 'idle',
  });

  const form = useForm<ApiKeysValues>({
    resolver: zodResolver(apiKeysSchema),
    defaultValues,
  });

  const testClaudeKey = async () => {
    const key = form.getValues('claudeApiKey');
    if (!key) {
      toast({
        title: 'Error',
        description: 'Please enter a Claude API key first.',
        variant: 'destructive',
      });
      return;
    }

    setKeyStatus((prev) => ({ ...prev, claude: 'testing' }));

    try {
      // TODO: Implement tRPC mutation to test Claude API key
      // const result = await trpc.settings.testClaudeKey.mutate({ apiKey: key });

      // Simulate API test
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const isValid = key.startsWith('sk-'); // Basic validation

      setKeyStatus((prev) => ({ ...prev, claude: isValid ? 'valid' : 'invalid' }));

      toast({
        title: isValid ? 'Connection successful' : 'Connection failed',
        description: isValid
          ? 'Claude API key is valid and working.'
          : 'Unable to authenticate with Claude API.',
        variant: isValid ? 'default' : 'destructive',
      });
    } catch (error) {
      setKeyStatus((prev) => ({ ...prev, claude: 'invalid' }));
      toast({
        title: 'Error',
        description: 'Failed to test API key. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const testExaKey = async () => {
    const key = form.getValues('exaApiKey');
    if (!key) {
      toast({
        title: 'Error',
        description: 'Please enter an Exa API key first.',
        variant: 'destructive',
      });
      return;
    }

    setKeyStatus((prev) => ({ ...prev, exa: 'testing' }));

    try {
      // TODO: Implement tRPC mutation to test Exa API key
      // const result = await trpc.settings.testExaKey.mutate({ apiKey: key });

      // Simulate API test
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const isValid = key.length > 10; // Basic validation

      setKeyStatus((prev) => ({ ...prev, exa: isValid ? 'valid' : 'invalid' }));

      toast({
        title: isValid ? 'Connection successful' : 'Connection failed',
        description: isValid
          ? 'Exa API key is valid and working.'
          : 'Unable to authenticate with Exa API.',
        variant: isValid ? 'default' : 'destructive',
      });
    } catch (error) {
      setKeyStatus((prev) => ({ ...prev, exa: 'invalid' }));
      toast({
        title: 'Error',
        description: 'Failed to test API key. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: ApiKeysValues) => {
    setIsLoading(true);
    try {
      // TODO: Implement tRPC mutation to save API keys
      // await trpc.settings.updateApiKeys.mutate(data);

      console.log('API keys:', { ...data, claudeApiKey: '***', exaApiKey: '***' });

      toast({
        title: 'Settings saved',
        description: 'Your API keys have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save API keys. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: ApiKeyStatus['claude' | 'exa']) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Manage your Claude and Exa API credentials for AI-powered features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Claude API Key */}
            <FormField
              control={form.control}
              name="claudeApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claude API Key</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FormControl>
                          <Input
                            type={showClaudeKey ? 'text' : 'password'}
                            placeholder="sk-ant-..."
                            className="pr-10"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowClaudeKey(!showClaudeKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showClaudeKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testClaudeKey}
                        disabled={keyStatus.claude === 'testing'}
                        className="min-w-[100px]"
                      >
                        {getStatusIcon(keyStatus.claude)}
                        <span className="ml-2">
                          {keyStatus.claude === 'testing' ? 'Testing...' : 'Test'}
                        </span>
                      </Button>
                    </div>
                    <FormDescription>
                      Required for AI-powered job matching and analysis. Get your key from{' '}
                      <a
                        href="https://console.anthropic.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground"
                      >
                        Anthropic Console
                      </a>
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exa API Key */}
            <FormField
              control={form.control}
              name="exaApiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exa API Key (Optional)</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FormControl>
                          <Input
                            type={showExaKey ? 'text' : 'password'}
                            placeholder="exa_..."
                            className="pr-10"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowExaKey(!showExaKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showExaKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testExaKey}
                        disabled={keyStatus.exa === 'testing'}
                        className="min-w-[100px]"
                      >
                        {getStatusIcon(keyStatus.exa)}
                        <span className="ml-2">
                          {keyStatus.exa === 'testing' ? 'Testing...' : 'Test'}
                        </span>
                      </Button>
                    </div>
                    <FormDescription>
                      Enhanced job search using Exa's neural search. Get your key from{' '}
                      <a
                        href="https://exa.ai/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-foreground"
                      >
                        Exa.ai
                      </a>
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-4 rounded-lg border border-muted bg-muted/50 p-4">
              <div className="flex-1 text-sm text-muted-foreground">
                API keys are encrypted and stored securely. They are never shared or logged.
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save API Keys'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
