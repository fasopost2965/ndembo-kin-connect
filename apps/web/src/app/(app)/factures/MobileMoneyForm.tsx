'use client';

import { useEffect, useRef, useState } from 'react';
import { Smartphone, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { reglementsApi, type MobileMoneyInput } from '@/lib/api';
import { formatMontant } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const OPERATEURS: { value: MobileMoneyInput['moyenPaiement']; label: string }[] = [
  { value: 'MTN_MONEY', label: 'MTN Money' },
  { value: 'AIRTEL_MONEY', label: 'Airtel Money' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
];

type Phase = 'form' | 'pending' | 'success' | 'failed';

export function MobileMoneyForm({
  factureId, restant, onConfirmed, onCancel,
}: {
  factureId: string; restant: number; onConfirmed: () => void; onCancel: () => void;
}) {
  const [montant, setMontant] = useState(restant.toString());
  const [operateur, setOperateur] = useState<MobileMoneyInput['moyenPaiement']>('MTN_MONEY');
  const [phone, setPhone] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function initiate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setPhase('pending');
    try {
      const { data } = await reglementsApi.initiate({
        factureId, montant: Number(montant), moyenPaiement: operateur, phone,
      });
      poll(data.orderNumber);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg ?? "Échec de l'initiation du paiement.");
      setPhase('form');
    }
  }

  function poll(orderNumber: string) {
    let elapsed = 0;
    pollRef.current = setInterval(async () => {
      elapsed += 3;
      try {
        const { data } = await reglementsApi.status(orderNumber);
        if (data.statut === 'CONFIRME') {
          stop(); setPhase('success'); setTimeout(onConfirmed, 1200);
        } else if (data.statut === 'ECHEC') {
          stop(); setPhase('failed');
        }
      } catch { /* keep polling */ }
      if (elapsed >= 120) { stop(); setPhase('failed'); setError('Délai dépassé — paiement non confirmé.'); }
    }, 3000);
  }
  function stop() { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }

  if (phase === 'pending') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 text-center">
        <Loader2 size={28} className="animate-spin text-[#3A6B84]" />
        <div className="text-sm font-semibold text-[#0F172A]">Demande envoyée au {phone}</div>
        <div className="text-xs text-[#64748B]">Le client doit valider sur son téléphone. Confirmation automatique…</div>
        <Button variant="ghost" size="sm" onClick={() => { stop(); onCancel(); }}>Fermer</Button>
      </div>
    );
  }
  if (phase === 'success') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-6 text-center">
        <CheckCircle2 size={28} className="text-[#0D9668]" />
        <div className="text-sm font-bold text-[#0D9668]">Paiement confirmé</div>
      </div>
    );
  }
  if (phase === 'failed') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-6 text-center">
        <XCircle size={28} className="text-[#DC2626]" />
        <div className="text-sm font-bold text-[#DC2626]">Paiement non confirmé</div>
        {error && <div className="text-xs text-[#DC2626]">{error}</div>}
        <Button variant="outline" size="sm" onClick={() => { setPhase('form'); setError(''); }}>Réessayer</Button>
      </div>
    );
  }

  return (
    <form onSubmit={initiate} className="flex flex-col gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#64748B]">
        <Smartphone size={14} /> Paiement Mobile Money
      </div>
      {error && <div className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#DC2626]">{error}</div>}

      <div className="flex flex-col gap-1.5">
        <Label>Opérateur</Label>
        <Select value={operateur} onValueChange={(v) => setOperateur(v as MobileMoneyInput['moyenPaiement'])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {OPERATEURS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Numéro de téléphone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="243 81 234 5678" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Montant (restant : {formatMontant(restant)})</Label>
        <Input type="number" min={1} max={restant} value={montant} onChange={(e) => setMontant(e.target.value)} required />
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="gold" className="flex-1">Demander le paiement</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
      </div>
    </form>
  );
}
