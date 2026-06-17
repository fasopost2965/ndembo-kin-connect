import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ndembo Kin Connect CRM',
  description: 'Plateforme de gestion — Cabinet de management sportif',
  manifest: '/manifest.json',
  themeColor: '#0F172A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
