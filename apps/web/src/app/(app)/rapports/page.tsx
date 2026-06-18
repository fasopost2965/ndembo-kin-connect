'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { rapportsApi } from '@/lib/api';

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

const ATH_COLORS = ['#07101A', '#3A6B84', '#1D4ED8', '#059669', '#B45309'];
const REP_COLORS: Record<string, string> = {
  Club: '#2563EB', Sponsor: '#B45309', Academie: '#6D28D9', Partenaire: '#0E7490', Autre: '#64748B',
};
const moisCourant = new Date().toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');

function fmtK(n: number) {
  return '$' + n.toLocaleString('fr-FR');
}
function fmtCompact(n: number) {
  return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
}
function initials(nom: string) {
  return nom.split(' ').slice(0, 2).map(w => w[0]).join('');
}

interface Synthese {
  annee: number;
  kpis: { caRealise: number; devisEmis: number; athletesActifs: number; athletesTotal: number; delaiPaiementMoyen: number | null };
  caParMois: { mois: string; val: number }[];
  funnel: { devisEmis: number; devisValides: number; facturesPayees: number; tauxConversion: number };
  topAthletes: { nom: string; val: number }[];
  repartition: { label: string; val: number }[];
}

export default function RapportsPage() {
  const [s, setS] = useState<Synthese | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rapportsApi.synthese()
      .then(({ data }) => setS(data))
      .catch(() => setS(null))
      .finally(() => setLoading(false));
  }, []);

  // CA mensuel en milliers de USD pour le graphe
  const caData = (s?.caParMois ?? []).map(m => ({ mois: m.mois, val: Math.round(m.val / 1000) }));
  const caTotalK = fmtCompact(s?.kpis.caRealise ?? 0);

  const fEmis = s?.funnel.devisEmis ?? 0;
  const fValides = s?.funnel.devisValides ?? 0;
  const fPayees = s?.funnel.facturesPayees ?? 0;
  const funnel = [
    { label: 'Devis émis',      value: String(fEmis),    pct: 100,                                            color: '#7CC8E8' },
    { label: 'Devis validés',   value: String(fValides), pct: fEmis ? Math.round((fValides / fEmis) * 100) : 0, color: '#7CC8E8' },
    { label: 'Factures payées', value: String(fPayees),  pct: fEmis ? Math.round((fPayees / fEmis) * 100) : 0,  color: '#FCD116' },
  ];

  const topAthletes = s?.topAthletes ?? [];
  const topMax = topAthletes[0]?.val || 1;
  const repartition = s?.repartition ?? [];
  const repTotal = repartition.reduce((a, r) => a + r.val, 0) || 1;

  const kpiCards = [
    { label: 'CA réalisé',          value: caTotalK,                                              color: '#0F172A', sub: `année ${s?.annee ?? ''}` },
    { label: 'Devis émis',          value: String(s?.kpis.devisEmis ?? 0),                        color: '#3A6B84', sub: 'toutes périodes' },
    { label: 'Athlètes actifs',     value: String(s?.kpis.athletesActifs ?? 0),                   color: '#059669', sub: `sur ${s?.kpis.athletesTotal ?? 0} au total` },
    { label: 'Délai paiement moy.', value: s?.kpis.delaiPaiementMoyen != null ? `${s.kpis.delaiPaiementMoyen}j` : '—', color: '#B45309', sub: 'objectif : 30j' },
  ];

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>

      {/* TOPBAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', padding: '0 28px', display: 'flex', alignItems: 'center', height: 60, gap: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', flex: 1 }}>Rapports &amp; KPIs</span>
        <div style={{ position: 'relative' }}>
          <select style={{ padding: '9px 32px 9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC', appearance: 'none', cursor: 'pointer' }}>
            <option>Année {s?.annee ?? new Date().getFullYear()}</option>
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
          <MI name="download" size={16} color="#FCD116" />
          Exporter (CSV)
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '80px 0', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>Chargement des rapports…</div>
      ) : (
      <>
      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '20px 28px 0' }}>
        {kpiCards.map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color, letterSpacing: '-0.5px' }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ROW 2 — CA chart + Conversion */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16, padding: '16px 28px 0' }}>

        {/* CA MENSUEL */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Chiffre d'affaires mensuel</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Encaissements en milliers de USD · {s?.annee}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#059669', letterSpacing: '-0.4px', fontFamily: 'monospace' }}>{caTotalK}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>total YTD</div>
            </div>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={caData} barCategoryGap="20%" margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 4 }}
                  contentStyle={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}
                  formatter={(v: number) => [`$${v}k`, 'CA']}
                  labelStyle={{ fontWeight: 700 }}
                />
                <Bar dataKey="val" radius={[5, 5, 2, 2]} maxBarSize={26}>
                  {caData.map(entry => (
                    <Cell
                      key={entry.mois}
                      fill={
                        entry.val === 0
                          ? '#EEF1F4'
                          : entry.mois.toLowerCase() === moisCourant.toLowerCase()
                          ? 'url(#goldGrad)'
                          : 'url(#slateGrad)'
                      }
                    />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FCD116" />
                    <stop offset="100%" stopColor="#DAA520" />
                  </linearGradient>
                  <linearGradient id="slateGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3A6B84" />
                    <stop offset="100%" stopColor="#2A5468" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TAUX DE CONVERSION */}
        <div style={{ background: '#07101A', borderRadius: 16, padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Taux de conversion</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Devis → Facture</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '18px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: '#FCD116', letterSpacing: -2, lineHeight: 1 }}>{s?.funnel.tauxConversion ?? 0}%</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>{fPayees} payées sur {fEmis} devis</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {funnel.map(f => (
              <div key={f.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{f.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{f.value}</span>
                </div>
                <div style={{ height: 7, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${f.pct}%`, height: '100%', background: f.color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3 — Top athlètes + Répartition */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px 28px 32px' }}>

        {/* TOP ATHLÈTES */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 18 }}>Top athlètes par valeur marchande</div>
          {topAthletes.length === 0 ? (
            <div style={{ fontSize: 13, color: '#94A3B8', padding: '20px 0', textAlign: 'center' }}>Aucune valeur marchande renseignée.</div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topAthletes.map((a, i) => (
              <div key={a.nom} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: ATH_COLORS[i % ATH_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#FCD116', flexShrink: 0 }}>
                  {initials(a.nom)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{a.nom}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>{fmtK(a.val)}</span>
                  </div>
                  <div style={{ height: 7, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${a.val / topMax * 100}%`, height: '100%', background: 'linear-gradient(90deg,#3A6B84,#7CC8E8)', borderRadius: 4 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* RÉPARTITION CA */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 18 }}>Répartition du CA par type de client</div>
          {repartition.length === 0 ? (
            <div style={{ fontSize: 13, color: '#94A3B8', padding: '20px 0', textAlign: 'center' }}>Aucun encaissement enregistré.</div>
          ) : (
          <>
          {/* Segmented bar */}
          <div style={{ display: 'flex', height: 18, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
            {repartition.map(r => (
              <div key={r.label} style={{ width: `${r.val / repTotal * 100}%`, background: REP_COLORS[r.label] ?? '#64748B', height: '100%' }} />
            ))}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {repartition.map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 4, background: REP_COLORS[r.label] ?? '#64748B', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500, flex: 1 }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{Math.round(r.val / repTotal * 100)}%</span>
                <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'monospace', width: 64, textAlign: 'right' }}>{fmtK(r.val)}</span>
              </div>
            ))}
          </div>
          </>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
