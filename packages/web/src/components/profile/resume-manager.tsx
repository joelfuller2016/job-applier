'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/react';
import type { UserProfile } from '@job-applier/core';
import {
  Upload,
  FileText,
  Trash2,
  Star,
  StarOff,
  Download,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ResumeManagerProps {
  profile: UserProfile;
}

interface Resume {
  id: string;
  name: string;
  path: string;
  uploadedAt: string;
  isDefault: boolean;
  fileSize: number;
  fileType: string;
}

export function ResumeManager({ profile }: ResumeManagerProps) {
  const [resumes, setResumes] = React.useState<Resume[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [parsing, setParsing] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const updateProfile = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      utils.profile.getProfile.invalidate();
    },
  });

  const importResume = trpc.profile.importResume.useMutation({
    onSuccess: () => {
      utils.profile.getProfile.invalidate();
      setParsing(null);
    },
    onError: (error) => {
      console.error('Failed to import resume:', error);
      setParsing(null);
      alert('Failed to parse resume. Please try again or add information manually.');
    },
  });

  // Load resumes from profile (this would typically come from the backend)
  React.useEffect(() => {
    if (profile.resumePath) {
      // Mock resume data - in a real app, this would come from the backend
      setResumes([
        {
          id: '1',
          name: 'Resume.pdf',
          path: profile.resumePath,
          uploadedAt: profile.parsedAt || profile.updatedAt,
          isDefault: true,
          fileSize: 245000,
          fileType: 'application/pdf',
        },
      ]);
    }
  }, [profile]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document (.pdf, .docx, .doc)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      // TODO: Implement actual file upload to storage (S3, etc.)
      // For now, we'll create a mock URL
      const mockPath = `/uploads/resumes/${Date.now()}_${file.name}`;

      const newResume: Resume = {
        id: Date.now().toString(),
        name: file.name,
        path: mockPath,
        uploadedAt: new Date().toISOString(),
        isDefault: resumes.length === 0,
        fileSize: file.size,
        fileType: file.type,
      };

      setResumes([...resumes, newResume]);

      // Update profile with new resume path if it's the first one
      if (resumes.length === 0) {
        await updateProfile.mutateAsync({
          id: profile.id,
          data: {
            resumePath: mockPath,
          },
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetDefault = async (resumeId: string) => {
    const resume = resumes.find((r) => r.id === resumeId);
    if (!resume) return;

    setResumes(
      resumes.map((r) => ({
        ...r,
        isDefault: r.id === resumeId,
      }))
    );

    await updateProfile.mutateAsync({
      id: profile.id,
      data: {
        resumePath: resume.path,
      },
    });
  };

  const handleDelete = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    const resume = resumes.find((r) => r.id === resumeId);
    const updatedResumes = resumes.filter((r) => r.id !== resumeId);
    setResumes(updatedResumes);

    // If deleting the default resume, set a new default
    if (resume?.isDefault && updatedResumes.length > 0) {
      updatedResumes[0].isDefault = true;
      await updateProfile.mutateAsync({
        id: profile.id,
        data: {
          resumePath: updatedResumes[0].path,
        },
      });
    } else if (updatedResumes.length === 0) {
      await updateProfile.mutateAsync({
        id: profile.id,
        data: {
          resumePath: undefined,
        },
      });
    }

    // TODO: Delete file from storage
  };

  const handleParseResume = async (resumeId: string) => {
    const resume = resumes.find((r) => r.id === resumeId);
    if (!resume) return;

    setParsing(resumeId);

    try {
      await importResume.mutateAsync({
        resumePath: resume.path,
        profileId: profile.id,
      });

      alert('Resume parsed successfully! Your profile has been updated.');
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = async (resume: Resume) => {
    if (!resume.path) return;

    try {
      // Fetch the file as a blob to enable proper download
      const response = await fetch(resume.path);
      if (!response.ok) {
        throw new Error('Failed to fetch resume file');
      }
      const blob = await response.blob();

      // Create object URL for download
      const objectUrl = URL.createObjectURL(blob);

      // Create anchor element and trigger download
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = resume.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up object URL to prevent memory leaks
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Failed to download resume:', error);
      // Fallback to opening in new tab
      window.open(resume.path, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Resume Management</CardTitle>
          <CardDescription>
            Upload and manage your resumes. Use AI to parse and extract information.
          </CardDescription>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
            id="resume-upload"
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="resume-upload" className="cursor-pointer">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resume
                </>
              )}
            </label>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {resumes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              No resumes uploaded yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a PDF or Word document to get started
            </p>
            <Button
              variant="outline"
              className="mt-4"
              asChild
            >
              <label htmlFor="resume-upload" className="cursor-pointer">
                Upload Your First Resume
              </label>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="group border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{resume.name}</h3>
                        {resume.isDefault && (
                          <Badge variant="default">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>Uploaded {formatDate(resume.uploadedAt)}</span>
                        <span>•</span>
                        <span>{formatFileSize(resume.fileSize)}</span>
                        <span>•</span>
                        <span>{resume.fileType.includes('pdf') ? 'PDF' : 'Word'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!resume.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(resume.id)}
                        title="Set as default"
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(resume)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(resume.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleParseResume(resume.id)}
                    disabled={parsing === resume.id}
                  >
                    {parsing === resume.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Parse & Extract
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground self-center">
                    Use AI to automatically extract information and update your profile
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Tips:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Upload PDF or Word documents (.pdf, .docx, .doc)</li>
            <li>• Maximum file size: 10MB</li>
            <li>• Use AI Parse to automatically extract information from your resume</li>
            <li>• Set a default resume to use for job applications</li>
            <li>• Keep multiple versions for different job types</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
