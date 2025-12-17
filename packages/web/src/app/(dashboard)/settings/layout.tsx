/**
 * Settings Layout
 *
 * @description Layout for settings pages - forces dynamic rendering
 */

// Force dynamic rendering for pages with browser APIs
export const dynamic = 'force-dynamic';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
