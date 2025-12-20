'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import type { UserProfile } from '@job-applier/core';
import { Mail, Phone, MapPin, Linkedin, Github, Globe, Upload } from 'lucide-react';

interface ProfileHeaderProps {
  profile: UserProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>();
  const avatarObjectUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    return () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
    }

    // Create a preview URL
    const url = URL.createObjectURL(file);
    avatarObjectUrlRef.current = url;
    setAvatarUrl(url);

    // TODO: Implement actual upload to server/storage
    // const formData = new FormData();
    // formData.append('avatar', file);
    // await uploadAvatar(formData);
  };

  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback className="text-2xl">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Upload className="h-6 w-6 text-white" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <Button variant="outline" size="sm" asChild>
              <label htmlFor="avatar-upload" className="cursor-pointer">
                Change Photo
              </label>
            </Button>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold">{fullName}</h1>
              {profile.headline && (
                <p className="text-lg text-muted-foreground mt-1">
                  {profile.headline}
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {profile.contact.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a
                    href={`mailto:${profile.contact.email}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {profile.contact.email}
                  </a>
                </div>
              )}
              {profile.contact.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <a
                    href={`tel:${profile.contact.phone}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {profile.contact.phone}
                  </a>
                </div>
              )}
              {profile.contact.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.contact.location}</span>
                </div>
              )}
              {profile.contact.linkedin && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Linkedin className="h-4 w-4" />
                  <a
                    href={profile.contact.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    LinkedIn
                  </a>
                </div>
              )}
              {profile.contact.github && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Github className="h-4 w-4" />
                  <a
                    href={profile.contact.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                </div>
              )}
              {profile.contact.portfolio && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a
                    href={profile.contact.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Portfolio
                  </a>
                </div>
              )}
            </div>

            {/* Summary */}
            {profile.summary && (
              <div className="pt-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.summary}
                </p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {profile.experience.length} Experience{profile.experience.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary">
                {profile.education.length} Education{profile.education.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary">
                {profile.skills.length} Skills
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
