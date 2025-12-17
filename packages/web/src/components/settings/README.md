# Settings Components

Comprehensive settings management for the Job Applier application.

## Overview

The settings system provides a unified interface for managing all application preferences, credentials, and account settings. It features a sidebar navigation with smooth scrolling, form validation, and toast notifications.

## Components

### SettingsNav
Navigation sidebar for settings sections with active section highlighting.

**Features:**
- Scroll-based active section tracking
- Icon-based navigation items
- Responsive design (horizontal on mobile, vertical on desktop)

### GeneralSettings
Default job search preferences and automation behavior.

**Settings:**
- Default keywords and location
- Auto-apply toggle
- Match threshold (0-100%)
- Max applications per day
- Browser automation preferences (headless mode, delays)

### ApiKeysSettings
Manage API credentials for Claude and Exa.

**Features:**
- Masked password inputs with show/hide toggle
- Test connection buttons
- Real-time validation status (idle, testing, valid, invalid)
- Secure storage notice

**API Keys:**
- Claude API Key (required for AI features)
- Exa API Key (optional for enhanced search)

### PlatformSettings
Connect job platform accounts for automated applications.

**Platforms:**
- LinkedIn (email/password)
- Indeed (email/password)
- Additional platforms can be added

**Features:**
- Connection status badges
- Test connection functionality
- Secure credential storage

### NotificationSettings
Configure email and desktop notification preferences.

**Notification Channels:**
- Email notifications
- Desktop notifications (with browser permission request)
- Frequency options (realtime, hourly, daily, weekly)

**Notification Types:**
- New job matches
- Application submitted
- Application updates
- Interview requests
- Rejections
- Weekly summary

### AppearanceSettings
Customize visual preferences and theme.

**Settings:**
- Theme selection (light, dark, system)
- Accent color picker (blue, green, purple, orange, red)
- Compact mode toggle
- Reduced motion toggle
- Live preview

### DataPrivacySettings
Data management and account deletion.

**Features:**
- Export all data (JSON format)
- Data retention settings (30d, 90d, 180d, 365d, forever)
- Clear application history (with confirmation dialog)
- Delete account (with typed confirmation "DELETE")

**Safety:**
- Destructive actions require explicit confirmation
- Warning badges and messages
- Export before delete recommendation

## Page Structure

```tsx
<SettingsPage>
  <SettingsNav activeSection={activeSection} />

  <GeneralSettings />
  <ApiKeysSettings />
  <PlatformSettings />
  <NotificationSettings />
  <AppearanceSettings />
  <DataPrivacySettings />
</SettingsPage>
```

## Usage

### Basic Implementation

```tsx
import { SettingsPage } from '@/app/(dashboard)/settings/page';

// The page automatically handles:
// - Scroll-based navigation
// - Form state management
// - Toast notifications
// - Validation
```

### Individual Components

```tsx
import {
  GeneralSettings,
  ApiKeysSettings,
  // ... other components
} from '@/components/settings';

// Use individually if needed
<GeneralSettings />
```

## Form Validation

All forms use Zod schemas with react-hook-form for validation:

```tsx
const schema = z.object({
  field: z.string().min(1, 'Required'),
  // ...
});

type FormValues = z.infer<typeof schema>;

const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues,
});
```

## Toast Notifications

Success and error messages use the toast hook:

```tsx
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: 'Success',
  description: 'Settings saved successfully.',
});

toast({
  title: 'Error',
  description: 'Failed to save settings.',
  variant: 'destructive',
});
```

## tRPC Integration (To Be Implemented)

Settings are designed to integrate with tRPC mutations:

```tsx
// Example mutation calls (currently mocked)
await trpc.settings.updateGeneral.mutate(data);
await trpc.settings.updateApiKeys.mutate(data);
await trpc.settings.testClaudeKey.mutate({ apiKey });
```

## File Structure

```
src/
├── app/
│   └── (dashboard)/
│       └── settings/
│           └── page.tsx              # Main settings page
├── components/
│   └── settings/
│       ├── settings-nav.tsx          # Navigation sidebar
│       ├── general-settings.tsx      # General preferences
│       ├── api-keys-settings.tsx     # API key management
│       ├── platform-settings.tsx     # Platform credentials
│       ├── notification-settings.tsx # Notification preferences
│       ├── appearance-settings.tsx   # Theme and appearance
│       ├── data-privacy-settings.tsx # Data and privacy
│       ├── index.ts                  # Barrel export
│       └── README.md                 # This file
├── hooks/
│   └── use-toast.ts                  # Toast notification hook
└── components/ui/
    ├── form.tsx                      # Form components
    ├── input.tsx                     # Input component
    ├── switch.tsx                    # Switch component
    ├── select.tsx                    # Select component
    ├── toast.tsx                     # Toast components
    └── toaster.tsx                   # Toast provider
```

## Styling

All components use Tailwind CSS with shadcn/ui design system:

- Consistent spacing and borders
- Dark mode support via next-themes
- Responsive design (mobile-first)
- Accessible form controls

## Accessibility

- Semantic HTML structure
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Focus management in dialogs

## Future Enhancements

### Phase 1 - Backend Integration
- [ ] Connect to tRPC mutations
- [ ] Implement actual API key validation
- [ ] Add platform authentication flows
- [ ] Persistent storage with database

### Phase 2 - Advanced Features
- [ ] Import settings from JSON
- [ ] Settings templates/presets
- [ ] Team/workspace settings
- [ ] Settings versioning and rollback

### Phase 3 - UX Improvements
- [ ] Unsaved changes warning
- [ ] Keyboard shortcuts
- [ ] Settings search
- [ ] Quick settings panel (command palette)

## Contributing

When adding new settings:

1. Create a new component in `src/components/settings/`
2. Define Zod schema for validation
3. Add to `SettingsNav` navigation items
4. Include in main settings page
5. Export from `index.ts`
6. Update this README

## License

Part of the Job Applier project.
