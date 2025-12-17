'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileHeader } from '@/components/profile/profile-header';
import { PersonalInfoForm } from '@/components/profile/personal-info-form';
import { ExperienceSection } from '@/components/profile/experience-section';
import { EducationSection } from '@/components/profile/education-section';
import { SkillsSection } from '@/components/profile/skills-section';
import { ResumeManager } from '@/components/profile/resume-manager';
import { trpc } from '@/lib/trpc/react';

export default function ProfilePage() {
  const { data: profile, isLoading } = trpc.profile.getProfile.useQuery();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            No profile found. Please create a profile to get started.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <ProfileHeader profile={profile} />

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="resumes">Resumes</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <PersonalInfoForm profile={profile} />
        </TabsContent>

        <TabsContent value="experience" className="mt-6">
          <ExperienceSection profile={profile} />
        </TabsContent>

        <TabsContent value="education" className="mt-6">
          <EducationSection profile={profile} />
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <SkillsSection profile={profile} />
        </TabsContent>

        <TabsContent value="resumes" className="mt-6">
          <ResumeManager profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
