'use client';

import * as React from 'react';
import { Search, X, Calendar, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { ApplicationStatus, ApplicationFilters } from '@/types/application';

interface FiltersProps {
  filters: ApplicationFilters;
  onFiltersChange: (filters: ApplicationFilters) => void;
  onReset: () => void;
}

const statusOptions: { value: ApplicationStatus; label: string }[] = [
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
];

export function Filters({ filters, onFiltersChange, onReset }: FiltersProps) {
  const [searchInput, setSearchInput] = React.useState(filters.searchQuery || '');

  const hasActiveFilters =
    filters.status?.length ||
    filters.company ||
    filters.searchQuery ||
    filters.minMatchScore;

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handleStatusToggle = (status: ApplicationStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onFiltersChange({
      ...filters,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handleMinMatchScoreChange = (value: string) => {
    onFiltersChange({
      ...filters,
      minMatchScore: value ? parseInt(value) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by job title, company..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Min Match Score Filter */}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.minMatchScore?.toString() || ''}
            onValueChange={handleMinMatchScoreChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Min match score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any match score</SelectItem>
              <SelectItem value="90">90%+ match</SelectItem>
              <SelectItem value="80">80%+ match</SelectItem>
              <SelectItem value="70">70%+ match</SelectItem>
              <SelectItem value="60">60%+ match</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="mr-2 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        {statusOptions.map((option) => {
          const isSelected = filters.status?.includes(option.value);
          return (
            <Badge
              key={option.value}
              variant={isSelected ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => handleStatusToggle(option.value)}
            >
              {option.label}
              {isSelected && <X className="ml-1 h-3 w-3" />}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
