'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

// ── Design tokens ──
const T = {
  bg: '#FFFFFF',
  border: '#E8ECF1',
  groupLabel: '#94A3B8',
  linkInactive: '#4A5568',
  linkHover: '#07101A',
  linkActiveBg: 'rgba(19,39,48,0.06)',
  linkActiveText: '#07101A',
  linkActiveBorder: '#3A6B84',
  iconInactive: '#94A3B8',
  iconActive: '#3A6B84',
  badgeBg: 'rgba(58,107,132,0.1)',
  badgeText: '#3A6B84',
  divider: '#F1F5F9',
  userNameText: '#0F172A',
  userEmailText: '#94A3B8',
};

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
      { label: 'Athlètes', href: '/athletes', icon: 'directions_run' },
      { label: 'Clients',  href: '/clients',  icon: 'business' },
      { label: 'Contrats', href: '/contrats', icon: 'gavel' },
    ],
  },
  {
    label: 'COMMERCIAL',
    items: [
      { label: 'Prestations', href: '/prestations', icon: 'category' },
      { label: 'Devis',       href: '/devis',       icon: 'request_quote' },
      { label: 'Factures',    href: '/factures',    icon: 'receipt_long' },
      { label: 'Règlements',  href: '/reglements',  icon: 'payments' },
    ],
  },
  {
    label: 'PROJETS',
    items: [
      { label: 'Projets', href: '/projets', icon: 'work' },
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

function MI({ name, size = 18, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span
      className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...style }}
    >
      {name}
    </span>
  );
}

function getUserFromStorage(): { name: string; email: string; initials: string; role: string } {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (raw) {
      const u = JSON.parse(raw);
      const name = u.name || u.email?.split('@')[0] || 'Administrateur';
      const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
      return { name, email: u.email || 'admin@ndembokin.cd', initials, role: u.role || 'ADMIN' };
    }
  } catch {}
  return { name: 'Administrateur', email: 'admin@ndembokin.cd', initials: 'AD', role: 'ADMIN' };
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur', MANAGER: 'Manager', COMMERCIAL: 'Commercial',
  COACH: 'Coach', COMPTABLE: 'Comptable',
};

function handleLogout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

function NavLink({
  href, icon, label, active, onClick,
}: {
  href: string; icon: string; label: string;
  active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 8,
        marginBottom: 1,
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        color: active ? T.linkActiveText : T.linkInactive,
        background: active ? T.linkActiveBg : 'transparent',
        borderLeft: active ? `3px solid ${T.linkActiveBorder}` : '3px solid transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.background = '#F8FAFC';
          (e.currentTarget as HTMLAnchorElement).style.color = T.linkHover;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
          (e.currentTarget as HTMLAnchorElement).style.color = T.linkInactive;
        }
      }}
    >
      <MI
        name={icon}
        size={17}
        style={{ color: active ? T.iconActive : T.iconInactive }}
      />
      <span style={{ flex: 1 }}>{label}</span>
    </Link>
  );
}

function NavBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [user, setUser] = useState({ name: 'Administrateur', email: 'admin@ndembokin.cd', initials: 'AD', role: 'ADMIN' });
  useEffect(() => { setUser(getUserFromStorage()); }, []);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Nav groups */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: T.groupLabel,
              letterSpacing: '1.8px', textTransform: 'uppercase',
              padding: '0 10px', marginBottom: 4,
            }}>
              {group.label}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
                onClick={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Paramètres */}
      <div style={{ padding: '6px 10px' }}>
        <div style={{ height: 1, background: T.divider, marginBottom: 6 }} />
        <NavLink
          href="/parametres"
          icon="settings"
          label="Paramètres"
          active={pathname.startsWith('/parametres')}
          onClick={onNavigate}
        />
      </div>

      {/* Profil utilisateur */}
      <div style={{
        padding: '10px 14px 14px',
        borderTop: `1px solid ${T.divider}`,
        background: '#FAFBFC',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg,#132730,#3A6B84)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#FCD116', flexShrink: 0,
          }}>
            {user.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.userNameText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: 10.5, color: T.userEmailText, marginTop: 1 }}>
              {ROLE_LABELS[user.role] || user.role}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 7,
              border: 'none', background: 'transparent', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <MI name="logout" size={15} style={{ color: '#94A3B8' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        background: '#07101A', borderRadius: 10,
        padding: '5px 7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <img src="/logo.png" alt="NKC" style={{ height: 26, width: 'auto', display: 'block' }} />
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#07101A', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
          Ndembo Kin
        </div>
        <div style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#3A6B84', marginTop: 1 }}>
          CONNECT SARL
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: T.bg,
      borderRight: `1px solid ${T.border}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }} className="hidden md:flex">
      <div style={{ padding: '16px 14px', borderBottom: `1px solid ${T.border}` }}>
        <Brand />
      </div>
      <NavBody />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header style={{
        background: '#07101A', borderBottom: '1px solid rgba(252,209,22,0.1)',
        padding: '0 12px', display: 'flex', alignItems: 'center', height: 56, gap: 12, flexShrink: 0,
      }} className="md:hidden sticky top-0 z-30">
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: '#fff' }}
        >
          <Menu size={22} />
        </button>
        <Brand />
      </header>

      {open && (
        <div className="md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: 240,
            background: T.bg, boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Brand />
              <button
                onClick={() => setOpen(false)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F1F5F9', cursor: 'pointer' }}
              >
                <X size={17} color="#64748B" />
              </button>
            </div>
            <NavBody onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
