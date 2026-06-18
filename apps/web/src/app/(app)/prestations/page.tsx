'use client';

import { useEffect, useState } from 'react';
import { prestationsApi } from '@/lib/api';

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

// Mapping des types Prisma → libellé/couleur/icône d'affichage
const CATS: Record<string, { color: string; bg: string; icon: string }> = {
  Gestion_carriere: { color: '#2563EB', bg: '#EFF6FF', icon: 'badge' },
  Conseil:          { color: '#6D28D9', bg: '#F5F3FF', icon: 'sports' },
  Camp:             { color: '#059669', bg: '#F0FDF4', icon: 'travel_explore' },
  Stage:            { color: '#B45309', bg: '#FEF9EE', icon: 'school' },
};
const CAT_LABEL: Record<string, string> = {
  Gestion_carriere: 'Gestion de carrière',
  Conseil: 'Conseil',
  Camp: 'Camp',
  Stage: 'Stage',
};

interface Prestation {
  id: string;
  nom: string;
  categorie: string;       // <- type API
  prix: number;            // <- prixBase
  unite: string;           // <- dureeEstimee
  description: string;
}

function fmtPrix(n: number) {
  return '$' + n.toLocaleString('fr-FR');
}

const CAT_FILTER_ACTIVE: React.CSSProperties = {
  padding: '7px 15px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid transparent',
  background: '#07101A', color: '#FCD116',
};
const CAT_FILTER_IDLE: React.CSSProperties = {
  padding: '7px 15px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid #E2E8F0',
  background: '#fff', color: '#475569',
};

export default function PrestationsPage() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [data, setData] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    prestationsApi.list(false)
      .then(({ data }) => {
        const rows: Prestation[] = (data || []).map((p: any) => ({
          id: p.id,
          nom: p.nom,
          categorie: p.type,
          prix: p.prixBase ?? 0,
          unite: p.dureeEstimee ? `/ ${p.dureeEstimee}` : '',
          description: p.description ?? '',
        }));
        setData(rows);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.nom.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      && (!cat || p.categorie === cat);
  });

  const catFilters = [
    { id: '', label: 'Toutes', count: data.length },
    ...Object.keys(CATS)
      .filter(c => data.some(p => p.categorie === c))
      .map(c => ({ id: c, label: CAT_LABEL[c] ?? c, count: data.filter(p => p.categorie === c).length })),
  ];

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>

      {/* TOPBAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', padding: '0 28px', display: 'flex', alignItems: 'center', height: 60, gap: 16, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Catalogue de prestations</span>
          <span style={{ fontSize: 12, fontWeight: 700, background: '#07101A', color: '#FCD116', padding: '2px 9px', borderRadius: 20 }}>{data.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex', zIndex: 1 }}>
              <MI name="search" size={17} color="#94A3B8" />
            </span>
            <input
              type="text"
              placeholder="Rechercher une prestation…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '9px 14px 9px 38px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC', width: 240 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <button
            style={{ padding: '9px 18px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#132730')}
            onMouseLeave={e => (e.currentTarget.style.background = '#07101A')}
          >
            <MI name="add" size={16} color="#FCD116" />
            Nouvelle prestation
          </button>
        </div>
      </div>

      {/* CATEGORY CHIPS */}
      <div style={{ display: 'flex', gap: 8, padding: '20px 28px 0', flexWrap: 'wrap' }}>
        {catFilters.map(c => (
          <div
            key={c.id}
            onClick={() => setCat(c.id)}
            style={cat === c.id ? CAT_FILTER_ACTIVE : CAT_FILTER_IDLE}
          >
            {c.label} <span style={{ opacity: 0.6 }}>{c.count}</span>
          </div>
        ))}
      </div>

      {/* GRID */}
      <div style={{ padding: '18px 28px 32px', flex: 1 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 180, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16 }} className="animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '56px 20px', textAlign: 'center', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16 }}>
            <MI name="search_off" size={42} color="#CBD5E1" />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginTop: 10 }}>Aucune prestation trouvée</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Essayez un autre mot-clé ou une autre catégorie.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {filtered.map(p => {
              const c = CATS[p.categorie] ?? { color: '#64748B', bg: '#F1F5F9', icon: 'category' };
              return (
                <PrestationCard key={p.id} p={p} c={c} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PrestationCard({ p, c }: { p: Prestation; c: { color: string; bg: string; icon: string } }) {
  return (
    <div
      style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MI name={c.icon} size={20} color={c.color} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: c.color, background: c.bg, padding: '3px 9px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' }}>
          {CAT_LABEL[p.categorie] ?? p.categorie}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{p.nom}</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 5, lineHeight: 1.5 }}>{p.description}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#059669', letterSpacing: '-0.4px', fontFamily: 'monospace' }}>{fmtPrix(p.prix)}</div>
          <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 1 }}>{p.unite}</div>
        </div>
        <EditBtn />
      </div>
    </div>
  );
}

function EditBtn() {
  return (
    <div
      style={{ width: 30, height: 30, borderRadius: 8, background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EFF6FF'; (e.currentTarget as HTMLElement).style.borderColor = '#BFDBFE'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F1F5F9'; (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'; }}
    >
      <MI name="edit" size={15} color="#64748B" />
    </div>
  );
}
