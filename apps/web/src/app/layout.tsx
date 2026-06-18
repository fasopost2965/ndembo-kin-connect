import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ndembo Kin Connect CRM',
  description: 'Plateforme de gestion — Cabinet de management sportif',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#07101A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
