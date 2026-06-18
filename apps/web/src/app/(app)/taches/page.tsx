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

type Statut = 'TODO' | 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE';

const STATUT_META: Record<Statut, { label: string; bg: string; c: string; dot: string }> = {
  TODO:       { label: 'À faire',    bg: '#F1F5F9', c: '#64748B', dot: '#94A3B8' },
  EN_ATTENTE: { label: 'En attente', bg: '#FEF9EE', c: '#C9960C', dot: '#F59E0B' },
  EN_COURS:   { label: 'En cours',   bg: '#EFF6FF', c: '#2563EB', dot: '#2563EB' },
  TERMINE:    { label: 'Terminé',    bg: '#F0FDF4', c: '#059669', dot: '#059669' },
};

const PRIO_META: Record<string, { bg: string; c: string }> = {
  Haute:   { bg: '#FFF1F2', c: '#BE123C' },
  Moyenne: { bg: '#FEF9EE', c: '#B45309' },
  Basse:   { bg: '#F1F5F9', c: '#64748B' },
};

const AVATAR_COLORS = ['#3A6B84', '#1D4ED8', '#059669', '#B45309', '#6D28D9'];

const DATA: { id: number; titre: string; projet: string; assignee: string; priorite: string; echeance: string; statut: Statut }[] = [
  { id: 1, titre: 'Préparer le dossier de transfert J. Mbala',   projet: 'Transfert TP Mazembe',  assignee: 'Jean-Pierre K.',  priorite: 'Haute',   echeance: 'Demain',      statut: 'EN_COURS'   },
  { id: 2, titre: 'Signer le contrat de sponsoring MTN',         projet: 'Partenariat MTN RDC',   assignee: 'Amadou S.',       priorite: 'Haute',   echeance: '18 juin',     statut: 'EN_ATTENTE' },
  { id: 3, titre: 'Organiser la séance photo officielle',        projet: 'Image AS Vita',         assignee: 'Marie-Claire N.', priorite: 'Moyenne', echeance: '22 juin',     statut: 'TODO'       },
  { id: 4, titre: 'Valider le budget tournoi présaison',         projet: 'Tournoi présaison',     assignee: 'Esther B.',       priorite: 'Moyenne', echeance: '25 juin',     statut: 'EN_COURS'   },
  { id: 5, titre: "Relancer facture FAC-2026-0038",              projet: 'Recouvrement',          assignee: 'Esther B.',       priorite: 'Haute',   echeance: "Aujourd'hui", statut: 'EN_COURS'   },
  { id: 6, titre: 'Mettre à jour les fiches de 5 athlètes',     projet: 'Base de données',       assignee: 'Didier M.',       priorite: 'Basse',   echeance: '30 juin',     statut: 'TODO'       },
  { id: 7, titre: 'Planifier la session de coaching tactique',   projet: 'Coaching AS Vita',      assignee: 'Didier M.',       priorite: 'Moyenne', echeance: '12 juin',     statut: 'TERMINE'    },
  { id: 8, titre: 'Envoyer le devis DEV-2026-014',              projet: 'Pipeline AS Vita',      assignee: 'Marie-Claire N.', priorite: 'Basse',   echeance: '10 juin',     statut: 'TERMINE'    },
];

const HEADERS = ['Tâche', 'Assigné à', 'Priorité', 'Échéance', 'Statut'];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('');
}

export default function TachesPage() {
  const [search, setSearch]           = useState('');
  const [filterPrio, setFilterPrio]   = useState('');

  const filtered = DATA.filter(t => {
    const q = search.toLowerCase();
    return (!q || t.titre.toLowerCase().includes(q) || t.projet.toLowerCase().includes(q))
      && (!filterPrio || t.priorite === filterPrio);
  });

  const cnt = (s: Statut) => DATA.filter(t => t.statut === s).length;
  const stats = [
    { label: 'À faire',    value: cnt('TODO'),       dot: '#94A3B8' },
    { label: 'En cours',   value: cnt('EN_COURS'),   dot: '#2563EB' },
    { label: 'En attente', value: cnt('EN_ATTENTE'), dot: '#F59E0B' },
    { label: 'Terminées',  value: cnt('TERMINE'),    dot: '#059669' },
  ];

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>

      {/* TOPBAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', padding: '0 28px', display: 'flex', alignItems: 'center', height: 60, gap: 16, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Tâches</span>
          <span style={{ fontSize: 12, fontWeight: 700, background: '#07101A', color: '#FCD116', padding: '2px 9px', borderRadius: 20 }}>{DATA.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex', zIndex: 1 }}>
              <MI name="search" size={17} color="#94A3B8" />
            </span>
            <input
              type="text"
              placeholder="Rechercher une tâche…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '9px 14px 9px 38px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC', width: 220 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={filterPrio}
              onChange={e => setFilterPrio(e.target.value)}
              style={{ padding: '9px 32px 9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">Toutes priorités</option>
              <option value="Haute">Haute</option>
              <option value="Moyenne">Moyenne</option>
              <option value="Basse">Basse</option>
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
            Nouvelle tâche
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '20px 28px 0' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 12, height: 12, borderRadius: 4, background: s.dot, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 1 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div style={{ padding: '16px 28px 32px', flex: 1 }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2.6fr 1.4fr 1fr 1.2fr 1.1fr', gap: 8, padding: '11px 22px', background: '#F8FAFC', borderBottom: '1px solid #E8ECF1' }}>
            {HEADERS.map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
            ))}
          </div>
          {/* Rows */}
          {filtered.length === 0 ? (
            <div style={{ padding: '56px 20px', textAlign: 'center' }}>
              <MI name="search_off" size={42} color="#CBD5E1" />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginTop: 10 }}>Aucune tâche trouvée</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Essayez d'ajuster la recherche ou le filtre de priorité.</div>
            </div>
          ) : (
            filtered.map((t, i) => {
              const st = STATUT_META[t.statut];
              const prio = PRIO_META[t.priorite] ?? PRIO_META['Basse'];
              const done = t.statut === 'TERMINE';
              const urgent = t.echeance === "Aujourd'hui" || t.echeance === 'Demain';
              return (
                <div
                  key={t.id}
                  style={{ display: 'grid', gridTemplateColumns: '2.6fr 1.4fr 1fr 1.2fr 1.1fr', gap: 8, padding: '13px 22px', borderBottom: '1px solid #F8FAFC', alignItems: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  {/* Tâche */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: done ? '#059669' : '#fff', border: done ? 'none' : '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {done && <MI name="check" size={14} color="#fff" />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: done ? '#94A3B8' : '#0F172A', textDecoration: done ? 'line-through' : 'none' }}>{t.titre}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{t.projet}</div>
                    </div>
                  </div>
                  {/* Assigné */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {initials(t.assignee)}
                    </div>
                    <span style={{ fontSize: 12, color: '#475569' }}>{t.assignee}</span>
                  </div>
                  {/* Priorité */}
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: prio.bg, color: prio.c, padding: '3px 9px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' }}>
                      {t.priorite}
                    </span>
                  </div>
                  {/* Échéance */}
                  <div style={{ fontSize: 12, color: urgent && !done ? '#BE123C' : '#64748B', fontWeight: 600 }}>{t.echeance}</div>
                  {/* Statut */}
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: st.bg, color: st.c, padding: '3px 9px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
