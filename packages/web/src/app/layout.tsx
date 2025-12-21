import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

// System font stack CSS class (avoiding Google Fonts network dependency during build)
const systemFontClass = 'font-sans';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'JobApplier - Automated Job Application Platform',
    template: '%s | JobApplier',
  },
  description: 'Streamline your job search with AI-powered job hunting and automated application tracking.',
  keywords: ['job search', 'job applications', 'career', 'job hunting', 'automation'],
  authors: [{ name: 'JobApplier Team' }],
  creator: 'JobApplier',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://jobapplier.app',
    title: 'JobApplier - Automated Job Application Platform',
    description: 'Streamline your job search with AI-powered job hunting and automated application tracking.',
    siteName: 'JobApplier',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobApplier - Automated Job Application Platform',
    description: 'Streamline your job search with AI-powered job hunting and automated application tracking.',
    creator: '@jobapplier',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={systemFontClass}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
