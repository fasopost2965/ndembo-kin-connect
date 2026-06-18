'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardApi } from '@/lib/api';

// ── Icône Material Icons Outlined inline ──
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

// ── Spark bars (mini histogramme) ──
function SparkBars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-0.5" style={{ height: 28, width: 48 }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: Math.round((v / max) * 26),
            background: i === data.length - 1 ? '#FCD116' : 'rgba(255,255,255,0.12)',
          }}
        />
      ))}
    </div>
  );
}

// ── KPI Card (dark) ──
function KpiCard({
  label, value, change, changeColor, icon, iconColor, iconBg, sparks,
}: {
  label: string; value: string; change: string; changeColor: string;
  icon: string; iconColor: string; iconBg: string; sparks: number[];
}) {
  return (
    <div
      className="rounded-2xl p-5 cursor-default transition-all"
      style={{
        background: '#132130',
        border: '1px solid rgba(252,209,22,0.15)',
      }}
    >
      <div className="flex justify-between items-start mb-3.5">
        <div
          className="text-[11px] font-semibold uppercase tracking-[1px]"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          {label}
        </div>
        <div
          className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: iconBg, border: `1px solid ${iconColor}30` }}
        >
          <MI name={icon} size={16} style={{ color: iconColor }} />
        </div>
      </div>
      <div
        className="text-3xl font-black tracking-[-0.8px] leading-none mb-2.5"
        style={{ color: '#fff' }}
      >
        {value}
      </div>
      <div className="flex justify-between items-end">
        <div className="text-xs font-semibold" style={{ color: changeColor }}>{change}</div>
        <SparkBars data={sparks} />
      </div>
    </div>
  );
}

// ── Données statiques (seront remplacées par l'API) ──
const CHART_DATA = [
  { label: 'Jan', value: 15200 },
  { label: 'Fév', value: 20100 },
  { label: 'Mar', value: 18400 },
  { label: 'Avr', value: 22300 },
  { label: 'Mai', value: 24800 },
  { label: 'Juin', value: 24600 },
];

const KANBAN_COLS = [
  {
    id: 'TODO', title: 'TODO', count: 3, headColor: 'rgba(255,255,255,0.3)',
    bg: 'rgba(255,255,255,0.03)', border: 'none',
    tasks: [
      { title: 'Signature contrat joueur', tag: 'Urgent', tagColor: '#EF4444' },
      { title: 'Prép. match amical', tag: 'Moyen', tagColor: '#F59E0B' },
    ],
  },
  {
    id: 'EN_COURS', title: 'EN COURS', count: 5, headColor: '#7CC8E8',
    bg: 'rgba(124,200,232,0.05)', border: '1px solid rgba(124,200,232,0.1)',
    tasks: [
      { title: 'Scouting Europe', tag: 'Actif', tagColor: '#10B981' },
      { title: 'Négociation club EU', tag: 'Urgent', tagColor: '#EF4444' },
    ],
  },
  {
    id: 'EN_ATTENTE', title: 'EN ATTENTE', count: 2, headColor: '#DAA520',
    bg: 'rgba(218,165,32,0.05)', border: '1px solid rgba(218,165,32,0.15)',
    tasks: [
      { title: 'Contrat joueur Diabase', tag: 'Bloqué', tagColor: '#DAA520' },
    ],
  },
  {
    id: 'TERMINÉ', title: 'TERMINÉ', count: 12, headColor: '#10B981',
    bg: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)',
    tasks: [
      { title: 'Init. projet Diabase', tag: 'Fait', tagColor: '#10B981' },
      { title: 'Scouting EU Round 1', tag: 'Fait', tagColor: '#10B981' },
    ],
  },
];

const EVENTS = [
  {
    title: 'Camp Football', date: '20 Juin 2026', days: '4j',
    bg: 'rgba(58,107,132,0.2)', border: '1px solid rgba(58,107,132,0.4)',
    borderLeft: '3px solid #3A6B84', daysColor: '#7CC8E8', daysBg: 'rgba(124,200,232,0.12)',
  },
  {
    title: 'Stage Basket', date: '25 Juin 2026', days: '9j',
    bg: 'rgba(218,165,32,0.1)', border: '1px solid rgba(218,165,32,0.25)',
    borderLeft: '3px solid #DAA520', daysColor: '#FCD116', daysBg: 'rgba(252,209,22,0.1)',
  },
  {
    title: "Signature Athlète Z", date: '1 Juillet 2026', days: '15j',
    bg: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
    borderLeft: '3px solid #10B981', daysColor: '#10B981', daysBg: 'rgba(16,185,129,0.1)',
  },
];

const ACTIVITIES = [
  { icon: 'call', iconColor: '#7CC8E8', iconBg: 'rgba(124,200,232,0.1)', iconBorder: 'rgba(124,200,232,0.2)', title: 'Appel — Club Kinshasa', time: "Aujourd'hui, 14:30" },
  { icon: 'handshake', iconColor: '#10B981', iconBg: 'rgba(16,185,129,0.1)', iconBorder: 'rgba(16,185,129,0.2)', title: 'RDV — Sponsor Nike Congo', time: "Aujourd'hui, 13:00" },
  { icon: 'mail', iconColor: '#DAA520', iconBg: 'rgba(218,165,32,0.1)', iconBorder: 'rgba(218,165,32,0.2)', title: 'Email — Academy Kimbanguiste', time: "Aujourd'hui, 11:30" },
  { icon: 'task_alt', iconColor: 'rgba(255,255,255,0.35)', iconBg: 'rgba(255,255,255,0.04)', iconBorder: 'rgba(255,255,255,0.08)', title: 'Tâche terminée — Init. projet Diabase', time: 'Hier, 16:00' },
];

export default function DashboardPage() {
  const [kpis, setKpis] = useState<{
    athletesActifs: number; chiffreAffaires: number; pipeline: number; tauxConversion: number;
  } | null>(null);

  useEffect(() => {
    dashboardApi.kpis()
      .then(r => setKpis(r.data))
      .catch(() => null);
  }, []);

  const chartMax = Math.max(...CHART_DATA.map(d => d.value));

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: '100vh', background: '#0F172A' }}
    >
      {/* ── Topbar ── */}
      <div
        className="flex items-center justify-between px-8 py-3.5 shrink-0"
        style={{ background: '#0A1628', borderBottom: '1px solid rgba(252,209,22,0.08)' }}
      >
        <div>
          <div className="text-[21px] font-black tracking-[-0.4px]" style={{ color: '#fff' }}>
            Dashboard
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Vue d'ensemble · Juin 2026
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Recherche */}
          <div
            className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <MI name="search" size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Rechercher...
            </span>
          </div>
          {/* Notifications */}
          <div
            className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center cursor-pointer relative"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <MI name="notifications" size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
            <div
              className="absolute top-[7px] right-[7px] w-[7px] h-[7px] rounded-full"
              style={{ background: '#EF4444', border: '1.5px solid #0A1628' }}
            />
          </div>
          {/* Action rapide */}
          <div
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] cursor-pointer text-[13px] font-bold"
            style={{ background: 'linear-gradient(135deg,#DAA520,#F4C430)', color: '#07101A' }}
          >
            <MI name="add" size={16} />
            Action rapide
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 dark-scroll">

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard
            label="Athlètes"
            value={kpis ? String(kpis.athletesActifs) : '45'}
            change="+3 sem."
            changeColor="#FCD116"
            icon="directions_run"
            iconColor="#FCD116"
            iconBg="rgba(252,209,22,0.08)"
            sparks={[30, 35, 38, 42, 45]}
          />
          <KpiCard
            label="Clients"
            value="28"
            change="+2 sem."
            changeColor="#FCD116"
            icon="business"
            iconColor="#7CC8E8"
            iconBg="rgba(124,200,232,0.08)"
            sparks={[20, 22, 24, 26, 28]}
          />
          <KpiCard
            label="Chiffre d'affaires"
            value={kpis ? `${Math.round(kpis.chiffreAffaires / 1000)}k €` : '125k €'}
            change="+15% vs N-1"
            changeColor="#10B981"
            icon="trending_up"
            iconColor="#10B981"
            iconBg="rgba(16,185,129,0.08)"
            sparks={[14, 18, 16, 21, 23, 25]}
          />
          <KpiCard
            label="Pipeline"
            value={kpis ? `${Math.round(kpis.pipeline / 1000)}k €` : '89k €'}
            change="18j délai moyen"
            changeColor="rgba(255,255,255,0.35)"
            icon="show_chart"
            iconColor="#DAA520"
            iconBg="rgba(218,165,32,0.08)"
            sparks={[58, 70, 78, 84, 89]}
          />
        </div>

        {/* Chart + Pipeline */}
        <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: '5fr 2fr' }}>
          {/* Revenue chart */}
          <div
            className="rounded-2xl p-6"
            style={{ background: '#132130', border: '1px solid rgba(252,209,22,0.1)' }}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="text-[15px] font-bold" style={{ color: '#fff' }}>Chiffre d'affaires</div>
                <div className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Mensuel 2026</div>
              </div>
              <div
                className="flex gap-0.5 rounded-lg p-0.5"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <div
                  className="px-3 py-1.5 rounded-md text-[11px] font-bold cursor-pointer"
                  style={{ background: 'linear-gradient(135deg,#DAA520,#F4C430)', color: '#07101A' }}
                >
                  Mensuel
                </div>
                <div
                  className="px-3 py-1.5 rounded-md text-[11px] font-medium cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  Trimestriel
                </div>
              </div>
            </div>
            <div className="flex items-end gap-4" style={{ height: 150 }}>
              {CHART_DATA.map((d) => (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {Math.round(d.value / 1000)}k
                  </div>
                  <div
                    className="w-full rounded-t-md cursor-pointer transition-opacity hover:opacity-85"
                    style={{
                      height: Math.round((d.value / chartMax) * 118),
                      background: 'linear-gradient(180deg,#F4C430 0%,#8B5E04 100%)',
                    }}
                  />
                  <div className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {d.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline */}
          <div
            className="rounded-2xl p-[22px] flex flex-col"
            style={{ background: '#132130', border: '1px solid rgba(252,209,22,0.1)' }}
          >
            <div className="text-[15px] font-bold mb-1" style={{ color: '#fff' }}>Pipeline</div>
            <div className="text-[12px] mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Devis en cours</div>
            <div className="text-3xl font-black tracking-[-0.5px] leading-none" style={{ color: '#FCD116' }}>
              89 200 €
            </div>
            <div className="text-[12px] font-semibold mt-1 mb-4" style={{ color: 'rgba(252,209,22,0.6)' }}>
              en attente
            </div>
            <div className="flex-1" />
            <div
              className="flex flex-col gap-2.5 pt-3.5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              {[
                { label: 'Délai moyen', value: '18 jours', valueColor: '#fff' },
                { label: 'Conversion', value: '34%', valueColor: '#10B981' },
                { label: 'Devis actifs', value: '12', valueColor: '#fff' },
              ].map(r => (
                <div key={r.label} className="flex justify-between items-center">
                  <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.label}</span>
                  <span className="text-[13px] font-bold" style={{ color: r.valueColor }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kanban preview */}
        <div
          className="rounded-2xl p-[22px] mb-6"
          style={{ background: '#132130', border: '1px solid rgba(252,209,22,0.1)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="text-[15px] font-bold" style={{ color: '#fff' }}>Projets en cours</div>
            <Link
              href="/projets"
              className="text-[12px] font-semibold hover:opacity-75 transition-opacity"
              style={{ color: '#FCD116' }}
            >
              Voir tout →
            </Link>
          </div>
          <div className="flex gap-3">
            {KANBAN_COLS.map(col => (
              <div
                key={col.id}
                className="flex-1 rounded-[10px] p-3 min-w-0"
                style={{ background: col.bg, border: col.border || undefined }}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-[1px] mb-2.5"
                  style={{ color: col.headColor }}
                >
                  {col.title} <span style={{ opacity: 0.5 }}>·</span> {col.count}
                </div>
                {col.tasks.map((task, i) => (
                  <div
                    key={i}
                    className="rounded-[10px] p-3 mb-2 cursor-pointer transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div
                      className="text-[13px] font-semibold leading-[1.3] mb-2"
                      style={{ color: 'rgba(255,255,255,0.85)' }}
                    >
                      {task.title}
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-[5px]"
                      style={{
                        color: task.tagColor,
                        background: task.tagColor + '18',
                        border: `1px solid ${task.tagColor}30`,
                      }}
                    >
                      {task.tag}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Events + Activities */}
        <div className="grid grid-cols-2 gap-4">
          {/* Events */}
          <div
            className="rounded-2xl p-[22px]"
            style={{ background: '#132130', border: '1px solid rgba(252,209,22,0.1)' }}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="text-[15px] font-bold" style={{ color: '#fff' }}>Événements prochains</div>
              <button
                className="text-[12px] font-semibold hover:opacity-75 transition-opacity"
                style={{ color: '#FCD116' }}
              >
                + Ajouter
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {EVENTS.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-[10px]"
                  style={{
                    background: ev.bg,
                    border: ev.border,
                    borderLeft: ev.borderLeft,
                  }}
                >
                  <div className="flex-1">
                    <div className="text-[13px] font-bold" style={{ color: '#fff' }}>{ev.title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{ev.date}</div>
                  </div>
                  <div
                    className="text-[11px] font-bold px-2 py-0.5 rounded-[6px]"
                    style={{ color: ev.daysColor, background: ev.daysBg }}
                  >
                    {ev.days}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div
            className="rounded-2xl p-[22px]"
            style={{ background: '#132130', border: '1px solid rgba(252,209,22,0.1)' }}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="text-[15px] font-bold" style={{ color: '#fff' }}>Activités récentes</div>
              <Link
                href="/activites"
                className="text-[12px] font-semibold hover:opacity-75 transition-opacity"
                style={{ color: '#FCD116' }}
              >
                Voir tout →
              </Link>
            </div>
            <div className="flex flex-col gap-3.5">
              {ACTIVITIES.map((act, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
                    style={{
                      background: act.iconBg,
                      border: `1px solid ${act.iconBorder}`,
                    }}
                  >
                    <MI name={act.icon} size={15} style={{ color: act.iconColor }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      {act.title}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {act.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
