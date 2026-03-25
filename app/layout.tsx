import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'This — Point at anything. Ask Claude.',
  description: 'This adds a floating AI panel to your cursor. Hold ⌘, point at anything on your Mac, and ask Claude about it.',
  openGraph: {
    title: 'This',
    description: 'Point at anything on your screen. Ask Claude about it.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
