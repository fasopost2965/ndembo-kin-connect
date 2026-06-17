'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, UserCheck, Briefcase, FileText,
  Receipt, CreditCard, FolderKanban, CheckSquare, Milestone,
  ScrollText, Activity, BarChart3, Settings, LogOut,
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

export function Sidebar() {
  const pathname = usePathname();

  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  return (
    <aside className="w-[195px] min-h-screen bg-[#0F172A] flex flex-col border-r border-white/5 shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl p-1.5">
            <img src="/logo.png" alt="NKC" className="h-8 w-auto" />
          </div>
          <div>
            <div className="text-white font-bold text-xs leading-tight">Ndembo Kin</div>
            <div className="text-[#DAA520] text-[10px] font-semibold">Connect CRM</div>
          </div>
        </div>
      </div>

      {/* Nav */}
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
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#DAA520]/15 text-[#DAA520]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/5 space-y-0.5">
        <Link
          href="/parametres"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname.startsWith('/parametres')
              ? 'bg-[#DAA520]/15 text-[#DAA520]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Settings size={15} />
          Paramètres
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut size={15} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
