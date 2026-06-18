'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

// ── Navigation groups (source: ROUTES.md §4 — Sidebar order) ──
const NAV_GROUPS = [
  {
    label: 'PILOTAGE',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
      { label: 'Rapports',  href: '/rapports',  icon: 'bar_chart' },
    ],
  },
  {
    label: 'CRM',
    items: [
      { label: 'Athlètes', href: '/athletes', icon: 'directions_run', badge: '45' },
      { label: 'Clients',  href: '/clients',  icon: 'business',       badge: '28' },
      { label: 'Contrats', href: '/contrats', icon: 'gavel' },
    ],
  },
  {
    label: 'COMMERCIAL',
    items: [
      { label: 'Prestations', href: '/prestations', icon: 'category' },
      { label: 'Devis',       href: '/devis',       icon: 'request_quote', badge: '12' },
      { label: 'Factures',    href: '/factures',    icon: 'receipt_long' },
      { label: 'Règlements',  href: '/reglements',  icon: 'payments' },
    ],
  },
  {
    label: 'PROJETS',
    items: [
      { label: 'Projets', href: '/projets', icon: 'work',     badge: '8' },
      { label: 'Tâches',  href: '/taches',  icon: 'task_alt' },
      { label: 'Jalons',  href: '/jalons',  icon: 'flag' },
    ],
  },
  {
    label: 'ACTIVITÉS',
    items: [
      { label: 'Activités', href: '/activites', icon: 'history' },
    ],
  },
];

// Icône Material Icons Outlined inline
function MI({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <span
      className={`material-icons-outlined select-none leading-none ${className}`}
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      {name}
    </span>
  );
}

function getUserFromStorage(): { name: string; email: string; initials: string } {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (raw) {
      const u = JSON.parse(raw);
      const name = u.name || u.email?.split('@')[0] || 'Administrateur';
      const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
      return { name, email: u.email || 'admin@ndembokin.cd', initials };
    }
  } catch {}
  return { name: 'Administrateur', email: 'admin@ndembokin.cd', initials: 'AD' };
}

function handleLogout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

/** Lien de navigation — actif ou inactif */
function NavLink({
  href, icon, label, badge, active, onClick,
}: {
  href: string; icon: string; label: string; badge?: string;
  active: boolean; onClick?: () => void;
}) {
  const base = 'flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] mb-0.5 cursor-pointer transition-colors text-[13px] font-medium';
  const activeStyle = 'bg-[rgba(252,209,22,0.08)] text-[#FCD116] font-semibold border-l-2 border-[#DAA520] pl-[9px]';
  const inactiveStyle = 'text-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(255,255,255,0.7)]';

  return (
    <Link href={href} onClick={onClick} className={`${base} ${active ? activeStyle : inactiveStyle}`}>
      <MI
        name={icon}
        size={18}
        className={active ? 'text-[#FCD116]' : 'text-[rgba(255,255,255,0.3)]'}
      />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold bg-[rgba(252,209,22,0.12)] text-[rgba(252,209,22,0.7)] px-1.5 py-0.5 rounded-lg">
          {badge}
        </span>
      )}
    </Link>
  );
}

/** Corps de la navigation (partagé sidebar desktop + drawer mobile) */
function NavBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = getUserFromStorage();

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

  return (
    <>
      {/* Nav groups */}
      <nav className="flex-1 px-2.5 py-3.5 overflow-y-auto dark-scroll space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="text-[9px] font-bold text-[rgba(255,255,255,0.2)] tracking-[2px] uppercase px-2.5 mb-1">
              {group.label}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                active={isActive(item.href)}
                onClick={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Paramètres */}
      <div className="px-2.5 pb-1.5">
        <div className="h-px bg-[rgba(252,209,22,0.07)] mx-2 mb-2" />
        <NavLink
          href="/parametres"
          icon="settings"
          label="Paramètres"
          active={pathname.startsWith('/parametres')}
          onClick={onNavigate}
        />
      </div>

      {/* Profil utilisateur */}
      <div className="px-4 py-3 border-t border-[rgba(252,209,22,0.07)]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-[#07101A] shrink-0"
            style={{ background: 'linear-gradient(135deg,#DAA520,#FCD116)' }}
          >
            {user.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-[rgba(255,255,255,0.7)] truncate">{user.name}</div>
            <div className="text-[10px] text-[rgba(255,255,255,0.25)] truncate">{user.email}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-[rgba(255,255,255,0.08)] transition-colors"
          >
            <MI name="logout" size={14} className="text-[rgba(255,255,255,0.2)] hover:text-[rgba(255,255,255,0.5)]" />
          </button>
        </div>
      </div>
    </>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-white rounded-[10px] px-1.5 py-1 flex items-center justify-center shrink-0">
        <img src="/logo.png" alt="NKC" className="h-7 w-auto" />
      </div>
      <div>
        <div className="text-white font-extrabold text-[14px] leading-tight tracking-[-0.2px]">Ndembo Kin</div>
        <div
          className="text-[9px] font-bold tracking-[1.5px] uppercase mt-0.5"
          style={{ color: 'rgba(252,209,22,0.5)' }}
        >
          CONNECT SARL
        </div>
      </div>
    </div>
  );
}

/** Sidebar desktop — masquée en dessous de md */
export function Sidebar() {
  return (
    <aside
      className="hidden md:flex flex-col shrink-0"
      style={{
        width: 252,
        minHeight: '100vh',
        background: '#07101A',
        borderRight: '1px solid rgba(252,209,22,0.08)',
      }}
    >
      <div className="px-4 py-5" style={{ borderBottom: '1px solid rgba(252,209,22,0.07)' }}>
        <Brand />
      </div>
      <NavBody />
    </aside>
  );
}

/** Mobile — barre du haut + drawer slide-over */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header
        className="md:hidden sticky top-0 z-30 flex h-14 items-center gap-3 px-3"
        style={{ background: '#07101A', borderBottom: '1px solid rgba(252,209,22,0.08)' }}
      >
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"
        >
          <Menu size={22} />
        </button>
        <Brand />
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div
            className="absolute inset-y-0 left-0 flex flex-col shadow-xl"
            style={{ width: 252, background: '#07101A' }}
          >
            <div
              className="flex items-center justify-between px-4 py-5"
              style={{ borderBottom: '1px solid rgba(252,209,22,0.07)' }}
            >
              <Brand />
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            <NavBody onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
