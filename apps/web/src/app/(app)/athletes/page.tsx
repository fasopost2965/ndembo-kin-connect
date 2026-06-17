'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Plus, Users, TrendingUp, Trophy, Phone, Mail, Pencil, Trash2, FileSignature } from 'lucide-react';
import { athletesApi } from '@/lib/api';
import { cn, formatValeur, initials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, niveauBadge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { AthleteForm, type Athlete } from './AthleteForm';

const SPORT_FILTERS = [
  { key: '', label: 'Tous' },
  { key: 'football', label: 'Football' },
  { key: 'basketball', label: 'Basket' },
  { key: 'athletisme', label: 'Athlétisme' },
];

// Avatar gradient — DRC palette, seeded by name so it stays stable.
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

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sport, setSport] = useState('');

  const [selected, setSelected] = useState<Athlete | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Athlete | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (sport) params.sport = sport;
      const { data } = await athletesApi.list(params);
      setAthletes(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [search, sport]);

  // Debounce search; refetch on sport change.
  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const stats = useMemo(() => {
    const valeurTotale = athletes.reduce((s, a) => s + (a.valeurMarchande ?? 0), 0);
    const pros = athletes.filter((a) => a.niveau === 'PRO').length;
    return { total, valeurTotale, pros };
  }, [athletes, total]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(a: Athlete) {
    setEditing(a);
    setSelected(null);
    setFormOpen(true);
  }
  async function remove(a: Athlete) {
    if (!confirm(`Supprimer ${a.prenom} ${a.nom} ?`)) return;
    await athletesApi.delete(a.id);
    setSelected(null);
    load();
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">Athlètes</h1>
          <p className="mt-1 text-sm text-[#64748B]">{total} sportifs gérés par l&apos;agence</p>
        </div>
        <Button variant="gold" onClick={openCreate}>
          <Plus size={16} /> Ajouter un athlète
        </Button>
      </div>

      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard icon={Users} label="Total athlètes" value={stats.total.toString()} accent="#7CC8E8" />
        <StatCard icon={TrendingUp} label="Valeur du portefeuille" value={formatValeur(stats.valeurTotale)} accent="#FCD116" />
        <StatCard icon={Trophy} label="Athlètes Pro" value={stats.pros.toString()} accent="#10B981" />
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-[#E8ECF1] px-[18px] py-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un athlète…"
              className="h-9 border-[#E2E8F0] bg-[#F1F5F9] pl-9 text-xs"
            />
          </div>
          <div className="flex gap-1.5">
            {SPORT_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setSport(f.key)}
                className={cn(
                  'rounded-[7px] border px-3 py-1.5 text-[11px] font-bold transition-colors',
                  sport === f.key
                    ? 'border-[#DAA520] bg-[#FEF9EE] text-[#B45309]'
                    : 'border-[#E2E8F0] text-[#94A3B8] hover:bg-[#F8FAFC]'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[28%]">Athlète</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Club</TableHead>
              <TableHead className="text-right">Valeur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-9 animate-pulse rounded-md bg-[#F1F5F9]" />
                  </TableCell>
                </TableRow>
              ))
            ) : athletes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-[#94A3B8]">
                  Aucun athlète trouvé.
                </TableCell>
              </TableRow>
            ) : (
              athletes.map((a) => {
                const nb = niveauBadge(a.niveau);
                return (
                  <TableRow
                    key={a.id}
                    onClick={() => setSelected(a)}
                    data-state={selected?.id === a.id ? 'selected' : undefined}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: gradientFor(a.id) }}
                        >
                          {initials(a.prenom, a.nom)}
                        </span>
                        <div>
                          <div className="text-[13px] font-bold text-[#0F172A]">{a.prenom} {a.nom}</div>
                          <div className="text-[10px] text-[#94A3B8]">{a.nationalite}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs capitalize text-[#64748B]">{a.sport}</TableCell>
                    <TableCell className="text-xs text-[#64748B]">{a.poste}</TableCell>
                    <TableCell><Badge variant={nb.variant}>{nb.label}</Badge></TableCell>
                    <TableCell className="text-xs text-[#64748B]">{a.clubActuel ?? '—'}</TableCell>
                    <TableCell className="text-right text-[13px] font-bold text-[#C9960C]">
                      {formatValeur(a.valeurMarchande)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Detail drawer ── */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          {selected && (
            <AthleteDetail
              athlete={selected}
              onEdit={() => openEdit(selected)}
              onDelete={() => remove(selected)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* ── Create / Edit drawer ── */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? "Modifier l'athlète" : 'Nouvel athlète'}</SheetTitle>
            <SheetDescription>
              {editing ? `${editing.prenom} ${editing.nom}` : 'Renseignez les informations du sportif'}
            </SheetDescription>
          </SheetHeader>
          <AthleteForm
            athlete={editing}
            onCancel={() => setFormOpen(false)}
            onSaved={() => {
              setFormOpen(false);
              load();
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, accent,
}: {
  icon: React.ElementType; label: string; value: string; accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-[18px] py-[14px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F172A]">
        <Icon size={18} style={{ color: accent }} />
      </div>
      <div>
        <div className="text-xl font-extrabold leading-none tracking-tight text-[#0F172A]">{value}</div>
        <div className="mt-1 text-[11px] text-[#94A3B8]">{label}</div>
      </div>
    </div>
  );
}

function AthleteDetail({
  athlete, onEdit, onDelete,
}: {
  athlete: Athlete; onEdit: () => void; onDelete: () => void;
}) {
  const nb = niveauBadge(athlete.niveau);
  return (
    <>
      <SheetHeader>
        <SheetTitle className="sr-only">Fiche athlète</SheetTitle>
        <SheetDescription className="sr-only">Détail de l&apos;athlète sélectionné</SheetDescription>
      </SheetHeader>

      {/* Identity */}
      <div className="flex flex-col items-center text-center">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-extrabold text-white"
          style={{ background: gradientFor(athlete.id) }}
        >
          {initials(athlete.prenom, athlete.nom)}
        </span>
        <div className="mt-2.5 text-base font-extrabold text-[#0F172A]">{athlete.prenom} {athlete.nom}</div>
        <div className="mt-0.5 text-[11px] capitalize text-[#94A3B8]">{athlete.sport} · {athlete.poste}</div>
        <div className="mt-2"><Badge variant={nb.variant}>{nb.label}</Badge></div>
      </div>

      {/* Info rows */}
      <div className="mt-2 flex flex-col gap-2.5">
        <InfoRow label="Club actuel" value={athlete.clubActuel ?? '—'} strong />
        <InfoRow label="Valeur marchande" value={formatValeur(athlete.valeurMarchande)} gold />
        <InfoRow label="Nationalité" value={athlete.nationalite} />
        <InfoRow label="Priorité scouting" value={athlete.priorityScouting ?? '—'} />
        {athlete.telephone && (
          <InfoRow label="Téléphone" value={athlete.telephone} icon={<Phone size={12} className="text-[#94A3B8]" />} />
        )}
        {athlete.email && (
          <InfoRow label="Email" value={athlete.email} icon={<Mail size={12} className="text-[#94A3B8]" />} cyan />
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto flex flex-col gap-2 pt-4">
        <Button variant="gold" className="w-full">
          <FileSignature size={15} /> Créer un contrat
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onEdit}>
            <Pencil size={14} /> Modifier
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 size={14} /> Supprimer
          </Button>
        </div>
      </div>
    </>
  );
}

function InfoRow({
  label, value, strong, gold, cyan, icon,
}: {
  label: string; value: string; strong?: boolean; gold?: boolean; cyan?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#E8ECF1] pb-2.5 last:border-0">
      <span className="text-[10px] text-[#94A3B8]">{label}</span>
      <span
        className={cn(
          'flex items-center gap-1.5 text-[12px]',
          gold && 'font-bold text-[#C9960C]',
          cyan && 'text-[#3A6B84]',
          strong && 'font-semibold text-[#0F172A]',
          !gold && !cyan && !strong && 'text-[#64748B]'
        )}
      >
        {icon}
        {value}
      </span>
    </div>
  );
}
