'use client';

import * as React from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  MapPin,
  Building2,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { JobFilters, JobPlatform, WorkArrangement, ExperienceLevel, EmploymentType } from '@/types/job';

interface JobFiltersProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  onReset: () => void;
  totalJobs: number;
  filteredCount: number;
}

const platforms: { value: JobPlatform; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'glassdoor', label: 'Glassdoor' },
  { value: 'ziprecruiter', label: 'ZipRecruiter' },
  { value: 'company', label: 'Company Site' },
  { value: 'other', label: 'Other' },
];

const workArrangements: { value: WorkArrangement; label: string }[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

const experienceLevels: { value: ExperienceLevel; label: string }[] = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
];

const employmentTypes: { value: EmploymentType; label: string }[] = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
];

const postedWithinOptions = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '14d', label: 'Last 14 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'Any time' },
];

export function JobFilters({
  filters,
  onFiltersChange,
  onReset,
  totalJobs,
  filteredCount,
}: JobFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState(filters.searchQuery || '');

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.platforms?.length) count++;
    if (filters.workArrangements?.length) count++;
    if (filters.experienceLevels?.length) count++;
    if (filters.employmentTypes?.length) count++;
    if (filters.minSalary) count++;
    if (filters.minMatchScore) count++;
    if (filters.hasEasyApply) count++;
    if (filters.postedWithin && filters.postedWithin !== 'all') count++;
    if (filters.showSaved) count++;
    return count;
  }, [filters]);

  const handleSearchChange = React.useCallback(
    (value: string) => {
      setSearchValue(value);
      // Debounce the search
      const timeoutId = setTimeout(() => {
        onFiltersChange({ ...filters, searchQuery: value || undefined });
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [filters, onFiltersChange]
  );

  const handleMultiSelectChange = <T extends string>(
    key: keyof JobFilters,
    value: T,
    checked: boolean
  ) => {
    const currentValues = (filters[key] as T[] | undefined) || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);
    onFiltersChange({ ...filters, [key]: newValues.length > 0 ? newValues : undefined });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs by title, company, or keywords..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-11"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => {
                setSearchValue('');
                onFiltersChange({ ...filters, searchQuery: undefined });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex gap-2">
          {/* Posted Within */}
          <Select
            value={filters.postedWithin || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, postedWithin: value as JobFilters['postedWithin'] })
            }
          >
            <SelectTrigger className="w-[140px] h-11">
              <SelectValue placeholder="Posted" />
            </SelectTrigger>
            <SelectContent>
              {postedWithinOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Work Arrangement */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 gap-2">
                <MapPin className="h-4 w-4" />
                Work Type
                {filters.workArrangements?.length ? (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {filters.workArrangements.length}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="start">
              <div className="space-y-2">
                {workArrangements.map((item) => (
                  <div key={item.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`work-${item.value}`}
                      checked={filters.workArrangements?.includes(item.value)}
                      onCheckedChange={(checked) =>
                        handleMultiSelectChange('workArrangements', item.value, !!checked)
                      }
                    />
                    <Label htmlFor={`work-${item.value}`} className="text-sm cursor-pointer">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Platform Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 gap-2">
                <Building2 className="h-4 w-4" />
                Platform
                {filters.platforms?.length ? (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {filters.platforms.length}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="start">
              <div className="space-y-2">
                {platforms.map((item) => (
                  <div key={item.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`platform-${item.value}`}
                      checked={filters.platforms?.includes(item.value)}
                      onCheckedChange={(checked) =>
                        handleMultiSelectChange('platforms', item.value, !!checked)
                      }
                    />
                    <Label htmlFor={`platform-${item.value}`} className="text-sm cursor-pointer">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Advanced Filters Toggle */}
          <Button
            variant={isAdvancedOpen ? 'secondary' : 'outline'}
            className="h-11 gap-2"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">More Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 bg-primary text-primary-foreground">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="rounded-lg border bg-muted/30 p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Experience Level */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Experience Level</Label>
                <div className="space-y-2">
                  {experienceLevels.map((item) => (
                    <div key={item.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`exp-${item.value}`}
                        checked={filters.experienceLevels?.includes(item.value)}
                        onCheckedChange={(checked) =>
                          handleMultiSelectChange('experienceLevels', item.value, !!checked)
                        }
                      />
                      <Label htmlFor={`exp-${item.value}`} className="text-sm cursor-pointer">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employment Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Employment Type</Label>
                <div className="space-y-2">
                  {employmentTypes.map((item) => (
                    <div key={item.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${item.value}`}
                        checked={filters.employmentTypes?.includes(item.value)}
                        onCheckedChange={(checked) =>
                          handleMultiSelectChange('employmentTypes', item.value, !!checked)
                        }
                      />
                      <Label htmlFor={`type-${item.value}`} className="text-sm cursor-pointer">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Minimum Salary: {filters.minSalary ? `$${filters.minSalary.toLocaleString()}` : 'Any'}
                </Label>
                <Slider
                  value={[filters.minSalary || 0]}
                  onValueChange={([value]) =>
                    onFiltersChange({ ...filters, minSalary: value > 0 ? value : undefined })
                  }
                  min={0}
                  max={300000}
                  step={10000}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$0</span>
                  <span>$300k+</span>
                </div>
              </div>

              {/* Match Score */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Minimum Match Score: {filters.minMatchScore || 0}%
                </Label>
                <Slider
                  value={[filters.minMatchScore || 0]}
                  onValueChange={([value]) =>
                    onFiltersChange({ ...filters, minMatchScore: value > 0 ? value : undefined })
                  }
                  min={0}
                  max={100}
                  step={5}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="flex flex-wrap gap-4 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="easy-apply"
                  checked={filters.hasEasyApply}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, hasEasyApply: checked ? true : undefined })
                  }
                />
                <Label htmlFor="easy-apply" className="text-sm cursor-pointer">
                  Easy Apply only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saved-only"
                  checked={filters.showSaved}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, showSaved: checked ? true : undefined })
                  }
                />
                <Label htmlFor="saved-only" className="text-sm cursor-pointer">
                  Saved jobs only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-applied"
                  checked={filters.showApplied}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, showApplied: checked ? true : undefined })
                  }
                />
                <Label htmlFor="show-applied" className="text-sm cursor-pointer">
                  Include applied
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-hidden"
                  checked={filters.showHidden}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, showHidden: checked ? true : undefined })
                  }
                />
                <Label htmlFor="show-hidden" className="text-sm cursor-pointer">
                  Show hidden
                </Label>
              </div>
            </div>

            {/* Filter Summary & Reset */}
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filteredCount}</span> of{' '}
                <span className="font-medium text-foreground">{totalJobs}</span> jobs
              </p>
              <Button variant="ghost" size="sm" onClick={onReset}>
                <X className="h-4 w-4 mr-1" />
                Reset all filters
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filters Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.platforms?.map((platform) => (
            <Badge
              key={platform}
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
              onClick={() => handleMultiSelectChange('platforms', platform, false)}
            >
              {platform}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {filters.workArrangements?.map((wa) => (
            <Badge
              key={wa}
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
              onClick={() => handleMultiSelectChange('workArrangements', wa, false)}
            >
              {wa}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {filters.experienceLevels?.map((level) => (
            <Badge
              key={level}
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
              onClick={() => handleMultiSelectChange('experienceLevels', level, false)}
            >
              {level}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {filters.minSalary && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
              onClick={() => onFiltersChange({ ...filters, minSalary: undefined })}
            >
              Min ${(filters.minSalary / 1000).toFixed(0)}k
              <X className="h-3 w-3" />
            </Badge>
          )}
          {filters.minMatchScore && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
              onClick={() => onFiltersChange({ ...filters, minMatchScore: undefined })}
            >
              Match {filters.minMatchScore}%+
              <X className="h-3 w-3" />
            </Badge>
          )}
          {filters.hasEasyApply && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
              onClick={() => onFiltersChange({ ...filters, hasEasyApply: undefined })}
            >
              Easy Apply
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
