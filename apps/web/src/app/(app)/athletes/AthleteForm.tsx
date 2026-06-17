'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { athletesApi } from '@/lib/api';
import { useAutosave, loadDraft, clearDraft } from '@/lib/useAutosave';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export interface Athlete {
  id: string;
  nom: string;
  prenom: string;
  sport: string;
  poste: string;
  niveau: 'AMATEUR' | 'SEMI_PRO' | 'PRO';
  clubActuel?: string | null;
  valeurMarchande?: number | null;
  nationalite: string;
  telephone?: string | null;
  email?: string | null;
  statut: string;
  priorityScouting?: string | null;
}

const SPORTS = ['football', 'basketball', 'athletisme'];
const NIVEAUX: Athlete['niveau'][] = ['AMATEUR', 'SEMI_PRO', 'PRO'];

export function AthleteForm({
  athlete, onSaved, onCancel,
}: {
  athlete?: Athlete | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!athlete;
  const DRAFT_KEY = 'nkc:draft:athlete';
  const [form, setForm] = useState(() => {
    const base = {
      nom: athlete?.nom ?? '',
      prenom: athlete?.prenom ?? '',
      sport: athlete?.sport ?? 'football',
      poste: athlete?.poste ?? '',
      niveau: athlete?.niveau ?? ('AMATEUR' as Athlete['niveau']),
      clubActuel: athlete?.clubActuel ?? '',
      valeurMarchande: athlete?.valeurMarchande?.toString() ?? '',
      nationalite: athlete?.nationalite ?? 'RDC',
      telephone: athlete?.telephone ?? '',
      email: athlete?.email ?? '',
      priorityScouting: athlete?.priorityScouting ?? 'NORMALE',
    };
    // Restore a draft only in create mode (protects against power cuts).
    if (!athlete) return loadDraft<typeof base>(DRAFT_KEY) ?? base;
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-save the draft every 800ms (create mode only).
  useAutosave(DRAFT_KEY, form, !isEdit);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      nom: form.nom,
      prenom: form.prenom,
      sport: form.sport,
      poste: form.poste,
      niveau: form.niveau,
      clubActuel: form.clubActuel || undefined,
      valeurMarchande: form.valeurMarchande ? Number(form.valeurMarchande) : undefined,
      nationalite: form.nationalite,
      telephone: form.telephone || undefined,
      email: form.email || undefined,
      priorityScouting: form.priorityScouting || undefined,
    };
    try {
      if (isEdit) await athletesApi.update(athlete!.id, payload);
      else await athletesApi.create(payload);
      clearDraft(DRAFT_KEY);
      onSaved();
    } catch {
      setError("Échec de l'enregistrement. Vérifiez les champs requis.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#DC2626]">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom" required>
          <Input value={form.prenom} onChange={(e) => set('prenom', e.target.value)} required placeholder="Cédric" />
        </Field>
        <Field label="Nom" required>
          <Input value={form.nom} onChange={(e) => set('nom', e.target.value)} required placeholder="Diabase" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Sport">
          <Select value={form.sport} onValueChange={(v) => set('sport', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SPORTS.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Poste" required>
          <Input value={form.poste} onChange={(e) => set('poste', e.target.value)} required placeholder="Attaquant" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Niveau">
          <Select value={form.niveau} onValueChange={(v) => set('niveau', v as Athlete['niveau'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AMATEUR">Amateur</SelectItem>
              <SelectItem value="SEMI_PRO">Semi-pro</SelectItem>
              <SelectItem value="PRO">Pro</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Priorité scouting">
          <Select value={form.priorityScouting} onValueChange={(v) => set('priorityScouting', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="HAUTE">Haute</SelectItem>
              <SelectItem value="NORMALE">Normale</SelectItem>
              <SelectItem value="BASSE">Basse</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Club actuel">
          <Input value={form.clubActuel} onChange={(e) => set('clubActuel', e.target.value)} placeholder="AS Vita Club" />
        </Field>
        <Field label="Valeur marchande (€)">
          <Input type="number" value={form.valeurMarchande} onChange={(e) => set('valeurMarchande', e.target.value)} placeholder="850000" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nationalité">
          <Input value={form.nationalite} onChange={(e) => set('nationalite', e.target.value)} />
        </Field>
        <Field label="Téléphone">
          <Input value={form.telephone} onChange={(e) => set('telephone', e.target.value)} placeholder="+243 …" />
        </Field>
      </div>

      <Field label="Email">
        <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="c.diabase@gmail.com" />
      </Field>

      {!isEdit && (
        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <Check size={13} className="text-[#0D9668]" /> Brouillon sauvegardé automatiquement
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <Button type="submit" variant="gold" disabled={saving} className="flex-1">
          {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : "Créer l'athlète"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-[#DC2626]">*</span>}
      </Label>
      {children}
    </div>
  );
}
