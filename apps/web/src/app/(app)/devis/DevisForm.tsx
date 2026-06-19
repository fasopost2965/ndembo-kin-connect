'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { clientsApi, prestationsApi, devisApi } from '@/lib/api';
import { formatMontant } from '@/lib/utils';
import { useAutosave, loadDraft, clearDraft } from '@/lib/useAutosave';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface ClientLite { id: string; nom: string }
interface Prestation { id: string; nom: string; prixBase: number }
interface LigneRow { prestationId: string; quantite: number; prixUnit: number }

interface DevisDraft { clientId: string; tva: number; notes: string; lignes: LigneRow[] }
const DRAFT_KEY = 'nkc:draft:devis';

export function DevisForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const draft = typeof window !== 'undefined' ? loadDraft<DevisDraft>(DRAFT_KEY) : null;
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [clientId, setClientId] = useState(draft?.clientId ?? '');
  const [tva, setTva] = useState(draft?.tva ?? 16);
  const [notes, setNotes] = useState(draft?.notes ?? '');
  const [lignes, setLignes] = useState<LigneRow[]>(draft?.lignes ?? [{ prestationId: '', quantite: 1, prixUnit: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [savingClient, setSavingClient] = useState(false);

  // Persist the draft (power-cut resilience).
  useAutosave<DevisDraft>(DRAFT_KEY, { clientId, tva, notes, lignes });

  useEffect(() => {
    clientsApi.list({ limit: 100 }).then((r) => setClients(r.data.data || r.data || [])).catch(() => {});
    prestationsApi.list().then((r) => setPrestations(r.data)).catch(() => {});
  }, []);

  function updateLigne(i: number, patch: Partial<LigneRow>) {
    setLignes((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function onPrestationChange(i: number, prestationId: string) {
    const p = prestations.find((x) => x.id === prestationId);
    updateLigne(i, { prestationId, prixUnit: p ? p.prixBase : 0 });
  }
  function addLigne() {
    setLignes((rows) => [...rows, { prestationId: '', quantite: 1, prixUnit: 0 }]);
  }
  function removeLigne(i: number) {
    setLignes((rows) => (rows.length === 1 ? rows : rows.filter((_, idx) => idx !== i)));
  }

  const { montantHT, montantTTC } = useMemo(() => {
    const ht = lignes.reduce((s, l) => s + l.quantite * l.prixUnit, 0);
    return { montantHT: ht, montantTTC: ht * (1 + tva / 100) };
  }, [lignes, tva]);

  const valid = clientId && lignes.every((l) => l.prestationId && l.quantite > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError('');
    try {
      await devisApi.create({
        clientId,
        tva,
        notes: notes || undefined,
        lignes: lignes.map((l) => ({ prestationId: l.prestationId, quantite: l.quantite, prixUnit: l.prixUnit })),
      });
      clearDraft(DRAFT_KEY);
      onSaved();
    } catch {
      setError("Échec de la création du devis.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {error && <div className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#DC2626]">{error}</div>}

      <div className="flex flex-col gap-1.5">
        <Label>Client <span className="text-[#DC2626]">*</span></Label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger><SelectValue placeholder="Sélectionner un client…" /></SelectTrigger>
          <SelectContent>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
          </SelectContent>
        </Select>
        {!showNewClient ? (
          <button type="button" onClick={() => setShowNewClient(true)} className="mt-1 text-xs font-semibold text-[#3A6B84] flex items-center gap-1" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Plus size={13} /> Nouveau client
          </button>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <Input placeholder="Nom / Société" value={newClientName} onChange={e => setNewClientName(e.target.value)} className="h-8 text-xs flex-1" />
            <Button type="button" size="sm" variant="gold" disabled={savingClient || !newClientName.trim()} onClick={async () => {
              setSavingClient(true);
              try {
                const { data: c } = await clientsApi.create({ nom: newClientName, type: 'ENTREPRISE' });
                const r = await clientsApi.list({ limit: 100 });
                setClients(r.data.data || r.data || []);
                setClientId(c.id);
                setShowNewClient(false);
                setNewClientName('');
              } catch { setError('Erreur création client.'); }
              finally { setSavingClient(false); }
            }} className="h-8 text-xs">{savingClient ? '…' : 'Créer'}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowNewClient(false)} className="h-8 text-xs">✕</Button>
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="flex flex-col gap-2">
        <Label>Lignes de prestations</Label>
        <div className="flex flex-col gap-2">
          {lignes.map((l, i) => (
            <div key={i} className="flex items-end gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
              <div className="flex-1">
                <span className="mb-1 block text-[10px] font-semibold text-[#94A3B8]">Prestation</span>
                <Select value={l.prestationId} onValueChange={(v) => onPrestationChange(i, v)}>
                  <SelectTrigger className="h-9 bg-white text-xs"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                  <SelectContent>
                    {prestations.map((p) => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-14">
                <span className="mb-1 block text-[10px] font-semibold text-[#94A3B8]">Qté</span>
                <Input
                  type="number" min={1} value={l.quantite}
                  onChange={(e) => updateLigne(i, { quantite: Number(e.target.value) })}
                  className="h-9 px-2 text-center text-xs"
                />
              </div>
              <div className="w-24">
                <span className="mb-1 block text-[10px] font-semibold text-[#94A3B8]">Prix unit.</span>
                <Input
                  type="number" min={0} value={l.prixUnit}
                  onChange={(e) => updateLigne(i, { prixUnit: Number(e.target.value) })}
                  className="h-9 px-2 text-xs"
                />
              </div>
              <button
                type="button" onClick={() => removeLigne(i)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                aria-label="Supprimer la ligne"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addLigne} className="self-start">
          <Plus size={14} /> Ajouter une ligne
        </Button>
      </div>

      <div className="flex items-end gap-3">
        <div className="w-24">
          <Label>TVA (%)</Label>
          <Input type="number" min={0} value={tva} onChange={(e) => setTva(Number(e.target.value))} className="mt-1.5 h-9 text-xs" />
        </div>
        <div className="flex-1" />
        <div className="text-right text-xs text-[#64748B]">
          <div>Total HT : <span className="font-semibold text-[#0F172A]">{formatMontant(montantHT)}</span></div>
          <div className="mt-1 text-sm">Total TTC : <span className="font-extrabold text-[#C9960C]">{formatMontant(montantTTC)}</span></div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Notes</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions, mentions…" />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
        <Check size={13} className="text-[#0D9668]" /> Brouillon sauvegardé automatiquement
      </div>

      <div className="mt-2 flex gap-2">
        <Button type="submit" variant="gold" disabled={saving || !valid} className="flex-1">
          {saving ? 'Création…' : 'Créer le devis'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
      </div>
    </form>
  );
}
