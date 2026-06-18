'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { athletesApi } from '@/lib/api';

const DRAFT_KEY = 'nkc:draft:athlete';

function MI({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
      {name}
    </span>
  );
}

function Input({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      <input
        {...props}
        style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#0F172A', outline: 'none', background: '#FAFBFC', ...props.style }}
        onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFBFC'; e.currentTarget.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

function Select({ label, required, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; required?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          {...props}
          style={{ width: '100%', padding: '11px 36px 11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#0F172A', outline: 'none', background: '#FAFBFC', cursor: 'pointer', appearance: 'none' }}
          onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFBFC'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          {children}
        </select>
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex' }}>
          <MI name="expand_more" size={16} color="#94A3B8" />
        </span>
      </div>
    </div>
  );
}

type Form = {
  prenom: string; nom: string; ddn: string; nationalite: string;
  telephone: string; email: string; sport: string; poste: string;
  niveau: string; clubActuel: string; valeurMarchande: string; statut: string; notes: string;
};

const EMPTY: Form = {
  prenom: '', nom: '', ddn: '', nationalite: 'RDC',
  telephone: '', email: '', sport: '', poste: '',
  niveau: '', clubActuel: '', valeurMarchande: '', statut: 'Actif', notes: '',
};

export default function AthleteNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [hasDraft, setHasDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    try {
      if (localStorage.getItem(DRAFT_KEY)) setHasDraft(true);
    } catch {}
  }, []);

  function update(key: keyof Form, value: string) {
    const next = { ...form, [key]: value };
    setForm(next);
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); } catch {}
    }, 800);
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) { setForm(JSON.parse(raw)); setHasDraft(false); }
    } catch {}
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setHasDraft(false);
  }

  async function handleSave() {
    if (!form.prenom || !form.nom || !form.sport || !form.niveau) return;
    setSaving(true);
    try {
      await athletesApi.create({
        prenom: form.prenom,
        nom: form.nom,
        sport: form.sport,
        poste: form.poste,
        niveau: form.niveau,
        clubActuel: form.clubActuel || undefined,
        valeurMarchande: form.valeurMarchande ? Number(form.valeurMarchande) : undefined,
        telephone: form.telephone || undefined,
        email: form.email || undefined,
        nationalite: form.nationalite || undefined,
        dateNaissance: form.ddn || undefined,
      });
      clearDraft();
      setSaved(true);
      setTimeout(() => router.push('/athletes'), 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const sectionIcon = (icon: string, color: string, bg: string, border: string) => (
    <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <MI name={icon} size={16} color={color} />
    </div>
  );

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>

      {/* TOPBAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', padding: '0 32px', display: 'flex', alignItems: 'center', height: 60, gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 13, color: '#94A3B8', cursor: 'pointer' }} onClick={() => router.push('/athletes')}>
            Athlètes
          </span>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Nouvel athlète</span>
        </div>
        <button
          onClick={() => router.push('/athletes')}
          style={{ padding: '8px 18px', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#E2E8F0')}
          onMouseLeave={e => (e.currentTarget.style.background = '#F1F5F9')}
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.prenom || !form.nom || !form.sport || !form.niveau}
          style={{ padding: '8px 20px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, opacity: saving ? 0.6 : 1 }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#132730'; }}
          onMouseLeave={e => (e.currentTarget.style.background = '#07101A')}
        >
          <MI name="save" size={16} color="#FCD116" />
          Enregistrer
        </button>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, padding: 32, maxWidth: 860, margin: '0 auto', width: '100%' }}>

        {/* Draft banner */}
        {hasDraft && (
          <div style={{ background: '#FEF9EE', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MI name="restore" size={16} color="#B45309" />
            <div style={{ fontSize: 13, color: '#92400E', flex: 1 }}>Brouillon sauvegardé automatiquement — <strong>reprendre ?</strong></div>
            <button onClick={restoreDraft} style={{ padding: '4px 12px', background: '#B45309', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Reprendre</button>
            <button onClick={clearDraft} style={{ padding: '4px 12px', background: 'transparent', color: '#94A3B8', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Ignorer</button>
          </div>
        )}

        {/* Success banner */}
        {saved && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MI name="check_circle" size={18} color="#059669" />
            <div style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>Athlète enregistré avec succès !</div>
          </div>
        )}

        {/* Section 1 — Identité */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px 28px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #F1F5F9' }}>
            {sectionIcon('person', '#B45309', '#FEF9EE', '#FDE68A')}
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Identité</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Prénom" required placeholder="ex: Lukaku" value={form.prenom} onChange={e => update('prenom', e.target.value)} />
            <Input label="Nom de famille" required placeholder="ex: Mbuyi" value={form.nom} onChange={e => update('nom', e.target.value)} />
            <Input label="Date de naissance" type="date" value={form.ddn} onChange={e => update('ddn', e.target.value)} />
            <Select label="Nationalité" value={form.nationalite} onChange={e => update('nationalite', e.target.value)}>
              <option value="RDC">🇨🇩 RDC (Congo)</option>
              <option value="Congo-B">🇨🇬 Congo-Brazzaville</option>
              <option value="Angola">🇦🇴 Angola</option>
              <option value="Cameroun">🇨🇲 Cameroun</option>
              <option value="Autre">Autre</option>
            </Select>
            <Input label="Téléphone" type="tel" placeholder="+243 8X XXX XXXX" value={form.telephone} onChange={e => update('telephone', e.target.value)} />
            <Input label="E-mail" type="email" placeholder="athlete@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
        </div>

        {/* Section 2 — Profil sportif */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px 28px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #F1F5F9' }}>
            {sectionIcon('sports_soccer', '#2563EB', '#EFF6FF', '#BFDBFE')}
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Profil sportif</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Select label="Sport" required value={form.sport} onChange={e => update('sport', e.target.value)}>
              <option value="">-- Choisir --</option>
              <option value="Football">⚽ Football</option>
              <option value="Basketball">🏀 Basketball</option>
              <option value="Athlétisme">🏃 Athlétisme</option>
              <option value="Boxe">🥊 Boxe</option>
              <option value="Natation">🏊 Natation</option>
            </Select>
            <Input label="Poste / Spécialité" placeholder="ex: Attaquant, Pivot…" value={form.poste} onChange={e => update('poste', e.target.value)} />
            <Select label="Niveau" required value={form.niveau} onChange={e => update('niveau', e.target.value)}>
              <option value="">-- Niveau --</option>
              <option value="AMATEUR">Amateur</option>
              <option value="SEMI_PRO">Semi-professionnel</option>
              <option value="PRO">Professionnel</option>
            </Select>
            <Input label="Club actuel" placeholder="ex: TP Mazembe" value={form.clubActuel} onChange={e => update('clubActuel', e.target.value)} />
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Valeur marchande (USD)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>$</span>
                <input
                  type="number" placeholder="0" value={form.valeurMarchande}
                  onChange={e => update('valeurMarchande', e.target.value)}
                  style={{ width: '100%', padding: '11px 14px 11px 28px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#FAFBFC' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFBFC'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
            <Select label="Statut" value={form.statut} onChange={e => update('statut', e.target.value)}>
              <option value="Actif">Actif</option>
              <option value="En transfert">En transfert</option>
              <option value="Blessé">Blessé</option>
              <option value="Inactif">Inactif</option>
            </Select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Notes / Observations</label>
            <textarea
              placeholder="Talents remarquables, historique, observations du coach…"
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 14, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#FAFBFC', height: 88, resize: 'vertical', lineHeight: 1.5 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFBFC'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* Bottom actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '4px 0 32px' }}>
          <button
            onClick={() => router.push('/athletes')}
            style={{ padding: '11px 22px', background: '#F1F5F9', color: '#475569', fontSize: 14, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#E2E8F0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F1F5F9')}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.prenom || !form.nom || !form.sport || !form.niveau}
            style={{ padding: '11px 28px', background: '#07101A', color: '#FCD116', fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.6 : 1 }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#132730'; }}
            onMouseLeave={e => (e.currentTarget.style.background = '#07101A')}
          >
            <MI name="check" size={16} color="#FCD116" />
            Enregistrer l'athlète
          </button>
        </div>
      </div>
    </div>
  );
}
