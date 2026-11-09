import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Universal AI Builder',
  description: 'Build mobile and web applications with AI-powered assistance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
