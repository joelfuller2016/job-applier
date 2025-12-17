# Application Tracker

Complete application tracking system with Kanban board and list views.

## Features

### Views
- **Kanban Board**: Visual board with drag-and-drop between status columns
- **List View**: Sortable table with pagination

### Functionality
- Filter by status, company, match score, and search query
- Drag-and-drop applications between status columns
- View detailed application information in slide-over panel
- Add notes to applications
- Track application timeline
- Export applications to CSV
- Status badges with color coding
- Match score indicators

## Components

### Page Component
- `page.tsx` - Main applications page with view toggle and filtering

### Application Components
- `kanban-board.tsx` - Kanban board with 5 status columns
- `application-list.tsx` - Sortable table view with pagination
- `application-card.tsx` - Draggable card component
- `application-detail.tsx` - Slide-over panel with full application details
- `filters.tsx` - Filter controls and search
- `add-note-dialog.tsx` - Dialog for adding notes

### Types
- `types/application.ts` - TypeScript types and interfaces

## Status Columns

1. **Applied** - Initial application submission
2. **Screening** - Under review
3. **Interview** - Interview stage
4. **Offer** - Offer received
5. **Rejected** - Application rejected

## Usage

```tsx
import ApplicationsPage from '@/app/(dashboard)/applications/page';

// The page is fully self-contained and includes:
// - Mock data for demonstration
// - State management
// - Event handlers
// - Export functionality
```

## Features Detail

### Drag and Drop
- Native HTML5 drag and drop
- Visual feedback during drag
- Drop zones highlight on hover
- Automatic status update on drop

### Filtering
- Multi-select status filter
- Search by job title or company
- Minimum match score filter
- Clear all filters button
- Active filter indicators

### Application Detail View
- Full job description
- Application timeline
- Notes section
- Attachments (resume, cover letter)
- Next steps
- Status update dropdown

### Export
- Export filtered applications to CSV
- Includes: company, job title, status, match score, applied date, location

## Mobile Support

- Horizontally scrollable Kanban board on mobile
- Responsive table that adapts to screen size
- Touch-friendly drag and drop
- Slide-over panel works on all screen sizes

## Future Enhancements

- [ ] Connect to real API/database
- [ ] Add reminders and notifications
- [ ] Interview scheduling
- [ ] Email tracking
- [ ] Document uploads
- [ ] Advanced analytics
- [ ] Bulk actions
- [ ] Custom status columns
- [ ] Tags and categories
- [ ] Salary negotiation tracker
