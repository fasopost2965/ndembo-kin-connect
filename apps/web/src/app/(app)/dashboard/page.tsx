'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dashboardApi } from '@/lib/api';

// ── Icons ──
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

// ── Counter animation hook ──
function useCountUp(target: number, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(ease * target));
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

// ── KPI Card (light mode) ──
function KpiCard({
  label, value, rawValue, unit, prefix, change, changeColor, changeIcon,
  icon, iconColor, iconBg, borderColor, delay,
}: {
  label: string; value?: string; rawValue?: number; unit?: string; prefix?: string;
  change: string; changeColor: string; changeIcon: string;
  icon: string; iconColor: string; iconBg: string; borderColor: string; delay: number;
}) {
  const counted = useCountUp(rawValue ?? 0, 900);
  const display = rawValue !== undefined
    ? `${prefix ?? ''}${counted.toLocaleString('fr-FR')}${unit ?? ''}`
    : value ?? '';

  return (
    <div
      className="rounded-2xl p-5 cursor-default"
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        animation: `fadeInUp 0.4s ease both`,
        animationDelay: `${delay}ms`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(0,0,0,0.10)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94A3B8' }}>
          {label}
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MI name={icon} size={18} style={{ color: iconColor }} />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.8px', lineHeight: 1, marginBottom: 10 }}>
        {display}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <MI name={changeIcon} size={14} style={{ color: changeColor }} />
        <div style={{ fontSize: 12, fontWeight: 600, color: changeColor }}>{change}</div>
      </div>
    </div>
  );
}

// ── Animated bar chart ──
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 200); }, []);
  const max = Math.max(...data.map(d => d.value));

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160 }}>
      {data.map((d, i) => {
        const pct = d.value / max;
        const h = Math.round(pct * 130);
        return (
          <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>{Math.round(d.value / 1000)}k</div>
            <div style={{ width: '100%', position: 'relative', height: 130, display: 'flex', alignItems: 'flex-end' }}>
              <div
                style={{
                  width: '100%', borderRadius: '6px 6px 0 0', overflow: 'hidden',
                  background: i === data.length - 1
                    ? 'linear-gradient(180deg, #FCD116 0%, #D4A017 100%)'
                    : 'linear-gradient(180deg, #7CC8E8 0%, #3A6B84 100%)',
                  height: mounted ? h : 0,
                  transition: `height 0.6s cubic-bezier(0.34,1.56,0.64,1) ${i * 80}ms`,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

const CHART_DATA = [
  { label: 'Jan', value: 15200 },
  { label: 'Fév', value: 20100 },
  { label: 'Mar', value: 18400 },
  { label: 'Avr', value: 22300 },
  { label: 'Mai', value: 24800 },
  { label: 'Juin', value: 24600 },
];

const KANBAN_COLS = [
  { id: 'TODO',       title: 'À faire',    count: 3,  dot: '#94A3B8', bg: '#F8FAFC',  border: '#E2E8F0',
    tasks: [{ title: 'Signature contrat joueur', tag: 'Urgent', tagColor: '#EF4444' }, { title: 'Prép. match amical', tag: 'Moyen', tagColor: '#F59E0B' }] },
  { id: 'EN_COURS',   title: 'En cours',   count: 5,  dot: '#2563EB', bg: '#EFF6FF',  border: '#BFDBFE',
    tasks: [{ title: 'Scouting Europe', tag: 'Actif', tagColor: '#10B981' }, { title: 'Négociation club EU', tag: 'Urgent', tagColor: '#EF4444' }] },
  { id: 'EN_ATTENTE', title: 'En attente', count: 2,  dot: '#F59E0B', bg: '#FEF9EE',  border: '#FDE68A',
    tasks: [{ title: 'Contrat joueur Diabase', tag: 'Bloqué', tagColor: '#F59E0B' }] },
  { id: 'TERMINÉ',    title: 'Terminé',    count: 12, dot: '#059669', bg: '#F0FDF4',  border: '#BBF7D0',
    tasks: [{ title: 'Init. projet Diabase', tag: 'Fait', tagColor: '#059669' }, { title: 'Scouting EU Round 1', tag: 'Fait', tagColor: '#059669' }] },
];

const EVENTS = [
  { title: 'Camp Football',     date: '20 Juin 2026', days: '4j',  dotColor: '#3A6B84', tagBg: 'rgba(58,107,132,0.1)',  tagColor: '#3A6B84' },
  { title: 'Stage Basket',      date: '25 Juin 2026', days: '9j',  dotColor: '#F59E0B', tagBg: 'rgba(245,158,11,0.1)',  tagColor: '#B45309' },
  { title: 'Signature Athlète Z', date: '1 Juillet 2026', days: '15j', dotColor: '#10B981', tagBg: 'rgba(16,185,129,0.1)', tagColor: '#059669' },
];

const ACTIVITIES = [
  { icon: 'call',      iconColor: '#3A6B84', iconBg: '#EFF6FF', title: 'Appel — Club Kinshasa',          time: "Aujourd'hui, 14:30" },
  { icon: 'handshake', iconColor: '#059669', iconBg: '#F0FDF4', title: 'RDV — Sponsor Nike Congo',        time: "Aujourd'hui, 13:00" },
  { icon: 'mail',      iconColor: '#B45309', iconBg: '#FEF9EE', title: "Email — Academy Kimbanguiste",    time: "Aujourd'hui, 11:30" },
  { icon: 'task_alt',  iconColor: '#6D28D9', iconBg: '#F5F3FF', title: 'Tâche terminée — Init. Diabase',  time: 'Hier, 16:00' },
];

const CARD_STYLE: React.CSSProperties = {
  background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

export default function DashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<{
    athletesActifs: number; chiffreAffaires: number; pipeline: number; tauxConversion: number;
  } | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [period, setPeriod] = useState<'mensuel' | 'trimestriel'>('mensuel');

  useEffect(() => {
    dashboardApi.kpis().then(r => setKpis(r.data)).catch(() => null);
  }, []);

  // Close action dropdown when clicking outside
  useEffect(() => {
    if (!actionOpen) return;
    const handler = () => setActionOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [actionOpen]);

  const chartMax = Math.max(...CHART_DATA.map(d => d.value));

  return (
    <>
      {/* Global keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-col" style={{ minHeight: '100vh', background: '#F0F2F5' }}>

        {/* ── Topbar ── */}
        <div
          className="flex items-center justify-between px-8 py-3.5 shrink-0"
          style={{ background: '#fff', borderBottom: '1px solid #E8ECF1' }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#07101A', letterSpacing: '-0.4px' }}>Dashboard</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>Vue d'ensemble · Juin 2026</div>
          </div>
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] cursor-pointer"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
            >
              <MI name="search" size={16} style={{ color: '#94A3B8' }} />
              <span style={{ fontSize: 13, color: '#94A3B8' }}>Rechercher...</span>
            </div>
            <div
              className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center cursor-pointer relative"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
            >
              <MI name="notifications" size={18} style={{ color: '#64748B' }} />
              <div className="absolute top-[7px] right-[7px] w-[7px] h-[7px] rounded-full" style={{ background: '#EF4444', border: '1.5px solid #F0F2F5' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <div
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] cursor-pointer text-[13px] font-bold"
                style={{ background: '#07101A', color: '#FCD116' }}
                onClick={e => { e.stopPropagation(); setActionOpen(o => !o); }}
              >
                <MI name="add" size={16} style={{ color: '#FCD116' }} />
                Action rapide
                <MI name={actionOpen ? 'expand_less' : 'expand_more'} size={16} style={{ color: '#FCD116' }} />
              </div>
              {actionOpen && (
                <div
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 50,
                    background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                    border: '1px solid #E2E8F0', padding: 6, minWidth: 210,
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  {[
                    { icon: 'directions_run', label: 'Nouvel athlète',       path: '/athletes' },
                    { icon: 'request_quote',  label: 'Nouveau devis',        path: '/devis' },
                    { icon: 'description',    label: 'Générer un contrat',   path: '/contrats' },
                    { icon: 'apartment',      label: 'Nouveau client',       path: '/clients' },
                  ].map(item => (
                    <button
                      key={item.path}
                      onClick={() => { setActionOpen(false); router.push(item.path); }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-left text-[13px] font-semibold transition-colors"
                      style={{ color: '#0F172A', background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <MI name={item.icon} size={16} style={{ color: '#3A6B84' }} />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <KpiCard
              label="Chiffre d'affaires"
              rawValue={kpis ? Math.round(kpis.chiffreAffaires / 1000) : 125}
              unit="k $"
              change="+15% vs N-1"
              changeColor="#059669"
              changeIcon="trending_up"
              icon="trending_up"
              iconColor="#3A6B84"
              iconBg="#EFF6FF"
              borderColor="#3A6B84"
              delay={0}
            />
            <KpiCard
              label="Pipeline"
              rawValue={kpis ? Math.round(kpis.pipeline / 1000) : 89}
              unit="k $"
              change="18j délai moyen"
              changeColor="#F59E0B"
              changeIcon="schedule"
              icon="show_chart"
              iconColor="#F59E0B"
              iconBg="#FEF9EE"
              borderColor="#F59E0B"
              delay={80}
            />
            <KpiCard
              label="Athlètes actifs"
              rawValue={kpis ? kpis.athletesActifs : 45}
              change="+3 cette semaine"
              changeColor="#0E7490"
              changeIcon="arrow_upward"
              icon="directions_run"
              iconColor="#0E7490"
              iconBg="rgba(124,200,232,0.15)"
              borderColor="#7CC8E8"
              delay={160}
            />
            <KpiCard
              label="Taux de conversion"
              rawValue={kpis ? Math.round(kpis.tauxConversion) : 34}
              unit="%"
              change="+4% ce trimestre"
              changeColor="#059669"
              changeIcon="arrow_upward"
              icon="percent"
              iconColor="#059669"
              iconBg="#F0FDF4"
              borderColor="#059669"
              delay={240}
            />
          </div>

          {/* Chart + Pipeline */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: '5fr 2fr' }}>
            {/* Revenue chart */}
            <div style={{ ...CARD_STYLE, padding: '24px 24px 20px', animation: 'fadeInUp 0.4s ease both', animationDelay: '100ms' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Chiffre d'affaires</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Mensuel 2026</div>
                </div>
                <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: '#F1F5F9' }}>
                  <div className="px-3 py-1.5 rounded-md text-[11px] font-bold cursor-pointer"
                    onClick={() => setPeriod('mensuel')}
                    style={{ background: period === 'mensuel' ? '#07101A' : 'transparent', color: period === 'mensuel' ? '#FCD116' : '#94A3B8' }}>
                    Mensuel
                  </div>
                  <div className="px-3 py-1.5 rounded-md text-[11px] font-medium cursor-pointer"
                    onClick={() => setPeriod('trimestriel')}
                    style={{ background: period === 'trimestriel' ? '#07101A' : 'transparent', color: period === 'trimestriel' ? '#FCD116' : '#94A3B8' }}>
                    Trimestriel
                  </div>
                </div>
              </div>
              <BarChart data={CHART_DATA} />
            </div>

            {/* Pipeline card */}
            <div style={{ ...CARD_STYLE, padding: 22, display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.4s ease both', animationDelay: '180ms' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>Pipeline</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>Devis en cours</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#07101A', letterSpacing: '-0.5px', lineHeight: 1 }}>
                89 200 $
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', marginTop: 4, marginBottom: 16 }}>en attente</div>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
                {[
                  { label: 'Délai moyen',  value: '18 jours', color: '#0F172A' },
                  { label: 'Conversion',   value: '34%',      color: '#059669' },
                  { label: 'Devis actifs', value: '12',       color: '#0F172A' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kanban preview */}
          <div style={{ ...CARD_STYLE, padding: 22, marginBottom: 20, animation: 'fadeInUp 0.4s ease both', animationDelay: '200ms' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Projets en cours</div>
              <Link href="/projets" style={{ fontSize: 12, fontWeight: 600, color: '#3A6B84', textDecoration: 'none' }}>
                Voir tout →
              </Link>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {KANBAN_COLS.map(col => (
                <div key={col.id} style={{ flex: 1, borderRadius: 12, padding: 12, background: col.bg, border: `1px solid ${col.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#64748B' }}>{col.title}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: col.dot, marginLeft: 2 }}>{col.count}</span>
                  </div>
                  {col.tasks.map((task, i) => (
                    <div key={i} style={{ borderRadius: 9, padding: '10px 12px', marginBottom: 7, background: '#fff', border: '1px solid #E2E8F0', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', lineHeight: 1.35, marginBottom: 6 }}>{task.title}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: task.tagColor, background: task.tagColor + '18', border: `1px solid ${task.tagColor}30`, padding: '2px 8px', borderRadius: 5 }}>
                        {task.tag}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Events + Activities */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Events */}
            <div style={{ ...CARD_STYLE, padding: 22, animation: 'fadeInUp 0.4s ease both', animationDelay: '280ms' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Événements prochains</div>
                <button onClick={() => router.push('/jalons')} style={{ fontSize: 12, fontWeight: 600, color: '#3A6B84', background: 'none', border: 'none', cursor: 'pointer' }}>+ Ajouter</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {EVENTS.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, background: '#F8FAFC', border: '1px solid #E2E8F0', borderLeft: `3px solid ${ev.dotColor}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{ev.title}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{ev.date}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: ev.tagColor, background: ev.tagBg, padding: '3px 9px', borderRadius: 8 }}>
                      {ev.days}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activities */}
            <div style={{ ...CARD_STYLE, padding: 22, animation: 'fadeInUp 0.4s ease both', animationDelay: '320ms' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Activités récentes</div>
                <Link href="/activites" style={{ fontSize: 12, fontWeight: 600, color: '#3A6B84', textDecoration: 'none' }}>
                  Voir tout →
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {ACTIVITIES.map((act, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: act.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MI name={act.icon} size={16} style={{ color: act.iconColor }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{act.title}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{act.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
