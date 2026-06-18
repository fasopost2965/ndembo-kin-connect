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
            {tab === 'carriere' && <CarriereTab athlete={athlete} />}
            {tab === 'contrats' && <EmptyTab label="Contrats" icon="gavel" />}
            {tab === 'activites' && <EmptyTab label="Activités" icon="history" />}
            {tab === 'notes' && <EmptyTab label="Notes" icon="sticky_note_2" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function CarriereTab({ athlete }: { athlete: Athlete }) {
  const sections = [
    {
      title: 'Informations sportives',
      rows: [
        { label: 'Sport', value: athlete.sport, capitalize: true },
        { label: 'Poste', value: athlete.poste },
        { label: 'Niveau', value: athlete.niveau },
        { label: 'Club actuel', value: athlete.clubActuel ?? '—' },
        { label: 'Priorité scouting', value: athlete.priorityScouting ?? '—' },
      ],
    },
    {
      title: 'Informations personnelles',
      rows: [
        { label: 'Nationalité', value: athlete.nationalite ?? '—' },
        { label: 'Date de naissance', value: athlete.dateNaissance ?? '—' },
        { label: 'Téléphone', value: athlete.telephone ?? '—' },
        { label: 'Email', value: athlete.email ?? '—' },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      {sections.map(section => (
        <div key={section.title}>
          <div className="text-[11px] font-bold uppercase tracking-[1.5px] mb-3.5" style={{ color: '#94A3B8' }}>
            {section.title}
          </div>
          <div className="space-y-3">
            {section.rows.map(row => (
              <div
                key={row.label}
                className="flex justify-between items-center py-2.5"
                style={{ borderBottom: '1px solid #F1F5F9' }}
              >
                <span className="text-[12px]" style={{ color: '#94A3B8' }}>{row.label}</span>
                <span
                  className="text-[13px] font-semibold"
                  style={{
                    color: '#0F172A',
                    textTransform: row.capitalize ? 'capitalize' : undefined,
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyTab({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16" style={{ color: '#94A3B8' }}>
      <MI name={icon} size={40} style={{ color: '#E2E8F0', marginBottom: 12 }} />
      <div className="text-[14px] font-semibold" style={{ color: '#CBD5E1' }}>Aucun(e) {label.toLowerCase()}</div>
      <div className="text-[12px] mt-1">Les données apparaîtront ici</div>
    </div>
  );
}
