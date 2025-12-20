'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileHeader } from '@/components/profile/profile-header';
import { PersonalInfoForm } from '@/components/profile/personal-info-form';
import { ExperienceSection } from '@/components/profile/experience-section';
import { EducationSection } from '@/components/profile/education-section';
import { SkillsSection } from '@/components/profile/skills-section';
import { ResumeManager } from '@/components/profile/resume-manager';
import { ProfilePreferences } from '@/components/profile/profile-preferences';
import { trpc } from '@/lib/trpc/react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Copy,
  Star,
  Trash2,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  FileText,
  Settings,
  AlertCircle
} from 'lucide-react';

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch all profiles
  const { data: profiles, isLoading: profilesLoading } = trpc.profile.listProfiles.useQuery();

  // Get the selected profile or default
  const selectedProfile = React.useMemo(() => {
    if (!profiles || profiles.length === 0) return null;
    if (selectedProfileId) {
      return profiles.find(p => p.id === selectedProfileId) ?? profiles[0];
    }
    // Return the default profile or first profile
    return profiles.find(p => p.isDefault) ?? profiles[0];
  }, [profiles, selectedProfileId]);

  // Set initial profile when profiles load
  React.useEffect(() => {
    if (profiles && profiles.length > 0 && !selectedProfileId) {
      const defaultProfile = profiles.find(p => p.isDefault) ?? profiles[0];
      setSelectedProfileId(defaultProfile.id);
    }
  }, [profiles, selectedProfileId]);

  // Mutations
  const createProfile = trpc.profile.createProfile.useMutation({
    onSuccess: (newProfile) => {
      toast({ title: 'Profile created successfully' });
      utils.profile.listProfiles.invalidate();
      setSelectedProfileId(newProfile.id);
      setIsCreatingProfile(false);
      setNewProfileName('');
    },
    onError: (error) => {
      toast({ title: 'Failed to create profile', description: error.message, variant: 'destructive' });
    },
  });

  const duplicateProfile = trpc.profile.duplicateProfile.useMutation({
    onSuccess: (newProfile) => {
      toast({ title: 'Profile duplicated successfully' });
      utils.profile.listProfiles.invalidate();
      setSelectedProfileId(newProfile.id);
    },
    onError: (error) => {
      toast({ title: 'Failed to duplicate profile', description: error.message, variant: 'destructive' });
    },
  });

  const deleteProfile = trpc.profile.deleteProfile.useMutation({
    onSuccess: () => {
      toast({ title: 'Profile deleted successfully' });
      utils.profile.listProfiles.invalidate();
      setSelectedProfileId(null);
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      toast({ title: 'Failed to delete profile', description: error.message, variant: 'destructive' });
    },
  });

  const setDefaultProfile = trpc.profile.setDefaultProfile.useMutation({
    onSuccess: () => {
      toast({ title: 'Default profile updated' });
      utils.profile.listProfiles.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Failed to set default profile', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) {
      toast({ title: 'Please enter a profile name', variant: 'destructive' });
      return;
    }

    const nameParts = newProfileName.trim().split(' ');
    createProfile.mutate({
      firstName: nameParts[0] || 'New',
      lastName: nameParts.slice(1).join(' ') || 'Profile',
      contact: {
        email: user?.email || 'user@example.com',
      },
      experience: [],
      education: [],
      skills: [],
      preferences: {
        targetRoles: [],
        preferredLocations: [],
        remotePreference: 'flexible',
        willingToRelocate: false,
        experienceLevel: 'mid',
      },
    });
  };

  if (profilesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-muted rounded-lg" />
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  // Show create profile UI if no profiles exist
  if (!profiles || profiles.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-primary/10 p-4 w-fit">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Create Your First Profile</CardTitle>
            <CardDescription>
              Set up your job seeker profile to start finding and applying to jobs.
              You can create multiple profiles for different job types or industries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileName">Profile Name</Label>
              <Input
                id="profileName"
                placeholder="e.g., John Smith or Frontend Developer Profile"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreateProfile}
              disabled={createProfile.isLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Profile Selector Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Label className="text-sm font-medium whitespace-nowrap">Active Profile:</Label>
              <Select
                value={selectedProfileId ?? ''}
                onValueChange={setSelectedProfileId}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select a profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div className="flex items-center gap-2">
                        <span>{profile.firstName} {profile.lastName}</span>
                        {profile.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {/* Create New Profile */}
              <Dialog open={isCreatingProfile} onOpenChange={setIsCreatingProfile}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Profile</DialogTitle>
                    <DialogDescription>
                      Create a new profile for different job types or industries.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="newProfileName">Profile Name</Label>
                      <Input
                        id="newProfileName"
                        placeholder="e.g., John Smith or Backend Developer"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreatingProfile(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProfile} disabled={createProfile.isLoading}>
                      Create Profile
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Duplicate Profile */}
              {selectedProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => duplicateProfile.mutate({ id: selectedProfile.id })}
                  disabled={duplicateProfile.isLoading}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
              )}

              {/* Set as Default */}
              {selectedProfile && !selectedProfile.isDefault && isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDefaultProfile.mutate({ id: selectedProfile.id })}
                  disabled={setDefaultProfile.isLoading}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Set Default
                </Button>
              )}

              {/* Delete Profile */}
              {selectedProfile && profiles.length > 1 && (
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        Delete Profile
                      </DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete "{selectedProfile.firstName} {selectedProfile.lastName}"?
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => deleteProfile.mutate({ id: selectedProfile.id })}
                        disabled={deleteProfile.isLoading}
                      >
                        Delete Profile
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Content */}
      {selectedProfile && (
        <>
          <ProfileHeader profile={selectedProfile} />

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="experience" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Experience</span>
              </TabsTrigger>
              <TabsTrigger value="education" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden sm:inline">Education</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Skills</span>
              </TabsTrigger>
              <TabsTrigger value="resumes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Resume</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Preferences</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-6">
              <PersonalInfoForm profile={selectedProfile} />
            </TabsContent>

            <TabsContent value="experience" className="mt-6">
              <ExperienceSection profile={selectedProfile} />
            </TabsContent>

            <TabsContent value="education" className="mt-6">
              <EducationSection profile={selectedProfile} />
            </TabsContent>

            <TabsContent value="skills" className="mt-6">
              <SkillsSection profile={selectedProfile} />
            </TabsContent>

            <TabsContent value="resumes" className="mt-6">
              <ResumeManager profile={selectedProfile} />
            </TabsContent>

            <TabsContent value="preferences" className="mt-6">
              <ProfilePreferences profile={selectedProfile} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
