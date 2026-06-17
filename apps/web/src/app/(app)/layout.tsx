import { Sidebar, MobileNav } from '@/components/layout/Sidebar';
import { OfflineBanner } from '@/components/layout/OfflineBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F0F2F5]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <OfflineBanner />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
