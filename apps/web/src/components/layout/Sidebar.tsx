'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCheck, FileText,
  Receipt, FolderKanban, ScrollText, Activity, BarChart3,
  Settings, LogOut, Menu, X,
} from 'lucide-react';

const NAV = [
  {
    group: 'Principal',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Athlètes', href: '/athletes', icon: UserCheck },
      { label: 'Clients', href: '/clients', icon: Users },
    ],
  },
  {
    group: 'Commercial',
    items: [
      { label: 'Devis', href: '/devis', icon: FileText },
      { label: 'Factures', href: '/factures', icon: Receipt },
    ],
  },
  {
    group: 'Opérations',
    items: [
      { label: 'Projets', href: '/projets', icon: FolderKanban },
      { label: 'Contrats', href: '/contrats', icon: ScrollText },
    ],
  },
  {
    group: 'Suivi',
    items: [
      { label: 'Activités', href: '/activites', icon: Activity },
      { label: 'Rapports', href: '/rapports', icon: BarChart3 },
    ],
  },
];

function handleLogout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

/** Shared nav body (links + footer), reused by the desktop sidebar and the
 *  mobile drawer. `onNavigate` lets the drawer close on selection. */
function NavBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const linkCls = (active: boolean) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-[#DAA520]/15 text-[#DAA520]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
    }`;

  return (
    <>
      <nav className="flex-1 py-4 px-2 space-y-6 overflow-y-auto">
        {NAV.map((section) => (
          <div key={section.group}>
            <div className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-2 mb-2">
              {section.group}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={onNavigate} className={linkCls(active)}>
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-white/5 space-y-0.5">
        <Link
          href="/parametres"
          onClick={onNavigate}
          className={linkCls(pathname.startsWith('/parametres'))}
        >
          <Settings size={16} /> Paramètres
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-white rounded-xl p-1.5">
        <img src="/logo.png" alt="NKC" className="h-8 w-auto" />
      </div>
      <div>
        <div className="text-white font-bold text-xs leading-tight">Ndembo Kin</div>
        <div className="text-[#DAA520] text-[10px] font-semibold">Connect CRM</div>
      </div>
    </div>
  );
}

/** Desktop sidebar — hidden below md. */
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-[195px] min-h-screen bg-[#0F172A] flex-col border-r border-white/5 shrink-0">
      <div className="p-4 border-b border-white/5"><Brand /></div>
      <NavBody />
    </aside>
  );
}

/** Mobile top bar with a burger that opens a left slide-over drawer. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="md:hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/5 bg-[#0F172A] px-3">
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"
        >
          <Menu size={22} />
        </button>
        <Brand />
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-[#0F172A] shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 p-4">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            <NavBody onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
