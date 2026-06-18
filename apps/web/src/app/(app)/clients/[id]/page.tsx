'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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

interface Devis { id: string; numero: string; createdAt: string; montantTTC: number; statut: string }
interface Facture { id: string; numero: string; echeanceDate?: string; createdAt: string; montantTTC: number; statutPaiement: string }
interface TimelineItem { id: string; type: string; titre: string; date: string; montant?: number }

interface ClientDetail {
  id: string;
  nom: string;
  type: string;
  email: string;
  telephone: string;
  ville: string;
  adresse?: string;
  contactNom?: string;
  contactPoste?: string;
  rccm?: string;
  nif?: string;
  secteurActivite?: string;
  createdAt: string;
  _count?: { devis: number; factures: number; projets: number; contrats: number };
  caTotal?: number;
  devis?: Devis[];
  factures?: Facture[];
}

const DEVIS_STATUT: Record<string, { label: string; bg: string; color: string }> = {
  EN_ATTENTE: { label: 'En attente', bg: '#FEF9EE', color: '#C9960C' },
  VALIDE:     { label: 'Validé',     bg: '#F0FDF4', color: '#059669' },
  REFUSE:     { label: 'Refusé',     bg: '#FEF2F2', color: '#DC2626' },
  CONVERTI:   { label: 'Converti',   bg: '#EFF6FF', color: '#2563EB' },
};

const FACTURE_STATUT: Record<string, { label: string; bg: string; color: string }> = {
  IMPAYEE:       { label: 'Impayée',  bg: '#FEF2F2', color: '#DC2626' },
  ACOMPTE_PERCU: { label: 'Partielle', bg: '#FEF9EE', color: '#C9960C' },
  PARTIELLE:     { label: 'Partielle', bg: '#FEF9EE', color: '#C9960C' },
  PAYEE:         { label: 'Payée',    bg: '#ECFDF5', color: '#0D9668' },
};

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, background: bg, color, padding: '3px 9px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

const LOGO_COLORS = ['#07101A', '#3A6B84', '#1D4ED8', '#059669', '#B45309', '#6D28D9'];
function logoColor(id: string) {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return LOGO_COLORS[h % LOGO_COLORS.length];
}
function initials(nom: string) {
  const w = nom.split(' ').filter(Boolean);
  return ((w[0] || '')[0] || '') + ((w[1] || '')[0] || '');
}

type Tab = 'apercu' | 'devis' | 'factures' | 'activite';

const TAB_COL = '1.2fr 1.4fr 1fr 1fr';

export default function FicheClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [tab, setTab] = useState<Tab>('apercu');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await clientsApi.get(id);
      setClient(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    clientsApi.timeline(id).then(({ data }) => setTimeline(data || [])).catch(() => {});
  }, [id]);

  if (loading || !client) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: '#F0F2F5' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', height: 60 }} />
        <div className="p-8 grid gap-4" style={{ gridTemplateColumns: '300px 1fr' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl" style={{ background: '#fff' }} />)}
        </div>
      </div>
    );
  }

  const bg = logoColor(client.id);
  const devisCount = client._count?.devis ?? client.devis?.length ?? 0;
  const facturesCount = client._count?.factures ?? client.factures?.length ?? 0;
  const projetsCount = client._count?.projets ?? 0;
  const ca = client.caTotal ?? 0;

  const tabStyle = (t: Tab) =>
    t === tab
      ? { padding: '8px 18px', borderRadius: 9, background: '#fff', fontSize: 13, fontWeight: 700, color: '#0F172A', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
      : { padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 500, color: '#64748B', cursor: 'pointer' };

  const TIMELINE_META: Record<string, { icon: string; color: string }> = {
    facture:  { icon: 'receipt_long', color: '#2563EB' },
    devis:    { icon: 'description',  color: '#059669' },
    activite: { icon: 'call',         color: '#B45309' },
    projet:   { icon: 'work',         color: '#6D28D9' },
    default:  { icon: 'event',        color: '#94A3B8' },
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* Topbar */}
      <div className="flex items-center gap-2 px-8 shrink-0"
        style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', height: 60 }}>
        <div style={{ background: '#07101A', borderRadius: 8, padding: '4px 5px', lineHeight: 0 }}>
          <img src="/logo.png" alt="NKC" style={{ height: 22, width: 'auto', display: 'block' }} />
        </div>
        <span style={{ fontSize: 13, color: '#94A3B8' }}>/</span>
        <Link href="/clients" style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#3A6B84')}
          onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>
          Clients
        </Link>
        <span style={{ fontSize: 13, color: '#94A3B8' }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{client.nom}</span>
        <div className="flex-1" />
        <div className="flex gap-2">
          <button style={{ padding: '7px 14px', background: '#F1F5F9', color: '#475569', fontSize: 12, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MI name="edit" size={15} />Modifier
          </button>
          <button style={{ padding: '7px 14px', background: '#07101A', color: '#FCD116', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MI name="add" size={15} style={{ color: '#FCD116' }} />Nouveau devis
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, padding: '28px 32px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Profile card */}
          <div style={{ background: '#07101A', borderRadius: 18, padding: '28px 22px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(124,200,232,0.1)', pointerEvents: 'none' }} />
            <div style={{ width: 72, height: 72, borderRadius: 16, background: 'linear-gradient(135deg,#3A6B84,#7CC8E8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 auto 14px', letterSpacing: '-0.5px' }}>
              {initials(client.nom)}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>{client.nom}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{client.type} · {client.ville}</div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(5,150,105,0.15)', color: '#34D399', padding: '3px 12px', borderRadius: 20 }}>
                {ca > 0 ? 'Actif' : devisCount > 0 ? 'Prospect' : 'Inactif'}
              </span>
            </div>
          </div>

          {/* KPI mini grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { value: devisCount, label: 'Devis', color: '#2563EB', size: 22 },
              { value: facturesCount, label: 'Factures', color: '#3A6B84', size: 22 },
              { value: ca > 0 ? formatMontant(ca) : '—', label: 'CA réalisé', color: '#059669', size: 18 },
              { value: projetsCount, label: 'Projets', color: '#0F172A', size: 22 },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: k.size, fontWeight: 800, color: k.color, letterSpacing: k.size === 18 ? '-0.3px' : '-0.4px' }}>{k.value}</div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Coordonnées */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 14 }}>Coordonnées</div>
            {[
              client.contactNom ? { icon: 'person',      label: 'Contact principal', value: `${client.contactNom}${client.contactPoste ? ` — ${client.contactPoste}` : ''}` } : null,
              { icon: 'mail',        label: 'E-mail',     value: client.email },
              { icon: 'phone',       label: 'Téléphone',  value: client.telephone },
              client.adresse ? { icon: 'location_on', label: 'Adresse', value: client.adresse } : null,
              client.secteurActivite ? { icon: 'category', label: 'Secteur', value: client.secteurActivite } : null,
            ].filter(Boolean).map((info: any) => (
              <div key={info.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #F8FAFC' }}>
                <MI name={info.icon} size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>{info.label}</div>
                  <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{info.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Infos légales */}
          {(client.rccm || client.nif) && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>Infos légales</div>
              <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.8, fontFamily: 'monospace' }}>
                {client.rccm && <>{client.rccm}<br /></>}
                {client.nif && <>NIF · {client.nif}</>}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 2, background: '#E8ECF1', borderRadius: 12, padding: 4, marginBottom: 20, width: 'fit-content' }}>
            {(['apercu', 'devis', 'factures', 'activite'] as Tab[]).map(t => {
              const labels: Record<Tab, string> = { apercu: 'Aperçu', devis: 'Devis', factures: 'Factures', activite: 'Activité' };
              return <div key={t} onClick={() => setTab(t)} style={tabStyle(t)}>{labels[t]}</div>;
            })}
          </div>

          {/* Aperçu tab */}
          {tab === 'apercu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Synthèse commerciale</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {[
                    { label: 'CA réalisé', value: ca > 0 ? formatMontant(ca) : '—', color: '#059669' },
                    { label: 'Devis en cours', value: devisCount, color: '#C9960C' },
                    { label: 'Taux conversion', value: devisCount > 0 ? `${Math.round((facturesCount / devisCount) * 100)} %` : '—', color: '#2563EB' },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#F8FAFC', border: '1px solid #E8ECF1', borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{m.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: m.color, letterSpacing: '-0.4px', marginTop: 6 }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>À propos</div>
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>
                  {client.secteurActivite
                    ? `${client.type} — ${client.secteurActivite}. Client depuis ${new Date(client.createdAt).getFullYear()}.`
                    : `${client.type} basé à ${client.ville}. Client depuis ${new Date(client.createdAt).getFullYear()}.`}
                </div>
              </div>
            </div>
          )}

          {/* Devis tab */}
          {tab === 'devis' && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: TAB_COL, gap: 8, padding: '11px 22px', background: '#F8FAFC', borderBottom: '1px solid #E8ECF1' }}>
                {['Référence', 'Date', 'Montant', 'Statut'].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
                ))}
              </div>
              {(client.devis || []).length === 0 ? (
                <div className="py-12 text-center" style={{ color: '#94A3B8', fontSize: 13 }}>Aucun devis pour ce client.</div>
              ) : (client.devis || []).map(d => {
                const s = DEVIS_STATUT[d.statut] || DEVIS_STATUT['EN_ATTENTE'];
                return (
                  <div key={d.id} style={{ display: 'grid', gridTemplateColumns: TAB_COL, gap: 8, padding: '14px 22px', borderBottom: '1px solid #F8FAFC', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>{d.numero}</div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>{new Date(d.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>{formatMontant(d.montantTTC)}</div>
                    <div><Badge bg={s.bg} color={s.color} label={s.label} /></div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Factures tab */}
          {tab === 'factures' && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: TAB_COL, gap: 8, padding: '11px 22px', background: '#F8FAFC', borderBottom: '1px solid #E8ECF1' }}>
                {['Référence', 'Échéance', 'Montant', 'Statut'].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, textAlign: ['Montant', 'Statut'].includes(h) ? 'right' : undefined as any }}>{h}</div>
                ))}
              </div>
              {(client.factures || []).length === 0 ? (
                <div className="py-12 text-center" style={{ color: '#94A3B8', fontSize: 13 }}>Aucune facture pour ce client.</div>
              ) : (client.factures || []).map(f => {
                const s = FACTURE_STATUT[f.statutPaiement] || FACTURE_STATUT['IMPAYEE'];
                return (
                  <div key={f.id} style={{ display: 'grid', gridTemplateColumns: TAB_COL, gap: 8, padding: '14px 22px', borderBottom: '1px solid #F8FAFC', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>{f.numero}</div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>
                      {f.echeanceDate ? new Date(f.echeanceDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', textAlign: 'right', fontFamily: 'monospace' }}>{formatMontant(f.montantTTC)}</div>
                    <div style={{ textAlign: 'right' }}><Badge bg={s.bg} color={s.color} label={s.label} /></div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Activité tab */}
          {tab === 'activite' && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 18 }}>Journal CRM</div>
              {timeline.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>Aucune activité enregistrée.</div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  <div style={{ position: 'absolute', left: 7, top: 4, bottom: 8, width: 2, background: '#E8ECF1' }} />
                  {timeline.map((t, i) => {
                    const meta = TIMELINE_META[t.type] || TIMELINE_META['default'];
                    return (
                      <div key={t.id} style={{ position: 'relative', marginBottom: 22 }}>
                        <div style={{ position: 'absolute', left: -21, top: 3, width: 10, height: 10, borderRadius: '50%', background: meta.color, border: '2px solid #fff', boxShadow: `0 0 0 2px ${meta.color}` }} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{t.titre}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
