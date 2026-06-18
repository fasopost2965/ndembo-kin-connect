'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { athletesApi } from '@/lib/api';
import { cn, formatValeur, initials } from '@/lib/utils';
import { Badge, niveauBadge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { AthleteForm, type Athlete } from './AthleteForm';

// ── Icône Material Icons Outlined ──
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

const SPORT_FILTERS = [
  { key: '', label: 'Tous les sports' },
  { key: 'football', label: 'Football' },
  { key: 'basketball', label: 'Basket' },
  { key: 'athletisme', label: 'Athlétisme' },
];

const NIVEAU_FILTERS = [
  { key: '', label: 'Tous niveaux' },
  { key: 'PRO', label: 'Pro' },
  { key: 'SEMI_PRO', label: 'Semi-pro' },
  { key: 'AMATEUR', label: 'Amateur' },
];

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
  const [niveau, setNiveau] = useState('');

  const [selected, setSelected] = useState<Athlete | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Athlete | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (sport) params.sport = sport;
      if (niveau) params.niveau = niveau;
      const { data } = await athletesApi.list(params);
      setAthletes(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [search, sport, niveau]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const stats = useMemo(() => {
    const valeurTotale = athletes.reduce((s, a) => s + (a.valeurMarchande ?? 0), 0);
    const pros = athletes.filter((a) => a.niveau === 'PRO').length;
    const semiPros = athletes.filter((a) => a.niveau === 'SEMI_PRO').length;
    return { total, valeurTotale, pros, semiPros };
  }, [athletes, total]);

  async function remove(a: Athlete) {
    if (!confirm(`Supprimer ${a.prenom} ${a.nom} ?`)) return;
    await athletesApi.delete(a.id);
    setSelected(null);
    load();
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* ── Topbar ── */}
      <div
        className="flex items-center gap-3 px-6 shrink-0"
        style={{
          background: '#fff',
          borderBottom: '1px solid #E8ECF1',
          height: 60,
        }}
      >
        <div className="flex-1 flex items-center gap-3">
          <span className="text-[18px] font-extrabold tracking-[-0.3px]" style={{ color: '#0F172A' }}>
            Athlètes
          </span>
          <span
            className="px-2 py-0.5 rounded-lg text-[11px] font-bold"
            style={{ background: '#EBF6FB', color: '#3A6B84' }}
          >
            {total}
          </span>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 rounded-[9px]"
          style={{
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            height: 36,
            minWidth: 220,
          }}
        >
          <MI name="search" size={15} style={{ color: '#94A3B8' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un athlète…"
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: '#334155',
              width: '100%',
            }}
          />
        </div>

        {/* Sport filter */}
        <select
          value={sport}
          onChange={e => setSport(e.target.value)}
          className="rounded-[9px] px-3 text-[13px] font-medium cursor-pointer"
          style={{
            height: 36,
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            color: '#334155',
            outline: 'none',
          }}
        >
          {SPORT_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>

        {/* Niveau filter */}
        <select
          value={niveau}
          onChange={e => setNiveau(e.target.value)}
          className="rounded-[9px] px-3 text-[13px] font-medium cursor-pointer"
          style={{
            height: 36,
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            color: '#334155',
            outline: 'none',
          }}
        >
          {NIVEAU_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>

        {/* Add button */}
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-1.5 px-4 font-bold text-[13px] rounded-[9px] transition-colors"
          style={{
            height: 36,
            background: '#07101A',
            color: '#FCD116',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <MI name="add" size={15} style={{ color: '#FCD116' }} />
          Ajouter un athlète
        </button>
      </div>

      <div className="flex-1 p-6">
        {/* ── Stat cards ── */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            {
              icon: 'directions_run', label: 'Total athlètes',
              value: stats.total.toString(), iconColor: '#7CC8E8', iconBg: '#EBF6FB',
            },
            {
              icon: 'emoji_events', label: 'Athlètes Pro',
              value: stats.pros.toString(), iconColor: '#DAA520', iconBg: '#FEF9EE',
            },
            {
              icon: 'group', label: 'Semi-professionnels',
              value: stats.semiPros.toString(), iconColor: '#3A6B84', iconBg: '#EBF6FB',
            },
            {
              icon: 'trending_up', label: 'Valeur du portefeuille',
              value: formatValeur(stats.valeurTotale), iconColor: '#10B981', iconBg: '#ECFDF5',
            },
          ].map(s => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-2xl p-4"
              style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <div
                className="flex items-center justify-center shrink-0 rounded-xl"
                style={{ width: 40, height: 40, background: s.iconBg }}
              >
                <MI name={s.icon} size={18} style={{ color: s.iconColor }} />
              </div>
              <div>
                <div className="text-[20px] font-extrabold leading-none tracking-[-0.3px]" style={{ color: '#0F172A' }}>
                  {s.value}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table card ── */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderBottom: '1px solid #E8ECF1' }}>
                <TableHead className="w-[28%]">Athlète</TableHead>
                <TableHead>Sport</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead className="text-right">Valeur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <div className="h-9 animate-pulse rounded-md" style={{ background: '#F1F5F9' }} />
                    </TableCell>
                  </TableRow>
                ))
              ) : athletes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm" style={{ color: '#94A3B8' }}>
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
                            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
                            style={{ background: gradientFor(a.id) }}
                          >
                            {initials(a.prenom, a.nom)}
                          </span>
                          <div>
                            <div className="text-[13px] font-bold" style={{ color: '#0F172A' }}>
                              {a.prenom} {a.nom}
                            </div>
                            <div className="text-[10px]" style={{ color: '#94A3B8' }}>{a.nationalite}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm capitalize" style={{ color: '#64748B' }}>{a.sport}</TableCell>
                      <TableCell className="text-sm" style={{ color: '#64748B' }}>{a.poste}</TableCell>
                      <TableCell><Badge variant={nb.variant}>{nb.label}</Badge></TableCell>
                      <TableCell className="text-right text-[13px] font-bold" style={{ color: '#C9960C' }}>
                        {formatValeur(a.valeurMarchande)}
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                          style={{ background: '#ECFDF5', color: '#0D9668' }}
                        >
                          Actif
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/athletes/${a.id}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center justify-center w-7 h-7 rounded-[7px] hover:bg-[#F1F5F9] transition-colors"
                          >
                            <MI name="open_in_new" size={14} style={{ color: '#94A3B8' }} />
                          </Link>
                          <button
                            onClick={e => { e.stopPropagation(); setEditing(a); setSelected(null); setFormOpen(true); }}
                            className="flex items-center justify-center w-7 h-7 rounded-[7px] hover:bg-[#F1F5F9] transition-colors"
                          >
                            <MI name="edit" size={14} style={{ color: '#94A3B8' }} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); remove(a); }}
                            className="flex items-center justify-center w-7 h-7 rounded-[7px] hover:bg-[#FEF2F2] transition-colors"
                          >
                            <MI name="delete_outline" size={14} style={{ color: '#EF4444' }} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Detail drawer ── */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="p-0 gap-0 max-w-[380px]" style={{ background: '#fff' }}>
          {selected && (
            <AthleteDetail
              athlete={selected}
              onEdit={() => { setEditing(selected); setSelected(null); setFormOpen(true); }}
              onDelete={() => remove(selected)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* ── Form drawer ── */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="max-w-[480px]">
          <SheetTitle>{editing ? "Modifier l'athlète" : 'Nouvel athlète'}</SheetTitle>
          <SheetDescription className="sr-only">
            {editing ? `${editing.prenom} ${editing.nom}` : 'Renseignez les informations du sportif'}
          </SheetDescription>
          <AthleteForm
            athlete={editing}
            onCancel={() => setFormOpen(false)}
            onSaved={() => { setFormOpen(false); load(); }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Fiche athlète dans le drawer ──
function AthleteDetail({ athlete, onEdit, onDelete }: {
  athlete: Athlete; onEdit: () => void; onDelete: () => void;
}) {
  const nb = niveauBadge(athlete.niveau);

  return (
    <div className="flex flex-col h-full">

      {/* Dark header */}
      <div
        className="flex flex-col items-center pt-8 pb-6 px-6 text-center shrink-0"
        style={{
          background: '#07101A',
          borderBottom: '1px solid rgba(252,209,22,0.08)',
        }}
      >
        <span
          className="flex items-center justify-center rounded-full text-2xl font-black text-white mb-3"
          style={{
            width: 72,
            height: 72,
            background: gradientFor(athlete.id),
          }}
        >
          {initials(athlete.prenom, athlete.nom)}
        </span>
        <div className="text-[17px] font-extrabold text-white mb-0.5">
          {athlete.prenom} {athlete.nom}
        </div>
        <div className="text-[12px] capitalize mb-2.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {athlete.sport} · {athlete.poste}
        </div>
        <Badge variant={nb.variant}>{nb.label}</Badge>
      </div>

      {/* KPI mini-cards */}
      <div className="grid grid-cols-3 gap-2.5 px-4 py-4 shrink-0"
        style={{ borderBottom: '1px solid #E8ECF1' }}>
        {[
          { label: 'Valeur', value: formatValeur(athlete.valeurMarchande), color: '#C9960C' },
          { label: 'Contrats', value: '2', color: '#3A6B84' },
          { label: 'Activités', value: '14', color: '#10B981' },
        ].map(k => (
          <div
            key={k.label}
            className="rounded-xl p-3 text-center"
            style={{ background: '#F8FAFC', border: '1px solid #E8ECF1' }}
          >
            <div className="text-[15px] font-extrabold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[10px] mt-0.5" style={{ color: '#94A3B8' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Info rows */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {[
          { label: 'Club actuel', value: athlete.clubActuel ?? '—', bold: true },
          { label: 'Nationalité', value: athlete.nationalite },
          { label: 'Priorité scouting', value: athlete.priorityScouting ?? '—' },
          { label: 'Téléphone', value: athlete.telephone ?? '—', icon: 'call' },
          { label: 'Email', value: athlete.email ?? '—', icon: 'mail_outline', cyan: true },
        ].map(row => (
          <div
            key={row.label}
            className="flex items-center justify-between py-2.5"
            style={{ borderBottom: '1px solid #F1F5F9' }}
          >
            <span className="text-[11px]" style={{ color: '#94A3B8' }}>{row.label}</span>
            <span
              className="flex items-center gap-1.5 text-[12px]"
              style={{
                color: row.cyan ? '#3A6B84' : row.bold ? '#0F172A' : '#64748B',
                fontWeight: row.bold ? 600 : 400,
              }}
            >
              {row.icon && <MI name={row.icon} size={12} style={{ color: '#94A3B8' }} />}
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-4 pb-5 pt-3 shrink-0" style={{ borderTop: '1px solid #E8ECF1' }}>
        <button
          className="w-full flex items-center justify-center gap-1.5 font-bold text-[13px] rounded-[10px] mb-2.5 transition-colors"
          style={{
            padding: '11px 0',
            background: '#07101A',
            color: '#FCD116',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <MI name="description" size={15} style={{ color: '#FCD116' }} />
          Créer un contrat
        </button>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-[10px] transition-colors"
            style={{
              padding: '9px 0',
              background: '#F1F5F9',
              border: '1px solid #E2E8F0',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <MI name="edit" size={14} style={{ color: '#64748B' }} />
            Modifier
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1 text-[13px] font-semibold rounded-[10px] transition-colors px-4"
            style={{
              padding: '9px 14px',
              background: '#FFF1F2',
              border: '1px solid #FECDD3',
              color: '#BE123C',
              cursor: 'pointer',
            }}
          >
            <MI name="delete_outline" size={14} style={{ color: '#BE123C' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

