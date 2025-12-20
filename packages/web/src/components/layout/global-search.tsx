'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Briefcase,
  FileText,
  Building2,
  MapPin,
  X,
  ArrowRight,
  Command,
  Loader2,
  Star,
  Clock,
  Zap,
} from 'lucide-react';
import { cn, getMatchScoreColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isDemoMode } from '@/lib/demo';

interface SearchResult {
  id: string;
  type: 'job' | 'application' | 'company';
  title: string;
  subtitle: string;
  meta?: string;
  matchScore?: number;
  url: string;
  icon?: React.ElementType;
}

interface GlobalSearchProps {
  className?: string;
}

// Demo search results - ONLY used when APP_MODE=demo
const mockResults: SearchResult[] = [
  {
    id: '1',
    type: 'job',
    title: 'Senior Frontend Developer',
    subtitle: 'TechCorp Inc.',
    meta: 'San Francisco, CA',
    matchScore: 92,
    url: '/jobs?selected=1',
    icon: Briefcase,
  },
  {
    id: '2',
    type: 'job',
    title: 'Full Stack Engineer',
    subtitle: 'StartupXYZ',
    meta: 'Remote',
    matchScore: 85,
    url: '/jobs?selected=2',
    icon: Briefcase,
  },
  {
    id: '3',
    type: 'application',
    title: 'React Developer at BigCo',
    subtitle: 'Applied 3 days ago',
    meta: 'Screening',
    url: '/applications?selected=3',
    icon: FileText,
  },
  {
    id: '4',
    type: 'company',
    title: 'Innovation Labs',
    subtitle: '15 open positions',
    url: '/jobs?company=innovation-labs',
    icon: Building2,
  },
];

const quickActions = [
  { label: 'Start Job Hunt', href: '/hunt', icon: Zap },
  { label: 'View Applications', href: '/applications', icon: FileText },
  { label: 'Browse Jobs', href: '/jobs', icon: Briefcase },
];

const recentSearches = [
  'Frontend Developer',
  'React Engineer',
  'Remote jobs',
];

export function GlobalSearch({ className }: GlobalSearchProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut to open search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search logic
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    // Simulate search delay
    const timeout = setTimeout(() => {
      // In production mode, return empty results (real search would use API)
      // In demo mode, filter mock results for demonstration
      const searchableResults = isDemoMode() ? mockResults : [];
      const filtered = searchableResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.subtitle.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
      setIsSearching(false);
      setSelectedIndex(0);
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = results.length > 0 ? results : quickActions;
    const maxIndex = items.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, maxIndex));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results.length > 0) {
          handleResultClick(results[selectedIndex]);
        } else if (quickActions[selectedIndex]) {
          router.push(quickActions[selectedIndex].href);
          setOpen(false);
        }
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setOpen(false);
  };

  const typeIcons: Record<string, React.ElementType> = {
    job: Briefcase,
    application: FileText,
    company: Building2,
  };

  const typeColors: Record<string, string> = {
    job: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    application: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    company: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  };

  return (
    <>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        className={cn(
          'relative h-10 w-full max-w-sm justify-start text-sm text-muted-foreground',
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search jobs, applications...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs"><Command className="h-3 w-3" /></span>K
        </kbd>
      </Button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg max-w-2xl">
          {/* Search Input */}
          <div className="flex items-center border-b px-4">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search jobs, applications, companies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex h-14 w-full bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {isSearching && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>

          {/* Search Results */}
          <ScrollArea className="max-h-[400px]">
            <div className="p-2">
              {/* No Query - Show Quick Actions & Recent */}
              {!query && (
                <>
                  {/* Quick Actions */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Quick Actions</p>
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.label}
                          onClick={() => {
                            router.push(action.href);
                            setOpen(false);
                          }}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                            selectedIndex === index
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{action.label}</span>
                          <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="px-2 py-1.5 mt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Recent Searches
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search) => (
                          <Badge
                            key={search}
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => setQuery(search)}
                          >
                            {search}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Search Results */}
              {query && results.length > 0 && (
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Results ({results.length})
                  </p>
                  {results.map((result, index) => {
                    const Icon = result.icon || typeIcons[result.type];
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors',
                          selectedIndex === index
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        )}
                      >
                        <div className={cn(
                          'flex items-center justify-center h-10 w-10 rounded-lg',
                          typeColors[result.type]
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.title}</span>
                            {result.matchScore && (
                              <span className={cn(
                                'text-xs font-bold',
                                getMatchScoreColor(result.matchScore)
                              )}>
                                {result.matchScore}%
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{result.subtitle}</span>
                            {result.meta && (
                              <>
                                <span>•</span>
                                <span>{result.meta}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {result.type}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* No Results */}
              {query && !isSearching && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Search className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">No results found for "{query}"</p>
                  <p className="text-xs mt-1">Try searching for a job title or company name</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground bg-muted/30">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
                Close
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
