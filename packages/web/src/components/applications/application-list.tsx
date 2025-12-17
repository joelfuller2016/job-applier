'use client';

import * as React from 'react';
import {
  ArrowUpDown,
  Building2,
  MapPin,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  formatDate,
  getInitials,
  getMatchScoreColor,
  getStatusColor,
} from '@/lib/utils';
import type { Application, ApplicationStatus } from '@/types/application';

interface ApplicationListProps {
  applications: Application[];
  onApplicationView: (application: Application) => void;
  onApplicationDelete?: (id: string) => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
}

type SortField = 'appliedDate' | 'matchScore' | 'company' | 'jobTitle';
type SortDirection = 'asc' | 'desc';

export function ApplicationList({
  applications,
  onApplicationView,
  onApplicationDelete,
  onStatusChange,
}: ApplicationListProps) {
  const [sortField, setSortField] = React.useState<SortField>('appliedDate');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedApplications = React.useMemo(() => {
    return [...applications].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'appliedDate':
          comparison =
            new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
          break;
        case 'matchScore':
          comparison = a.matchScore - b.matchScore;
          break;
        case 'company':
          comparison = a.company.localeCompare(b.company);
          break;
        case 'jobTitle':
          comparison = a.jobTitle.localeCompare(b.jobTitle);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [applications, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedApplications.length / itemsPerPage);
  const paginatedApplications = sortedApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="text-left p-3">
                  <SortButton field="company">Company</SortButton>
                </th>
                <th className="text-left p-3">
                  <SortButton field="jobTitle">Job Title</SortButton>
                </th>
                <th className="text-left p-3">Location</th>
                <th className="text-left p-3">
                  <SortButton field="matchScore">Match</SortButton>
                </th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">
                  <SortButton field="appliedDate">Applied</SortButton>
                </th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No applications found
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((application) => (
                  <tr
                    key={application.id}
                    className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onApplicationView(application)}
                  >
                    {/* Company */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {application.companyLogo && (
                            <AvatarImage
                              src={application.companyLogo}
                              alt={application.company}
                            />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(application.company)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {application.company}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Job Title */}
                    <td className="p-3">
                      <span className="text-sm">{application.jobTitle}</span>
                    </td>

                    {/* Location */}
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{application.location || 'Remote'}</span>
                      </div>
                    </td>

                    {/* Match Score */}
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={`font-semibold ${getMatchScoreColor(
                          application.matchScore
                        )}`}
                      >
                        {application.matchScore}%
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={application.status}
                        onValueChange={(value) =>
                          onStatusChange(application.id, value as ApplicationStatus)
                        }
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="screening">Screening</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Applied Date */}
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(application.appliedDate)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onApplicationView(application)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {onApplicationDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onApplicationDelete(application.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, sortedApplications.length)} of{' '}
            {sortedApplications.length} applications
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
