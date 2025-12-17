# Settings Pages Implementation Summary

## Files Created

### 1. Core Settings Page
- `src/app/(dashboard)/settings/page.tsx` - Main settings page with sidebar navigation and all settings sections

### 2. Settings Components
- `src/components/settings/settings-nav.tsx` - Navigation sidebar with 6 sections
- `src/components/settings/general-settings.tsx` - General preferences and automation settings
- `src/components/settings/api-keys-settings.tsx` - API key management with masked inputs
- `src/components/settings/platform-settings.tsx` - Platform credentials (LinkedIn, Indeed)
- `src/components/settings/notification-settings.tsx` - Notification preferences
- `src/components/settings/appearance-settings.tsx` - Theme and appearance customization
- `src/components/settings/data-privacy-settings.tsx` - Data export and account deletion
- `src/components/settings/index.ts` - Barrel export file
- `src/components/settings/README.md` - Component documentation

### 3. Shared Components/Hooks
- `src/components/ui/form.tsx` - Form wrapper components (react-hook-form integration)
- `src/hooks/use-toast.ts` - Toast notification hook
- `src/components/providers.tsx` - Updated to include Toaster component

## Required Dependencies

The following dependencies need to be installed:

```bash
cd packages/web
npm install react-hook-form @hookform/resolvers
```

These are used for:
- `react-hook-form` - Form state management and validation
- `@hookform/resolvers` - Zod schema validation integration

## Features Implemented

### General Settings
- Default job search keywords and location
- Auto-apply toggle with match threshold
- Max applications per day limiter
- Browser automation settings (headless mode, delays)

### API Keys Settings
- Claude API key management (required)
- Exa API key management (optional)
- Show/hide password toggle buttons
- Test connection functionality with status indicators
- Validation status badges (idle, testing, valid, invalid)

### Platform Settings
- LinkedIn account credentials
- Indeed account credentials
- Connection status badges
- Test connection for each platform
- Secure storage notices

### Notification Settings
- Email notifications toggle
- Desktop notifications with browser permission request
- Notification frequency selector (realtime, hourly, daily, weekly)
- Granular notification type toggles:
  - New job matches
  - Application submitted
  - Application updates
  - Interview requests
  - Rejections
  - Weekly summary

### Appearance Settings
- Theme selector (light, dark, system) with icons
- Accent color picker (blue, green, purple, orange, red)
- Compact mode toggle
- Reduced motion toggle
- Live preview section

### Data & Privacy Settings
- Export all data to JSON
- Data retention period selector (30d-forever)
- Clear application history (with confirmation dialog)
- Delete account (with typed "DELETE" confirmation)
- Privacy policy notice

## Implementation Details

### Form Validation
All forms use Zod schemas with react-hook-form:

```typescript
const schema = z.object({
  field: z.string().min(1, 'Required'),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues,
});
```

### Toast Notifications
Success/error feedback using the custom toast hook:

```typescript
const { toast } = useToast();

toast({
  title: 'Settings saved',
  description: 'Your settings have been updated.',
});
```

### Scroll-based Navigation
The settings page tracks scroll position to highlight the active section in the sidebar:

```typescript
useEffect(() => {
  const handleScroll = () => {
    // Calculate active section based on scroll position
    setActiveSection(sectionId);
  };
  window.addEventListener('scroll', handleScroll);
}, []);
```

### Masked Password Inputs
API keys and passwords use show/hide toggle:

```typescript
const [showPassword, setShowPassword] = useState(false);

<Input
  type={showPassword ? 'text' : 'password'}
  // ...
/>
<button onClick={() => setShowPassword(!showPassword)}>
  {showPassword ? <EyeOff /> : <Eye />}
</button>
```

## Testing the Implementation

### 1. Install Dependencies
```bash
cd packages/web
npm install react-hook-form @hookform/resolvers
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Navigate to Settings
Go to: `http://localhost:3000/settings`

### 4. Test Features
- Navigate between sections using sidebar or scrolling
- Fill out forms and submit (currently logs to console)
- Test show/hide toggles on password fields
- Click test connection buttons
- Request desktop notification permissions
- Change theme and accent colors
- Try data export functionality
- Test confirmation dialogs for destructive actions

## Integration TODOs

### Backend Integration (Phase 1)
- [ ] Create tRPC routes for settings CRUD operations
- [ ] Implement database schema for user settings
- [ ] Add API key validation endpoints
- [ ] Implement platform authentication flows
- [ ] Add data export service
- [ ] Implement account deletion workflow

### tRPC Routes Needed
```typescript
// server/routers/settings.ts
export const settingsRouter = router({
  // General
  updateGeneral: protectedProcedure
    .input(generalSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      // Save to database
    }),

  // API Keys
  updateApiKeys: protectedProcedure
    .input(apiKeysSchema)
    .mutation(async ({ input, ctx }) => {
      // Encrypt and save API keys
    }),
  testClaudeKey: protectedProcedure
    .input(z.object({ apiKey: z.string() }))
    .mutation(async ({ input }) => {
      // Test Claude API connection
    }),

  // Platform Credentials
  updatePlatformCredentials: protectedProcedure
    .input(platformSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      // Encrypt and save credentials
    }),

  // Notifications
  updateNotifications: protectedProcedure
    .input(notificationSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      // Save notification preferences
    }),

  // Appearance
  updateAppearance: protectedProcedure
    .input(appearanceSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      // Save appearance preferences
    }),

  // Data & Privacy
  updateDataPrivacy: protectedProcedure
    .input(dataPrivacySchema)
    .mutation(async ({ input, ctx }) => {
      // Save data retention settings
    }),
  exportUserData: protectedProcedure
    .query(async ({ ctx }) => {
      // Export all user data
    }),
  clearApplicationHistory: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Delete all applications
    }),
  deleteAccount: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Permanently delete account
    }),
});
```

### Database Schema
```sql
-- Settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- General
  default_keywords TEXT,
  default_location TEXT,
  auto_apply_enabled BOOLEAN DEFAULT false,
  match_threshold INTEGER DEFAULT 70,
  browser_headless BOOLEAN DEFAULT true,
  max_applications_per_day INTEGER DEFAULT 10,
  application_delay INTEGER DEFAULT 5,

  -- Notifications
  email_notifications BOOLEAN DEFAULT true,
  desktop_notifications BOOLEAN DEFAULT false,
  notification_frequency TEXT DEFAULT 'daily',
  notify_new_matches BOOLEAN DEFAULT true,
  notify_application_submitted BOOLEAN DEFAULT true,
  notify_application_update BOOLEAN DEFAULT true,
  notify_interview_request BOOLEAN DEFAULT true,
  notify_rejection BOOLEAN DEFAULT false,
  notify_weekly_summary BOOLEAN DEFAULT true,

  -- Appearance
  theme TEXT DEFAULT 'system',
  accent_color TEXT DEFAULT 'blue',
  compact_mode BOOLEAN DEFAULT false,
  reduced_motion BOOLEAN DEFAULT false,

  -- Data & Privacy
  data_retention INTEGER DEFAULT 365,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys table (encrypted)
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'claude', 'exa'
  encrypted_key TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT false,
  last_tested_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Platform Credentials table (encrypted)
CREATE TABLE platform_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'linkedin', 'indeed'
  encrypted_email TEXT NOT NULL,
  encrypted_password TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT false,
  last_connected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform)
);
```

## File Structure

```
packages/web/
├── src/
│   ├── app/
│   │   └── (dashboard)/
│   │       └── settings/
│   │           └── page.tsx                      # Main settings page
│   ├── components/
│   │   ├── settings/
│   │   │   ├── settings-nav.tsx                  # Sidebar navigation
│   │   │   ├── general-settings.tsx              # General preferences
│   │   │   ├── api-keys-settings.tsx             # API key management
│   │   │   ├── platform-settings.tsx             # Platform credentials
│   │   │   ├── notification-settings.tsx         # Notifications
│   │   │   ├── appearance-settings.tsx           # Theme & appearance
│   │   │   ├── data-privacy-settings.tsx         # Data & privacy
│   │   │   ├── index.ts                          # Barrel export
│   │   │   └── README.md                         # Documentation
│   │   ├── ui/
│   │   │   ├── form.tsx                          # Form components (NEW)
│   │   │   ├── toast.tsx                         # Toast components
│   │   │   ├── toaster.tsx                       # Toast provider
│   │   │   └── ... (other shadcn components)
│   │   └── providers.tsx                         # Updated with Toaster
│   ├── hooks/
│   │   └── use-toast.ts                          # Toast hook (NEW)
│   └── server/
│       └── routers/
│           └── settings.ts                       # tRPC routes (TO CREATE)
└── SETTINGS_IMPLEMENTATION.md                    # This file
```

## Styling

All components use:
- Tailwind CSS for styling
- shadcn/ui design system
- Dark mode support via next-themes
- Responsive design (mobile-first)
- Consistent spacing and borders

## Accessibility

- Semantic HTML elements
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Focus management in dialogs
- Screen reader friendly
- Error messages linked to form fields

## Security Considerations

### API Keys & Credentials
- Never log or display full keys/passwords
- Use masked inputs with optional show/hide
- Store encrypted in database
- Validate on backend before saving
- Rate limit test connection endpoints

### Data Export
- Include timestamp in filename
- Sanitize sensitive data before export
- Log export events for audit trail
- Consider rate limiting

### Account Deletion
- Require explicit typed confirmation
- Soft delete with grace period option
- Cascade delete all related data
- Send confirmation email
- Log deletion for compliance

## Next Steps

1. **Install Dependencies**
   ```bash
   npm install react-hook-form @hookform/resolvers
   ```

2. **Test in Development**
   - Run `npm run dev`
   - Navigate to `/settings`
   - Test all form interactions

3. **Create tRPC Routes**
   - Implement settings CRUD operations
   - Add validation and authentication
   - Test with real data

4. **Database Setup**
   - Create settings tables
   - Add encryption for sensitive fields
   - Set up proper indexes

5. **Connect Frontend to Backend**
   - Replace mock mutations with real tRPC calls
   - Add loading states
   - Handle errors gracefully

## Notes

- All forms currently log to console (search for `console.log` to find mock mutation points)
- Theme changes are applied immediately via next-themes
- Desktop notifications require browser permission
- Destructive actions have confirmation dialogs
- All settings are designed to be mobile-responsive

## Support

For questions or issues:
- Check the component README at `src/components/settings/README.md`
- Review individual component source code for implementation details
- Refer to shadcn/ui documentation for UI component usage
