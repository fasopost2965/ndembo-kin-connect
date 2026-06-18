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
      <div className="flex gap-5 p-6 flex-1">

        {/* Left card — dark, 300px */}
        <div
          className="flex flex-col shrink-0 rounded-2xl overflow-hidden"
          style={{ width: 300, background: '#07101A' }}
        >
          {/* Avatar section */}
          <div
            className="flex flex-col items-center py-8 px-4 text-center"
            style={{ borderBottom: '1px solid rgba(252,209,22,0.08)' }}
          >
            <div
              className="flex items-center justify-center rounded-full text-white font-black mb-3.5"
              style={{
                width: 72, height: 72, fontSize: 24,
                background: gradientFor(athlete.id),
              }}
            >
              {initials(athlete.prenom, athlete.nom)}
            </div>
            <div className="text-[16px] font-extrabold text-white mb-0.5">
              {athlete.prenom} {athlete.nom}
            </div>
            <div className="text-[12px] capitalize mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {athlete.sport} · {athlete.poste}
            </div>
            <Badge variant={nb.variant}>{nb.label}</Badge>
          </div>

          {/* KPI mini-cards */}
          <div className="grid grid-cols-2 gap-2.5 p-4" style={{ borderBottom: '1px solid rgba(252,209,22,0.06)' }}>
            {[
              { label: 'Valeur', value: formatValeur(athlete.valeurMarchande), color: '#FCD116' },
              { label: 'Contrats', value: '2', color: '#7CC8E8' },
              { label: 'Projets', value: '1', color: '#10B981' },
              { label: 'Activités', value: '14', color: 'rgba(255,255,255,0.6)' },
            ].map(k => (
              <div
                key={k.label}
                className="rounded-xl p-3 text-center"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(252,209,22,0.07)',
                }}
              >
                <div className="text-[14px] font-extrabold" style={{ color: k.color }}>{k.value}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Contact infos */}
          <div className="flex-1 px-4 py-4 space-y-3">
            {[
              { icon: 'phone', label: 'Téléphone', value: athlete.telephone ?? '—' },
              { icon: 'mail_outline', label: 'Email', value: athlete.email ?? '—' },
              { icon: 'flag', label: 'Nationalité', value: athlete.nationalite ?? '—' },
              { icon: 'sports_soccer', label: 'Club actuel', value: athlete.clubActuel ?? '—' },
            ].map(row => (
              <div key={row.label} className="flex gap-2.5">
                <div
                  className="flex items-center justify-center rounded-[8px] shrink-0 mt-0.5"
                  style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.05)' }}
                >
                  <MI name={row.icon} size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{row.label}</div>
                  <div className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {row.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-4 pb-5 pt-2">
            <button
              className="w-full flex items-center justify-center gap-1.5 font-bold text-[13px] rounded-[10px]"
              style={{
                padding: '11px 0',
                background: 'linear-gradient(135deg,#DAA520,#F4C430)',
                color: '#07101A',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <MI name="description" size={15} style={{ color: '#07101A' }} />
              Créer un contrat
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Pill tab bar */}
          <div
            className="flex gap-1 rounded-xl p-1 mb-5 shrink-0"
            style={{ background: '#fff', border: '1px solid #E2E8F0', width: 'fit-content' }}
          >
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="px-4 py-1.5 rounded-[9px] text-[13px] font-semibold transition-all"
                style={{
                  background: tab === t.id ? '#07101A' : 'transparent',
                  color: tab === t.id ? '#FCD116' : '#64748B',
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
