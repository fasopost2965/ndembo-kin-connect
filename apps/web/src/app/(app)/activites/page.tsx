'use client';

import { useEffect, useMemo, useState } from 'react';
import { activitesApi } from '@/lib/api';

function MI({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  return (
    <span
      className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}
    >
      {name}
    </span>
  );
}

// Mapping type d'activité CRM → icône/couleur + libellé
const TYPE_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  APPEL:     { icon: 'call',   color: '#3A6B84', bg: '#EFF6FF', label: 'Appel' },
  RENCONTRE: { icon: 'groups', color: '#059669', bg: '#F0FDF4', label: 'Rencontre' },
  EMAIL:     { icon: 'mail',   color: '#6D28D9', bg: '#F5F3FF', label: 'E-mail' },
};

interface Activite { id: string; type: string; text: string; user: string; time: string; date: Date }

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('');
}

const AVATAR_PALETTE = ['#3A6B84', '#1D4ED8', '#059669', '#B45309', '#6D28D9'];
function avatarColor(name: string) {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h}h`;
  const j = Math.floor(h / 24);
  if (j < 7) return `Il y a ${j} j`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ActivitesPage() {
  const [data, setData] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    activitesApi.list()
      .then(({ data }) => {
        const rows: Activite[] = (data || []).map((a: any) => {
          const meta = TYPE_META[a.type] ?? TYPE_META['APPEL'];
          const client = a.client?.nom ?? 'Client';
          const date = new Date(a.dateActivite);
          return {
            id: a.id,
            type: a.type,
            text: a.resultat || `${meta.label} — ${client}`,
            user: a.user?.name ?? 'Utilisateur',
            time: relativeTime(date),
            date,
          };
        });
        setData(rows);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? data.filter(a => a.text.toLowerCase().includes(q) || a.user.toLowerCase().includes(q)) : data;
  }, [data, search]);

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>

      {/* TOPBAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', padding: '0 28px', display: 'flex', alignItems: 'center', height: 60, gap: 16, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Activités</span>
          <span style={{ fontSize: 12, fontWeight: 700, background: '#07101A', color: '#FCD116', padding: '2px 9px', borderRadius: 20 }}>{data.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex', zIndex: 1 }}>
              <MI name="search" size={17} color="#94A3B8" />
            </span>
            <input
              type="text"
              placeholder="Filtrer les activités…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '9px 14px 9px 38px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC', width: 220 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div style={{ padding: '24px 28px 32px', flex: 1, maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Journal d'activités</span>
            <span style={{ fontSize: 12, color: '#94A3B8', marginLeft: 8 }}>Aujourd'hui</span>
          </div>
          <div style={{ padding: '8px 22px' }}>
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Chargement…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <MI name="history" size={40} color="#CBD5E1" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginTop: 8 }}>Aucune activité</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Les interactions clients enregistrées apparaîtront ici.</div>
              </div>
            ) : filtered.map((a, i) => {
              const meta = TYPE_META[a.type] ?? TYPE_META['APPEL'];
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: i < filtered.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: meta.bg, border: `1px solid ${meta.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MI name={meta.icon} size={18} color={meta.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: '#334155', lineHeight: 1.4 }}>{a.text}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: avatarColor(a.user), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                        {initials(a.user)}
                      </div>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{a.user}</span>
                      <span style={{ fontSize: 11, color: '#CBD5E1' }}>·</span>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>{a.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
