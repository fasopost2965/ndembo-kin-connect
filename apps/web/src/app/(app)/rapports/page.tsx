'use client';

import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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

const CA_DATA = [
  { mois: 'Jan', val: 12 }, { mois: 'Fév', val: 15 }, { mois: 'Mar', val: 19 },
  { mois: 'Avr', val: 14 }, { mois: 'Mai', val: 22 }, { mois: 'Juin', val: 26 },
  { mois: 'Juil', val: 18 }, { mois: 'Aoû', val: 16 }, { mois: 'Sep', val: 21 },
  { mois: 'Oct', val: 24 }, { mois: 'Nov', val: 0 }, { mois: 'Déc', val: 0 },
];

const FUNNEL = [
  { label: 'Devis émis',      value: '47', pct: 100, color: '#7CC8E8' },
  { label: 'Devis validés',   value: '34', pct: 72,  color: '#7CC8E8' },
  { label: 'Factures payées', value: '30', pct: 64,  color: '#FCD116' },
];

const TOP_RAW = [
  { nom: 'Théo Lukaku Mbemba',       val: 130000 },
  { nom: 'Joël Mbuyi Kabongo',       val: 85000  },
  { nom: 'Armel Diallo Nzinga',      val: 67000  },
  { nom: 'Patricia Kabongo Ilunga',  val: 45000  },
  { nom: 'Christian Pasi Makiadi',   val: 29000  },
];

const ATH_COLORS = ['#07101A', '#3A6B84', '#1D4ED8', '#059669', '#B45309'];

const REP_RAW = [
  { label: 'Clubs',       val: 118000, color: '#2563EB' },
  { label: 'Sponsors',    val: 62000,  color: '#B45309' },
  { label: 'Académies',   val: 22000,  color: '#6D28D9' },
  { label: 'Partenaires', val: 12000,  color: '#0E7490' },
];

function fmtK(n: number) {
  return '$' + n.toLocaleString('fr-FR');
}

function initials(nom: string) {
  return nom.split(' ').slice(0, 2).map(w => w[0]).join('');
}

const trendStyle = (up: boolean): React.CSSProperties => ({
  fontSize: 11, fontWeight: 700,
  color: up ? '#059669' : '#BE123C',
  background: up ? '#F0FDF4' : '#FFF1F2',
  padding: '2px 7px', borderRadius: 6, display: 'inline-block',
});

export default function RapportsPage() {
  const topMax = TOP_RAW[0].val;
  const repTotal = REP_RAW.reduce((a, r) => a + r.val, 0);

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>

      {/* TOPBAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', padding: '0 28px', display: 'flex', alignItems: 'center', height: 60, gap: 14, flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px', flex: 1 }}>Rapports &amp; KPIs</span>
        <div style={{ position: 'relative' }}>
          <select style={{ padding: '9px 32px 9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC', appearance: 'none', cursor: 'pointer' }}>
            <option>Année 2026</option>
            <option>Année 2025</option>
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

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '20px 28px 0' }}>
        {[
          { label: 'CA réalisé',         value: '$214k', color: '#0F172A', sub: 'année 2026',      trend: '+18%', up: true  },
          { label: 'Devis émis',         value: '47',    color: '#3A6B84', sub: '12 ce mois',      trend: '+6',   up: true  },
          { label: 'Athlètes actifs',    value: '32',    color: '#059669', sub: 'sur 38 au total', trend: '+3',   up: true  },
          { label: 'Délai paiement moy.', value: '24j',  color: '#B45309', sub: 'objectif : 30j',  trend: '-4j',  up: true  },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>{k.label}</div>
              <span style={trendStyle(k.up)}>{k.trend}</span>
            </div>
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
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>En milliers de USD · 2026</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#059669', letterSpacing: '-0.4px', fontFamily: 'monospace' }}>$214k</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>total YTD</div>
            </div>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CA_DATA} barCategoryGap="20%" margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 4 }}
                  contentStyle={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}
                  formatter={(v: number) => [`$${v}k`, 'CA']}
                  labelStyle={{ fontWeight: 700 }}
                />
                <Bar dataKey="val" radius={[5, 5, 2, 2]} maxBarSize={26}>
                  {CA_DATA.map(entry => (
                    <Cell
                      key={entry.mois}
                      fill={
                        entry.val === 0
                          ? '#EEF1F4'
                          : entry.mois === 'Juin'
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
              <div style={{ fontSize: 56, fontWeight: 800, color: '#FCD116', letterSpacing: -2, lineHeight: 1 }}>64%</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>30 payées sur 47 devis</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FUNNEL.map(f => (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {TOP_RAW.map((a, i) => (
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
        </div>

        {/* RÉPARTITION CA */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 18 }}>Répartition du CA par type de client</div>
          {/* Segmented bar */}
          <div style={{ display: 'flex', height: 18, borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
            {REP_RAW.map(r => (
              <div key={r.label} style={{ width: `${r.val / repTotal * 100}%`, background: r.color, height: '100%' }} />
            ))}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {REP_RAW.map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: 4, background: r.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500, flex: 1 }}>{r.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{Math.round(r.val / repTotal * 100)}%</span>
                <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'monospace', width: 64, textAlign: 'right' }}>{fmtK(r.val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
