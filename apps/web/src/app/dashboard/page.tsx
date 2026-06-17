'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import { TrendingUp, TrendingDown, Users, Trophy, DollarSign, Target } from 'lucide-react';

interface KPI {
  chiffreAffaires: number;
  chiffreAffairesVariation: number;
  pipeline: number;
  pipelineVariation: number;
  athletesActifs: number;
  athletesVariation: number;
  tauxConversion: number;
  tauxConversionVariation: number;
}

function KpiCard({
  label, value, variation, icon: Icon, prefix = '', suffix = '',
}: {
  label: string; value: number; variation: number; icon: React.ElementType;
  prefix?: string; suffix?: string;
}) {
  const up = variation >= 0;
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="bg-[#0F172A] rounded-xl p-2.5">
          <Icon size={18} className="text-[#DAA520]" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(variation)}%
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">
        {prefix}{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}{suffix}
      </div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.kpis()
      .then(r => setKpis(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Vue d'ensemble · Ndembo Kin Connect</p>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 h-32 animate-pulse" />
          ))}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard label="Chiffre d'affaires" value={kpis.chiffreAffaires} variation={kpis.chiffreAffairesVariation} icon={DollarSign} prefix="$" />
          <KpiCard label="Pipeline commercial" value={kpis.pipeline} variation={kpis.pipelineVariation} icon={Target} prefix="$" />
          <KpiCard label="Athlètes actifs" value={kpis.athletesActifs} variation={kpis.athletesVariation} icon={Users} />
          <KpiCard label="Taux de conversion" value={kpis.tauxConversion} variation={kpis.tauxConversionVariation} icon={Trophy} suffix="%" />
        </div>
      ) : null}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Nouvel athlète', href: '/athletes/new', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Nouveau client', href: '/clients/new', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'Créer un devis', href: '/devis/new', color: 'bg-amber-50 text-amber-700 border-amber-200' },
        ].map(({ label, href, color }) => (
          <a
            key={href}
            href={href}
            className={`flex items-center justify-center py-4 rounded-xl border font-semibold text-sm transition-opacity hover:opacity-80 ${color}`}
          >
            + {label}
          </a>
        ))}
      </div>
    </div>
  );
}
