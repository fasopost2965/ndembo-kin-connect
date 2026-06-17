'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Phone, Mail, MapPin, FileSignature, Trash2, Pencil } from 'lucide-react';
import { athletesApi } from '@/lib/api';
import { initials, cn } from '@/lib/utils';

interface Athlete {
  id: string;
  nom: string;
  prenom: string;
  sport: string;
  poste: string;
  niveau: string;
  status: string;
  valeurMarchande: number;
  email: string;
  telephone: string;
  ville: string;
  age?: number;
  contrats?: number;
  projets?: number;
}

const NIVEAU_COLORS: Record<string, string> = {
  PRO: 'bg-emerald-100 text-emerald-700',
  SEMI_PRO: 'bg-blue-100 text-blue-700',
  AMATEUR: 'bg-amber-100 text-amber-700',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIF: 'bg-[#FCD116] text-[#07101A]',
  INACTIF: 'bg-slate-200 text-slate-600',
  TRANSFERT: 'bg-orange-100 text-orange-700',
  BLESSE: 'bg-red-100 text-red-700',
};

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

export default function AthleteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('carriere');

  useEffect(() => {
    if (!id) return;
    athletesApi.get(id)
      .then(r => setAthlete(r.data))
      .catch(() => router.push('/athletes'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600">Athlète non trouvé</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="text-sm text-slate-600 mb-1">Athlètes</div>
          <h1 className="text-2xl font-bold text-[#07101A]">
            {athlete.prenom} {athlete.nom}
          </h1>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <Pencil className="w-4 h-4" />
            Modifier
          </button>
          <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <Trash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          {/* Avatar Card */}
          <div
            className="rounded-3xl p-12 text-white text-center mb-6"
            style={{ background: gradientFor(athlete.id) }}
          >
            <div className="w-32 h-32 rounded-full bg-[#FCD116] text-[#07101A] font-bold text-4xl flex items-center justify-center mx-auto mb-6">
              {initials(`${athlete.prenom} ${athlete.nom}`)}
            </div>
            <h2 className="text-2xl font-bold mb-1">
              {athlete.prenom} {athlete.nom}
            </h2>
            <p className="text-white/80 text-sm mb-4">
              {athlete.sport} • {athlete.poste}
            </p>
            <div className="flex gap-2 justify-center mb-4">
              <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', NIVEAU_COLORS[athlete.niveau] || 'bg-slate-200')}>
                {athlete.niveau}
              </span>
              <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', STATUS_COLORS[athlete.status] || 'bg-slate-200')}>
                {athlete.status}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-[#FCD116] text-2xl font-bold">
                {athlete.contrats || 0}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
                Contrats
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-[#FCD116] text-2xl font-bold">
                {athlete.projets || 0}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
                Projets
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-[#3A6B84] text-2xl font-bold">
                ${(athlete.valeurMarchande / 1000).toFixed(0)}K
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
                Valeur march.
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="text-[#07101A] text-2xl font-bold">
                {athlete.age || 24}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">
                Ans
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="bg-white rounded-lg p-6 border border-slate-200 mb-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Contact
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Téléphone</div>
                  <div className="text-sm font-medium text-[#07101A]">
                    {athlete.telephone}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">E-mail</div>
                  <div className="text-sm font-medium text-[#07101A]">
                    {athlete.email}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Ville</div>
                  <div className="text-sm font-medium text-[#07101A]">
                    {athlete.ville}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button className="w-full bg-[#07101A] hover:bg-[#0F172A] text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 group">
            <FileSignature className="w-4 h-4" />
            Créer un contrat
          </button>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          {/* Tab Navigation */}
          <div className="flex gap-4 border-b border-slate-200 mb-6">
            {[
              { id: 'carriere', label: 'Carrière' },
              { id: 'contrats', label: 'Contrats' },
              { id: 'activites', label: 'Activités' },
              { id: 'notes', label: 'Notes' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'pb-3 px-1 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-[#FCD116] text-[#07101A]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
            <p>Contenu de l'onglet "{activeTab}" - À implémenter</p>
          </div>
        </div>
      </div>
    </div>
  );
}
