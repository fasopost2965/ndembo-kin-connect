'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

const LAST_ONLINE_KEY = 'nkc:lastOnline';

/**
 * Shows a banner when the browser goes offline (frequent in Kinshasa). The PWA
 * runtimeCaching (NetworkFirst) keeps serving the last Athlètes/Clients lists;
 * this tells the user the data may be stale and from when.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [since, setSince] = useState<string | null>(null);

  useEffect(() => {
    const markOnline = () => {
      localStorage.setItem(LAST_ONLINE_KEY, new Date().toISOString());
      setOffline(false);
    };
    const markOffline = () => {
      setSince(localStorage.getItem(LAST_ONLINE_KEY));
      setOffline(true);
    };

    if (typeof navigator !== 'undefined' && navigator.onLine) markOnline();
    else markOffline();

    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    return () => {
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, []);

  if (!offline) return null;

  const label = since
    ? `Mode hors-ligne — données du ${new Date(since).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`
    : 'Mode hors-ligne — affichage des dernières données en cache';

  return (
    <div className="flex items-center justify-center gap-2 bg-[#FEF9EE] px-4 py-2 text-sm font-medium text-[#92400E] border-b border-[#FDE68A]">
      <WifiOff size={15} />
      {label}
    </div>
  );
}
