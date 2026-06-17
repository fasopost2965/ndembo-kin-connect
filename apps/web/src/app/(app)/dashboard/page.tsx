'use client';

import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import { TrendingUp, TrendingDown, DollarSign, Target, Users, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface KpiCardProps {
  label: string;
  value: number;
  variation: number;
  icon: React.ElementType;
  prefix?: string;
  suffix?: string;
  valueColor?: string;
}

function KpiCard({
  label,
  value,
  variation,
  icon: Icon,
  prefix = '',
  suffix = '',
  valueColor = 'text-[#07101A]',
}: KpiCardProps) {
  const up = variation >= 0;
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="bg-[#07101A] rounded-xl p-2.5">
          <Icon size={18} className="text-[#FCD116]" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(variation)}%
        </div>
      </div>
      <div className={cn('text-2xl font-bold mb-1', valueColor)}>
        {prefix}{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}{suffix}
      </div>
      <div className="text-sm text-slate-600">{label}</div>
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
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#07101A]">Dashboard</h1>
        <p className="text-sm text-slate-600 mt-2">Vue d'ensemble · Ndembo Kin Connect</p>
      </div>

      {/* KPI Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-slate-200 h-32 animate-pulse"
            />
          ))}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KpiCard
            label="CA TOTAL"
            value={kpis.chiffreAffaires}
            variation={kpis.chiffreAffairesVariation}
            icon={DollarSign}
            prefix="$"
            valueColor="text-[#07101A]"
          />
          <KpiCard
            label="ENCAISSÉ"
            value={Math.round(kpis.chiffreAffaires * 0.38)}
            variation={12}
            icon={CheckCircle2}
            prefix="$"
            valueColor="text-emerald-600"
          />
          <KpiCard
            label="EN ATTENTE"
            value={Math.round(kpis.chiffreAffaires * 0.29)}
            variation={8}
            icon={Clock}
            prefix="$"
            valueColor="text-amber-600"
          />
          <KpiCard
            label="EN RETARD"
            value={Math.round(kpis.chiffreAffaires * 0.075)}
            variation={-5}
            icon={AlertCircle}
            prefix="$"
            valueColor="text-red-600"
          />
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Nouvel athlète',
            href: '/athletes',
            color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
          },
          {
            label: 'Créer un devis',
            href: '/devis',
            color: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200',
          },
          {
            label: 'Voir les factures',
            href: '/factures',
            color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
          },
        ].map(({ label, href, color }) => (
          <a
            key={href}
            href={href}
            className={cn(
              'flex items-center justify-center py-4 rounded-xl border font-semibold text-sm transition-all hover:shadow-md',
              color
            )}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
