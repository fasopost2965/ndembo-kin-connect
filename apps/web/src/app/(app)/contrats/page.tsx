'use client';

import { useCallback, useEffect, useState } from 'react';
import { contratsApi, clientsApi, athletesApi, openPdf } from '@/lib/api';
import { formatMontant } from '@/lib/utils';

function MI({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', ...style }}>
      {name}
    </span>
  );
}

interface Athlete { id: string; nom: string; prenom: string }
interface Client  { id: string; nom: string }
interface Contrat {
  id: string;
  numero: string;
  typeContrat: string;
  statut: 'EN_PREPARATION' | 'SIGNE' | 'EN_COURS' | 'EXPIRE';
  montant?: number;
  dateDebut?: string;
  dateFin?: string;
  signeParClient: boolean;
  signeParPrestataire: boolean;
  dateSignature?: string;
  createdAt: string;
  updatedAt: string;
  athlete?: Athlete;
  client: Client;
}

const STATUT_META: Record<string, { label: string; bg: string; color: string }> = {
  EN_PREPARATION: { label: 'En préparation', bg: '#FEF9EE', color: '#C9960C' },
  SIGNE:          { label: 'Signé',          bg: '#F0FDF4', color: '#059669' },
  EN_COURS:       { label: 'En cours',       bg: '#EFF6FF', color: '#2563EB' },
  EXPIRE:         { label: 'Expiré',         bg: '#F1F5F9', color: '#94A3B8' },
};

const LOGO_COLORS = ['#07101A', '#3A6B84', '#1D4ED8', '#059669', '#B45309', '#6D28D9'];
function avatarColor(id: string) {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return LOGO_COLORS[h % LOGO_COLORS.length];
}
function initials(name: string) {
  const w = name.split(' ').filter(Boolean);
  return ((w[0] || '')[0] || '') + ((w[1] || '')[0] || '');
}

function fmtMonth(d: string | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}
function periode(c: Contrat): string {
  if (c.dateDebut || c.dateFin) return `${fmtMonth(c.dateDebut)} → ${fmtMonth(c.dateFin)}`;
  return new Date(c.createdAt).getFullYear().toString();
}

const COL = '1.2fr 2fr 1.4fr 1.4fr 1fr 1.2fr';

const TYPE_LABELS: Record<string, string> = {
  MANAGEMENT:     'Contrat de management sportif',
  REPRESENTATION: "Contrat de représentation d'athlète",
  PRESTATION:     'Contrat de prestation de services',
  PARTENARIAT:    'Contrat de partenariat commercial',
};

const TYPE_META: Record<string, { icon: string; desc: string }> = {
  MANAGEMENT:     { icon: 'manage_accounts', desc: 'Gestion de carrière sportive complète' },
  REPRESENTATION: { icon: 'person_pin',      desc: "Représentation officielle de l'athlète" },
  PRESTATION:     { icon: 'handshake',       desc: 'Services ponctuels ou récurrents' },
  PARTENARIAT:    { icon: 'groups',          desc: 'Accord de collaboration commerciale' },
};

const SERVICES = [
  'Gestion de carrière sportive',
  'Scouting et placement en club',
  'Négociation de transferts',
  'Communication & image publique',
  'Organisation de stages/camps',
  'Accompagnement médical',
  'Gestion des sponsors',
  'Formation et développement',
];

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 9,
  fontSize: 14, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC',
  boxSizing: 'border-box',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6,
};

// ── Multi-step modal ──────────────────────────────────────────────────────────
interface GenForm {
  clientId: string;
  athleteId: string;
  typeContrat: string;
  montant: string;
  dateDebut: string;
  dateFin: string;
  nonConcurrence: boolean;
  confidentialite: boolean;
  droitImage: boolean;
  prestations: string[];
}

const INIT_FORM: GenForm = {
  clientId: '', athleteId: '', typeContrat: 'MANAGEMENT',
  montant: '', dateDebut: '', dateFin: '',
  nonConcurrence: false, confidentialite: false, droitImage: false,
  prestations: [],
};

const STEPS = ['Parties', 'Conditions', 'Prestations', 'Aperçu'];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {/* connector left */}
            {i > 0 && (
              <div style={{
                position: 'absolute', left: 0, top: 14, width: '50%', height: 2,
                background: done || active ? '#07101A' : '#E2E8F0',
              }} />
            )}
            {/* connector right */}
            {i < total - 1 && (
              <div style={{
                position: 'absolute', right: 0, top: 14, width: '50%', height: 2,
                background: done ? '#07101A' : '#E2E8F0',
              }} />
            )}
            {/* dot */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%', zIndex: 1,
              background: active ? '#07101A' : done ? '#07101A' : '#E2E8F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: active ? '2px solid #FCD116' : 'none',
            }}>
              {done
                ? <MI name="check" size={14} style={{ color: '#FCD116' }} />
                : <span style={{ fontSize: 11, fontWeight: 800, color: active ? '#FCD116' : '#94A3B8' }}>{i + 1}</span>
              }
            </div>
            <div style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? '#07101A' : '#94A3B8', marginTop: 5, textAlign: 'center', whiteSpace: 'nowrap' }}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', border: `1.5px solid ${checked ? '#07101A' : '#E2E8F0'}`, borderRadius: 10, background: checked ? '#F8FAFC' : '#fff', userSelect: 'none' }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: 5, border: `2px solid ${checked ? '#07101A' : '#CBD5E1'}`,
        background: checked ? '#07101A' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {checked && <MI name="check" size={12} style={{ color: '#FCD116' }} />}
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 500, color: '#334155' }}>{label}</span>
    </div>
  );
}

function GenerateModal({ onClose, onDone }: { onClose: () => void; onDone: (numero?: string) => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<GenForm>(INIT_FORM);
  const [clients, setClients] = useState<Client[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ nom: '', email: '', telephone: '' });
  const [savingClient, setSavingClient] = useState(false);

  const reloadClients = () => clientsApi.list({ limit: 200 }).then(r => setClients(r.data.data || r.data || [])).catch(() => {});

  useEffect(() => {
    reloadClients();
    athletesApi.list({ limit: 200 }).then(r => setAthletes(r.data.data || r.data || [])).catch(() => {});
  }, []);

  const set = <K extends keyof GenForm>(key: K) => (val: GenForm[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  const togglePrestation = (s: string) =>
    setForm(f => ({
      ...f,
      prestations: f.prestations.includes(s) ? f.prestations.filter(x => x !== s) : [...f.prestations, s],
    }));

  const validate = () => {
    if (step === 0) {
      if (!form.clientId) { setError('Veuillez sélectionner un client.'); return false; }
    }
    if (step === 1) {
      if (!form.dateDebut || !form.dateFin) { setError('Veuillez renseigner les dates de début et de fin.'); return false; }
    }
    setError('');
    return true;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const prev = () => { setError(''); setStep(s => s - 1); };

  const handleGenerate = async () => {
    setSubmitting(true);
    setError('');
    try {
      const clauses: string[] = [];
      if (form.nonConcurrence) clauses.push('non-concurrence');
      if (form.confidentialite) clauses.push('confidentialite');
      if (form.droitImage) clauses.push('image');

      const res = await contratsApi.generate({
        clientId:    form.clientId,
        athleteId:   form.athleteId || undefined,
        typeContrat: form.typeContrat,
        montant:     form.montant ? Number(form.montant) : undefined,
        dateDebut:   form.dateDebut || undefined,
        dateFin:     form.dateFin || undefined,
        prestations: form.prestations,
        clauses,
      });
      const numero = res?.data?.numero || res?.data?.data?.numero;
      onDone(numero);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de la génération du contrat.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClient = clients.find(c => c.id === form.clientId);
  const selectedAthlete = athletes.find(a => a.id === form.athleteId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(7,16,26,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 22, boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
        width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
        padding: '32px 32px 28px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 26 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#0F172A' }}>Générer un contrat</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Ndembo Kin Connect — Contrat juridiquement conforme (droit congolais)</div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <MI name="close" size={16} style={{ color: '#64748B' }} />
          </button>
        </div>

        <StepIndicator current={step} total={STEPS.length} />

        {/* ── Step 0: Parties ── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={LABEL_STYLE}>Client <span style={{ color: '#EF4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <select value={form.clientId} onChange={e => set('clientId')(e.target.value)} style={{ ...INPUT_STYLE, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}>
                  <option value="">Sélectionner un client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <MI name="expand_more" size={16} style={{ color: '#94A3B8' }} />
                </span>
              </div>
              {!showNewClient ? (
                <button type="button" onClick={() => setShowNewClient(true)} style={{ marginTop: 6, fontSize: 12, color: '#3A6B84', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MI name="add" size={14} style={{ color: '#3A6B84' }} /> Nouveau client
                </button>
              ) : (
                <div style={{ marginTop: 8, padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Créer un client</div>
                  <input placeholder="Nom / Société *" value={newClientForm.nom} onChange={e => setNewClientForm(f => ({ ...f, nom: e.target.value }))} style={{ ...INPUT_STYLE, padding: '7px 10px', fontSize: 12 }} />
                  <input placeholder="Email" value={newClientForm.email} onChange={e => setNewClientForm(f => ({ ...f, email: e.target.value }))} style={{ ...INPUT_STYLE, padding: '7px 10px', fontSize: 12 }} />
                  <input placeholder="Téléphone" value={newClientForm.telephone} onChange={e => setNewClientForm(f => ({ ...f, telephone: e.target.value }))} style={{ ...INPUT_STYLE, padding: '7px 10px', fontSize: 12 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" disabled={savingClient || !newClientForm.nom.trim()} onClick={async () => {
                      setSavingClient(true);
                      try {
                        const { data: c } = await clientsApi.create({ nom: newClientForm.nom, email: newClientForm.email || undefined, telephone: newClientForm.telephone || undefined, type: 'ENTREPRISE' });
                        await reloadClients();
                        set('clientId')(c.id);
                        setShowNewClient(false);
                        setNewClientForm({ nom: '', email: '', telephone: '' });
                      } catch { setError('Erreur lors de la création du client.'); }
                      finally { setSavingClient(false); }
                    }} style={{ padding: '6px 14px', background: '#07101A', color: '#FCD116', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 7, cursor: 'pointer' }}>
                      {savingClient ? 'Création…' : 'Créer'}
                    </button>
                    <button type="button" onClick={() => setShowNewClient(false)} style={{ padding: '6px 14px', background: '#F1F5F9', color: '#64748B', fontSize: 11, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 7, cursor: 'pointer' }}>Annuler</button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label style={LABEL_STYLE}>Athlète (optionnel)</label>
              <div style={{ position: 'relative' }}>
                <select value={form.athleteId} onChange={e => set('athleteId')(e.target.value)} style={{ ...INPUT_STYLE, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}>
                  <option value="">Aucun athlète</option>
                  {athletes.map(a => <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <MI name="expand_more" size={16} style={{ color: '#94A3B8' }} />
                </span>
              </div>
            </div>
            <div>
              <label style={LABEL_STYLE}>Type de contrat <span style={{ color: '#EF4444' }}>*</span></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {Object.entries(TYPE_LABELS).map(([val, label]) => {
                  const meta = TYPE_META[val];
                  const active = form.typeContrat === val;
                  return (
                    <label key={val} onClick={() => set('typeContrat')(val)}
                      style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', padding: '14px 16px', border: `2px solid ${active ? '#07101A' : '#E2E8F0'}`, borderRadius: 12, background: active ? '#F8FAFC' : '#fff', transition: 'border-color 0.15s, background 0.15s', position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: active ? '#07101A' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
                          <MI name={meta.icon} size={18} style={{ color: active ? '#FCD116' : '#94A3B8' }} />
                        </div>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${active ? '#07101A' : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#07101A' }} />}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: active ? 700 : 600, color: active ? '#0F172A' : '#334155', lineHeight: 1.3 }}>{label.replace('Contrat de ', '').replace("Contrat d'", '')}</div>
                        <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 3, lineHeight: 1.4 }}>{meta.desc}</div>
                      </div>
                      <input type="radio" value={val} checked={active} onChange={() => set('typeContrat')(val)} style={{ display: 'none' }} />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Conditions ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={LABEL_STYLE}>Montant (USD)</label>
              <input type="number" min="0" placeholder="Ex : 5000" value={form.montant} onChange={e => set('montant')(e.target.value)} style={INPUT_STYLE} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL_STYLE}>Date début <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="date" value={form.dateDebut} onChange={e => set('dateDebut')(e.target.value)} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Date fin <span style={{ color: '#EF4444' }}>*</span></label>
                <input type="date" value={form.dateFin} onChange={e => set('dateFin')(e.target.value)} style={INPUT_STYLE} />
              </div>
            </div>
            <div>
              <label style={{ ...LABEL_STYLE, marginBottom: 10 }}>Clauses spéciales</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Checkbox label="Clause de non-concurrence" checked={form.nonConcurrence} onChange={set('nonConcurrence')} />
                <Checkbox label="Clause de confidentialité" checked={form.confidentialite} onChange={set('confidentialite')} />
                <Checkbox label="Droit à l'image" checked={form.droitImage} onChange={set('droitImage')} />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Prestations ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <div style={{ fontSize: 13, color: '#64748B' }}>
                Sélectionnez les prestations NKC incluses dans ce contrat :
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({
                  ...f,
                  prestations: f.prestations.length === SERVICES.length ? [] : [...SERVICES],
                }))}
                style={{ fontSize: 12, fontWeight: 600, color: '#3A6B84', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <MI name={form.prestations.length === SERVICES.length ? 'deselect' : 'select_all'} size={14} style={{ color: '#3A6B84' }} />
                {form.prestations.length === SERVICES.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SERVICES.map(s => (
                <Checkbox key={s} label={s} checked={form.prestations.includes(s)} onChange={() => togglePrestation(s)} />
              ))}
            </div>
            {form.prestations.length === 0 && (
              <div style={{ fontSize: 12, color: '#94A3B8', padding: '4px 0' }}>
                Aucune prestation sélectionnée — l'article 3 sera défini selon accord particulier.
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Aperçu ── */}
        {step === 3 && (
          <div>
            {/* Document preview card */}
            <div style={{ background: '#fff', border: '2px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              {/* Doc header bar */}
              <div style={{ background: '#07101A', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: '#FCD116', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MI name="description" size={18} style={{ color: '#07101A' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.2px' }}>
                    {TYPE_LABELS[form.typeContrat]}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Ndembo Kin Connect · Kinshasa, RDC</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, background: 'rgba(252,209,22,0.12)', color: '#FCD116', padding: '4px 11px', borderRadius: 20, border: '1px solid rgba(252,209,22,0.2)' }}>
                  EN PRÉPARATION
                </div>
              </div>
              {/* Parties */}
              <div style={{ padding: '14px 20px', background: '#FAFBFC', borderBottom: '1px solid #E8ECF1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Prestataire</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Ndembo Kin Connect</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Agence de management sportif</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Client</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{selectedClient?.nom || '—'}</div>
                  {selectedAthlete && <div style={{ fontSize: 11, color: '#64748B' }}>Athlète : {selectedAthlete.prenom} {selectedAthlete.nom}</div>}
                </div>
              </div>
              {/* Dates */}
              {(form.dateDebut || form.dateFin) && (
                <div style={{ padding: '10px 20px', background: '#fff', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MI name="date_range" size={15} style={{ color: '#3A6B84', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                    {form.dateDebut && new Date(form.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {form.dateDebut && form.dateFin && ' → '}
                    {form.dateFin && new Date(form.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                  {form.montant && (
                    <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                      {Number(form.montant).toLocaleString('fr-FR')} USD
                    </span>
                  )}
                </div>
              )}
              {/* Article count */}
              <div style={{ padding: '10px 20px', background: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MI name="gavel" size={15} style={{ color: '#94A3B8' }} />
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  {12 + (form.nonConcurrence ? 1 : 0) + (form.confidentialite ? 1 : 0) + (form.droitImage ? 1 : 0)} articles · droit congolais (RDC) · prêt pour signature électronique
                </span>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Récapitulatif</div>
              {[
                { icon: 'apartment',  label: 'Client',          value: selectedClient?.nom || '—' },
                { icon: 'sports',     label: 'Athlète',         value: selectedAthlete ? `${selectedAthlete.prenom} ${selectedAthlete.nom}` : 'Aucun' },
                { icon: 'description', label: 'Type',           value: TYPE_LABELS[form.typeContrat] || form.typeContrat },
                { icon: 'payments',   label: 'Montant',         value: form.montant ? `${Number(form.montant).toLocaleString('fr-FR')} USD` : '—' },
                { icon: 'date_range', label: 'Période',         value: form.dateDebut && form.dateFin ? `${form.dateDebut} → ${form.dateFin}` : '—' },
                { icon: 'checklist',  label: 'Prestations',     value: form.prestations.length > 0 ? `${form.prestations.length} service(s)` : 'Aucune' },
                { icon: 'gavel',      label: 'Clauses spéciales', value: [form.nonConcurrence && 'Non-concurrence', form.confidentialite && 'Confidentialité', form.droitImage && 'Droit à l\'image'].filter(Boolean).join(', ') || 'Aucune' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 11, marginBottom: 11, borderBottom: '1px solid #F1F5F9' }}>
                  <MI name={row.icon} size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', textAlign: 'right', maxWidth: '60%' }}>{row.value}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: '#FEF9EE', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <MI name="info" size={16} style={{ color: '#B45309', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12.5, color: '#78350F', lineHeight: 1.5 }}>
                Le contrat généré comprendra <strong>{12 + (form.nonConcurrence ? 1 : 0) + (form.confidentialite ? 1 : 0) + (form.droitImage ? 1 : 0)} articles</strong> conformes au droit congolais (RDC). Il sera immédiatement disponible pour signature électronique.
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ fontSize: 13, color: '#EF4444', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 13px', marginTop: 16 }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid #F1F5F9' }}>
          <button
            onClick={step === 0 ? onClose : prev}
            style={{ padding: '10px 18px', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}
          >
            <MI name={step === 0 ? 'close' : 'arrow_back'} size={15} style={{ color: '#64748B' }} />
            {step === 0 ? 'Annuler' : 'Précédent'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              style={{ padding: '10px 22px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              Suivant
              <MI name="arrow_forward" size={15} style={{ color: '#FCD116' }} />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={submitting}
              style={{ padding: '11px 26px', background: submitting ? '#94A3B8' : '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 9, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <MI name="auto_awesome" size={16} style={{ color: '#FCD116' }} />
              {submitting ? 'Génération…' : 'Générer le contrat'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ContratsPage() {
  const [rows, setRows] = useState<Contrat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inputFocus, setInputFocus] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');
  const [newContratId, setNewContratId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await contratsApi.list({ limit: 200 });
      setRows(data.data || data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = rows.find(r => r.id === selectedId) || rows[0] || null;

  const filtered = rows.filter(c => {
    const q = search.toLowerCase();
    const athleteName = c.athlete ? `${c.athlete.prenom} ${c.athlete.nom}` : '';
    const matchQ = !q || c.numero.toLowerCase().includes(q) || athleteName.toLowerCase().includes(q) || c.client.nom.toLowerCase().includes(q);
    return matchQ && (!filterStatut || c.statut === filterStatut);
  });

  const enCours = rows.filter(c => c.statut === 'EN_COURS').length;
  const aSigner = rows.filter(c => c.statut === 'EN_PREPARATION').length;
  const valeurActive = rows
    .filter(c => c.statut === 'EN_COURS' || c.statut === 'SIGNE')
    .reduce((s, c) => s + (c.montant ?? 0), 0);

  const SELECT_STYLE: React.CSSProperties = {
    padding: '9px 32px 9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10,
    fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none',
    background: '#F8FAFC', appearance: 'none', cursor: 'pointer',
  };

  function stepDot(done: boolean) {
    const c = done ? '#059669' : '#E2E8F0';
    return { position: 'absolute' as const, left: -21, top: 3, width: 10, height: 10, borderRadius: '50%', background: c, border: '2px solid #fff', boxShadow: `0 0 0 2px ${c}` };
  }

  function buildSteps(c: Contrat | null) {
    if (!c) return [];
    const signed = c.statut === 'SIGNE' || c.statut === 'EN_COURS' || c.statut === 'EXPIRE';
    return [
      { title: 'Contrat généré', sub: 'Document créé', done: true },
      { title: 'Envoyé au client', sub: signed || c.statut !== 'EN_PREPARATION' ? 'Notifié par e-mail' : 'En attente', done: signed },
      { title: 'Signé électroniquement', sub: c.dateSignature ? new Date(c.dateSignature).toLocaleDateString('fr-FR') : 'En attente de signature', done: signed },
      { title: 'Contrat actif', sub: c.statut === 'EN_COURS' ? "En cours d'exécution" : c.statut === 'EXPIRE' ? 'Échu' : '—', done: c.statut === 'EN_COURS' || c.statut === 'EXPIRE' },
    ];
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* Success banner */}
      {successBanner && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: '#07101A', color: '#FCD116', fontSize: 13.5, fontWeight: 700, padding: '12px 24px', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'none' }}>
          <MI name="check_circle" size={18} style={{ color: '#34D399' }} />
          {successBanner}
        </div>
      )}

      {/* Topbar */}
      <div className="flex items-center gap-4 px-7 shrink-0"
        style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', height: 60 }}>
        <div style={{ background: '#07101A', borderRadius: 8, padding: '4px 5px', lineHeight: 0 }}>
          <img src="/logo.png" alt="NKC" style={{ height: 22, width: 'auto', display: 'block' }} />
        </div>
        <div className="flex items-center gap-2.5 flex-1">
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Contrats</span>
          <span style={{ fontSize: 12, fontWeight: 700, background: '#07101A', color: '#FCD116', padding: '2px 9px', borderRadius: 20 }}>
            {rows.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ position: 'relative' }}>
            <MI name="search" size={17} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text" placeholder="Rechercher un contrat…" value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setInputFocus(true)} onBlur={() => setInputFocus(false)}
              style={{
                padding: '9px 14px 9px 38px', border: `1.5px solid ${inputFocus ? '#3A6B84' : '#E2E8F0'}`,
                borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A',
                outline: 'none', background: inputFocus ? '#fff' : '#F8FAFC', width: 240,
                boxShadow: inputFocus ? '0 0 0 3px rgba(58,107,132,0.08)' : 'none',
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={SELECT_STYLE}>
              <option value="">Tous les statuts</option>
              <option value="EN_PREPARATION">En préparation</option>
              <option value="SIGNE">Signé</option>
              <option value="EN_COURS">En cours</option>
              <option value="EXPIRE">Expiré</option>
            </select>
            <MI name="expand_more" size={15} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          </div>
          <button
            onClick={() => setShowGenModal(true)}
            style={{ padding: '9px 18px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#132730')}
            onMouseLeave={e => (e.currentTarget.style.background = '#07101A')}
          >
            <MI name="add" size={16} style={{ color: '#FCD116' }} />
            Générer un contrat
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3 px-7 pt-5">
        {[
          { icon: 'description', iconBg: '#EFF6FF', iconBd: '#BFDBFE', iconColor: '#3A6B84', value: rows.length,  label: 'Total contrats' },
          { icon: 'autorenew',   iconBg: '#EFF6FF', iconBd: '#BFDBFE', iconColor: '#2563EB', value: enCours,      label: 'En cours' },
          { icon: 'edit_note',   iconBg: '#FEF9EE', iconBd: '#FDE68A', iconColor: '#C9960C', value: aSigner,      label: 'À signer' },
          { icon: 'payments',    iconBg: '#F0FDF4', iconBd: '#BBF7D0', iconColor: '#059669', value: valeurActive > 0 ? `$${(valeurActive / 1000).toFixed(0)}k` : '—', label: 'Valeur active' },
        ].map(k => (
          <div key={k.label} className="flex items-center gap-3.5 rounded-2xl p-4"
            style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 44, height: 44, background: k.iconBg, border: `1px solid ${k.iconBd}` }}>
              <MI name={k.icon} size={20} style={{ color: k.iconColor }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginTop: 2 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="px-7 py-4 flex-1">
        <div className="overflow-hidden rounded-2xl" style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: COL, gap: 8, padding: '11px 22px', background: '#F8FAFC', borderBottom: '1px solid #E8ECF1' }}>
            {['Référence', 'Athlète / Client', 'Type', 'Période', 'Montant', 'Statut'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
            ))}
          </div>

          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse mx-4 my-2 rounded-lg" style={{ background: '#F1F5F9' }} />
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <MI name="description" size={48} style={{ color: '#E2E8F0', marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#CBD5E1' }}>Aucun contrat trouvé</div>
            </div>
          ) : filtered.map(c => {
            const sm = STATUT_META[c.statut] || STATUT_META['EN_PREPARATION'];
            const athleteName = c.athlete ? `${c.athlete.prenom} ${c.athlete.nom}` : '—';
            const ac = avatarColor(c.id);
            return (
              <div key={c.id}
                onClick={() => { setSelectedId(c.id); setDrawerOpen(true); }}
                className="cursor-pointer transition-colors"
                style={{ display: 'grid', gridTemplateColumns: COL, gap: 8, padding: '13px 22px', borderBottom: '1px solid #F8FAFC', alignItems: 'center', background: newContratId === c.id ? '#FFFBEB' : undefined, outline: newContratId === c.id ? '2px solid #FCD116' : undefined, outlineOffset: newContratId === c.id ? '-2px' : undefined }}
                onMouseEnter={e => { if (newContratId !== c.id) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={e => { if (newContratId !== c.id) e.currentTarget.style.background = ''; }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace' }}>{c.numero}</div>
                <div className="flex items-center gap-2.5">
                  <div className="shrink-0 flex items-center justify-center rounded-full"
                    style={{ width: 34, height: 34, background: ac, fontSize: 12, fontWeight: 800, color: '#FCD116' }}>
                    {c.athlete ? initials(`${c.athlete.prenom} ${c.athlete.nom}`) : '??'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{athleteName}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{c.client.nom}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#334155' }}>{TYPE_LABELS[c.typeContrat] || c.typeContrat}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{periode(c)}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', fontFamily: 'monospace' }}>
                  {c.montant ? formatMontant(c.montant) : '—'}
                </div>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, background: sm.bg, color: sm.color, padding: '3px 10px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' }}>
                    {sm.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" style={{ background: 'rgba(7,16,26,0.4)', backdropFilter: 'blur(2px)' }} onClick={() => setDrawerOpen(false)} />
          <div style={{ width: 440, background: '#fff', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{ background: '#07101A', padding: '24px 24px 22px', position: 'relative' }}>
              <button onClick={() => setDrawerOpen(false)}
                style={{ position: 'absolute', right: 16, top: 16, width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MI name="close" size={16} style={{ color: '#fff' }} />
              </button>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', marginBottom: 6 }}>{selected.numero}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#fff' }}>{TYPE_LABELS[selected.typeContrat] || selected.typeContrat}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                {selected.athlete ? `${selected.athlete.prenom} ${selected.athlete.nom}` : '—'} · {selected.client.nom}
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.12)', color: '#fff', padding: '4px 11px', borderRadius: 20 }}>
                  {STATUT_META[selected.statut]?.label}
                </span>
                {selected.montant && (
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#FCD116', fontFamily: 'monospace', marginLeft: 'auto' }}>
                    {formatMontant(selected.montant)}
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
              {[
                selected.athlete ? { icon: 'sports',     label: 'Athlète', value: `${selected.athlete.prenom} ${selected.athlete.nom}` } : null,
                { icon: 'apartment', label: 'Client',    value: selected.client.nom },
                { icon: 'category',  label: 'Type',      value: TYPE_LABELS[selected.typeContrat] || selected.typeContrat },
                { icon: 'date_range', label: 'Période', value: periode(selected) },
              ].filter(Boolean).map((info: any) => (
                <div key={info.label} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid #F1F5F9' }}>
                  <MI name={info.icon} size={18} style={{ color: '#94A3B8', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{info.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{info.value}</span>
                  </div>
                </div>
              ))}

              {/* Signature steps */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Suivi de signature</div>
                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  <div style={{ position: 'absolute', left: 7, top: 4, bottom: 8, width: 2, background: '#E8ECF1' }} />
                  {buildSteps(selected).map((st, i) => (
                    <div key={i} style={{ position: 'relative', marginBottom: 18 }}>
                      <div style={stepDot(st.done)} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: st.done ? '#334155' : '#94A3B8' }}>{st.title}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{st.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E8ECF1', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => contratsApi.sign(selected.id, 'CLIENT').then(() => load()).catch(() => null)}
                style={{ width: '100%', padding: 12, background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <MI name="draw" size={16} style={{ color: '#FCD116' }} />
                Envoyer pour signature
              </button>
              <button
                onClick={() => openPdf(`/contrats/${selected.id}/pdf`)}
                style={{ width: '100%', padding: 11, background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <MI name="picture_as_pdf" size={15} />
                Télécharger le PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate modal */}
      {showGenModal && (
        <GenerateModal
          onClose={() => setShowGenModal(false)}
          onDone={(numero) => {
            setShowGenModal(false);
            if (numero) setSuccessBanner(`Contrat ${numero} généré avec succès`);
            load();
            // After a brief delay highlight the new contract row
            if (numero) {
              setTimeout(() => {
                setRows(prev => {
                  const found = prev.find(r => r.numero === numero);
                  if (found) { setNewContratId(found.id); setSelectedId(found.id); }
                  return prev;
                });
              }, 600);
            }
            setTimeout(() => { setSuccessBanner(''); setNewContratId(null); }, 4000);
          }}
        />
      )}
    </div>
  );
}
