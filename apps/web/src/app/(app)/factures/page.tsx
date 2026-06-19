'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FileText, Wallet, Smartphone } from 'lucide-react';
import { facturesApi } from '@/lib/api';
import { formatMontant } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge, factureStatutBadge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PaiementForm } from './PaiementForm';
import { MobileMoneyForm } from './MobileMoneyForm';

function MI({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', ...style }}>
      {name}
    </span>
  );
}

type PayMode = 'none' | 'manual' | 'momo';

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
  createdAt?: string;
  echeanceDate?: string;
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
  const [payMode, setPayMode] = useState<PayMode>('none');

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
    if (typeof data.lignes === 'string') data.lignes = JSON.parse(data.lignes);
    setDetail(data);
  }, []);

  useEffect(() => {
    if (selectedId) { setDetail(null); setPayMode('none'); loadDetail(selectedId); }
  }, [selectedId, loadDetail]);

  const restant = detail ? Math.max(0, detail.montantTTC - detail.acomptePercu) : 0;

  const totalTTC = rows.reduce((s, f) => s + f.montantTTC, 0);
  const totalEncaisse = rows.reduce((s, f) => s + f.acomptePercu, 0);
  const impayees = rows.filter(f => f.statutPaiement === 'IMPAYEE').length;
  const payees = rows.filter(f => f.statutPaiement === 'PAYEE').length;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* ── Topbar ── */}
      <div
        className="flex items-center gap-3 shrink-0"
        style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', height: 60, padding: '0 28px' }}
      >
        <div style={{ background: '#07101A', borderRadius: 8, padding: '4px 5px', lineHeight: 0, flexShrink: 0 }}>
          <img src="/logo.png" alt="NKC" style={{ height: 22, width: 'auto', display: 'block' }} />
        </div>
        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 2, background: '#F1F5F9', borderRadius: 10, padding: 3 }}>
          <Link href="/devis" style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#64748B', textDecoration: 'none' }}>
            Devis
          </Link>
          <div style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#07101A', color: '#FCD116' }}>
            Factures
          </div>
        </div>
        <div className="flex-1" />
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <MI name="search" size={16} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          <input type="text" placeholder="Rechercher…"
            style={{ padding: '8px 14px 8px 36px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC', width: 200 }} />
        </div>
        <button style={{ padding: '8px 18px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
          <MI name="add" size={15} style={{ color: '#FCD116' }} />
          Nouvelle facture
        </button>
      </div>

      <div className="flex-1 p-6">

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          {[
            { icon: 'receipt_long', label: 'Factures total', value: rows.length.toString(), iconColor: '#3A6B84', iconBg: '#EBF6FB' },
            { icon: 'warning_amber', label: 'Impayées', value: impayees.toString(), iconColor: '#EF4444', iconBg: '#FEF2F2' },
            { icon: 'check_circle', label: 'Payées', value: payees.toString(), iconColor: '#10B981', iconBg: '#ECFDF5' },
            { icon: 'account_balance_wallet', label: 'Encaissé TTC', value: formatMontant(totalEncaisse), iconColor: '#FCD116', iconBg: '#FEF9EE' },
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

      <div className="overflow-hidden rounded-2xl" style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent" style={{ borderBottom: '1px solid #E8ECF1' }}>
              <TableHead>Référence</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Émission</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7}><div className="h-9 animate-pulse rounded-md bg-[#F1F5F9]" /></TableCell></TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-12 text-center text-sm text-[#94A3B8]">Aucune facture. Convertissez un devis validé.</TableCell></TableRow>
            ) : (
              rows.map((f) => {
                const sb = factureStatutBadge(f.statutPaiement);
                const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
                return (
                  <TableRow key={f.id} className="cursor-pointer" data-state={selectedId === f.id ? 'selected' : undefined} onClick={() => setSelectedId(f.id)}>
                    <TableCell className="font-mono text-xs font-semibold" style={{ color: '#3A6B84' }}>{f.numero}</TableCell>
                    <TableCell className="text-sm" style={{ color: '#334155' }}>{f.client?.nom ?? '—'}</TableCell>
                    <TableCell className="text-[12px]" style={{ color: '#64748B' }}>{fmt(f.createdAt)}</TableCell>
                    <TableCell className="text-[12px]" style={{ color: '#64748B' }}>{fmt(f.echeanceDate)}</TableCell>
                    <TableCell className="text-right text-[13px] font-bold" style={{ color: '#0F172A' }}>{formatMontant(f.montantTTC)}</TableCell>
                    <TableCell><Badge variant={sb.variant}>{sb.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {f.statutPaiement !== 'PAYEE' && (
                          <button
                            onClick={e => { e.stopPropagation(); setSelectedId(f.id); }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-[7px] text-[11px] font-semibold"
                            style={{ background: '#FEF9EE', color: '#B45309', border: '1px solid #FDE68A', cursor: 'pointer' }}
                          >
                            <MI name="smartphone" size={12} style={{ color: '#B45309' }} />
                            Payer
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); facturesApi.pdf(f.id); }}
                          className="flex items-center justify-center w-7 h-7 rounded-[7px]"
                          style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'pointer' }}
                        >
                          <MI name="picture_as_pdf" size={13} style={{ color: '#94A3B8' }} />
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
                {payMode === 'manual' ? (
                  <PaiementForm
                    factureId={detail.id}
                    restant={restant}
                    onCancel={() => setPayMode('none')}
                    onSaved={() => { setPayMode('none'); loadDetail(detail.id); load(); }}
                  />
                ) : payMode === 'momo' ? (
                  <MobileMoneyForm
                    factureId={detail.id}
                    restant={restant}
                    onCancel={() => setPayMode('none')}
                    onConfirmed={() => { setPayMode('none'); loadDetail(detail.id); load(); }}
                  />
                ) : (
                  <>
                    {detail.statutPaiement !== 'PAYEE' && (
                      <>
                        <Button variant="gold" className="w-full" onClick={() => setPayMode('momo')}>
                          <Smartphone size={15} /> Payer par Mobile Money
                        </Button>
                        <Button variant="secondary" className="w-full" onClick={() => setPayMode('manual')}>
                          <Wallet size={15} /> Enregistrer un paiement manuel
                        </Button>
                      </>
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
    </div>
  );
}
