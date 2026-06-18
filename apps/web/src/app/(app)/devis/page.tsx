'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { devisApi } from '@/lib/api';
import { formatMontant } from '@/lib/utils';
import { Badge, devisStatutBadge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DevisForm } from './DevisForm';

function MI({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', ...style }}>
      {name}
    </span>
  );
}

interface Devis {
  id: string; numero: string; client?: { nom: string };
  montantHT: number; montantTTC: number;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' | 'CONVERTI';
  createdAt: string;
}

export default function DevisPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await devisApi.list();
      setRows(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function valider(d: Devis) {
    setBusyId(d.id);
    try { await devisApi.updateStatut(d.id, 'VALIDE'); await load(); }
    finally { setBusyId(null); }
  }

  async function convertir(d: Devis) {
    if (!confirm(`Convertir ${d.numero} en facture ?`)) return;
    setBusyId(d.id);
    try {
      const { data } = await devisApi.convert(d.id);
      await load();
      router.push(`/factures?focus=${data.id}`);
    } catch {
      alert('Conversion impossible. Le devis doit être validé.');
    } finally { setBusyId(null); }
  }

  const totalPipeline = rows.filter(d => d.statut !== 'REFUSE').reduce((s, d) => s + d.montantTTC, 0);
  const pending = rows.filter(d => d.statut === 'EN_ATTENTE').length;
  const valides = rows.filter(d => d.statut === 'VALIDE').length;
  const convertis = rows.filter(d => d.statut === 'CONVERTI').length;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* ── Topbar with tab toggle ── */}
      <div
        className="flex items-center gap-4 shrink-0"
        style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', height: 60, padding: '0 28px' }}
      >
        <div className="text-[18px] font-extrabold tracking-[-0.3px]" style={{ color: '#0F172A' }}>
          Devis
        </div>

        {/* Tab toggle */}
        <div
          className="flex gap-0.5 rounded-lg p-0.5 ml-2"
          style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}
        >
          {/* Devis — active */}
          <div
            className="px-4 py-1.5 rounded-md text-[13px] font-bold"
            style={{ background: '#07101A', color: '#FCD116' }}
          >
            Devis
          </div>
          <Link
            href="/factures"
            className="px-4 py-1.5 rounded-md text-[13px] font-medium"
            style={{ color: '#64748B' }}
          >
            Factures
          </Link>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 px-4 font-bold text-[13px] rounded-[9px]"
          style={{ height: 36, background: '#07101A', color: '#FCD116', border: 'none', cursor: 'pointer' }}
        >
          <MI name="add" size={15} style={{ color: '#FCD116' }} />
          Nouveau devis
        </button>
      </div>

      <div className="flex-1 p-6">

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { icon: 'request_quote', label: 'Devis total', value: rows.length.toString(), iconColor: '#3A6B84', iconBg: '#EBF6FB' },
            { icon: 'pending', label: 'En attente', value: pending.toString(), iconColor: '#DAA520', iconBg: '#FEF9EE' },
            { icon: 'check_circle', label: 'Validés', value: valides.toString(), iconColor: '#10B981', iconBg: '#ECFDF5' },
            { icon: 'swap_horiz', label: 'Pipeline TTC', value: formatMontant(totalPipeline), iconColor: '#7CC8E8', iconBg: '#EBF6FB' },
          ].map(k => (
            <div
              key={k.label}
              className="flex items-center gap-3 rounded-2xl p-4"
              style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center justify-center shrink-0 rounded-xl" style={{ width: 40, height: 40, background: k.iconBg }}>
                <MI name={k.icon} size={18} style={{ color: k.iconColor }} />
              </div>
              <div>
                <div className="text-[22px] font-extrabold leading-none tracking-[-0.4px]" style={{ color: '#0F172A' }}>{k.value}</div>
                <div className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-2xl" style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderBottom: '1px solid #E8ECF1' }}>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Montant HT</TableHead>
                <TableHead className="text-right">Montant TTC</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={6}><div className="h-9 animate-pulse rounded-md" style={{ background: '#F1F5F9' }} /></TableCell></TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm" style={{ color: '#94A3B8' }}>Aucun devis. Créez-en un pour démarrer.</TableCell></TableRow>
              ) : (
                rows.map((d) => {
                  const sb = devisStatutBadge(d.statut);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs font-semibold" style={{ color: '#3A6B84' }}>{d.numero}</TableCell>
                      <TableCell className="text-sm" style={{ color: '#334155' }}>{d.client?.nom ?? '—'}</TableCell>
                      <TableCell className="text-right text-xs" style={{ color: '#64748B' }}>{formatMontant(d.montantHT)}</TableCell>
                      <TableCell className="text-right text-[13px] font-bold" style={{ color: '#0F172A' }}>{formatMontant(d.montantTTC)}</TableCell>
                      <TableCell><Badge variant={sb.variant}>{sb.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          {d.statut === 'EN_ATTENTE' && (
                            <button
                              disabled={busyId === d.id}
                              onClick={() => valider(d)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-[7px] text-[12px] font-semibold transition-colors"
                              style={{ background: '#ECFDF5', color: '#0D9668', border: '1px solid #A7F3D0', cursor: 'pointer' }}
                            >
                              <MI name="check_circle" size={13} style={{ color: '#0D9668' }} />
                              Valider
                            </button>
                          )}
                          {d.statut === 'VALIDE' && (
                            <button
                              disabled={busyId === d.id}
                              onClick={() => convertir(d)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-[7px] text-[12px] font-semibold transition-colors"
                              style={{ background: '#EBF6FB', color: '#3A6B84', border: '1px solid #BAE0F0', cursor: 'pointer' }}
                            >
                              <MI name="swap_horiz" size={13} style={{ color: '#3A6B84' }} />
                              Convertir
                            </button>
                          )}
                          <button
                            onClick={() => devisApi.pdf(d.id)}
                            className="flex items-center justify-center w-8 h-8 rounded-[7px] transition-colors"
                            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'pointer' }}
                            aria-label="PDF"
                          >
                            <MI name="picture_as_pdf" size={14} style={{ color: '#94A3B8' }} />
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

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="max-w-[480px]">
          <SheetTitle>Nouveau devis</SheetTitle>
          <SheetDescription>Sélectionnez le client et ajoutez les prestations</SheetDescription>
          <DevisForm onCancel={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); load(); }} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
