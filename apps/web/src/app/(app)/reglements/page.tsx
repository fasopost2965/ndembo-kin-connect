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

const METHODES: Record<string, { short: string; bg: string }> = {
  'M-Pesa':       { short: 'MP', bg: '#E30613' },
  'Airtel Money': { short: 'AM', bg: '#ED1C24' },
  'Orange Money': { short: 'OM', bg: '#FF7900' },
  'Virement':     { short: 'VB', bg: '#3A6B84' },
  'Espèces':      { short: 'ES', bg: '#64748B' },
};

const DATA = [
  { id: 1, ref: 'REG-2026-051', facture: 'FAC-2026-0042', client: 'AS Vita Club',       methode: 'M-Pesa',       montant: 8500,  date: '17 juin 2026' },
  { id: 2, ref: 'REG-2026-050', facture: 'FAC-2026-0041', client: 'MTN RDC',            methode: 'Virement',     montant: 24000, date: '15 juin 2026' },
  { id: 3, ref: 'REG-2026-049', facture: 'FAC-2026-0039', client: 'TP Mazembe',         methode: 'Airtel Money', montant: 6200,  date: '12 juin 2026' },
  { id: 4, ref: 'REG-2026-048', facture: 'FAC-2026-0038', client: 'Académie Élan',      methode: 'M-Pesa',       montant: 3800,  date: '9 juin 2026'  },
  { id: 5, ref: 'REG-2026-047', facture: 'FAC-2026-0036', client: 'DC Motema Pembe',    methode: 'Espèces',      montant: 2500,  date: '5 juin 2026'  },
  { id: 6, ref: 'REG-2026-046', facture: 'FAC-2026-0035', client: 'AS Vita Club',       methode: 'Airtel Money', montant: 5600,  date: '2 juin 2026'  },
  { id: 7, ref: 'REG-2026-045', facture: 'FAC-2026-0033', client: 'Airtel Congo',       methode: 'Virement',     montant: 18000, date: '28 mai 2026'  },
  { id: 8, ref: 'REG-2026-044', facture: 'FAC-2026-0031', client: 'BC Kinshasa',        methode: 'Orange Money', montant: 4500,  date: '24 mai 2026'  },
];

function fmtMontant(n: number) {
  return '$' + n.toLocaleString('fr-FR');
}

const HEADERS = ['Référence', 'Facture', 'Client', 'Méthode', 'Montant', 'Date'];

export default function ReglementsPage() {
  const [search, setSearch]           = useState('');
  const [filterMethode, setFilterMethode] = useState('');

  const filtered = DATA.filter(r => {
    const q = search.toLowerCase();
    return (!q || r.ref.toLowerCase().includes(q) || r.facture.toLowerCase().includes(q) || r.client.toLowerCase().includes(q))
      && (!filterMethode || r.methode === filterMethode);
  });

  const total = DATA.reduce((a, r) => a + r.montant, 0);
  const mobileMoney = DATA.filter(r => ['M-Pesa', 'Airtel Money', 'Orange Money'].includes(r.methode)).reduce((a, r) => a + r.montant, 0);
  const moisCount = DATA.filter(r => r.date.includes('juin')).length;
  const sumShown = filtered.reduce((a, r) => a + r.montant, 0);

  const stats = [
    { icon: 'account_balance_wallet', color: '#059669', iBox: { bg: '#F0FDF4', border: '#BBF7D0' }, value: '$' + (total / 1000).toFixed(1) + 'k', label: 'Total encaissé' },
    { icon: 'calendar_month',         color: '#3A6B84', iBox: { bg: '#EFF6FF', border: '#BFDBFE' }, value: String(moisCount),                     label: 'Règlements ce mois' },
    { icon: 'smartphone',             color: '#B45309', iBox: { bg: '#FEF9EE', border: '#FDE68A' }, value: '$' + (mobileMoney / 1000).toFixed(1) + 'k', label: 'Via Mobile Money' },
    { icon: 'receipt_long',           color: '#2563EB', iBox: { bg: '#EFF6FF', border: '#BFDBFE' }, value: String(DATA.length),                   label: 'Total règlements' },
  ];

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>

      {/* TOPBAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', padding: '0 28px', display: 'flex', alignItems: 'center', height: 60, gap: 16, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Règlements</span>
          <span style={{ fontSize: 12, fontWeight: 700, background: '#07101A', color: '#FCD116', padding: '2px 9px', borderRadius: 20 }}>{DATA.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex', zIndex: 1 }}>
              <MI name="search" size={17} color="#94A3B8" />
            </span>
            <input
              type="text"
              placeholder="Rechercher un règlement…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '9px 14px 9px 38px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC', width: 240 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={filterMethode}
              onChange={e => setFilterMethode(e.target.value)}
              style={{ padding: '9px 32px 9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">Toutes méthodes</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Airtel Money">Airtel Money</option>
              <option value="Orange Money">Orange Money</option>
              <option value="Virement">Virement bancaire</option>
              <option value="Espèces">Espèces</option>
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
            Enregistrer un paiement
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '20px 28px 0' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: s.iBox.bg, border: `1px solid ${s.iBox.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MI name={s.icon} size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 21, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 1 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div style={{ padding: '16px 28px 32px', flex: 1 }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1.8fr 1.4fr 1fr 1fr', gap: 8, padding: '11px 22px', background: '#F8FAFC', borderBottom: '1px solid #E8ECF1' }}>
            {HEADERS.map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
            ))}
          </div>
          {/* Rows */}
          {filtered.length === 0 ? (
            <div style={{ padding: '56px 20px', textAlign: 'center' }}>
              <MI name="search_off" size={42} color="#CBD5E1" />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginTop: 10 }}>Aucun règlement trouvé</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Essayez d'ajuster la recherche ou le filtre de méthode.</div>
            </div>
          ) : (
            filtered.map(r => {
              const m = METHODES[r.methode] ?? METHODES['Espèces'];
              return (
                <div
                  key={r.id}
                  style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1.8fr 1.4fr 1fr 1fr', gap: 8, padding: '13px 22px', borderBottom: '1px solid #F8FAFC', alignItems: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>{r.ref}</div>
                  <div style={{ fontSize: 12, color: '#3A6B84', fontWeight: 600, fontFamily: 'monospace' }}>{r.facture}</div>
                  <div style={{ fontSize: 13, color: '#334155' }}>{r.client}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {m.short}
                    </div>
                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{r.methode}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>{fmtMontant(r.montant)}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{r.date}</div>
                </div>
              );
            })
          )}
          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid #E8ECF1', background: '#FAFBFC' }}>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>{filtered.length} règlement{filtered.length > 1 ? 's' : ''}</div>
            <div style={{ fontSize: 13, color: '#334155' }}>
              Total affiché : <span style={{ fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>{fmtMontant(sumShown)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
