'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clientsApi, prestationsApi, devisApi } from '@/lib/api';

const DRAFT_KEY = 'nkc:draft:devis';

function MI({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
      {name}
    </span>
  );
}

interface PrestationOpt { id: string; nom: string; prix: number }
interface ClientOpt { id: string; nom: string; type: string; ville: string }

const STATUT_OPTS = [
  { val: 'BROUILLON',  label: 'Brouillon',  desc: 'En cours de rédaction',  dot: '#94A3B8' },
  { val: 'ENVOYE',     label: 'Envoyé',     desc: 'Transmis au client',      dot: '#3A6B84' },
  { val: 'VALIDE',     label: 'Validé',     desc: 'Accepté par le client',   dot: '#059669' },
  { val: 'REFUSE',     label: 'Refusé',     desc: 'Non retenu',              dot: '#BE123C' },
];

interface Ligne { id: number; prestationId: string; quantite: number; prixUnit: number; }

let nextId = 1;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function futureStr(days: number) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function newRef() {
  const n = String(Math.floor(Math.random() * 900) + 100);
  return `DEV-${new Date().getFullYear()}-${n.padStart(3, '0')}`;
}

function fmtMontant(n: number) {
  return '$' + n.toLocaleString('fr-FR');
}

function fieldStyle(): React.CSSProperties {
  return { width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#0F172A', outline: 'none', background: '#FAFBFC' };
}
function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)';
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFBFC'; e.currentTarget.style.boxShadow = 'none';
}

export default function DevisNouveauPage() {
  const router = useRouter();
  const params = useSearchParams();
  const clientId = params.get('clientId') ?? '';

  const [devisRef]          = useState(newRef);
  const [dateEmission, setDateEmission] = useState(todayStr());
  const [dateValidite, setDateValidite] = useState(futureStr(30));
  const [selectedClient, setSelectedClient] = useState(clientId);
  const [lignes, setLignes] = useState<Ligne[]>([{ id: nextId++, prestationId: '', quantite: 1, prixUnit: 0 }]);
  const [notes, setNotes]   = useState('');
  const [remise, setRemise] = useState(0);
  const [statut, setStatut] = useState('BROUILLON');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<ClientOpt[]>([]);
  const [prestations, setPrestations] = useState<PrestationOpt[]>([]);
  const draftTimer = useRef<ReturnType<typeof setTimeout>>();

  // Charge clients + prestations réels depuis l'API
  useEffect(() => {
    clientsApi.list()
      .then(({ data }) => setClients((data?.data || []).map((c: any) => ({ id: c.id, nom: c.nom, type: c.type, ville: c.ville }))))
      .catch(() => {});
    prestationsApi.list(true)
      .then(({ data }) => setPrestations((data || []).map((p: any) => ({ id: p.id, nom: p.nom, prix: p.prixBase ?? 0 }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        if (d.lignes) setLignes(d.lignes);
        if (d.notes) setNotes(d.notes);
        if (d.remise !== undefined) setRemise(d.remise);
      } catch {}
    }
  }, []);

  function scheduleDraft(update: object) {
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(update)); } catch {}
    }, 800);
  }

  function addLigne() {
    const nl: Ligne = { id: nextId++, prestationId: '', quantite: 1, prixUnit: 0 };
    setLignes(prev => { const next = [...prev, nl]; scheduleDraft({ lignes: next, notes, remise }); return next; });
  }

  function updateLigne(id: number, patch: Partial<Ligne>) {
    setLignes(prev => {
      const next = prev.map(l => l.id === id ? { ...l, ...patch } : l);
      if (patch.prestationId !== undefined) {
        const p = prestations.find(p => p.id === patch.prestationId);
        if (p) return prev.map(l => l.id === id ? { ...l, prestationId: patch.prestationId!, prixUnit: p.prix } : l);
      }
      scheduleDraft({ lignes: next, notes, remise });
      return next;
    });
  }

  function removeLigne(id: number) {
    setLignes(prev => { const next = prev.filter(l => l.id !== id); scheduleDraft({ lignes: next, notes, remise }); return next; });
  }

  const ht = lignes.reduce((s, l) => s + l.quantite * l.prixUnit, 0);
  const tvaAmt = ht * 0.16;
  const remiseAmt = ht * remise / 100;
  const ttc = ht + tvaAmt - remiseAmt;

  async function handleSave() {
    setError('');
    if (!selectedClient) { setError('Veuillez sélectionner un client.'); return; }
    const validLignes = lignes.filter(l => l.prestationId);
    if (validLignes.length === 0) { setError('Ajoutez au moins une prestation.'); return; }
    setSaving(true);
    try {
      const diffJours = Math.round((new Date(dateValidite).getTime() - new Date(dateEmission).getTime()) / 86_400_000);
      const validiteJours = diffJours > 0 ? diffJours : 30;
      await devisApi.create({
        clientId: selectedClient,
        lignes: validLignes.map(l => ({ prestationId: l.prestationId, quantite: l.quantite, prixUnit: l.prixUnit })),
        tva: 16,
        notes: notes || undefined,
        validiteJours,
      });
      localStorage.removeItem(DRAFT_KEY);
      router.push('/devis');
    } catch (e: any) {
      setError(e?.response?.data?.message || "Erreur lors de l'enregistrement du devis.");
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
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', padding: '0 32px', display: 'flex', alignItems: 'center', height: 60, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{ fontSize: 13, color: '#94A3B8', cursor: 'pointer' }} onClick={() => router.push('/devis')}>Devis</span>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{devisRef}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{ padding: '8px 16px', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#E2E8F0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F1F5F9')}
          >
            <MI name="picture_as_pdf" size={15} color="#64748B" />Aperçu PDF
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '8px 20px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, opacity: saving ? 0.6 : 1 }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#132730'; }}
            onMouseLeave={e => (e.currentTarget.style.background = '#07101A')}
          >
            <MI name="send" size={15} color="#FCD116" />
            Enregistrer le devis
          </button>
        </div>
      </div>

      {/* Bannière d'erreur */}
      {error && (
        <div style={{ maxWidth: 1200, margin: '16px auto 0', width: '100%', padding: '0 32px' }}>
          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', borderRadius: 10, padding: '11px 16px', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MI name="error_outline" size={16} color="#BE123C" />
            {error}
          </div>
        </div>
      )}

      {/* 2-COLUMN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, padding: '28px 32px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Infos générales */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '24px 26px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #F1F5F9' }}>
              {sectionIcon('info', '#2563EB', '#EFF6FF', '#BFDBFE')}
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Informations générales</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Référence devis</label>
                <input readOnly value={devisRef} style={{ ...fieldStyle(), color: '#94A3B8', cursor: 'not-allowed', background: '#F8FAFC' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Date d'émission</label>
                <input type="date" value={dateEmission} onChange={e => setDateEmission(e.target.value)} style={fieldStyle()} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Date de validité</label>
                <input type="date" value={dateValidite} onChange={e => setDateValidite(e.target.value)} style={fieldStyle()} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Client <span style={{ color: '#EF4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={{ ...fieldStyle(), paddingRight: 36, appearance: 'none', cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
                    <option value="">-- Sélectionner un client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}{c.type ? ` — ${c.type}` : ''}{c.ville ? ` · ${c.ville}` : ''}</option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex' }}><MI name="expand_more" size={16} color="#94A3B8" /></span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Commercial assigné</label>
                <div style={{ position: 'relative' }}>
                  <select style={{ ...fieldStyle(), paddingRight: 36, appearance: 'none', cursor: 'pointer' }} onFocus={onFocus} onBlur={onBlur}>
                    <option>Amadou S. (Admin)</option>
                    <option>Jean-Pierre K.</option>
                    <option>Marie-Claire N.</option>
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex' }}><MI name="expand_more" size={16} color="#94A3B8" /></span>
                </div>
              </div>
            </div>
          </div>

          {/* Lignes de prestations */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #E8ECF1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {sectionIcon('list_alt', '#B45309', '#FEF9EE', '#FDE68A')}
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Lignes de prestations</div>
              </div>
              <button onClick={addLigne} style={{ padding: '7px 14px', background: '#07101A', color: '#FCD116', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#132730')} onMouseLeave={e => (e.currentTarget.style.background = '#07101A')}>
                <MI name="add" size={15} color="#FCD116" />Ajouter une ligne
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr 1.2fr 40px', gap: 8, padding: '10px 20px', background: '#F8FAFC', borderBottom: '1px solid #E8ECF1' }}>
              {['Prestation', 'Qté', 'Prix unitaire', 'Total HT', ''].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
              ))}
            </div>
            {lignes.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                <MI name="receipt_long" size={32} color="#CBD5E1" />
                <div style={{ marginTop: 8 }}>Aucune prestation ajoutée — cliquez sur « Ajouter une ligne »</div>
              </div>
            ) : (
              lignes.map(l => {
                const total = l.quantite * l.prixUnit;
                return (
                  <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.2fr 1.2fr 40px', gap: 8, padding: '10px 20px', borderBottom: '1px solid #F8FAFC', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <select value={l.prestationId} onChange={e => updateLigne(l.id, { prestationId: e.target.value })}
                        style={{ width: '100%', padding: '9px 30px 9px 10px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#FAFBFC', cursor: 'pointer', appearance: 'none' }}
                        onFocus={onFocus} onBlur={onBlur}>
                        <option value="">-- Choisir --</option>
                        {prestations.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                      </select>
                      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex' }}><MI name="expand_more" size={14} color="#94A3B8" /></span>
                    </div>
                    <input type="number" value={l.quantite} min={1} onChange={e => updateLigne(l.id, { quantite: Number(e.target.value) })}
                      style={{ width: '100%', padding: '9px 10px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#FAFBFC', textAlign: 'center' }}
                      onFocus={onFocus} onBlur={onBlur} />
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>$</span>
                      <input type="number" value={l.prixUnit} min={0} onChange={e => updateLigne(l.id, { prixUnit: Number(e.target.value) })}
                        style={{ width: '100%', padding: '9px 10px 9px 22px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#FAFBFC' }}
                        onFocus={onFocus} onBlur={onBlur} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', padding: '0 4px' }}>{fmtMontant(total)}</div>
                    <button onClick={() => removeLigne(l.id)}
                      style={{ width: 28, height: 28, borderRadius: 7, background: '#FFF1F2', border: '1px solid #FECDD3', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FFE4E6')} onMouseLeave={e => (e.currentTarget.style.background = '#FFF1F2')}>
                      <MI name="delete_outline" size={14} color="#BE123C" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Notes */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Notes et conditions</label>
            <textarea
              placeholder="Conditions de paiement, délais, mentions légales particulières…"
              value={notes} onChange={e => { setNotes(e.target.value); scheduleDraft({ lignes, notes: e.target.value, remise }); }}
              style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#FAFBFC', height: 80, resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box' }}
              onFocus={onFocus} onBlur={onBlur}
            />
          </div>
        </div>

        {/* RIGHT — Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Récapitulatif */}
          <div style={{ background: '#07101A', borderRadius: 16, padding: '22px 20px', position: 'sticky', top: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 18 }}>Récapitulatif</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Sous-total HT</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{fmtMontant(ht)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>TVA (16%)</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{fmtMontant(tvaAmt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Remise</span>
                <div style={{ position: 'relative', width: 90 }}>
                  <input type="number" value={remise} min={0} max={100} onChange={e => { const v = Number(e.target.value); setRemise(v); scheduleDraft({ lignes, notes, remise: v }); }}
                    style={{ width: '100%', padding: '5px 24px 5px 8px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', color: '#fff', background: 'rgba(255,255,255,0.07)', outline: 'none', textAlign: 'right' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(252,209,22,0.4)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>%</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Total TTC</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#FCD116', letterSpacing: '-0.5px' }}>{fmtMontant(ttc)}</span>
            </div>
            <button onClick={handleSave} disabled={saving}
              style={{ width: '100%', padding: 13, background: '#FCD116', color: '#07101A', fontSize: 14, fontWeight: 800, border: 'none', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#DAA520')} onMouseLeave={e => (e.currentTarget.style.background = '#FCD116')}>
              <MI name="send" size={18} color="#07101A" />Enregistrer le devis
            </button>
            <button style={{ width: '100%', padding: 11, background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
              <MI name="picture_as_pdf" size={16} color="currentColor" />Aperçu PDF
            </button>
          </div>

          {/* Statut */}
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>Statut du devis</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {STATUT_OPTS.map(opt => (
                <div key={opt.val} onClick={() => setStatut(opt.val)}
                  style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${statut === opt.val ? opt.dot : '#F1F5F9'}`, background: statut === opt.val ? '#FAFBFC' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.15s' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: opt.dot, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
