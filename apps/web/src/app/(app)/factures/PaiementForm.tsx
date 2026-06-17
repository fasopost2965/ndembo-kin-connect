'use client';

import { useState } from 'react';
import { reglementsApi, type ReglementInput } from '@/lib/api';
import { formatMontant } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MOYENS: { value: ReglementInput['moyenPaiement']; label: string }[] = [
  { value: 'MTN_MONEY', label: 'MTN Money' },
  { value: 'AIRTEL_MONEY', label: 'Airtel Money' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'BANK', label: 'Virement bancaire' },
  { value: 'CARTE', label: 'Carte' },
];

export function PaiementForm({
  factureId, restant, onSaved, onCancel,
}: {
  factureId: string; restant: number; onSaved: () => void; onCancel: () => void;
}) {
  const [montant, setMontant] = useState(restant.toString());
  const [moyenPaiement, setMoyen] = useState<ReglementInput['moyenPaiement']>('MTN_MONEY');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await reglementsApi.create({
        factureId,
        montant: Number(montant),
        moyenPaiement,
        reference: reference || undefined,
      });
      onSaved();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg ?? "Échec de l'enregistrement du paiement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-[#64748B]">Enregistrer un paiement</div>
      {error && <div className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#DC2626]">{error}</div>}

      <div className="flex flex-col gap-1.5">
        <Label>Montant (restant : {formatMontant(restant)})</Label>
        <Input type="number" min={1} max={restant} value={montant} onChange={(e) => setMontant(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Moyen de paiement</Label>
        <Select value={moyenPaiement} onValueChange={(v) => setMoyen(v as ReglementInput['moyenPaiement'])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {MOYENS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Référence</Label>
        <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° transaction Mobile Money…" />
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="gold" disabled={saving} className="flex-1">
          {saving ? 'Enregistrement…' : 'Enregistrer le paiement'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
      </div>
    </form>
  );
}
