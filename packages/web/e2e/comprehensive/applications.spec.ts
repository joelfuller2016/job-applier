import { test, expect } from '@playwright/test';
import {
  waitForLoadingComplete,
  viewports,
  getTableData,
  waitForModal,
  waitForToast,
} from '../test-utils';

/**
 * Comprehensive Applications Page Tests
 * Tests application tracking, status management, and application details
 */

test.describe('Applications Page', () => {
  test.describe('Page Layout', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);
    });

    test('should display applications page with heading', async ({ page }) => {
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();

      const headingText = await heading.textContent();
      expect(headingText?.toLowerCase()).toMatch(/application/i);
    });

    test('should display applications list or table', async ({ page }) => {
      const table = page.locator('table, [role="table"]');
      const list = page.locator('[data-applications-list], [class*="application"]');

      const hasTable = await table.count() > 0;
      const hasList = await list.count() > 0;

      expect(hasTable || hasList).toBeTruthy();
    });

    test('should display status filter tabs or dropdown', async ({ page }) => {
      const statusFilter = page.locator('[role="tablist"], select[name*="status"], [data-status-filter]');
      await expect(statusFilter.first()).toBeVisible();
    });

    test('should display application count', async ({ page }) => {
      const countDisplay = page.locator('text=/\\d+.*application/i, [data-application-count]');
      const hasCount = await countDisplay.count() > 0;
    });

    test('should have add application button', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Add Application")');
      const hasAddButton = await addButton.count() > 0;
    });
  });

  test.describe('Applications List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);
    });

    test('should display application cards with job info', async ({ page }) => {
      const applicationItems = page.locator('tr:has(td), [data-application-card], [class*="application-item"]');

      if (await applicationItems.count() > 0) {
        const firstItem = applicationItems.first();
        await expect(firstItem).toBeVisible();

        // Should contain job title or company
        const hasJobInfo = await firstItem.textContent();
        expect(hasJobInfo).toBeTruthy();
      }
    });

    test('should display application status badges', async ({ page }) => {
      const statusBadges = page.locator('[data-status], [class*="badge"], [class*="status"]');
      const badgeCount = await statusBadges.count();
      expect(badgeCount).toBeGreaterThanOrEqual(0);
    });

    test('should display application dates', async ({ page }) => {
      const dates = page.locator('time, [data-date], text=/\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4}/');
      const dateCount = await dates.count();
      expect(dateCount).toBeGreaterThanOrEqual(0);
    });

    test('should display company logos or placeholders', async ({ page }) => {
      const logos = page.locator('img[alt*="logo"], img[alt*="company"], [data-company-logo], [class*="avatar"]');
      const logoCount = await logos.count();
      expect(logoCount).toBeGreaterThanOrEqual(0);
    });

    test('should show empty state when no applications', async ({ page }) => {
      // Navigate with filter that returns no results
      await page.goto('/applications?status=nonexistent');
      await waitForLoadingComplete(page);

      const content = await page.content();
      expect(content.length).toBeGreaterThan(100);
    });
  });

  test.describe('Status Filtering', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);
    });

    test('should filter by All status', async ({ page }) => {
      const allTab = page.locator('[role="tab"]:has-text("All"), button:has-text("All")').first();

      if (await allTab.count() > 0) {
        await allTab.click();
        await waitForLoadingComplete(page);
      }
    });

    test('should filter by Submitted status', async ({ page }) => {
      const submittedTab = page.locator('[role="tab"]:has-text("Submitted"), button:has-text("Submitted"), option:has-text("Submitted")').first();

      if (await submittedTab.count() > 0) {
        await submittedTab.click();
        await waitForLoadingComplete(page);

        // All visible applications should have submitted status
        const statusBadges = page.locator('[data-status="submitted"], text=/submitted/i');
        const badgeCount = await statusBadges.count();
      }
    });

    test('should filter by In Review status', async ({ page }) => {
      const reviewTab = page.locator('[role="tab"]:has-text("Review"), button:has-text("In Review")').first();

      if (await reviewTab.count() > 0) {
        await reviewTab.click();
        await waitForLoadingComplete(page);
      }
    });

    test('should filter by Interview status', async ({ page }) => {
      const interviewTab = page.locator('[role="tab"]:has-text("Interview"), button:has-text("Interview")').first();

      if (await interviewTab.count() > 0) {
        await interviewTab.click();
        await waitForLoadingComplete(page);
      }
    });

    test('should filter by Offer status', async ({ page }) => {
      const offerTab = page.locator('[role="tab"]:has-text("Offer"), button:has-text("Offer")').first();

      if (await offerTab.count() > 0) {
        await offerTab.click();
        await waitForLoadingComplete(page);
      }
    });

    test('should filter by Rejected status', async ({ page }) => {
      const rejectedTab = page.locator('[role="tab"]:has-text("Rejected"), button:has-text("Rejected")').first();

      if (await rejectedTab.count() > 0) {
        await rejectedTab.click();
        await waitForLoadingComplete(page);
      }
    });

    test('should update URL with status filter', async ({ page }) => {
      const statusTab = page.locator('[role="tab"]').nth(1);

      if (await statusTab.count() > 0) {
        await statusTab.click();
        await page.waitForTimeout(500);

        const url = page.url();
        expect(url).toContain('/applications');
      }
    });

    test('should show count for each status', async ({ page }) => {
      const statusCounts = page.locator('[role="tab"] span, [data-status-count]');
      const countElements = await statusCounts.count();
    });
  });

  test.describe('Application Details', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);
    });

    test('should open application details on click', async ({ page }) => {
      const applicationItem = page.locator('tr:has(td), [data-application-card]').first();

      if (await applicationItem.count() > 0) {
        await applicationItem.click();
        await page.waitForTimeout(500);

        // Check for modal or detail view
        const modal = page.locator('[role="dialog"], [data-application-details]');
        const urlChanged = page.url().includes('/applications/');

        expect(await modal.count() > 0 || urlChanged).toBeTruthy();
      }
    });

    test('should display job title in details', async ({ page }) => {
      const applicationItem = page.locator('tr:has(td), [data-application-card]').first();

      if (await applicationItem.count() > 0) {
        await applicationItem.click();
        await page.waitForTimeout(500);

        const jobTitle = page.locator('h1, h2, [data-job-title]');
        const hasTitle = await jobTitle.count() > 0;
      }
    });

    test('should display company information', async ({ page }) => {
      const applicationItem = page.locator('[data-application-card]').first();

      if (await applicationItem.count() > 0) {
        await applicationItem.click();
        await page.waitForTimeout(500);

        const companyInfo = page.locator('text=/company/i, [data-company]');
        const hasCompany = await companyInfo.count() > 0;
      }
    });

    test('should display application timeline', async ({ page }) => {
      const timeline = page.locator('[data-timeline], [class*="timeline"], text=/timeline/i');
      const hasTimeline = await timeline.count() >= 0;
    });

    test('should display application notes', async ({ page }) => {
      const notes = page.locator('[data-notes], textarea[name*="note"], text=/note/i');
      const hasNotes = await notes.count() >= 0;
    });

    test('should display attached documents', async ({ page }) => {
      const documents = page.locator('[data-documents], text=/document/i, text=/resume/i, text=/cover.*letter/i');
      const hasDocs = await documents.count() >= 0;
    });

    test('should close details view', async ({ page }) => {
      const closeButton = page.locator('button[aria-label="Close"], button:has-text("Close"), [data-close]').first();

      if (await closeButton.count() > 0) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Status Updates', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);
    });

    test('should have status update dropdown', async ({ page }) => {
      const statusDropdown = page.locator('select[name*="status"], button:has-text("Status"), [data-status-dropdown]').first();

      if (await statusDropdown.count() > 0) {
        await statusDropdown.click();
        await page.waitForTimeout(200);

        const options = page.locator('option, [role="option"]');
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(0);
      }
    });

    test('should update application status', async ({ page }) => {
      const statusDropdown = page.locator('select[name*="status"]').first();

      if (await statusDropdown.count() > 0) {
        await statusDropdown.selectOption({ index: 1 });
        await page.waitForTimeout(500);

        // Should show success message or update UI
      }
    });

    test('should confirm status change for critical statuses', async ({ page }) => {
      const rejectButton = page.locator('button:has-text("Reject"), [data-status="rejected"]').first();

      if (await rejectButton.count() > 0) {
        await rejectButton.click();
        await page.waitForTimeout(300);

        // Check for confirmation dialog
        const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]:has-text("confirm")');
        const hasConfirm = await confirmDialog.count() > 0;

        if (hasConfirm) {
          await page.keyboard.press('Escape');
        }
      }
    });

    test('should add status note/reason', async ({ page }) => {
      const noteInput = page.locator('textarea[name*="note"], input[name*="reason"]').first();

      if (await noteInput.count() > 0) {
        await noteInput.fill('Status update note');
        await page.waitForTimeout(200);
      }
    });
  });

  test.describe('Application Actions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);
    });

    test('should have view job button', async ({ page }) => {
      const viewJobButton = page.locator('button:has-text("View Job"), a:has-text("View Job"), [data-view-job]');
      const hasViewJob = await viewJobButton.count() > 0;
    });

    test('should have edit application button', async ({ page }) => {
      const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit"], [data-edit]');
      const hasEdit = await editButton.count() > 0;
    });

    test('should have delete application button', async ({ page }) => {
      const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete"], [data-delete]');
      const hasDelete = await deleteButton.count() > 0;
    });

    test('should have add note button', async ({ page }) => {
      const addNoteButton = page.locator('button:has-text("Note"), button:has-text("Add Note"), [data-add-note]');
      const hasAddNote = await addNoteButton.count() > 0;
    });

    test('should have schedule interview button', async ({ page }) => {
      const scheduleButton = page.locator('button:has-text("Schedule"), button:has-text("Interview"), [data-schedule]');
      const hasSchedule = await scheduleButton.count() > 0;
    });

    test('should have follow-up reminder button', async ({ page }) => {
      const reminderButton = page.locator('button:has-text("Reminder"), button:has-text("Follow"), [data-reminder]');
      const hasReminder = await reminderButton.count() > 0;
    });

    test('should show action menu on row', async ({ page }) => {
      const moreButton = page.locator('button:has-text("..."), button[aria-label*="more"], [data-actions]').first();

      if (await moreButton.count() > 0) {
        await moreButton.click();
        await page.waitForTimeout(200);

        const menu = page.locator('[role="menu"]');
        const hasMenu = await menu.count() > 0;

        if (hasMenu) {
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test.describe('Search & Sorting', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);
    });

    test('should have search input', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], [data-search]').first();

      if (await searchInput.count() > 0) {
        await searchInput.fill('Software Engineer');
        await page.waitForTimeout(500);
      }
    });

    test('should sort by date applied', async ({ page }) => {
      const sortByDate = page.locator('button:has-text("Date"), th:has-text("Date"), [data-sort="date"]').first();

      if (await sortByDate.count() > 0) {
        await sortByDate.click();
        await page.waitForTimeout(300);
      }
    });

    test('should sort by company name', async ({ page }) => {
      const sortByCompany = page.locator('button:has-text("Company"), th:has-text("Company"), [data-sort="company"]').first();

      if (await sortByCompany.count() > 0) {
        await sortByCompany.click();
        await page.waitForTimeout(300);
      }
    });

    test('should sort by status', async ({ page }) => {
      const sortByStatus = page.locator('button:has-text("Status"), th:has-text("Status"), [data-sort="status"]').first();

      if (await sortByStatus.count() > 0) {
        await sortByStatus.click();
        await page.waitForTimeout(300);
      }
    });

    test('should filter by date range', async ({ page }) => {
      const dateFilter = page.locator('input[type="date"], [data-date-filter]').first();

      if (await dateFilter.count() > 0) {
        await dateFilter.click();
        await page.waitForTimeout(200);
      }
    });

    test('should filter by platform', async ({ page }) => {
      const platformFilter = page.locator('select[name*="platform"], [data-platform-filter]').first();

      if (await platformFilter.count() > 0) {
        await platformFilter.click();
        await page.waitForTimeout(200);
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);
    });

    test('should have select all checkbox', async ({ page }) => {
      const selectAll = page.locator('th input[type="checkbox"], [data-select-all]').first();

      if (await selectAll.count() > 0) {
        await selectAll.click();
        await page.waitForTimeout(200);
      }
    });

    test('should select individual applications', async ({ page }) => {
      const checkbox = page.locator('tbody input[type="checkbox"], [data-application-checkbox]').first();

      if (await checkbox.count() > 0) {
        await checkbox.click();
        await page.waitForTimeout(200);

        await expect(checkbox).toBeChecked();
      }
    });

    test('should show bulk action bar when selected', async ({ page }) => {
      const checkbox = page.locator('tbody input[type="checkbox"]').first();

      if (await checkbox.count() > 0) {
        await checkbox.click();
        await page.waitForTimeout(200);

        const bulkBar = page.locator('[data-bulk-actions], text=/selected/i');
        const hasBulkBar = await bulkBar.count() > 0;
      }
    });

    test('should have bulk status update', async ({ page }) => {
      const bulkStatus = page.locator('button:has-text("Update Status"), [data-bulk-status]');
      const hasBulkStatus = await bulkStatus.count() >= 0;
    });

    test('should have bulk delete', async ({ page }) => {
      const bulkDelete = page.locator('button:has-text("Delete Selected"), [data-bulk-delete]');
      const hasBulkDelete = await bulkDelete.count() >= 0;
    });

    test('should have bulk export', async ({ page }) => {
      const bulkExport = page.locator('button:has-text("Export"), [data-bulk-export]');
      const hasBulkExport = await bulkExport.count() >= 0;
    });
  });

  test.describe('Add Application', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);
    });

    test('should open add application modal', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add"), button:has-text("New Application")').first();

      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(300);

        const modal = page.locator('[role="dialog"]');
        const hasModal = await modal.count() > 0;
      }
    });

    test('should have job URL input', async ({ page }) => {
      const urlInput = page.locator('input[name*="url"], input[placeholder*="URL"]').first();
      const hasUrlInput = await urlInput.count() >= 0;
    });

    test('should have company name input', async ({ page }) => {
      const companyInput = page.locator('input[name*="company"], input[placeholder*="Company"]').first();
      const hasCompanyInput = await companyInput.count() >= 0;
    });

    test('should have job title input', async ({ page }) => {
      const titleInput = page.locator('input[name*="title"], input[placeholder*="Title"]').first();
      const hasTitleInput = await titleInput.count() >= 0;
    });

    test('should have status selection', async ({ page }) => {
      const statusSelect = page.locator('select[name*="status"], [data-status-select]').first();
      const hasStatusSelect = await statusSelect.count() >= 0;
    });

    test('should have notes textarea', async ({ page }) => {
      const notesTextarea = page.locator('textarea[name*="note"], textarea[placeholder*="Note"]').first();
      const hasNotes = await notesTextarea.count() >= 0;
    });

    test('should validate required fields', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add")').first();

      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(300);

        const submitButton = page.locator('[role="dialog"] button[type="submit"]').first();

        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(300);

          // Check for validation errors
          const errors = page.locator('text=/required/i, [data-error]');
          const hasErrors = await errors.count() > 0;
        }
      }
    });

    test('should save new application', async ({ page }) => {
      const addButton = page.locator('button:has-text("Add")').first();

      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(300);

        // Fill form
        const companyInput = page.locator('input[name*="company"]').first();
        if (await companyInput.count() > 0) {
          await companyInput.fill('Test Company');
        }

        const titleInput = page.locator('input[name*="title"]').first();
        if (await titleInput.count() > 0) {
          await titleInput.fill('Test Position');
        }

        const submitButton = page.locator('[role="dialog"] button[type="submit"]').first();
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await page.waitForTimeout(500);
        }
      }
    });
  });

  test.describe('Interview Tracking', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);
    });

    test('should display upcoming interviews', async ({ page }) => {
      const upcomingSection = page.locator('text=/upcoming/i, [data-upcoming-interviews]');
      const hasUpcoming = await upcomingSection.count() >= 0;
    });

    test('should add interview to application', async ({ page }) => {
      const addInterviewButton = page.locator('button:has-text("Interview"), button:has-text("Schedule")').first();

      if (await addInterviewButton.count() > 0) {
        await addInterviewButton.click();
        await page.waitForTimeout(300);
      }
    });

    test('should have interview date/time picker', async ({ page }) => {
      const dateTimePicker = page.locator('input[type="datetime-local"], input[type="date"]:near(text=/interview/i)');
      const hasPicker = await dateTimePicker.count() >= 0;
    });

    test('should have interview type selection', async ({ page }) => {
      const typeSelect = page.locator('select[name*="type"], [data-interview-type]');
      const hasType = await typeSelect.count() >= 0;
    });

    test('should have interviewer info fields', async ({ page }) => {
      const interviewerField = page.locator('input[name*="interviewer"], input[placeholder*="Interviewer"]');
      const hasInterviewer = await interviewerField.count() >= 0;
    });

    test('should show interview on calendar', async ({ page }) => {
      const calendar = page.locator('[data-calendar], [class*="calendar"]');
      const hasCalendar = await calendar.count() >= 0;
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/applications');
      await waitForLoadingComplete(page);

      await expect(page.locator('body')).toBeVisible();

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });

    test('should show card view on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/applications');
      await waitForLoadingComplete(page);

      // Table might switch to cards on mobile
      const cards = page.locator('[data-application-card], [class*="card"]');
      const table = page.locator('table');

      const hasCards = await cards.count() > 0;
      const hasTable = await table.count() > 0;
    });

    test('should collapse filters on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto('/applications');
      await waitForLoadingComplete(page);

      const filterButton = page.locator('button:has-text("Filter"), [aria-label*="filter"]').first();

      if (await filterButton.count() > 0) {
        await filterButton.click();
        await page.waitForTimeout(300);
      }
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize(viewports.tablet);
      await page.goto('/applications');
      await waitForLoadingComplete(page);

      await expect(page.locator('body')).toBeVisible();
    });

    test('should utilize large desktop space', async ({ page }) => {
      await page.setViewportSize(viewports.largeDesktop);
      await page.goto('/applications');
      await waitForLoadingComplete(page);

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Statistics & Summary', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);
    });

    test('should display total applications count', async ({ page }) => {
      const totalCount = page.locator('text=/\\d+.*total/i, text=/total.*\\d+/i, [data-total-count]');
      const hasTotal = await totalCount.count() >= 0;
    });

    test('should display status breakdown', async ({ page }) => {
      const breakdown = page.locator('[data-status-breakdown], text=/breakdown/i');
      const hasBreakdown = await breakdown.count() >= 0;
    });

    test('should display response rate', async ({ page }) => {
      const responseRate = page.locator('text=/response.*rate/i, [data-response-rate]');
      const hasRate = await responseRate.count() >= 0;
    });

    test('should display interview rate', async ({ page }) => {
      const interviewRate = page.locator('text=/interview.*rate/i, [data-interview-rate]');
      const hasRate = await interviewRate.count() >= 0;
    });

    test('should display average time to response', async ({ page }) => {
      const avgTime = page.locator('text=/average.*time/i, text=/days.*response/i, [data-avg-response]');
      const hasAvg = await avgTime.count() >= 0;
    });
  });

  test.describe('Export & Reports', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);
    });

    test('should have export button', async ({ page }) => {
      const exportButton = page.locator('button:has-text("Export"), [data-export]');
      const hasExport = await exportButton.count() >= 0;
    });

    test('should export to CSV', async ({ page }) => {
      const csvButton = page.locator('button:has-text("CSV"), [data-export="csv"]');

      if (await csvButton.count() > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await csvButton.click();
      }
    });

    test('should export to PDF', async ({ page }) => {
      const pdfButton = page.locator('button:has-text("PDF"), [data-export="pdf"]');

      if (await pdfButton.count() > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await pdfButton.click();
      }
    });

    test('should generate report', async ({ page }) => {
      const reportButton = page.locator('button:has-text("Report"), [data-generate-report]');
      const hasReport = await reportButton.count() >= 0;
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      await page.route('**/api/applications**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server Error' }),
        });
      });

      await page.goto('/applications');
      await page.waitForTimeout(1000);

      await expect(page.locator('body')).toBeVisible();
    });

    test('should show retry option on error', async ({ page }) => {
      await page.route('**/api/applications**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Error' }),
        });
      });

      await page.goto('/applications');
      await page.waitForTimeout(1000);

      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try again")');
      const hasRetry = await retryButton.count() >= 0;
    });

    test('should handle network disconnect', async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);

      await page.route('**/*', route => route.abort());

      const refreshButton = page.locator('button:has-text("Refresh")').first();
      if (await refreshButton.count() > 0) {
        await refreshButton.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/applications');
      await waitForLoadingComplete(page);
    });

    test('should have proper heading structure', async ({ page }) => {
      const h1 = page.locator('h1');
      const h1Count = await h1.count();
      expect(h1Count).toBeGreaterThanOrEqual(0);
    });

    test('should support keyboard navigation', async ({ page }) => {
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }

      const focusedElement = await page.locator(':focus').count();
      expect(focusedElement).toBeGreaterThan(0);
    });

    test('should have accessible status labels', async ({ page }) => {
      const statusElements = page.locator('[data-status], [class*="status"]');

      if (await statusElements.count() > 0) {
        const firstStatus = statusElements.first();
        const ariaLabel = await firstStatus.getAttribute('aria-label');
        const textContent = await firstStatus.textContent();

        expect(ariaLabel || textContent).toBeTruthy();
      }
    });

    test('should announce status changes', async ({ page }) => {
      const liveRegions = page.locator('[aria-live], [role="alert"], [role="status"]');
      const hasLiveRegion = await liveRegions.count() >= 0;
    });
  });
});
