'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { athletesApi } from '@/lib/api';
import { initials, formatValeur } from '@/lib/utils';
import { Badge, niveauBadge } from '@/components/ui/badge';

function MI({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span
      className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', ...style }}
    >
      {name}
    </span>
  );
}

const AV_GRADIENTS = [
  'linear-gradient(135deg,#3A6B84,#7CC8E8)',
  'linear-gradient(135deg,#C9960C,#FCD116)',
  'linear-gradient(135deg,#B91C1C,#EF4444)',
  'linear-gradient(135deg,#0D9668,#10B981)',
  'linear-gradient(135deg,#6D28D9,#A78BFA)',
];
function gradientFor(id: string) {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AV_GRADIENTS[n % AV_GRADIENTS.length];
}

const TABS = [
  { id: 'carriere', label: 'Carrière' },
  { id: 'contrats', label: 'Contrats' },
  { id: 'activites', label: 'Activités' },
  { id: 'notes', label: 'Notes' },
];

interface Athlete {
  id: string; nom: string; prenom: string; sport: string; poste: string;
  niveau: string; valeurMarchande: number; email?: string; telephone?: string;
  nationalite?: string; clubActuel?: string; priorityScouting?: string;
  dateNaissance?: string;
}

export default function AthleteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('carriere');

  useEffect(() => {
    if (!id) return;
    athletesApi.get(id)
      .then(r => setAthlete(r.data))
      .catch(() => router.push('/athletes'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#F0F2F5' }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#07101A] border-t-[#FCD116]"
          style={{ animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (!athlete) return null;

  const nb = niveauBadge(athlete.niveau);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* ── Breadcrumb topbar ── */}
      <div
        className="flex items-center justify-between px-6 shrink-0"
        style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', height: 60 }}
      >
        <div className="flex items-center gap-2 text-[13px]">
          <Link href="/athletes" className="hover:underline" style={{ color: '#64748B' }}>
            Athlètes
          </Link>
          <MI name="chevron_right" size={14} style={{ color: '#CBD5E1' }} />
          <span className="font-semibold" style={{ color: '#0F172A' }}>
            {athlete.prenom} {athlete.nom}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/athletes"
            className="flex items-center gap-1.5 px-4 py-2 rounded-[9px] text-[13px] font-semibold transition-colors"
            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#334155' }}
          >
            <MI name="arrow_back" size={14} style={{ color: '#64748B' }} />
            Retour
          </Link>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-[9px] text-[13px] font-bold"
            style={{ background: '#07101A', color: '#FCD116', border: 'none', cursor: 'pointer' }}
          >
            <MI name="edit" size={14} style={{ color: '#FCD116' }} />
            Modifier
          </button>
        </div>
      </div>

      {/* ── 2-col grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, padding: '28px 32px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        {/* Left column — 300px, matches design */}
        <div className="flex flex-col shrink-0 gap-4" style={{ width: 300 }}>

          {/* Dark profile card */}
          <div
            className="rounded-[18px] text-center relative overflow-hidden"
            style={{ background: '#07101A', padding: '28px 22px' }}
          >
            <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(252,209,22,0.08)', pointerEvents: 'none' }} />
            <div
              className="flex items-center justify-center rounded-full font-black mx-auto mb-3.5"
              style={{ width: 72, height: 72, fontSize: 24, background: gradientFor(athlete.id), color: '#07101A' }}
            >
              {initials(athlete.prenom, athlete.nom)}
            </div>
            <div className="text-[18px] font-extrabold text-white" style={{ letterSpacing: '-0.3px' }}>
              {athlete.prenom} {athlete.nom}
            </div>
            <div className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {athlete.sport} · {athlete.poste}
            </div>
            <div className="mt-3">
              <Badge variant={nb.variant}>{nb.label}</Badge>
            </div>
          </div>

          {/* White KPI grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Contrats',     value: '2',                              color: '#FCD116', size: 22 },
              { label: 'Projets',      value: '1',                              color: '#3A6B84', size: 22 },
              { label: 'Valeur march.',value: formatValeur(athlete.valeurMarchande), color: '#059669', size: 18 },
              { label: 'Ans',          value: athlete.dateNaissance
                ? String(new Date().getFullYear() - new Date(athlete.dateNaissance).getFullYear())
                : '—',                                                            color: '#0F172A', size: 22 },
            ].map(k => (
              <div key={k.label} className="rounded-xl text-center"
                style={{ background: '#fff', border: '1px solid #E2E8F0', padding: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: k.size, fontWeight: 800, color: k.color, letterSpacing: '-0.4px' }}>{k.value}</div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* White contact card */}
          <div className="rounded-[14px]" style={{ background: '#fff', border: '1px solid #E2E8F0', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 14 }}>Contact</div>
            {[
              { icon: 'phone',         label: 'Téléphone',   value: athlete.telephone ?? '—' },
              { icon: 'mail_outline',  label: 'Email',       value: athlete.email ?? '—' },
              { icon: 'flag',          label: 'Nationalité', value: athlete.nationalite ?? '—' },
              { icon: 'sports_soccer', label: 'Club actuel', value: athlete.clubActuel ?? '—' },
            ].map((row, i, arr) => (
              <div key={row.label} className="flex items-center gap-2.5 py-1.5"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                <MI name={row.icon} size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, color: '#94A3B8' }}>{row.label}</div>
                  <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link href={`/contrats?athleteId=${id}`}
            className="w-full flex items-center justify-center gap-2 font-bold text-[13px] rounded-[12px] no-underline"
            style={{ padding: 12, background: '#07101A', color: '#FCD116', display: 'flex' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#132730')}
            onMouseLeave={e => (e.currentTarget.style.background = '#07101A')}
          >
            <MI name="description" size={16} style={{ color: '#FCD116' }} />
            Créer un contrat
          </Link>
        </div>

        {/* Right column */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Pill tab bar */}
          <div
            className="flex gap-0.5 rounded-xl p-1 mb-5 shrink-0"
            style={{ background: '#E8ECF1', borderRadius: 12, padding: 4, width: 'fit-content' }}
          >
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="rounded-[9px] text-[13px] transition-all"
                style={{
                  padding: '8px 18px',
                  background: tab === t.id ? '#fff' : 'transparent',
                  color: tab === t.id ? '#0F172A' : '#64748B',
                  fontWeight: tab === t.id ? 700 : 500,
                  boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div
            className="flex-1 rounded-2xl p-6"
            style={{ background: '#fff', border: '1px solid #E2E8F0' }}
          >
            {tab === 'carriere'  && <CarriereTab  athlete={athlete} />}
            {tab === 'contrats'  && <ContratsTab />}
            {tab === 'activites' && <ActivitesTab />}
            {tab === 'notes'     && <NotesTab athlete={athlete} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Carrière : timeline verticale (design Fiche Athlète.dc.html)
const CARRIERE_STATIC = [
  { periode: '2024 — Présent', club: 'Club actuel', role: 'Voir profil sportif' },
];

function CarriereTab({ athlete }: { athlete: Athlete }) {
  const entries = athlete.clubActuel
    ? [{ periode: '2024 — Présent', club: athlete.clubActuel, role: `${athlete.sport} · ${athlete.poste}` }]
    : CARRIERE_STATIC;

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 18 }}>Historique de carrière</div>
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: '#E8ECF1' }} />
        {entries.map((c, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: 24 }}>
            <div style={{ position: 'absolute', left: -21, top: 4, width: 10, height: 10, borderRadius: '50%', background: '#FCD116', border: '2px solid #fff', boxShadow: '0 0 0 2px #FCD116' }} />
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginBottom: 3 }}>{c.periode}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{c.club}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{c.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Contrats tab : liste avec icône document
function ContratsTab() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Contrats</div>
        <button style={{ padding: '6px 14px', background: '#07101A', color: '#FCD116', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Nouveau contrat
        </button>
      </div>
      <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: 13 }}>
        <MI name="gavel" size={36} style={{ color: '#E2E8F0', display: 'block', margin: '0 auto 10px' }} />
        Aucun contrat — connectez l'API pour afficher les données
      </div>
    </div>
  );
}

// Activités tab : journal avec icônes colorées
const ACTIVITES_STATIC = [
  { icon: 'event', iColor: '#3A6B84', iBg: '#EFF6FF', desc: 'Réunion de suivi — évaluation tactique', time: "Aujourd'hui" },
  { icon: 'add_circle', iColor: '#64748B', iBg: '#F1F5F9', desc: 'Fiche créée dans le CRM', time: 'À la création' },
];

function ActivitesTab() {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 18 }}>Journal d'activités</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ACTIVITES_STATIC.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: a.iBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MI name={a.icon} size={15} style={{ color: a.iColor }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{a.desc}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Notes tab : fond #FFFBEB
function NotesTab({ athlete }: { athlete: Athlete }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Notes du coach</div>
        <button style={{ padding: '6px 14px', background: '#F1F5F9', color: '#475569', fontSize: 12, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Ajouter
        </button>
      </div>
      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#78350F', lineHeight: 1.6 }}>
        {athlete.sport && athlete.poste
          ? `${athlete.prenom} ${athlete.nom} — ${athlete.sport}, ${athlete.poste}. Aucune note saisie pour le moment.`
          : 'Aucune note saisie pour le moment.'}
      </div>
    </div>
  );
}
