'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientsApi } from '@/lib/api';
import { formatMontant } from '@/lib/utils';

function MI({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', ...style }}>
      {name}
    </span>
  );
}

interface Client {
  id: string;
  nom: string;
  type: string;
  email: string;
  telephone: string;
  ville: string;
  adresse?: string;
  contactNom?: string;
  createdAt: string;
  _count?: { devis: number; factures: number };
  caTotal?: number;
  statut?: string;
}

interface TimelineItem {
  id: string;
  type: string;
  titre: string;
  date: string;
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  'Club':       { bg: '#EFF6FF', color: '#2563EB' },
  'Académie':   { bg: '#F5F3FF', color: '#6D28D9' },
  'Sponsor':    { bg: '#FEF9EE', color: '#B45309' },
  'Partenaire': { bg: '#ECFEFF', color: '#0E7490' },
};

const STATUT_COLORS: Record<string, { bg: string; color: string }> = {
  'Actif':    { bg: '#F0FDF4', color: '#059669' },
  'Prospect': { bg: '#EFF6FF', color: '#2563EB' },
  'Inactif':  { bg: '#F1F5F9', color: '#64748B' },
};

const LOGO_COLORS = ['#07101A', '#3A6B84', '#1D4ED8', '#059669', '#B45309', '#6D28D9'];

function initials(nom: string): string {
  const words = nom.split(' ').filter(Boolean);
  return ((words[0] || '')[0] || '') + ((words[1] || '')[0] || '');
}

function logoColor(id: string): string {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return LOGO_COLORS[hash % LOGO_COLORS.length];
}

function TypeBadge({ type }: { type: string }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS['Club'];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, background: c.bg, color: c.color, padding: '3px 9px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' }}>
      {type}
    </span>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  const c = STATUT_COLORS[statut] || STATUT_COLORS['Inactif'];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, background: c.bg, color: c.color, padding: '3px 9px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' }}>
      {statut}
    </span>
  );
}

const TYPES = ['Club', 'Académie', 'Sponsor', 'Partenaire'];

export default function ClientsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterVille, setFilterVille] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Client | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inputFocus, setInputFocus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await clientsApi.list({ limit: 200 });
      setRows(data.data || data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDrawer = useCallback(async (c: Client) => {
    setSelectedId(c.id);
    setDetail(c);
    setDrawerOpen(true);
    setTimeline([]);
    try {
      const { data } = await clientsApi.timeline(c.id);
      setTimeline(data || []);
    } catch { /* ok */ }
  }, []);

  const villes = [...new Set(rows.map(r => r.ville).filter(Boolean))].sort();

  const filtered = rows.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.nom.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    return matchQ && (!filterType || c.type === filterType) && (!filterVille || c.ville === filterVille);
  });

  const totalCA = rows.reduce((s, c) => s + (c.caTotal ?? 0), 0);
  const clubs = rows.filter(c => c.type === 'Club').length;
  const sponsors = rows.filter(c => c.type === 'Sponsor').length;

  const statOf = (c: Client) => {
    if (c.statut) return c.statut;
    if ((c._count?.factures ?? 0) > 0) return 'Actif';
    if ((c._count?.devis ?? 0) > 0) return 'Prospect';
    return 'Inactif';
  };

  const INPUT_STYLE: React.CSSProperties = {
    padding: '9px 14px 9px 38px', border: `1.5px solid ${inputFocus ? '#3A6B84' : '#E2E8F0'}`,
    borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A',
    outline: 'none', background: inputFocus ? '#fff' : '#F8FAFC', width: 240,
    boxShadow: inputFocus ? '0 0 0 3px rgba(58,107,132,0.08)' : 'none',
  };

  const SELECT_STYLE: React.CSSProperties = {
    padding: '9px 32px 9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10,
    fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none',
    background: '#F8FAFC', appearance: 'none', cursor: 'pointer',
  };

  const COL = '2.6fr 1.1fr 1fr 0.8fr 0.9fr 1.2fr 1.1fr 50px';

  const timelineIcons: Record<string, { icon: string; bg: string }> = {
    'facture':  { icon: 'receipt_long', bg: '#2563EB' },
    'devis':    { icon: 'description',  bg: '#059669' },
    'activite': { icon: 'call',         bg: '#B45309' },
    'default':  { icon: 'event',        bg: '#94A3B8' },
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* Topbar */}
      <div className="flex items-center gap-4 px-7 shrink-0"
        style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', height: 60 }}>
        <div style={{ background: '#07101A', borderRadius: 8, padding: '4px 5px', lineHeight: 0 }}>
          <img src="/logo.png" alt="NKC" style={{ height: 22, width: 'auto', display: 'block' }} />
        </div>
        <div className="flex items-center gap-2.5 flex-1">
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Clients</span>
          <span style={{ fontSize: 12, fontWeight: 700, background: '#07101A', color: '#FCD116', padding: '2px 9px', borderRadius: 20 }}>
            {rows.length}
          </span>
        </div>

        {/* Filters + CTA */}
        <div className="flex items-center gap-2">
          <div style={{ position: 'relative' }}>
            <MI name="search" size={17} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text" placeholder="Rechercher un client…" value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setInputFocus(true)} onBlur={() => setInputFocus(false)}
              style={INPUT_STYLE}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={SELECT_STYLE}>
              <option value="">Tous les types</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <MI name="expand_more" size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <select value={filterVille} onChange={e => setFilterVille(e.target.value)} style={SELECT_STYLE}>
              <option value="">Toutes les villes</option>
              {villes.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <MI name="expand_more" size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          </div>
          <button
            style={{ padding: '9px 18px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
            <MI name="add" size={16} style={{ color: '#FCD116' }} />
            Nouveau client
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3 px-7 pt-5">
        {[
          { icon: 'apartment',     iconBg: '#EFF6FF', iconBd: '#BFDBFE', iconColor: '#3A6B84', value: rows.length,  label: 'Total clients' },
          { icon: 'sports_soccer', iconBg: '#EFF6FF', iconBd: '#BFDBFE', iconColor: '#2563EB', value: clubs,        label: 'Clubs' },
          { icon: 'handshake',     iconBg: '#FEF9EE', iconBd: '#FDE68A', iconColor: '#B45309', value: sponsors,     label: 'Sponsors' },
          { icon: 'payments',      iconBg: '#F0FDF4', iconBd: '#BBF7D0', iconColor: '#059669', value: totalCA > 0 ? `$${(totalCA / 1000).toFixed(0)}k` : '—', label: 'CA total réalisé' },
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

          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: COL, gap: 8, padding: '11px 20px', background: '#F8FAFC', borderBottom: '1px solid #E8ECF1' }}>
            {['Client', 'Type', 'Ville', 'Devis', 'Factures', 'CA réalisé', 'Statut', ''].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: COL, gap: 8, padding: '13px 20px', borderBottom: '1px solid #F8FAFC' }}>
                <div className="h-9 animate-pulse rounded-lg" style={{ background: '#F1F5F9', gridColumn: 'span 8' }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MI name="group" size={48} style={{ color: '#E2E8F0', marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#CBD5E1' }}>Aucun client trouvé</div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Créez votre premier client pour commencer.</div>
            </div>
          ) : filtered.map((c) => {
            const bg = logoColor(c.id);
            const stat = statOf(c);
            return (
              <div
                key={c.id}
                onClick={() => openDrawer(c)}
                className="cursor-pointer transition-colors"
                style={{ display: 'grid', gridTemplateColumns: COL, gap: 8, padding: '13px 20px', borderBottom: '1px solid #F8FAFC', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                {/* Client */}
                <div className="flex items-center gap-3">
                  <div className="shrink-0 flex items-center justify-center rounded-[10px]"
                    style={{ width: 38, height: 38, background: bg, fontSize: 13, fontWeight: 800, color: '#FCD116', letterSpacing: '-0.5px' }}>
                    {initials(c.nom)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{c.nom}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{c.email}</div>
                  </div>
                </div>
                <div><TypeBadge type={c.type} /></div>
                <div style={{ fontSize: 13, color: '#334155' }}>{c.ville}</div>
                <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{c._count?.devis ?? '—'}</div>
                <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{c._count?.factures ?? '—'}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>
                  {c.caTotal ? formatMontant(c.caTotal) : '—'}
                </div>
                <div><StatutBadge statut={stat} /></div>
                <div className="flex justify-end">
                  <div className="flex items-center justify-center rounded-[8px]"
                    style={{ width: 30, height: 30, background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                    <MI name="visibility" size={15} style={{ color: '#64748B' }} />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination info */}
          {!loading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid #E8ECF1', background: '#FAFBFC' }}>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>
                {filtered.length} client{filtered.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && detail && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" style={{ background: 'rgba(7,16,26,0.4)', backdropFilter: 'blur(2px)' }} onClick={() => setDrawerOpen(false)} />
          <div style={{ width: 420, background: '#fff', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>

            {/* Header dark */}
            <div style={{ background: '#07101A', padding: '24px 22px 20px', position: 'relative' }}>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ position: 'absolute', right: 16, top: 16, width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MI name="close" size={16} style={{ color: '#fff' }} />
              </button>
              <div className="flex items-center justify-center rounded-[14px]"
                style={{ width: 60, height: 60, background: logoColor(detail.id), fontSize: 20, fontWeight: 800, color: '#FCD116', letterSpacing: '-0.5px' }}>
                {initials(detail.nom)}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 14 }}>{detail.nom}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{detail.type} · {detail.ville}</div>
              <div style={{ marginTop: 12 }}>
                <StatutBadge statut={statOf(detail)} />
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

              {/* KPI mini-cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { value: detail._count?.devis ?? '—', label: 'Devis' },
                  { value: detail._count?.factures ?? '—', label: 'Factures' },
                  { value: detail.caTotal ? formatMontant(detail.caTotal) : '—', label: 'CA' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#F8FAFC', border: '1px solid #E8ECF1', borderRadius: 11, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>{k.value}</div>
                    <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Info rows */}
              {[
                { icon: 'mail',  label: 'Email',      value: detail.email },
                { icon: 'phone', label: 'Téléphone',   value: detail.telephone },
                { icon: 'place', label: 'Ville',       value: detail.ville },
                { icon: 'category', label: 'Type',     value: detail.type },
                detail.contactNom ? { icon: 'person', label: 'Contact', value: detail.contactNom } : null,
              ].filter(Boolean).map((info: any) => (
                <div key={info.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <MI name={info.icon} size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>{info.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{info.value}</div>
                  </div>
                </div>
              ))}

              {/* Timeline */}
              {timeline.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Activité récente</div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {timeline.slice(0, 5).map((t, i) => {
                      const meta = timelineIcons[t.type] || timelineIcons['default'];
                      const isLast = i === Math.min(timeline.length, 5) - 1;
                      return (
                        <div key={t.id} style={{ display: 'flex', gap: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <MI name={meta.icon} size={12} style={{ color: '#fff' }} />
                            </div>
                            {!isLast && <div style={{ width: 2, flex: 1, background: '#E8ECF1', minHeight: 8 }} />}
                          </div>
                          <div style={{ paddingBottom: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{t.titre}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{new Date(t.date).toLocaleDateString('fr-FR')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div style={{ padding: '16px 22px', borderTop: '1px solid #E8ECF1', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => { setDrawerOpen(false); router.push(`/clients/${detail.id}`); }}
                style={{ width: '100%', padding: 12, background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <MI name="open_in_new" size={16} style={{ color: '#FCD116' }} />
                Voir la fiche complète
              </button>
              <button
                onClick={() => { setDrawerOpen(false); router.push(`/devis/nouveau?clientId=${detail.id}`); }}
                style={{ width: '100%', padding: 11, background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                Créer un devis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
