'use client';

import { useState } from 'react';

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

type JalonStatut = 'ATTEINT' | 'EN_COURS' | 'A_VENIR';

const JALON_META: Record<JalonStatut, { label: string; bg: string; c: string; dotBg: string; dotIcon: string }> = {
  ATTEINT:  { label: 'Atteint',  bg: '#F0FDF4', c: '#059669', dotBg: '#059669', dotIcon: 'check' },
  EN_COURS: { label: 'En cours', bg: '#EFF6FF', c: '#2563EB', dotBg: '#2563EB', dotIcon: 'pending' },
  A_VENIR:  { label: 'À venir',  bg: '#F1F5F9', c: '#94A3B8', dotBg: '#E2E8F0', dotIcon: '' },
};

const PROJECT_META: Record<string, { icon: string; color: string; bg: string }> = {
  'Transfert J. Mbala':        { icon: 'swap_horiz',    color: '#2563EB', bg: '#EFF6FF' },
  'Tournoi présaison AS Vita': { icon: 'emoji_events',  color: '#B45309', bg: '#FEF9EE' },
  'Partenariat MTN RDC':       { icon: 'handshake',     color: '#059669', bg: '#F0FDF4' },
};

const DATA = [
  {
    nom: 'Transfert J. Mbala', client: 'TP Mazembe',
    jalons: [
      { titre: 'Accord de principe signé',          date: '2 mai 2026',                   statut: 'ATTEINT'  as JalonStatut },
      { titre: 'Visite médicale validée',           date: '18 mai 2026',                  statut: 'ATTEINT'  as JalonStatut },
      { titre: 'Négociation des termes financiers', date: 'En cours · échéance 20 juin',  statut: 'EN_COURS' as JalonStatut },
      { titre: 'Signature du contrat définitif',   date: 'Prévu 30 juin',                statut: 'A_VENIR'  as JalonStatut },
    ],
  },
  {
    nom: 'Tournoi présaison AS Vita', client: 'AS Vita Club',
    jalons: [
      { titre: 'Budget validé',                       date: '10 mai 2026',                  statut: 'ATTEINT'  as JalonStatut },
      { titre: 'Réservation du stade',                date: 'En cours · échéance 22 juin',  statut: 'EN_COURS' as JalonStatut },
      { titre: 'Confirmation des équipes invitées',   date: 'Prévu 28 juin',                statut: 'A_VENIR'  as JalonStatut },
      { titre: 'Couverture média & sponsors',         date: 'Prévu 5 juil.',                statut: 'A_VENIR'  as JalonStatut },
    ],
  },
  {
    nom: 'Partenariat MTN RDC', client: 'MTN RDC',
    jalons: [
      { titre: 'Proposition commerciale envoyée',   date: '1 juin 2026',   statut: 'ATTEINT' as JalonStatut },
      { titre: 'Devis validé par le sponsor',       date: '10 juin 2026',  statut: 'ATTEINT' as JalonStatut },
      { titre: 'Signature du contrat de sponsoring', date: 'Prévu 18 juin', statut: 'A_VENIR' as JalonStatut },
    ],
  },
];

const totalCount = DATA.reduce((a, p) => a + p.jalons.length, 0);

export default function JalonsPage() {
  const [filterProjet, setFilterProjet] = useState('');

  const filtered = filterProjet ? DATA.filter(p => p.nom === filterProjet) : DATA;

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>

      {/* TOPBAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', padding: '0 28px', display: 'flex', alignItems: 'center', height: 60, gap: 16, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Jalons</span>
          <span style={{ fontSize: 12, fontWeight: 700, background: '#07101A', color: '#FCD116', padding: '2px 9px', borderRadius: 20 }}>{totalCount}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <select
              value={filterProjet}
              onChange={e => setFilterProjet(e.target.value)}
              style={{ padding: '9px 32px 9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC', appearance: 'none', cursor: 'pointer', minWidth: 200 }}
            >
              <option value="">Tous les projets</option>
              {DATA.map(p => <option key={p.nom} value={p.nom}>{p.nom}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex' }}>
              <MI name="expand_more" size={15} color="#94A3B8" />
            </span>
          </div>
          <button
            style={{ padding: '9px 18px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#132730')}
            onMouseLeave={e => (e.currentTarget.style.background = '#07101A')}
          >
            <MI name="add" size={16} color="#FCD116" />
            Nouveau jalon
          </button>
        </div>
      </div>

      {/* PROJECTS */}
      <div style={{ padding: '22px 28px 32px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {filtered.map(p => {
          const meta = PROJECT_META[p.nom] ?? { icon: 'flag', color: '#3A6B84', bg: '#EFF6FF' };
          const done = p.jalons.filter(j => j.statut === 'ATTEINT').length;
          const pct = Math.round(done / p.jalons.length * 100);

          return (
            <div key={p.nom} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              {/* Project header */}
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MI name={meta.icon} size={20} color={meta.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{p.nom}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{p.client} · {done}/{p.jalons.length} jalons atteints</div>
                </div>
                <div style={{ width: 140 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: meta.color }}>{pct}%</span>
                  </div>
                  <div style={{ height: 7, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: meta.color, borderRadius: 4 }} />
                  </div>
                </div>
              </div>

              {/* Jalons timeline */}
              <div style={{ padding: '18px 24px' }}>
                <div style={{ position: 'relative', paddingLeft: 26 }}>
                  <div style={{ position: 'absolute', left: 9, top: 6, bottom: 6, width: 2, background: '#E8ECF1' }} />
                  {p.jalons.map((j, ji) => {
                    const jm = JALON_META[j.statut];
                    return (
                      <div key={ji} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                        {/* Timeline dot */}
                        <div style={{ position: 'absolute', left: -26, width: 20, height: 20, borderRadius: '50%', background: jm.dotBg, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 0 2px ${jm.dotBg}` }}>
                          {jm.dotIcon && <MI name={jm.dotIcon} size={12} color="#fff" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: j.statut === 'A_VENIR' ? '#94A3B8' : '#334155' }}>{j.titre}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{j.date}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, background: jm.bg, color: jm.c, padding: '3px 10px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' }}>
                          {jm.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
