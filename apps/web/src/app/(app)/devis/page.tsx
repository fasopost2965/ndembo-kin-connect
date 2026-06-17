'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, CheckCircle2, ArrowRightLeft, FileText } from 'lucide-react';
import { devisApi } from '@/lib/api';
import { formatMontant } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge, devisStatutBadge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { DevisForm } from './DevisForm';

interface Devis {
  id: string;
  numero: string;
  client?: { nom: string };
  montantHT: number;
  montantTTC: number;
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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">Devis</h1>
          <p className="mt-1 text-sm text-[#64748B]">Propositions commerciales · conversion en facture</p>
        </div>
        <Button variant="gold" onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Nouveau devis
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
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
                <TableRow key={i}><TableCell colSpan={6}><div className="h-9 animate-pulse rounded-md bg-[#F1F5F9]" /></TableCell></TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-[#94A3B8]">Aucun devis. Créez-en un pour démarrer.</TableCell></TableRow>
            ) : (
              rows.map((d) => {
                const sb = devisStatutBadge(d.statut);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs font-semibold text-[#3A6B84]">{d.numero}</TableCell>
                    <TableCell className="text-sm text-[#334155]">{d.client?.nom ?? '—'}</TableCell>
                    <TableCell className="text-right text-xs text-[#64748B]">{formatMontant(d.montantHT)}</TableCell>
                    <TableCell className="text-right text-[13px] font-bold text-[#0F172A]">{formatMontant(d.montantTTC)}</TableCell>
                    <TableCell><Badge variant={sb.variant}>{sb.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        {d.statut === 'EN_ATTENTE' && (
                          <Button size="sm" variant="secondary" disabled={busyId === d.id} onClick={() => valider(d)}>
                            <CheckCircle2 size={14} /> Valider
                          </Button>
                        )}
                        {d.statut === 'VALIDE' && (
                          <Button size="sm" variant="accent" disabled={busyId === d.id} onClick={() => convertir(d)}>
                            <ArrowRightLeft size={14} /> Convertir
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => devisApi.pdf(d.id)} aria-label="PDF">
                          <FileText size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="max-w-[480px]">
          <SheetHeader>
            <SheetTitle>Nouveau devis</SheetTitle>
            <SheetDescription>Sélectionnez le client et ajoutez les prestations</SheetDescription>
          </SheetHeader>
          <DevisForm onCancel={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); load(); }} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
