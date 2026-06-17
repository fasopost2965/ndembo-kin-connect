'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileText, Wallet } from 'lucide-react';
import { facturesApi } from '@/lib/api';
import { formatMontant } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge, factureStatutBadge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PaiementForm } from './PaiementForm';

interface Reglement { id: string; montant: number; moyenPaiement: string; dateReglement: string; reference?: string }
interface Ligne { designation: string; quantite: number; prixUnit: number; total: number }
interface Facture {
  id: string;
  numero: string;
  client?: { nom: string };
  devis?: { numero: string } | null;
  lignes: Ligne[];
  montantHT: number;
  montantTTC: number;
  acomptePercu: number;
  statutPaiement: 'IMPAYEE' | 'ACOMPTE_PERCU' | 'PARTIELLE' | 'PAYEE';
  reglements?: Reglement[];
}

export default function FacturesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[#94A3B8]">Chargement…</div>}>
      <FacturesView />
    </Suspense>
  );
}

function FacturesView() {
  const focusId = useSearchParams().get('focus');
  const [rows, setRows] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Facture | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await facturesApi.list();
      setRows(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  // Deep-link from the devis → convert flow.
  useEffect(() => { if (focusId) setSelectedId(focusId); }, [focusId]);

  const loadDetail = useCallback(async (id: string) => {
    const { data } = await facturesApi.get(id);
    setDetail(data);
  }, []);

  useEffect(() => {
    if (selectedId) { setDetail(null); setPayOpen(false); loadDetail(selectedId); }
  }, [selectedId, loadDetail]);

  const restant = detail ? Math.max(0, detail.montantTTC - detail.acomptePercu) : 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">Factures</h1>
        <p className="mt-1 text-sm text-[#64748B]">Encaissement &amp; suivi des paiements</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Numéro</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Montant TTC</TableHead>
              <TableHead className="text-right">Encaissé</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><div className="h-9 animate-pulse rounded-md bg-[#F1F5F9]" /></TableCell></TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-sm text-[#94A3B8]">Aucune facture. Convertissez un devis validé.</TableCell></TableRow>
            ) : (
              rows.map((f) => {
                const sb = factureStatutBadge(f.statutPaiement);
                return (
                  <TableRow key={f.id} className="cursor-pointer" data-state={selectedId === f.id ? 'selected' : undefined} onClick={() => setSelectedId(f.id)}>
                    <TableCell className="font-mono text-xs font-semibold text-[#3A6B84]">{f.numero}</TableCell>
                    <TableCell className="text-sm text-[#334155]">{f.client?.nom ?? '—'}</TableCell>
                    <TableCell className="text-right text-[13px] font-bold text-[#0F172A]">{formatMontant(f.montantTTC)}</TableCell>
                    <TableCell className="text-right text-xs text-[#0D9668]">{formatMontant(f.acomptePercu)}</TableCell>
                    <TableCell><Badge variant={sb.variant}>{sb.label}</Badge></TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="max-w-[460px]">
          {detail ? (
            <>
              <SheetHeader>
                <SheetTitle>{detail.numero}</SheetTitle>
                <SheetDescription>
                  {detail.client?.nom}{detail.devis ? ` · issue du ${detail.devis.numero}` : ''}
                </SheetDescription>
              </SheetHeader>

              {/* Status + totals */}
              <div className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-4 py-3">
                <Badge variant={factureStatutBadge(detail.statutPaiement).variant}>
                  {factureStatutBadge(detail.statutPaiement).label}
                </Badge>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-[#0F172A]">{formatMontant(detail.montantTTC)}</div>
                  <div className="text-[11px] text-[#94A3B8]">Restant dû : {formatMontant(restant)}</div>
                </div>
              </div>

              {/* Lines */}
              <div className="rounded-xl border border-[#E2E8F0]">
                {detail.lignes.map((l, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-[#F1F5F9] px-3 py-2 last:border-0">
                    <span className="text-xs text-[#334155]">{l.designation} <span className="text-[#94A3B8]">×{l.quantite}</span></span>
                    <span className="text-xs font-semibold text-[#0F172A]">{formatMontant(l.total)}</span>
                  </div>
                ))}
              </div>

              {/* Règlements history */}
              {detail.reglements && detail.reglements.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">Règlements</div>
                  <div className="flex flex-col gap-1.5">
                    {detail.reglements.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg bg-[#ECFDF5] px-3 py-1.5">
                        <span className="text-[11px] text-[#0D9668]">{r.moyenPaiement.replace('_', ' ')}{r.reference ? ` · ${r.reference}` : ''}</span>
                        <span className="text-xs font-bold text-[#0D9668]">{formatMontant(r.montant)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-auto flex flex-col gap-2 pt-2">
                {payOpen ? (
                  <PaiementForm
                    factureId={detail.id}
                    restant={restant}
                    onCancel={() => setPayOpen(false)}
                    onSaved={() => { setPayOpen(false); loadDetail(detail.id); load(); }}
                  />
                ) : (
                  <>
                    {detail.statutPaiement !== 'PAYEE' && (
                      <Button variant="gold" className="w-full" onClick={() => setPayOpen(true)}>
                        <Wallet size={15} /> Enregistrer un paiement
                      </Button>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => facturesApi.pdf(detail.id)}>
                      <FileText size={14} /> Aperçu PDF
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3 pt-8">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-[#F1F5F9]" />)}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
