'use client';

import * as React from 'react';
import {
  Terminal,
  Filter,
  Download,
  Trash2,
  Search,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAutomationStore } from '@/stores/automation-store';
import type { LogEntry } from '@/lib/socket';
import { cn } from '@/lib/utils';

const LOG_LEVEL_CONFIG = {
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    label: 'Error',
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    label: 'Warning',
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    label: 'Info',
  },
  debug: {
    icon: Bug,
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
    label: 'Debug',
  },
} as const;

interface LogViewerProps {
  maxHeight?: string;
  showHeader?: boolean;
}

export function LogViewer({ maxHeight = '400px', showHeader = true }: LogViewerProps) {
  const { logs, clearLogs } = useAutomationStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [visibleLevels, setVisibleLevels] = React.useState<Set<LogEntry['level']>>(
    () => new Set<LogEntry['level']>(['error', 'warn', 'info', 'debug'])
  );
  const [autoScroll, setAutoScroll] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  React.useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const toggleLevel = (level: LogEntry['level']) => {
    setVisibleLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const filteredLogs = logs.filter((log) => {
    if (!visibleLevels.has(log.level)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(query) ||
        JSON.stringify(log.context).toLowerCase().includes(query)
      );
    }
    return true;
  });

  const downloadLogs = () => {
    const content = logs
      .map((log) => {
        const timestamp = new Date(log.timestamp).toISOString();
        const context = log.context ? ` | ${JSON.stringify(log.context)}` : '';
        return `[${timestamp}] [${log.level.toUpperCase()}] ${log.message}${context}`;
      })
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automation-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Automation Logs
            <Badge variant="secondary">{logs.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadLogs}
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      )}

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(LOG_LEVEL_CONFIG) as LogEntry['level'][]).map((level) => (
                <DropdownMenuCheckboxItem
                  key={level}
                  checked={visibleLevels.has(level)}
                  onCheckedChange={() => toggleLevel(level)}
                >
                  <span className={LOG_LEVEL_CONFIG[level].color}>
                    {LOG_LEVEL_CONFIG[level].label}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Log Entries */}
        <ScrollArea className="rounded-lg border bg-muted/30" style={{ height: maxHeight }}>
          <div ref={scrollRef} className="p-2 space-y-1 font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                {logs.length === 0 ? 'No logs yet' : 'No matching logs'}
              </div>
            ) : (
              filteredLogs.map((log) => <LogEntryRow key={log.id} log={log} />)
            )}
          </div>
        </ScrollArea>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          {(Object.keys(LOG_LEVEL_CONFIG) as LogEntry['level'][]).map((level) => {
            const count = logs.filter((l) => l.level === level).length;
            const config = LOG_LEVEL_CONFIG[level];
            return (
              <span key={level} className={cn('flex items-center gap-1', config.color)}>
                <config.icon className="h-3 w-3" />
                {count} {config.label}
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function LogEntryRow({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = React.useState(false);
  const config = LOG_LEVEL_CONFIG[log.level];
  const Icon = config.icon;
  const hasContext = log.context && Object.keys(log.context).length > 0;

  const timestamp = new Date(log.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });

  return (
    <div
      className={cn(
        'p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors',
        config.bg
      )}
      onClick={() => hasContext && setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', config.color)} />
        <span className="text-muted-foreground flex-shrink-0">{timestamp}</span>
        <span className="flex-1 break-all">{log.message}</span>
        {hasContext && (
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 flex-shrink-0 transition-transform',
              expanded && 'rotate-180'
            )}
          />
        )}
      </div>
      {expanded && hasContext && (
        <pre className="mt-2 p-2 rounded bg-muted/50 overflow-x-auto text-[10px]">
          {JSON.stringify(log.context, null, 2)}
        </pre>
      )}
    </div>
  );
}
