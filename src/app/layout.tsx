import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'VocabForest — iPhone Glass UI Vocabulary & Word Builder',
  description:
    'An ultra-modern, motion-infused vocabulary builder crafted with iPhone Liquid Glassmorphism, real-time theme engines, audio pronunciation, and local database persistence.',
  keywords: ['vocabulary', 'words', 'definitions', 'glassmorphism', 'iOS UI', 'learning', 'flashcards'],
  authors: [{ name: 'VocabForest' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="manus-midnight">
      <body>{children}</body>
    </html>
  );
}
