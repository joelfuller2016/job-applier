/**
 * Settings Page
 *
 * @description Main settings page with sidebar navigation and content sections
 */

'use client';

import * as React from 'react';
import { Separator } from '@/components/ui/separator';
import { SettingsNav } from '@/components/settings/settings-nav';
import { GeneralSettings } from '@/components/settings/general-settings';
import { ApiKeysSettings } from '@/components/settings/api-keys-settings';
import { PlatformSettings } from '@/components/settings/platform-settings';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { DataPrivacySettings } from '@/components/settings/data-privacy-settings';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = React.useState('general');

  // Track active section based on scroll position
  React.useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'general',
        'api-keys',
        'platforms',
        'notifications',
        'appearance',
        'data-privacy',
      ];

      const scrollPosition = window.scrollY + 100;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>
      <Separator className="my-6" />

      {/* Settings Layout */}
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        {/* Sidebar Navigation */}
        <aside className="lg:w-1/5">
          <SettingsNav activeSection={activeSection} />
        </aside>

        {/* Content Area */}
        <div className="flex-1 lg:max-w-3xl">
          <div className="space-y-6">
            {/* General Settings */}
            <section id="general" className="scroll-mt-6">
              <GeneralSettings />
            </section>

            {/* API Keys */}
            <section id="api-keys" className="scroll-mt-6">
              <ApiKeysSettings />
            </section>

            {/* Platforms */}
            <section id="platforms" className="scroll-mt-6">
              <PlatformSettings />
            </section>

            {/* Notifications */}
            <section id="notifications" className="scroll-mt-6">
              <NotificationSettings />
            </section>

            {/* Appearance */}
            <section id="appearance" className="scroll-mt-6">
              <AppearanceSettings />
            </section>

            {/* Data & Privacy */}
            <section id="data-privacy" className="scroll-mt-6">
              <DataPrivacySettings />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
