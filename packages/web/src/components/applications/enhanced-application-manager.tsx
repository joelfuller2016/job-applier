'use client';

import * as React from 'react';
import {
  LayoutGrid,
  List,
  Calendar,
  Filter,
  SortAsc,
  SortDesc,
  Search,
  RefreshCw,
  Archive,
  Trash2,
  MoreHorizontal,
  Download,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApplicationsStore, type ApplicationStatus } from '@/stores/applications-store';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string; color: string }> = [
  { value: 'discovered', label: 'Discovered', color: 'bg-slate-500' },
  { value: 'queued', label: 'Queued', color: 'bg-blue-500' },
  { value: 'applying', label: 'Applying', color: 'bg-cyan-500' },
  { value: 'submitted', label: 'Submitted', color: 'bg-indigo-500' },
  { value: 'viewed', label: 'Viewed', color: 'bg-purple-500' },
  { value: 'interviewing', label: 'Interviewing', color: 'bg-amber-500' },
  { value: 'offered', label: 'Offered', color: 'bg-green-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'bg-gray-500' },
  { value: 'error', label: 'Error', color: 'bg-rose-500' },
];

interface EnhancedApplicationManagerProps {
  children?: React.ReactNode;
}

export function EnhancedApplicationManager({ children }: EnhancedApplicationManagerProps) {
  const {
    stats,
    filters,
    sortBy,
    sortOrder,
    viewMode,
    isLoading,
    setFilters,
    setSorting,
    setViewMode,
    getFilteredApplications,
  } = useApplicationsStore();

  const [searchQuery, setSearchQuery] = React.useState(filters.searchQuery || '');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const filteredApplications = getFilteredApplications();
  const hasSelection = selectedIds.size > 0;

  // Debounced search
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters({ ...filters, searchQuery });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleStatusFilter = (status: ApplicationStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];
    setFilters({ ...filters, status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map((a) => a.id)));
    }
  };

  const handleBulkAction = (action: 'archive' | 'delete') => {
    // In a real implementation, this would call the API
    console.log(`Bulk ${action}:`, Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const exportApplications = () => {
    const data = filteredApplications.map((app) => ({
      company: app.job.company,
      title: app.job.title,
      status: app.status,
      appliedAt: app.appliedAt,
      matchScore: app.job.matchScore,
    }));
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map((row) => Object.values(row).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {STATUS_OPTIONS.slice(0, 6).map((status) => (
          <button
            key={status.value}
            onClick={() => handleStatusFilter(status.value)}
            className={cn(
              'p-3 rounded-lg border text-left transition-colors hover:bg-muted',
              filters.status?.includes(status.value) && 'ring-2 ring-primary'
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full', status.color)} />
              <span className="text-xs text-muted-foreground">{status.label}</span>
            </div>
            <p className="text-xl font-bold mt-1">
              {stats.byStatus[status.value] || 0}
            </p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company or job title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Status
                {filters.status?.length ? (
                  <Badge variant="secondary" className="ml-1">
                    {filters.status.length}
                  </Badge>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {STATUS_OPTIONS.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status.value}
                  checked={filters.status?.includes(status.value)}
                  onCheckedChange={() => handleStatusFilter(status.value)}
                >
                  <span className={cn('h-2 w-2 rounded-full mr-2', status.color)} />
                  {status.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <Select
            value={sortBy}
            onValueChange={(value) => setSorting(value as typeof sortBy)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="matchScore">Match Score</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSorting(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          {hasSelection && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('archive')}
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </>
          )}

          {/* View Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
            <TabsList className="grid w-[120px] grid-cols-3">
              <TabsTrigger value="kanban" className="px-2">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-2">
                <List className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="calendar" className="px-2">
                <Calendar className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSelectAll}>
                <CheckSquare className="h-4 w-4 mr-2" />
                {selectedIds.size === filteredApplications.length ? 'Deselect All' : 'Select All'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportApplications}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredApplications.length} of {stats.total} applications
        </span>
        {filters.status?.length || searchQuery ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({});
              setSearchQuery('');
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      {/* Content (passed as children or rendered here) */}
      {children || (
        <div className="text-center py-12 text-muted-foreground">
          No applications to display
        </div>
      )}
    </div>
  );
}
