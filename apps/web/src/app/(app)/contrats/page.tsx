'use client';

import { useCallback, useEffect, useState } from 'react';
import { contratsApi } from '@/lib/api';
import { formatMontant } from '@/lib/utils';

function MI({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', ...style }}>
      {name}
    </span>
  );
}

interface Athlete { id: string; nom: string; prenom: string }
interface Client  { id: string; nom: string }
interface Contrat {
  id: string;
  numero: string;
  typeContrat: string;
  statut: 'EN_PREPARATION' | 'SIGNE' | 'EN_COURS' | 'EXPIRE';
  signeParClient: boolean;
  signeParPrestataire: boolean;
  dateSignature?: string;
  createdAt: string;
  updatedAt: string;
  athlete?: Athlete;
  client: Client;
  montant?: number;
}

const STATUT_META: Record<string, { label: string; bg: string; color: string }> = {
  EN_PREPARATION: { label: 'En préparation', bg: '#FEF9EE', color: '#C9960C' },
  SIGNE:          { label: 'Signé',          bg: '#F0FDF4', color: '#059669' },
  EN_COURS:       { label: 'En cours',       bg: '#EFF6FF', color: '#2563EB' },
  EXPIRE:         { label: 'Expiré',         bg: '#F1F5F9', color: '#94A3B8' },
};

const LOGO_COLORS = ['#07101A', '#3A6B84', '#1D4ED8', '#059669', '#B45309', '#6D28D9'];
function avatarColor(id: string) {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return LOGO_COLORS[h % LOGO_COLORS.length];
}
function initials(name: string) {
  const w = name.split(' ').filter(Boolean);
  return ((w[0] || '')[0] || '') + ((w[1] || '')[0] || '');
}

const COL = '1.2fr 2fr 1.4fr 1.4fr 1fr 1.2fr';

export default function ContratsPage() {
  const [rows, setRows] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inputFocus, setInputFocus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await contratsApi.list({ limit: 200 });
      setRows(data.data || data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = rows.find(r => r.id === selectedId) || rows[0] || null;

  const filtered = rows.filter(c => {
    const q = search.toLowerCase();
    const athleteName = c.athlete ? `${c.athlete.prenom} ${c.athlete.nom}` : '';
    const matchQ = !q || c.numero.toLowerCase().includes(q) || athleteName.toLowerCase().includes(q) || c.client.nom.toLowerCase().includes(q);
    return matchQ && (!filterStatut || c.statut === filterStatut);
  });

  const enCours = rows.filter(c => c.statut === 'EN_COURS').length;
  const aSigner = rows.filter(c => c.statut === 'EN_PREPARATION').length;
  const valeurActive = rows
    .filter(c => c.statut === 'EN_COURS' || c.statut === 'SIGNE')
    .reduce((s, c) => s + (c.montant ?? 0), 0);

  const SELECT_STYLE: React.CSSProperties = {
    padding: '9px 32px 9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10,
    fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none',
    background: '#F8FAFC', appearance: 'none', cursor: 'pointer',
  };

  function stepDot(done: boolean) {
    const c = done ? '#059669' : '#E2E8F0';
    return { position: 'absolute' as const, left: -21, top: 3, width: 10, height: 10, borderRadius: '50%', background: c, border: '2px solid #fff', boxShadow: `0 0 0 2px ${c}` };
  }

  function buildSteps(c: Contrat | null) {
    if (!c) return [];
    const signed = c.statut === 'SIGNE' || c.statut === 'EN_COURS' || c.statut === 'EXPIRE';
    return [
      { title: 'Contrat généré', sub: 'Document créé', done: true },
      { title: 'Envoyé au client', sub: signed || c.statut !== 'EN_PREPARATION' ? 'Notifié par e-mail' : 'En attente', done: signed },
      { title: 'Signé électroniquement', sub: c.dateSignature ? new Date(c.dateSignature).toLocaleDateString('fr-FR') : 'En attente de signature', done: signed },
      { title: 'Contrat actif', sub: c.statut === 'EN_COURS' ? "En cours d'exécution" : c.statut === 'EXPIRE' ? 'Échu' : '—', done: c.statut === 'EN_COURS' || c.statut === 'EXPIRE' },
    ];
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* Topbar */}
      <div className="flex items-center gap-4 px-7 shrink-0"
        style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', height: 60 }}>
        <div style={{ background: '#07101A', borderRadius: 8, padding: '4px 5px', lineHeight: 0 }}>
          <img src="/logo.png" alt="NKC" style={{ height: 22, width: 'auto', display: 'block' }} />
        </div>
        <div className="flex items-center gap-2.5 flex-1">
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Contrats</span>
          <span style={{ fontSize: 12, fontWeight: 700, background: '#07101A', color: '#FCD116', padding: '2px 9px', borderRadius: 20 }}>
            {rows.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ position: 'relative' }}>
            <MI name="search" size={17} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text" placeholder="Rechercher un contrat…" value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setInputFocus(true)} onBlur={() => setInputFocus(false)}
              style={{
                padding: '9px 14px 9px 38px', border: `1.5px solid ${inputFocus ? '#3A6B84' : '#E2E8F0'}`,
                borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A',
                outline: 'none', background: inputFocus ? '#fff' : '#F8FAFC', width: 240,
                boxShadow: inputFocus ? '0 0 0 3px rgba(58,107,132,0.08)' : 'none',
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={SELECT_STYLE}>
              <option value="">Tous les statuts</option>
              <option value="EN_PREPARATION">En préparation</option>
              <option value="SIGNE">Signé</option>
              <option value="EN_COURS">En cours</option>
              <option value="EXPIRE">Expiré</option>
            </select>
            <MI name="expand_more" size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          </div>
          <button style={{ padding: '9px 18px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
            <MI name="add" size={16} style={{ color: '#FCD116' }} />
            Générer un contrat
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3 px-7 pt-5">
        {[
          { icon: 'description', iconBg: '#EFF6FF', iconBd: '#BFDBFE', iconColor: '#3A6B84', value: rows.length,  label: 'Total contrats' },
          { icon: 'autorenew',   iconBg: '#EFF6FF', iconBd: '#BFDBFE', iconColor: '#2563EB', value: enCours,      label: 'En cours' },
          { icon: 'edit_note',   iconBg: '#FEF9EE', iconBd: '#FDE68A', iconColor: '#C9960C', value: aSigner,      label: 'À signer' },
          { icon: 'payments',    iconBg: '#F0FDF4', iconBd: '#BBF7D0', iconColor: '#059669', value: valeurActive > 0 ? `$${(valeurActive / 1000).toFixed(0)}k` : '—', label: 'Valeur active' },
        ].map(k => (
          <div key={k.label} className="flex items-center gap-3.5 rounded-2xl p-4"
            style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 44, height: 44, background: k.iconBg, border: `1px solid ${k.iconBd}` }}>
              <MI name={k.icon} size={20} style={{ color: k.iconColor }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="px-7 py-4 flex-1">
        <div className="overflow-hidden rounded-2xl" style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: COL, gap: 8, padding: '11px 22px', background: '#F8FAFC', borderBottom: '1px solid #E8ECF1' }}>
            {['Référence', 'Athlète / Client', 'Type', 'Période', 'Montant', 'Statut'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
            ))}
          </div>

          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse mx-4 my-2 rounded-lg" style={{ background: '#F1F5F9' }} />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <MI name="description" size={48} style={{ color: '#E2E8F0', marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#CBD5E1' }}>Aucun contrat trouvé</div>
            </div>
          ) : filtered.map(c => {
            const sm = STATUT_META[c.statut] || STATUT_META['EN_PREPARATION'];
            const athleteName = c.athlete ? `${c.athlete.prenom} ${c.athlete.nom}` : '—';
            const ac = avatarColor(c.id);
            return (
              <div key={c.id}
                onClick={() => { setSelectedId(c.id); setDrawerOpen(true); }}
                className="cursor-pointer transition-colors"
                style={{ display: 'grid', gridTemplateColumns: COL, gap: 8, padding: '13px 22px', borderBottom: '1px solid #F8FAFC', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>{c.numero}</div>
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0 flex items-center justify-center rounded-full"
                    style={{ width: 34, height: 34, background: ac, fontSize: 12, fontWeight: 800, color: '#FCD116' }}>
                    {c.athlete ? initials(`${c.athlete.prenom} ${c.athlete.nom}`) : '??'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{athleteName}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{c.client.nom}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#334155' }}>{c.typeContrat}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{new Date(c.createdAt).getFullYear()}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>
                  {c.montant ? formatMontant(c.montant) : '—'}
                </div>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, background: sm.bg, color: sm.color, padding: '3px 10px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' }}>
                    {sm.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" style={{ background: 'rgba(7,16,26,0.4)', backdropFilter: 'blur(2px)' }} onClick={() => setDrawerOpen(false)} />
          <div style={{ width: 440, background: '#fff', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{ background: '#07101A', padding: '24px 24px 22px', position: 'relative' }}>
              <button onClick={() => setDrawerOpen(false)}
                style={{ position: 'absolute', right: 16, top: 16, width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MI name="close" size={16} style={{ color: '#fff' }} />
              </button>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginBottom: 6 }}>{selected.numero}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#fff' }}>{selected.typeContrat}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                {selected.athlete ? `${selected.athlete.prenom} ${selected.athlete.nom}` : '—'} · {selected.client.nom}
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '4px 11px', borderRadius: 20 }}>
                  {STATUT_META[selected.statut]?.label}
                </span>
                {selected.montant && (
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#FCD116', fontFamily: 'monospace', marginLeft: 'auto' }}>
                    {formatMontant(selected.montant)}
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
              {[
                selected.athlete ? { icon: 'sports',     label: 'Athlète', value: `${selected.athlete.prenom} ${selected.athlete.nom}` } : null,
                { icon: 'apartment', label: 'Client',    value: selected.client.nom },
                { icon: 'category',  label: 'Type',      value: selected.typeContrat },
                { icon: 'calendar_today', label: 'Créé le', value: new Date(selected.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) },
              ].filter(Boolean).map((info: any) => (
                <div key={info.label} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
                  <MI name={info.icon} size={18} style={{ color: '#94A3B8', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{info.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{info.value}</span>
                  </div>
                </div>
              ))}

              {/* Signature steps */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Suivi de signature</div>
                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  <div style={{ position: 'absolute', left: 7, top: 4, bottom: 8, width: 2, background: '#E8ECF1' }} />
                  {buildSteps(selected).map((st, i) => (
                    <div key={i} style={{ position: 'relative', marginBottom: 18 }}>
                      <div style={stepDot(st.done)} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: st.done ? '#334155' : '#94A3B8' }}>{st.title}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{st.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E8ECF1', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                style={{ width: '100%', padding: 12, background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <MI name="draw" size={16} style={{ color: '#FCD116' }} />
                Envoyer pour signature
              </button>
              <button
                onClick={() => contratsApi.pdf(selected.id)}
                style={{ width: '100%', padding: 11, background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <MI name="picture_as_pdf" size={15} />
                Télécharger le PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
