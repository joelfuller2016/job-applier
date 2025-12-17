# shadcn/ui Components

This directory contains all the core shadcn/ui components for the Job Applier web application.

## Available Components

### Buttons & Inputs
- **button.tsx** - Button component with variants (default, destructive, outline, secondary, ghost, link) and sizes (default, sm, lg, icon)
- **input.tsx** - Input component with focus states
- **label.tsx** - Form label component
- **checkbox.tsx** - Checkbox input component
- **switch.tsx** - Toggle switch component
- **slider.tsx** - Range slider component

### Layout & Display
- **card.tsx** - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **separator.tsx** - Horizontal/vertical separator
- **scroll-area.tsx** - Custom scrollbar container

### Overlays & Dialogs
- **dialog.tsx** - Modal dialog using Radix UI
- **dropdown-menu.tsx** - Dropdown menu with submenus, checkboxes, and radio items
- **tooltip.tsx** - Tooltip component
- **toast.tsx** - Toast notification primitives
- **toaster.tsx** - Toast notification system (requires use-toast hook)

### Data Display
- **badge.tsx** - Badge component with variants (default, secondary, destructive, outline)
- **avatar.tsx** - Avatar with image and fallback
- **progress.tsx** - Progress bar component
- **skeleton.tsx** - Loading skeleton placeholder

### Form Components
- **form.tsx** - Form wrapper with react-hook-form integration
- **select.tsx** - Select dropdown component using Radix UI

### Navigation
- **tabs.tsx** - Tabs component using Radix UI (Tabs, TabsList, TabsTrigger, TabsContent)

## Usage

### Individual Imports
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
```

### Barrel Imports
```tsx
import { Button, Card, Badge } from '@/components/ui';
```

## Component Features

### Dark Mode Support
All components support dark mode through CSS variables defined in your Tailwind config.

### Variants with CVA
Components use `class-variance-authority` for type-safe variant management:

```tsx
<Button variant="destructive" size="lg">Delete</Button>
<Badge variant="outline">New</Badge>
```

### Accessibility
All components are built on Radix UI primitives with proper:
- ARIA attributes
- Keyboard navigation
- Focus management
- Screen reader support

### Styling
Components use the `cn()` utility from `@/lib/utils` for class merging:

```tsx
<Button className="custom-class">Click me</Button>
```

## Examples

### Button Component
```tsx
import { Button } from '@/components/ui/button';

// Different variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Different sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Card Component
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Job Application</CardTitle>
    <CardDescription>Software Engineer at Google</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Application status: Pending</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

### Dialog Component
```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

### Toast Notifications
```tsx
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

function MyComponent() {
  const { toast } = useToast();

  return (
    <>
      <Button onClick={() => {
        toast({
          title: "Success!",
          description: "Job application submitted.",
        });
      }}>
        Submit
      </Button>
      <Toaster />
    </>
  );
}
```

### Tabs Component
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="applications">
  <TabsList>
    <TabsTrigger value="applications">Applications</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="applications">
    {/* Applications content */}
  </TabsContent>
  <TabsContent value="analytics">
    {/* Analytics content */}
  </TabsContent>
  <TabsContent value="settings">
    {/* Settings content */}
  </TabsContent>
</Tabs>
```

## Dependencies

All components require:
- `@radix-ui/*` - Accessible component primitives
- `class-variance-authority` - Type-safe variant management
- `clsx` - Class name utility
- `tailwind-merge` - Tailwind class merging
- `lucide-react` - Icon library

## TypeScript Support

All components are fully typed with TypeScript and support:
- Proper prop inference
- Type-safe variants
- Ref forwarding
- Generic components where applicable

## Component Status

All 17+ requested components are complete and ready to use:
- ✅ button.tsx
- ✅ card.tsx
- ✅ badge.tsx
- ✅ input.tsx
- ✅ label.tsx
- ✅ dialog.tsx
- ✅ dropdown-menu.tsx
- ✅ avatar.tsx
- ✅ progress.tsx
- ✅ tabs.tsx
- ✅ toast.tsx
- ✅ toaster.tsx
- ✅ tooltip.tsx
- ✅ scroll-area.tsx
- ✅ separator.tsx
- ✅ skeleton.tsx
- ✅ switch.tsx
- ✅ select.tsx

**Bonus components also created:**
- ✅ checkbox.tsx
- ✅ form.tsx
- ✅ slider.tsx

Total: **21 components** | **~1,400 lines of code**
